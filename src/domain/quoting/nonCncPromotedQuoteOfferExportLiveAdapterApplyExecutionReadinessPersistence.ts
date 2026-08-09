import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import { fingerprintNonCncPromotedQuoteOfferExportPackagePayload } from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-readiness-persistence.v1"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION
  readinessVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION
  readinessRecordId: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessStatus
  targetRfqId: string
  requestedAt: string
  requestedBy: string
  persistedRunCount: number
  appliedCommandCount: number
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestApplyPlanFingerprint?: string
  latestCommitPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  latestStatus?: string
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord
  readyRecordIds: string[]
  blockedRecordIds: string[]
  targetRfqIds: string[]
  latestExecutionFingerprints: string[]
  latestApplyPlanIds: string[]
  latestCommitRecordIds: string[]
  latestCommittedExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessStatus, number>>
  blockerCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessInput {
  readiness: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceAdapter {
  recordReadiness(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordReadiness(input) {
      const record = buildReadinessRecord(input)
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildReadinessRecord({
  readiness,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  return normalizeRecord({
    appliedCommandCount: readiness.appliedCommandCount,
    blockerCount: readiness.blockerLabels.length,
    blockerLabels: [...readiness.blockerLabels],
    latestApplyPlanFingerprint: readiness.latestApplyPlanFingerprint,
    latestApplyPlanId: readiness.latestApplyPlanId,
    latestCommitPlanId: readiness.latestCommitPlanId,
    latestCommitRecordId: readiness.latestCommitRecordId,
    latestCommittedExecutionFingerprint: readiness.latestCommittedExecutionFingerprint,
    latestExecutionFingerprint: readiness.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: readiness.latestSourceExecutionFingerprint,
    latestStatus: readiness.latestStatus,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
    persistedRunCount: readiness.persistedRunCount,
    readinessRecordId: fingerprintReadiness(readiness),
    readinessVersion: readiness.readinessVersion,
    recordedAt,
    recordedBy,
    requestedAt: readiness.requestedAt,
    requestedBy: readiness.requestedBy,
    reviewWarnings: [...readiness.reviewWarnings],
    status: readiness.status,
    targetRfqId: readiness.targetRfqId,
    warningCount: readiness.reviewWarnings.length,
  })
}

function normalizeSnapshot(
  snapshot: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceInitialSnapshot | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceSnapshot {
  const recordsByReadinessId = new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByReadinessId.get(normalized.readinessRecordId)
    if (
      existing &&
      normalized.recordedAt === existing.recordedAt &&
      stableRecordKey(normalized) !== stableRecordKey(existing)
    ) {
      throw new Error("conflicting live-adapter apply execution readiness records cannot share readinessRecordId and recordedAt")
    }
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByReadinessId.set(normalized.readinessRecordId, normalized)
    }
  }
  const records = [...recordsByReadinessId.values()].sort(sortNewestFirst)

  return {
    blockedRecordIds: uniqueSorted(
      records.filter((record) => record.status === "blocked").map((record) => record.readinessRecordId),
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
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
    readyRecordIds: uniqueSorted(
      records.filter((record) => record.status === "ready").map((record) => record.readinessRecordId),
    ),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.map((record) => record.targetRfqId)),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  const normalized = {
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "appliedCommandCount"),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    latestApplyPlanFingerprint: optionalTrim(record.latestApplyPlanFingerprint),
    latestApplyPlanId: optionalTrim(record.latestApplyPlanId),
    latestCommitPlanId: optionalTrim(record.latestCommitPlanId),
    latestCommitRecordId: optionalTrim(record.latestCommitRecordId),
    latestCommittedExecutionFingerprint: optionalTrim(record.latestCommittedExecutionFingerprint),
    latestExecutionFingerprint: optionalTrim(record.latestExecutionFingerprint),
    latestSourceExecutionFingerprint: optionalTrim(record.latestSourceExecutionFingerprint),
    latestStatus: optionalTrim(record.latestStatus),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    persistedRunCount: nonNegativeInteger(record.persistedRunCount, "persistedRunCount"),
    readinessRecordId: nonBlank(record.readinessRecordId, "readinessRecordId"),
    readinessVersion: normalizeReadinessVersion(record.readinessVersion),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    requestedAt: normalizeIsoTimestamp(record.requestedAt, "requestedAt"),
    requestedBy: nonBlank(record.requestedBy, "requestedBy"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    status: normalizeStatus(record.status),
    targetRfqId: nonBlank(record.targetRfqId, "targetRfqId"),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  validateEvidenceGating(normalized)

  return normalized
}

function validateEvidenceGating(record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord): void {
  const evidenceFields = [
    record.latestApplyPlanFingerprint,
    record.latestApplyPlanId,
    record.latestCommitPlanId,
    record.latestCommitRecordId,
    record.latestCommittedExecutionFingerprint,
    record.latestExecutionFingerprint,
    record.latestSourceExecutionFingerprint,
  ]
  if (record.status === "blocked" && (record.appliedCommandCount > 0 || evidenceFields.some((value) => value !== undefined))) {
    throw new Error("blocked live-adapter apply execution readiness records cannot include ready evidence identifiers")
  }
  if (record.status === "ready" && record.blockerCount > 0) {
    throw new Error("ready live-adapter apply execution readiness records cannot include blockers")
  }
  if (record.status === "ready" && record.appliedCommandCount === 0) {
    throw new Error("ready live-adapter apply execution readiness records require applied commands")
  }
  if (record.status === "ready" && evidenceFields.some((value) => value === undefined)) {
    throw new Error("ready live-adapter apply execution readiness records require complete evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceSnapshot {
  return {
    blockedRecordIds: [...snapshot.blockedRecordIds],
    blockerCount: snapshot.blockerCount,
    latestApplyPlanIds: [...snapshot.latestApplyPlanIds],
    latestCommitRecordIds: [...snapshot.latestCommitRecordIds],
    latestCommittedExecutionFingerprints: [...snapshot.latestCommittedExecutionFingerprints],
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    persistenceVersion: snapshot.persistenceVersion,
    readyRecordIds: [...snapshot.readyRecordIds],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  return {
    appliedCommandCount: record.appliedCommandCount,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    latestApplyPlanFingerprint: record.latestApplyPlanFingerprint,
    latestApplyPlanId: record.latestApplyPlanId,
    latestCommitPlanId: record.latestCommitPlanId,
    latestCommitRecordId: record.latestCommitRecordId,
    latestCommittedExecutionFingerprint: record.latestCommittedExecutionFingerprint,
    latestExecutionFingerprint: record.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    latestStatus: record.latestStatus,
    persistenceVersion: record.persistenceVersion,
    persistedRunCount: record.persistedRunCount,
    readinessRecordId: record.readinessRecordId,
    readinessVersion: record.readinessVersion,
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
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.readinessRecordId, right.readinessRecordId) ||
    compareLex(left.targetRfqId, right.targetRfqId) ||
    compareLex(left.status, right.status) ||
    compareLex(left.requestedAt, right.requestedAt) ||
    compareLex(left.requestedBy, right.requestedBy) ||
    compareLex(left.latestExecutionFingerprint ?? "", right.latestExecutionFingerprint ?? "") ||
    compareLex(left.latestApplyPlanId ?? "", right.latestApplyPlanId ?? "") ||
    compareLex(left.latestApplyPlanFingerprint ?? "", right.latestApplyPlanFingerprint ?? "") ||
    compareLex(left.latestCommitPlanId ?? "", right.latestCommitPlanId ?? "") ||
    compareLex(left.latestCommitRecordId ?? "", right.latestCommitRecordId ?? "") ||
    compareLex(left.latestCommittedExecutionFingerprint ?? "", right.latestCommittedExecutionFingerprint ?? "") ||
    compareLex(left.latestSourceExecutionFingerprint ?? "", right.latestSourceExecutionFingerprint ?? "") ||
    compareLex(left.recordedBy, right.recordedBy) ||
    compareNumber(left.persistedRunCount, right.persistedRunCount) ||
    compareNumber(left.appliedCommandCount, right.appliedCommandCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessStatus, number>>>(
    (counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function fingerprintReadiness(readiness: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness): string {
  return `non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-readiness-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({
      requestedAt: readiness.requestedAt,
      targetRfqId: readiness.targetRfqId,
    }),
  )}`
}

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

function stableRecordKey(record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord): string {
  return JSON.stringify({
    appliedCommandCount: record.appliedCommandCount,
    blockerCount: record.blockerCount,
    blockerLabels: record.blockerLabels,
    latestApplyPlanFingerprint: record.latestApplyPlanFingerprint,
    latestApplyPlanId: record.latestApplyPlanId,
    latestCommitPlanId: record.latestCommitPlanId,
    latestCommitRecordId: record.latestCommitRecordId,
    latestCommittedExecutionFingerprint: record.latestCommittedExecutionFingerprint,
    latestExecutionFingerprint: record.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    latestStatus: record.latestStatus,
    persistenceVersion: record.persistenceVersion,
    persistedRunCount: record.persistedRunCount,
    readinessRecordId: record.readinessRecordId,
    readinessVersion: record.readinessVersion,
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION) {
    throw new Error(
      "persistenceVersion is not a supported non-CNC live-adapter apply execution readiness persistence version",
    )
  }
  return version
}

function normalizeReadinessVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord["readinessVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION) {
    throw new Error("readinessVersion is not a supported non-CNC live-adapter apply execution readiness version")
  }
  return version
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC live-adapter apply execution readiness status")
  }
  return status
}
