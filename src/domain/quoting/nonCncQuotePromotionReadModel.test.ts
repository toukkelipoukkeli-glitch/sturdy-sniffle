import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage, type NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import { buildNonCncQuotePromotionExecutionRun } from "./nonCncQuotePromotionExecution"
import { buildNonCncQuotePromotionExecutionOutcomeDraft } from "./nonCncQuotePromotionExecutionOutcomeDraft"
import { buildNonCncQuotePromotionOutcomeCommitRun } from "./nonCncQuotePromotionOutcomeCommit"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import {
  buildNonCncQuotePromotionReadModel,
  NON_CNC_QUOTE_PROMOTION_READ_MODEL_VERSION,
} from "./nonCncQuotePromotionReadModel"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T19:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion read model", () => {
  it("surfaces a promoted quote candidate from a successful reviewed commit execution", async () => {
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

    const readModel = buildNonCncQuotePromotionReadModel({ commandPackage, executionRun })

    expect(readModel).toMatchObject({
      blockerLabels: [],
      executionFingerprint: executionRun.executionFingerprint,
      nextOperatorMessage: "Non-CNC quote promotion is available as a read-only promoted quote candidate.",
      packageId: commandPackage.packageId,
      quoteExternalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
      readModelVersion: NON_CNC_QUOTE_PROMOTION_READ_MODEL_VERSION,
      selectedPlanId: commandPackage.selectedPlanId,
      status: "promoted",
      targetRfqId: request.targetRfqId,
    })
    expect(readModel.quoteSnapshot).toMatchObject({
      partNumber: "SM-120-BRACKET",
      process: "sheet_metal",
      totalCents: 54905,
    })
    expect(readModel.offerReadinessExternalId).toBe("offer-readiness:rfq-demo-204:sheet-metal:54905")
    expect(readModel.offerBuilderExternalId).toBe(
      "offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal-sm-120-bracket-sheet-metal-v1:non-cnc-quote-promotion-command-package-v1",
    )
  })

  it("keeps blocked and dry-run executions from becoming promoted quote candidates", async () => {
    const blockedPackage = await buildBlockedPackage()
    const blockedModel = buildNonCncQuotePromotionReadModel({ commandPackage: blockedPackage })

    expect(blockedModel).toMatchObject({
      quoteSnapshot: undefined,
      status: "blocked",
    })
    expect(blockedModel.blockerLabels).toContain("No committed promotion execution run recorded.")
    expect(blockedModel.blockerLabels).toContain("Promoted quote snapshot has not been applied.")

    const readyPackage = await buildReadyPackage()
    const dryRun = buildNonCncQuotePromotionExecutionRun({
      actor: request.requestedBy,
      commandPackage: readyPackage,
      executedAt: request.requestedAt,
      mode: "dry_run",
    })
    const dryRunModel = buildNonCncQuotePromotionReadModel({ commandPackage: readyPackage, executionRun: dryRun })

    expect(dryRunModel).toMatchObject({
      executionFingerprint: dryRun.executionFingerprint,
      quoteSnapshot: undefined,
      status: "blocked",
    })
    expect(dryRunModel.blockerLabels).toContain("Promotion execution must be committed, not dry-run only.")
    expect(dryRunModel.blockerLabels).toContain("Promotion execution status is prepared.")
  })

  it("rejects mismatched execution runs as blocked read models", async () => {
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

    const readModel = buildNonCncQuotePromotionReadModel({
      commandPackage,
      executionRun: { ...executionRun, selectedPlanId: "non-cnc-promotion:other" },
    })

    expect(readModel).toMatchObject({
      quoteSnapshot: undefined,
      status: "blocked",
    })
    expect(readModel.blockerLabels).toContain("Promotion execution does not match command package: selectedPlanId.")
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
    reviewFlags: [],
  } satisfies ProcessQuotePreview
  const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })
  const snapshot = await adapter.recordPlan(plan)
  const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
  return buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(summary))
}
