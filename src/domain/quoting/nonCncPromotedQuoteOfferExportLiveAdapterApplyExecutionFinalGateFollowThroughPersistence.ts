import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandStatus,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-persistence.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughDisposition =
  | "follow_through_ready"
  | "review_only"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_PERSISTENCE_VERSION
  followThroughVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_VERSION
  followThroughId: string
  followThroughFingerprint: string
  recordedAt: string
  recordedBy: string
  requestedAt: string
  requestedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughDisposition
  targetRfqId?: string
  readinessRecordId?: string
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  historyRecordCount: number
  readyRecordCount: number
  blockedRecordCount: number
  appliedCommandCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord
  readyFollowThroughIds: string[]
  blockedFollowThroughIds: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  latestExecutionFingerprints: string[]
  latestApplyPlanIds: string[]
  latestCommitRecordIds: string[]
  latestCommittedExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus, number>>
  appliedCommandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  blockerCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughInput {
  followThrough: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceAdapter {
  recordFollowThrough(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordFollowThrough(input) {
      const record = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord(input)
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord({
  followThrough,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord {
  const commandCounts = countCommandStatuses(followThrough.commands.map((command) => command.status))
  return normalizeRecord({
    appliedCommandCount: followThrough.status === "ready" ? followThrough.appliedCommandCount : 0,
    blockedCommandCount: commandCounts.blocked ?? 0,
    blockedRecordCount: followThrough.blockedRecordCount,
    blockerCount: followThrough.blockerLabels.length,
    blockerLabels: [...followThrough.blockerLabels],
    commandCount: followThrough.commands.length,
    disposition: followThrough.status === "ready" ? "follow_through_ready" : "review_only",
    followThroughFingerprint: followThrough.followThroughFingerprint,
    followThroughId: followThrough.followThroughId,
    followThroughVersion: followThrough.followThroughVersion,
    historyRecordCount: followThrough.historyRecordCount,
    latestApplyPlanId: followThrough.status === "ready" ? followThrough.latestApplyPlanId : undefined,
    latestCommitRecordId: followThrough.status === "ready" ? followThrough.latestCommitRecordId : undefined,
    latestCommittedExecutionFingerprint:
      followThrough.status === "ready" ? followThrough.latestCommittedExecutionFingerprint : undefined,
    latestExecutionFingerprint: followThrough.status === "ready" ? followThrough.latestExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: followThrough.status === "ready" ? followThrough.latestSourceExecutionFingerprint : undefined,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_PERSISTENCE_VERSION,
    plannedCommandCount: commandCounts.planned ?? 0,
    readinessRecordId: followThrough.status === "ready" ? followThrough.readinessRecordId : undefined,
    readyRecordCount: followThrough.readyRecordCount,
    recordedAt,
    recordedBy,
    requestedAt: followThrough.requestedAt,
    requestedBy: followThrough.requestedBy,
    reviewWarnings: [...followThrough.reviewWarnings],
    status: followThrough.status,
    targetRfqId: followThrough.status === "ready" ? followThrough.targetRfqId : undefined,
    warningCount: followThrough.reviewWarnings.length,
  })
}

function normalizeSnapshot(
  snapshot:
    | LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceInitialSnapshot
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceSnapshot {
  const recordsByFollowThroughId =
    new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord>()
  const recordKeysByFollowThroughIdAndRecordedAt = new Map<string, string>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const timestampKey = JSON.stringify([normalized.followThroughId, normalized.recordedAt])
    const recordKey = stableRecordKey(normalized)
    const existingRecordKey = recordKeysByFollowThroughIdAndRecordedAt.get(timestampKey)
    if (existingRecordKey && existingRecordKey !== recordKey) {
      throw new Error(
        "conflicting live-adapter final-gate follow-through records cannot share followThroughId and recordedAt",
      )
    }
    recordKeysByFollowThroughIdAndRecordedAt.set(timestampKey, recordKey)
    const existing = recordsByFollowThroughId.get(normalized.followThroughId)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFollowThroughId.set(normalized.followThroughId, normalized)
    }
  }
  const records = [...recordsByFollowThroughId.values()].sort(sortNewestFirst)

  return {
    appliedCommandCount: records.reduce((total, record) => total + record.appliedCommandCount, 0),
    blockedCommandCount: records.reduce((total, record) => total + record.blockedCommandCount, 0),
    blockedFollowThroughIds: uniqueSorted(
      records.filter((record) => record.status === "blocked").map((record) => record.followThroughId),
    ),
    blockerCount: records.reduce((total, record) => total + record.blockerCount, 0),
    latestApplyPlanIds: uniqueSorted(records.flatMap((record) => record.latestApplyPlanId ? [record.latestApplyPlanId] : [])),
    latestCommitRecordIds: uniqueSorted(
      records.flatMap((record) => record.latestCommitRecordId ? [record.latestCommitRecordId] : []),
    ),
    latestCommittedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) =>
        record.latestCommittedExecutionFingerprint ? [record.latestCommittedExecutionFingerprint] : [],
      ),
    ),
    latestExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.latestExecutionFingerprint ? [record.latestExecutionFingerprint] : []),
    ),
    latestRecord: records[0],
    latestSourceExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.latestSourceExecutionFingerprint ? [record.latestSourceExecutionFingerprint] : []),
    ),
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_PERSISTENCE_VERSION,
    plannedCommandCount: records.reduce((total, record) => total + record.plannedCommandCount, 0),
    readinessRecordIds: uniqueSorted(records.flatMap((record) => record.readinessRecordId ? [record.readinessRecordId] : [])),
    readyFollowThroughIds: uniqueSorted(
      records.filter((record) => record.status === "ready").map((record) => record.followThroughId),
    ),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord {
  const normalized = {
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "appliedCommandCount"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    blockedRecordCount: nonNegativeInteger(record.blockedRecordCount, "blockedRecordCount"),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    disposition: normalizeDisposition(record.disposition),
    followThroughFingerprint: nonBlank(record.followThroughFingerprint, "followThroughFingerprint"),
    followThroughId: nonBlank(record.followThroughId, "followThroughId"),
    followThroughVersion: normalizeFollowThroughVersion(record.followThroughVersion),
    historyRecordCount: nonNegativeInteger(record.historyRecordCount, "historyRecordCount"),
    latestApplyPlanId: optionalTrim(record.latestApplyPlanId),
    latestCommitRecordId: optionalTrim(record.latestCommitRecordId),
    latestCommittedExecutionFingerprint: optionalTrim(record.latestCommittedExecutionFingerprint),
    latestExecutionFingerprint: optionalTrim(record.latestExecutionFingerprint),
    latestSourceExecutionFingerprint: optionalTrim(record.latestSourceExecutionFingerprint),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    plannedCommandCount: nonNegativeInteger(record.plannedCommandCount, "plannedCommandCount"),
    readinessRecordId: optionalTrim(record.readinessRecordId),
    readyRecordCount: nonNegativeInteger(record.readyRecordCount, "readyRecordCount"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    requestedAt: normalizeIsoTimestamp(record.requestedAt, "requestedAt"),
    requestedBy: nonBlank(record.requestedBy, "requestedBy"),
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
  if (normalized.status === "ready" && normalized.disposition !== "follow_through_ready") {
    throw new Error("ready live-adapter final-gate follow-through records must use follow_through_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked live-adapter final-gate follow-through records must use review_only disposition")
  }
  validateEvidenceGating(normalized)

  return normalized
}

function validateEvidenceGating(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord,
): void {
  const evidenceFields = [
    record.latestApplyPlanId,
    record.latestCommitRecordId,
    record.latestCommittedExecutionFingerprint,
    record.latestExecutionFingerprint,
    record.latestSourceExecutionFingerprint,
    record.readinessRecordId,
    record.targetRfqId,
  ]
  if (
    record.status === "blocked" &&
    (record.appliedCommandCount > 0 || record.plannedCommandCount > 0 || evidenceFields.some((value) => value !== undefined))
  ) {
    throw new Error("blocked live-adapter final-gate follow-through records cannot include ready evidence identifiers")
  }
  if (record.status === "ready" && record.blockerCount > 0) {
    throw new Error("ready live-adapter final-gate follow-through records cannot include blockers")
  }
  if (record.status === "ready" && record.appliedCommandCount === 0) {
    throw new Error("ready live-adapter final-gate follow-through records require applied commands")
  }
  if (record.status === "ready" && record.plannedCommandCount === 0) {
    throw new Error("ready live-adapter final-gate follow-through records require planned commands")
  }
  if (record.status === "ready" && evidenceFields.some((value) => value === undefined)) {
    throw new Error("ready live-adapter final-gate follow-through records require complete evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceSnapshot {
  return {
    appliedCommandCount: snapshot.appliedCommandCount,
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedFollowThroughIds: [...snapshot.blockedFollowThroughIds],
    blockerCount: snapshot.blockerCount,
    latestApplyPlanIds: [...snapshot.latestApplyPlanIds],
    latestCommitRecordIds: [...snapshot.latestCommitRecordIds],
    latestCommittedExecutionFingerprints: [...snapshot.latestCommittedExecutionFingerprints],
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    persistenceVersion: snapshot.persistenceVersion,
    plannedCommandCount: snapshot.plannedCommandCount,
    readinessRecordIds: [...snapshot.readinessRecordIds],
    readyFollowThroughIds: [...snapshot.readyFollowThroughIds],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord {
  return {
    appliedCommandCount: record.appliedCommandCount,
    blockedCommandCount: record.blockedCommandCount,
    blockedRecordCount: record.blockedRecordCount,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandCount: record.commandCount,
    disposition: record.disposition,
    followThroughFingerprint: record.followThroughFingerprint,
    followThroughId: record.followThroughId,
    followThroughVersion: record.followThroughVersion,
    historyRecordCount: record.historyRecordCount,
    latestApplyPlanId: record.latestApplyPlanId,
    latestCommitRecordId: record.latestCommitRecordId,
    latestCommittedExecutionFingerprint: record.latestCommittedExecutionFingerprint,
    latestExecutionFingerprint: record.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    persistenceVersion: record.persistenceVersion,
    plannedCommandCount: record.plannedCommandCount,
    readinessRecordId: record.readinessRecordId,
    readyRecordCount: record.readyRecordCount,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    requestedAt: record.requestedAt,
    requestedBy: record.requestedBy,
    reviewWarnings: [...record.reviewWarnings],
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function stableRecordKey(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord,
): string {
  return JSON.stringify({
    appliedCommandCount: record.appliedCommandCount,
    blockedCommandCount: record.blockedCommandCount,
    blockedRecordCount: record.blockedRecordCount,
    blockerCount: record.blockerCount,
    blockerLabels: record.blockerLabels,
    commandCount: record.commandCount,
    disposition: record.disposition,
    followThroughFingerprint: record.followThroughFingerprint,
    followThroughId: record.followThroughId,
    followThroughVersion: record.followThroughVersion,
    historyRecordCount: record.historyRecordCount,
    latestApplyPlanId: record.latestApplyPlanId,
    latestCommitRecordId: record.latestCommitRecordId,
    latestCommittedExecutionFingerprint: record.latestCommittedExecutionFingerprint,
    latestExecutionFingerprint: record.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    persistenceVersion: record.persistenceVersion,
    plannedCommandCount: record.plannedCommandCount,
    readinessRecordId: record.readinessRecordId,
    readyRecordCount: record.readyRecordCount,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    requestedAt: record.requestedAt,
    requestedBy: record.requestedBy,
    reviewWarnings: record.reviewWarnings,
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  })
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.followThroughId, right.followThroughId) ||
    compareLex(left.followThroughFingerprint, right.followThroughFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.disposition, right.disposition) ||
    compareLex(left.recordedBy, right.recordedBy) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.plannedCommandCount, right.plannedCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.appliedCommandCount, right.appliedCommandCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function countCommandStatuses(
  statuses: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandStatus[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandStatus, number>> {
  return statuses.reduce<
    Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandStatus, number>>
  >((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus, number>> {
  return records.reduce<
    Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus, number>>
  >((counts, record) => {
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_PERSISTENCE_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_PERSISTENCE_VERSION
  ) {
    throw new Error("persistenceVersion is not a supported non-CNC live-adapter final-gate follow-through persistence version")
  }
  return version
}

function normalizeFollowThroughVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord["followThroughVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_VERSION) {
    throw new Error("followThroughVersion is not a supported non-CNC live-adapter final-gate follow-through version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughDisposition,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughDisposition {
  if (disposition !== "follow_through_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported non-CNC live-adapter final-gate follow-through disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC live-adapter final-gate follow-through status")
  }
  return status
}
