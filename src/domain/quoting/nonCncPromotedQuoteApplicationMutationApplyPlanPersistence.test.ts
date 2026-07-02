import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteApplicationMutationApplyPlan } from "./nonCncPromotedQuoteApplicationMutationApplyPlan"
import {
  createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationMutationApplyPlanRecord,
} from "./nonCncPromotedQuoteApplicationMutationApplyPlanPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation apply plan persistence", () => {
  it("records ready apply plan summaries without storing mutation payloads", async () => {
    const applyPlan = buildReadyApplyPlan()
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence()

    const snapshot = await adapter.recordApplyPlan({
      applyPlan,
      recordedAt: "2026-07-02T10:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      applyReadyPlanIds: [applyPlan.applyPlanId],
      blockedCommandCount: 0,
      blockedPlanIds: [],
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION,
      readyCommandCount: 3,
      recordCount: 1,
      statusCounts: { ready: 1 },
      warningCount: 1,
    })
    expect(snapshot.latestRecord).toMatchObject({
      applicationId: applyPlan.applicationId,
      applicationRecordId: applyPlan.applicationRecordId,
      applyPlanId: applyPlan.applyPlanId,
      commandCount: 3,
      committedOutcomeCount: 3,
      disposition: "apply_ready",
      executionFingerprint: applyPlan.executionFingerprint,
      mutationPackageId: applyPlan.mutationPackageId,
      planVersion: applyPlan.planVersion,
      readyCommandCount: 3,
      recordedAt: "2026-07-02T10:20:00.000Z",
      recordedBy: "FactoryBid Operator",
      sourceExecutionFingerprint: applyPlan.sourceExecutionFingerprint,
      status: "ready",
      targetRfqId: applyPlan.targetRfqId,
      warningCount: 1,
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
  })

  it("records blocked apply plans as review-only while withholding ready-only identifiers", async () => {
    const applyPlan = buildBlockedApplyPlan()
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence()

    const snapshot = await adapter.recordApplyPlan({
      applyPlan,
      recordedAt: "2026-07-02T10:25:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      applyReadyPlanIds: [],
      blockedCommandCount: 3,
      blockedPlanIds: [applyPlan.applyPlanId],
      readyCommandCount: 0,
      recordCount: 1,
      statusCounts: { blocked: 1 },
    })
    expect(snapshot.latestRecord).toMatchObject({
      blockedCommandCount: 3,
      disposition: "review_only",
      executionFingerprint: undefined,
      sourceExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(snapshot.latestRecord?.blockerLabels).toContain("Application mutation outcome commit read model is not ready to apply.")
  })

  it("derives commandCount from command descriptors instead of a stale summary field", async () => {
    const applyPlan = buildReadyApplyPlan()
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence()

    const snapshot = await adapter.recordApplyPlan({
      applyPlan: { ...applyPlan, commandCount: 99 },
      recordedAt: "2026-07-02T10:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot.latestRecord).toMatchObject({
      blockedCommandCount: 0,
      commandCount: 3,
      readyCommandCount: 3,
    })
  })

  it("sorts newest first and counts mixed ready and blocked records", async () => {
    const readyPlan = buildReadyApplyPlan()
    const blockedPlan = buildBlockedApplyPlan()
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence()

    await adapter.recordApplyPlan({
      applyPlan: readyPlan,
      recordedAt: "2026-07-02T10:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })
    const snapshot = await adapter.recordApplyPlan({
      applyPlan: blockedPlan,
      recordedAt: "2026-07-02T10:25:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot.records.map((record) => record.applyPlanId)).toEqual([blockedPlan.applyPlanId, readyPlan.applyPlanId])
    expect(snapshot.statusCounts).toEqual({ blocked: 1, ready: 1 })
    expect(snapshot.readyCommandCount).toBe(3)
    expect(snapshot.blockedCommandCount).toBe(3)
  })

  it("deduplicates seeded apply plan records by applyPlanId using the newest record", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence()
    const applyPlan = buildReadyApplyPlan()
    const seededRecord = (
      await adapter.recordApplyPlan({
        applyPlan,
        recordedAt: "2026-07-02T10:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      })
    ).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded apply plan record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            recordedAt: "2026-07-02T10:30:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: ["Replacement warning."],
            warningCount: 1,
          },
        ],
      },
    })

    const snapshot = seededAdapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.warningCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      applyPlanId: seededRecord.applyPlanId,
      recordedAt: "2026-07-02T10:30:00.000Z",
      recordedBy: "Replacement Operator",
      reviewWarnings: ["Replacement warning."],
    })
  })

  it("keeps a newer seeded apply plan when an older duplicate plan is recorded", async () => {
    const baseAdapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence()
    const applyPlan = buildReadyApplyPlan()
    const seededRecord = (
      await baseAdapter.recordApplyPlan({
        applyPlan,
        recordedAt: "2026-07-02T10:20:00.000Z",
        recordedBy: "FactoryBid Operator",
      })
    ).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded apply plan record")
    }
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            recordedAt: "2026-07-02T10:30:00.000Z",
            recordedBy: "Replacement Operator",
          },
        ],
      },
    })

    const snapshot = await adapter.recordApplyPlan({
      applyPlan,
      recordedAt: "2026-07-02T10:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      recordedAt: "2026-07-02T10:30:00.000Z",
      recordedBy: "Replacement Operator",
    })
  })

  it("returns cloned apply plan snapshots", async () => {
    const applyPlan = buildReadyApplyPlan()
    const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence()

    const snapshot = await adapter.recordApplyPlan({
      applyPlan,
      recordedAt: "2026-07-02T10:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })
    snapshot.records[0]!.recordedBy = "Mutated Operator"
    snapshot.applyReadyPlanIds.push("mutated-plan")
    snapshot.records[0]!.reviewWarnings.push("Mutated warning.")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.recordedBy).toBe("FactoryBid Operator")
    expect(clonedSnapshot.records[0]?.reviewWarnings).toEqual(["Material certificate required."])
    expect(clonedSnapshot.applyReadyPlanIds).toEqual([applyPlan.applyPlanId])
  })

  it("rejects seeded apply plan records with invalid timestamps", async () => {
    const seededRecord = await seedReadyApplyPlanRecord()
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, recordedAt: "tomorrow" }],
        },
      }),
    ).toThrow("recordedAt must be a valid ISO timestamp")
  })

  it("rejects seeded apply plan records with inconsistent command counts", async () => {
    const seededRecord = await seedReadyApplyPlanRecord()
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 2 }],
        },
      }),
    ).toThrow("commandCount must equal readyCommandCount plus blockedCommandCount")
  })

  it("rejects seeded apply plan records with unsafe warning counts", async () => {
    const seededRecord = await seedReadyApplyPlanRecord()
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: Number.MAX_SAFE_INTEGER + 1 }],
        },
      }),
    ).toThrow("warningCount must be a non-negative safe integer")
  })

  it("rejects blocked seeded apply plan records with ready-only target ids", async () => {
    const seededRecord = await seedReadyApplyPlanRecord()
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              disposition: "review_only",
              executionFingerprint: undefined,
              sourceExecutionFingerprint: undefined,
              status: "blocked",
              targetRfqId: "rfq-demo-204",
            },
          ],
        },
      }),
    ).toThrow("blocked application mutation apply plan records cannot include a targetRfqId")
  })
})

async function seedReadyApplyPlanRecord(): Promise<NonCncPromotedQuoteApplicationMutationApplyPlanRecord> {
  const adapter = createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence()
  const seededRecord = (
    await adapter.recordApplyPlan({
      applyPlan: buildReadyApplyPlan(),
      recordedAt: "2026-07-02T10:20:00.000Z",
      recordedBy: "FactoryBid Operator",
    })
  ).records[0]
  if (!seededRecord) {
    throw new Error("Expected seeded apply plan record")
  }
  return seededRecord
}

function buildReadyApplyPlan() {
  return buildNonCncPromotedQuoteApplicationMutationApplyPlan(readyReadModel())
}

function buildBlockedApplyPlan() {
  return buildNonCncPromotedQuoteApplicationMutationApplyPlan({
    ...readyReadModel(),
    blockerLabels: ["Mutation outcome commit needs operator review."],
    committedOutcomeCount: 0,
    executionFingerprint: undefined,
    mutationPackageId: "non-cnc-promoted-quote-application-mutation-package:rfq-demo-204:review",
    mutationTargets: [],
    status: "blocked",
  })
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
