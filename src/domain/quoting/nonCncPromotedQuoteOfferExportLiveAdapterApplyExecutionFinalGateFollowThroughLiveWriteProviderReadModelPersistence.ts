import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-read-model-persistence.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelDisposition =
  | "provider_prepare_ready"
  | "review_only"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION
  readModelVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION
  providerReadModelRecordId: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelStatus
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelDisposition
  sourceHistoryStatus: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel["sourceHistoryStatus"]
  totalRecords: number
  readyBoundaryCount: number
  blockedBoundaryCount: number
  commandCount: number
  pendingWriteIntentCount: number
  blockedCommandCount: number
  reviewedOutcomeCount: number
  liveWriteBoundaryId?: string
  liveWriteBoundaryFingerprint?: string
  adapterBoundaryId?: string
  adapterBoundaryFingerprint?: string
  commitRecordId?: string
  committedExecutionFingerprint?: string
  followThroughId?: string
  targetRfqId?: string
  readinessRecordId?: string
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  blockerLabels: string[]
  nextOperatorMessage: string
  reviewWarnings: string[]
  providerBoundary: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord
  providerReadyRecordIds: string[]
  blockedRecordIds: string[]
  liveWriteBoundaryIds: string[]
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
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelStatus, number>>
  commandCount: number
  pendingWriteIntentCount: number
  blockedCommandCount: number
  reviewedOutcomeCount: number
  blockerCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelInput {
  readModel: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceAdapter {
  recordProviderReadModel(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordProviderReadModel(input) {
      const record = buildProviderReadModelRecord(input)
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildProviderReadModelRecord({
  readModel,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord {
  const normalizedRecordedAt = normalizeIsoTimestamp(recordedAt, "recordedAt")
  return normalizeRecord({
    adapterBoundaryFingerprint: readModel.adapterBoundaryFingerprint,
    adapterBoundaryId: readModel.adapterBoundaryId,
    blockedBoundaryCount: readModel.blockedBoundaryCount,
    blockedCommandCount: readModel.blockedCommandCount,
    blockerLabels: [...readModel.blockerLabels],
    commandCount: readModel.commandCount,
    commandIdempotencyKeys: [...readModel.commandIdempotencyKeys],
    committedExecutionFingerprint: readModel.committedExecutionFingerprint,
    commitRecordId: readModel.commitRecordId,
    disposition: readModel.status === "ready_to_prepare" ? "provider_prepare_ready" : "review_only",
    evidenceFingerprints: [...readModel.evidenceFingerprints],
    followThroughId: readModel.followThroughId,
    liveWriteBoundaryFingerprint: readModel.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: readModel.liveWriteBoundaryId,
    nextOperatorMessage: readModel.nextOperatorMessage,
    pendingWriteIntentCount: readModel.pendingWriteIntentCount,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
    providerBoundary: readModel.providerBoundary,
    providerReadModelRecordId: providerReadModelRecordId(readModel, normalizedRecordedAt),
    readinessRecordId: readModel.readinessRecordId,
    readModelVersion: readModel.readModelVersion,
    readyBoundaryCount: readModel.readyBoundaryCount,
    recordedAt: normalizedRecordedAt,
    recordedBy,
    reviewedOutcomeCount: readModel.reviewedOutcomeCount,
    reviewWarnings: [...readModel.reviewWarnings],
    sourceHistoryStatus: readModel.sourceHistoryStatus,
    status: readModel.status,
    targetRfqId: readModel.targetRfqId,
    totalRecords: readModel.totalRecords,
  })
}

function normalizeSnapshot(
  snapshot:
    | LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceInitialSnapshot
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceSnapshot {
  const recordsById =
    new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord>()
  const recordKeysByIdAndRecordedAt = new Map<string, string>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const timestampKey = JSON.stringify([normalized.providerReadModelRecordId, normalized.recordedAt])
    const recordKey = stableRecordKey(normalized)
    const existingRecordKey = recordKeysByIdAndRecordedAt.get(timestampKey)
    if (existingRecordKey && existingRecordKey !== recordKey) {
      throw new Error("conflicting final-gate follow-through live-write provider read-model records cannot share providerReadModelRecordId and recordedAt")
    }
    recordKeysByIdAndRecordedAt.set(timestampKey, recordKey)
    const existing = recordsById.get(normalized.providerReadModelRecordId)
    const recordOrder = existing ? sortNewestFirst(normalized, existing) : -1
    if (!existing || recordOrder < 0) {
      recordsById.set(normalized.providerReadModelRecordId, normalized)
    } else if (recordOrder === 0 && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error("conflicting final-gate follow-through live-write provider read-model records cannot share providerReadModelRecordId and recordedAt")
    }
  }
  const records = [...recordsById.values()].sort(sortNewestFirst)

  return {
    adapterBoundaryFingerprints: uniqueSorted(records.flatMap((record) => record.adapterBoundaryFingerprint ? [record.adapterBoundaryFingerprint] : [])),
    adapterBoundaryIds: uniqueSorted(records.flatMap((record) => record.adapterBoundaryId ? [record.adapterBoundaryId] : [])),
    blockedCommandCount: records.reduce((total, record) => total + record.blockedCommandCount, 0),
    blockedRecordIds: uniqueSorted(
      records.filter((record) => record.disposition === "review_only").map((record) => record.providerReadModelRecordId),
    ),
    blockerCount: records.reduce((total, record) => total + record.blockerLabels.length, 0),
    commandCount: records.reduce((total, record) => total + record.commandCount, 0),
    commandIdempotencyKeys: uniqueSorted(records.flatMap((record) => record.commandIdempotencyKeys)),
    committedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.committedExecutionFingerprint ? [record.committedExecutionFingerprint] : []),
    ),
    commitRecordIds: uniqueSorted(records.flatMap((record) => record.commitRecordId ? [record.commitRecordId] : [])),
    evidenceFingerprints: uniqueSorted(records.flatMap((record) => record.evidenceFingerprints)),
    followThroughIds: uniqueSorted(records.flatMap((record) => record.followThroughId ? [record.followThroughId] : [])),
    latestRecord: records[0],
    liveWriteBoundaryFingerprints: uniqueSorted(
      records.flatMap((record) => record.liveWriteBoundaryFingerprint ? [record.liveWriteBoundaryFingerprint] : []),
    ),
    liveWriteBoundaryIds: uniqueSorted(records.flatMap((record) => record.liveWriteBoundaryId ? [record.liveWriteBoundaryId] : [])),
    pendingWriteIntentCount: records.reduce((total, record) => total + record.pendingWriteIntentCount, 0),
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
    providerReadyRecordIds: uniqueSorted(
      records.filter((record) => record.disposition === "provider_prepare_ready").map((record) => record.providerReadModelRecordId),
    ),
    readinessRecordIds: uniqueSorted(records.flatMap((record) => record.readinessRecordId ? [record.readinessRecordId] : [])),
    recordCount: records.length,
    records,
    reviewedOutcomeCount: records.reduce((total, record) => total + record.reviewedOutcomeCount, 0),
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.reviewWarnings.length, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord {
  const normalized = {
    adapterBoundaryFingerprint: optionalTrim(record.adapterBoundaryFingerprint),
    adapterBoundaryId: optionalTrim(record.adapterBoundaryId),
    blockedBoundaryCount: nonNegativeInteger(record.blockedBoundaryCount, "blockedBoundaryCount"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    commandIdempotencyKeys: uniqueSorted(record.commandIdempotencyKeys.map((key) => nonBlank(key, "commandIdempotencyKey"))),
    committedExecutionFingerprint: optionalTrim(record.committedExecutionFingerprint),
    commitRecordId: optionalTrim(record.commitRecordId),
    disposition: normalizeDisposition(record.disposition),
    evidenceFingerprints: uniqueSorted(record.evidenceFingerprints.map((fingerprint) => nonBlank(fingerprint, "evidenceFingerprint"))),
    followThroughId: optionalTrim(record.followThroughId),
    liveWriteBoundaryFingerprint: optionalTrim(record.liveWriteBoundaryFingerprint),
    liveWriteBoundaryId: optionalTrim(record.liveWriteBoundaryId),
    nextOperatorMessage: nonBlank(record.nextOperatorMessage, "nextOperatorMessage"),
    pendingWriteIntentCount: nonNegativeInteger(record.pendingWriteIntentCount, "pendingWriteIntentCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    providerBoundary: nonBlank(record.providerBoundary, "providerBoundary"),
    providerReadModelRecordId: nonBlank(record.providerReadModelRecordId, "providerReadModelRecordId"),
    readinessRecordId: optionalTrim(record.readinessRecordId),
    readModelVersion: normalizeReadModelVersion(record.readModelVersion),
    readyBoundaryCount: nonNegativeInteger(record.readyBoundaryCount, "readyBoundaryCount"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewedOutcomeCount: nonNegativeInteger(record.reviewedOutcomeCount, "reviewedOutcomeCount"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    sourceHistoryStatus: normalizeSourceHistoryStatus(record.sourceHistoryStatus),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    totalRecords: nonNegativeInteger(record.totalRecords, "totalRecords"),
  }

  if (normalized.status === "ready_to_prepare" && normalized.disposition !== "provider_prepare_ready") {
    throw new Error("ready final-gate follow-through live-write provider read-model records must use provider_prepare_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked final-gate follow-through live-write provider read-model records must use review_only disposition")
  }
  validateReadyEvidence(normalized)
  validateBlockedEvidenceGating(normalized)

  return normalized
}

function validateReadyEvidence(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
): void {
  if (record.status !== "ready_to_prepare") {
    return
  }
  const requiredFields = [
    record.liveWriteBoundaryId,
    record.liveWriteBoundaryFingerprint,
    record.adapterBoundaryId,
    record.adapterBoundaryFingerprint,
    record.commitRecordId,
    record.committedExecutionFingerprint,
    record.followThroughId,
    record.targetRfqId,
    record.readinessRecordId,
  ]
  if (requiredFields.some((value) => value === undefined)) {
    throw new Error("ready final-gate follow-through live-write provider read-model records require complete provider evidence")
  }
  if (record.pendingWriteIntentCount === 0 || record.commandIdempotencyKeys.length === 0 || record.evidenceFingerprints.length === 0) {
    throw new Error("ready final-gate follow-through live-write provider read-model records require pending write evidence")
  }
}

function validateBlockedEvidenceGating(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
): void {
  if (record.status !== "blocked") {
    return
  }
  const evidenceFields = [
    record.liveWriteBoundaryId,
    record.liveWriteBoundaryFingerprint,
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
    throw new Error("blocked final-gate follow-through live-write provider read-model records cannot include provider evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceSnapshot {
  return {
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    adapterBoundaryIds: [...snapshot.adapterBoundaryIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedRecordIds: [...snapshot.blockedRecordIds],
    blockerCount: snapshot.blockerCount,
    commandCount: snapshot.commandCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    followThroughIds: [...snapshot.followThroughIds],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    liveWriteBoundaryFingerprints: [...snapshot.liveWriteBoundaryFingerprints],
    liveWriteBoundaryIds: [...snapshot.liveWriteBoundaryIds],
    pendingWriteIntentCount: snapshot.pendingWriteIntentCount,
    persistenceVersion: snapshot.persistenceVersion,
    providerReadyRecordIds: [...snapshot.providerReadyRecordIds],
    readinessRecordIds: [...snapshot.readinessRecordIds],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    reviewedOutcomeCount: snapshot.reviewedOutcomeCount,
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord {
  return {
    adapterBoundaryFingerprint: record.adapterBoundaryFingerprint,
    adapterBoundaryId: record.adapterBoundaryId,
    blockedBoundaryCount: record.blockedBoundaryCount,
    blockedCommandCount: record.blockedCommandCount,
    blockerLabels: [...record.blockerLabels],
    commandCount: record.commandCount,
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    committedExecutionFingerprint: record.committedExecutionFingerprint,
    commitRecordId: record.commitRecordId,
    disposition: record.disposition,
    evidenceFingerprints: [...record.evidenceFingerprints],
    followThroughId: record.followThroughId,
    liveWriteBoundaryFingerprint: record.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: record.liveWriteBoundaryId,
    nextOperatorMessage: record.nextOperatorMessage,
    pendingWriteIntentCount: record.pendingWriteIntentCount,
    persistenceVersion: record.persistenceVersion,
    providerBoundary: record.providerBoundary,
    providerReadModelRecordId: record.providerReadModelRecordId,
    readinessRecordId: record.readinessRecordId,
    readModelVersion: record.readModelVersion,
    readyBoundaryCount: record.readyBoundaryCount,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewedOutcomeCount: record.reviewedOutcomeCount,
    reviewWarnings: [...record.reviewWarnings],
    sourceHistoryStatus: record.sourceHistoryStatus,
    status: record.status,
    targetRfqId: record.targetRfqId,
    totalRecords: record.totalRecords,
  }
}

function providerReadModelRecordId(
  readModel: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel,
  recordedAt: string,
): string {
  return readModel.liveWriteBoundaryId
    ? `final-gate-live-write-provider-read-model:${readModel.liveWriteBoundaryId}`
    : `final-gate-live-write-provider-read-model:${readModel.status}:${readModel.sourceHistoryStatus}:${recordedAt}`
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.providerReadModelRecordId, right.providerReadModelRecordId) ||
    compareLex(left.status, right.status) ||
    compareLex(left.disposition, right.disposition) ||
    compareLex(left.liveWriteBoundaryId ?? "", right.liveWriteBoundaryId ?? "") ||
    compareLex(left.liveWriteBoundaryFingerprint ?? "", right.liveWriteBoundaryFingerprint ?? "") ||
    compareLex(left.adapterBoundaryId ?? "", right.adapterBoundaryId ?? "") ||
    compareLex(left.adapterBoundaryFingerprint ?? "", right.adapterBoundaryFingerprint ?? "") ||
    compareLex(left.commitRecordId ?? "", right.commitRecordId ?? "") ||
    compareLex(left.committedExecutionFingerprint ?? "", right.committedExecutionFingerprint ?? "") ||
    compareLex(left.followThroughId ?? "", right.followThroughId ?? "") ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.readinessRecordId ?? "", right.readinessRecordId ?? "") ||
    compareLex(left.sourceHistoryStatus, right.sourceHistoryStatus) ||
    compareLex(left.recordedBy, right.recordedBy) ||
    compareLex(left.readModelVersion, right.readModelVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.totalRecords, right.totalRecords) ||
    compareNumber(left.readyBoundaryCount, right.readyBoundaryCount) ||
    compareNumber(left.blockedBoundaryCount, right.blockedBoundaryCount) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.pendingWriteIntentCount, right.pendingWriteIntentCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.reviewedOutcomeCount, right.reviewedOutcomeCount) ||
    compareLex(left.commandIdempotencyKeys.join("\n"), right.commandIdempotencyKeys.join("\n")) ||
    compareLex(left.evidenceFingerprints.join("\n"), right.evidenceFingerprints.join("\n")) ||
    compareLex(left.blockerLabels.join("\n"), right.blockerLabels.join("\n")) ||
    compareLex(left.reviewWarnings.join("\n"), right.reviewWarnings.join("\n")) ||
    compareLex(left.nextOperatorMessage, right.nextOperatorMessage) ||
    compareLex(left.providerBoundary, right.providerBoundary)
  )
}

function stableRecordKey(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
): string {
  return JSON.stringify(Object.entries(record).sort(([left], [right]) => compareLex(left, right)))
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelStatus, number>>>(
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION
  ) {
    throw new Error("persistenceVersion is not a supported final-gate follow-through live-write provider read-model persistence version")
  }
  return version
}

function normalizeReadModelVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord["readModelVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION
  ) {
    throw new Error("readModelVersion is not a supported final-gate follow-through live-write provider read-model version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelDisposition,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelDisposition {
  if (disposition !== "provider_prepare_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported final-gate follow-through live-write provider read-model disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelStatus {
  if (status !== "blocked" && status !== "ready_to_prepare") {
    throw new Error("status is not a supported final-gate follow-through live-write provider read-model status")
  }
  return status
}

function normalizeSourceHistoryStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel["sourceHistoryStatus"],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel["sourceHistoryStatus"] {
  if (status !== "blocked" && status !== "empty" && status !== "ready") {
    throw new Error("sourceHistoryStatus is not a supported final-gate follow-through live-write provider read-model source status")
  }
  return status
}
