import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-adapter-boundary-persistence.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryDisposition =
  | "provider_adapter_ready"
  | "review_only"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION
  providerAdapterBoundaryVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION
  providerAdapterBoundaryId: string
  providerAdapterBoundaryFingerprint: string
  requestedAt: string
  requestedBy: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryDisposition
  sourceHistoryStatus: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary["sourceHistoryStatus"]
  providerReadModelRecordId?: string
  liveWriteBoundaryId?: string
  liveWriteBoundaryFingerprint?: string
  adapterBoundaryId?: string
  adapterBoundaryFingerprint?: string
  commitRecordId?: string
  committedExecutionFingerprint?: string
  followThroughId?: string
  targetRfqId?: string
  readinessRecordId?: string
  totalRecords: number
  providerReadyCount: number
  blockedReadModelCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  blockerCount: number
  warningCount: number
  nextActionCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  commandStatuses: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandStatus[]
  commandIdempotencyKeys: string[]
  sourceCommandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  operatorSummary: string
  providerBoundary: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord
  readyBoundaryIds: string[]
  blockedBoundaryIds: string[]
  providerAdapterBoundaryFingerprints: string[]
  providerReadModelRecordIds: string[]
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
  sourceCommandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus, number>>
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  blockerCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryInput {
  providerAdapterBoundary: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceAdapter {
  recordProviderAdapterBoundary(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordProviderAdapterBoundary(input) {
      const record = buildProviderAdapterBoundaryRecord(input)
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildProviderAdapterBoundaryRecord({
  providerAdapterBoundary,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  return normalizeRecord({
    adapterBoundaryFingerprint: providerAdapterBoundary.adapterBoundaryFingerprint,
    adapterBoundaryId: providerAdapterBoundary.adapterBoundaryId,
    blockedCommandCount: providerAdapterBoundary.blockedCommandCount,
    blockedReadModelCount: providerAdapterBoundary.blockedReadModelCount,
    blockerCount: providerAdapterBoundary.blockerLabels.length,
    blockerLabels: [...providerAdapterBoundary.blockerLabels],
    commandCount: providerAdapterBoundary.commandCount,
    commandIdempotencyKeys: providerAdapterBoundary.commands.flatMap((command) => command.idempotencyKey ? [command.idempotencyKey] : []),
    commandStatuses: providerAdapterBoundary.commands.map((command) => command.status),
    committedExecutionFingerprint: providerAdapterBoundary.committedExecutionFingerprint,
    commitRecordId: providerAdapterBoundary.commitRecordId,
    disposition: providerAdapterBoundary.status === "ready" ? "provider_adapter_ready" : "review_only",
    evidenceFingerprints: providerAdapterBoundary.commands.flatMap((command) => command.evidenceFingerprints),
    followThroughId: providerAdapterBoundary.followThroughId,
    liveWriteBoundaryFingerprint: providerAdapterBoundary.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: providerAdapterBoundary.liveWriteBoundaryId,
    nextActionCount: providerAdapterBoundary.nextActionLabels.length,
    nextActionLabels: [...providerAdapterBoundary.nextActionLabels],
    operatorSummary: providerAdapterBoundary.operatorSummary,
    pendingWriteIntentCount: providerAdapterBoundary.pendingWriteIntentCount,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: providerAdapterBoundary.plannedCommandCount,
    providerAdapterBoundaryFingerprint: providerAdapterBoundary.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: providerAdapterBoundary.providerAdapterBoundaryId,
    providerAdapterBoundaryVersion: providerAdapterBoundary.providerAdapterBoundaryVersion,
    providerBoundary: providerAdapterBoundary.providerBoundary,
    providerReadyCount: providerAdapterBoundary.providerReadyCount,
    providerReadModelRecordId: providerAdapterBoundary.providerReadModelRecordId,
    readinessRecordId: providerAdapterBoundary.readinessRecordId,
    recordedAt,
    recordedBy,
    requestedAt: providerAdapterBoundary.requestedAt,
    requestedBy: providerAdapterBoundary.requestedBy,
    reviewedOutcomeCount: providerAdapterBoundary.reviewedOutcomeCount,
    reviewWarnings: [...providerAdapterBoundary.reviewWarnings],
    sourceCommandIdempotencyKeys: [...providerAdapterBoundary.sourceCommandIdempotencyKeys],
    sourceHistoryStatus: providerAdapterBoundary.sourceHistoryStatus,
    status: providerAdapterBoundary.status,
    targetRfqId: providerAdapterBoundary.targetRfqId,
    totalRecords: providerAdapterBoundary.totalRecords,
    warningCount: providerAdapterBoundary.reviewWarnings.length,
  })
}

function normalizeSnapshot(
  snapshot:
    | LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceInitialSnapshot
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceSnapshot {
  const recordsByBoundaryId =
    new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord>()
  const recordKeysByIdAndRecordedAt = new Map<string, string>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const timestampKey = JSON.stringify([normalized.providerAdapterBoundaryId, normalized.recordedAt])
    const recordKey = stableRecordKey(normalized)
    const existingRecordKey = recordKeysByIdAndRecordedAt.get(timestampKey)
    if (existingRecordKey && existingRecordKey !== recordKey) {
      throw new Error("conflicting final-gate follow-through provider-adapter boundary records cannot share providerAdapterBoundaryId and recordedAt")
    }
    recordKeysByIdAndRecordedAt.set(timestampKey, recordKey)
    const existing = recordsByBoundaryId.get(normalized.providerAdapterBoundaryId)
    const recordOrder = existing ? sortNewestFirst(normalized, existing) : -1
    if (!existing || recordOrder < 0) {
      recordsByBoundaryId.set(normalized.providerAdapterBoundaryId, normalized)
    } else if (recordOrder === 0 && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error("conflicting final-gate follow-through provider-adapter boundary records cannot share providerAdapterBoundaryId and recordedAt")
    }
  }
  const records = [...recordsByBoundaryId.values()].sort(sortNewestFirst)

  return {
    adapterBoundaryFingerprints: uniqueSorted(records.flatMap((record) => record.adapterBoundaryFingerprint ? [record.adapterBoundaryFingerprint] : [])),
    adapterBoundaryIds: uniqueSorted(records.flatMap((record) => record.adapterBoundaryId ? [record.adapterBoundaryId] : [])),
    blockedBoundaryIds: uniqueSorted(
      records.filter((record) => record.disposition === "review_only").map((record) => record.providerAdapterBoundaryId),
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
    liveWriteBoundaryFingerprints: uniqueSorted(
      records.flatMap((record) => record.liveWriteBoundaryFingerprint ? [record.liveWriteBoundaryFingerprint] : []),
    ),
    liveWriteBoundaryIds: uniqueSorted(records.flatMap((record) => record.liveWriteBoundaryId ? [record.liveWriteBoundaryId] : [])),
    pendingWriteIntentCount: records.reduce((total, record) => total + record.pendingWriteIntentCount, 0),
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: records.reduce((total, record) => total + record.plannedCommandCount, 0),
    providerAdapterBoundaryFingerprints: uniqueSorted(records.map((record) => record.providerAdapterBoundaryFingerprint)),
    providerReadModelRecordIds: uniqueSorted(
      records.flatMap((record) => record.providerReadModelRecordId ? [record.providerReadModelRecordId] : []),
    ),
    readinessRecordIds: uniqueSorted(records.flatMap((record) => record.readinessRecordId ? [record.readinessRecordId] : [])),
    readyBoundaryIds: uniqueSorted(
      records.filter((record) => record.disposition === "provider_adapter_ready").map((record) => record.providerAdapterBoundaryId),
    ),
    recordCount: records.length,
    records,
    reviewedOutcomeCount: records.reduce((total, record) => total + record.reviewedOutcomeCount, 0),
    sourceCommandIdempotencyKeys: uniqueSorted(records.flatMap((record) => record.sourceCommandIdempotencyKeys)),
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  const normalized = {
    adapterBoundaryFingerprint: optionalTrim(record.adapterBoundaryFingerprint),
    adapterBoundaryId: optionalTrim(record.adapterBoundaryId),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    blockedReadModelCount: nonNegativeInteger(record.blockedReadModelCount, "blockedReadModelCount"),
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
    liveWriteBoundaryFingerprint: optionalTrim(record.liveWriteBoundaryFingerprint),
    liveWriteBoundaryId: optionalTrim(record.liveWriteBoundaryId),
    nextActionCount: nonNegativeInteger(record.nextActionCount, "nextActionCount"),
    nextActionLabels: record.nextActionLabels.map((label) => nonBlank(label, "nextActionLabel")),
    operatorSummary: nonBlank(record.operatorSummary, "operatorSummary"),
    pendingWriteIntentCount: nonNegativeInteger(record.pendingWriteIntentCount, "pendingWriteIntentCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    plannedCommandCount: nonNegativeInteger(record.plannedCommandCount, "plannedCommandCount"),
    providerAdapterBoundaryFingerprint: nonBlank(record.providerAdapterBoundaryFingerprint, "providerAdapterBoundaryFingerprint"),
    providerAdapterBoundaryId: nonBlank(record.providerAdapterBoundaryId, "providerAdapterBoundaryId"),
    providerAdapterBoundaryVersion: normalizeProviderAdapterBoundaryVersion(record.providerAdapterBoundaryVersion),
    providerBoundary: nonBlank(record.providerBoundary, "providerBoundary"),
    providerReadyCount: nonNegativeInteger(record.providerReadyCount, "providerReadyCount"),
    providerReadModelRecordId: optionalTrim(record.providerReadModelRecordId),
    readinessRecordId: optionalTrim(record.readinessRecordId),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    requestedAt: normalizeIsoTimestamp(record.requestedAt, "requestedAt"),
    requestedBy: nonBlank(record.requestedBy, "requestedBy"),
    reviewedOutcomeCount: nonNegativeInteger(record.reviewedOutcomeCount, "reviewedOutcomeCount"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    sourceCommandIdempotencyKeys: uniqueSorted(record.sourceCommandIdempotencyKeys.map((key) => nonBlank(key, "sourceCommandIdempotencyKey"))),
    sourceHistoryStatus: normalizeSourceHistoryStatus(record.sourceHistoryStatus),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    totalRecords: nonNegativeInteger(record.totalRecords, "totalRecords"),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commandCount !== normalized.plannedCommandCount + normalized.blockedCommandCount) {
    throw new Error("commandCount must equal plannedCommandCount plus blockedCommandCount")
  }
  if (normalized.commandStatuses.length !== normalized.commandCount) {
    throw new Error("commandStatuses length must equal commandCount")
  }
  const plannedStatusCount = normalized.commandStatuses.filter((status) => status === "planned").length
  const blockedStatusCount = normalized.commandStatuses.filter((status) => status === "blocked").length
  if (
    plannedStatusCount !== normalized.plannedCommandCount ||
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
  if (normalized.status === "ready" && normalized.disposition !== "provider_adapter_ready") {
    throw new Error("ready final-gate follow-through provider-adapter boundary records must use provider_adapter_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked final-gate follow-through provider-adapter boundary records must use review_only disposition")
  }
  validateReadyEvidence(normalized)
  validateBlockedEvidenceGating(normalized)

  return normalized
}

function validateReadyEvidence(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
): void {
  if (record.status !== "ready") {
    return
  }
  const requiredFields = [
    record.providerReadModelRecordId,
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
    throw new Error("ready final-gate follow-through provider-adapter boundary records require complete provider evidence")
  }
  if (
    record.plannedCommandCount === 0 ||
    record.commandIdempotencyKeys.length === 0 ||
    record.sourceCommandIdempotencyKeys.length === 0 ||
    record.evidenceFingerprints.length === 0
  ) {
    throw new Error("ready final-gate follow-through provider-adapter boundary records require planned provider command evidence")
  }
}

function validateBlockedEvidenceGating(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
): void {
  if (record.status !== "blocked") {
    return
  }
  const evidenceFields = [
    record.providerReadModelRecordId,
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
    record.sourceCommandIdempotencyKeys.length > 0 ||
    record.evidenceFingerprints.length > 0
  ) {
    throw new Error("blocked final-gate follow-through provider-adapter boundary records cannot include provider evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceSnapshot {
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
    liveWriteBoundaryIds: [...snapshot.liveWriteBoundaryIds],
    pendingWriteIntentCount: snapshot.pendingWriteIntentCount,
    persistenceVersion: snapshot.persistenceVersion,
    plannedCommandCount: snapshot.plannedCommandCount,
    providerAdapterBoundaryFingerprints: [...snapshot.providerAdapterBoundaryFingerprints],
    providerReadModelRecordIds: [...snapshot.providerReadModelRecordIds],
    readinessRecordIds: [...snapshot.readinessRecordIds],
    readyBoundaryIds: [...snapshot.readyBoundaryIds],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    reviewedOutcomeCount: snapshot.reviewedOutcomeCount,
    sourceCommandIdempotencyKeys: [...snapshot.sourceCommandIdempotencyKeys],
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  return {
    adapterBoundaryFingerprint: record.adapterBoundaryFingerprint,
    adapterBoundaryId: record.adapterBoundaryId,
    blockedCommandCount: record.blockedCommandCount,
    blockedReadModelCount: record.blockedReadModelCount,
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
    liveWriteBoundaryFingerprint: record.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: record.liveWriteBoundaryId,
    nextActionCount: record.nextActionCount,
    nextActionLabels: [...record.nextActionLabels],
    operatorSummary: record.operatorSummary,
    pendingWriteIntentCount: record.pendingWriteIntentCount,
    persistenceVersion: record.persistenceVersion,
    plannedCommandCount: record.plannedCommandCount,
    providerAdapterBoundaryFingerprint: record.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: record.providerAdapterBoundaryId,
    providerAdapterBoundaryVersion: record.providerAdapterBoundaryVersion,
    providerBoundary: record.providerBoundary,
    providerReadyCount: record.providerReadyCount,
    providerReadModelRecordId: record.providerReadModelRecordId,
    readinessRecordId: record.readinessRecordId,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    requestedAt: record.requestedAt,
    requestedBy: record.requestedBy,
    reviewedOutcomeCount: record.reviewedOutcomeCount,
    reviewWarnings: [...record.reviewWarnings],
    sourceCommandIdempotencyKeys: [...record.sourceCommandIdempotencyKeys],
    sourceHistoryStatus: record.sourceHistoryStatus,
    status: record.status,
    targetRfqId: record.targetRfqId,
    totalRecords: record.totalRecords,
    warningCount: record.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.providerAdapterBoundaryId, right.providerAdapterBoundaryId) ||
    compareLex(left.providerAdapterBoundaryFingerprint, right.providerAdapterBoundaryFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.disposition, right.disposition) ||
    compareLex(left.providerReadModelRecordId ?? "", right.providerReadModelRecordId ?? "") ||
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
    compareLex(left.requestedAt, right.requestedAt) ||
    compareLex(left.requestedBy, right.requestedBy) ||
    compareLex(left.recordedBy, right.recordedBy) ||
    compareLex(left.providerAdapterBoundaryVersion, right.providerAdapterBoundaryVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.totalRecords, right.totalRecords) ||
    compareNumber(left.providerReadyCount, right.providerReadyCount) ||
    compareNumber(left.blockedReadModelCount, right.blockedReadModelCount) ||
    compareNumber(left.pendingWriteIntentCount, right.pendingWriteIntentCount) ||
    compareNumber(left.reviewedOutcomeCount, right.reviewedOutcomeCount) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.plannedCommandCount, right.plannedCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount) ||
    compareNumber(left.nextActionCount, right.nextActionCount) ||
    compareLex(left.commandStatuses.join("\n"), right.commandStatuses.join("\n")) ||
    compareLex(left.commandIdempotencyKeys.join("\n"), right.commandIdempotencyKeys.join("\n")) ||
    compareLex(left.sourceCommandIdempotencyKeys.join("\n"), right.sourceCommandIdempotencyKeys.join("\n")) ||
    compareLex(left.evidenceFingerprints.join("\n"), right.evidenceFingerprints.join("\n")) ||
    compareLex(left.blockerLabels.join("\n"), right.blockerLabels.join("\n")) ||
    compareLex(left.reviewWarnings.join("\n"), right.reviewWarnings.join("\n")) ||
    compareLex(left.nextActionLabels.join("\n"), right.nextActionLabels.join("\n")) ||
    compareLex(left.operatorSummary, right.operatorSummary) ||
    compareLex(left.providerBoundary, right.providerBoundary)
  )
}

function stableRecordKey(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
): string {
  return JSON.stringify(Object.entries(record).sort(([left], [right]) => compareLex(left, right)))
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus, number>>>(
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION
  ) {
    throw new Error("persistenceVersion is not a supported final-gate follow-through provider-adapter boundary persistence version")
  }
  return version
}

function normalizeProviderAdapterBoundaryVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord["providerAdapterBoundaryVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION
  ) {
    throw new Error("providerAdapterBoundaryVersion is not a supported final-gate follow-through provider-adapter boundary version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryDisposition,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryDisposition {
  if (disposition !== "provider_adapter_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported final-gate follow-through provider-adapter boundary disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported final-gate follow-through provider-adapter boundary status")
  }
  return status
}

function normalizeCommandStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandStatus {
  if (status !== "blocked" && status !== "planned") {
    throw new Error("command status is not a supported final-gate follow-through provider-adapter boundary command status")
  }
  return status
}

function normalizeSourceHistoryStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary["sourceHistoryStatus"],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary["sourceHistoryStatus"] {
  if (status !== "blocked" && status !== "empty" && status !== "ready_to_prepare") {
    throw new Error("sourceHistoryStatus is not a supported final-gate follow-through provider-adapter boundary source status")
  }
  return status
}
