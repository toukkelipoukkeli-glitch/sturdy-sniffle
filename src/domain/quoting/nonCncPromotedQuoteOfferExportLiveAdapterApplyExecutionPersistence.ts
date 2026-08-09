import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_MODES,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_STATUSES,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecution"
import { NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-persistence.v1"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun["mode"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus
  applyPlanId: string
  applyPlanVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION
  applyPlanFingerprint: string
  targetRfqId?: string
  latestCommitPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  commandCount: number
  appliedCommandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  pendingActionCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord[]
  latestRun?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord
  applyPlanIds: string[]
  applyPlanFingerprints: string[]
  targetRfqIds: string[]
  latestCommitPlanIds: string[]
  latestCommitRecordIds: string[]
  latestCommittedExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus, number>>
  commandStatusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus, number>>
  warningCount: number
  pendingActionCount: number
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceAdapter {
  recordRun(
    run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordRun(run) {
      const record = buildExecutionRecord(run)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records,
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(
  run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord {
  const statusCounts = commandStatusCounts(run.commands.map((command) => command.status))
  return normalizeRecord({
    actor: run.actor,
    appliedCommandCount: statusCounts.applied ?? 0,
    applyPlanFingerprint: run.applyPlanFingerprint,
    applyPlanId: run.applyPlanId,
    applyPlanVersion: run.applyPlanVersion,
    blockedCommandCount: statusCounts.blocked ?? 0,
    commandCount: run.commandCount,
    executedAt: run.executedAt,
    executionFingerprint: run.executionFingerprint,
    executionVersion: run.executionVersion,
    failedCommandCount: statusCounts.failed ?? 0,
    latestCommitPlanId: run.latestCommitPlanId,
    latestCommitRecordId: run.latestCommitRecordId,
    latestCommittedExecutionFingerprint: run.latestCommittedExecutionFingerprint,
    latestSourceExecutionFingerprint: run.latestSourceExecutionFingerprint,
    mode: run.mode,
    pendingActionCount: run.nextActions.length,
    pendingCommandCount: statusCounts.pending ?? 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION,
    preparedCommandCount: statusCounts.prepared ?? 0,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
  })
}

function normalizeSnapshot(
  snapshot: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceInitialSnapshot | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.executionFingerprint)
    if (existing && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error("conflicting live-adapter apply execution records cannot share executionFingerprint")
    }
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.executionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    applyPlanFingerprints: uniqueSorted(records.map((record) => record.applyPlanFingerprint)),
    applyPlanIds: uniqueSorted(records.map((record) => record.applyPlanId)),
    commandStatusCounts: aggregateCommandStatusCounts(records),
    latestCommitPlanIds: uniqueSorted(records.flatMap((record) => record.latestCommitPlanId ? [record.latestCommitPlanId] : [])),
    latestCommitRecordIds: uniqueSorted(
      records.flatMap((record) => record.latestCommitRecordId ? [record.latestCommitRecordId] : []),
    ),
    latestCommittedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) =>
        record.latestCommittedExecutionFingerprint ? [record.latestCommittedExecutionFingerprint] : [],
      ),
    ),
    latestRun: records[0],
    latestSourceExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.latestSourceExecutionFingerprint ? [record.latestSourceExecutionFingerprint] : []),
    ),
    pendingActionCount: records.reduce((total, record) => total + record.pendingActionCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "appliedCommandCount"),
    applyPlanFingerprint: nonBlank(record.applyPlanFingerprint, "applyPlanFingerprint"),
    applyPlanId: nonBlank(record.applyPlanId, "applyPlanId"),
    applyPlanVersion: normalizePlanVersion(record.applyPlanVersion),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionVersion: normalizeExecutionVersion(record.executionVersion),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "failedCommandCount"),
    latestCommitPlanId: optionalTrim(record.latestCommitPlanId),
    latestCommitRecordId: optionalTrim(record.latestCommitRecordId),
    latestCommittedExecutionFingerprint: optionalTrim(record.latestCommittedExecutionFingerprint),
    latestSourceExecutionFingerprint: optionalTrim(record.latestSourceExecutionFingerprint),
    mode: normalizeMode(record.mode),
    pendingActionCount: nonNegativeInteger(record.pendingActionCount, "pendingActionCount"),
    pendingCommandCount: nonNegativeInteger(record.pendingCommandCount, "pendingCommandCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    preparedCommandCount: nonNegativeInteger(record.preparedCommandCount, "preparedCommandCount"),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  const countedCommands =
    normalized.appliedCommandCount +
    normalized.blockedCommandCount +
    normalized.failedCommandCount +
    normalized.pendingCommandCount +
    normalized.preparedCommandCount
  if (countedCommands !== normalized.commandCount) {
    throw new Error("commandCount must equal the sum of per-status live-adapter apply command counts")
  }
  validateAggregateStatus(normalized)
  validateEvidenceGating(normalized)

  return normalized
}

function validateAggregateStatus(record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord): void {
  if (record.commandCount === 0) {
    throw new Error("commandCount must be greater than zero for live-adapter apply execution records")
  }

  const mixedOutcomeCount = [
    record.appliedCommandCount,
    record.failedCommandCount,
    record.pendingCommandCount,
  ].filter((count) => count > 0).length

  if (record.status === "blocked" && record.blockedCommandCount !== record.commandCount) {
    throw new Error("blocked live-adapter apply execution records must have only blocked commands")
  }
  if (record.status === "prepared" && (record.mode !== "dry_run" || record.preparedCommandCount !== record.commandCount)) {
    throw new Error("prepared live-adapter apply execution records must be dry-run records with only prepared commands")
  }
  if (record.status === "pending" && (record.mode !== "commit" || record.pendingCommandCount !== record.commandCount)) {
    throw new Error("pending live-adapter apply execution records must be commit records with only pending commands")
  }
  if (record.status === "succeeded" && (record.mode !== "commit" || record.appliedCommandCount !== record.commandCount)) {
    throw new Error("succeeded live-adapter apply execution records must be commit records with only applied commands")
  }
  if (record.status === "failed" && (record.mode !== "commit" || record.failedCommandCount !== record.commandCount)) {
    throw new Error("failed live-adapter apply execution records must be commit records with only failed commands")
  }
  if (
    record.status === "partial" &&
    (record.mode !== "commit" ||
      record.blockedCommandCount > 0 ||
      record.preparedCommandCount > 0 ||
      mixedOutcomeCount < 2)
  ) {
    throw new Error(
      "partial live-adapter apply execution records must be commit records with a mixed applied failed or pending command state",
    )
  }
}

function validateEvidenceGating(record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord): void {
  const evidenceFields = [
    record.latestCommitPlanId,
    record.latestCommitRecordId,
    record.latestCommittedExecutionFingerprint,
    record.latestSourceExecutionFingerprint,
    record.targetRfqId,
  ]
  if (record.status === "blocked" && evidenceFields.some((value) => value !== undefined)) {
    throw new Error("blocked live-adapter apply execution records cannot include ready evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceSnapshot {
  return {
    applyPlanFingerprints: [...snapshot.applyPlanFingerprints],
    applyPlanIds: [...snapshot.applyPlanIds],
    commandStatusCounts: { ...snapshot.commandStatusCounts },
    latestCommitPlanIds: [...snapshot.latestCommitPlanIds],
    latestCommitRecordIds: [...snapshot.latestCommitRecordIds],
    latestCommittedExecutionFingerprints: [...snapshot.latestCommittedExecutionFingerprints],
    latestRun: snapshot.latestRun ? { ...snapshot.latestRun } : undefined,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    pendingActionCount: snapshot.pendingActionCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map((record) => ({ ...record })),
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.applyPlanId, right.applyPlanId) ||
    compareLex(left.applyPlanFingerprint, right.applyPlanFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode) ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.latestCommitPlanId ?? "", right.latestCommitPlanId ?? "") ||
    compareLex(left.latestCommitRecordId ?? "", right.latestCommitRecordId ?? "") ||
    compareLex(left.latestCommittedExecutionFingerprint ?? "", right.latestCommittedExecutionFingerprint ?? "") ||
    compareLex(left.latestSourceExecutionFingerprint ?? "", right.latestSourceExecutionFingerprint ?? "") ||
    compareLex(left.actor, right.actor) ||
    compareLex(left.executionVersion, right.executionVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.appliedCommandCount, right.appliedCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.failedCommandCount, right.failedCommandCount) ||
    compareNumber(left.pendingCommandCount, right.pendingCommandCount) ||
    compareNumber(left.preparedCommandCount, right.preparedCommandCount) ||
    compareNumber(left.pendingActionCount, right.pendingActionCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function commandStatusCounts(
  statuses: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus, number>>>(
    (counts, status) => {
      counts[status] = (counts[status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function aggregateCommandStatusCounts(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus, number>>>(
    (counts, record) => {
      addStatusCount(counts, "applied", record.appliedCommandCount)
      addStatusCount(counts, "blocked", record.blockedCommandCount)
      addStatusCount(counts, "failed", record.failedCommandCount)
      addStatusCount(counts, "pending", record.pendingCommandCount)
      addStatusCount(counts, "prepared", record.preparedCommandCount)
      return counts
    },
    {},
  )
}

function addStatusCount(
  counts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus, number>>,
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus,
  count: number,
): void {
  if (count > 0) {
    counts[status] = (counts[status] ?? 0) + count
  }
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus, number>>>(
    (counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function stableRecordKey(record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord): string {
  return JSON.stringify(Object.entries(record).sort(([left], [right]) => compareLex(left, right)))
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareLex)
}

function nonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer`)
  }
  return value
}

function compareNumber(left: number, right: number): number {
  return left - right
}

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC live-adapter apply execution persistence version")
  }
  return version
}

function normalizeExecutionVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord["executionVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_VERSION) {
    throw new Error("executionVersion is not a supported non-CNC live-adapter apply execution version")
  }
  return version
}

function normalizePlanVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord["applyPlanVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION) {
    throw new Error("applyPlanVersion is not a supported non-CNC live-adapter apply plan version")
  }
  return version
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun["mode"],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun["mode"] {
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_MODES.includes(mode)) {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus {
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_STATUSES.includes(status)) {
    throw new Error("status is not a supported non-CNC live-adapter apply execution status")
  }
  return status
}
