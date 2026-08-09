import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistory"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-readiness.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness {
  readinessVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessStatus
  targetRfqId: string
  requestedAt: string
  requestedBy: string
  persistedRunCount: number
  appliedCommandCount: number
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestApplyPlanFingerprint?: string
  latestCommitPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  latestStatus?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord["status"]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  applyExecutionReadinessBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessInput {
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary
  targetRfqId: string
  requestedAt: string
  requestedBy: string
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
  history,
  requestedAt,
  requestedBy,
  targetRfqId,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness {
  const normalizedTargetRfqId = nonBlank(targetRfqId, "targetRfqId")
  const latestRun = history.latestRun
  const blockerLabels = readinessBlockers({ history, latestRun, targetRfqId: normalizedTargetRfqId })
  const ready = blockerLabels.length === 0

  return {
    appliedCommandCount: ready ? latestRun?.appliedCommandCount ?? 0 : 0,
    applyExecutionReadinessBoundary:
      "Apply execution readiness is deterministic review data only; this helper does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
    blockerLabels,
    latestApplyPlanFingerprint: ready ? latestRun?.applyPlanFingerprint : undefined,
    latestApplyPlanId: ready ? latestRun?.applyPlanId : undefined,
    latestCommitPlanId: ready ? latestRun?.latestCommitPlanId : undefined,
    latestCommitRecordId: ready ? latestRun?.latestCommitRecordId : undefined,
    latestCommittedExecutionFingerprint: ready ? latestRun?.latestCommittedExecutionFingerprint : undefined,
    latestExecutionFingerprint: ready ? latestRun?.executionFingerprint : undefined,
    latestSourceExecutionFingerprint: ready ? latestRun?.latestSourceExecutionFingerprint : undefined,
    latestStatus: latestRun?.status,
    nextOperatorMessage: ready
      ? "Live-adapter apply execution history is ready for future final-gate modeling."
      : "Keep live customer-offer, file, release-review, export, and connector writes disabled until apply execution history has ready local evidence.",
    persistedRunCount: history.totalRuns,
    readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
    requestedAt: normalizeIsoTimestamp(requestedAt, "requestedAt"),
    requestedBy: nonBlank(requestedBy, "requestedBy"),
    reviewWarnings: latestRun && latestRun.warningCount > 0
      ? [`Latest apply execution record has ${latestRun.warningCount} warning(s).`]
      : [],
    status: ready ? "ready" : "blocked",
    targetRfqId: normalizedTargetRfqId,
  }
}

function readinessBlockers({
  history,
  latestRun,
  targetRfqId,
}: {
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary
  latestRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord | undefined
  targetRfqId: string
}): string[] {
  if (!latestRun) {
    return uniqueLabels([
      history.totalRuns === 0
        ? "No persisted non-CNC live-adapter apply execution records are available."
        : "No latest non-CNC live-adapter apply execution record is available.",
    ])
  }

  return uniqueLabels([
    ...(history.status === "applied" ? [] : [`Latest apply execution history status is ${history.status}.`]),
    ...(latestRun.targetRfqId === targetRfqId
      ? []
      : [`Latest apply execution target RFQ does not match active RFQ: ${latestRun.targetRfqId ?? "none"}.`]),
    ...(latestRun.status === "succeeded" ? [] : [`Latest apply execution status is ${latestRun.status}.`]),
    ...(latestRun.mode === "commit" ? [] : [`Latest apply execution mode is ${latestRun.mode}.`]),
    ...(latestRun.appliedCommandCount === latestRun.commandCount && latestRun.commandCount > 0
      ? []
      : ["Latest apply execution record must have all commands applied."]),
    ...(latestRun.latestCommitPlanId ? [] : ["Latest apply execution record is missing a commit plan id."]),
    ...(latestRun.latestCommitRecordId ? [] : ["Latest apply execution record is missing a commit record id."]),
    ...(latestRun.latestCommittedExecutionFingerprint
      ? []
      : ["Latest apply execution record is missing committed execution evidence."]),
    ...(latestRun.latestSourceExecutionFingerprint
      ? []
      : ["Latest apply execution record is missing source execution evidence."]),
  ])
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
