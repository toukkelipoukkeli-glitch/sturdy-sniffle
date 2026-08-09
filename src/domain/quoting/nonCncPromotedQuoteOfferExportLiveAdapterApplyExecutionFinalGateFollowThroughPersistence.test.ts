import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence"

const actor = "FactoryBid Operator"
const requestedAt = "2026-08-09T20:00:00.000Z"

describe("non-CNC live-adapter apply execution final-gate follow-through persistence", () => {
  it("records ready follow-through plans without storing command payloads or export text", async () => {
    const followThrough = readyFollowThrough()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence()

    const snapshot = await adapter.recordFollowThrough({
      followThrough,
      recordedAt: "2026-08-09T20:05:00.000Z",
      recordedBy: actor,
    })

    expect(snapshot).toMatchObject({
      appliedCommandCount: 5,
      blockedCommandCount: 0,
      blockedFollowThroughIds: [],
      latestApplyPlanIds: [followThrough.latestApplyPlanId],
      latestCommitRecordIds: [followThrough.latestCommitRecordId],
      plannedCommandCount: 5,
      readyFollowThroughIds: [followThrough.followThroughId],
      recordCount: 1,
      statusCounts: { ready: 1 },
    })
    expect(snapshot.latestRecord).toMatchObject({
      disposition: "follow_through_ready",
      followThroughFingerprint: followThrough.followThroughFingerprint,
      followThroughId: followThrough.followThroughId,
      persistenceVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_PERSISTENCE_VERSION,
      readinessRecordId: followThrough.readinessRecordId,
      recordedAt: "2026-08-09T20:05:00.000Z",
      recordedBy: actor,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
    expect(snapshot.records[0]).not.toHaveProperty("exportText")
  })

  it("records blocked follow-through plans as review-only while withholding ready evidence", async () => {
    const followThrough = blockedFollowThrough()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence()

    const snapshot = await adapter.recordFollowThrough({
      followThrough,
      recordedAt: "2026-08-09T20:06:00.000Z",
      recordedBy: actor,
    })

    expect(snapshot).toMatchObject({
      appliedCommandCount: 0,
      blockedCommandCount: 5,
      blockedFollowThroughIds: [followThrough.followThroughId],
      plannedCommandCount: 0,
      readyFollowThroughIds: [],
      recordCount: 1,
      statusCounts: { blocked: 1 },
    })
    expect(snapshot.latestRecord).toMatchObject({
      disposition: "review_only",
      latestApplyPlanId: undefined,
      latestCommitRecordId: undefined,
      latestExecutionFingerprint: undefined,
      readinessRecordId: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(snapshot.latestRecord?.blockerLabels).toEqual([
      "Persist ready apply-execution readiness history before final-gate follow-through.",
    ])
  })

  it("derives command counts from command descriptors instead of stale summary fields", async () => {
    const followThrough = readyFollowThrough()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence()

    const snapshot = await adapter.recordFollowThrough({
      followThrough: { ...followThrough, commandCount: 99, plannedCommandCount: 99 },
      recordedAt: "2026-08-09T20:05:00.000Z",
      recordedBy: actor,
    })

    expect(snapshot.latestRecord).toMatchObject({
      blockedCommandCount: 0,
      commandCount: 5,
      plannedCommandCount: 5,
    })
  })

  it("deduplicates seeded follow-through records by followThroughId using the newest record", async () => {
    const seededRecord = await seedReadyFollowThroughRecord()

    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            recordedAt: "2026-08-09T20:10:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: ["Replacement warning."],
            warningCount: 1,
          },
        ],
      },
    })
    const snapshot = adapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.warningCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      followThroughId: seededRecord.followThroughId,
      recordedAt: "2026-08-09T20:10:00.000Z",
      recordedBy: "Replacement Operator",
      reviewWarnings: ["Replacement warning."],
    })
  })

  it("rejects conflicting seeded duplicates with the same followThroughId and recordedAt", async () => {
    const seededRecord = await seedReadyFollowThroughRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence({
        initialSnapshot: {
          records: [
            seededRecord,
            {
              ...seededRecord,
              recordedBy: "Conflicting Operator",
            },
          ],
        },
      }),
    ).toThrow("conflicting live-adapter final-gate follow-through records cannot share followThroughId and recordedAt")
  })

  it("rejects conflicting older duplicates even after a newer record wins the identity", async () => {
    const olderRecord = await seedReadyFollowThroughRecord()
    const newerRecord = {
      ...olderRecord,
      recordedAt: "2026-08-09T20:10:00.000Z",
      recordedBy: "Replacement Operator",
    } satisfies NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence({
        initialSnapshot: {
          records: [
            olderRecord,
            newerRecord,
            {
              ...olderRecord,
              recordedBy: "Conflicting Older Operator",
            },
          ],
        },
      }),
    ).toThrow("conflicting live-adapter final-gate follow-through records cannot share followThroughId and recordedAt")
  })

  it("returns cloned follow-through snapshots", async () => {
    const followThrough = readyFollowThrough()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence()

    const snapshot = await adapter.recordFollowThrough({
      followThrough,
      recordedAt: "2026-08-09T20:05:00.000Z",
      recordedBy: actor,
    })
    snapshot.records[0]!.recordedBy = "Mutated Operator"
    snapshot.readyFollowThroughIds.push("mutated-follow-through")
    snapshot.records[0]!.reviewWarnings.push("Mutated warning.")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.recordedBy).toBe(actor)
    expect(clonedSnapshot.records[0]?.reviewWarnings).toEqual(["Latest readiness warning."])
    expect(clonedSnapshot.readyFollowThroughIds).toEqual([followThrough.followThroughId])
  })

  it("rejects seeded records with inconsistent command counts", async () => {
    const seededRecord = await seedReadyFollowThroughRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 4 }],
        },
      }),
    ).toThrow("commandCount must equal plannedCommandCount plus blockedCommandCount")
  })

  it("rejects blocked seeded records with ready evidence identifiers", async () => {
    const seededRecord = await seedReadyFollowThroughRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              appliedCommandCount: 0,
              blockedCommandCount: 0,
              commandCount: 0,
              disposition: "review_only",
              latestApplyPlanId: "non-cnc-apply-plan:rfq-demo-204:ready",
              plannedCommandCount: 0,
              readinessRecordId: undefined,
              status: "blocked",
              targetRfqId: undefined,
            },
          ],
        },
      }),
    ).toThrow("blocked live-adapter final-gate follow-through records cannot include ready evidence identifiers")
  })
})

async function seedReadyFollowThroughRecord(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord> {
  const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence()
  const seededRecord = (
    await adapter.recordFollowThrough({
      followThrough: readyFollowThrough(),
      recordedAt: "2026-08-09T20:05:00.000Z",
      recordedBy: actor,
    })
  ).records[0]
  if (!seededRecord) {
    throw new Error("Expected seeded follow-through record")
  }
  return seededRecord
}

function readyFollowThrough() {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: historyFromRecords([readyRecord({ recordedAt: "2026-08-09T19:00:00.000Z" })]),
    requestedAt,
    requestedBy: actor,
  })
}

function blockedFollowThrough() {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence().snapshot(),
    ),
    requestedAt,
    requestedBy: actor,
  })
}

function historyFromRecords(records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord[]) {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
      initialSnapshot: { records },
    }).snapshot(),
  )
}

function readyRecord({ recordedAt }: { recordedAt: string }): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  return {
    appliedCommandCount: 5,
    blockerCount: 0,
    blockerLabels: [],
    latestApplyPlanFingerprint: "non-cnc-apply-plan-fingerprint:rfq-demo-204:ready",
    latestApplyPlanId: "non-cnc-apply-plan:rfq-demo-204:ready",
    latestCommitPlanId: "non-cnc-outcome-commit-plan:rfq-demo-204:ready",
    latestCommitRecordId: "non-cnc-outcome-commit-record:rfq-demo-204:ready",
    latestCommittedExecutionFingerprint: "non-cnc-outcome-commit-execution:rfq-demo-204:ready",
    latestExecutionFingerprint: "non-cnc-apply-execution:rfq-demo-204:ready",
    latestSourceExecutionFingerprint: "non-cnc-live-adapter-source-execution:rfq-demo-204:ready",
    latestStatus: "succeeded",
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
    persistedRunCount: 1,
    readinessRecordId: "non-cnc-apply-readiness:rfq-demo-204:ready",
    readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
    recordedAt,
    recordedBy: actor,
    requestedAt: "2026-08-09T18:55:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest readiness warning."],
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
  }
}
