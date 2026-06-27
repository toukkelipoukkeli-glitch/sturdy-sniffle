import { describe, expect, it } from "vitest"

import { createLocalNonCncQuotePromotionPersistence, NON_CNC_QUOTE_PROMOTION_PERSISTENCE_VERSION } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T14:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion persistence", () => {
  it("records blocked promotion plans as review-only snapshots", async () => {
    const adapter = createLocalNonCncQuotePromotionPersistence()
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "wire_edm")
    const plan = buildNonCncQuotePromotionPlan({ ...request, preview })

    const snapshot = await adapter.recordPlan(plan)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.blockedPlanIds).toEqual(["non-cnc-promotion:rfq-demo-204:wire-edm:edm-key-077:wire-edm-v1"])
    expect(snapshot.candidatePlanIds).toEqual([])
    expect(snapshot.records[0]).toMatchObject({
      blockers: ["Editable controls missing", "Missing required values", "Persisted non-CNC quote promotion is not wired to workspace state yet"],
      disposition: "review_only",
      persistenceVersion: NON_CNC_QUOTE_PROMOTION_PERSISTENCE_VERSION,
      planId: "non-cnc-promotion:rfq-demo-204:wire-edm:edm-key-077:wire-edm-v1",
      quoteSnapshot: {
        partNumber: "EDM-KEY-077",
        process: "wire_edm",
        totalCents: 580974,
      },
      recordedAt: request.requestedAt,
      recordedBy: request.requestedBy,
      status: "blocked",
      targetRfqId: request.targetRfqId,
    })
    expect(snapshot.records[0]?.commands.every((command) => command.status === "blocked")).toBe(true)
  })

  it("records unblocked review plans as promotion candidates", async () => {
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

    expect(snapshot.blockedPlanIds).toEqual([])
    expect(snapshot.candidatePlanIds).toEqual(["non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1"])
    expect(snapshot.records[0]).toMatchObject({
      disposition: "candidate",
      reviewWarnings: ["Material certificate required."],
      status: "needs_review",
    })
    expect(snapshot.records[0]?.commands.every((command) => command.status === "ready")).toBe(true)
  })

  it("replaces records by plan id and returns cloned snapshots", async () => {
    const adapter = createLocalNonCncQuotePromotionPersistence()
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "sheet_metal")
    const firstPlan = buildNonCncQuotePromotionPlan({ ...request, preview })
    const secondPlan = {
      ...firstPlan,
      blockers: [...firstPlan.blockers, "Manual estimator review pending"],
      requestedBy: "Second Operator",
    }

    const firstSnapshot = await adapter.recordPlan(firstPlan)
    firstSnapshot.records[0]?.blockers.push("mutated outside adapter")
    const secondSnapshot = await adapter.recordPlan(secondPlan)

    expect(secondSnapshot.recordCount).toBe(1)
    expect(secondSnapshot.records[0]?.recordedBy).toBe("Second Operator")
    expect(secondSnapshot.records[0]?.blockers).toEqual([
      "Editable controls missing",
      "Persisted non-CNC quote promotion is not wired to workspace state yet",
      "Manual estimator review pending",
    ])
    expect(adapter.snapshot().records[0]?.blockers).not.toContain("mutated outside adapter")
  })
})
