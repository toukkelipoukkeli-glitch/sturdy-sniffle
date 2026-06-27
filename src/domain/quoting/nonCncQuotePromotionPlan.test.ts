import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionPlan, NON_CNC_QUOTE_PROMOTION_PLAN_VERSION } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T13:30:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion plan", () => {
  it("builds a blocked deterministic promotion plan from the selected preview", () => {
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "wire_edm")

    const plan = buildNonCncQuotePromotionPlan({ ...request, preview })

    expect(plan).toEqual({
      blockers: [
        "Editable controls missing",
        "Missing required values",
        "Persisted non-CNC quote promotion is not wired to workspace state yet",
      ],
      commands: [
        {
          detail: "Wait until promotion blockers are cleared before storing a non-CNC quote snapshot.",
          key: "persist_quote_snapshot",
          label: "Persist quote snapshot",
          status: "blocked",
        },
        {
          detail: "Offer readiness still follows the active workspace quote.",
          key: "refresh_offer_readiness",
          label: "Refresh offer readiness",
          status: "blocked",
        },
        {
          detail: "Offer builder remains guarded until the promoted quote is persisted.",
          key: "enable_offer_builder",
          label: "Enable offer builder",
          status: "blocked",
        },
      ],
      nextActions: [
        "Clear blocker: Editable controls missing",
        "Clear blocker: Missing required values",
        "Clear blocker: Persisted non-CNC quote promotion is not wired to workspace state yet",
      ],
      planId: "non-cnc-promotion:rfq-demo-204:wire-edm:edm-key-077:wire-edm-v1",
      planVersion: NON_CNC_QUOTE_PROMOTION_PLAN_VERSION,
      quoteSnapshot: {
        calculatorVersion: "wire-edm.v1",
        currency: "EUR",
        leadTimeDays: 16,
        partNumber: "EDM-KEY-077",
        process: "wire_edm",
        processLabel: "Wire EDM",
        quantity: 6,
        totalCents: 580974,
        unitPriceCents: 96829,
      },
      releaseBoundary: "Plan is deterministic review data only; it must not update active RFQ quote, offer, or release execution state.",
      requestedAt: request.requestedAt,
      requestedBy: request.requestedBy,
      reviewWarnings: [],
      status: "blocked",
      targetRfqId: request.targetRfqId,
    })
  })

  it("keeps calculator warnings visible while blocking release commands", () => {
    const [demo] = buildProcessDemoQuotes()
    const preview = buildProcessQuotePreview([
      {
        ...demo,
        quote: {
          ...demo.quote,
          warnings: ["Material certificate required."],
        },
      },
    ])

    const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })

    expect(plan.status).toBe("blocked")
    expect(plan.reviewWarnings).toEqual(["Material certificate required."])
    expect(plan.nextActions).toContain("Review 1 calculator warning")
    expect(plan.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(plan.blockers).toEqual(["Editable controls missing"])
  })

  it("allows promotion commands when only calculator warnings need review", () => {
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

    expect(plan.status).toBe("needs_review")
    expect(plan.blockers).toEqual([])
    expect(plan.reviewWarnings).toEqual(["Material certificate required."])
    expect(plan.nextActions).toEqual(["Review 1 calculator warning"])
    expect(plan.commands.map((command) => [command.key, command.status])).toEqual([
      ["persist_quote_snapshot", "ready"],
      ["refresh_offer_readiness", "ready"],
      ["enable_offer_builder", "ready"],
    ])
  })

  it("marks commands ready only when the gate and persistence boundary are clear", () => {
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
      reviewFlags: [],
    } as ProcessQuotePreview

    const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })

    expect(plan.status).toBe("ready")
    expect(plan.blockers).toEqual([])
    expect(plan.nextActions).toEqual(["Persist the quote snapshot", "Refresh offer readiness", "Open the offer builder from the promoted quote"])
    expect(plan.commands.map((command) => [command.key, command.status])).toEqual([
      ["persist_quote_snapshot", "ready"],
      ["refresh_offer_readiness", "ready"],
      ["enable_offer_builder", "ready"],
    ])
  })
})
