import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_COMMAND_EXECUTION_STATUSES,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_STATUSES,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommit"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-adapter-execution-outcome-commit-persistence.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitDisposition =
  | "provider_adapter_commit_ready"
  | "review_only"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION
  providerAdapterExecutionVersion?: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION
  providerAdapterExecutionOutcomeCommitRecordId: string
  executionFingerprint: string
  providerAdapterExecutionFingerprint?: string
  providerAdapterExecutionStatus?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus
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
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitStatus
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitDisposition
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  commandOutcomeKeys: string[]
  commandOutcomeStatuses: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  externalIds: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord
  blockedCommitRecordIds: string[]
  commitReadyRecordIds: string[]
  providerAdapterExecutionFingerprints: string[]
  executionFingerprints: string[]
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
  commandOutcomeKeys: string[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  externalIds: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitStatus, number>>
  commandStatusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus, number>>
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitInput {
  commitPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceAdapter {
  recordCommit(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordCommit(input) {
      const record = buildCommitRecord(input)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records.filter(
            (candidate) =>
              candidate.providerAdapterExecutionOutcomeCommitRecordId !==
              record.providerAdapterExecutionOutcomeCommitRecordId,
          ),
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildCommitRecord({
  commitPlan,
  executionRun,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord {
  assertExecutionMatchesCommitPlan(commitPlan, executionRun)
  if (commitPlan.commandOutcomeCount !== commitPlan.commandOutcomes.length) {
    throw new Error("commandOutcomeCount must equal commandOutcomes length")
  }

  return normalizeRecord({
    adapterBoundaryFingerprint: commitPlan.adapterBoundaryFingerprint,
    adapterBoundaryId: commitPlan.adapterBoundaryId,
    blockerCount: commitPlan.blockerLabels.length,
    blockerLabels: [...commitPlan.blockerLabels],
    commandIdempotencyKeys: executionRun?.commands.flatMap((command) => command.idempotencyKey ? [command.idempotencyKey] : []) ?? [],
    commandOutcomeCount: commitPlan.commandOutcomeCount,
    commandOutcomeKeys: commitPlan.commandOutcomes.map((outcome) => outcome.key),
    commandOutcomeStatuses: executionRun?.commands.map((command) => command.status) ?? [],
    committedExecutionFingerprint: commitPlan.committedExecutionFingerprint,
    commitRecordId: commitPlan.commitRecordId,
    commitVersion: commitPlan.commitVersion,
    disposition: commitPlan.status === "ready" ? "provider_adapter_commit_ready" : "review_only",
    evidenceFingerprints: executionRun?.commands.flatMap((command) => command.evidenceFingerprints) ?? [],
    executionFingerprint: commitPlan.executionFingerprint,
    externalIds: uniqueSorted([
      ...commitPlan.commandOutcomes.flatMap((outcome) => outcome.externalId ? [outcome.externalId] : []),
      ...(executionRun?.commands.flatMap((command) => command.externalId ? [command.externalId] : []) ?? []),
    ]),
    followThroughId: commitPlan.followThroughId,
    liveWriteBoundaryFingerprint: commitPlan.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: commitPlan.liveWriteBoundaryId,
    pendingWriteIntentCount: commitPlan.pendingWriteIntentCount,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    providerAdapterBoundaryFingerprint: commitPlan.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: commitPlan.providerAdapterBoundaryId,
    providerAdapterBoundaryVersion: commitPlan.providerAdapterBoundaryVersion,
    providerAdapterExecutionFingerprint: executionRun?.executionFingerprint,
    providerAdapterExecutionOutcomeCommitRecordId: buildCommitRecordId(commitPlan),
    providerAdapterExecutionStatus: executionRun?.status,
    providerAdapterExecutionVersion: executionRun?.executionVersion,
    providerReadModelRecordId: commitPlan.providerReadModelRecordId,
    readinessRecordId: commitPlan.readinessRecordId,
    recordedAt,
    recordedBy,
    reviewedOutcomeCount: commitPlan.reviewedOutcomeCount,
    reviewWarnings: [...commitPlan.reviewWarnings],
    status: commitPlan.status,
    targetRfqId: commitPlan.targetRfqId,
    warningCount: commitPlan.reviewWarnings.length,
  })
}

function assertExecutionMatchesCommitPlan(
  commitPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan,
  executionRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun | undefined,
): void {
  if (!executionRun) {
    if (commitPlan.status === "ready") {
      throw new Error("ready final-gate provider-adapter execution outcome commit plans require a commit execution run")
    }
    return
  }
  if (commitPlan.status !== "ready") {
    throw new Error("blocked final-gate provider-adapter execution outcome commit plans cannot be recorded with an execution run")
  }
  if (executionRun.mode !== "commit") {
    throw new Error("final-gate provider-adapter execution outcome commit execution run must use commit mode")
  }
  if (executionRun.status !== "succeeded") {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require a succeeded execution run")
  }

  const commandKeys = commitPlan.commandOutcomes.map((outcome) => outcome.key)
  const commandStatuses = commitPlan.commandOutcomes.map((outcome) => outcome.status)
  const externalIds = commitPlan.commandOutcomes.map((outcome) => optionalTrim(outcome.externalId) ?? "")
  const runCommandKeys = executionRun.commands.map((command) => command.key)
  const runCommandStatuses = executionRun.commands.map((command) => command.status)
  const runExternalIds = executionRun.commands.map((command) => command.externalId ?? "")
  const mismatches = [
    executionRun.providerAdapterBoundaryId === commitPlan.providerAdapterBoundaryId ? undefined : "providerAdapterBoundaryId",
    executionRun.providerAdapterBoundaryFingerprint === commitPlan.providerAdapterBoundaryFingerprint
      ? undefined
      : "providerAdapterBoundaryFingerprint",
    executionRun.providerAdapterBoundaryVersion === commitPlan.providerAdapterBoundaryVersion
      ? undefined
      : "providerAdapterBoundaryVersion",
    executionRun.providerReadModelRecordId === commitPlan.providerReadModelRecordId
      ? undefined
      : "providerReadModelRecordId",
    executionRun.liveWriteBoundaryId === commitPlan.liveWriteBoundaryId ? undefined : "liveWriteBoundaryId",
    executionRun.liveWriteBoundaryFingerprint === commitPlan.liveWriteBoundaryFingerprint
      ? undefined
      : "liveWriteBoundaryFingerprint",
    executionRun.adapterBoundaryId === commitPlan.adapterBoundaryId ? undefined : "adapterBoundaryId",
    executionRun.adapterBoundaryFingerprint === commitPlan.adapterBoundaryFingerprint
      ? undefined
      : "adapterBoundaryFingerprint",
    executionRun.commitRecordId === commitPlan.commitRecordId ? undefined : "commitRecordId",
    executionRun.committedExecutionFingerprint === commitPlan.committedExecutionFingerprint
      ? undefined
      : "committedExecutionFingerprint",
    executionRun.followThroughId === commitPlan.followThroughId ? undefined : "followThroughId",
    executionRun.targetRfqId === commitPlan.targetRfqId ? undefined : "targetRfqId",
    executionRun.readinessRecordId === commitPlan.readinessRecordId ? undefined : "readinessRecordId",
    executionRun.pendingWriteIntentCount === commitPlan.pendingWriteIntentCount
      ? undefined
      : "pendingWriteIntentCount",
    executionRun.reviewedOutcomeCount === commitPlan.reviewedOutcomeCount ? undefined : "reviewedOutcomeCount",
    executionRun.commandCount === commitPlan.commandOutcomeCount ? undefined : "commandOutcomeCount",
    executionRun.appliedCommandCount === commitPlan.commandOutcomeCount ? undefined : "appliedCommandCount",
    sameArray(runCommandKeys, commandKeys) ? undefined : "commandOutcomeKeys",
    sameArray(runCommandStatuses, commandStatuses) ? undefined : "commandOutcomeStatuses",
    sameArray(runExternalIds, externalIds) ? undefined : "externalIds",
    fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
      executionRun,
    ) === executionRun.executionFingerprint
      ? undefined
      : "providerAdapterExecutionFingerprint",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(
      `final-gate provider-adapter execution outcome commit execution run does not match commit plan: ${mismatches.join(", ")}`,
    )
  }
}

function buildCommitRecordId({
  executionFingerprint,
}: Pick<
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan,
  "executionFingerprint"
>): string {
  return `non-cnc-final-gate-provider-adapter-execution-outcome-commit:${executionFingerprint}`
}

function normalizeSnapshot(
  snapshot:
    | LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceInitialSnapshot
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot {
  const recordsById =
    new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord>()
  const recordKeysByIdAndRecordedAt = new Map<string, string>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const timestampKey = JSON.stringify([normalized.providerAdapterExecutionOutcomeCommitRecordId, normalized.recordedAt])
    const recordKey = stableRecordKey(normalized)
    const existingRecordKey = recordKeysByIdAndRecordedAt.get(timestampKey)
    if (existingRecordKey && existingRecordKey !== recordKey) {
      throw new Error(
        "conflicting final-gate provider-adapter execution outcome commit records cannot share providerAdapterExecutionOutcomeCommitRecordId and recordedAt",
      )
    }
    recordKeysByIdAndRecordedAt.set(timestampKey, recordKey)
    const existing = recordsById.get(normalized.providerAdapterExecutionOutcomeCommitRecordId)
    const recordOrder = existing ? sortNewestFirst(normalized, existing) : -1
    if (!existing || recordOrder < 0) {
      recordsById.set(normalized.providerAdapterExecutionOutcomeCommitRecordId, normalized)
    } else if (recordOrder === 0 && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error(
        "conflicting final-gate provider-adapter execution outcome commit records cannot share providerAdapterExecutionOutcomeCommitRecordId and recordedAt",
      )
    }
  }
  const records = [...recordsById.values()].sort(sortNewestFirst)

  return {
    adapterBoundaryFingerprints: uniqueSorted(records.flatMap((record) => record.adapterBoundaryFingerprint ? [record.adapterBoundaryFingerprint] : [])),
    adapterBoundaryIds: uniqueSorted(records.flatMap((record) => record.adapterBoundaryId ? [record.adapterBoundaryId] : [])),
    blockedCommitRecordIds: uniqueSorted(
      records
        .filter((record) => record.disposition === "review_only")
        .map((record) => record.providerAdapterExecutionOutcomeCommitRecordId),
    ),
    blockerCount: records.reduce((total, record) => total + record.blockerCount, 0),
    commandIdempotencyKeys: uniqueSorted(records.flatMap((record) => record.commandIdempotencyKeys)),
    commandOutcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    commandOutcomeKeys: uniqueSorted(records.flatMap((record) => record.commandOutcomeKeys)),
    commandStatusCounts: aggregateCommandStatusCounts(records),
    committedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.committedExecutionFingerprint ? [record.committedExecutionFingerprint] : []),
    ),
    commitReadyRecordIds: uniqueSorted(
      records
        .filter((record) => record.disposition === "provider_adapter_commit_ready")
        .map((record) => record.providerAdapterExecutionOutcomeCommitRecordId),
    ),
    commitRecordIds: uniqueSorted(records.flatMap((record) => record.commitRecordId ? [record.commitRecordId] : [])),
    evidenceFingerprints: uniqueSorted(records.flatMap((record) => record.evidenceFingerprints)),
    executionFingerprints: uniqueSorted(records.map((record) => record.executionFingerprint)),
    externalIds: uniqueSorted(records.flatMap((record) => record.externalIds)),
    followThroughIds: uniqueSorted(records.flatMap((record) => record.followThroughId ? [record.followThroughId] : [])),
    latestRecord: records[0],
    liveWriteBoundaryFingerprints: uniqueSorted(
      records.flatMap((record) => record.liveWriteBoundaryFingerprint ? [record.liveWriteBoundaryFingerprint] : []),
    ),
    liveWriteBoundaryIds: uniqueSorted(records.flatMap((record) => record.liveWriteBoundaryId ? [record.liveWriteBoundaryId] : [])),
    pendingWriteIntentCount: records.reduce((total, record) => total + record.pendingWriteIntentCount, 0),
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    providerAdapterBoundaryFingerprints: uniqueSorted(
      records.flatMap((record) => record.providerAdapterBoundaryFingerprint ? [record.providerAdapterBoundaryFingerprint] : []),
    ),
    providerAdapterBoundaryIds: uniqueSorted(
      records.flatMap((record) => record.providerAdapterBoundaryId ? [record.providerAdapterBoundaryId] : []),
    ),
    providerAdapterExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.providerAdapterExecutionFingerprint ? [record.providerAdapterExecutionFingerprint] : []),
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
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord {
  const normalized = {
    adapterBoundaryFingerprint: optionalTrim(record.adapterBoundaryFingerprint),
    adapterBoundaryId: optionalTrim(record.adapterBoundaryId),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandIdempotencyKeys: uniqueSorted(record.commandIdempotencyKeys.map((key) => nonBlank(key, "commandIdempotencyKey"))),
    commandOutcomeCount: nonNegativeInteger(record.commandOutcomeCount, "commandOutcomeCount"),
    commandOutcomeKeys: record.commandOutcomeKeys.map((key) => nonBlank(key, "commandOutcomeKey")),
    commandOutcomeStatuses: record.commandOutcomeStatuses.map(normalizeCommandStatus),
    committedExecutionFingerprint: optionalTrim(record.committedExecutionFingerprint),
    commitRecordId: optionalTrim(record.commitRecordId),
    commitVersion: normalizeCommitVersion(record.commitVersion),
    disposition: normalizeDisposition(record.disposition),
    evidenceFingerprints: uniqueSorted(record.evidenceFingerprints.map((fingerprint) => nonBlank(fingerprint, "evidenceFingerprint"))),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    externalIds: uniqueSorted(record.externalIds.map((externalId) => nonBlank(externalId, "externalId"))),
    followThroughId: optionalTrim(record.followThroughId),
    liveWriteBoundaryFingerprint: optionalTrim(record.liveWriteBoundaryFingerprint),
    liveWriteBoundaryId: optionalTrim(record.liveWriteBoundaryId),
    pendingWriteIntentCount: nonNegativeInteger(record.pendingWriteIntentCount, "pendingWriteIntentCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    providerAdapterBoundaryFingerprint: optionalTrim(record.providerAdapterBoundaryFingerprint),
    providerAdapterBoundaryId: optionalTrim(record.providerAdapterBoundaryId),
    providerAdapterBoundaryVersion: normalizeProviderAdapterBoundaryVersion(record.providerAdapterBoundaryVersion),
    providerAdapterExecutionFingerprint: optionalTrim(record.providerAdapterExecutionFingerprint),
    providerAdapterExecutionOutcomeCommitRecordId: nonBlank(
      record.providerAdapterExecutionOutcomeCommitRecordId,
      "providerAdapterExecutionOutcomeCommitRecordId",
    ),
    providerAdapterExecutionStatus: normalizeProviderAdapterExecutionStatus(record.providerAdapterExecutionStatus),
    providerAdapterExecutionVersion: normalizeProviderAdapterExecutionVersion(record.providerAdapterExecutionVersion),
    providerReadModelRecordId: optionalTrim(record.providerReadModelRecordId),
    readinessRecordId: optionalTrim(record.readinessRecordId),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewedOutcomeCount: nonNegativeInteger(record.reviewedOutcomeCount, "reviewedOutcomeCount"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.providerAdapterExecutionOutcomeCommitRecordId !== buildCommitRecordId(normalized)) {
    throw new Error("providerAdapterExecutionOutcomeCommitRecordId must match executionFingerprint")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.commandOutcomeCount !== normalized.commandOutcomeKeys.length) {
    throw new Error("commandOutcomeCount must equal commandOutcomeKeys length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "provider_adapter_commit_ready") {
    throw new Error("ready final-gate provider-adapter execution outcome commit records must use provider_adapter_commit_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked final-gate provider-adapter execution outcome commit records must use review_only disposition")
  }
  if (normalized.status === "ready") {
    validateReadyRecord(normalized)
  }
  if (normalized.status === "blocked") {
    validateBlockedRecord(normalized)
  }

  return normalized
}

function validateReadyRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
): void {
  if (!record.providerAdapterExecutionFingerprint) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require providerAdapterExecutionFingerprint")
  }
  if (record.providerAdapterExecutionVersion !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require providerAdapterExecutionVersion")
  }
  if (record.providerAdapterExecutionStatus !== "succeeded") {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require succeeded providerAdapterExecutionStatus")
  }
  if (!record.providerAdapterBoundaryId || !record.providerAdapterBoundaryFingerprint || !record.providerAdapterBoundaryVersion) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require provider-adapter boundary evidence")
  }
  if (!record.providerReadModelRecordId || !record.liveWriteBoundaryId || !record.liveWriteBoundaryFingerprint) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require live-write provider evidence")
  }
  if (!record.commitRecordId || !record.committedExecutionFingerprint || !record.followThroughId) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require upstream commit evidence")
  }
  if (!record.targetRfqId || !record.readinessRecordId) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require RFQ readiness evidence")
  }
  if (record.commandOutcomeCount === 0) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require command outcomes")
  }
  if (record.commandOutcomeStatuses.length !== record.commandOutcomeCount) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require one command status per outcome")
  }
  if (record.commandOutcomeStatuses.some((status) => status !== "applied")) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require applied command outcomes")
  }
  if (record.externalIds.length !== record.commandOutcomeCount) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require one externalId per command outcome")
  }
  if (record.commandIdempotencyKeys.length !== record.commandOutcomeCount) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require one idempotency key per command outcome")
  }
  if (record.evidenceFingerprints.length === 0) {
    throw new Error("ready final-gate provider-adapter execution outcome commit records require evidence fingerprints")
  }
}

function validateBlockedRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
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
    record.providerAdapterExecutionFingerprint,
    record.providerAdapterExecutionStatus,
    record.providerAdapterExecutionVersion,
    record.providerReadModelRecordId,
    record.readinessRecordId,
    record.targetRfqId,
  ]
  if (
    evidenceFields.some((value) => value !== undefined) ||
    record.commandIdempotencyKeys.length > 0 ||
    record.commandOutcomeKeys.length > 0 ||
    record.commandOutcomeStatuses.length > 0 ||
    record.evidenceFingerprints.length > 0 ||
    record.externalIds.length > 0 ||
    record.pendingWriteIntentCount > 0 ||
    record.reviewedOutcomeCount > 0 ||
    record.commandOutcomeCount > 0
  ) {
    throw new Error("blocked final-gate provider-adapter execution outcome commit records cannot include provider evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot {
  return {
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    adapterBoundaryIds: [...snapshot.adapterBoundaryIds],
    blockedCommitRecordIds: [...snapshot.blockedCommitRecordIds],
    blockerCount: snapshot.blockerCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    commandOutcomeCount: snapshot.commandOutcomeCount,
    commandOutcomeKeys: [...snapshot.commandOutcomeKeys],
    commandStatusCounts: { ...snapshot.commandStatusCounts },
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitReadyRecordIds: [...snapshot.commitReadyRecordIds],
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    executionFingerprints: [...snapshot.executionFingerprints],
    externalIds: [...snapshot.externalIds],
    followThroughIds: [...snapshot.followThroughIds],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    liveWriteBoundaryFingerprints: [...snapshot.liveWriteBoundaryFingerprints],
    liveWriteBoundaryIds: [...snapshot.liveWriteBoundaryIds],
    pendingWriteIntentCount: snapshot.pendingWriteIntentCount,
    persistenceVersion: snapshot.persistenceVersion,
    providerAdapterBoundaryFingerprints: [...snapshot.providerAdapterBoundaryFingerprints],
    providerAdapterBoundaryIds: [...snapshot.providerAdapterBoundaryIds],
    providerAdapterExecutionFingerprints: [...snapshot.providerAdapterExecutionFingerprints],
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
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord {
  return {
    adapterBoundaryFingerprint: record.adapterBoundaryFingerprint,
    adapterBoundaryId: record.adapterBoundaryId,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    commandOutcomeCount: record.commandOutcomeCount,
    commandOutcomeKeys: [...record.commandOutcomeKeys],
    commandOutcomeStatuses: [...record.commandOutcomeStatuses],
    committedExecutionFingerprint: record.committedExecutionFingerprint,
    commitRecordId: record.commitRecordId,
    commitVersion: record.commitVersion,
    disposition: record.disposition,
    evidenceFingerprints: [...record.evidenceFingerprints],
    executionFingerprint: record.executionFingerprint,
    externalIds: [...record.externalIds],
    followThroughId: record.followThroughId,
    liveWriteBoundaryFingerprint: record.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: record.liveWriteBoundaryId,
    pendingWriteIntentCount: record.pendingWriteIntentCount,
    persistenceVersion: record.persistenceVersion,
    providerAdapterBoundaryFingerprint: record.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: record.providerAdapterBoundaryId,
    providerAdapterBoundaryVersion: record.providerAdapterBoundaryVersion,
    providerAdapterExecutionFingerprint: record.providerAdapterExecutionFingerprint,
    providerAdapterExecutionOutcomeCommitRecordId: record.providerAdapterExecutionOutcomeCommitRecordId,
    providerAdapterExecutionStatus: record.providerAdapterExecutionStatus,
    providerAdapterExecutionVersion: record.providerAdapterExecutionVersion,
    providerReadModelRecordId: record.providerReadModelRecordId,
    readinessRecordId: record.readinessRecordId,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewedOutcomeCount: record.reviewedOutcomeCount,
    reviewWarnings: [...record.reviewWarnings],
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.providerAdapterExecutionOutcomeCommitRecordId, right.providerAdapterExecutionOutcomeCommitRecordId) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.providerAdapterExecutionFingerprint ?? "", right.providerAdapterExecutionFingerprint ?? "") ||
    compareLex(left.status, right.status) ||
    compareLex(left.disposition, right.disposition) ||
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
    compareLex(left.recordedBy, right.recordedBy) ||
    compareLex(left.providerAdapterBoundaryVersion ?? "", right.providerAdapterBoundaryVersion ?? "") ||
    compareLex(left.providerAdapterExecutionStatus ?? "", right.providerAdapterExecutionStatus ?? "") ||
    compareLex(left.providerAdapterExecutionVersion ?? "", right.providerAdapterExecutionVersion ?? "") ||
    compareLex(left.commitVersion, right.commitVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.pendingWriteIntentCount, right.pendingWriteIntentCount) ||
    compareNumber(left.reviewedOutcomeCount, right.reviewedOutcomeCount) ||
    compareNumber(left.commandOutcomeCount, right.commandOutcomeCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount) ||
    compareLex(left.blockerLabels.join("\n"), right.blockerLabels.join("\n")) ||
    compareLex(left.reviewWarnings.join("\n"), right.reviewWarnings.join("\n")) ||
    compareLex(left.commandOutcomeKeys.join("\n"), right.commandOutcomeKeys.join("\n")) ||
    compareLex(left.commandOutcomeStatuses.join("\n"), right.commandOutcomeStatuses.join("\n")) ||
    compareLex(left.commandIdempotencyKeys.join("\n"), right.commandIdempotencyKeys.join("\n")) ||
    compareLex(left.evidenceFingerprints.join("\n"), right.evidenceFingerprints.join("\n")) ||
    compareLex(left.externalIds.join("\n"), right.externalIds.join("\n"))
  )
}

function aggregateCommandStatusCounts(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus, number>>>(
    (counts, record) => {
      for (const status of record.commandOutcomeStatuses) {
        counts[status] = (counts[status] ?? 0) + 1
      }
      return counts
    },
    {},
  )
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitStatus, number>>>(
    (counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function stableRecordKey(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
): string {
  return JSON.stringify(Object.entries(record).sort(([left], [right]) => compareLex(left, right)))
}

function sameArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  ) {
    throw new Error("persistenceVersion is not a supported final-gate provider-adapter execution outcome commit persistence version")
  }
  return version
}

function normalizeCommitVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord["commitVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION
  ) {
    throw new Error("commitVersion is not a supported final-gate provider-adapter execution outcome commit version")
  }
  return version
}

function normalizeProviderAdapterExecutionVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord["providerAdapterExecutionVersion"],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord["providerAdapterExecutionVersion"] {
  if (version === undefined) {
    return undefined
  }
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION
  ) {
    throw new Error("providerAdapterExecutionVersion is not a supported final-gate provider-adapter execution version")
  }
  return version
}

function normalizeProviderAdapterBoundaryVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord["providerAdapterBoundaryVersion"],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord["providerAdapterBoundaryVersion"] {
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

function normalizeProviderAdapterExecutionStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord["providerAdapterExecutionStatus"],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord["providerAdapterExecutionStatus"] {
  if (status === undefined) {
    return undefined
  }
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_STATUSES.includes(status)) {
    throw new Error("providerAdapterExecutionStatus is not a supported final-gate provider-adapter execution status")
  }
  return status
}

function normalizeCommandStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus {
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_COMMAND_EXECUTION_STATUSES.includes(status)) {
    throw new Error("commandOutcomeStatus is not a supported final-gate provider-adapter execution command status")
  }
  return status
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitDisposition,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitDisposition {
  if (disposition !== "provider_adapter_commit_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported final-gate provider-adapter execution outcome commit disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported final-gate provider-adapter execution outcome commit status")
  }
  return status
}
