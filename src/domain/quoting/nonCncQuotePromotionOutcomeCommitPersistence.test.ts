import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage, type NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import { buildNonCncQuotePromotionExecutionOutcomeDraft } from "./nonCncQuotePromotionExecutionOutcomeDraft"
import { buildNonCncQuotePromotionOutcomeCommitRun } from "./nonCncQuotePromotionOutcomeCommit"
import {
  createLocalNonCncQuotePromotionOutcomeCommitPersistence,
  NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
} from "./nonCncQuotePromotionOutcomeCommitPersistence"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-27T18:00:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC quote promotion outcome commit persistence", () => {
  it("records blocked commit plans as review-only snapshots without command outcomes", async () => {
    const commandPackage = await buildBlockedPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const { commitPlan } = buildNonCncQuotePromotionOutcomeCommitRun({
      actor: request.requestedBy,
      commandPackage,
      executedAt: request.requestedAt,
      outcomeDraft,
    })
    const adapter = createLocalNonCncQuotePromotionOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      recordedAt: "2026-06-27T18:10:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      blockedPackageIds: [commandPackage.packageId],
      commitReadyPackageIds: [],
      outcomeCount: 0,
      persistenceVersion: NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
      recordCount: 1,
      statusCounts: { blocked: 1 },
    })
    expect(snapshot.latestRecord).toMatchObject({
      commandOutcomeCount: 0,
      disposition: "review_only",
      executionFingerprint: undefined,
      packageId: commandPackage.packageId,
      recordedBy: "FactoryBid Operator",
      status: "blocked",
    })
    expect(snapshot.latestRecord?.blockerLabels).toContain("Outcome draft must be ready before commit.")
  })

  it("records ready commit plans with their committed execution fingerprint", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const { commitPlan, executionRun } = buildNonCncQuotePromotionOutcomeCommitRun({
      actor: request.requestedBy,
      commandPackage,
      executedAt: request.requestedAt,
      outcomeDraft,
    })
    if (!executionRun) {
      throw new Error("Expected ready outcome commit run")
    }
    const adapter = createLocalNonCncQuotePromotionOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-06-27T18:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      blockedPackageIds: [],
      commitReadyPackageIds: [commandPackage.packageId],
      outcomeCount: 3,
      recordCount: 1,
      statusCounts: { ready: 1 },
      warningCount: 1,
    })
    expect(snapshot.latestRecord).toMatchObject({
      commandOutcomeCount: 3,
      disposition: "commit_ready",
      executionFingerprint: executionRun.executionFingerprint,
      packageId: commandPackage.packageId,
      status: "ready",
      targetRfqId: request.targetRfqId,
    })
    expect(snapshot.latestRecord?.reviewWarnings).toEqual(["Material certificate required."])
  })

  it("rejects execution runs that do not match the commit plan", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const { commitPlan, executionRun } = buildNonCncQuotePromotionOutcomeCommitRun({
      actor: request.requestedBy,
      commandPackage,
      executedAt: request.requestedAt,
      outcomeDraft,
    })
    if (!executionRun) {
      throw new Error("Expected ready outcome commit run")
    }
    const adapter = createLocalNonCncQuotePromotionOutcomeCommitPersistence()

    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: { ...executionRun, selectedPlanId: "non-cnc-promotion:other" },
        recordedAt: "2026-06-27T18:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("outcome commit execution run does not match commit plan: selectedPlanId")

    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: { ...executionRun, mode: "dry_run" },
        recordedAt: "2026-06-27T18:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("outcome commit execution run must use commit mode")

    await expect(
      adapter.recordCommit({
        commitPlan: {
          ...commitPlan,
          status: "blocked",
        },
        executionRun,
        recordedAt: "2026-06-27T18:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("blocked outcome commit plans cannot be recorded with an execution run")

    await expect(
      adapter.recordCommit({
        commitPlan: {
          ...commitPlan,
          commandOutcomeCount: commitPlan.commandOutcomeCount + 1,
        },
        recordedAt: "2026-06-27T18:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("commandOutcomeCount must equal commandOutcomes length")
  })

  it("replaces commit records by package and returns cloned snapshots", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const { commitPlan, executionRun } = buildNonCncQuotePromotionOutcomeCommitRun({
      actor: request.requestedBy,
      commandPackage,
      executedAt: request.requestedAt,
      outcomeDraft,
    })
    if (!executionRun) {
      throw new Error("Expected ready outcome commit run")
    }
    const adapter = createLocalNonCncQuotePromotionOutcomeCommitPersistence()

    const firstSnapshot = await adapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-06-27T18:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })
    firstSnapshot.records[0]?.reviewWarnings.push("mutated outside adapter")
    firstSnapshot.commitReadyPackageIds.push("mutated-package")
    const replacementSnapshot = await adapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-06-27T18:30:00.000Z",
      recordedBy: "Second Operator",
    })

    expect(replacementSnapshot.recordCount).toBe(1)
    expect(replacementSnapshot.latestRecord).toMatchObject({
      recordedAt: "2026-06-27T18:30:00.000Z",
      recordedBy: "Second Operator",
    })
    expect(replacementSnapshot.latestRecord?.reviewWarnings).toEqual(["Material certificate required."])
    expect(adapter.snapshot().commitReadyPackageIds).toEqual([commandPackage.packageId])
  })

  it("deduplicates and validates seeded commit records", async () => {
    const commandPackage = await buildReadyPackage()
    const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
    const { commitPlan, executionRun } = buildNonCncQuotePromotionOutcomeCommitRun({
      actor: request.requestedBy,
      commandPackage,
      executedAt: request.requestedAt,
      outcomeDraft,
    })
    if (!executionRun) {
      throw new Error("Expected ready outcome commit run")
    }
    const adapter = createLocalNonCncQuotePromotionOutcomeCommitPersistence()
    const seededRecord = (
      await adapter.recordCommit({
        commitPlan,
        executionRun,
        recordedAt: "2026-06-27T18:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      })
    ).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded commit record")
    }

    const seededAdapter = createLocalNonCncQuotePromotionOutcomeCommitPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            recordedAt: "2026-06-27T18:40:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: [],
            warningCount: 0,
          },
        ],
      },
    })

    expect(seededAdapter.snapshot()).toMatchObject({
      outcomeCount: 3,
      recordCount: 1,
      warningCount: 0,
    })
    expect(seededAdapter.snapshot().latestRecord).toMatchObject({
      recordedBy: "Replacement Operator",
      warningCount: 0,
    })
    expect(() =>
      createLocalNonCncQuotePromotionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, recordedAt: "tomorrow" }],
        },
      }),
    ).toThrow("recordedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncQuotePromotionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: 0 }],
        },
      }),
    ).toThrow("warningCount must equal reviewWarnings length")
    expect(() =>
      createLocalNonCncQuotePromotionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            seededRecord,
            {
              ...seededRecord,
              commitRecordId: "non-cnc-outcome-commit:stale-package-id",
            },
          ],
        },
      }),
    ).toThrow("commitRecordId must match packageId")
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
      status: "ready",
    },
    reviewFlags: ["Material certificate required."],
  } satisfies ProcessQuotePreview
  const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })
  const snapshot = await adapter.recordPlan(plan)
  const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
  return buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(summary))
}
