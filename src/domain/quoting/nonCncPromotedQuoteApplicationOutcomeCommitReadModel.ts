import type {
  NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot,
  NonCncPromotedQuoteApplicationOutcomeCommitRecord,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitPersistence"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION =
  "non-cnc-promoted-quote-application-outcome-commit-read-model.v1"

export type NonCncPromotedQuoteApplicationOutcomeCommitReadiness = "blocked" | "ready_to_apply"
export type NonCncPromotedQuoteApplicationOutcomeCommitMutationTarget =
  | "active_rfq_quote"
  | "offer_workspace"
  | "release_state"

export interface NonCncPromotedQuoteApplicationOutcomeCommitReadModel {
  readModelVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  status: NonCncPromotedQuoteApplicationOutcomeCommitReadiness
  disposition?: NonCncPromotedQuoteApplicationOutcomeCommitRecord["disposition"]
  executionFingerprint?: string
  committedOutcomeCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  mutationTargets: NonCncPromotedQuoteApplicationOutcomeCommitMutationTarget[]
  nextOperatorMessage: string
  mutationBoundary: string
}

export interface BuildNonCncPromotedQuoteApplicationOutcomeCommitReadModelInput {
  snapshot: NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot
  applicationId?: string
}

export function buildNonCncPromotedQuoteApplicationOutcomeCommitReadModel({
  applicationId,
  snapshot,
}: BuildNonCncPromotedQuoteApplicationOutcomeCommitReadModelInput): NonCncPromotedQuoteApplicationOutcomeCommitReadModel {
  const record = selectCommitRecord(snapshot, applicationId)
  if (!record) {
    return blockedReadModel(["No promoted quote application outcome commit record is available."])
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
    mutationBoundary:
      "Application outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later mutation adapter applies them.",
    mutationTargets: ready ? ["active_rfq_quote", "offer_workspace", "release_state"] : [],
    nextOperatorMessage: ready
      ? "Promoted non-CNC application outcome commit is ready for a future active RFQ, offer, and release mutation adapter."
      : "Resolve promoted quote application outcome commit blockers before applying it to active RFQ, offer, or release state.",
    packageId: record.packageId,
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: [...record.reviewWarnings],
    selectedPlanId: record.selectedPlanId,
    status: ready ? "ready_to_apply" : "blocked",
    targetRfqId: record.targetRfqId,
  }
}

function selectCommitRecord(
  snapshot: NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot,
  applicationId: string | undefined,
): NonCncPromotedQuoteApplicationOutcomeCommitRecord | undefined {
  if (applicationId) {
    return snapshot.records.find((record) => record.applicationId === applicationId)
  }
  return snapshot.latestRecord
}

function blockedReadModel(blockerLabels: string[]): NonCncPromotedQuoteApplicationOutcomeCommitReadModel {
  return {
    blockerLabels,
    committedOutcomeCount: 0,
    mutationBoundary:
      "Application outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later mutation adapter applies them.",
    mutationTargets: [],
    nextOperatorMessage: "Resolve promoted quote application outcome commit blockers before applying it to active RFQ, offer, or release state.",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: [],
    status: "blocked",
  }
}

function commitReadinessBlockers(record: NonCncPromotedQuoteApplicationOutcomeCommitRecord): string[] {
  return uniqueLabels([
    ...(record.status === "ready" ? [] : ["Promoted quote application outcome commit record is blocked."]),
    ...(record.disposition === "commit_ready" ? [] : ["Promoted quote application outcome commit record is review-only."]),
    ...(record.executionFingerprint ? [] : ["Promoted quote application outcome commit execution fingerprint is missing."]),
    ...(record.commandOutcomeCount > 0 ? [] : ["Promoted quote application outcome commit has no committed outcomes."]),
    ...record.blockerLabels,
  ])
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
