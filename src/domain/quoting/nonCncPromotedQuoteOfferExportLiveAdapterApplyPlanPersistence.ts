import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandStatus,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-plan-persistence.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanDisposition = "apply_ready" | "review_only"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_PERSISTENCE_VERSION
  applyPlanVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION
  applyPlanId: string
  applyPlanFingerprint: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanDisposition
  targetRfqId?: string
  latestCommitRecordId?: string
  latestCommitPlanId?: string
  latestSourceExecutionFingerprint?: string
  latestCommittedExecutionFingerprint?: string
  committedOutcomeCount: number
  historyRecordCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_PERSISTENCE_VERSION
  applyReadyPlanIds: string[]
  blockedPlanIds: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus, number>>
  committedOutcomeCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanInput {
  applyPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceAdapter {
  recordApplyPlan(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordApplyPlan(input) {
      const record = buildApplyPlanRecord(input)
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildApplyPlanRecord({
  applyPlan,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord {
  const commandCounts = countCommandStatuses(applyPlan.commands.map((command) => command.status))
  return normalizeRecord({
    applyPlanFingerprint: applyPlan.applyPlanFingerprint,
    applyPlanId: applyPlan.applyPlanId,
    applyPlanVersion: applyPlan.applyPlanVersion,
    blockedCommandCount: commandCounts.blocked ?? 0,
    blockerCount: applyPlan.blockerLabels.length,
    blockerLabels: [...applyPlan.blockerLabels],
    commandCount: applyPlan.commands.length,
    committedOutcomeCount: applyPlan.committedOutcomeCount,
    disposition: applyPlan.status === "ready" ? "apply_ready" : "review_only",
    historyRecordCount: applyPlan.historyRecordCount,
    latestCommitPlanId: applyPlan.latestCommitPlanId,
    latestCommitRecordId: applyPlan.latestCommitRecordId,
    latestCommittedExecutionFingerprint: applyPlan.latestCommittedExecutionFingerprint,
    latestSourceExecutionFingerprint: applyPlan.latestSourceExecutionFingerprint,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_PERSISTENCE_VERSION,
    plannedCommandCount: commandCounts.planned ?? 0,
    recordedAt,
    recordedBy,
    reviewWarnings: [...applyPlan.reviewWarnings],
    status: applyPlan.status,
    targetRfqId: applyPlan.targetRfqId,
    warningCount: applyPlan.reviewWarnings.length,
  })
}

function normalizeSnapshot(
  snapshot: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceInitialSnapshot | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceSnapshot {
  const recordsByPlanId = new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByPlanId.get(normalized.applyPlanId)
    if (existing && normalized.recordedAt === existing.recordedAt && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error("conflicting live-adapter apply plan records cannot share applyPlanId and recordedAt")
    }
    const recordOrder = existing ? sortNewestFirst(normalized, existing) : -1
    if (!existing || recordOrder < 0) {
      recordsByPlanId.set(normalized.applyPlanId, normalized)
    }
  }
  const records = [...recordsByPlanId.values()].sort(sortNewestFirst)

  return {
    applyReadyPlanIds: uniqueSorted(
      records.filter((record) => record.disposition === "apply_ready").map((record) => record.applyPlanId),
    ),
    blockedCommandCount: records.reduce((total, record) => total + record.blockedCommandCount, 0),
    blockedPlanIds: uniqueSorted(
      records.filter((record) => record.disposition === "review_only").map((record) => record.applyPlanId),
    ),
    committedOutcomeCount: records.reduce((total, record) => total + record.committedOutcomeCount, 0),
    latestRecord: records[0],
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_PERSISTENCE_VERSION,
    plannedCommandCount: records.reduce((total, record) => total + record.plannedCommandCount, 0),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord {
  const normalized = {
    applyPlanFingerprint: nonBlank(record.applyPlanFingerprint, "applyPlanFingerprint"),
    applyPlanId: nonBlank(record.applyPlanId, "applyPlanId"),
    applyPlanVersion: normalizePlanVersion(record.applyPlanVersion),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    committedOutcomeCount: nonNegativeInteger(record.committedOutcomeCount, "committedOutcomeCount"),
    disposition: normalizeDisposition(record.disposition),
    historyRecordCount: nonNegativeInteger(record.historyRecordCount, "historyRecordCount"),
    latestCommitPlanId: optionalTrim(record.latestCommitPlanId),
    latestCommitRecordId: optionalTrim(record.latestCommitRecordId),
    latestCommittedExecutionFingerprint: optionalTrim(record.latestCommittedExecutionFingerprint),
    latestSourceExecutionFingerprint: optionalTrim(record.latestSourceExecutionFingerprint),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    plannedCommandCount: nonNegativeInteger(record.plannedCommandCount, "plannedCommandCount"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commandCount !== normalized.plannedCommandCount + normalized.blockedCommandCount) {
    throw new Error("commandCount must equal plannedCommandCount plus blockedCommandCount")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "apply_ready") {
    throw new Error("ready live-adapter apply plan records must use apply_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked live-adapter apply plan records must use review_only disposition")
  }
  if (normalized.status === "ready" && !normalized.targetRfqId) {
    throw new Error("ready live-adapter apply plan records require a targetRfqId")
  }
  if (normalized.status === "ready" && !normalized.latestCommitRecordId) {
    throw new Error("ready live-adapter apply plan records require a latestCommitRecordId")
  }
  if (normalized.status === "ready" && !normalized.latestCommittedExecutionFingerprint) {
    throw new Error("ready live-adapter apply plan records require a latestCommittedExecutionFingerprint")
  }
  validateBlockedEvidenceGating(normalized)

  return normalized
}

function validateBlockedEvidenceGating(record: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord): void {
  const evidenceFields = [
    record.latestCommitPlanId,
    record.latestCommitRecordId,
    record.latestCommittedExecutionFingerprint,
    record.latestSourceExecutionFingerprint,
    record.targetRfqId,
  ]
  if (record.status === "blocked" && evidenceFields.some((value) => value !== undefined)) {
    throw new Error("blocked live-adapter apply plan records cannot include ready evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceSnapshot {
  return {
    applyReadyPlanIds: [...snapshot.applyReadyPlanIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedPlanIds: [...snapshot.blockedPlanIds],
    committedOutcomeCount: snapshot.committedOutcomeCount,
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    persistenceVersion: snapshot.persistenceVersion,
    plannedCommandCount: snapshot.plannedCommandCount,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord {
  return {
    applyPlanFingerprint: record.applyPlanFingerprint,
    applyPlanId: record.applyPlanId,
    applyPlanVersion: record.applyPlanVersion,
    blockedCommandCount: record.blockedCommandCount,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandCount: record.commandCount,
    committedOutcomeCount: record.committedOutcomeCount,
    disposition: record.disposition,
    historyRecordCount: record.historyRecordCount,
    latestCommitPlanId: record.latestCommitPlanId,
    latestCommitRecordId: record.latestCommitRecordId,
    latestCommittedExecutionFingerprint: record.latestCommittedExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    persistenceVersion: record.persistenceVersion,
    plannedCommandCount: record.plannedCommandCount,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewWarnings: [...record.reviewWarnings],
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function stableRecordKey(record: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord): string {
  return JSON.stringify({
    applyPlanFingerprint: record.applyPlanFingerprint,
    applyPlanId: record.applyPlanId,
    applyPlanVersion: record.applyPlanVersion,
    blockedCommandCount: record.blockedCommandCount,
    blockerCount: record.blockerCount,
    blockerLabels: record.blockerLabels,
    commandCount: record.commandCount,
    committedOutcomeCount: record.committedOutcomeCount,
    disposition: record.disposition,
    historyRecordCount: record.historyRecordCount,
    latestCommitPlanId: record.latestCommitPlanId,
    latestCommitRecordId: record.latestCommitRecordId,
    latestCommittedExecutionFingerprint: record.latestCommittedExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    persistenceVersion: record.persistenceVersion,
    plannedCommandCount: record.plannedCommandCount,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewWarnings: record.reviewWarnings,
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  })
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.applyPlanId, right.applyPlanId) ||
    compareLex(left.applyPlanFingerprint, right.applyPlanFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.disposition, right.disposition) ||
    compareLex(left.recordedBy, right.recordedBy) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.plannedCommandCount, right.plannedCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.committedOutcomeCount, right.committedOutcomeCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function countCommandStatuses(
  statuses: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandStatus[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandStatus, number>>>(
    (counts, status) => {
      counts[status] = (counts[status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC live-adapter apply plan persistence version")
  }
  return version
}

function normalizePlanVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord["applyPlanVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION) {
    throw new Error("applyPlanVersion is not a supported non-CNC live-adapter apply plan version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanDisposition,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanDisposition {
  if (disposition !== "apply_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported non-CNC live-adapter apply plan disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC live-adapter apply plan status")
  }
  return status
}
