import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage, type NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import {
  buildNonCncQuotePromotionExecutionRun,
  NON_CNC_QUOTE_PROMOTION_EXECUTION_VERSION,
} from "./nonCncQuotePromotionExecution"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T16:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion execution", () => {
  it("keeps blocked command packages payload-free and non-mutating", async () => {
    const commandPackage = await buildBlockedPackage()

    const run = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "commit",
    })

    expect(run).toMatchObject({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-27T17:00:00.000Z",
      executionVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_VERSION,
      mode: "commit",
      packageId: commandPackage.packageId,
      selectedPlanId: commandPackage.selectedPlanId,
      status: "blocked",
    })
    expect(run.targetRfqId).toBeUndefined()
    expect(run.commands).toHaveLength(3)
    expect(run.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(run.commands.every((command) => command.payload === undefined)).toBe(true)
    expect(run.nextActions).toContain("Persisted non-CNC quote promotion is not wired to workspace state yet")
  })

  it("prepares ready command packages in dry-run mode with stable fingerprints", async () => {
    const commandPackage = await buildReadyPackage()

    const run = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "dry_run",
    })
    const repeatedRun = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "dry_run",
    })
    ;(run.commands[0]!.payload as { quoteSnapshot: { partNumber: string } }).quoteSnapshot.partNumber = "MUTATED"

    expect(run.status).toBe("prepared")
    expect(run.targetRfqId).toBe(request.targetRfqId)
    expect(run.commands.map((command) => command.status)).toEqual(["prepared", "prepared", "prepared"])
    expect(run.nextActions).toEqual(["Review 3 prepared non-CNC promotion commands before committing."])
    expect(run.executionFingerprint).toBe(repeatedRun.executionFingerprint)
    const originalPayload = commandPackage.commands[0]!.payload
    expect(originalPayload?.kind).toBe("quote_snapshot")
    if (originalPayload?.kind === "quote_snapshot") {
      expect(originalPayload.quoteSnapshot.partNumber).toBe("SM-120-BRACKET")
    }
  })

  it("records committed promotion outcomes without requiring all commands at once", async () => {
    const commandPackage = await buildReadyPackage()

    const run = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandOutcomes: [
        { externalId: "quote-rfq-demo-204", key: "persist_quote_snapshot", status: "applied" },
        { key: "refresh_offer_readiness", message: "Offer readiness service unavailable.", status: "failed", warnings: ["Retry later."] },
      ],
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "commit",
    })

    expect(run.status).toBe("partial")
    expect(run.commands.map((command) => command.status)).toEqual(["applied", "failed", "pending"])
    expect(run.warnings).toContain("Refresh offer readiness: Retry later.")
    expect(run.warnings).toContain("Refresh offer readiness failed: Offer readiness service unavailable.")
    expect(run.nextActions).toEqual([
      "Resolve failed non-CNC promotion command: Refresh offer readiness.",
      "Record execution outcome for non-CNC promotion command: Enable offer builder.",
    ])
  })

  it("rejects unmatched and duplicate promotion outcomes", async () => {
    const commandPackage = await buildReadyPackage()

    expect(() =>
      buildNonCncQuotePromotionExecutionRun({
        actor: "FactoryBid Operator",
        commandOutcomes: [{ key: "missing_command", status: "applied" }],
        commandPackage,
        executedAt: "2026-06-27T17:00:00.000Z",
        mode: "commit",
      }),
    ).toThrow("command outcome missing_command does not match a non-CNC promotion command")
    expect(() =>
      buildNonCncQuotePromotionExecutionRun({
        actor: "FactoryBid Operator",
        commandOutcomes: [
          { key: "persist_quote_snapshot", status: "applied" },
          { key: "persist_quote_snapshot", status: "failed" },
        ],
        commandPackage,
        executedAt: "2026-06-27T17:00:00.000Z",
        mode: "commit",
      }),
    ).toThrow("duplicate command outcome persist_quote_snapshot")
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
    reviewFlags: [],
  } as ProcessQuotePreview
  const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })
  const snapshot = await adapter.recordPlan(plan)
  const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
  return buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(summary))
}
