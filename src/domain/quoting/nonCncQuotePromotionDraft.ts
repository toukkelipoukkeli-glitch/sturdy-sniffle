import type { NonCncQuotePromotionActionKey, NonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import type { NonCncQuotePromotionQuoteSnapshot } from "./nonCncQuotePromotionPlan"

export const NON_CNC_QUOTE_PROMOTION_DRAFT_VERSION = "non-cnc-quote-promotion-draft.v1"

export type NonCncQuotePromotionDraftStatus = "blocked" | "ready"

export interface NonCncQuotePromotionDraft {
  draftVersion: typeof NON_CNC_QUOTE_PROMOTION_DRAFT_VERSION
  selectedPlanId: string
  status: NonCncQuotePromotionDraftStatus
  actionKeys: NonCncQuotePromotionActionKey[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  quoteSnapshot?: NonCncQuotePromotionQuoteSnapshot
  targetRfqId?: string
}

export function buildNonCncQuotePromotionDraft(summary: NonCncQuotePromotionActionSummary): NonCncQuotePromotionDraft {
  const blockerLabels = uniqueLabels(summary.actions.flatMap((action) => action.blockerLabels))
  if (!summary.canPromoteQuote || !summary.record) {
    return {
      actionKeys: summary.actions.map((action) => action.key),
      blockerLabels,
      draftVersion: NON_CNC_QUOTE_PROMOTION_DRAFT_VERSION,
      nextOperatorMessage: summary.nextOperatorMessage,
      reviewWarnings: uniqueLabels(summary.actions.flatMap((action) => action.reviewWarnings)),
      selectedPlanId: summary.selectedPlanId,
      status: "blocked",
    }
  }

  return {
    actionKeys: summary.actions.filter((action) => action.state === "ready").map((action) => action.key),
    blockerLabels: [],
    draftVersion: NON_CNC_QUOTE_PROMOTION_DRAFT_VERSION,
    nextOperatorMessage: summary.nextOperatorMessage,
    quoteSnapshot: { ...summary.record.quoteSnapshot },
    reviewWarnings: [...summary.record.reviewWarnings],
    selectedPlanId: summary.selectedPlanId,
    status: "ready",
    targetRfqId: summary.record.targetRfqId,
  }
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels)]
}
