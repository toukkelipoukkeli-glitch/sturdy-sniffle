import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage, type NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import { buildNonCncQuotePromotionExecutionRun } from "./nonCncQuotePromotionExecution"
import {
  createLocalNonCncQuotePromotionExecutionPersistence,
  NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION,
} from "./nonCncQuotePromotionExecutionPersistence"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T16:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion execution persistence", () => {
  it("records dry-run execution summaries without storing command payloads", async () => {
    const commandPackage = await buildReadyPackage()
    const run = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "dry_run",
    })
    const adapter = createLocalNonCncQuotePromotionExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      packageIds: [commandPackage.packageId],
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION,
      recordCount: 1,
      selectedPlanIds: [commandPackage.selectedPlanId],
      statusCounts: { prepared: 1 },
      warningCount: 0,
    })
    expect(snapshot.latestRun).toMatchObject({
      actor: "FactoryBid Operator",
      commandCount: 3,
      executedAt: "2026-06-27T17:00:00.000Z",
      executionFingerprint: run.executionFingerprint,
      mode: "dry_run",
      packageId: commandPackage.packageId,
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION,
      preparedCommandCount: 3,
      selectedPlanId: commandPackage.selectedPlanId,
      status: "prepared",
      targetRfqId: request.targetRfqId,
      warningCount: 0,
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
  })

  it("records committed execution outcome counts and sorts newest first", async () => {
    const commandPackage = await buildReadyPackage()
    const adapter = createLocalNonCncQuotePromotionExecutionPersistence()

    const pendingRun = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "commit",
    })
    const partialRun = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandOutcomes: [
        { externalId: "quote-rfq-demo-204", key: "persist_quote_snapshot", status: "applied" },
        { key: "refresh_offer_readiness", message: "Offer readiness service unavailable.", status: "failed" },
      ],
      commandPackage,
      executedAt: "2026-06-27T18:00:00.000Z",
      mode: "commit",
    })

    await adapter.recordRun(pendingRun)
    const snapshot = await adapter.recordRun(partialRun)

    expect(snapshot.recordCount).toBe(2)
    expect(snapshot.records.map((record) => record.executionFingerprint)).toEqual([
      partialRun.executionFingerprint,
      pendingRun.executionFingerprint,
    ])
    expect(snapshot.statusCounts).toEqual({ partial: 1, pending: 1 })
    expect(snapshot.latestRun).toMatchObject({
      appliedCommandCount: 1,
      failedCommandCount: 1,
      pendingCommandCount: 1,
      status: "partial",
      warningCount: 1,
    })
    expect(snapshot.pendingActionCount).toBe(3)
    expect(snapshot.warningCount).toBe(1)
  })

  it("deduplicates seeded execution records by fingerprint", async () => {
    const commandPackage = await buildReadyPackage()
    const adapter = createLocalNonCncQuotePromotionExecutionPersistence()
    const run = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "dry_run",
    })
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded promotion execution record")
    }

    const seededAdapter = createLocalNonCncQuotePromotionExecutionPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            actor: "Replacement Operator",
            pendingActionCount: 0,
            warningCount: 2,
          },
        ],
      },
    })

    const snapshot = seededAdapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.pendingActionCount).toBe(0)
    expect(snapshot.warningCount).toBe(2)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executionFingerprint: seededRecord.executionFingerprint,
      warningCount: 2,
    })
  })

  it("replaces records by fingerprint and returns cloned snapshots", async () => {
    const commandPackage = await buildReadyPackage()
    const run = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "dry_run",
    })
    const adapter = createLocalNonCncQuotePromotionExecutionPersistence()

    const snapshot = await adapter.recordRun(run)
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.packageIds.push("mutated-package")

    const repeatedSnapshot = await adapter.recordRun(run)

    expect(repeatedSnapshot.recordCount).toBe(1)
    expect(repeatedSnapshot.records[0]?.actor).toBe("FactoryBid Operator")
    expect(repeatedSnapshot.packageIds).toEqual([commandPackage.packageId])
  })

  it("rejects invalid seeded execution records", async () => {
    const commandPackage = await buildReadyPackage()
    const adapter = createLocalNonCncQuotePromotionExecutionPersistence()
    const run = buildNonCncQuotePromotionExecutionRun({
      actor: "FactoryBid Operator",
      commandPackage,
      executedAt: "2026-06-27T17:00:00.000Z",
      mode: "dry_run",
    })
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded promotion execution record")
    }

    expect(() =>
      createLocalNonCncQuotePromotionExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executedAt: "tomorrow" }],
        },
      }),
    ).toThrow("executedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncQuotePromotionExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: -1 }],
        },
      }),
    ).toThrow("warningCount must be a non-negative integer")
    expect(() =>
      createLocalNonCncQuotePromotionExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 4 }],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status command counts")
    expect(() =>
      createLocalNonCncQuotePromotionExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, targetRfqId: "" }],
        },
      }),
    ).toThrow("targetRfqId is required")
  })
})

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
  } satisfies ProcessQuotePreview
  const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })
  const snapshot = await adapter.recordPlan(plan)
  const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
  return buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(summary))
}
