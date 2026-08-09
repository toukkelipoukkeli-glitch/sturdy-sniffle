import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"

const actor = "FactoryBid Operator"
const requestedAt = "2026-08-09T21:00:00.000Z"

describe("non-CNC live-adapter apply execution final-gate follow-through history", () => {
  it("summarizes empty follow-through history", () => {
    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence().snapshot(),
    )

    expect(summary).toMatchObject({
      actionItems: ["Persist final-gate follow-through records before wiring release follow-through adapters."],
      blockedCount: 0,
      followThroughReadyCount: 0,
      latestRecord: undefined,
      operatorSummary: "No non-CNC live-adapter final-gate follow-through records have been persisted yet.",
      recentRecords: [],
      severity: "neutral",
      status: "empty",
      title: "No live-adapter final-gate follow-through history",
      totalRecords: 0,
    })
    expect(summary.exportText).toContain("Recent follow-through records:\n- none")
  })

  it("summarizes ready follow-through records with review-only evidence aggregates", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence()
    const ready = await persistence.recordFollowThrough({
      followThrough: readyFollowThrough("rfq-demo-204", "2026-08-09T21:00:00.000Z"),
      recordedAt: "2026-08-09T21:05:00.000Z",
      recordedBy: actor,
    })

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary(ready)

    expect(summary).toMatchObject({
      actionItems: [
        "Review persisted final-gate follow-through commands before wiring customer-visible release state.",
        "Review 1 warning before customer-visible release.",
      ],
      appliedCommandCount: 5,
      blockedCommandCount: 0,
      blockedCount: 0,
      followThroughReadyCount: 1,
      plannedCommandCount: 5,
      severity: "success",
      status: "follow_through_ready",
      title: "Live-adapter final-gate follow-through history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toContain("ready with 5 applied commands")
    expect(summary.readyFollowThroughIds).toEqual([summary.latestRecord?.followThroughId])
    expect(summary.targetRfqIds).toEqual(["rfq-demo-204"])
    expect(summary.readinessRecordIds).toEqual(["non-cnc-apply-readiness:rfq-demo-204:ready"])
    expect(summary.latestExecutionFingerprints).toEqual(["non-cnc-apply-execution:rfq-demo-204:ready"])
    expect(summary.latestSourceExecutionFingerprints).toEqual([
      "non-cnc-live-adapter-source-execution:rfq-demo-204:ready",
    ])
    expect(summary.exportText).toContain("Follow-through-ready records: 1")
    expect(summary.exportText).toContain(
      "Boundary: final-gate follow-through history is deterministic review data only",
    )
  })

  it("summarizes blocked latest records while retaining prior ready aggregate evidence", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence()
    await persistence.recordFollowThrough({
      followThrough: readyFollowThrough("rfq-demo-204", "2026-08-09T21:00:00.000Z"),
      recordedAt: "2026-08-09T21:05:00.000Z",
      recordedBy: actor,
    })
    const snapshot = await persistence.recordFollowThrough({
      followThrough: blockedFollowThrough(),
      recordedAt: "2026-08-09T21:10:00.000Z",
      recordedBy: actor,
    })

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary(snapshot)

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve final-gate follow-through blockers before enabling release follow-through adapters.",
        "Review 1 warning before customer-visible release.",
      ],
      appliedCommandCount: 5,
      blockedCommandCount: 5,
      blockedCount: 1,
      followThroughReadyCount: 1,
      severity: "attention",
      status: "blocked",
      title: "Live-adapter final-gate follow-through history blocked",
      totalRecords: 2,
    })
    expect(summary.operatorSummary).toContain("blocked after 2 records")
    expect(summary.latestRecord).toMatchObject({
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(summary.targetRfqIds).toEqual(["rfq-demo-204"])
    expect(summary.exportText).toContain("Blocked records: 1")
    expect(summary.exportText).toContain("blocked 5")
  })

  it("limits recent records without dropping aggregate counts", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence()
    await persistence.recordFollowThrough({
      followThrough: readyFollowThrough("rfq-demo-204", "2026-08-09T21:00:00.000Z"),
      recordedAt: "2026-08-09T21:05:00.000Z",
      recordedBy: actor,
    })
    await persistence.recordFollowThrough({
      followThrough: readyFollowThrough("rfq-demo-205", "2026-08-09T21:10:00.000Z"),
      recordedAt: "2026-08-09T21:15:00.000Z",
      recordedBy: actor,
    })

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary(
      persistence.snapshot(),
      { recentRecordLimit: 1 },
    )

    expect(summary.totalRecords).toBe(2)
    expect(summary.followThroughReadyCount).toBe(2)
    expect(summary.appliedCommandCount).toBe(10)
    expect(summary.recentRecords).toHaveLength(1)
    expect(summary.recentRecords[0]?.targetRfqId).toBe("rfq-demo-205")
  })

  it("returns cloned summary records and arrays", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence()
    const snapshot = await persistence.recordFollowThrough({
      followThrough: readyFollowThrough("rfq-demo-204", "2026-08-09T21:00:00.000Z"),
      recordedAt: "2026-08-09T21:05:00.000Z",
      recordedBy: actor,
    })

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary(snapshot)
    summary.recentRecords[0]!.recordedBy = "Mutated Operator"
    summary.recentRecords[0]!.reviewWarnings.push("Mutated warning.")
    summary.latestRecord!.blockerLabels.push("Mutated blocker.")
    summary.readyFollowThroughIds.push("mutated-follow-through")

    const restoredSummary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary(snapshot)

    expect(restoredSummary.recentRecords[0]?.recordedBy).toBe(actor)
    expect(restoredSummary.recentRecords[0]?.reviewWarnings).toEqual(["Latest readiness warning."])
    expect(restoredSummary.latestRecord?.blockerLabels).toEqual([])
    expect(restoredSummary.readyFollowThroughIds).toEqual([summary.latestRecord?.followThroughId])
  })

  it("rejects invalid recent record limits", () => {
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence().snapshot(),
        { recentRecordLimit: 0 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
  })
})

function readyFollowThrough(targetRfqId: string, recordedAt: string) {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: historyFromRecords([readyRecord({ recordedAt, targetRfqId })]),
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

function readyRecord({
  recordedAt,
  targetRfqId,
}: {
  recordedAt: string
  targetRfqId: string
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  return {
    appliedCommandCount: 5,
    blockerCount: 0,
    blockerLabels: [],
    latestApplyPlanFingerprint: `non-cnc-apply-plan-fingerprint:${targetRfqId}:ready`,
    latestApplyPlanId: `non-cnc-apply-plan:${targetRfqId}:ready`,
    latestCommitPlanId: `non-cnc-outcome-commit-plan:${targetRfqId}:ready`,
    latestCommitRecordId: `non-cnc-outcome-commit-record:${targetRfqId}:ready`,
    latestCommittedExecutionFingerprint: `non-cnc-outcome-commit-execution:${targetRfqId}:ready`,
    latestExecutionFingerprint: `non-cnc-apply-execution:${targetRfqId}:ready`,
    latestSourceExecutionFingerprint: `non-cnc-live-adapter-source-execution:${targetRfqId}:ready`,
    latestStatus: "succeeded",
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
    persistedRunCount: 1,
    readinessRecordId: `non-cnc-apply-readiness:${targetRfqId}:ready`,
    readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
    recordedAt,
    recordedBy: actor,
    requestedAt: "2026-08-09T20:55:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest readiness warning."],
    status: "ready",
    targetRfqId,
    warningCount: 1,
  }
}
