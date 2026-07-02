import type {
  NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot,
  NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION =
  "non-cnc-promoted-quote-application-mutation-outcome-commit-read-model.v1"

export type NonCncPromotedQuoteApplicationMutationOutcomeCommitReadiness = "blocked" | "ready_to_apply"
export type NonCncPromotedQuoteApplicationMutationOutcomeCommitMutationTarget =
  | "active_rfq_quote"
  | "offer_workspace"
  | "release_state"

export interface NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel {
  readModelVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION
  mutationPackageId?: string
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  sourceExecutionFingerprint?: string
  executionFingerprint?: string
  executionStatus?: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord["executionStatus"]
  status: NonCncPromotedQuoteApplicationMutationOutcomeCommitReadiness
  disposition?: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord["disposition"]
  committedOutcomeCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  mutationTargets: NonCncPromotedQuoteApplicationMutationOutcomeCommitMutationTarget[]
  nextOperatorMessage: string
  mutationBoundary: string
}

export interface BuildNonCncPromotedQuoteApplicationMutationOutcomeCommitReadModelInput {
  snapshot: NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot
  mutationPackageId?: string
}

export function buildNonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel({
  mutationPackageId,
  snapshot,
}: BuildNonCncPromotedQuoteApplicationMutationOutcomeCommitReadModelInput): NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel {
  const record = selectCommitRecord(snapshot, mutationPackageId)
  if (!record) {
    return {
      ...blockedReadModel(["No promoted quote application mutation outcome commit record is available."]),
      mutationPackageId,
    }
  }

  const blockerLabels = commitReadinessBlockers(record)
  const ready = blockerLabels.length === 0

  return {
    applicationId: record.applicationId,
    applicationRecordId: record.applicationRecordId,
    blockerLabels: ready ? [] : blockerLabels,
    committedOutcomeCount: ready ? record.commandOutcomeCount : 0,
    disposition: record.disposition,
    executionFingerprint: ready ? record.executionFingerprint : undefined,
    executionStatus: ready ? record.executionStatus : undefined,
    mutationBoundary:
      "Application mutation outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
    mutationPackageId: record.mutationPackageId,
    mutationTargets: ready ? ["active_rfq_quote", "offer_workspace", "release_state"] : [],
    nextOperatorMessage: ready
      ? "Promoted non-CNC application mutation outcome commit is ready for a future active RFQ, offer, and release mutation adapter."
      : "Resolve promoted quote application mutation outcome commit blockers before applying it to active RFQ, offer, or release state.",
    packageId: record.packageId,
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: [...record.reviewWarnings],
    selectedPlanId: record.selectedPlanId,
    sourceExecutionFingerprint: record.sourceExecutionFingerprint,
    status: ready ? "ready_to_apply" : "blocked",
    targetRfqId: record.targetRfqId,
  }
}

function selectCommitRecord(
  snapshot: NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot,
  mutationPackageId: string | undefined,
): NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord | undefined {
  if (mutationPackageId) {
    return snapshot.records
      .filter((record) => record.mutationPackageId === mutationPackageId)
      .sort(sortMutationOutcomeCommitRecordsNewestFirst)[0]
  }
  return snapshot.latestRecord
}

export function sortMutationOutcomeCommitRecordsNewestFirst(
  left: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord,
  right: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord,
): number {
  return (
    right.recordedAt.localeCompare(left.recordedAt) ||
    left.commitRecordId.localeCompare(right.commitRecordId) ||
    left.sourceExecutionFingerprint.localeCompare(right.sourceExecutionFingerprint)
  )
}

function blockedReadModel(blockerLabels: string[]): NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel {
  return {
    blockerLabels,
    committedOutcomeCount: 0,
    mutationBoundary:
      "Application mutation outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
    mutationTargets: [],
    nextOperatorMessage: "Resolve promoted quote application mutation outcome commit blockers before applying it to active RFQ, offer, or release state.",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: [],
    status: "blocked",
  }
}

function commitReadinessBlockers(record: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord): string[] {
  return uniqueLabels([
    ...(record.status === "ready" ? [] : ["Promoted quote application mutation outcome commit record is blocked."]),
    ...(record.disposition === "commit_ready" ? [] : ["Promoted quote application mutation outcome commit record is review-only."]),
    ...(record.executionFingerprint ? [] : ["Promoted quote application mutation outcome commit execution fingerprint is missing."]),
    ...(record.executionStatus === "succeeded"
      ? []
      : [`Promoted quote application mutation outcome commit execution status is ${record.executionStatus ?? "missing"}.`]),
    ...(record.commandOutcomeCount > 0 ? [] : ["Promoted quote application mutation outcome commit has no committed outcomes."]),
    ...record.commandOutcomes
      .filter((outcome) => outcome.status !== "applied")
      .map((outcome) => `Promoted quote application mutation outcome ${outcome.key} is ${outcome.status}.`),
    ...record.blockerLabels,
  ])
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
