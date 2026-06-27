import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage, NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION } from "./nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft, type NonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T16:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion command package", () => {
  it("packages ready promotion drafts into deterministic command payloads", async () => {
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

    const commandPackage = buildNonCncQuotePromotionCommandPackage(draft)
    const quoteCommand = commandPackage.commands.find((command) => command.key === "persist_quote_snapshot")
    const offerReadinessCommand = commandPackage.commands.find((command) => command.key === "refresh_offer_readiness")
    const offerBuilderCommand = commandPackage.commands.find((command) => command.key === "enable_offer_builder")
    ;(quoteCommand!.payload as { quoteSnapshot: { partNumber: string } }).quoteSnapshot.partNumber = "MUTATED"

    expect(commandPackage).toMatchObject({
      blockerLabels: [],
      commandCount: 3,
      packageId: [
        "non-cnc-promotion-command-package",
        plan.planId,
        request.targetRfqId,
        "persist_quote_snapshot+refresh_offer_readiness+enable_offer_builder",
      ].join(":"),
      packageVersion: NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION,
      reviewWarnings: ["Material certificate required."],
      selectedPlanId: plan.planId,
      status: "ready",
      targetRfqId: request.targetRfqId,
    })
    expect(quoteCommand).toMatchObject({
      blockerLabels: [],
      label: "Persist quote snapshot",
      payload: {
        kind: "quote_snapshot",
        quoteSnapshot: {
          process: "sheet_metal",
          processLabel: "Sheet metal",
          totalCents: 54905,
        },
        targetRfqId: request.targetRfqId,
      },
      status: "ready",
    })
    expect(offerReadinessCommand).toMatchObject({
      payload: {
        currency: "EUR",
        kind: "offer_readiness_refresh",
        promotedProcess: "sheet_metal",
        reviewWarningCount: 1,
        targetRfqId: request.targetRfqId,
        totalCents: 54905,
      },
    })
    expect(offerBuilderCommand).toMatchObject({
      payload: {
        kind: "offer_builder_enablement",
        offerBuilderState: "eligible",
        sourcePlanId: plan.planId,
        targetRfqId: request.targetRfqId,
      },
    })
    expect(draft.quoteSnapshot?.partNumber).toBe("SM-120-BRACKET")
  })

  it("keeps blocked drafts payload-free with blockers on every command", async () => {
    const adapter = createLocalNonCncQuotePromotionPersistence()
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "wire_edm")
    const plan = buildNonCncQuotePromotionPlan({ ...request, preview })
    const snapshot = await adapter.recordPlan(plan)
    const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
    const draft = buildNonCncQuotePromotionDraft(summary)

    const commandPackage = buildNonCncQuotePromotionCommandPackage(draft)

    expect(commandPackage.status).toBe("blocked")
    expect(commandPackage.targetRfqId).toBeUndefined()
    expect(commandPackage.blockerLabels).toEqual([
      "Editable controls missing",
      "Missing required values",
      "Persisted non-CNC quote promotion is not wired to workspace state yet",
      "Review-only promotion records cannot update active RFQ quote state.",
    ])
    expect(commandPackage.commands).toHaveLength(3)
    expect(commandPackage.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(commandPackage.commands.every((command) => command.payload === undefined)).toBe(true)
    expect(commandPackage.commands.every((command) => command.blockerLabels.length === 4)).toBe(true)
  })

  it("dedupes duplicate draft action keys before packaging commands", () => {
    const draft: NonCncQuotePromotionDraft = {
      actionKeys: ["persist_quote_snapshot", "persist_quote_snapshot", "enable_offer_builder"],
      blockerLabels: [],
      draftVersion: "non-cnc-quote-promotion-draft.v1",
      nextOperatorMessage: "Review the selected promotion draft.",
      reviewWarnings: [],
      selectedPlanId: "non-cnc-promotion:rfq-demo-204:plastic:demo:plastics-v1",
      status: "blocked",
    }
    const commandPackage = buildNonCncQuotePromotionCommandPackage(draft)
    const permutedPackage = buildNonCncQuotePromotionCommandPackage({
      ...draft,
      actionKeys: ["enable_offer_builder", "persist_quote_snapshot", "persist_quote_snapshot"],
    })

    expect(commandPackage.commandCount).toBe(2)
    expect(commandPackage.packageId).toBe(
      [
        "non-cnc-promotion-command-package",
        "non-cnc-promotion:rfq-demo-204:plastic:demo:plastics-v1",
        "unassigned-rfq",
        "persist_quote_snapshot+enable_offer_builder",
      ].join(":"),
    )
    expect(commandPackage.commands.map((command) => command.key)).toEqual(["persist_quote_snapshot", "enable_offer_builder"])
    expect(commandPackage.blockerLabels).toEqual(["Promotion draft is not ready to package for workspace commands."])
    expect(permutedPackage.packageId).toBe(commandPackage.packageId)
    expect(permutedPackage.commands.map((command) => command.key)).toEqual(commandPackage.commands.map((command) => command.key))
  })
})
