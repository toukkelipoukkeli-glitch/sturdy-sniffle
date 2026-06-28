import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage, type NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import { buildNonCncQuotePromotionExecutionRun } from "./nonCncQuotePromotionExecution"
import {
  buildNonCncQuotePromotionExecutionOutcomeDraft,
  NON_CNC_QUOTE_PROMOTION_EXECUTION_OUTCOME_DRAFT_VERSION,
} from "./nonCncQuotePromotionExecutionOutcomeDraft"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T16:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion execution outcome drafts", () => {
  it("builds deterministic applied outcomes for ready command packages", async () => {
    const commandPackage = await buildReadyPackage()

    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const suggestedOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
      command.suggestedOutcome ? [command.suggestedOutcome] : [],
    )
    const committedRun = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandOutcomes: suggestedOutcomes,
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "commit",
    })

    expect(outcomeDraft).toMatchObject({
      blockedOutcomeCount: 0,
      draftVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_OUTCOME_DRAFT_VERSION,
      packageId: commandPackage.packageId,
      readyOutcomeCount: 3,
      status: "ready",
      targetRfqId: request.targetRfqId,
    })
    expect(outcomeDraft.nextOperatorMessage).toBe("Review and commit 3 non-CNC promotion outcomes.")
    expect(outcomeDraft.commandOutcomes.map((command) => command.key)).toEqual([
      "persist_quote_snapshot",
      "refresh_offer_readiness",
      "enable_offer_builder",
    ])
    expect(outcomeDraft.commandOutcomes.map((command) => command.payloadKind)).toEqual([
      "quote_snapshot",
      "offer_readiness_refresh",
      "offer_builder_enablement",
    ])
    expect(suggestedOutcomes).toEqual([
      {
        externalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
        key: "persist_quote_snapshot",
        message: "Prepared quote snapshot for SM-120-BRACKET.",
        status: "applied",
        warnings: ["Material certificate required."],
      },
      {
        externalId: "offer-readiness:rfq-demo-204:sheet-metal:54905",
        key: "refresh_offer_readiness",
        message: "Prepared offer readiness refresh for sheet_metal.",
        status: "applied",
        warnings: ["Material certificate required."],
      },
      {
        externalId: [
          "offer-builder",
          "rfq-demo-204",
          "non-cnc-promotion-rfq-demo-204-sheet-metal-sm-120-bracket-sheet-metal-v1",
          "non-cnc-quote-promotion-command-package-v1",
        ].join(":"),
        key: "enable_offer_builder",
        message: "Prepared offer builder enablement for non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1.",
        status: "applied",
        warnings: ["Material certificate required."],
      },
    ])
    expect(committedRun.status).toBe("succeeded")
    expect(committedRun.commands.map((command) => command.status)).toEqual(["applied", "applied", "applied"])
    expect(committedRun.warnings).toEqual([
      "Material certificate required.",
      "Persist quote snapshot: Material certificate required.",
      "Refresh offer readiness: Material certificate required.",
      "Enable offer builder: Material certificate required.",
    ])
  })

  it("keeps blocked command packages outcome-free", async () => {
    const commandPackage = await buildBlockedPackage()

    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)

    expect(outcomeDraft).toMatchObject({
      blockedOutcomeCount: 3,
      draftVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_OUTCOME_DRAFT_VERSION,
      packageId: commandPackage.packageId,
      readyOutcomeCount: 0,
      status: "blocked",
    })
    expect(outcomeDraft.targetRfqId).toBeUndefined()
    expect(outcomeDraft.nextOperatorMessage).toBe(commandPackage.nextOperatorMessage)
    expect(outcomeDraft.commandOutcomes).toHaveLength(3)
    expect(outcomeDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.payloadKind === undefined)).toBe(true)
  })

  it("suppresses suggested outcomes when the package is blocked even if commands stay ready", async () => {
    const readyPackage = await buildReadyPackage()
    const commandPackage: NonCncQuotePromotionCommandPackage = {
      ...readyPackage,
      nextOperatorMessage: "Blocked at package level.",
      status: "blocked",
    }

    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.readyOutcomeCount).toBe(0)
    expect(outcomeDraft.blockedOutcomeCount).toBe(3)
    expect(outcomeDraft.nextOperatorMessage).toBe("Blocked at package level.")
    expect(outcomeDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.payloadKind === undefined)).toBe(true)
  })
})

async function buildBlockedPackage(): Promise<NonCncQuotePromotionCommandPackage> {
  const adapter = createLocalNonCncQuotePromotionPersistence()
  const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "wire_edm")
  const plan = buildNonCncQuotePromotionPlan({ ...request, preview })
  const snapshot = await adapter.recordPlan(plan)
  const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
  return buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(summary))
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
      nextStep: "Persist the quote snapshot.",
      status: "blocked",
    },
    reviewFlags: ["Material certificate required."],
  } satisfies ProcessQuotePreview
  const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })
  const snapshot = await adapter.recordPlan(plan)
  const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
  return buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(summary))
}
