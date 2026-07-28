import type {
  NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot,
  NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitPersistence"

export const NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION =
  "non-cnc-promoted-quote-offer-creation-outcome-commit-read-model.v1"

export type NonCncPromotedQuoteOfferCreationOutcomeCommitReadiness = "blocked" | "ready_to_create"
export type NonCncPromotedQuoteOfferCreationOutcomeCommitTarget =
  | "customer_offer"
  | "export_package"
  | "release_review"

export interface NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel {
  readModelVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION
  creationPlanId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  status: NonCncPromotedQuoteOfferCreationOutcomeCommitReadiness
  disposition?: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord["disposition"]
  executionFingerprint?: string
  committedOutcomeCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  creationTargets: NonCncPromotedQuoteOfferCreationOutcomeCommitTarget[]
  nextOperatorMessage: string
  offerCreationBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferCreationOutcomeCommitReadModelInput {
  snapshot: NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot
  creationPlanId?: string
}

export function buildNonCncPromotedQuoteOfferCreationOutcomeCommitReadModel({
  creationPlanId,
  snapshot,
}: BuildNonCncPromotedQuoteOfferCreationOutcomeCommitReadModelInput): NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel {
  const record = selectCommitRecord(snapshot, creationPlanId)
  if (!record) {
    return {
      ...blockedReadModel(["No customer-offer creation outcome commit record is available."]),
      creationPlanId,
    }
  }

  const blockerLabels = commitReadinessBlockers(record)
  const ready = blockerLabels.length === 0

  return {
    blockerLabels: ready ? [] : blockerLabels,
    committedOutcomeCount: ready ? record.commandOutcomeCount : 0,
    creationPlanId: record.creationPlanId,
    creationTargets: ready ? ["customer_offer", "export_package", "release_review"] : [],
    disposition: record.disposition,
    executionFingerprint: ready ? record.executionFingerprint : undefined,
    offerCreationBoundary:
      "Customer-offer creation outcome commit read models are deterministic review data only; active RFQ quote, offer, release, export, and connector state stay unchanged until a later adapter applies them.",
    nextOperatorMessage: ready
      ? "Reviewed non-CNC customer-offer creation outcomes are ready for a future customer-offer adapter."
      : "Resolve customer-offer creation outcome commit blockers before creating customer offers, export packages, or release reviews.",
    packageId: record.packageId,
    readModelVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    releaseExecutionFingerprint: ready ? record.releaseExecutionFingerprint : undefined,
    reviewWarnings: [...record.reviewWarnings],
    selectedPlanId: record.selectedPlanId,
    status: ready ? "ready_to_create" : "blocked",
    targetRfqId: ready ? record.targetRfqId : undefined,
  }
}

function selectCommitRecord(
  snapshot: NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot,
  creationPlanId: string | undefined,
): NonCncPromotedQuoteOfferCreationOutcomeCommitRecord | undefined {
  if (creationPlanId) {
    return snapshot.records.filter((record) => record.creationPlanId === creationPlanId).sort(sortNewestFirst)[0]
  }
  return snapshot.latestRecord
}

export function sortOfferCreationOutcomeCommitRecordsNewestFirst(
  left: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
): number {
  return sortNewestFirst(left, right)
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
): number {
  return (
    right.recordedAt.localeCompare(left.recordedAt) ||
    left.commitRecordId.localeCompare(right.commitRecordId) ||
    left.creationPlanId.localeCompare(right.creationPlanId)
  )
}

function blockedReadModel(blockerLabels: string[]): NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel {
  return {
    blockerLabels,
    committedOutcomeCount: 0,
    creationTargets: [],
    offerCreationBoundary:
      "Customer-offer creation outcome commit read models are deterministic review data only; active RFQ quote, offer, release, export, and connector state stay unchanged until a later adapter applies them.",
    nextOperatorMessage:
      "Resolve customer-offer creation outcome commit blockers before creating customer offers, export packages, or release reviews.",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: [],
    status: "blocked",
  }
}

function commitReadinessBlockers(record: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord): string[] {
  return uniqueLabels([
    ...(record.status === "ready" ? [] : ["Customer-offer creation outcome commit record is blocked."]),
    ...(record.disposition === "commit_ready" ? [] : ["Customer-offer creation outcome commit record is review-only."]),
    ...(record.executionFingerprint ? [] : ["Customer-offer creation outcome commit execution fingerprint is missing."]),
    ...(record.commandOutcomeCount > 0 ? [] : ["Customer-offer creation outcome commit has no committed outcomes."]),
    ...(record.targetRfqId ? [] : ["Customer-offer creation outcome commit target RFQ is missing."]),
    ...(record.releaseExecutionFingerprint
      ? []
      : ["Customer-offer creation outcome commit release execution fingerprint is missing."]),
    ...record.blockerLabels,
  ])
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
