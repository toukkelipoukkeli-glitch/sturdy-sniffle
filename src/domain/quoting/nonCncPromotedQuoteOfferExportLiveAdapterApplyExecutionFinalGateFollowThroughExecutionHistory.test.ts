import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence"
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

const actor = "FactoryBid Operator"
const requestedAt = "2026-08-10T18:40:00.000Z"

describe("non-CNC live-adapter final-gate follow-through execution history", () => {
  it("summarizes empty execution history", () => {
    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence().snapshot(),
    )

    expect(summary).toMatchObject({
      actionItems: [
        "Persist a final-gate follow-through dry-run before enabling customer-visible release follow-through adapters.",
      ],
      appliedCommandCount: 0,
      latestRun: undefined,
      operatorSummary:
        "No non-CNC live-adapter final-gate follow-through execution runs have been persisted yet.",
      recentRuns: [],
      severity: "neutral",
      status: "empty",
      title: "No final-gate follow-through execution history",
      totalRuns: 0,
    })
    expect(summary.exportText).toContain("Recent runs:\n- none")
  })

  it("summarizes prepared dry-run execution evidence", async () => {
    const followThrough = readyFollowThroughPlan("rfq-demo-204", "2026-08-10T18:30:00.000Z")
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence()
    const snapshot = await persistence.recordRun(
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        executedAt: "2026-08-10T18:45:00.000Z",
        followThrough,
        mode: "dry_run",
      }),
    )

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary(snapshot)

    expect(summary).toMatchObject({
      actionItems: [
        "Review prepared final-gate follow-through commands before committing provider side effects.",
        "Review 1 warning before customer-visible release.",
      ],
      appliedCommandCount: 0,
      commandCount: 5,
      preparedCommandCount: 5,
      severity: "ready",
      status: "prepared",
      title: "Final-gate follow-through dry-run prepared",
      totalRuns: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toContain("dry-run prepared 5 commands")
    expect(summary.followThroughIds).toEqual([followThrough.followThroughId])
    expect(summary.readinessRecordIds).toEqual(["non-cnc-apply-readiness:rfq-demo-204:ready"])
    expect(summary.latestExecutionFingerprints).toEqual(["non-cnc-apply-execution:rfq-demo-204:ready"])
    expect(summary.exportText).toContain("Prepared commands: 5")
    expect(summary.exportText).toContain(
      "Boundary: final-gate follow-through execution history is deterministic review data only",
    )
  })

  it("summarizes partial commit outcomes as needs-review with pending actions", async () => {
    const followThrough = readyFollowThroughPlan("rfq-demo-204", "2026-08-10T18:30:00.000Z")
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence()
    const snapshot = await persistence.recordRun(
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        commandOutcomes: [
          { key: followThrough.commands[0]!.key, status: "applied" },
          { key: followThrough.commands[1]!.key, message: "Release review blocked.", status: "failed" },
        ],
        executedAt: "2026-08-10T18:45:00.000Z",
        followThrough,
        mode: "commit",
      }),
    )

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary(snapshot)

    expect(summary).toMatchObject({
      actionItems: [
        "Review failed or partial final-gate follow-through command outcomes before retrying.",
        "Review 2 warnings before customer-visible release.",
      ],
      appliedCommandCount: 1,
      failedCommandCount: 1,
      pendingActionCount: 4,
      pendingCommandCount: 3,
      severity: "attention",
      status: "needs_review",
      title: "Final-gate follow-through execution history needs review",
      warningCount: 2,
    })
    expect(summary.operatorSummary).toContain("recorded partial command outcomes")
    expect(summary.exportText).toContain("Failed commands: 1")
  })

  it("summarizes blocked latest runs while retaining prior aggregate evidence", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence()
    await persistence.recordRun(
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        executedAt: "2026-08-10T18:45:00.000Z",
        followThrough: readyFollowThroughPlan("rfq-demo-204", "2026-08-10T18:30:00.000Z"),
        mode: "dry_run",
      }),
    )
    const snapshot = await persistence.recordRun(
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        executedAt: "2026-08-10T18:50:00.000Z",
        followThrough: blockedFollowThroughPlan(),
        mode: "commit",
      }),
    )

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary(snapshot)

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve final-gate follow-through execution blockers before recording another execution.",
        "Review 1 warning before customer-visible release.",
      ],
      blockedCommandCount: 5,
      preparedCommandCount: 5,
      severity: "attention",
      status: "blocked",
      title: "Final-gate follow-through execution history blocked",
      totalRuns: 2,
    })
    expect(summary.operatorSummary).toContain("blocked after 2 runs")
    expect(summary.latestRun).toMatchObject({
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(summary.targetRfqIds).toEqual(["rfq-demo-204"])
    expect(summary.exportText).toContain("Blocked commands: 5")
  })

  it("limits recent runs without dropping aggregate counts", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence()
    await persistence.recordRun(
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        executedAt: "2026-08-10T18:45:00.000Z",
        followThrough: readyFollowThroughPlan("rfq-demo-204", "2026-08-10T18:30:00.000Z"),
        mode: "dry_run",
      }),
    )
    await persistence.recordRun(
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        executedAt: "2026-08-10T18:50:00.000Z",
        followThrough: readyFollowThroughPlan("rfq-demo-205", "2026-08-10T18:35:00.000Z"),
        mode: "dry_run",
      }),
    )

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary(
      persistence.snapshot(),
      { recentRunLimit: 1 },
    )

    expect(summary.totalRuns).toBe(2)
    expect(summary.commandCount).toBe(10)
    expect(summary.preparedCommandCount).toBe(10)
    expect(summary.recentRuns).toHaveLength(1)
    expect(summary.recentRuns[0]?.targetRfqId).toBe("rfq-demo-205")
  })

  it("returns cloned summary records and arrays", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence()
    const snapshot = await persistence.recordRun(
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        executedAt: "2026-08-10T18:45:00.000Z",
        followThrough: readyFollowThroughPlan("rfq-demo-204", "2026-08-10T18:30:00.000Z"),
        mode: "dry_run",
      }),
    )

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary(snapshot)
    summary.recentRuns[0]!.actor = "Mutated Operator"
    summary.latestRun!.targetRfqId = "mutated-rfq"
    summary.followThroughIds.push("mutated-follow-through")

    const restoredSummary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary(snapshot)

    expect(restoredSummary.recentRuns[0]?.actor).toBe(actor)
    expect(restoredSummary.latestRun?.targetRfqId).toBe("rfq-demo-204")
    expect(restoredSummary.followThroughIds).toEqual([summary.latestRun?.followThroughId])
  })

  it("rejects invalid recent run limits", () => {
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence().snapshot(),
        { recentRunLimit: 0 },
      ),
    ).toThrow("recentRunLimit must be a positive safe integer")
  })
})

function readyFollowThroughPlan(
  targetRfqId: string,
  recordedAt: string,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
        initialSnapshot: { records: [readyReadinessRecord({ recordedAt, targetRfqId })] },
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
    requestedAt: "2026-08-10T18:25:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest readiness warning."],
    status: "ready",
    targetRfqId,
    warningCount: 1,
  }
}
