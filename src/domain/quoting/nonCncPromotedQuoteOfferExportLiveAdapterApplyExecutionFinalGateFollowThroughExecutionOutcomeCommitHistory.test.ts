import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan,
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistory"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistory"
import { NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-12T13:35:00.000Z"
const requestedAt = "2026-08-12T13:20:00.000Z"

describe("non-CNC final-gate follow-through outcome commit history", () => {
  it("summarizes empty outcome commit history", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence().snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Persist a reviewed final-gate follow-through outcome commit before enabling customer-visible release follow-through adapters.",
      ],
      blockedCount: 0,
      blockerCount: 0,
      commandOutcomeCount: 0,
      committedCount: 0,
      latestRecord: undefined,
      operatorSummary:
        "No non-CNC live-adapter final-gate follow-through outcome commit records have been persisted yet.",
      recentRecords: [],
      severity: "neutral",
      status: "empty",
      title: "No final-gate follow-through outcome commit history",
      totalRecords: 0,
      warningCount: 0,
    })
    expect(summary.exportText).toContain("Recent final-gate outcome commits:\n- none")
  })

  it("summarizes blocked outcome commits without exposing ready evidence", async () => {
    const followThrough = blockedFollowThroughPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
      dryRun(followThrough),
    )
    const commitPlan =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan({
        followThrough,
        outcomeDraft,
      })
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence()

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary(
        await persistence.recordCommit({
          commitPlan,
          recordedAt: "2026-08-12T13:40:00.000Z",
          recordedBy: actor,
        }),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve final-gate follow-through outcome commit blockers before retrying release follow-through wiring.",
      ],
      blockedCount: 1,
      blockerCount: commitPlan.blockerLabels.length,
      commandOutcomeCount: 0,
      committedCount: 0,
      committedExecutionFingerprints: [],
      latestApplyPlanIds: [],
      latestRecord: expect.objectContaining({
        committedExecutionFingerprint: undefined,
        disposition: "review_only",
        status: "blocked",
        targetRfqId: undefined,
      }),
      readinessRecordIds: [],
      severity: "attention",
      status: "blocked",
      targetRfqIds: [],
      title: "Final-gate follow-through outcome commit history blocked",
      totalRecords: 1,
      warningCount: 0,
    })
    expect(summary.operatorSummary).toContain("blocked after 1 record")
    expect(summary.exportText).toContain("Committed executions: none")
    expect(summary.exportText).toContain("Blocked records: 1")
    expect(summary.exportText).toContain(
      "Boundary: final-gate follow-through outcome commit history is deterministic review data only",
    )
  })

  it("summarizes committed outcome history with latest final-gate evidence", async () => {
    const { commitPlan, executionRun } = readyCommitResult("rfq-demo-204", "2026-08-12T13:10:00.000Z")
    if (!executionRun) {
      throw new Error("Expected ready final-gate follow-through outcome commit execution run")
    }
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence()

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary(
        await persistence.recordCommit({
          commitPlan,
          executionRun,
          recordedAt: "2026-08-12T13:45:00.000Z",
          recordedBy: actor,
        }),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Review committed final-gate follow-through outcome evidence before wiring active release state.",
        "Review 1 warning before customer-visible release.",
      ],
      blockedCount: 0,
      commandOutcomeCount: 5,
      committedCount: 1,
      committedExecutionFingerprints: [executionRun.executionFingerprint],
      commitReadyRecordIds: [
        `non-cnc-final-gate-follow-through-outcome-commit:${commitPlan.followThroughId}:${commitPlan.executionFingerprint}`,
      ],
      latestApplyPlanIds: ["non-cnc-apply-plan:rfq-demo-204:ready"],
      latestRecord: expect.objectContaining({
        commandOutcomeCount: 5,
        committedExecutionFingerprint: executionRun.executionFingerprint,
        disposition: "commit_ready",
        status: "ready",
        targetRfqId: "rfq-demo-204",
      }),
      readinessRecordIds: ["non-cnc-apply-readiness:rfq-demo-204:ready"],
      severity: "success",
      status: "committed",
      targetRfqIds: ["rfq-demo-204"],
      title: "Final-gate follow-through outcome commit history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toContain("persisted 5 reviewed outcomes")
    expect(summary.exportText).toContain("Non-CNC live adapter final-gate follow-through outcome commit history")
    expect(summary.exportText).toContain("Reviewed outcomes: 5")
    expect(summary.exportText).toContain(`Committed executions: ${executionRun.executionFingerprint}`)
  })

  it("limits recent records without dropping aggregate evidence and returns clones", async () => {
    const older = readyCommitResult("rfq-demo-204", "2026-08-12T13:10:00.000Z")
    const newer = readyCommitResult("rfq-demo-205", "2026-08-12T13:15:00.000Z")
    if (!older.executionRun || !newer.executionRun) {
      throw new Error("Expected ready final-gate follow-through outcome commit execution runs")
    }
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence()
    await persistence.recordCommit({
      commitPlan: older.commitPlan,
      executionRun: older.executionRun,
      recordedAt: "2026-08-12T13:45:00.000Z",
      recordedBy: actor,
    })
    await persistence.recordCommit({
      commitPlan: newer.commitPlan,
      executionRun: newer.executionRun,
      recordedAt: "2026-08-12T13:50:00.000Z",
      recordedBy: "Release Reviewer",
    })

    const snapshot = persistence.snapshot()
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )
    summary.recentRecords[0]!.reviewWarnings.push("mutated warning")
    summary.latestRecord!.targetRfqId = "mutated-rfq"
    summary.followThroughIds.push("mutated-follow-through")
    summary.committedExecutionFingerprints.push("mutated-execution")

    const restored =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )

    expect(restored).toMatchObject({
      commandOutcomeCount: 10,
      committedCount: 2,
      recentRecords: [expect.objectContaining({ recordedBy: "Release Reviewer", targetRfqId: "rfq-demo-205" })],
      targetRfqIds: ["rfq-demo-204", "rfq-demo-205"],
      totalRecords: 2,
      warningCount: 2,
    })
    expect(restored.followThroughIds).not.toContain("mutated-follow-through")
    expect(restored.committedExecutionFingerprints).not.toContain("mutated-execution")
    expect(restored.latestRecord?.targetRfqId).toBe("rfq-demo-205")
    expect(restored.recentRecords[0]?.reviewWarnings).toEqual(["Latest readiness warning."])
    expect(snapshot.latestRecord?.targetRfqId).toBe("rfq-demo-205")
    expect(snapshot.records[0]?.recordedBy).toBe("Release Reviewer")
  })

  it("rejects invalid recent record limits", () => {
    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary(
        snapshot,
        { recentRecordLimit: 0 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary(
        snapshot,
        { recentRecordLimit: 1.5 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
  })
})

function readyCommitResult(targetRfqId: string, readinessRecordedAt: string) {
  const followThrough = readyFollowThroughPlan(targetRfqId, readinessRecordedAt)
  const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
    dryRun(followThrough),
  )
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRun({
    actor,
    executedAt,
    followThrough,
    outcomeDraft,
  })
}

function dryRun(
  followThrough: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
    actor,
    executedAt,
    followThrough,
    mode: "dry_run",
  })
}

function readyFollowThroughPlan(
  targetRfqId: string,
  readinessRecordedAt: string,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
        initialSnapshot: { records: [readyReadinessRecord({ recordedAt: readinessRecordedAt, targetRfqId })] },
      }).snapshot(),
    ),
    requestedAt,
    requestedBy: actor,
  })
}

function blockedFollowThroughPlan(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence().snapshot(),
    ),
    requestedAt,
    requestedBy: actor,
  })
}

function readyReadinessRecord({
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
    requestedAt: "2026-08-12T13:00:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest readiness warning."],
    status: "ready",
    targetRfqId,
    warningCount: 1,
  }
}
