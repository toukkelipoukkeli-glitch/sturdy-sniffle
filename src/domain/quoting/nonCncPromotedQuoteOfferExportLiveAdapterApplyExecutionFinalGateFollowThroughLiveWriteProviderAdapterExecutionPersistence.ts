import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_MODES,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_STATUSES,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-adapter-execution-persistence.v1"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun["mode"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus
  providerAdapterBoundaryId?: string
  providerAdapterBoundaryFingerprint?: string
  providerAdapterBoundaryVersion?: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION
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
  commandCount: number
  plannedCommandCount: number
  appliedCommandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  historyRecordCount: number
  readyRecordCount: number
  blockedRecordCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  nextActionCount: number
  warningCount: number
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  externalIds: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord[]
  latestRun?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord
  providerAdapterBoundaryIds: string[]
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
  evidenceFingerprints: string[]
  externalIds: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus, number>>
  commandStatusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus, number>>
  commandCount: number
  plannedCommandCount: number
  appliedCommandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  nextActionCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceAdapter {
  recordRun(
    run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceAdapter {
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(
  run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord {
  const statusCounts = commandStatusCounts(run.commands.map((command) => command.status))
  return normalizeRecord({
    actor: run.actor,
    adapterBoundaryFingerprint: run.adapterBoundaryFingerprint,
    adapterBoundaryId: run.adapterBoundaryId,
    appliedCommandCount: statusCounts.applied ?? 0,
    blockedCommandCount: statusCounts.blocked ?? 0,
    blockedRecordCount: run.blockedRecordCount,
    commandCount: run.commandCount,
    commandIdempotencyKeys: uniqueSorted(run.commands.flatMap((command) => command.idempotencyKey ? [command.idempotencyKey] : [])),
    committedExecutionFingerprint: run.committedExecutionFingerprint,
    commitRecordId: run.commitRecordId,
    evidenceFingerprints: uniqueSorted(run.commands.flatMap((command) => command.evidenceFingerprints)),
    executedAt: run.executedAt,
    executionFingerprint: run.executionFingerprint,
    executionVersion: run.executionVersion,
    externalIds: uniqueSorted(run.commands.flatMap((command) => command.externalId ? [command.externalId] : [])),
    failedCommandCount: statusCounts.failed ?? 0,
    followThroughId: run.followThroughId,
    historyRecordCount: run.historyRecordCount,
    liveWriteBoundaryFingerprint: run.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: run.liveWriteBoundaryId,
    mode: run.mode,
    nextActionCount: run.nextActions.length,
    pendingCommandCount: statusCounts.pending ?? 0,
    pendingWriteIntentCount: run.pendingWriteIntentCount,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
    plannedCommandCount: run.plannedCommandCount,
    preparedCommandCount: statusCounts.prepared ?? 0,
    providerAdapterBoundaryFingerprint: run.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: run.providerAdapterBoundaryId,
    providerAdapterBoundaryVersion: run.providerAdapterBoundaryVersion,
    providerReadModelRecordId: run.providerReadModelRecordId,
    readinessRecordId: run.readinessRecordId,
    readyRecordCount: run.readyRecordCount,
    reviewedOutcomeCount: run.reviewedOutcomeCount,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
  })
}

function normalizeSnapshot(
  snapshot:
    | LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceInitialSnapshot
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceSnapshot {
  const recordsByFingerprint =
    new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.executionFingerprint)
    if (existing && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error("conflicting final-gate follow-through provider-adapter execution records cannot share executionFingerprint")
    }
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.executionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    adapterBoundaryFingerprints: uniqueSorted(records.flatMap((record) => record.adapterBoundaryFingerprint ? [record.adapterBoundaryFingerprint] : [])),
    adapterBoundaryIds: uniqueSorted(records.flatMap((record) => record.adapterBoundaryId ? [record.adapterBoundaryId] : [])),
    appliedCommandCount: records.reduce((total, record) => total + record.appliedCommandCount, 0),
    blockedCommandCount: records.reduce((total, record) => total + record.blockedCommandCount, 0),
    commandCount: records.reduce((total, record) => total + record.commandCount, 0),
    commandIdempotencyKeys: uniqueSorted(records.flatMap((record) => record.commandIdempotencyKeys)),
    commandStatusCounts: aggregateCommandStatusCounts(records),
    committedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.committedExecutionFingerprint ? [record.committedExecutionFingerprint] : []),
    ),
    commitRecordIds: uniqueSorted(records.flatMap((record) => record.commitRecordId ? [record.commitRecordId] : [])),
    evidenceFingerprints: uniqueSorted(records.flatMap((record) => record.evidenceFingerprints)),
    externalIds: uniqueSorted(records.flatMap((record) => record.externalIds)),
    failedCommandCount: records.reduce((total, record) => total + record.failedCommandCount, 0),
    followThroughIds: uniqueSorted(records.flatMap((record) => record.followThroughId ? [record.followThroughId] : [])),
    latestRun: records[0],
    liveWriteBoundaryFingerprints: uniqueSorted(
      records.flatMap((record) => record.liveWriteBoundaryFingerprint ? [record.liveWriteBoundaryFingerprint] : []),
    ),
    liveWriteBoundaryIds: uniqueSorted(records.flatMap((record) => record.liveWriteBoundaryId ? [record.liveWriteBoundaryId] : [])),
    nextActionCount: records.reduce((total, record) => total + record.nextActionCount, 0),
    pendingCommandCount: records.reduce((total, record) => total + record.pendingCommandCount, 0),
    pendingWriteIntentCount: records.reduce((total, record) => total + record.pendingWriteIntentCount, 0),
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
    plannedCommandCount: records.reduce((total, record) => total + record.plannedCommandCount, 0),
    preparedCommandCount: records.reduce((total, record) => total + record.preparedCommandCount, 0),
    providerAdapterBoundaryFingerprints: uniqueSorted(
      records.flatMap((record) => record.providerAdapterBoundaryFingerprint ? [record.providerAdapterBoundaryFingerprint] : []),
    ),
    providerAdapterBoundaryIds: uniqueSorted(
      records.flatMap((record) => record.providerAdapterBoundaryId ? [record.providerAdapterBoundaryId] : []),
    ),
    providerReadModelRecordIds: uniqueSorted(
      records.flatMap((record) => record.providerReadModelRecordId ? [record.providerReadModelRecordId] : []),
    ),
    readinessRecordIds: uniqueSorted(records.flatMap((record) => record.readinessRecordId ? [record.readinessRecordId] : [])),
    recordCount: records.length,
    records,
    reviewedOutcomeCount: records.reduce((total, record) => total + record.reviewedOutcomeCount, 0),
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    adapterBoundaryFingerprint: optionalTrim(record.adapterBoundaryFingerprint),
    adapterBoundaryId: optionalTrim(record.adapterBoundaryId),
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "appliedCommandCount"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    blockedRecordCount: nonNegativeInteger(record.blockedRecordCount, "blockedRecordCount"),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    commandIdempotencyKeys: uniqueSorted(record.commandIdempotencyKeys.map((key) => nonBlank(key, "commandIdempotencyKey"))),
    committedExecutionFingerprint: optionalTrim(record.committedExecutionFingerprint),
    commitRecordId: optionalTrim(record.commitRecordId),
    evidenceFingerprints: uniqueSorted(record.evidenceFingerprints.map((fingerprint) => nonBlank(fingerprint, "evidenceFingerprint"))),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionVersion: normalizeExecutionVersion(record.executionVersion),
    externalIds: uniqueSorted(record.externalIds.map((externalId) => nonBlank(externalId, "externalId"))),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "failedCommandCount"),
    followThroughId: optionalTrim(record.followThroughId),
    historyRecordCount: nonNegativeInteger(record.historyRecordCount, "historyRecordCount"),
    liveWriteBoundaryFingerprint: optionalTrim(record.liveWriteBoundaryFingerprint),
    liveWriteBoundaryId: optionalTrim(record.liveWriteBoundaryId),
    mode: normalizeMode(record.mode),
    nextActionCount: nonNegativeInteger(record.nextActionCount, "nextActionCount"),
    pendingCommandCount: nonNegativeInteger(record.pendingCommandCount, "pendingCommandCount"),
    pendingWriteIntentCount: nonNegativeInteger(record.pendingWriteIntentCount, "pendingWriteIntentCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    plannedCommandCount: nonNegativeInteger(record.plannedCommandCount, "plannedCommandCount"),
    preparedCommandCount: nonNegativeInteger(record.preparedCommandCount, "preparedCommandCount"),
    providerAdapterBoundaryFingerprint: optionalTrim(record.providerAdapterBoundaryFingerprint),
    providerAdapterBoundaryId: optionalTrim(record.providerAdapterBoundaryId),
    providerAdapterBoundaryVersion: normalizeProviderAdapterBoundaryVersion(record.providerAdapterBoundaryVersion),
    providerReadModelRecordId: optionalTrim(record.providerReadModelRecordId),
    readinessRecordId: optionalTrim(record.readinessRecordId),
    readyRecordCount: nonNegativeInteger(record.readyRecordCount, "readyRecordCount"),
    reviewedOutcomeCount: nonNegativeInteger(record.reviewedOutcomeCount, "reviewedOutcomeCount"),
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
    throw new Error("commandCount must equal the sum of per-status final-gate provider-adapter execution command counts")
  }
  validateAggregateStatus(normalized)
  validateEvidenceGating(normalized)

  return normalized
}

function validateAggregateStatus(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
): void {
  if (record.commandCount === 0) {
    throw new Error("commandCount must be greater than zero for final-gate provider-adapter execution records")
  }

  const mixedOutcomeCount = [
    record.appliedCommandCount,
    record.failedCommandCount,
    record.pendingCommandCount,
  ].filter((count) => count > 0).length

  if (record.status === "blocked" && record.blockedCommandCount !== record.commandCount) {
    throw new Error("blocked final-gate provider-adapter execution records must have only blocked commands")
  }
  if (record.status === "prepared" && (record.mode !== "dry_run" || record.preparedCommandCount !== record.commandCount)) {
    throw new Error("prepared final-gate provider-adapter execution records must be dry-run records with only prepared commands")
  }
  if (record.status === "pending" && (record.mode !== "commit" || record.pendingCommandCount !== record.commandCount)) {
    throw new Error("pending final-gate provider-adapter execution records must be commit records with only pending commands")
  }
  if (record.status === "succeeded" && (record.mode !== "commit" || record.appliedCommandCount !== record.commandCount)) {
    throw new Error("succeeded final-gate provider-adapter execution records must be commit records with only applied commands")
  }
  if (record.status === "failed" && (record.mode !== "commit" || record.failedCommandCount !== record.commandCount)) {
    throw new Error("failed final-gate provider-adapter execution records must be commit records with only failed commands")
  }
  if (
    record.status === "partial" &&
    (record.mode !== "commit" ||
      record.blockedCommandCount > 0 ||
      record.preparedCommandCount > 0 ||
      mixedOutcomeCount < 2)
  ) {
    throw new Error("partial final-gate provider-adapter execution records must be commit records with mixed applied failed or pending commands")
  }
}

function validateEvidenceGating(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
): void {
  const evidenceFields = [
    record.adapterBoundaryFingerprint,
    record.adapterBoundaryId,
    record.committedExecutionFingerprint,
    record.commitRecordId,
    record.followThroughId,
    record.liveWriteBoundaryFingerprint,
    record.liveWriteBoundaryId,
    record.providerAdapterBoundaryFingerprint,
    record.providerAdapterBoundaryId,
    record.providerAdapterBoundaryVersion,
    record.providerReadModelRecordId,
    record.readinessRecordId,
    record.targetRfqId,
  ]
  if (
    record.status === "blocked" &&
    (evidenceFields.some((value) => value !== undefined) ||
      record.commandIdempotencyKeys.length > 0 ||
      record.evidenceFingerprints.length > 0 ||
      record.externalIds.length > 0)
  ) {
    throw new Error("blocked final-gate provider-adapter execution records cannot include provider evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceSnapshot {
  return {
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    adapterBoundaryIds: [...snapshot.adapterBoundaryIds],
    appliedCommandCount: snapshot.appliedCommandCount,
    blockedCommandCount: snapshot.blockedCommandCount,
    commandCount: snapshot.commandCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    commandStatusCounts: { ...snapshot.commandStatusCounts },
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    externalIds: [...snapshot.externalIds],
    failedCommandCount: snapshot.failedCommandCount,
    followThroughIds: [...snapshot.followThroughIds],
    latestRun: snapshot.latestRun ? cloneRecord(snapshot.latestRun) : undefined,
    liveWriteBoundaryFingerprints: [...snapshot.liveWriteBoundaryFingerprints],
    liveWriteBoundaryIds: [...snapshot.liveWriteBoundaryIds],
    nextActionCount: snapshot.nextActionCount,
    pendingCommandCount: snapshot.pendingCommandCount,
    pendingWriteIntentCount: snapshot.pendingWriteIntentCount,
    persistenceVersion: snapshot.persistenceVersion,
    plannedCommandCount: snapshot.plannedCommandCount,
    preparedCommandCount: snapshot.preparedCommandCount,
    providerAdapterBoundaryFingerprints: [...snapshot.providerAdapterBoundaryFingerprints],
    providerAdapterBoundaryIds: [...snapshot.providerAdapterBoundaryIds],
    providerReadModelRecordIds: [...snapshot.providerReadModelRecordIds],
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
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord {
  return {
    actor: record.actor,
    adapterBoundaryFingerprint: record.adapterBoundaryFingerprint,
    adapterBoundaryId: record.adapterBoundaryId,
    appliedCommandCount: record.appliedCommandCount,
    blockedCommandCount: record.blockedCommandCount,
    blockedRecordCount: record.blockedRecordCount,
    commandCount: record.commandCount,
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    committedExecutionFingerprint: record.committedExecutionFingerprint,
    commitRecordId: record.commitRecordId,
    evidenceFingerprints: [...record.evidenceFingerprints],
    executedAt: record.executedAt,
    executionFingerprint: record.executionFingerprint,
    executionVersion: record.executionVersion,
    externalIds: [...record.externalIds],
    failedCommandCount: record.failedCommandCount,
    followThroughId: record.followThroughId,
    historyRecordCount: record.historyRecordCount,
    liveWriteBoundaryFingerprint: record.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: record.liveWriteBoundaryId,
    mode: record.mode,
    nextActionCount: record.nextActionCount,
    pendingCommandCount: record.pendingCommandCount,
    pendingWriteIntentCount: record.pendingWriteIntentCount,
    persistenceVersion: record.persistenceVersion,
    plannedCommandCount: record.plannedCommandCount,
    preparedCommandCount: record.preparedCommandCount,
    providerAdapterBoundaryFingerprint: record.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: record.providerAdapterBoundaryId,
    providerAdapterBoundaryVersion: record.providerAdapterBoundaryVersion,
    providerReadModelRecordId: record.providerReadModelRecordId,
    readinessRecordId: record.readinessRecordId,
    readyRecordCount: record.readyRecordCount,
    reviewedOutcomeCount: record.reviewedOutcomeCount,
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode) ||
    compareLex(left.providerAdapterBoundaryId ?? "", right.providerAdapterBoundaryId ?? "") ||
    compareLex(left.providerAdapterBoundaryFingerprint ?? "", right.providerAdapterBoundaryFingerprint ?? "") ||
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
    compareLex(left.actor, right.actor) ||
    compareLex(left.executionVersion, right.executionVersion) ||
    compareLex(left.providerAdapterBoundaryVersion ?? "", right.providerAdapterBoundaryVersion ?? "") ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.plannedCommandCount, right.plannedCommandCount) ||
    compareNumber(left.appliedCommandCount, right.appliedCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.failedCommandCount, right.failedCommandCount) ||
    compareNumber(left.pendingCommandCount, right.pendingCommandCount) ||
    compareNumber(left.preparedCommandCount, right.preparedCommandCount) ||
    compareNumber(left.historyRecordCount, right.historyRecordCount) ||
    compareNumber(left.readyRecordCount, right.readyRecordCount) ||
    compareNumber(left.blockedRecordCount, right.blockedRecordCount) ||
    compareNumber(left.pendingWriteIntentCount, right.pendingWriteIntentCount) ||
    compareNumber(left.reviewedOutcomeCount, right.reviewedOutcomeCount) ||
    compareNumber(left.nextActionCount, right.nextActionCount) ||
    compareNumber(left.warningCount, right.warningCount) ||
    compareLex(left.commandIdempotencyKeys.join("\n"), right.commandIdempotencyKeys.join("\n")) ||
    compareLex(left.evidenceFingerprints.join("\n"), right.evidenceFingerprints.join("\n")) ||
    compareLex(left.externalIds.join("\n"), right.externalIds.join("\n"))
  )
}

function commandStatusCounts(
  statuses: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus, number>>>(
    (counts, status) => {
      counts[status] = (counts[status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function aggregateCommandStatusCounts(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus, number>>>(
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
  counts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus, number>>,
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus,
  count: number,
): void {
  if (count > 0) {
    counts[status] = (counts[status] ?? 0) + count
  }
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus, number>>>(
    (counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function stableRecordKey(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
): string {
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION
  ) {
    throw new Error("persistenceVersion is not a supported final-gate provider-adapter execution persistence version")
  }
  return version
}

function normalizeExecutionVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord["executionVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION
  ) {
    throw new Error("executionVersion is not a supported final-gate provider-adapter execution version")
  }
  return version
}

function normalizeProviderAdapterBoundaryVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord["providerAdapterBoundaryVersion"],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord["providerAdapterBoundaryVersion"] {
  if (version === undefined) {
    return undefined
  }
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION
  ) {
    throw new Error("providerAdapterBoundaryVersion is not a supported final-gate provider-adapter boundary version")
  }
  return version
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun["mode"],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun["mode"] {
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_MODES.includes(mode)) {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus {
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_STATUSES.includes(status)) {
    throw new Error("status is not a supported final-gate provider-adapter execution status")
  }
  return status
}
