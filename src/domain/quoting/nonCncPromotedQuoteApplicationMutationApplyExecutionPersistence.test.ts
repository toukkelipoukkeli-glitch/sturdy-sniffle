import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun } from "./nonCncPromotedQuoteApplicationMutationApplyExecution"
import { buildNonCncPromotedQuoteApplicationMutationApplyPlan } from "./nonCncPromotedQuoteApplicationMutationApplyPlan"
import {
  createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteApplicationMutationApplyExecutionPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation apply execution persistence", () => {
  it("records dry-run mutation apply execution summaries without storing command payloads", async () => {
    const applyPlan = buildReadyApplyPlan()
    const run = buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
      actor: "FactoryBid Operator",
      applyPlan,
      executedAt: "2026-07-02T13:30:00.000Z",
      mode: "dry_run",
    })
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      applicationIds: [applyPlan.applicationId],
      applicationRecordIds: [applyPlan.applicationRecordId],
      applyPlanIds: [applyPlan.applyPlanId],
      mutationPackageIds: [applyPlan.mutationPackageId],
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
      recordCount: 1,
      selectedPlanIds: [applyPlan.selectedPlanId],
      sourceExecutionFingerprints: [applyPlan.sourceExecutionFingerprint],
      statusCounts: { prepared: 1 },
      targetRfqIds: [applyPlan.targetRfqId],
      warningCount: 4,
    })
    expect(snapshot.latestRun).toMatchObject({
      actor: "FactoryBid Operator",
      applicationId: applyPlan.applicationId,
      applicationRecordId: applyPlan.applicationRecordId,
      appliedCommandCount: 0,
      applyPlanId: applyPlan.applyPlanId,
      commandCount: 3,
      executedAt: "2026-07-02T13:30:00.000Z",
      executionFingerprint: run.executionFingerprint,
      executionVersion: run.executionVersion,
      mode: "dry_run",
      mutationPackageId: applyPlan.mutationPackageId,
      packageId: applyPlan.packageId,
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
      preparedCommandCount: 3,
      selectedPlanId: applyPlan.selectedPlanId,
      sourceExecutionFingerprint: applyPlan.sourceExecutionFingerprint,
      status: "prepared",
      targetRfqId: applyPlan.targetRfqId,
      warningCount: 4,
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
  })

  it("records committed mutation apply outcome counts and sorts newest first", async () => {
    const applyPlan = buildReadyApplyPlan()
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence()
    const pendingRun = buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
      actor: "FactoryBid Operator",
      applyPlan,
      executedAt: "2026-07-02T13:35:00.000Z",
      mode: "commit",
    })
    const partialRun = buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
      actor: "FactoryBid Operator",
      applyPlan,
      commandOutcomes: [
        {
          externalId: "quote:rfq-demo-204:active",
          key: "apply_active_rfq_quote",
          message: "Active RFQ quote updated.",
          mutationTarget: "active_rfq_quote",
          status: "applied",
        },
        {
          key: "apply_offer_workspace",
          message: "Offer workspace adapter unavailable.",
          mutationTarget: "offer_workspace",
          status: "failed",
          warnings: ["Offer adapter fallback used."],
        },
      ],
      executedAt: "2026-07-02T13:40:00.000Z",
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
      warningCount: 6,
    })
    expect(snapshot.pendingActionCount).toBe(3)
    expect(snapshot.warningCount).toBe(10)
  })

  it("keeps blocked apply plan ids while withholding ready-only source and target ids", async () => {
    const applyPlan = buildNonCncPromotedQuoteApplicationMutationApplyPlan({
      ...readyReadModel(),
      blockerLabels: ["Mutation commit must be reviewed."],
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      mutationTargets: [],
      status: "blocked",
    })
    const run = buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
      actor: "FactoryBid Operator",
      applyPlan,
      executedAt: "2026-07-02T13:50:00.000Z",
      mode: "dry_run",
    })
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.applyPlanIds).toEqual([applyPlan.applyPlanId])
    expect(snapshot.sourceExecutionFingerprints).toEqual([])
    expect(snapshot.targetRfqIds).toEqual([])
    expect(snapshot.latestRun).toMatchObject({
      blockedCommandCount: 3,
      sourceExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
  })

  it("deduplicates seeded mutation apply execution records by fingerprint using the newest record", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded mutation apply execution record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-07-02T13:45:00.000Z",
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
      executedAt: "2026-07-02T13:45:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      warningCount: 2,
    })
  })

  it("keeps a newer seeded mutation apply execution when an older duplicate run is recorded", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded mutation apply execution record")
    }
    const seededAdapter = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-07-02T13:45:00.000Z",
            pendingActionCount: 0,
          },
        ],
      },
    })

    const snapshot = await seededAdapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-07-02T13:45:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      pendingActionCount: 0,
    })
  })

  it("returns cloned mutation apply execution snapshots", async () => {
    const run = buildReadyDryRun()
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence()

    const snapshot = await adapter.recordRun(run)
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.applyPlanIds.push("mutated-apply-plan")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.actor).toBe("FactoryBid Operator")
    expect(clonedSnapshot.applyPlanIds).toEqual([run.applyPlanId])
  })

  it("rejects invalid seeded mutation apply execution records", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded mutation apply execution record")
    }

    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executedAt: "tomorrow" }],
        },
      }),
    ).toThrow("executedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: -1 }],
        },
      }),
    ).toThrow("warningCount must be a non-negative safe integer")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, pendingActionCount: Number.MAX_SAFE_INTEGER + 1 }],
        },
      }),
    ).toThrow("pendingActionCount must be a non-negative safe integer")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 4 }],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status command counts")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, applyPlanId: "" }],
        },
      }),
    ).toThrow("applyPlanId is required")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, status: "blocked", sourceExecutionFingerprint: "source-ready", targetRfqId: undefined }],
        },
      }),
    ).toThrow("blocked application mutation apply execution records cannot include a sourceExecutionFingerprint")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, sourceExecutionFingerprint: undefined, status: "blocked", targetRfqId: "rfq-demo-204" }],
        },
      }),
    ).toThrow("blocked application mutation apply execution records cannot include a targetRfqId")
  })
})

function buildReadyDryRun() {
  return buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
    actor: "FactoryBid Operator",
    applyPlan: buildReadyApplyPlan(),
    executedAt: "2026-07-02T13:30:00.000Z",
    mode: "dry_run",
  })
}

function buildReadyApplyPlan() {
  return buildNonCncPromotedQuoteApplicationMutationApplyPlan(readyReadModel())
}

function readyReadModel(): NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel {
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId:
      "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    blockerLabels: [],
    committedOutcomeCount: 3,
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
    executionStatus: "succeeded",
    mutationBoundary:
      "Application mutation outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
    mutationPackageId: "non-cnc-promoted-quote-application-mutation-package:rfq-demo-204:ready",
    mutationTargets: ["active_rfq_quote", "offer_workspace", "release_state"],
    nextOperatorMessage:
      "Promoted non-CNC application mutation outcome commit is ready for a future active RFQ, offer, and release mutation adapter.",
    packageId: "package-ready",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: ["Material certificate required."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    sourceExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-dry-run-ready",
    status: "ready_to_apply",
    targetRfqId: "rfq-demo-204",
  }
}
