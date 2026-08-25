import { compareLex } from "../shared/deterministic"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-adapter-execution-outcome-commit-read-model.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadiness =
  | "blocked"
  | "ready_for_live_writes"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModelTarget =
  | "connector_reference"
  | "customer_offer"
  | "file_export"
  | "final_gate_follow_through"
  | "release_review"
  | "rollback_evidence"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel {
  readModelVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadiness
  totalRecords: number
  committedCount: number
  blockedCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
  providerAdapterExecutionOutcomeCommitRecordId?: string
  executionFingerprint?: string
  providerAdapterExecutionFingerprint?: string
  providerAdapterExecutionStatus?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus
  providerAdapterBoundaryId?: string
  providerAdapterBoundaryFingerprint?: string
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
  liveWriteTargets: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModelTarget[]
  commandOutcomeKeys: string[]
  commandOutcomeStatuses: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  externalIds: string[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  liveWriteBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModelInput {
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot
  providerAdapterBoundaryId?: string
  targetRfqId?: string
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel({
  providerAdapterBoundaryId,
  snapshot,
  targetRfqId,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModelInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel {
  const record = selectCommitRecord(snapshot, { providerAdapterBoundaryId, targetRfqId })
  const base = {
    blockedCount: snapshot.statusCounts.blocked ?? 0,
    blockerCount: snapshot.blockerCount,
    commandOutcomeCount: snapshot.commandOutcomeCount,
    committedCount: snapshot.statusCounts.ready ?? 0,
    liveWriteBoundary:
      "Final-gate provider-adapter execution outcome commit read models are deterministic review data only; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until a later adapter applies them.",
    pendingWriteIntentCount: snapshot.pendingWriteIntentCount,
    readModelVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewedOutcomeCount: snapshot.reviewedOutcomeCount,
    totalRecords: snapshot.recordCount,
    warningCount: snapshot.warningCount,
  } satisfies Pick<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel,
    | "blockedCount"
    | "blockerCount"
    | "commandOutcomeCount"
    | "committedCount"
    | "liveWriteBoundary"
    | "pendingWriteIntentCount"
    | "readModelVersion"
    | "reviewedOutcomeCount"
    | "totalRecords"
    | "warningCount"
  >

  if (!record) {
    return {
      ...base,
      blockerLabels: [
        "No final-gate provider-adapter execution outcome commit record is available.",
      ],
      commandIdempotencyKeys: [],
      commandOutcomeKeys: [],
      commandOutcomeStatuses: [],
      evidenceFingerprints: [],
      externalIds: [],
      liveWriteTargets: [],
      nextOperatorMessage:
        "Resolve final-gate provider-adapter execution outcome commit read-model blockers before enabling live writes.",
      reviewWarnings: [],
      status: "blocked",
    }
  }

  const blockerLabels = commitReadinessBlockers(record, snapshot)
  const ready = blockerLabels.length === 0

  if (!ready) {
    return {
      ...base,
      blockerLabels,
      commandIdempotencyKeys: [],
      commandOutcomeKeys: [],
      commandOutcomeStatuses: [],
      evidenceFingerprints: [],
      externalIds: [],
      liveWriteTargets: [],
      nextOperatorMessage:
        "Resolve final-gate provider-adapter execution outcome commit read-model blockers before enabling live writes.",
      reviewWarnings: [...record.reviewWarnings],
      status: "blocked",
    }
  }

  return {
    ...base,
    adapterBoundaryFingerprint: record.adapterBoundaryFingerprint,
    adapterBoundaryId: record.adapterBoundaryId,
    blockerLabels: [],
    commandIdempotencyKeys: uniqueSorted(record.commandIdempotencyKeys),
    commandOutcomeKeys: [...record.commandOutcomeKeys],
    commandOutcomeStatuses: [...record.commandOutcomeStatuses],
    committedExecutionFingerprint: record.committedExecutionFingerprint,
    commitRecordId: record.commitRecordId,
    evidenceFingerprints: uniqueSorted(record.evidenceFingerprints),
    executionFingerprint: record.executionFingerprint,
    externalIds: uniqueSorted(record.externalIds),
    followThroughId: record.followThroughId,
    liveWriteBoundaryFingerprint: record.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: record.liveWriteBoundaryId,
    liveWriteTargets: liveWriteTargetsFor(record),
    nextOperatorMessage:
      "Reviewed final-gate provider-adapter execution outcome commits are ready for guarded live-write planning.",
    providerAdapterBoundaryFingerprint: record.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: record.providerAdapterBoundaryId,
    providerAdapterExecutionFingerprint: record.providerAdapterExecutionFingerprint,
    providerAdapterExecutionOutcomeCommitRecordId: record.providerAdapterExecutionOutcomeCommitRecordId,
    providerAdapterExecutionStatus: record.providerAdapterExecutionStatus,
    providerReadModelRecordId: record.providerReadModelRecordId,
    readinessRecordId: record.readinessRecordId,
    reviewWarnings: [...record.reviewWarnings],
    status: "ready_for_live_writes",
    targetRfqId: record.targetRfqId,
  }
}

export function sortFinalGateProviderAdapterExecutionOutcomeCommitRecordsNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
): number {
  return sortOutcomeCommitRecordsNewestFirst(left, right)
}

function selectCommitRecord(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot,
  filters: Pick<
    BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModelInput,
    "providerAdapterBoundaryId" | "targetRfqId"
  >,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord | undefined {
  const records = snapshot.records.filter(
    (record) =>
      (!filters.providerAdapterBoundaryId || record.providerAdapterBoundaryId === filters.providerAdapterBoundaryId) &&
      (!filters.targetRfqId || record.targetRfqId === filters.targetRfqId),
  )

  return [...records].sort(sortOutcomeCommitRecordsNewestFirst)[0]
}

function sortOutcomeCommitRecordsNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.providerAdapterExecutionOutcomeCommitRecordId, right.providerAdapterExecutionOutcomeCommitRecordId) ||
    compareLex(left.executionFingerprint, right.executionFingerprint)
  )
}

function commitReadinessBlockers(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot,
): string[] {
  return uniqueLabels([
    ...(record.status === "ready" ? [] : ["Final-gate provider-adapter execution outcome commit record is blocked."]),
    ...(record.disposition === "provider_adapter_commit_ready"
      ? []
      : ["Final-gate provider-adapter execution outcome commit record is review-only."]),
    ...(record.providerAdapterExecutionStatus === "succeeded"
      ? []
      : ["Final-gate provider-adapter execution outcome commit requires a succeeded provider-adapter execution."]),
    ...(record.commandOutcomeCount > 0
      ? []
      : ["Final-gate provider-adapter execution outcome commit has no command outcomes."]),
    ...(record.reviewedOutcomeCount > 0
      ? []
      : ["Final-gate provider-adapter execution outcome commit has no reviewed provider outcomes."]),
    ...(record.pendingWriteIntentCount > 0
      ? []
      : ["Final-gate provider-adapter execution outcome commit has no pending write intents."]),
    ...requiredIndexedEvidenceBlockers(record, snapshot),
    ...record.blockerLabels,
  ])
}

function requiredIndexedEvidenceBlockers(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot,
): string[] {
  const blockers: string[] = []
  requireIndexedEvidence(
    blockers,
    "provider-adapter execution outcome commit record",
    record.providerAdapterExecutionOutcomeCommitRecordId,
    snapshot.commitReadyRecordIds,
  )
  requireAbsentIndexedEvidence(
    blockers,
    "provider-adapter execution outcome commit record",
    record.providerAdapterExecutionOutcomeCommitRecordId,
    snapshot.blockedCommitRecordIds,
  )
  requireIndexedEvidence(blockers, "outcome draft execution fingerprint", record.executionFingerprint, snapshot.executionFingerprints)
  requireIndexedEvidence(
    blockers,
    "provider-adapter commit execution fingerprint",
    record.providerAdapterExecutionFingerprint,
    snapshot.providerAdapterExecutionFingerprints,
  )
  requireIndexedEvidence(blockers, "provider-adapter boundary", record.providerAdapterBoundaryId, snapshot.providerAdapterBoundaryIds)
  requireIndexedEvidence(
    blockers,
    "provider-adapter boundary fingerprint",
    record.providerAdapterBoundaryFingerprint,
    snapshot.providerAdapterBoundaryFingerprints,
  )
  requireIndexedEvidence(blockers, "provider read model", record.providerReadModelRecordId, snapshot.providerReadModelRecordIds)
  requireIndexedEvidence(blockers, "live-write boundary", record.liveWriteBoundaryId, snapshot.liveWriteBoundaryIds)
  requireIndexedEvidence(
    blockers,
    "live-write boundary fingerprint",
    record.liveWriteBoundaryFingerprint,
    snapshot.liveWriteBoundaryFingerprints,
  )
  requireIndexedEvidence(blockers, "adapter boundary", record.adapterBoundaryId, snapshot.adapterBoundaryIds)
  requireIndexedEvidence(
    blockers,
    "adapter boundary fingerprint",
    record.adapterBoundaryFingerprint,
    snapshot.adapterBoundaryFingerprints,
  )
  requireIndexedEvidence(blockers, "upstream commit record", record.commitRecordId, snapshot.commitRecordIds)
  requireIndexedEvidence(
    blockers,
    "upstream committed execution",
    record.committedExecutionFingerprint,
    snapshot.committedExecutionFingerprints,
  )
  requireIndexedEvidence(blockers, "follow-through record", record.followThroughId, snapshot.followThroughIds)
  requireIndexedEvidence(blockers, "target RFQ", record.targetRfqId, snapshot.targetRfqIds)
  requireIndexedEvidence(blockers, "readiness record", record.readinessRecordId, snapshot.readinessRecordIds)
  requireEveryIndexedEvidence(blockers, "command outcome key", record.commandOutcomeKeys, snapshot.commandOutcomeKeys)
  requireEveryIndexedEvidence(
    blockers,
    "command idempotency key",
    record.commandIdempotencyKeys,
    snapshot.commandIdempotencyKeys,
  )
  requireEveryIndexedEvidence(blockers, "evidence fingerprint", record.evidenceFingerprints, snapshot.evidenceFingerprints)
  requireEveryIndexedEvidence(blockers, "external ID", record.externalIds, snapshot.externalIds)
  if (record.commandOutcomeStatuses.some((status) => status !== "applied")) {
    blockers.push("Final-gate provider-adapter execution outcome commit requires applied command outcomes.")
  }
  return blockers
}

function requireIndexedEvidence(
  blockers: string[],
  label: string,
  value: string | undefined,
  index: string[],
): void {
  if (!value || !index.includes(value)) {
    blockers.push(`Final-gate provider-adapter execution outcome commit ${label} is missing from the snapshot index.`)
  }
}

function requireAbsentIndexedEvidence(
  blockers: string[],
  label: string,
  value: string | undefined,
  index: string[],
): void {
  if (value && index.includes(value)) {
    blockers.push(`Final-gate provider-adapter execution outcome commit ${label} is present in the blocked snapshot index.`)
  }
}

function requireEveryIndexedEvidence(
  blockers: string[],
  label: string,
  values: string[],
  index: string[],
): void {
  if (values.length === 0) {
    blockers.push(`Final-gate provider-adapter execution outcome commit has no ${label} evidence.`)
    return
  }
  if (values.some((value) => !index.includes(value))) {
    blockers.push(`Final-gate provider-adapter execution outcome commit ${label} evidence is missing from the snapshot index.`)
  }
}

function liveWriteTargetsFor(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModelTarget[] {
  const targetsByCommandKey: Partial<
    Record<
      string,
      NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModelTarget
    >
  > = {
    connector_reference_provider_prepare: "connector_reference",
    customer_offer_provider_prepare: "customer_offer",
    file_export_provider_prepare: "file_export",
    final_gate_follow_through_provider_prepare: "final_gate_follow_through",
    release_review_provider_prepare: "release_review",
    rollback_evidence_provider_prepare: "rollback_evidence",
  }
  return uniqueSorted(record.commandOutcomeKeys.flatMap((key) => targetsByCommandKey[key] ?? []))
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function uniqueSorted<
  Value extends string,
>(values: Value[]): Value[] {
  return [...new Set(values.filter(Boolean))].sort(compareLex)
}
