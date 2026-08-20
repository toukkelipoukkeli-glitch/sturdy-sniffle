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
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel"
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
const executedAt = "2026-08-20T09:25:00.000Z"
const requestedAt = "2026-08-20T09:10:00.000Z"

describe("non-CNC final-gate follow-through outcome commit read model", () => {
  it("blocks when no outcome commit has been persisted", () => {
    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel({
        followThroughId: "non-cnc-final-gate-follow-through:missing",
        snapshot:
          createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence().snapshot(),
      })

    expect(readModel).toMatchObject({
      blockerLabels: ["No final-gate follow-through outcome commit record is available."],
      committedOutcomeCount: 0,
      followThroughId: "non-cnc-final-gate-follow-through:missing",
      followThroughTargets: [],
      readModelVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
      status: "blocked",
    })
    expect(readModel.followThroughBoundary).toContain("live customer-offer, file, release-review, export, connector")
  })

  it("builds a ready follow-through read model from committed outcome evidence", async () => {
    const { commitPlan, executionRun } = readyCommitResult("rfq-demo-404", "2026-08-20T09:00:00.000Z")
    if (!executionRun) {
      throw new Error("Expected ready final-gate follow-through outcome commit execution run")
    }
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence()
    const snapshot = await persistence.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-08-20T09:30:00.000Z",
      recordedBy: actor,
    })

    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel({
        snapshot,
      })

    expect(readModel).toMatchObject({
      blockerLabels: [],
      commitRecordId: `non-cnc-final-gate-follow-through-outcome-commit:${commitPlan.followThroughId}:${commitPlan.executionFingerprint}`,
      committedExecutionFingerprint: executionRun.executionFingerprint,
      committedOutcomeCount: 5,
      disposition: "commit_ready",
      executionFingerprint: commitPlan.executionFingerprint,
      followThroughId: commitPlan.followThroughId,
      followThroughTargets: [
        "customer_offer",
        "file_export",
        "release_review",
        "connector_reference",
        "final_gate_follow_through",
      ],
      latestApplyPlanId: "non-cnc-apply-plan:rfq-demo-404:ready",
      latestCommitRecordId: "non-cnc-outcome-commit-record:rfq-demo-404:ready",
      latestCommittedExecutionFingerprint: "non-cnc-outcome-commit-execution:rfq-demo-404:ready",
      latestExecutionFingerprint: "non-cnc-apply-execution:rfq-demo-404:ready",
      latestSourceExecutionFingerprint: "non-cnc-live-adapter-source-execution:rfq-demo-404:ready",
      readinessRecordId: "non-cnc-apply-readiness:rfq-demo-404:ready",
      reviewWarnings: ["Latest readiness warning."],
      status: "ready_to_follow_through",
      targetRfqId: "rfq-demo-404",
    })
    expect(readModel.nextOperatorMessage).toContain("ready for a future live follow-through adapter")
  })

  it("withholds live evidence for blocked records", async () => {
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

    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel({
        snapshot: await persistence.recordCommit({
          commitPlan,
          recordedAt: "2026-08-20T09:35:00.000Z",
          recordedBy: actor,
        }),
      })

    expect(readModel).toMatchObject({
      committedExecutionFingerprint: undefined,
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      followThroughId: commitPlan.followThroughId,
      followThroughTargets: [],
      readinessRecordId: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(readModel.blockerLabels).toContain("Final-gate follow-through outcome commit record is blocked.")
    expect(readModel.blockerLabels).toContain("Final-gate follow-through outcome commit record is review-only.")
  })

  it("rejects ready records whose snapshot indexes no longer contain required evidence", async () => {
    const { commitPlan, executionRun } = readyCommitResult("rfq-demo-405", "2026-08-20T09:05:00.000Z")
    if (!executionRun) {
      throw new Error("Expected ready final-gate follow-through outcome commit execution run")
    }
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence()
    const snapshot = await persistence.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-08-20T09:40:00.000Z",
      recordedBy: actor,
    })

    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel({
        snapshot: {
          ...snapshot,
          committedExecutionFingerprints: [],
          readinessRecordIds: [],
          targetRfqIds: [],
        },
      })

    expect(readModel).toMatchObject({
      committedExecutionFingerprint: undefined,
      committedOutcomeCount: 0,
      followThroughTargets: [],
      status: "blocked",
    })
    expect(readModel.blockerLabels).toEqual([
      "Final-gate follow-through outcome commit committed execution fingerprint is missing from the snapshot index.",
      "Final-gate follow-through outcome commit target RFQ is missing from the snapshot index.",
      "Final-gate follow-through outcome commit readiness record is missing from the snapshot index.",
    ])
  })

  it("selects the latest matching follow-through record when a filter is supplied", async () => {
    const older = readyCommitResult("rfq-demo-406", "2026-08-20T09:06:00.000Z")
    const newer = readyCommitResult("rfq-demo-407", "2026-08-20T09:07:00.000Z")
    if (!older.executionRun || !newer.executionRun) {
      throw new Error("Expected ready final-gate follow-through outcome commit execution runs")
    }
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence()
    await persistence.recordCommit({
      commitPlan: older.commitPlan,
      executionRun: older.executionRun,
      recordedAt: "2026-08-20T09:45:00.000Z",
      recordedBy: actor,
    })
    await persistence.recordCommit({
      commitPlan: newer.commitPlan,
      executionRun: newer.executionRun,
      recordedAt: "2026-08-20T09:50:00.000Z",
      recordedBy: "Release Reviewer",
    })

    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel({
        followThroughId: older.commitPlan.followThroughId,
        snapshot: persistence.snapshot(),
      })

    expect(readModel).toMatchObject({
      followThroughId: older.commitPlan.followThroughId,
      status: "ready_to_follow_through",
      targetRfqId: "rfq-demo-406",
    })
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
    requestedAt: "2026-08-20T09:00:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest readiness warning."],
    status: "ready",
    targetRfqId,
    warningCount: 1,
  }
}
