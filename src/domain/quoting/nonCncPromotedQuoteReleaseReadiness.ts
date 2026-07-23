import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot,
  NonCncPromotedQuoteApplicationMutationApplyExecutionRecord,
} from "./nonCncPromotedQuoteApplicationMutationApplyExecutionPersistence"

export const NON_CNC_PROMOTED_QUOTE_RELEASE_READINESS_VERSION = "non-cnc-promoted-quote-release-readiness.v1"

export type NonCncPromotedQuoteReleaseReadinessStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteReleaseReadiness {
  readinessVersion: typeof NON_CNC_PROMOTED_QUOTE_RELEASE_READINESS_VERSION
  status: NonCncPromotedQuoteReleaseReadinessStatus
  targetRfqId: string
  requestedAt: string
  requestedBy: string
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestStatus?: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord["status"]
  appliedCommandCount: number
  commandCount: number
  persistedRecordCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  releaseBoundary: string
}

export interface BuildNonCncPromotedQuoteReleaseReadinessInput {
  snapshot: NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot
  targetRfqId: string
  requestedAt: string
  requestedBy: string
}

export function buildNonCncPromotedQuoteReleaseReadiness({
  requestedAt,
  requestedBy,
  snapshot,
  targetRfqId,
}: BuildNonCncPromotedQuoteReleaseReadinessInput): NonCncPromotedQuoteReleaseReadiness {
  const normalizedTargetRfqId = nonBlank(targetRfqId, "targetRfqId")
  const matchingRecord = latestMatchingRecord(snapshot, normalizedTargetRfqId)
  const blockers = readinessBlockers({ matchingRecord, snapshot, targetRfqId: normalizedTargetRfqId })
  const ready = blockers.length === 0

  return {
    appliedCommandCount: matchingRecord?.appliedCommandCount ?? 0,
    blockerLabels: blockers,
    commandCount: matchingRecord?.commandCount ?? 0,
    latestApplyPlanId: matchingRecord?.applyPlanId,
    latestExecutionFingerprint: matchingRecord?.executionFingerprint,
    latestStatus: matchingRecord?.status,
    nextOperatorMessage: ready
      ? "Persisted non-CNC quote promotion is ready for a future customer-release adapter."
      : "Keep customer release on the active workspace quote until the non-CNC quote promotion is persisted and applied.",
    persistedRecordCount: snapshot.recordCount,
    readinessVersion: NON_CNC_PROMOTED_QUOTE_RELEASE_READINESS_VERSION,
    releaseBoundary:
      "Release readiness is deterministic review data only; this helper does not mutate active RFQ quote, offer, release, or connector state.",
    requestedAt: normalizeIsoTimestamp(requestedAt, "requestedAt"),
    requestedBy: nonBlank(requestedBy, "requestedBy"),
    reviewWarnings: matchingRecord && matchingRecord.warningCount > 0 ? [`Latest persisted apply execution has ${matchingRecord.warningCount} warning(s).`] : [],
    status: ready ? "ready" : "blocked",
    targetRfqId: normalizedTargetRfqId,
  }
}

function latestMatchingRecord(
  snapshot: NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot,
  targetRfqId: string,
): NonCncPromotedQuoteApplicationMutationApplyExecutionRecord | undefined {
  return snapshot.records
    .filter((record) => record.targetRfqId === targetRfqId)
    .sort(sortNewestExecutionFirst)[0]
}

function sortNewestExecutionFirst(
  left: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord,
  right: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.applyPlanId, right.applyPlanId)
  )
}

function readinessBlockers({
  matchingRecord,
  snapshot,
  targetRfqId,
}: {
  matchingRecord: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord | undefined
  snapshot: NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot
  targetRfqId: string
}): string[] {
  if (!matchingRecord) {
    return uniqueLabels([
      snapshot.recordCount === 0
        ? "No persisted non-CNC application apply execution records are available."
        : `No persisted non-CNC application apply execution matches active RFQ: ${targetRfqId}.`,
    ])
  }

  return uniqueLabels([
    ...(matchingRecord.mode === "commit" ? [] : ["Latest persisted non-CNC application apply execution is not a commit."]),
    ...(matchingRecord.status === "succeeded"
      ? []
      : [`Latest persisted non-CNC application apply execution status is ${matchingRecord.status}.`]),
    ...(matchingRecord.commandCount > 0 ? [] : ["Latest persisted non-CNC application apply execution has no commands."]),
    ...(matchingRecord.appliedCommandCount === matchingRecord.commandCount
      ? []
      : ["Latest persisted non-CNC application apply execution has unapplied commands."]),
    ...(matchingRecord.sourceExecutionFingerprint
      ? []
      : ["Latest persisted non-CNC application apply execution is missing a source execution fingerprint."]),
    ...(matchingRecord.executionFingerprint
      ? []
      : ["Latest persisted non-CNC application apply execution is missing an execution fingerprint."]),
  ])
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
