import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteApplicationMutationExecutionRun } from "./nonCncPromotedQuoteApplicationMutationExecution"
import { buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft } from "./nonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft"
import { buildNonCncPromotedQuoteApplicationMutationOutcomeCommitRun } from "./nonCncPromotedQuoteApplicationMutationOutcomeCommit"
import {
  createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence"
import {
  buildNonCncPromotedQuoteApplicationMutationPackage,
  type NonCncPromotedQuoteApplicationMutationPackage,
} from "./nonCncPromotedQuoteApplicationMutationPackage"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation outcome commit persistence", () => {
  it("records ready mutation outcome commit plans with committed execution fingerprints", async () => {
    const mutationPackage = readyMutationPackage()
    const { commitPlan, executionRun } = readyCommitRun()
    if (!executionRun) {
      throw new Error("Expected ready application mutation outcome commit run")
    }
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-06-29T12:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      blockedMutationPackageIds: [],
      commitReadyMutationPackageIds: [mutationPackage.mutationPackageId],
      outcomeCount: 3,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
      recordCount: 1,
      statusCounts: { ready: 1 },
      warningCount: 4,
    })
    expect(snapshot.latestRecord).toMatchObject({
      applicationId: mutationPackage.applicationId,
      commandOutcomeCount: 3,
      disposition: "commit_ready",
      executionFingerprint: executionRun.executionFingerprint,
      executionStatus: "succeeded",
      mutationPackageId: mutationPackage.mutationPackageId,
      status: "ready",
      targetRfqId: mutationPackage.targetRfqId,
    })
    expect(snapshot.latestRecord?.sourceExecutionFingerprint).toBe(commitPlan.sourceExecutionFingerprint)
    expect(snapshot.latestRecord?.executionFingerprint).not.toBe(commitPlan.sourceExecutionFingerprint)
    expect(snapshot.latestRecord?.commandOutcomes.map((outcome) => outcome.key)).toEqual([
      "replace_active_quote",
      "refresh_offer_workspace",
      "open_offer_builder",
    ])
    expect(snapshot.latestRecord?.reviewWarnings).toEqual([
      "Material certificate required.",
      "Apply active RFQ quote: Material certificate required.",
      "Refresh offer workspace: Material certificate required.",
      "Refresh release state: Material certificate required.",
    ])
  })

  it("records blocked mutation outcome commit plans as review-only snapshots", async () => {
    const mutationPackage = blockedMutationPackage()
    const dryRun = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:00:00.000Z",
      mode: "dry_run",
      mutationPackage,
    })
    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(dryRun)
    const { commitPlan } = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:15:00.000Z",
      mutationPackage,
      outcomeDraft,
    })
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      recordedAt: "2026-06-29T12:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      blockedMutationPackageIds: [mutationPackage.mutationPackageId],
      commitReadyMutationPackageIds: [],
      outcomeCount: 0,
      recordCount: 1,
      statusCounts: { blocked: 1 },
      warningCount: 4,
    })
    expect(snapshot.latestRecord).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      disposition: "review_only",
      executionFingerprint: undefined,
      executionStatus: undefined,
      mutationPackageId: mutationPackage.mutationPackageId,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(snapshot.latestRecord?.blockerLabels).toContain("Application mutation outcome draft must be ready before commit.")
  })

  it("rejects execution runs that do not match the mutation outcome commit plan", async () => {
    const { commitPlan, executionRun } = readyCommitRun()
    if (!executionRun) {
      throw new Error("Expected ready application mutation outcome commit run")
    }
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence()

    await expect(
      adapter.recordCommit({
        commitPlan,
        recordedAt: "2026-06-29T12:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("ready application mutation outcome commit plans require a commit execution run")

    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: { ...executionRun, mode: "dry_run" },
        recordedAt: "2026-06-29T12:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("application mutation outcome commit execution run must use commit mode")

    for (const [field, patchedRun] of [
      [
        "mutationPackageId",
        { ...executionRun, mutationPackageId: "non-cnc-promoted-quote-application-mutation-package:other" },
      ],
      ["applicationId", { ...executionRun, applicationId: "non-cnc-promoted-quote-application:other" }],
      [
        "applicationRecordId",
        {
          ...executionRun,
          applicationRecordId: "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:other",
        },
      ],
      ["packageId", { ...executionRun, packageId: "package-other" }],
      ["selectedPlanId", { ...executionRun, selectedPlanId: "non-cnc-promotion:other" }],
      ["targetRfqId", { ...executionRun, targetRfqId: "rfq-other" }],
    ] as const) {
      await expect(
        adapter.recordCommit({
          commitPlan,
          executionRun: patchedRun,
          recordedAt: "2026-06-29T12:20:00.000Z",
          recordedBy: "FactoryBid Operator",
        }),
      ).rejects.toThrow(`application mutation outcome commit execution run does not match commit plan: ${field}`)
    }

    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: {
          ...executionRun,
          commands: executionRun.commands.map((command, index) =>
            index === 0 ? { ...command, externalId: "active-rfq-quote:rfq-other:stale" } : command,
          ),
        },
        recordedAt: "2026-06-29T12:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("application mutation outcome commit execution run does not match commit plan: commandOutcomes")

    await expect(
      adapter.recordCommit({
        commitPlan: { ...commitPlan, status: "blocked" },
        executionRun,
        recordedAt: "2026-06-29T12:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("blocked application mutation outcome commit plans cannot be recorded with an execution run")

    await expect(
      adapter.recordCommit({
        commitPlan: {
          ...commitPlan,
          commandOutcomeCount: commitPlan.commandOutcomeCount + 1,
        },
        executionRun,
        recordedAt: "2026-06-29T12:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("commandOutcomeCount must equal commandOutcomes length")
  })

  it("deduplicates seeded records and returns cloned snapshots", async () => {
    const { commitPlan, executionRun, seededRecord } = await seedReadyRecord()

    const seededAdapter = createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            recordedAt: "2026-06-29T12:30:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: [],
            warningCount: 0,
          },
        ],
      },
    })
    const reversedSeededAdapter = createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            recordedAt: "2026-06-29T12:30:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: [],
            warningCount: 0,
          },
          seededRecord,
        ],
      },
    })

    const snapshot = seededAdapter.snapshot()
    snapshot.records[0]?.commandOutcomes[0]?.warnings?.push("mutated outside adapter")
    snapshot.commitReadyMutationPackageIds.push("mutated-package")

    expect(seededAdapter.snapshot()).toMatchObject({
      commitReadyMutationPackageIds: [commitPlan.mutationPackageId],
      outcomeCount: 3,
      recordCount: 1,
      warningCount: 0,
    })
    expect(seededAdapter.snapshot().latestRecord).toMatchObject({
      recordedBy: "Replacement Operator",
      warningCount: 0,
    })
    expect(seededAdapter.snapshot().records[0]?.commandOutcomes[0]?.warnings).toEqual(["Material certificate required."])
    expect(reversedSeededAdapter.snapshot()).toEqual(seededAdapter.snapshot())

    await seededAdapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-06-29T12:35:00.000Z",
      recordedBy: "Live Replacement Operator",
    })
    expect(seededAdapter.snapshot()).toMatchObject({
      commitReadyMutationPackageIds: [commitPlan.mutationPackageId],
      outcomeCount: 3,
      recordCount: 1,
      warningCount: 4,
    })
    expect(seededAdapter.snapshot().latestRecord).toMatchObject({
      recordedBy: "Live Replacement Operator",
      warningCount: 4,
    })
  })

  it("rejects invalid seeded mutation outcome commit records", async () => {
    const { seededRecord } = await seedReadyRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, recordedAt: "tomorrow" }],
        },
      }),
    ).toThrow("recordedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: 0 }],
        },
      }),
    ).toThrow("warningCount must equal reviewWarnings length")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executionFingerprint: undefined }],
        },
      }),
    ).toThrow("ready application mutation outcome commit records require an executionFingerprint")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executionStatus: undefined }],
        },
      }),
    ).toThrow("ready application mutation outcome commit records require an executionStatus")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              blockerCount: 1,
              blockerLabels: ["Manual review required."],
              disposition: "review_only",
              executionStatus: undefined,
              status: "blocked",
            },
          ],
        },
      }),
    ).toThrow("blocked application mutation outcome commit records cannot include an executionFingerprint")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              commitRecordId: "non-cnc-application-mutation-outcome-commit:stale-execution",
            },
          ],
        },
      }),
    ).toThrow("commitRecordId must match sourceExecutionFingerprint")
  })
})

function readyCommitRun() {
  const mutationPackage = readyMutationPackage()
  const dryRun = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
    actor: "FactoryBid Operator",
    executedAt: "2026-06-29T12:00:00.000Z",
    mode: "dry_run",
    mutationPackage,
  })
  return buildNonCncPromotedQuoteApplicationMutationOutcomeCommitRun({
    actor: "FactoryBid Operator",
    executedAt: "2026-06-29T12:15:00.000Z",
    mutationPackage,
    outcomeDraft: buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(dryRun),
  })
}

async function seedReadyRecord() {
  const { commitPlan, executionRun } = readyCommitRun()
  if (!executionRun) {
    throw new Error("Expected ready application mutation outcome commit run")
  }
  const adapter = createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence()
  const seededRecord = (
    await adapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-06-29T12:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })
  ).records[0]
  if (!seededRecord) {
    throw new Error("Expected seeded application mutation outcome commit record")
  }
  return { commitPlan, executionRun, seededRecord }
}

function readyMutationPackage(): NonCncPromotedQuoteApplicationMutationPackage {
  return buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel())
}

function blockedMutationPackage(): NonCncPromotedQuoteApplicationMutationPackage {
  return buildNonCncPromotedQuoteApplicationMutationPackage({
    ...readyReadModel(),
    blockerLabels: ["Application outcome commit read model is not ready to apply."],
    committedOutcomeCount: 0,
    executionFingerprint: undefined,
    mutationTargets: [],
    status: "blocked",
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
