import type { NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness } from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_STATUSES = [
  "blocked",
  "fallback",
  "ready",
] as const
export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_MODES = [
  "review_only",
  "live_adapter",
] as const
export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_ACTIONS = [
  "keep_review_only",
  "enable_live_adapter",
] as const

export type NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_STATUSES)[number]
export type NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_MODES)[number]
export type NonCncPromotedQuoteOfferExportLiveAdapterAction =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_ACTIONS)[number]

export interface NonCncPromotedQuoteOfferExportLiveAdapterDecisionInput {
  enabled?: boolean
  optInLabel?: string
  readiness: NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterDecision {
  status: NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus
  mode: NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode
  enabled: boolean
  canUseLiveAdapter: boolean
  adapterAction: NonCncPromotedQuoteOfferExportLiveAdapterAction
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  operatorSummary: string
  adapterBoundary: string
  targetRfqId: string
  latestExecutionFingerprint?: string
  latestPlanId?: string
  latestPackageId?: string
  latestReleaseExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
}

const DEFAULT_OPT_IN_LABEL = "VITE_FACTORYBID_ENABLE_NON_CNC_EXPORT_PROVIDER_WRITES"

export function decideNonCncPromotedQuoteOfferExportLiveAdapter({
  enabled = false,
  optInLabel = DEFAULT_OPT_IN_LABEL,
  readiness,
}: NonCncPromotedQuoteOfferExportLiveAdapterDecisionInput): NonCncPromotedQuoteOfferExportLiveAdapterDecision {
  const adapterBoundary =
    "Live non-CNC customer-offer export adapters remain disabled unless final readiness evidence is ready and the explicit provider-write opt-in is enabled."

  if (readiness.status !== "ready") {
    return {
      adapterAction: "keep_review_only",
      adapterBoundary,
      blockerLabels: [...readiness.blockerLabels],
      canUseLiveAdapter: false,
      enabled,
      mode: "review_only",
      nextActionLabels: [
        "Keep local/mock export provider output as the authoritative operator review surface.",
        "Persist ready provider commit evidence before enabling live customer-offer export writes.",
      ],
      operatorSummary: `Live non-CNC customer-offer export adapter is blocked by ${summarizeLabels(
        readiness.blockerLabels,
      )}; review-only local fallback remains active.`,
      reviewWarnings: [...readiness.reviewWarnings],
      status: "blocked",
      targetRfqId: readiness.targetRfqId,
    }
  }

  if (!enabled) {
    return {
      adapterAction: "keep_review_only",
      adapterBoundary,
      blockerLabels: [`${optInLabel} disabled`],
      canUseLiveAdapter: true,
      enabled: false,
      latestExecutionFingerprint: readiness.latestExecutionFingerprint,
      latestPackageId: readiness.latestPackageId,
      latestPlanId: readiness.latestPlanId,
      latestReleaseExecutionFingerprint: readiness.latestReleaseExecutionFingerprint,
      latestSourceExecutionFingerprint: readiness.latestSourceExecutionFingerprint,
      mode: "review_only",
      nextActionLabels: [
        `Set ${optInLabel}=true only after live customer-offer, file, release-review, export, and connector adapters are deployed together.`,
        "Keep local/mock fallback active while provider-write opt-in is disabled.",
      ],
      operatorSummary:
        "Final non-CNC export readiness evidence is ready, but provider-write opt-in is disabled; review-only local fallback remains active.",
      reviewWarnings: [...readiness.reviewWarnings],
      status: "fallback",
      targetRfqId: readiness.targetRfqId,
    }
  }

  return {
    adapterAction: "enable_live_adapter",
    adapterBoundary,
    blockerLabels: [],
    canUseLiveAdapter: true,
    enabled: true,
    latestExecutionFingerprint: readiness.latestExecutionFingerprint,
    latestPackageId: readiness.latestPackageId,
    latestPlanId: readiness.latestPlanId,
    latestReleaseExecutionFingerprint: readiness.latestReleaseExecutionFingerprint,
    latestSourceExecutionFingerprint: readiness.latestSourceExecutionFingerprint,
    mode: "live_adapter",
    nextActionLabels: [
      "Enable the live customer-offer export adapter with idempotent provider-write execution.",
      "Keep local/mock fallback, audit history, and rollback diagnostics attached after enabling live writes.",
    ],
    operatorSummary:
      "Final non-CNC export readiness evidence is ready and provider-write opt-in is enabled; guarded live adapter execution can proceed.",
    reviewWarnings: [...readiness.reviewWarnings],
    status: "ready",
    targetRfqId: readiness.targetRfqId,
  }
}

function summarizeLabels(labels: string[]): string {
  if (labels.length === 0) {
    return "no remaining blockers"
  }

  const visibleLabels = labels.slice(0, 3)
  const hiddenCount = Math.max(0, labels.length - visibleLabels.length)
  const visibleText = visibleLabels.join(", ")
  return hiddenCount > 0 ? `${visibleText}, and ${hiddenCount} more` : visibleText
}
