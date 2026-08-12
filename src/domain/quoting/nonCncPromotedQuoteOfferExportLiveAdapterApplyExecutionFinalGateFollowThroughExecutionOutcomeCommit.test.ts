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
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft"
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
const executedAt = "2026-08-11T15:05:00.000Z"
const requestedAt = "2026-08-11T15:00:00.000Z"

describe("non-CNC live-adapter final-gate follow-through execution outcome commits", () => {
  it("commits ready reviewed final-gate outcome drafts into deterministic execution audit runs", () => {
    const followThrough = readyFollowThroughPlan()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
        readyDryRun(followThrough),
      )

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRun({
        actor,
        executedAt,
        followThrough,
        outcomeDraft,
      })

    expect(result.commitPlan).toMatchObject({
      blockerLabels: [],
      commandOutcomeCount: 5,
      commitVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_VERSION,
      executionFingerprint: outcomeDraft.executionFingerprint,
      followThroughFingerprint: followThrough.followThroughFingerprint,
      followThroughId: followThrough.followThroughId,
      followThroughVersion: followThrough.followThroughVersion,
      latestApplyPlanId: "non-cnc-apply-plan:rfq-demo-204:ready",
      latestCommitRecordId: "non-cnc-outcome-commit-record:rfq-demo-204:ready",
      latestCommittedExecutionFingerprint: "non-cnc-outcome-commit-execution:rfq-demo-204:ready",
      latestExecutionFingerprint: "non-cnc-apply-execution:rfq-demo-204:ready",
      latestSourceExecutionFingerprint: "non-cnc-live-adapter-source-execution:rfq-demo-204:ready",
      nextOperatorMessage: "Commit 5 reviewed non-CNC final-gate follow-through outcomes.",
      readinessRecordId: "non-cnc-apply-readiness:rfq-demo-204:ready",
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(result.commitPlan.adapterOutcomeBoundary).toContain("deterministic review data only")
    expect(result.commitPlan.commandOutcomes.map((outcome) => outcome.key)).toEqual([
      "customer_offer_final_gate",
      "file_export_final_gate",
      "release_review_final_gate",
      "connector_reference_final_gate",
      "rollback_evidence_final_gate",
    ])
    expect(result.executionRun).toMatchObject({
      mode: "commit",
      plannedCommandCount: 5,
      status: "succeeded",
      targetRfqId: "rfq-demo-204",
    })
    expect(result.executionRun?.commands.map((command) => command.status)).toEqual([
      "applied",
      "applied",
      "applied",
      "applied",
      "applied",
    ])
  })

  it("blocks non-ready drafts and withholds command outcomes", () => {
    const followThrough = blockedFollowThroughPlan()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
        readyDryRun(followThrough),
      )

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRun({
        actor,
        executedAt,
        followThrough,
        outcomeDraft,
      })

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: expect.arrayContaining([
        "Final-gate follow-through execution outcome draft must be ready before commit.",
        "Final-gate follow-through execution outcome draft entry for Review customer-offer final gate is not ready for commit.",
        "Missing suggested final-gate follow-through outcome for Review customer-offer final gate.",
      ]),
      commandOutcomeCount: 0,
      commandOutcomes: [],
      latestExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(result.commitPlan.nextOperatorMessage).toContain(
      "Final-gate follow-through execution outcome draft must be ready",
    )
  })

  it("rejects ready drafts that do not match the follow-through plan identity", () => {
    const followThrough = readyFollowThroughPlan()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
        readyDryRun(followThrough),
      )

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan({
        followThrough,
        outcomeDraft: {
          ...outcomeDraft,
          readinessRecordId: "non-cnc-apply-readiness:rfq-demo-204:other",
        },
      }),
    ).toThrow("final-gate follow-through execution outcome draft does not match follow-through plan: readinessRecordId")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan({
        followThrough,
        outcomeDraft: {
          ...outcomeDraft,
          followThroughFingerprint: "different-follow-through-fingerprint",
        },
      }),
    ).toThrow(
      "final-gate follow-through execution outcome draft does not match follow-through plan: followThroughFingerprint",
    )
  })

  it("blocks reordered command outcomes without passing command outcomes to commit execution", () => {
    const followThrough = readyFollowThroughPlan()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
        readyDryRun(followThrough),
      )
    const reorderedDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft = {
      ...outcomeDraft,
      commandOutcomes: [...outcomeDraft.commandOutcomes].reverse(),
    }

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRun({
        actor,
        executedAt,
        followThrough,
        outcomeDraft: reorderedDraft,
      })

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: ["Final-gate follow-through execution outcome draft command list does not match follow-through commands."],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("blocks forged ready drafts that were not produced from dry-run execution", () => {
    const followThrough = readyFollowThroughPlan()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
        readyDryRun(followThrough),
      )
    const forgedCommitDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft = {
      ...outcomeDraft,
      mode: "commit",
    }

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRun({
        actor,
        executedAt,
        followThrough,
        outcomeDraft: forgedCommitDraft,
      })

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: ["Final-gate follow-through execution outcome commit requires a dry-run outcome draft."],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("blocks non-applied suggested outcomes before commit execution", () => {
    const followThrough = readyFollowThroughPlan()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
        readyDryRun(followThrough),
      )
    const failedOutcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0 && command.suggestedOutcome
          ? {
              ...command,
              suggestedOutcome: {
                ...command.suggestedOutcome,
                message: "Provider final-gate follow-through write failed in fixture review.",
                status: "failed",
              },
            }
          : command,
      ),
    }

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRun({
        actor,
        executedAt,
        followThrough,
        outcomeDraft: failedOutcomeDraft,
      })

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: [
        "Suggested final-gate follow-through outcome for Review customer-offer final gate must have applied status.",
      ],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("clones command outcomes so draft mutations cannot alter commit plans", () => {
    const followThrough = readyFollowThroughPlan()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
        readyDryRun(followThrough),
      )

    const commitPlan =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan({
        followThrough,
        outcomeDraft,
      })
    outcomeDraft.commandOutcomes[0].suggestedOutcome!.externalId = "customer-offer-final-gate:rfq-demo-204:mutated"
    outcomeDraft.commandOutcomes[0].suggestedOutcome!.warnings?.push("mutated warning")

    expect(commitPlan.commandOutcomes[0]).toMatchObject({
      externalId: expect.stringMatching(
        /^customer-offer-final-gate:rfq-demo-204:non-cnc-promoted-quote-offer-export-live-adapter-final-gate-follow-through-execution-[a-f0-9]{32}$/,
      ),
      warnings: [],
    })
  })
})

function readyDryRun(
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
    recordedAt: "2026-08-11T14:55:00.000Z",
    recordedBy: actor,
    requestedAt: "2026-08-11T14:50:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest readiness warning."],
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
  }
}
