import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-execution-outcome-commit-read-model.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadiness =
  | "blocked"
  | "ready_to_follow_through"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModelTarget =
  | "customer_offer"
  | "file_export"
  | "release_review"
  | "connector_reference"
  | "final_gate_follow_through"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel {
  readModelVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadiness
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
  disposition?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord["disposition"]
  blockerLabels: string[]
  reviewWarnings: string[]
  followThroughTargets: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModelTarget[]
  nextOperatorMessage: string
  followThroughBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModelInput {
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot
  followThroughId?: string
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel({
  followThroughId,
  snapshot,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModelInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel {
  const record = selectCommitRecord(snapshot, followThroughId)
  if (!record) {
    return {
      ...blockedReadModel(["No final-gate follow-through outcome commit record is available."]),
      followThroughId,
    }
  }

  const blockerLabels = commitReadinessBlockers(record, snapshot)
  const ready = blockerLabels.length === 0

  return {
    blockerLabels: ready ? [] : blockerLabels,
    commitRecordId: ready ? record.commitRecordId : undefined,
    committedExecutionFingerprint: ready ? record.committedExecutionFingerprint : undefined,
    committedOutcomeCount: ready ? record.commandOutcomeCount : 0,
    disposition: record.disposition,
    executionFingerprint: ready ? record.executionFingerprint : undefined,
    followThroughBoundary:
      "Final-gate follow-through outcome commit read models are deterministic review data only; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until a later adapter applies them.",
    followThroughFingerprint: ready ? record.followThroughFingerprint : undefined,
    followThroughId: record.followThroughId,
    followThroughTargets: ready
      ? ["customer_offer", "file_export", "release_review", "connector_reference", "final_gate_follow_through"]
      : [],
    latestApplyPlanId: ready ? record.latestApplyPlanId : undefined,
    latestCommitRecordId: ready ? record.latestCommitRecordId : undefined,
    latestCommittedExecutionFingerprint: ready ? record.latestCommittedExecutionFingerprint : undefined,
    latestExecutionFingerprint: ready ? record.latestExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: ready ? record.latestSourceExecutionFingerprint : undefined,
    nextOperatorMessage: ready
      ? "Reviewed final-gate follow-through outcome commits are ready for a future live follow-through adapter."
      : "Resolve final-gate follow-through outcome commit read-model blockers before enabling live follow-through writes.",
    readinessRecordId: ready ? record.readinessRecordId : undefined,
    readModelVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: [...record.reviewWarnings],
    status: ready ? "ready_to_follow_through" : "blocked",
    targetRfqId: ready ? record.targetRfqId : undefined,
  }
}

function selectCommitRecord(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot,
  followThroughId: string | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord | undefined {
  const records = followThroughId
    ? snapshot.records.filter((record) => record.followThroughId === followThroughId)
    : snapshot.records

  return [...records].sort(sortOutcomeCommitRecordsNewestFirst)[0]
}

export function sortFinalGateFollowThroughOutcomeCommitRecordsNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
): number {
  return sortOutcomeCommitRecordsNewestFirst(left, right)
}

function sortOutcomeCommitRecordsNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
): number {
  return (
    right.recordedAt.localeCompare(left.recordedAt) ||
    left.commitRecordId.localeCompare(right.commitRecordId) ||
    left.executionFingerprint.localeCompare(right.executionFingerprint)
  )
}

function blockedReadModel(
  blockerLabels: string[],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel {
  return {
    blockerLabels,
    committedOutcomeCount: 0,
    followThroughBoundary:
      "Final-gate follow-through outcome commit read models are deterministic review data only; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until a later adapter applies them.",
    followThroughTargets: [],
    nextOperatorMessage:
      "Resolve final-gate follow-through outcome commit read-model blockers before enabling live follow-through writes.",
    readModelVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: [],
    status: "blocked",
  }
}

function commitReadinessBlockers(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot,
): string[] {
  return uniqueLabels([
    ...(record.status === "ready" ? [] : ["Final-gate follow-through outcome commit record is blocked."]),
    ...(record.disposition === "commit_ready"
      ? []
      : ["Final-gate follow-through outcome commit record is review-only."]),
    ...(record.commandOutcomeCount > 0
      ? []
      : ["Final-gate follow-through outcome commit has no committed outcomes."]),
    ...(record.committedExecutionFingerprint
      ? []
      : ["Final-gate follow-through outcome commit execution fingerprint is missing."]),
    ...(record.targetRfqId ? [] : ["Final-gate follow-through outcome commit target RFQ is missing."]),
    ...(record.readinessRecordId
      ? []
      : ["Final-gate follow-through outcome commit readiness record is missing."]),
    ...(record.latestExecutionFingerprint
      ? []
      : ["Final-gate follow-through outcome commit latest apply execution fingerprint is missing."]),
    ...(record.latestApplyPlanId
      ? []
      : ["Final-gate follow-through outcome commit latest apply plan ID is missing."]),
    ...(record.latestCommitRecordId
      ? []
      : ["Final-gate follow-through outcome commit latest apply commit record ID is missing."]),
    ...(record.latestCommittedExecutionFingerprint
      ? []
      : ["Final-gate follow-through outcome commit latest committed execution fingerprint is missing."]),
    ...(record.latestSourceExecutionFingerprint
      ? []
      : ["Final-gate follow-through outcome commit latest source execution fingerprint is missing."]),
    ...(snapshot.commitReadyRecordIds.includes(record.commitRecordId)
      ? []
      : ["Final-gate follow-through outcome commit record is missing from the commit-ready snapshot index."]),
    ...(snapshot.executionFingerprints.includes(record.executionFingerprint)
      ? []
      : ["Final-gate follow-through outcome commit execution fingerprint is missing from the snapshot index."]),
    ...(record.committedExecutionFingerprint &&
    snapshot.committedExecutionFingerprints.includes(record.committedExecutionFingerprint)
      ? []
      : ["Final-gate follow-through outcome commit committed execution fingerprint is missing from the snapshot index."]),
    ...(snapshot.followThroughIds.includes(record.followThroughId)
      ? []
      : ["Final-gate follow-through outcome commit follow-through ID is missing from the snapshot index."]),
    ...(record.targetRfqId && snapshot.targetRfqIds.includes(record.targetRfqId)
      ? []
      : ["Final-gate follow-through outcome commit target RFQ is missing from the snapshot index."]),
    ...(record.readinessRecordId && snapshot.readinessRecordIds.includes(record.readinessRecordId)
      ? []
      : ["Final-gate follow-through outcome commit readiness record is missing from the snapshot index."]),
    ...record.blockerLabels,
  ])
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
