import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary"
import type { NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadiness } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-execution-outcome-commit-adapter-boundary-persistence.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryDisposition =
  | "follow_through_ready"
  | "review_only"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION
  adapterBoundaryVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION
  adapterBoundaryId: string
  adapterBoundaryFingerprint: string
  requestedAt: string
  requestedBy: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryDisposition
  readModelStatus: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary["readModelStatus"]
  commitRecordId?: string
  committedExecutionFingerprint?: string
  executionFingerprint?: string
  followThroughId?: string
  followThroughFingerprint?: string
  targetRfqId?: string
  readinessRecordId?: string
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  committedOutcomeCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  blockerCount: number
  warningCount: number
  nextActionCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  commandStatuses: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandStatus[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  operatorSummary: string
  liveWriteBoundary: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord
  readyBoundaryIds: string[]
  blockedBoundaryIds: string[]
  adapterBoundaryFingerprints: string[]
  commitRecordIds: string[]
  committedExecutionFingerprints: string[]
  followThroughIds: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus, number>>
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  committedOutcomeCount: number
  blockerCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryInput {
  adapterBoundary: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceAdapter {
  recordAdapterBoundary(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordAdapterBoundary(input) {
      const record = buildAdapterBoundaryRecord(input)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records.filter((candidate) => candidate.adapterBoundaryId !== record.adapterBoundaryId),
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildAdapterBoundaryRecord({
  adapterBoundary,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord {
  return normalizeRecord({
    adapterBoundaryFingerprint: adapterBoundary.adapterBoundaryFingerprint,
    adapterBoundaryId: adapterBoundary.adapterBoundaryId,
    adapterBoundaryVersion: adapterBoundary.adapterBoundaryVersion,
    blockedCommandCount: adapterBoundary.blockedCommandCount,
    blockerCount: adapterBoundary.blockerLabels.length,
    blockerLabels: [...adapterBoundary.blockerLabels],
    commandCount: adapterBoundary.commandCount,
    commandIdempotencyKeys: adapterBoundary.commands.flatMap((command) => command.idempotencyKey ? [command.idempotencyKey] : []),
    commandStatuses: adapterBoundary.commands.map((command) => command.status),
    committedExecutionFingerprint: adapterBoundary.committedExecutionFingerprint,
    committedOutcomeCount: adapterBoundary.committedOutcomeCount,
    commitRecordId: adapterBoundary.commitRecordId,
    disposition: adapterBoundary.status === "ready" ? "follow_through_ready" : "review_only",
    evidenceFingerprints: adapterBoundary.commands.flatMap((command) => command.evidenceFingerprints),
    executionFingerprint: adapterBoundary.executionFingerprint,
    followThroughFingerprint: adapterBoundary.followThroughFingerprint,
    followThroughId: adapterBoundary.followThroughId,
    latestApplyPlanId: adapterBoundary.latestApplyPlanId,
    latestCommittedExecutionFingerprint: adapterBoundary.latestCommittedExecutionFingerprint,
    latestCommitRecordId: adapterBoundary.latestCommitRecordId,
    latestExecutionFingerprint: adapterBoundary.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: adapterBoundary.latestSourceExecutionFingerprint,
    liveWriteBoundary: adapterBoundary.liveWriteBoundary,
    nextActionCount: adapterBoundary.nextActionLabels.length,
    nextActionLabels: [...adapterBoundary.nextActionLabels],
    operatorSummary: adapterBoundary.operatorSummary,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: adapterBoundary.plannedCommandCount,
    readinessRecordId: adapterBoundary.readinessRecordId,
    readModelStatus: adapterBoundary.readModelStatus,
    recordedAt,
    recordedBy,
    requestedAt: adapterBoundary.requestedAt,
    requestedBy: adapterBoundary.requestedBy,
    reviewWarnings: [...adapterBoundary.reviewWarnings],
    status: adapterBoundary.status,
    targetRfqId: adapterBoundary.targetRfqId,
    warningCount: adapterBoundary.reviewWarnings.length,
  })
}

function normalizeSnapshot(
  snapshot:
    | LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceInitialSnapshot
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceSnapshot {
  const recordsByBoundaryId =
    new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord>()
  const recordKeysByIdAndRecordedAt = new Map<string, string>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const timestampKey = JSON.stringify([normalized.adapterBoundaryId, normalized.recordedAt])
    const recordKey = stableRecordKey(normalized)
    const existingRecordKey = recordKeysByIdAndRecordedAt.get(timestampKey)
    if (existingRecordKey && existingRecordKey !== recordKey) {
      throw new Error("conflicting final-gate follow-through adapter-boundary records cannot share adapterBoundaryId and recordedAt")
    }
    recordKeysByIdAndRecordedAt.set(timestampKey, recordKey)
    const existing = recordsByBoundaryId.get(normalized.adapterBoundaryId)
    const recordOrder = existing ? sortNewestFirst(normalized, existing) : -1
    if (!existing || recordOrder < 0) {
      recordsByBoundaryId.set(normalized.adapterBoundaryId, normalized)
    } else if (recordOrder === 0 && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error("conflicting final-gate follow-through adapter-boundary records cannot share adapterBoundaryId and recordedAt")
    }
  }
  const records = [...recordsByBoundaryId.values()].sort(sortNewestFirst)

  return {
    adapterBoundaryFingerprints: uniqueSorted(records.map((record) => record.adapterBoundaryFingerprint)),
    blockedBoundaryIds: uniqueSorted(
      records.filter((record) => record.disposition === "review_only").map((record) => record.adapterBoundaryId),
    ),
    blockedCommandCount: records.reduce((total, record) => total + record.blockedCommandCount, 0),
    blockerCount: records.reduce((total, record) => total + record.blockerCount, 0),
    commandCount: records.reduce((total, record) => total + record.commandCount, 0),
    commandIdempotencyKeys: uniqueSorted(records.flatMap((record) => record.commandIdempotencyKeys)),
    committedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.committedExecutionFingerprint ? [record.committedExecutionFingerprint] : []),
    ),
    committedOutcomeCount: records.reduce((total, record) => total + record.committedOutcomeCount, 0),
    commitRecordIds: uniqueSorted(records.flatMap((record) => record.commitRecordId ? [record.commitRecordId] : [])),
    evidenceFingerprints: uniqueSorted(records.flatMap((record) => record.evidenceFingerprints)),
    followThroughIds: uniqueSorted(records.flatMap((record) => record.followThroughId ? [record.followThroughId] : [])),
    latestRecord: records[0],
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: records.reduce((total, record) => total + record.plannedCommandCount, 0),
    readinessRecordIds: uniqueSorted(records.flatMap((record) => record.readinessRecordId ? [record.readinessRecordId] : [])),
    readyBoundaryIds: uniqueSorted(
      records.filter((record) => record.disposition === "follow_through_ready").map((record) => record.adapterBoundaryId),
    ),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord {
  const normalized = {
    adapterBoundaryFingerprint: nonBlank(record.adapterBoundaryFingerprint, "adapterBoundaryFingerprint"),
    adapterBoundaryId: nonBlank(record.adapterBoundaryId, "adapterBoundaryId"),
    adapterBoundaryVersion: normalizeAdapterBoundaryVersion(record.adapterBoundaryVersion),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    commandIdempotencyKeys: uniqueSorted(record.commandIdempotencyKeys.map((key) => nonBlank(key, "commandIdempotencyKey"))),
    commandStatuses: record.commandStatuses.map(normalizeCommandStatus),
    committedExecutionFingerprint: optionalTrim(record.committedExecutionFingerprint),
    committedOutcomeCount: nonNegativeInteger(record.committedOutcomeCount, "committedOutcomeCount"),
    commitRecordId: optionalTrim(record.commitRecordId),
    disposition: normalizeDisposition(record.disposition),
    evidenceFingerprints: uniqueSorted(record.evidenceFingerprints.map((fingerprint) => nonBlank(fingerprint, "evidenceFingerprint"))),
    executionFingerprint: optionalTrim(record.executionFingerprint),
    followThroughFingerprint: optionalTrim(record.followThroughFingerprint),
    followThroughId: optionalTrim(record.followThroughId),
    latestApplyPlanId: optionalTrim(record.latestApplyPlanId),
    latestCommittedExecutionFingerprint: optionalTrim(record.latestCommittedExecutionFingerprint),
    latestCommitRecordId: optionalTrim(record.latestCommitRecordId),
    latestExecutionFingerprint: optionalTrim(record.latestExecutionFingerprint),
    latestSourceExecutionFingerprint: optionalTrim(record.latestSourceExecutionFingerprint),
    liveWriteBoundary: nonBlank(record.liveWriteBoundary, "liveWriteBoundary"),
    nextActionCount: nonNegativeInteger(record.nextActionCount, "nextActionCount"),
    nextActionLabels: record.nextActionLabels.map((label) => nonBlank(label, "nextActionLabel")),
    operatorSummary: nonBlank(record.operatorSummary, "operatorSummary"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    plannedCommandCount: nonNegativeInteger(record.plannedCommandCount, "plannedCommandCount"),
    readinessRecordId: optionalTrim(record.readinessRecordId),
    readModelStatus: normalizeReadModelStatus(record.readModelStatus),
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
  if (normalized.commandStatuses.length !== normalized.commandCount) {
    throw new Error("commandStatuses length must equal commandCount")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.nextActionCount !== normalized.nextActionLabels.length) {
    throw new Error("nextActionCount must equal nextActionLabels length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "follow_through_ready") {
    throw new Error("ready final-gate follow-through adapter-boundary records must use follow_through_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked final-gate follow-through adapter-boundary records must use review_only disposition")
  }
  validateReadyEvidence(normalized)
  validateBlockedEvidenceGating(normalized)

  return normalized
}

function validateReadyEvidence(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
): void {
  if (record.status !== "ready") {
    return
  }
  const requiredFields = [
    record.commitRecordId,
    record.committedExecutionFingerprint,
    record.executionFingerprint,
    record.followThroughId,
    record.followThroughFingerprint,
    record.targetRfqId,
    record.readinessRecordId,
  ]
  if (requiredFields.some((value) => value === undefined)) {
    throw new Error("ready final-gate follow-through adapter-boundary records require complete commit and follow-through evidence")
  }
  if (record.plannedCommandCount === 0 || record.commandIdempotencyKeys.length === 0 || record.evidenceFingerprints.length === 0) {
    throw new Error("ready final-gate follow-through adapter-boundary records require planned command evidence")
  }
}

function validateBlockedEvidenceGating(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
): void {
  if (record.status !== "blocked") {
    return
  }
  const evidenceFields = [
    record.commitRecordId,
    record.committedExecutionFingerprint,
    record.executionFingerprint,
    record.followThroughId,
    record.followThroughFingerprint,
    record.targetRfqId,
    record.readinessRecordId,
    record.latestExecutionFingerprint,
    record.latestApplyPlanId,
    record.latestCommitRecordId,
    record.latestCommittedExecutionFingerprint,
    record.latestSourceExecutionFingerprint,
  ]
  if (
    evidenceFields.some((value) => value !== undefined) ||
    record.commandIdempotencyKeys.length > 0 ||
    record.evidenceFingerprints.length > 0
  ) {
    throw new Error("blocked final-gate follow-through adapter-boundary records cannot include ready evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceSnapshot {
  return {
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    blockedBoundaryIds: [...snapshot.blockedBoundaryIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockerCount: snapshot.blockerCount,
    commandCount: snapshot.commandCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    committedOutcomeCount: snapshot.committedOutcomeCount,
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    followThroughIds: [...snapshot.followThroughIds],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    persistenceVersion: snapshot.persistenceVersion,
    plannedCommandCount: snapshot.plannedCommandCount,
    readinessRecordIds: [...snapshot.readinessRecordIds],
    readyBoundaryIds: [...snapshot.readyBoundaryIds],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord {
  return {
    adapterBoundaryFingerprint: record.adapterBoundaryFingerprint,
    adapterBoundaryId: record.adapterBoundaryId,
    adapterBoundaryVersion: record.adapterBoundaryVersion,
    blockedCommandCount: record.blockedCommandCount,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandCount: record.commandCount,
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    commandStatuses: [...record.commandStatuses],
    committedExecutionFingerprint: record.committedExecutionFingerprint,
    committedOutcomeCount: record.committedOutcomeCount,
    commitRecordId: record.commitRecordId,
    disposition: record.disposition,
    evidenceFingerprints: [...record.evidenceFingerprints],
    executionFingerprint: record.executionFingerprint,
    followThroughFingerprint: record.followThroughFingerprint,
    followThroughId: record.followThroughId,
    latestApplyPlanId: record.latestApplyPlanId,
    latestCommittedExecutionFingerprint: record.latestCommittedExecutionFingerprint,
    latestCommitRecordId: record.latestCommitRecordId,
    latestExecutionFingerprint: record.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    liveWriteBoundary: record.liveWriteBoundary,
    nextActionCount: record.nextActionCount,
    nextActionLabels: [...record.nextActionLabels],
    operatorSummary: record.operatorSummary,
    persistenceVersion: record.persistenceVersion,
    plannedCommandCount: record.plannedCommandCount,
    readinessRecordId: record.readinessRecordId,
    readModelStatus: record.readModelStatus,
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

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.adapterBoundaryId, right.adapterBoundaryId) ||
    compareLex(left.adapterBoundaryFingerprint, right.adapterBoundaryFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.disposition, right.disposition) ||
    compareLex(left.commitRecordId ?? "", right.commitRecordId ?? "") ||
    compareLex(left.committedExecutionFingerprint ?? "", right.committedExecutionFingerprint ?? "") ||
    compareLex(left.executionFingerprint ?? "", right.executionFingerprint ?? "") ||
    compareLex(left.followThroughId ?? "", right.followThroughId ?? "") ||
    compareLex(left.followThroughFingerprint ?? "", right.followThroughFingerprint ?? "") ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.readinessRecordId ?? "", right.readinessRecordId ?? "") ||
    compareLex(left.requestedAt, right.requestedAt) ||
    compareLex(left.requestedBy, right.requestedBy) ||
    compareLex(left.recordedBy, right.recordedBy) ||
    compareLex(left.adapterBoundaryVersion, right.adapterBoundaryVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.plannedCommandCount, right.plannedCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.committedOutcomeCount, right.committedOutcomeCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount) ||
    compareNumber(left.nextActionCount, right.nextActionCount) ||
    compareLex(left.commandStatuses.join("\n"), right.commandStatuses.join("\n")) ||
    compareLex(left.commandIdempotencyKeys.join("\n"), right.commandIdempotencyKeys.join("\n")) ||
    compareLex(left.evidenceFingerprints.join("\n"), right.evidenceFingerprints.join("\n")) ||
    compareLex(left.blockerLabels.join("\n"), right.blockerLabels.join("\n")) ||
    compareLex(left.reviewWarnings.join("\n"), right.reviewWarnings.join("\n")) ||
    compareLex(left.nextActionLabels.join("\n"), right.nextActionLabels.join("\n")) ||
    compareLex(left.operatorSummary, right.operatorSummary) ||
    compareLex(left.liveWriteBoundary, right.liveWriteBoundary)
  )
}

function stableRecordKey(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
): string {
  return JSON.stringify(Object.entries(record).sort(([left], [right]) => compareLex(left, right)))
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus, number>>>(
    (counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    },
    {},
  )
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION
  ) {
    throw new Error("persistenceVersion is not a supported final-gate follow-through adapter-boundary persistence version")
  }
  return version
}

function normalizeAdapterBoundaryVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord["adapterBoundaryVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION
  ) {
    throw new Error("adapterBoundaryVersion is not a supported final-gate follow-through adapter-boundary version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryDisposition,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryDisposition {
  if (disposition !== "follow_through_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported final-gate follow-through adapter-boundary disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported final-gate follow-through adapter-boundary status")
  }
  return status
}

function normalizeCommandStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandStatus {
  if (status !== "blocked" && status !== "planned") {
    throw new Error("command status is not a supported final-gate follow-through adapter-boundary command status")
  }
  return status
}

function normalizeReadModelStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadiness,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadiness {
  if (status !== "blocked" && status !== "ready_to_follow_through") {
    throw new Error("readModelStatus is not a supported final-gate follow-through outcome commit read-model status")
  }
  return status
}
