import { compareLex } from "../shared/deterministic"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistory"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-read-model.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelStatus =
  | "blocked"
  | "ready_to_prepare"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel {
  readModelVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelStatus
  sourceHistoryStatus: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary["status"]
  totalRecords: number
  readyBoundaryCount: number
  blockedBoundaryCount: number
  commandCount: number
  pendingWriteIntentCount: number
  blockedCommandCount: number
  reviewedOutcomeCount: number
  liveWriteBoundaryId?: string
  liveWriteBoundaryFingerprint?: string
  adapterBoundaryId?: string
  adapterBoundaryFingerprint?: string
  commitRecordId?: string
  committedExecutionFingerprint?: string
  followThroughId?: string
  targetRfqId?: string
  readinessRecordId?: string
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  blockerLabels: string[]
  nextOperatorMessage: string
  reviewWarnings: string[]
  providerBoundary: string
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel {
  const base = {
    blockedBoundaryCount: history.blockedCount,
    blockedCommandCount: history.blockedCommandCount,
    commandCount: history.commandCount,
    pendingWriteIntentCount: history.pendingCommandCount,
    providerBoundary:
      "Final-gate follow-through live-write provider read models are deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until an explicit provider adapter is enabled.",
    readModelVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
    readyBoundaryCount: history.readyCount,
    reviewedOutcomeCount: history.reviewedOutcomeCount,
    sourceHistoryStatus: history.status,
    totalRecords: history.totalRecords,
  } satisfies Pick<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel,
    | "blockedBoundaryCount"
    | "blockedCommandCount"
    | "commandCount"
    | "pendingWriteIntentCount"
    | "providerBoundary"
    | "readModelVersion"
    | "readyBoundaryCount"
    | "reviewedOutcomeCount"
    | "sourceHistoryStatus"
    | "totalRecords"
  >
  const latestRecord = history.latestRecord
  const blockerLabels = providerReadModelBlockers(history)

  if (blockerLabels.length > 0 || !latestRecord) {
    return {
      ...base,
      blockerLabels,
      commandIdempotencyKeys: [],
      evidenceFingerprints: [],
      nextOperatorMessage: blockerLabels.join(" "),
      reviewWarnings: [...history.latestRecord?.reviewWarnings ?? []],
      status: "blocked",
    }
  }

  return {
    ...base,
    adapterBoundaryFingerprint: latestRecord.adapterBoundaryFingerprint,
    adapterBoundaryId: latestRecord.adapterBoundaryId,
    blockerLabels: [],
    commandIdempotencyKeys: uniqueSorted(history.commandIdempotencyKeys),
    committedExecutionFingerprint: latestRecord.committedExecutionFingerprint,
    commitRecordId: latestRecord.commitRecordId,
    evidenceFingerprints: uniqueSorted(history.evidenceFingerprints),
    followThroughId: latestRecord.followThroughId,
    liveWriteBoundaryFingerprint: latestRecord.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: latestRecord.liveWriteBoundaryId,
    nextOperatorMessage: `Review ${history.pendingCommandCount} pending final-gate follow-through write intent${history.pendingCommandCount === 1 ? "" : "s"} before enabling a provider adapter.`,
    readinessRecordId: latestRecord.readinessRecordId,
    reviewWarnings: [...latestRecord.reviewWarnings],
    status: "ready_to_prepare",
    targetRfqId: latestRecord.targetRfqId,
  }
}

function providerReadModelBlockers(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary,
): string[] {
  const latestRecord = history.latestRecord
  if (!latestRecord) {
    return ["Persist a reviewed final-gate follow-through live-write boundary before preparing provider read-model evidence."]
  }
  if (history.status !== "ready" || latestRecord.status !== "review_ready") {
    return [
      ...history.actionItems,
      "Final-gate follow-through live-write provider read models require ready boundary history.",
    ]
  }

  const blockers: string[] = []
  if (latestRecord.disposition !== "live_write_ready") {
    blockers.push("Latest final-gate follow-through live-write boundary is not marked live-write-ready.")
  }
  if (!history.readyBoundaryIds.includes(latestRecord.liveWriteBoundaryId)) {
    blockers.push("Latest final-gate follow-through live-write boundary is missing from the ready boundary index.")
  }
  if (!history.liveWriteBoundaryFingerprints.includes(latestRecord.liveWriteBoundaryFingerprint)) {
    blockers.push("Latest final-gate follow-through live-write boundary fingerprint is missing from the history index.")
  }
  requireIndexedEvidence(blockers, "adapter boundary", latestRecord.adapterBoundaryId, history.adapterBoundaryIds)
  requireIndexedEvidence(
    blockers,
    "adapter boundary fingerprint",
    latestRecord.adapterBoundaryFingerprint,
    history.adapterBoundaryFingerprints,
  )
  requireIndexedEvidence(blockers, "commit record", latestRecord.commitRecordId, history.commitRecordIds)
  requireIndexedEvidence(
    blockers,
    "committed execution",
    latestRecord.committedExecutionFingerprint,
    history.committedExecutionFingerprints,
  )
  requireIndexedEvidence(blockers, "follow-through record", latestRecord.followThroughId, history.followThroughIds)
  requireIndexedEvidence(blockers, "readiness record", latestRecord.readinessRecordId, history.readinessRecordIds)
  if (latestRecord.targetRfqId && !history.targetRfqIds.includes(latestRecord.targetRfqId)) {
    blockers.push("Latest final-gate follow-through live-write target RFQ is missing from the history index.")
  }
  if (latestRecord.pendingCommandCount === 0 || history.pendingCommandCount === 0) {
    blockers.push("Provider read-model evidence requires at least one pending live-write intent.")
  }
  if (history.commandIdempotencyKeys.length === 0 || history.evidenceFingerprints.length === 0) {
    blockers.push("Provider read-model evidence requires command idempotency keys and evidence fingerprints.")
  }
  return blockers
}

function requireIndexedEvidence(blockers: string[], label: string, value: string | undefined, index: string[]): void {
  if (!value || !index.includes(value)) {
    blockers.push(`Latest final-gate follow-through live-write ${label} is missing from the history index.`)
  }
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort(compareLex)
}
