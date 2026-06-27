import type { NonCncQuoteProcessKey } from "./processDemoQuotes"
import type { ProcessQuotePreview } from "./processQuotePreview"
import type { QuoteEngineCurrencyCode } from "./registry"

export const NON_CNC_QUOTE_PROMOTION_PLAN_VERSION = "non-cnc-quote-promotion-plan.v1"

export type NonCncQuotePromotionPlanStatus = "blocked" | "needs_review" | "ready"
export type NonCncQuotePromotionCommandStatus = "blocked" | "ready"

export interface NonCncQuotePromotionQuoteSnapshot {
  calculatorVersion: string
  currency: QuoteEngineCurrencyCode
  leadTimeDays: number
  partNumber: string
  process: NonCncQuoteProcessKey
  processLabel: string
  quantity: number
  totalCents: number
  unitPriceCents: number
}

export interface NonCncQuotePromotionCommand {
  key: "persist_quote_snapshot" | "refresh_offer_readiness" | "enable_offer_builder"
  label: string
  status: NonCncQuotePromotionCommandStatus
  detail: string
}

export interface NonCncQuotePromotionPlan {
  planVersion: typeof NON_CNC_QUOTE_PROMOTION_PLAN_VERSION
  planId: string
  targetRfqId: string
  requestedBy: string
  requestedAt: string
  status: NonCncQuotePromotionPlanStatus
  quoteSnapshot: NonCncQuotePromotionQuoteSnapshot
  blockers: string[]
  reviewWarnings: string[]
  nextActions: string[]
  releaseBoundary: string
  commands: NonCncQuotePromotionCommand[]
}

export interface BuildNonCncQuotePromotionPlanInput {
  preview: ProcessQuotePreview
  requestedAt: string
  requestedBy: string
  targetRfqId: string
  workspacePromotionPersistence?: "configured" | "not_configured"
}

export function buildNonCncQuotePromotionPlan(input: BuildNonCncQuotePromotionPlanInput): NonCncQuotePromotionPlan {
  const quote = input.preview.selected.quote
  const blockers = [
    ...input.preview.inputPromotionGate.blockerLabels,
    ...(input.workspacePromotionPersistence === "configured"
      ? []
      : ["Persisted non-CNC quote promotion is not wired to workspace state yet"]),
  ]
  const reviewWarnings = [...input.preview.reviewFlags]
  const status = blockers.length > 0 ? "blocked" : reviewWarnings.length > 0 ? "needs_review" : "ready"

  return {
    blockers,
    commands: buildPromotionCommands(status),
    nextActions: buildNextActions(status, blockers, reviewWarnings),
    planId: buildPromotionPlanId(input.targetRfqId, input.preview.selected.process, quote.partNumber, quote.calculatorVersion),
    planVersion: NON_CNC_QUOTE_PROMOTION_PLAN_VERSION,
    quoteSnapshot: {
      calculatorVersion: quote.calculatorVersion,
      currency: quote.currency,
      leadTimeDays: quote.leadTimeDays,
      partNumber: quote.partNumber,
      process: input.preview.selected.process,
      processLabel: input.preview.selected.label,
      quantity: quote.quantity,
      totalCents: quote.totalCents,
      unitPriceCents: quote.unitPriceCents,
    },
    releaseBoundary: "Plan is deterministic review data only; it must not update active RFQ quote, offer, or release execution state.",
    requestedAt: input.requestedAt,
    requestedBy: input.requestedBy,
    reviewWarnings,
    status,
    targetRfqId: input.targetRfqId,
  }
}

function buildPromotionCommands(status: NonCncQuotePromotionPlanStatus): NonCncQuotePromotionCommand[] {
  const commandStatus: NonCncQuotePromotionCommandStatus = status === "ready" ? "ready" : "blocked"
  return [
    {
      detail:
        commandStatus === "ready"
          ? "Store the selected non-CNC quote snapshot against the RFQ."
          : "Wait until promotion blockers are cleared before storing a non-CNC quote snapshot.",
      key: "persist_quote_snapshot",
      label: "Persist quote snapshot",
      status: commandStatus,
    },
    {
      detail:
        commandStatus === "ready"
          ? "Recompute customer-facing offer readiness from the promoted quote."
          : "Offer readiness still follows the active workspace quote.",
      key: "refresh_offer_readiness",
      label: "Refresh offer readiness",
      status: commandStatus,
    },
    {
      detail:
        commandStatus === "ready"
          ? "Allow offer drafting from the promoted non-CNC quote."
          : "Offer builder remains guarded until the promoted quote is persisted.",
      key: "enable_offer_builder",
      label: "Enable offer builder",
      status: commandStatus,
    },
  ]
}

function buildNextActions(status: NonCncQuotePromotionPlanStatus, blockers: string[], reviewWarnings: string[]): string[] {
  if (status === "ready") {
    return ["Persist the quote snapshot", "Refresh offer readiness", "Open the offer builder from the promoted quote"]
  }
  return [
    ...blockers.map((blocker) => `Clear blocker: ${blocker}`),
    ...(reviewWarnings.length > 0 ? [`Review ${reviewWarnings.length} calculator warning${reviewWarnings.length === 1 ? "" : "s"}`] : []),
  ]
}

function buildPromotionPlanId(targetRfqId: string, process: NonCncQuoteProcessKey, partNumber: string, calculatorVersion: string): string {
  return ["non-cnc-promotion", targetRfqId, process, partNumber, calculatorVersion].map(toStableIdToken).join(":")
}

function toStableIdToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown"
}
