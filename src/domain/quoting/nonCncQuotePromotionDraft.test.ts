import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionDraft, NON_CNC_QUOTE_PROMOTION_DRAFT_VERSION } from "./nonCncQuotePromotionDraft"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T16:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion draft", () => {
  it("builds a ready quote promotion draft from candidate action summaries", async () => {
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
    const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })

    const draft = buildNonCncQuotePromotionDraft(summary)
    draft.quoteSnapshot!.partNumber = "MUTATED"

    expect(draft).toMatchObject({
      actionKeys: ["persist_quote_snapshot", "refresh_offer_readiness", "enable_offer_builder"],
      blockerLabels: [],
      draftVersion: NON_CNC_QUOTE_PROMOTION_DRAFT_VERSION,
      reviewWarnings: ["Material certificate required."],
      selectedPlanId: plan.planId,
      status: "ready",
      targetRfqId: request.targetRfqId,
    })
    expect(draft.quoteSnapshot).toMatchObject({
      process: "sheet_metal",
      processLabel: "Sheet metal",
      totalCents: 54905,
    })
    expect(summary.record?.quoteSnapshot.partNumber).toBe("SM-120-BRACKET")
  })

  it("keeps review-only promotion records blocked with all unique blocker labels", async () => {
    const adapter = createLocalNonCncQuotePromotionPersistence()
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "wire_edm")
    const plan = buildNonCncQuotePromotionPlan({ ...request, preview })
    const snapshot = await adapter.recordPlan(plan)
    const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })

    const draft = buildNonCncQuotePromotionDraft(summary)

    expect(draft.status).toBe("blocked")
    expect(draft.quoteSnapshot).toBeUndefined()
    expect(draft.targetRfqId).toBeUndefined()
    expect(draft.blockerLabels).toEqual([
      "Editable controls missing",
      "Missing required values",
      "Persisted non-CNC quote promotion is not wired to workspace state yet",
      "Review-only promotion records cannot update active RFQ quote state.",
    ])
  })

  it("does not create quote payloads for missing selected promotion records", () => {
    const summary = buildNonCncQuotePromotionActionSummary({
      selectedPlanId: "non-cnc-promotion:rfq-demo-204:plastic:missing:plastics-v1",
      snapshot: {
        blockedPlanIds: [],
        candidatePlanIds: [],
        recordCount: 0,
        records: [],
      },
    })

    const draft = buildNonCncQuotePromotionDraft(summary)

    expect(draft).toMatchObject({
      actionKeys: ["persist_quote_snapshot", "refresh_offer_readiness", "enable_offer_builder"],
      blockerLabels: ["Selected promotion plan has not been recorded in the local snapshot."],
      selectedPlanId: "non-cnc-promotion:rfq-demo-204:plastic:missing:plastics-v1",
      status: "blocked",
    })
    expect(draft.quoteSnapshot).toBeUndefined()
    expect(draft.targetRfqId).toBeUndefined()
  })
})
