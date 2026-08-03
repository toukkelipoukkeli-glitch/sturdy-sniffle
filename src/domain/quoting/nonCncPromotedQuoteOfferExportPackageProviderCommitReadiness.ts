import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportPackageProviderCommitRecord,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitPersistence"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION =
  "non-cnc-promoted-quote-offer-export-package-provider-commit-readiness.v1"

export type NonCncPromotedQuoteOfferExportPackageProviderCommitReadinessStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness {
  readinessVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION
  status: NonCncPromotedQuoteOfferExportPackageProviderCommitReadinessStatus
  targetRfqId: string
  requestedAt: string
  requestedBy: string
  persistedRecordCount: number
  artifactOutcomeCount: number
  latestExecutionFingerprint?: string
  latestPlanId?: string
  latestPackageId?: string
  latestReleaseExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  latestStatus?: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord["executionStatus"]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  providerCommitBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferExportPackageProviderCommitReadinessInput {
  snapshot: NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot
  targetRfqId: string
  requestedAt: string
  requestedBy: string
}

export function buildNonCncPromotedQuoteOfferExportPackageProviderCommitReadiness({
  requestedAt,
  requestedBy,
  snapshot,
  targetRfqId,
}: BuildNonCncPromotedQuoteOfferExportPackageProviderCommitReadinessInput): NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness {
  const normalizedTargetRfqId = nonBlank(targetRfqId, "targetRfqId")
  const matchingRecord = latestMatchingRecord(snapshot, normalizedTargetRfqId)
  const blockerLabels = readinessBlockers({ matchingRecord, snapshot, targetRfqId: normalizedTargetRfqId })
  const ready = blockerLabels.length === 0

  return {
    artifactOutcomeCount: matchingRecord?.artifactOutcomeCount ?? 0,
    blockerLabels,
    latestExecutionFingerprint: ready ? matchingRecord?.executionFingerprint : undefined,
    latestPackageId: ready ? matchingRecord?.packageId : undefined,
    latestPlanId: ready ? matchingRecord?.planId : undefined,
    latestReleaseExecutionFingerprint: ready ? matchingRecord?.releaseExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: ready ? matchingRecord?.sourceExecutionFingerprint : undefined,
    latestStatus: matchingRecord?.executionStatus,
    nextOperatorMessage: ready
      ? "Provider commit history is ready for a future customer-offer export adapter."
      : "Keep live customer-offer export adapters disabled until provider commit history has ready local evidence.",
    persistedRecordCount: snapshot.recordCount,
    providerCommitBoundary:
      "Provider commit readiness is deterministic review data only; this helper does not create customer offers, files, release reviews, exports, or connector writes.",
    readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
    requestedAt: normalizeIsoTimestamp(requestedAt, "requestedAt"),
    requestedBy: nonBlank(requestedBy, "requestedBy"),
    reviewWarnings:
      matchingRecord && matchingRecord.warningCount > 0
        ? [`Latest provider commit record has ${matchingRecord.warningCount} warning(s).`]
        : [],
    status: ready ? "ready" : "blocked",
    targetRfqId: normalizedTargetRfqId,
  }
}

function latestMatchingRecord(
  snapshot: NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot,
  targetRfqId: string,
): NonCncPromotedQuoteOfferExportPackageProviderCommitRecord | undefined {
  return snapshot.records
    .filter((record) => record.targetRfqId === targetRfqId)
    .sort(sortNewestProviderCommitFirst)[0]
}

function sortNewestProviderCommitFirst(
  left: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord,
  right: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord,
): number {
  return (
    compareLex(
      normalizeIsoTimestamp(right.executedAt, "record.executedAt"),
      normalizeIsoTimestamp(left.executedAt, "record.executedAt"),
    ) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.planId, right.planId)
  )
}

function readinessBlockers({
  matchingRecord,
  snapshot,
  targetRfqId,
}: {
  matchingRecord: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord | undefined
  snapshot: NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot
  targetRfqId: string
}): string[] {
  if (!matchingRecord) {
    return uniqueLabels([
      snapshot.recordCount === 0
        ? "No persisted non-CNC offer export provider commit records are available."
        : `No persisted non-CNC offer export provider commit record matches active RFQ: ${targetRfqId}.`,
    ])
  }

  return uniqueLabels([
    ...(matchingRecord.executionStatus === "succeeded"
      ? []
      : [`Latest provider commit execution status is ${matchingRecord.executionStatus}.`]),
    ...(matchingRecord.providerStatus === "applied"
      ? []
      : [`Latest provider commit provider status is ${matchingRecord.providerStatus}.`]),
    ...(matchingRecord.readModelStatus === "ready_to_commit"
      ? []
      : [`Latest provider commit read-model status is ${matchingRecord.readModelStatus}.`]),
    ...(matchingRecord.artifactOutcomeCount > 0 ? [] : ["Latest provider commit record has no artifact outcomes."]),
    ...(matchingRecord.executionFingerprint.trim() ? [] : ["Latest provider commit record is missing an execution fingerprint."]),
    ...(matchingRecord.releaseExecutionFingerprint.trim()
      ? []
      : ["Latest provider commit record is missing a release execution fingerprint."]),
    ...(matchingRecord.sourceExecutionFingerprint.trim()
      ? []
      : ["Latest provider commit record is missing a source execution fingerprint."]),
  ])
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
