import { describe, expect, it } from "vitest"

import {
  buildNonCncQuotePromotionActionSummary,
  NON_CNC_QUOTE_PROMOTION_ACTIONS_VERSION,
} from "./nonCncQuotePromotionActions"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T15:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion actions", () => {
  it("blocks promotion actions for review-only records", async () => {
    const adapter = createLocalNonCncQuotePromotionPersistence()
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "wire_edm")
    const plan = buildNonCncQuotePromotionPlan({ ...request, preview })
    const snapshot = await adapter.recordPlan(plan)

    const summary = buildNonCncQuotePromotionActionSummary({
      selectedPlanId: plan.planId,
      snapshot,
    })

    expect(summary).toMatchObject({
      actionVersion: NON_CNC_QUOTE_PROMOTION_ACTIONS_VERSION,
      canPromoteQuote: false,
      nextOperatorMessage: "Clear promotion blockers before updating the active RFQ quote, offer readiness, or offer builder.",
      selectedPlanId: plan.planId,
      status: "blocked",
    })
    expect(summary.actions.map((action) => [action.key, action.state])).toEqual([
      ["persist_quote_snapshot", "blocked"],
      ["refresh_offer_readiness", "blocked"],
      ["enable_offer_builder", "blocked"],
    ])
    expect(summary.actions[0]?.blockerLabels).toEqual([
      "Editable controls missing",
      "Missing required values",
      "Persisted non-CNC quote promotion is not wired to workspace state yet",
      "Review-only promotion records cannot update active RFQ quote state.",
    ])
  })

  it("marks candidate records ready while preserving review warnings", async () => {
    const adapter = createLocalNonCncQuotePromotionPersistence()
    const preview = {
      ...buildProcessQuotePreview(buildProcessDemoQuotes(), "sheet_metal"),
      inputPromotionGate: {
        blockerLabels: [],
        blockers: [],
        gateVersion: "process-input-promotion-gate.v1",
        missingRequiredCount: 0,
        nextStep: "Persist the quote snapshot.",
        status: "blocked",
      },
      reviewFlags: ["Material certificate required."],
    } as ProcessQuotePreview
    const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })
    const snapshot = await adapter.recordPlan(plan)

    const summary = buildNonCncQuotePromotionActionSummary({
      selectedPlanId: plan.planId,
      snapshot,
    })

    expect(summary.status).toBe("ready")
    expect(summary.canPromoteQuote).toBe(true)
    expect(summary.nextOperatorMessage).toBe("Promotion actions are ready after estimator review of the recorded calculator warnings.")
    expect(summary.actions.every((action) => action.state === "ready")).toBe(true)
    expect(summary.actions[0]?.reviewWarnings).toEqual(["Material certificate required."])
    expect(summary.record?.reviewWarnings).toEqual(["Material certificate required."])
  })

  it("does not fall back to another snapshot record when the selected plan is missing", async () => {
    const adapter = createLocalNonCncQuotePromotionPersistence()
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "sheet_metal")
    const plan = buildNonCncQuotePromotionPlan({ ...request, preview })
    const snapshot = await adapter.recordPlan(plan)

    const summary = buildNonCncQuotePromotionActionSummary({
      selectedPlanId: "non-cnc-promotion:rfq-demo-204:plastic:missing:plastics-v1",
      snapshot,
    })

    expect(summary.status).toBe("not_recorded")
    expect(summary.canPromoteQuote).toBe(false)
    expect(summary.record).toBeUndefined()
    expect(summary.actions.map((action) => action.blockerLabels)).toEqual([
      ["Selected promotion plan has not been recorded in the local snapshot."],
      ["Selected promotion plan has not been recorded in the local snapshot."],
      ["Selected promotion plan has not been recorded in the local snapshot."],
    ])
  })

  it("returns cloned records so callers cannot mutate snapshot state", async () => {
    const adapter = createLocalNonCncQuotePromotionPersistence()
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "sheet_metal")
    const plan = buildNonCncQuotePromotionPlan({ ...request, preview })
    const snapshot = await adapter.recordPlan(plan)

    const summary = buildNonCncQuotePromotionActionSummary({
      selectedPlanId: plan.planId,
      snapshot,
    })
    summary.record?.blockers.push("mutated outside summary")

    expect(snapshot.records[0]?.blockers).not.toContain("mutated outside summary")
  })
})
