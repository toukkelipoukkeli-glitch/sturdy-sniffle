import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-boundary-persistence.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryDisposition =
  | "live_write_ready"
  | "review_only"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION
  liveWriteBoundaryVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION
  liveWriteBoundaryId: string
  liveWriteBoundaryFingerprint: string
  requestedAt: string
  requestedBy: string
  recordedAt: string
  recordedBy: string
  operatorReviewApproved: boolean
  operatorReviewNote?: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryDisposition
  historyStatus: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary["historyStatus"]
  adapterBoundaryId?: string
  adapterBoundaryFingerprint?: string
  commitRecordId?: string
  committedExecutionFingerprint?: string
  followThroughId?: string
  targetRfqId?: string
  readinessRecordId?: string
  commandCount: number
  pendingCommandCount: number
  blockedCommandCount: number
  reviewedOutcomeCount: number
  historyRecordCount: number
  blockerCount: number
  warningCount: number
  nextActionCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  commandStatuses: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandStatus[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  operatorSummary: string
  liveWriteBoundary: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord
  readyBoundaryIds: string[]
  blockedBoundaryIds: string[]
  liveWriteBoundaryFingerprints: string[]
  adapterBoundaryIds: string[]
  adapterBoundaryFingerprints: string[]
  commitRecordIds: string[]
  committedExecutionFingerprints: string[]
  followThroughIds: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus, number>>
  commandCount: number
  pendingCommandCount: number
  blockedCommandCount: number
  reviewedOutcomeCount: number
  blockerCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryInput {
  liveWriteBoundary: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceAdapter {
  recordLiveWriteBoundary(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordLiveWriteBoundary(input) {
      const record = buildLiveWriteBoundaryRecord(input)
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildLiveWriteBoundaryRecord({
  liveWriteBoundary,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
  return normalizeRecord({
    adapterBoundaryFingerprint: liveWriteBoundary.adapterBoundaryFingerprint,
    adapterBoundaryId: liveWriteBoundary.adapterBoundaryId,
    blockedCommandCount: liveWriteBoundary.blockedCommandCount,
    blockerCount: liveWriteBoundary.blockerLabels.length,
    blockerLabels: [...liveWriteBoundary.blockerLabels],
    commandCount: liveWriteBoundary.commandCount,
    commandIdempotencyKeys: liveWriteBoundary.commands.flatMap((command) => command.idempotencyKey ? [command.idempotencyKey] : []),
    commandStatuses: liveWriteBoundary.commands.map((command) => command.status),
    committedExecutionFingerprint: liveWriteBoundary.committedExecutionFingerprint,
    commitRecordId: liveWriteBoundary.commitRecordId,
    disposition: liveWriteBoundary.status === "review_ready" ? "live_write_ready" : "review_only",
    evidenceFingerprints: liveWriteBoundary.commands.flatMap((command) => command.evidenceFingerprints),
    followThroughId: liveWriteBoundary.followThroughId,
    historyRecordCount: liveWriteBoundary.historyRecordCount,
    historyStatus: liveWriteBoundary.historyStatus,
    liveWriteBoundary: liveWriteBoundary.liveWriteBoundary,
    liveWriteBoundaryFingerprint: liveWriteBoundary.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: liveWriteBoundary.liveWriteBoundaryId,
    liveWriteBoundaryVersion: liveWriteBoundary.liveWriteBoundaryVersion,
    nextActionCount: liveWriteBoundary.nextActionLabels.length,
    nextActionLabels: [...liveWriteBoundary.nextActionLabels],
    operatorReviewApproved: liveWriteBoundary.operatorReviewApproved,
    operatorReviewNote: liveWriteBoundary.operatorReviewNote,
    operatorSummary: liveWriteBoundary.operatorSummary,
    pendingCommandCount: liveWriteBoundary.pendingCommandCount,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION,
    readinessRecordId: liveWriteBoundary.readinessRecordId,
    recordedAt,
    recordedBy,
    requestedAt: liveWriteBoundary.requestedAt,
    requestedBy: liveWriteBoundary.requestedBy,
    reviewedOutcomeCount: liveWriteBoundary.reviewedOutcomeCount,
    reviewWarnings: [...liveWriteBoundary.reviewWarnings],
    status: liveWriteBoundary.status,
    targetRfqId: liveWriteBoundary.targetRfqId,
    warningCount: liveWriteBoundary.reviewWarnings.length,
  })
}

function normalizeSnapshot(
  snapshot:
    | LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceInitialSnapshot
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceSnapshot {
  const recordsByBoundaryId =
    new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord>()
  const recordKeysByIdAndRecordedAt = new Map<string, string>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const timestampKey = JSON.stringify([normalized.liveWriteBoundaryId, normalized.recordedAt])
    const recordKey = stableRecordKey(normalized)
    const existingRecordKey = recordKeysByIdAndRecordedAt.get(timestampKey)
    if (existingRecordKey && existingRecordKey !== recordKey) {
      throw new Error("conflicting final-gate follow-through live-write boundary records cannot share liveWriteBoundaryId and recordedAt")
    }
    recordKeysByIdAndRecordedAt.set(timestampKey, recordKey)
    const existing = recordsByBoundaryId.get(normalized.liveWriteBoundaryId)
    const recordOrder = existing ? sortNewestFirst(normalized, existing) : -1
    if (!existing || recordOrder < 0) {
      recordsByBoundaryId.set(normalized.liveWriteBoundaryId, normalized)
    } else if (recordOrder === 0 && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error("conflicting final-gate follow-through live-write boundary records cannot share liveWriteBoundaryId and recordedAt")
    }
  }
  const records = [...recordsByBoundaryId.values()].sort(sortNewestFirst)

  return {
    adapterBoundaryFingerprints: uniqueSorted(records.flatMap((record) => record.adapterBoundaryFingerprint ? [record.adapterBoundaryFingerprint] : [])),
    adapterBoundaryIds: uniqueSorted(records.flatMap((record) => record.adapterBoundaryId ? [record.adapterBoundaryId] : [])),
    blockedBoundaryIds: uniqueSorted(
      records.filter((record) => record.disposition === "review_only").map((record) => record.liveWriteBoundaryId),
    ),
    blockedCommandCount: records.reduce((total, record) => total + record.blockedCommandCount, 0),
    blockerCount: records.reduce((total, record) => total + record.blockerCount, 0),
    commandCount: records.reduce((total, record) => total + record.commandCount, 0),
    commandIdempotencyKeys: uniqueSorted(records.flatMap((record) => record.commandIdempotencyKeys)),
    committedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.committedExecutionFingerprint ? [record.committedExecutionFingerprint] : []),
    ),
    commitRecordIds: uniqueSorted(records.flatMap((record) => record.commitRecordId ? [record.commitRecordId] : [])),
    evidenceFingerprints: uniqueSorted(records.flatMap((record) => record.evidenceFingerprints)),
    followThroughIds: uniqueSorted(records.flatMap((record) => record.followThroughId ? [record.followThroughId] : [])),
    latestRecord: records[0],
    liveWriteBoundaryFingerprints: uniqueSorted(records.map((record) => record.liveWriteBoundaryFingerprint)),
    pendingCommandCount: records.reduce((total, record) => total + record.pendingCommandCount, 0),
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION,
    readinessRecordIds: uniqueSorted(records.flatMap((record) => record.readinessRecordId ? [record.readinessRecordId] : [])),
    readyBoundaryIds: uniqueSorted(
      records.filter((record) => record.disposition === "live_write_ready").map((record) => record.liveWriteBoundaryId),
    ),
    recordCount: records.length,
    records,
    reviewedOutcomeCount: records.reduce((total, record) => total + record.reviewedOutcomeCount, 0),
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
  const normalized = {
    adapterBoundaryFingerprint: optionalTrim(record.adapterBoundaryFingerprint),
    adapterBoundaryId: optionalTrim(record.adapterBoundaryId),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    commandIdempotencyKeys: uniqueSorted(record.commandIdempotencyKeys.map((key) => nonBlank(key, "commandIdempotencyKey"))),
    commandStatuses: record.commandStatuses.map(normalizeCommandStatus),
    committedExecutionFingerprint: optionalTrim(record.committedExecutionFingerprint),
    commitRecordId: optionalTrim(record.commitRecordId),
    disposition: normalizeDisposition(record.disposition),
    evidenceFingerprints: uniqueSorted(record.evidenceFingerprints.map((fingerprint) => nonBlank(fingerprint, "evidenceFingerprint"))),
    followThroughId: optionalTrim(record.followThroughId),
    historyRecordCount: nonNegativeInteger(record.historyRecordCount, "historyRecordCount"),
    historyStatus: normalizeHistoryStatus(record.historyStatus),
    liveWriteBoundary: nonBlank(record.liveWriteBoundary, "liveWriteBoundary"),
    liveWriteBoundaryFingerprint: nonBlank(record.liveWriteBoundaryFingerprint, "liveWriteBoundaryFingerprint"),
    liveWriteBoundaryId: nonBlank(record.liveWriteBoundaryId, "liveWriteBoundaryId"),
    liveWriteBoundaryVersion: normalizeLiveWriteBoundaryVersion(record.liveWriteBoundaryVersion),
    nextActionCount: nonNegativeInteger(record.nextActionCount, "nextActionCount"),
    nextActionLabels: record.nextActionLabels.map((label) => nonBlank(label, "nextActionLabel")),
    operatorReviewApproved: Boolean(record.operatorReviewApproved),
    operatorReviewNote: optionalTrim(record.operatorReviewNote),
    operatorSummary: nonBlank(record.operatorSummary, "operatorSummary"),
    pendingCommandCount: nonNegativeInteger(record.pendingCommandCount, "pendingCommandCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    readinessRecordId: optionalTrim(record.readinessRecordId),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    requestedAt: normalizeIsoTimestamp(record.requestedAt, "requestedAt"),
    requestedBy: nonBlank(record.requestedBy, "requestedBy"),
    reviewedOutcomeCount: nonNegativeInteger(record.reviewedOutcomeCount, "reviewedOutcomeCount"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commandCount !== normalized.pendingCommandCount + normalized.blockedCommandCount) {
    throw new Error("commandCount must equal pendingCommandCount plus blockedCommandCount")
  }
  if (normalized.commandStatuses.length !== normalized.commandCount) {
    throw new Error("commandStatuses length must equal commandCount")
  }
  const pendingStatusCount = normalized.commandStatuses.filter(
    (status) => status === "pending_enablement",
  ).length
  const blockedStatusCount = normalized.commandStatuses.filter((status) => status === "blocked").length
  if (
    pendingStatusCount !== normalized.pendingCommandCount ||
    blockedStatusCount !== normalized.blockedCommandCount
  ) {
    throw new Error("command status counts must match aggregate command counts")
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
  if (normalized.status === "review_ready" && normalized.disposition !== "live_write_ready") {
    throw new Error("review-ready final-gate follow-through live-write boundary records must use live_write_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked final-gate follow-through live-write boundary records must use review_only disposition")
  }
  validateReadyEvidence(normalized)
  validateBlockedEvidenceGating(normalized)

  return normalized
}

function validateReadyEvidence(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
): void {
  if (record.status !== "review_ready") {
    return
  }
  const requiredFields = [
    record.adapterBoundaryId,
    record.adapterBoundaryFingerprint,
    record.commitRecordId,
    record.committedExecutionFingerprint,
    record.followThroughId,
    record.targetRfqId,
    record.readinessRecordId,
  ]
  if (requiredFields.some((value) => value === undefined)) {
    throw new Error("review-ready final-gate follow-through live-write boundary records require complete reviewed evidence")
  }
  if (!record.operatorReviewApproved) {
    throw new Error("review-ready final-gate follow-through live-write boundary records require operator approval")
  }
  if (record.pendingCommandCount === 0 || record.commandIdempotencyKeys.length === 0 || record.evidenceFingerprints.length === 0) {
    throw new Error("review-ready final-gate follow-through live-write boundary records require pending command evidence")
  }
}

function validateBlockedEvidenceGating(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
): void {
  if (record.status !== "blocked") {
    return
  }
  const evidenceFields = [
    record.adapterBoundaryId,
    record.adapterBoundaryFingerprint,
    record.commitRecordId,
    record.committedExecutionFingerprint,
    record.followThroughId,
    record.targetRfqId,
    record.readinessRecordId,
  ]
  if (
    evidenceFields.some((value) => value !== undefined) ||
    record.commandIdempotencyKeys.length > 0 ||
    record.evidenceFingerprints.length > 0
  ) {
    throw new Error("blocked final-gate follow-through live-write boundary records cannot include ready evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceSnapshot {
  return {
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    adapterBoundaryIds: [...snapshot.adapterBoundaryIds],
    blockedBoundaryIds: [...snapshot.blockedBoundaryIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockerCount: snapshot.blockerCount,
    commandCount: snapshot.commandCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    followThroughIds: [...snapshot.followThroughIds],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    liveWriteBoundaryFingerprints: [...snapshot.liveWriteBoundaryFingerprints],
    pendingCommandCount: snapshot.pendingCommandCount,
    persistenceVersion: snapshot.persistenceVersion,
    readinessRecordIds: [...snapshot.readinessRecordIds],
    readyBoundaryIds: [...snapshot.readyBoundaryIds],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    reviewedOutcomeCount: snapshot.reviewedOutcomeCount,
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
  return {
    adapterBoundaryFingerprint: record.adapterBoundaryFingerprint,
    adapterBoundaryId: record.adapterBoundaryId,
    blockedCommandCount: record.blockedCommandCount,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandCount: record.commandCount,
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    commandStatuses: [...record.commandStatuses],
    committedExecutionFingerprint: record.committedExecutionFingerprint,
    commitRecordId: record.commitRecordId,
    disposition: record.disposition,
    evidenceFingerprints: [...record.evidenceFingerprints],
    followThroughId: record.followThroughId,
    historyRecordCount: record.historyRecordCount,
    historyStatus: record.historyStatus,
    liveWriteBoundary: record.liveWriteBoundary,
    liveWriteBoundaryFingerprint: record.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: record.liveWriteBoundaryId,
    liveWriteBoundaryVersion: record.liveWriteBoundaryVersion,
    nextActionCount: record.nextActionCount,
    nextActionLabels: [...record.nextActionLabels],
    operatorReviewApproved: record.operatorReviewApproved,
    operatorReviewNote: record.operatorReviewNote,
    operatorSummary: record.operatorSummary,
    pendingCommandCount: record.pendingCommandCount,
    persistenceVersion: record.persistenceVersion,
    readinessRecordId: record.readinessRecordId,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    requestedAt: record.requestedAt,
    requestedBy: record.requestedBy,
    reviewedOutcomeCount: record.reviewedOutcomeCount,
    reviewWarnings: [...record.reviewWarnings],
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.liveWriteBoundaryId, right.liveWriteBoundaryId) ||
    compareLex(left.liveWriteBoundaryFingerprint, right.liveWriteBoundaryFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.disposition, right.disposition) ||
    compareLex(left.adapterBoundaryId ?? "", right.adapterBoundaryId ?? "") ||
    compareLex(left.adapterBoundaryFingerprint ?? "", right.adapterBoundaryFingerprint ?? "") ||
    compareLex(left.commitRecordId ?? "", right.commitRecordId ?? "") ||
    compareLex(left.committedExecutionFingerprint ?? "", right.committedExecutionFingerprint ?? "") ||
    compareLex(left.followThroughId ?? "", right.followThroughId ?? "") ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.readinessRecordId ?? "", right.readinessRecordId ?? "") ||
    compareLex(left.requestedAt, right.requestedAt) ||
    compareLex(left.requestedBy, right.requestedBy) ||
    compareLex(left.recordedBy, right.recordedBy) ||
    compareLex(left.liveWriteBoundaryVersion, right.liveWriteBoundaryVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.pendingCommandCount, right.pendingCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.reviewedOutcomeCount, right.reviewedOutcomeCount) ||
    compareNumber(left.historyRecordCount, right.historyRecordCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount) ||
    compareNumber(left.nextActionCount, right.nextActionCount) ||
    compareLex(left.operatorReviewApproved ? "1" : "0", right.operatorReviewApproved ? "1" : "0") ||
    compareLex(left.operatorReviewNote ?? "", right.operatorReviewNote ?? "") ||
    compareLex(left.historyStatus, right.historyStatus) ||
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
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
): string {
  return JSON.stringify(Object.entries(record).sort(([left], [right]) => compareLex(left, right)))
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus, number>>>(
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION
  ) {
    throw new Error("persistenceVersion is not a supported final-gate follow-through live-write boundary persistence version")
  }
  return version
}

function normalizeLiveWriteBoundaryVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord["liveWriteBoundaryVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION
  ) {
    throw new Error("liveWriteBoundaryVersion is not a supported final-gate follow-through live-write boundary version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryDisposition,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryDisposition {
  if (disposition !== "live_write_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported final-gate follow-through live-write boundary disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus {
  if (status !== "blocked" && status !== "review_ready") {
    throw new Error("status is not a supported final-gate follow-through live-write boundary status")
  }
  return status
}

function normalizeCommandStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandStatus {
  if (status !== "blocked" && status !== "pending_enablement") {
    throw new Error("command status is not a supported final-gate follow-through live-write boundary command status")
  }
  return status
}

function normalizeHistoryStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary["historyStatus"],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary["historyStatus"] {
  if (status !== "blocked" && status !== "empty" && status !== "ready") {
    throw new Error("historyStatus is not a supported final-gate follow-through live-write boundary history status")
  }
  return status
}
