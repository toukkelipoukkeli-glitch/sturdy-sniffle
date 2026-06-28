import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage, type NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import { buildNonCncQuotePromotionExecutionOutcomeDraft } from "./nonCncQuotePromotionExecutionOutcomeDraft"
import { buildNonCncQuotePromotionOutcomeCommitRun } from "./nonCncQuotePromotionOutcomeCommit"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildNonCncQuotePromotionReadModel, type NonCncQuotePromotionReadModel } from "./nonCncQuotePromotionReadModel"
import {
  buildNonCncPromotedQuoteApplicationPlan,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION,
} from "./nonCncPromotedQuoteApplicationPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-28T13:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC promoted quote application plan", () => {
  it("builds a ready application plan from a promoted read model", async () => {
    const readModel = await buildPromotedReadModel()

    const plan = buildNonCncPromotedQuoteApplicationPlan({ ...request, readModel })

    expect(plan).toMatchObject({
      blockerLabels: [],
      mutationBoundary:
        "Application plan is deterministic review data only; it must not mutate active RFQ quote, offer, or release state until an operator commits it.",
      nextOperatorMessage: "Promoted non-CNC quote is ready for an operator-reviewed active RFQ quote application.",
      packageId: readModel.packageId,
      planVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION,
      requestedAt: request.requestedAt,
      requestedBy: request.requestedBy,
      selectedPlanId: readModel.selectedPlanId,
      sourceExecutionFingerprint: readModel.executionFingerprint,
      status: "ready",
      targetRfqId: request.targetRfqId,
    })
    expect(plan.applicationId).toMatch(
      /^non-cnc-promoted-quote-application:rfq-demo-204:non-cnc-promotion-command-package-non-cnc-promotion-rfq-demo-204-sheet-metal/,
    )
    expect(plan.quoteSnapshot).toMatchObject({
      partNumber: "SM-120-BRACKET",
      process: "sheet_metal",
      totalCents: 54905,
    })
    expect(plan.commands).toEqual([
      {
        detail: "Replace the active RFQ quote with the promoted non-CNC quote snapshot.",
        externalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
        key: "replace_active_quote",
        label: "Apply promoted quote",
        status: "ready",
      },
      {
        detail: "Refresh offer readiness from the promoted non-CNC quote.",
        externalId: "offer-readiness:rfq-demo-204:sheet-metal:54905",
        key: "refresh_offer_workspace",
        label: "Refresh offer workspace",
        status: "ready",
      },
      {
        detail: "Open the offer builder with the promoted non-CNC quote candidate.",
        externalId:
          "offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal-sm-120-bracket-sheet-metal-v1:non-cnc-quote-promotion-command-package-v1",
        key: "open_offer_builder",
        label: "Open offer builder",
        status: "ready",
      },
    ])
  })

  it("keeps blocked read models and target mismatches from producing application payloads", async () => {
    const readModel = await buildPromotedReadModel()
    const blockedModel: NonCncQuotePromotionReadModel = {
      ...readModel,
      blockerLabels: ["No committed promotion execution run recorded."],
      offerBuilderExternalId: undefined,
      offerReadinessExternalId: undefined,
      quoteExternalId: undefined,
      quoteSnapshot: undefined,
      status: "blocked",
    }

    const blockedPlan = buildNonCncPromotedQuoteApplicationPlan({ ...request, readModel: blockedModel })

    expect(blockedPlan).toMatchObject({
      quoteSnapshot: undefined,
      status: "blocked",
    })
    expect(blockedPlan.blockerLabels).toEqual([
      "Promoted quote read model is not ready.",
      "Promoted quote snapshot is missing.",
      "Promoted quote external id is missing.",
      "Offer readiness external id is missing.",
      "Offer builder external id is missing.",
      "No committed promotion execution run recorded.",
    ])
    expect(blockedPlan.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: undefined,
          key: "replace_active_quote",
          status: "blocked",
        }),
        expect.objectContaining({
          externalId: undefined,
          key: "refresh_offer_workspace",
          status: "blocked",
        }),
        expect.objectContaining({
          externalId: undefined,
          key: "open_offer_builder",
          status: "blocked",
        }),
      ]),
    )

    const mismatchedPlan = buildNonCncPromotedQuoteApplicationPlan({
      ...request,
      readModel,
      targetRfqId: "rfq-other-999",
    })

    expect(mismatchedPlan).toMatchObject({
      quoteSnapshot: undefined,
      status: "blocked",
      targetRfqId: "rfq-other-999",
    })
    expect(mismatchedPlan.blockerLabels).toContain("Promoted quote target RFQ does not match active RFQ: rfq-demo-204.")
    expect(mismatchedPlan.commands.every((command) => command.externalId === undefined)).toBe(true)
  })

  it("clones promoted quote snapshots before exposing them to application consumers", async () => {
    const readModel = await buildPromotedReadModel()
    const plan = buildNonCncPromotedQuoteApplicationPlan({ ...request, readModel })

    plan.quoteSnapshot!.partNumber = "MUTATED"
    const repeatedPlan = buildNonCncPromotedQuoteApplicationPlan({ ...request, readModel })

    expect(repeatedPlan.quoteSnapshot?.partNumber).toBe("SM-120-BRACKET")
    expect(readModel.quoteSnapshot?.partNumber).toBe("SM-120-BRACKET")
  })

  it("rejects invalid application audit inputs", async () => {
    const readModel = await buildPromotedReadModel()

    expect(() =>
      buildNonCncPromotedQuoteApplicationPlan({
        ...request,
        readModel,
        requestedAt: "28 June 2026",
      }),
    ).toThrow("requestedAt must be a valid ISO timestamp")
    expect(() =>
      buildNonCncPromotedQuoteApplicationPlan({
        ...request,
        readModel,
        requestedBy: "   ",
      }),
    ).toThrow("requestedBy is required")
  })
})

async function buildPromotedReadModel(): Promise<NonCncQuotePromotionReadModel> {
  const commandPackage = await buildReadyPackage()
  const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
  const { executionRun } = buildNonCncQuotePromotionOutcomeCommitRun({
    actor: request.requestedBy,
    commandPackage,
    executedAt: request.requestedAt,
    outcomeDraft,
  })
  if (!executionRun) {
    throw new Error("Expected ready outcome commit run")
  }
  return buildNonCncQuotePromotionReadModel({ commandPackage, executionRun })
}

async function buildReadyPackage(): Promise<NonCncQuotePromotionCommandPackage> {
  const adapter = createLocalNonCncQuotePromotionPersistence()
  const preview = {
    ...buildProcessQuotePreview(buildProcessDemoQuotes(), "sheet_metal"),
    inputPromotionGate: {
      blockerLabels: [],
      blockers: [],
      gateVersion: "process-input-promotion-gate.v1",
      missingRequiredCount: 0,
      nextStep: "Process input draft is ready for quote promotion.",
      status: "ready",
    },
    reviewFlags: [],
  } satisfies ProcessQuotePreview
  const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })
  const snapshot = await adapter.recordPlan(plan)
  const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
  return buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(summary))
}
