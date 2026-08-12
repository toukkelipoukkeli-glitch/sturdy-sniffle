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
import { buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistory"
import { NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-12T10:15:00.000Z"
const recordedAt = "2026-08-12T10:20:00.000Z"
const requestedAt = "2026-08-12T10:00:00.000Z"

describe("non-CNC final-gate follow-through outcome commit persistence", () => {
  it("records ready commit runs into clone-safe local snapshots", async () => {
    const { commitPlan, executionRun } = readyCommitResult()
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence()

    const snapshot = await persistence.recordCommit({
      commitPlan,
      executionRun,
      recordedAt,
      recordedBy: actor,
    })

    expect(snapshot).toMatchObject({
      blockedCommitRecordIds: [],
      commandOutcomeCount: 5,
      commitReadyRecordIds: [
        `non-cnc-final-gate-follow-through-outcome-commit:${commitPlan.followThroughId}:${commitPlan.executionFingerprint}`,
      ],
      committedExecutionFingerprints: [executionRun!.executionFingerprint],
      executionFingerprints: [commitPlan.executionFingerprint],
      latestApplyPlanIds: ["non-cnc-apply-plan:rfq-demo-204:ready"],
      latestRecord: {
        commandOutcomeCount: 5,
        disposition: "commit_ready",
        status: "ready",
        targetRfqId: "rfq-demo-204",
      },
      recordCount: 1,
      statusCounts: { ready: 1 },
    })

    snapshot.records[0].reviewWarnings.push("mutated warning")
    snapshot.latestRecord!.targetRfqId = "mutated-rfq"
    const restored = persistence.snapshot()
    expect(restored.records[0].reviewWarnings).toEqual(["Latest readiness warning."])
    expect(restored.latestRecord?.targetRfqId).toBe("rfq-demo-204")
  })

  it("records blocked commit plans without ready evidence identifiers", async () => {
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

    const snapshot = await persistence.recordCommit({
      commitPlan,
      recordedAt,
      recordedBy: actor,
    })

    expect(snapshot).toMatchObject({
      blockedCommitRecordIds: [
        `non-cnc-final-gate-follow-through-outcome-commit:${commitPlan.followThroughId}:${commitPlan.executionFingerprint}`,
      ],
      blockerCount: commitPlan.blockerLabels.length,
      commandOutcomeCount: 0,
      committedExecutionFingerprints: [],
      latestApplyPlanIds: [],
      readinessRecordIds: [],
      recordCount: 1,
      statusCounts: { blocked: 1 },
      targetRfqIds: [],
    })
  })

  it("rejects ready plans without matching commit execution runs", async () => {
    const { commitPlan, executionRun } = readyCommitResult()
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence()

    await expect(persistence.recordCommit({ commitPlan, recordedAt, recordedBy: actor })).rejects.toThrow(
      "ready final-gate follow-through outcome commit plans require a commit execution run",
    )
    await expect(
      persistence.recordCommit({
        commitPlan,
        executionRun: {
          ...executionRun!,
          readinessRecordId: "non-cnc-apply-readiness:rfq-demo-204:other",
        },
        recordedAt,
        recordedBy: actor,
      }),
    ).rejects.toThrow(
      "final-gate follow-through outcome commit execution run does not match commit plan: readinessRecordId",
    )
  })

  it("normalizes seeded snapshots and keeps newest records for a commit record id", () => {
    const { commitPlan, executionRun } = readyCommitResult()
    const oldRecord = readyRecord(commitPlan, executionRun!, "2026-08-12T10:10:00+00:00", "Earlier Operator")
    const newRecord = readyRecord(commitPlan, executionRun!, recordedAt, actor)

    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence({
        initialSnapshot: { records: [newRecord, oldRecord, { ...newRecord }] },
      }).snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.latestRecord).toMatchObject({
      recordedAt,
      recordedBy: actor,
    })
  })

  it("rejects conflicting seeded records with the same id and timestamp", () => {
    const { commitPlan, executionRun } = readyCommitResult()
    const record = readyRecord(commitPlan, executionRun!, recordedAt, actor)

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            record,
            {
              ...record,
              reviewWarnings: ["Conflicting warning."],
              warningCount: 1,
            },
          ],
        },
      }),
    ).toThrow("conflicting final-gate follow-through outcome commit records cannot share commitRecordId and recordedAt")
  })

  it("rejects malformed blocked seeded records that expose ready evidence", () => {
    const followThrough = blockedFollowThroughPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
      dryRun(followThrough),
    )
    const commitPlan =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan({
        followThrough,
        outcomeDraft,
      })
    const blockedRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord = {
      blockerCount: commitPlan.blockerLabels.length,
      blockerLabels: [...commitPlan.blockerLabels],
      commandOutcomeCount: 0,
      commitRecordId: `non-cnc-final-gate-follow-through-outcome-commit:${commitPlan.followThroughId}:${commitPlan.executionFingerprint}`,
      commitVersion: commitPlan.commitVersion,
      disposition: "review_only",
      executionFingerprint: commitPlan.executionFingerprint,
      followThroughFingerprint: commitPlan.followThroughFingerprint,
      followThroughId: commitPlan.followThroughId,
      latestExecutionFingerprint: "non-cnc-apply-execution:rfq-demo-204:leaked",
      persistenceVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
      recordedAt,
      recordedBy: actor,
      reviewWarnings: [],
      status: "blocked",
      warningCount: 0,
    }

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence({
        initialSnapshot: { records: [blockedRecord] },
      }),
    ).toThrow("blocked final-gate follow-through outcome commit records cannot include ready evidence identifiers")
  })
})

function readyCommitResult() {
  const followThrough = readyFollowThroughPlan()
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

function readyFollowThroughPlan(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
        initialSnapshot: { records: [readyReadinessRecord()] },
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

function readyRecord(
  commitPlan: ReturnType<typeof readyCommitResult>["commitPlan"],
  executionRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
  recordTime: string,
  recordedBy: string,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord {
  return {
    blockerCount: 0,
    blockerLabels: [],
    commandOutcomeCount: commitPlan.commandOutcomeCount,
    committedExecutionFingerprint: executionRun.executionFingerprint,
    commitRecordId: `non-cnc-final-gate-follow-through-outcome-commit:${commitPlan.followThroughId}:${commitPlan.executionFingerprint}`,
    commitVersion: commitPlan.commitVersion,
    disposition: "commit_ready",
    executionFingerprint: commitPlan.executionFingerprint,
    followThroughFingerprint: commitPlan.followThroughFingerprint,
    followThroughId: commitPlan.followThroughId,
    latestApplyPlanId: commitPlan.latestApplyPlanId,
    latestCommitRecordId: commitPlan.latestCommitRecordId,
    latestCommittedExecutionFingerprint: commitPlan.latestCommittedExecutionFingerprint,
    latestExecutionFingerprint: commitPlan.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: commitPlan.latestSourceExecutionFingerprint,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    readinessRecordId: commitPlan.readinessRecordId,
    recordedAt: recordTime,
    recordedBy,
    reviewWarnings: [...commitPlan.reviewWarnings],
    status: "ready",
    targetRfqId: commitPlan.targetRfqId,
    warningCount: commitPlan.reviewWarnings.length,
  }
}

function readyReadinessRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
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
    recordedAt: "2026-08-12T09:55:00.000Z",
    recordedBy: actor,
    requestedAt: "2026-08-12T09:50:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest readiness warning."],
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
  }
}
