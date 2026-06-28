import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage, type NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import { buildNonCncQuotePromotionExecutionOutcomeDraft } from "./nonCncQuotePromotionExecutionOutcomeDraft"
import {
  buildNonCncQuotePromotionOutcomeCommitPlan,
  buildNonCncQuotePromotionOutcomeCommitRun,
  NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_VERSION,
} from "./nonCncQuotePromotionOutcomeCommit"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T16:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion outcome commit adapter", () => {
  it("builds a ready commit plan and committed execution run from reviewed outcome drafts", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)

    const result = buildNonCncQuotePromotionOutcomeCommitRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      outcomeDraft,
    })

    expect(result.commitPlan).toMatchObject({
      blockerLabels: [],
      commandOutcomeCount: 3,
      commitVersion: NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_VERSION,
      packageId: commandPackage.packageId,
      selectedPlanId: commandPackage.selectedPlanId,
      status: "ready",
      targetRfqId: request.targetRfqId,
    })
    expect(result.commitPlan.nextOperatorMessage).toBe("Commit 3 reviewed non-CNC promotion outcomes.")
    expect(result.commitPlan.commandOutcomes.map((outcome) => outcome.key)).toEqual([
      "persist_quote_snapshot",
      "refresh_offer_readiness",
      "enable_offer_builder",
    ])
    expect(result.executionRun).toMatchObject({
      mode: "commit",
      packageId: commandPackage.packageId,
      status: "succeeded",
      targetRfqId: request.targetRfqId,
    })
    expect(result.executionRun?.commands.map((command) => command.status)).toEqual(["applied", "applied", "applied"])
  })

  it("keeps blocked drafts outcome-free and commit-run-free", async () => {
    const commandPackage = await buildBlockedPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)

    const result = buildNonCncQuotePromotionOutcomeCommitRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      outcomeDraft,
    })

    expect(result.commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      packageId: commandPackage.packageId,
      status: "blocked",
    })
    expect(result.commitPlan.blockerLabels).toContain("Outcome draft must be ready before commit.")
    expect(result.executionRun).toBeUndefined()
  })

  it("rejects outcome drafts from a different command package", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = {
      ...buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage),
      packageId: "non-cnc-promotion-command-package:other",
    }

    expect(() => buildNonCncQuotePromotionOutcomeCommitPlan({ commandPackage, outcomeDraft })).toThrow(
      "outcome draft does not match command package: packageId",
    )
  })

  it("blocks malformed ready drafts that are missing a suggested outcome", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const malformedDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0 ? { ...command, suggestedOutcome: undefined } : command,
      ),
    }

    const commitPlan = buildNonCncQuotePromotionOutcomeCommitPlan({ commandPackage, outcomeDraft: malformedDraft })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain("Missing suggested outcome for Persist quote snapshot.")
  })

  it("blocks ready drafts with missing package commands", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const staleDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.slice(0, -1),
    }

    const commitPlan = buildNonCncQuotePromotionOutcomeCommitPlan({ commandPackage, outcomeDraft: staleDraft })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain("Outcome draft command list does not match package commands.")
  })

  it("blocks ready drafts with command-level blockers", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const targetCommand = outcomeDraft.commandOutcomes[0]
    if (!targetCommand) {
      throw new Error("Expected ready outcome command")
    }
    const staleDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0
          ? {
              ...command,
              blockerLabels: ["Operator review required."],
              status: "blocked" as const,
            }
          : command,
      ),
    }

    const commitPlan = buildNonCncQuotePromotionOutcomeCommitPlan({ commandPackage, outcomeDraft: staleDraft })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain("Operator review required.")
    expect(commitPlan.blockerLabels).toContain(`Outcome draft entry for ${targetCommand.label} is not ready for commit.`)
  })

  it("clones suggested outcomes so later draft mutation cannot change commit inputs", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const commitPlan = buildNonCncQuotePromotionOutcomeCommitPlan({ commandPackage, outcomeDraft })

    const firstOutcome = outcomeDraft.commandOutcomes[0]?.suggestedOutcome
    if (!firstOutcome) {
      throw new Error("Expected ready outcome draft")
    }
    firstOutcome.externalId = "mutated-after-plan"
    firstOutcome.warnings?.push("mutated warning")

    expect(commitPlan.commandOutcomes[0]).toMatchObject({
      externalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
      key: "persist_quote_snapshot",
      warnings: ["Material certificate required."],
    })
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
      nextStep: "Process input draft is ready for quote promotion.",
      status: "ready",
    },
    reviewFlags: ["Material certificate required."],
  } satisfies ProcessQuotePreview
  const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })
  const snapshot = await adapter.recordPlan(plan)
  const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
  return buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(summary))
}
