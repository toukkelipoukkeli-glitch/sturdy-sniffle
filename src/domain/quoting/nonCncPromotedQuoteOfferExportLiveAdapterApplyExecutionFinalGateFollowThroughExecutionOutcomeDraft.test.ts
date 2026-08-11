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
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_DRAFT_VERSION,
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

describe("non-CNC live-adapter final-gate follow-through execution outcome drafts", () => {
  it("builds deterministic applied outcomes for prepared dry-run final-gate follow-through executions", () => {
    const dryRun = readyDryRun()

    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(dryRun)
    const suggestedOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
      command.suggestedOutcome ? [command.suggestedOutcome] : [],
    )
    const committedRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      commandOutcomes: suggestedOutcomes,
      executedAt,
      followThrough: readyFollowThroughPlan(),
      mode: "commit",
    })

    expect(outcomeDraft).toMatchObject({
      blockedOutcomeCount: 0,
      draftVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_DRAFT_VERSION,
      executionFingerprint: dryRun.executionFingerprint,
      followThroughFingerprint: dryRun.followThroughFingerprint,
      followThroughId: dryRun.followThroughId,
      latestApplyPlanId: "non-cnc-apply-plan:rfq-demo-204:ready",
      latestCommitRecordId: "non-cnc-outcome-commit-record:rfq-demo-204:ready",
      latestCommittedExecutionFingerprint: "non-cnc-outcome-commit-execution:rfq-demo-204:ready",
      latestExecutionFingerprint: "non-cnc-apply-execution:rfq-demo-204:ready",
      latestSourceExecutionFingerprint: "non-cnc-live-adapter-source-execution:rfq-demo-204:ready",
      mode: "dry_run",
      readinessRecordId: "non-cnc-apply-readiness:rfq-demo-204:ready",
      readyOutcomeCount: 5,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(outcomeDraft.nextOperatorMessage).toBe(
      "Review and commit 5 final-gate follow-through command outcomes.",
    )
    expect(outcomeDraft.reviewWarnings).toEqual(dryRun.warnings)
    expect(outcomeDraft.adapterFinalGateFollowThroughOutcomeBoundary).toContain("customer-offer")
    expect(outcomeDraft.commandOutcomes.map((command) => [command.key, command.status, command.target])).toEqual([
      ["customer_offer_final_gate", "ready", "customer_offer"],
      ["file_export_final_gate", "ready", "file_export"],
      ["release_review_final_gate", "ready", "release_review"],
      ["connector_reference_final_gate", "ready", "connector"],
      ["rollback_evidence_final_gate", "ready", "diagnostics"],
    ])
    expect(outcomeDraft.commandOutcomes.every((command) => command.evidenceFingerprints.length === 8)).toBe(true)
    expect(suggestedOutcomes).toEqual([
      {
        externalId: `customer-offer-final-gate:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "customer_offer_final_gate",
        message: "Prepared customer-offer final-gate outcome from reviewed follow-through execution evidence.",
        status: "applied",
        warnings: [],
      },
      {
        externalId: `file-export-final-gate:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "file_export_final_gate",
        message: "Prepared file export final-gate outcome from reviewed follow-through execution evidence.",
        status: "applied",
        warnings: [],
      },
      {
        externalId: `release-review-final-gate:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "release_review_final_gate",
        message: "Prepared release-review final-gate outcome from reviewed follow-through execution evidence.",
        status: "applied",
        warnings: [],
      },
      {
        externalId: `connector-reference-final-gate:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "connector_reference_final_gate",
        message: "Prepared connector reference final-gate outcome from reviewed follow-through execution evidence.",
        status: "applied",
        warnings: [],
      },
      {
        externalId: `rollback-evidence-final-gate:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "rollback_evidence_final_gate",
        message: "Prepared rollback evidence final-gate outcome from reviewed follow-through execution evidence.",
        status: "applied",
        warnings: [],
      },
    ])
    expect(committedRun.status).toBe("succeeded")
    expect(committedRun.commands.map((command) => command.status)).toEqual([
      "applied",
      "applied",
      "applied",
      "applied",
      "applied",
    ])
  })

  it("keeps blocked and committed final-gate follow-through executions outcome-free", () => {
    const blockedRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      executedAt,
      followThrough: blockedFollowThroughPlan(),
      mode: "dry_run",
    })
    const committedRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      commandOutcomes: readyFollowThroughPlan().commands.map((command) => ({
        key: command.key,
        status: "applied",
      })),
      executedAt,
      followThrough: readyFollowThroughPlan(),
      mode: "commit",
    })

    const blockedDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(blockedRun)
    const committedDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(committedRun)

    expect(blockedDraft.status).toBe("blocked")
    expect(blockedDraft.readyOutcomeCount).toBe(0)
    expect(blockedDraft.blockedOutcomeCount).toBe(5)
    expect(blockedDraft.nextOperatorMessage).toContain("Persist ready apply-execution readiness history")
    expect(blockedDraft.targetRfqId).toBeUndefined()
    expect(blockedDraft.readinessRecordId).toBeUndefined()
    expect(blockedDraft.latestExecutionFingerprint).toBeUndefined()
    expect(blockedDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(blockedDraft.commandOutcomes.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(blockedDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)

    expect(committedDraft.status).toBe("blocked")
    expect(committedDraft.nextOperatorMessage).toContain(
      "Final-gate follow-through outcome drafts must be based on a dry-run execution.",
    )
    expect(committedDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })

  it("blocks every command outcome when a prepared dry-run has partial command evidence", () => {
    const dryRun = readyDryRun()
    const partialEvidenceRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun = {
      ...dryRun,
      commands: dryRun.commands.map((command) =>
        command.key === "customer_offer_final_gate"
          ? {
              ...command,
              evidenceFingerprints: [],
            }
          : command,
      ),
    }

    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
        partialEvidenceRun,
      )

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.readyOutcomeCount).toBe(0)
    expect(outcomeDraft.blockedOutcomeCount).toBe(5)
    expect(outcomeDraft.nextOperatorMessage).toContain(
      "Review customer-offer final gate is missing final-gate follow-through evidence fingerprints.",
    )
    expect(outcomeDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
    expect(
      outcomeDraft.commandOutcomes.find((command) => command.key === "file_export_final_gate")?.blockerLabels,
    ).toEqual(["Final-gate follow-through execution is not ready for outcome suggestions."])
  })

  it.each(["rfq A", "rfq_A", "RFQ-A", "!!!"])(
    "rejects non-canonical target RFQ id part %s instead of drafting colliding external ids",
    (targetRfqId) => {
      const dryRun = readyDryRun()
      const malformedRun = {
        ...dryRun,
        targetRfqId,
      }

      expect(() =>
        buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
          malformedRun,
        ),
      ).toThrow(
        "Non-CNC live-adapter final-gate follow-through outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
      )
    },
  )

  it("rejects non-canonical execution fingerprints before drafting external ids", () => {
    const dryRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun = {
      ...readyDryRun(),
      executionFingerprint: "non canonical fingerprint",
    }

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(dryRun),
    ).toThrow(
      "Non-CNC live-adapter final-gate follow-through outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
    )
  })
})

function readyDryRun(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
    actor,
    executedAt,
    followThrough: readyFollowThroughPlan(),
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
