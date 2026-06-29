import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteApplicationMutationExecutionRun } from "./nonCncPromotedQuoteApplicationMutationExecution"
import {
  createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteApplicationMutationExecutionPersistence"
import { buildNonCncPromotedQuoteApplicationMutationPackage } from "./nonCncPromotedQuoteApplicationMutationPackage"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation execution persistence", () => {
  it("records dry-run mutation execution summaries without storing command payloads", async () => {
    const mutationPackage = buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel())
    const run = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:00:00.000Z",
      mode: "dry_run",
      mutationPackage,
    })
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      applicationIds: [mutationPackage.applicationId],
      applicationRecordIds: [mutationPackage.applicationRecordId],
      mutationPackageIds: [mutationPackage.mutationPackageId],
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
      recordCount: 1,
      selectedPlanIds: [mutationPackage.selectedPlanId],
      statusCounts: { prepared: 1 },
      targetRfqIds: [mutationPackage.targetRfqId],
      warningCount: 4,
    })
    expect(snapshot.latestRun).toMatchObject({
      actor: "FactoryBid Operator",
      applicationId: mutationPackage.applicationId,
      applicationRecordId: mutationPackage.applicationRecordId,
      commandCount: 3,
      executedAt: "2026-06-29T12:00:00.000Z",
      executionFingerprint: run.executionFingerprint,
      executionVersion: run.executionVersion,
      mode: "dry_run",
      mutationPackageId: mutationPackage.mutationPackageId,
      packageId: mutationPackage.packageId,
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
      preparedCommandCount: 3,
      selectedPlanId: mutationPackage.selectedPlanId,
      status: "prepared",
      targetRfqId: mutationPackage.targetRfqId,
      warningCount: 4,
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
  })

  it("records committed mutation outcome counts and sorts newest first", async () => {
    const mutationPackage = buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel())
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence()

    const pendingRun = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:00:00.000Z",
      mode: "commit",
      mutationPackage,
    })
    const partialRun = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      commandOutcomes: [
        { externalId: "quote:rfq-demo-204:promoted", key: "replace_active_quote", status: "applied" },
        {
          key: "refresh_offer_workspace",
          message: "Offer readiness adapter unavailable.",
          status: "failed",
          warnings: ["Offer adapter fallback used."],
        },
      ],
      executedAt: "2026-06-29T12:05:00.000Z",
      mode: "commit",
      mutationPackage,
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

  it("keeps blocked mutation package ids while withholding ready-only target ids", async () => {
    const mutationPackage = buildNonCncPromotedQuoteApplicationMutationPackage({
      ...readyReadModel(),
      blockerLabels: ["Application outcome commit execution fingerprint is missing."],
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      mutationTargets: [],
      status: "blocked",
    })
    const run = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:10:00.000Z",
      mode: "dry_run",
      mutationPackage,
    })
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.mutationPackageIds).toEqual([mutationPackage.mutationPackageId])
    expect(snapshot.targetRfqIds).toEqual([])
    expect(snapshot.latestRun).toMatchObject({
      blockedCommandCount: 3,
      status: "blocked",
      targetRfqId: undefined,
    })
  })

  it("deduplicates seeded mutation execution records by fingerprint using the newest record", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded mutation execution record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-06-29T12:05:00.000Z",
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
      executedAt: "2026-06-29T12:05:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      warningCount: 2,
    })
  })

  it("keeps a newer seeded mutation execution when an older duplicate run is recorded", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded mutation execution record")
    }
    const seededAdapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-06-29T12:05:00.000Z",
            pendingActionCount: 0,
          },
        ],
      },
    })

    const snapshot = await seededAdapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-06-29T12:05:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      pendingActionCount: 0,
    })
  })

  it("uses a total-order tie-breaker for same-fingerprint seeded mutation records", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded mutation execution record")
    }

    const leftFirst = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence({
      initialSnapshot: {
        records: [
          { ...seededRecord, actor: "Zulu Operator" },
          { ...seededRecord, actor: "Alpha Operator" },
        ],
      },
    }).snapshot()
    const rightFirst = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence({
      initialSnapshot: {
        records: [
          { ...seededRecord, actor: "Alpha Operator" },
          { ...seededRecord, actor: "Zulu Operator" },
        ],
      },
    }).snapshot()

    expect(leftFirst.records[0]?.actor).toBe("Alpha Operator")
    expect(rightFirst.records[0]?.actor).toBe("Alpha Operator")
  })

  it("returns cloned mutation execution snapshots", async () => {
    const run = buildReadyDryRun()
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence()

    const snapshot = await adapter.recordRun(run)
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.mutationPackageIds.push("mutated-package")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.actor).toBe("FactoryBid Operator")
    expect(clonedSnapshot.mutationPackageIds).toEqual([run.mutationPackageId])
  })

  it("rejects invalid seeded mutation execution records", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded mutation execution record")
    }

    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executedAt: "tomorrow" }],
        },
      }),
    ).toThrow("executedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: -1 }],
        },
      }),
    ).toThrow("warningCount must be a non-negative integer")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 4 }],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status command counts")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, mutationPackageId: "" }],
        },
      }),
    ).toThrow("mutationPackageId is required")
  })
})

function buildReadyDryRun() {
  return buildNonCncPromotedQuoteApplicationMutationExecutionRun({
    actor: "FactoryBid Operator",
    executedAt: "2026-06-29T12:00:00.000Z",
    mode: "dry_run",
    mutationPackage: buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel()),
  })
}

function readyReadModel(): NonCncPromotedQuoteApplicationOutcomeCommitReadModel {
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId:
      "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    blockerLabels: [],
    committedOutcomeCount: 3,
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
    mutationBoundary:
      "Application outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later mutation adapter applies them.",
    mutationTargets: ["active_rfq_quote", "offer_workspace", "release_state"],
    nextOperatorMessage: "Promoted non-CNC application outcome commit is ready for a future active RFQ, offer, and release mutation adapter.",
    packageId: "package-ready",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: ["Material certificate required."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    status: "ready_to_apply",
    targetRfqId: "rfq-demo-204",
  }
}
