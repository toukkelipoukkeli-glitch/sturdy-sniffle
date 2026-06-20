import {
  hashProviderInput,
  type ProviderRunMetadata,
  type ProviderRunRequest,
  type ProviderRunResult,
} from "./ai"
import { normalizeIsoTimestamp } from "../shared/deterministic"

export const PROVIDER_RUN_AUDIT_VERSION = "provider-run-audit.v1"

export interface ProviderRunAuditInput {
  request: ProviderRunRequest
  result: ProviderRunResult
  startedAt: string
  completedAt: string
}

export interface ProviderRunAuditTrace {
  rfqId?: string
  quoteId?: string
  offerId?: string
}

export interface ProviderRunAudit {
  auditVersion: typeof PROVIDER_RUN_AUDIT_VERSION
  runKey: string
  provider: ProviderRunResult["provider"]
  adapterVersion: string
  purpose: ProviderRunResult["purpose"]
  status: ProviderRunResult["status"]
  inputHash: string
  startedAt: string
  completedAt: string
  durationMs: number
  promptExcerpt: string
  warnings: string[]
  metadata: ProviderRunMetadata
  trace?: ProviderRunAuditTrace
  errorMessage?: string
  outputSummary?: string
}

export function buildProviderRunAudit(input: ProviderRunAuditInput): ProviderRunAudit {
  const startedAt = normalizeIsoTimestamp(input.startedAt, "startedAt")
  const completedAt = normalizeIsoTimestamp(input.completedAt, "completedAt")
  const durationMs = Date.parse(completedAt) - Date.parse(startedAt)
  if (durationMs < 0) {
    throw new Error("completedAt must be on or after startedAt")
  }

  const expectedHash = hashProviderInput(input.request)
  if (input.result.inputHash !== expectedHash) {
    throw new Error("provider result inputHash must match request input hash")
  }

  const audit: ProviderRunAudit = {
    auditVersion: PROVIDER_RUN_AUDIT_VERSION,
    runKey: `${input.result.purpose}:${input.result.provider}:${input.result.inputHash}:${startedAt}`,
    provider: input.result.provider,
    adapterVersion: input.result.adapterVersion,
    purpose: input.result.purpose,
    status: input.result.status,
    inputHash: input.result.inputHash,
    startedAt,
    completedAt,
    durationMs,
    promptExcerpt: summarizeAndRedact(input.request.prompt),
    warnings: input.result.warnings.map(redactSensitiveText),
    metadata: { ...input.result.metadata },
    trace: normalizeTrace(input.request.trace),
    errorMessage: optionalRedacted(input.result.errorMessage),
    outputSummary: optionalRedacted(input.result.outputSummary ?? input.result.outputText),
  }

  if (!audit.trace) {
    delete audit.trace
  }
  if (!audit.errorMessage) {
    delete audit.errorMessage
  }
  if (!audit.outputSummary) {
    delete audit.outputSummary
  }

  return audit
}

function normalizeTrace(trace: ProviderRunRequest["trace"]): ProviderRunAuditTrace | undefined {
  if (!trace) {
    return undefined
  }
  const normalized: ProviderRunAuditTrace = {}
  const rfqId = optionalTrim(trace.rfqId)
  const quoteId = optionalTrim(trace.quoteId)
  const offerId = optionalTrim(trace.offerId)
  if (rfqId) {
    normalized.rfqId = rfqId
  }
  if (quoteId) {
    normalized.quoteId = quoteId
  }
  if (offerId) {
    normalized.offerId = offerId
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined
}

function summarizeAndRedact(value: string): string {
  return redactSensitiveText(summarizeText(value, 180))
}

function optionalRedacted(value: string | undefined): string | undefined {
  const trimmed = optionalTrim(value)
  return trimmed ? summarizeAndRedact(trimmed) : undefined
}

function summarizeText(value: string, maxLength: number): string {
  const compacted = value.replace(/\s+/g, " ").trim()
  return compacted.length > maxLength ? `${compacted.slice(0, maxLength - 3).trimEnd()}...` : compacted
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:sk|AIza|xoxb|ghp)_[A-Za-z0-9_-]{8,}\b/g, "[redacted-token]")
    .replace(/\b(?:sk|AIza)[A-Za-z0-9_-]{12,}\b/g, "[redacted-token]")
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
