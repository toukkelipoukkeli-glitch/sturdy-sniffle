import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { AiProviderKey, ProviderPurpose, ProviderRunStatus } from "./ai"
import { PROVIDER_RUN_AUDIT_VERSION, type ProviderRunAudit } from "./providerRunAudit"

export interface ConvexProviderRunPayload {
  provider: AiProviderKey
  adapterVersion: string
  purpose: ProviderPurpose
  status: ProviderRunStatus
  inputHash: string
  startedAt: number
  completedAt: number
  outputSummary?: string
  errorMessage?: string
  rfqId?: string
  quoteId?: string
  offerId?: string
}

export interface BuildConvexProviderRunPayloadOptions {
  rfqId?: string
  quoteId?: string
  offerId?: string
}

export interface ConvexProviderRunReadRecord {
  _id?: unknown
  provider: unknown
  adapterVersion: unknown
  purpose: unknown
  status: unknown
  inputHash: unknown
  outputSummary?: unknown
  errorMessage?: unknown
  rfqId?: unknown
  quoteId?: unknown
  offerId?: unknown
  startedAt?: unknown
  completedAt?: unknown
  createdAt: unknown
}

export interface ProviderRunReadOptions {
  limit?: number
  status?: ProviderRunStatus
}

export interface ProviderRunReadAdapter {
  listRuns(options?: ProviderRunReadOptions): Promise<ProviderRunAudit[]>
}

export interface LocalProviderRunReaderOptions {
  audits?: ProviderRunAudit[]
}

export interface ConvexProviderRunReaderOptions {
  fallback?: ProviderRunReadAdapter
  onQueryError?: (error: unknown, args: Record<string, unknown>) => void
  queryRef: unknown
  runQuery: (queryRef: unknown, args: Record<string, unknown>) => Promise<unknown>
}

export function buildConvexProviderRunPayload(
  audit: ProviderRunAudit,
  options: BuildConvexProviderRunPayloadOptions = {},
): ConvexProviderRunPayload {
  const startedAt = isoTimestampMillis(audit.startedAt, "audit.startedAt")
  const completedAt = isoTimestampMillis(audit.completedAt, "audit.completedAt")
  if (completedAt < startedAt) {
    throw new Error("audit.completedAt must be on or after audit.startedAt")
  }

  const rfqId = optionalTrim(options.rfqId) ?? optionalTrim(audit.trace?.rfqId)
  const quoteId = optionalTrim(options.quoteId) ?? optionalTrim(audit.trace?.quoteId)
  const offerId = optionalTrim(options.offerId) ?? optionalTrim(audit.trace?.offerId)
  const outputSummary = optionalTrim(audit.outputSummary)
  const errorMessage = optionalTrim(audit.errorMessage)

  return {
    adapterVersion: nonBlank(audit.adapterVersion, "audit.adapterVersion"),
    completedAt,
    ...(errorMessage ? { errorMessage } : {}),
    inputHash: nonBlank(audit.inputHash, "audit.inputHash"),
    ...(offerId ? { offerId } : {}),
    ...(outputSummary ? { outputSummary } : {}),
    provider: normalizeProvider(audit.provider),
    purpose: normalizePurpose(audit.purpose),
    ...(quoteId ? { quoteId } : {}),
    ...(rfqId ? { rfqId } : {}),
    startedAt,
    status: normalizeStatus(audit.status),
  }
}

export function buildProviderRunAuditFromConvex(record: ConvexProviderRunReadRecord): ProviderRunAudit {
  const provider = normalizeProvider(nonBlankUnknown(record.provider, "record.provider"))
  const purpose = normalizePurpose(nonBlankUnknown(record.purpose, "record.purpose"))
  const status = normalizeTerminalStatus(nonBlankUnknown(record.status, "record.status"))
  const startedAt = millisToIso(record.startedAt ?? record.createdAt, "record.startedAt")
  const completedAt = millisToIso(record.completedAt ?? record.startedAt ?? record.createdAt, "record.completedAt")
  const durationMs = Date.parse(completedAt) - Date.parse(startedAt)
  if (durationMs < 0) {
    throw new Error("record.completedAt must be on or after record.startedAt")
  }

  const outputSummary = optionalUnknownText(record.outputSummary)
  const errorMessage = optionalUnknownText(record.errorMessage)
  const trace = normalizeTraceFromRecord(record)
  const inputHash = nonBlankUnknown(record.inputHash, "record.inputHash")

  return {
    adapterVersion: nonBlankUnknown(record.adapterVersion, "record.adapterVersion"),
    auditVersion: PROVIDER_RUN_AUDIT_VERSION,
    completedAt,
    durationMs,
    ...(errorMessage ? { errorMessage } : {}),
    inputHash,
    metadata: {},
    ...(outputSummary ? { outputSummary } : {}),
    promptExcerpt: "Persisted provider run read from Convex.",
    provider,
    purpose,
    runKey: `${purpose}:${provider}:${inputHash}:${startedAt}`,
    startedAt,
    status,
    ...(trace ? { trace } : {}),
    warnings: [],
  }
}

export function createLocalProviderRunReader({ audits = [] }: LocalProviderRunReaderOptions = {}): ProviderRunReadAdapter {
  const localAudits = audits.map(cloneAudit).sort(compareAudits)

  return {
    async listRuns(options = {}) {
      return filterAndLimitAudits(localAudits, options).map(cloneAudit)
    },
  }
}

export function createConvexProviderRunReader({
  fallback = createLocalProviderRunReader(),
  onQueryError,
  queryRef,
  runQuery,
}: ConvexProviderRunReaderOptions): ProviderRunReadAdapter {
  return {
    async listRuns(options = {}) {
      const args = compactListArgs(options)
      try {
        return normalizeQueryRecords(await runQuery(queryRef, args), options)
      } catch (error) {
        try {
          onQueryError?.(error, args)
        } catch {
          // Local fallback must remain available even if observers fail.
        }
        return await fallback.listRuns(options)
      }
    },
  }
}

function isoTimestampMillis(value: string, key: string): number {
  return Date.parse(normalizeIsoTimestamp(value, key))
}

function millisToIso(value: unknown, key: string): string {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${key} must be a non-negative integer timestamp`)
  }
  return new Date(Number(value)).toISOString()
}

function normalizeProvider(provider: unknown): AiProviderKey {
  if (
    provider !== "elevenlabs" &&
    provider !== "gemini" &&
    provider !== "local_codex" &&
    provider !== "mock" &&
    provider !== "tavily"
  ) {
    throw new Error("audit.provider is not a supported provider")
  }
  return provider
}

function normalizePurpose(purpose: unknown): ProviderPurpose {
  if (purpose !== "draft" && purpose !== "extract" && purpose !== "scout" && purpose !== "summarize" && purpose !== "voice") {
    throw new Error("audit.purpose is not a supported provider purpose")
  }
  return purpose
}

function normalizeStatus(status: unknown): ProviderRunStatus {
  if (status !== "failed" && status !== "skipped" && status !== "succeeded") {
    throw new Error("audit.status is not a supported provider run status")
  }
  return status
}

function normalizeTerminalStatus(status: string): ProviderRunStatus {
  if (status === "failed" || status === "skipped" || status === "succeeded") {
    return status
  }
  throw new Error("record.status is not a completed provider run status")
}

function compactListArgs(options: ProviderRunReadOptions): Record<string, unknown> {
  return {
    ...(options.limit === undefined ? {} : { limit: nonNegativeInteger(options.limit, "limit") }),
    ...(options.status === undefined ? {} : { status: normalizeStatus(options.status) }),
  }
}

function normalizeQueryRecords(records: unknown, options: ProviderRunReadOptions): ProviderRunAudit[] {
  if (!Array.isArray(records)) {
    throw new Error("provider run query must return an array")
  }
  return filterAndLimitAudits(records.map((record) => buildProviderRunAuditFromConvex(normalizeQueryRecord(record))), options)
}

function normalizeQueryRecord(record: unknown): ConvexProviderRunReadRecord {
  if (!record || typeof record !== "object") {
    throw new Error("provider run query record must be an object")
  }
  return record as unknown as ConvexProviderRunReadRecord
}

function nonBlankUnknown(value: unknown, key: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} must be a non-empty string`)
  }
  return value.trim()
}

function optionalUnknownText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value !== "string") {
    throw new Error("optional provider run text must be a string")
  }
  return value.trim() || undefined
}

function nonNegativeInteger(value: unknown, key: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${key} must be a non-negative integer`)
  }
  return Number(value)
}

function normalizeTraceFromRecord(record: ConvexProviderRunReadRecord): ProviderRunAudit["trace"] | undefined {
  const trace = {
    offerId: optionalUnknownText(record.offerId),
    quoteId: optionalUnknownText(record.quoteId),
    rfqId: optionalUnknownText(record.rfqId),
  }
  return trace.offerId || trace.quoteId || trace.rfqId ? trace : undefined
}

function filterAndLimitAudits(audits: ProviderRunAudit[], options: ProviderRunReadOptions): ProviderRunAudit[] {
  const limit = options.limit === undefined ? undefined : nonNegativeInteger(options.limit, "limit")
  const status = options.status === undefined ? undefined : normalizeStatus(options.status)
  const filtered = status ? audits.filter((audit) => audit.status === status) : audits
  return filtered.sort(compareAudits).slice(0, limit)
}

function compareAudits(left: ProviderRunAudit, right: ProviderRunAudit): number {
  return right.startedAt.localeCompare(left.startedAt) || left.runKey.localeCompare(right.runKey)
}

function cloneAudit(audit: ProviderRunAudit): ProviderRunAudit {
  return {
    adapterVersion: audit.adapterVersion,
    auditVersion: audit.auditVersion,
    completedAt: audit.completedAt,
    durationMs: audit.durationMs,
    ...(audit.errorMessage ? { errorMessage: audit.errorMessage } : {}),
    inputHash: audit.inputHash,
    metadata: { ...audit.metadata },
    ...(audit.outputSummary ? { outputSummary: audit.outputSummary } : {}),
    promptExcerpt: audit.promptExcerpt,
    provider: audit.provider,
    purpose: audit.purpose,
    runKey: audit.runKey,
    startedAt: audit.startedAt,
    status: audit.status,
    ...(audit.trace ? { trace: { ...audit.trace } } : {}),
    warnings: [...audit.warnings],
  }
}
