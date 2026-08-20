import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel"

describe("non-CNC final-gate follow-through outcome commit adapter boundary", () => {
  it("blocks and withholds command evidence when the outcome commit read model is not ready", () => {
    const boundary = buildBoundary({
      readModel: {
        blockerLabels: ["No final-gate follow-through outcome commit record is available."],
        committedOutcomeCount: 0,
        followThroughBoundary:
          "Final-gate follow-through outcome commit read models are deterministic review data only.",
        followThroughTargets: [],
        nextOperatorMessage:
          "Resolve final-gate follow-through outcome commit read-model blockers before enabling live follow-through writes.",
        readModelVersion:
          NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
        reviewWarnings: [],
        status: "blocked",
      },
    })

    expect(boundary.status).toBe("blocked")
    expect(boundary.adapterBoundaryVersion).toBe(
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION,
    )
    expect(boundary.committedOutcomeCount).toBe(0)
    expect(boundary.plannedCommandCount).toBe(0)
    expect(boundary.blockedCommandCount).toBe(6)
    expect(boundary.commitRecordId).toBeUndefined()
    expect(boundary.commands).toHaveLength(6)
    expect(boundary.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(boundary.commands.flatMap((command) => command.evidenceFingerprints)).toEqual([])
    expect(boundary.exportText).toContain("Target RFQ: withheld")
  })

  it("plans review-only adapter commands from a ready outcome commit read model", () => {
    const boundary = buildBoundary()

    expect(boundary.status).toBe("ready")
    expect(boundary.readModelStatus).toBe("ready_to_follow_through")
    expect(boundary.targetRfqId).toBe("RFQ-900")
    expect(boundary.commitRecordId).toBe("commit-record-1")
    expect(boundary.committedExecutionFingerprint).toBe("committed-execution-1")
    expect(boundary.commandCount).toBe(6)
    expect(boundary.plannedCommandCount).toBe(6)
    expect(boundary.blockedCommandCount).toBe(0)
    expect(boundary.committedOutcomeCount).toBe(5)
    expect(boundary.commands.map((command) => command.key)).toEqual([
      "customer_offer_follow_through",
      "file_export_follow_through",
      "release_review_follow_through",
      "connector_reference_follow_through",
      "final_gate_follow_through",
      "rollback_evidence_follow_through",
    ])
    expect(boundary.commands.every((command) => command.idempotencyKey?.startsWith("non-cnc-final-gate-follow-through-adapter:RFQ-900:"))).toBe(true)
    expect(boundary.commands[0].evidenceFingerprints).toContain("commit-record-1")
    expect(boundary.commands[0].evidenceFingerprints).toContain("committed-execution-1")
    expect(boundary.liveWriteBoundary).toContain("does not create customer offers")
    expect(boundary.exportText).toContain("Planned commands: 6")
  })

  it("blocks when a ready read model is missing a required target surface", () => {
    const boundary = buildBoundary({
      readModel: readyReadModel({
        followThroughTargets: [
          "customer_offer",
          "file_export",
          "release_review",
          "connector_reference",
        ],
      }),
    })

    expect(boundary.status).toBe("blocked")
    expect(boundary.followThroughId).toBeUndefined()
    expect(boundary.blockerLabels).toContain(
      "Final-gate follow-through adapter boundary is missing Follow through final gate target evidence.",
    )
    expect(boundary.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(boundary.commands.flatMap((command) => command.evidenceFingerprints)).toEqual([])
  })

  it("keeps adapter fingerprints stable for equivalent inputs and changes them when evidence changes", () => {
    const first = buildBoundary()
    const second = buildBoundary()
    const changed = buildBoundary({
      readModel: readyReadModel({ commitRecordId: "commit-record-2" }),
    })

    expect(second.adapterBoundaryFingerprint).toBe(first.adapterBoundaryFingerprint)
    expect(second.adapterBoundaryId).toBe(first.adapterBoundaryId)
    expect(second.commands.map((command) => command.idempotencyKey)).toEqual(
      first.commands.map((command) => command.idempotencyKey),
    )
    expect(changed.adapterBoundaryFingerprint).not.toBe(first.adapterBoundaryFingerprint)
    expect(changed.commands.map((command) => command.idempotencyKey)).not.toEqual(
      first.commands.map((command) => command.idempotencyKey),
    )
  })

  it("normalizes requested timestamps before fingerprinting", () => {
    const zulu = buildBoundary({ requestedAt: "2026-08-20T08:00:00Z" })
    const offset = buildBoundary({ requestedAt: "2026-08-20T11:00:00+03:00" })

    expect(offset.requestedAt).toBe(zulu.requestedAt)
    expect(offset.adapterBoundaryFingerprint).toBe(zulu.adapterBoundaryFingerprint)
  })
})

function buildBoundary({
  readModel = readyReadModel(),
  requestedAt = "2026-08-20T08:00:00Z",
  requestedBy = "Sari",
}: {
  readModel?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel
  requestedAt?: string
  requestedBy?: string
} = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary({
    readModel,
    requestedAt,
    requestedBy,
  })
}

function readyReadModel(
  overrides: Partial<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel> = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel {
  return {
    blockerLabels: [],
    commitRecordId: "commit-record-1",
    committedExecutionFingerprint: "committed-execution-1",
    committedOutcomeCount: 5,
    disposition: "commit_ready",
    executionFingerprint: "draft-execution-1",
    followThroughBoundary:
      "Final-gate follow-through outcome commit read models are deterministic review data only.",
    followThroughFingerprint: "follow-through-fingerprint-1",
    followThroughId: "follow-through-1",
    followThroughTargets: [
      "customer_offer",
      "file_export",
      "release_review",
      "connector_reference",
      "final_gate_follow_through",
    ],
    latestApplyPlanId: "apply-plan-1",
    latestCommitRecordId: "apply-commit-record-1",
    latestCommittedExecutionFingerprint: "apply-committed-execution-1",
    latestExecutionFingerprint: "apply-execution-1",
    latestSourceExecutionFingerprint: "source-execution-1",
    nextOperatorMessage:
      "Reviewed final-gate follow-through outcome commits are ready for a future live follow-through adapter.",
    readinessRecordId: "readiness-record-1",
    readModelVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: ["Review connector rollback evidence before live follow-through."],
    status: "ready_to_follow_through",
    targetRfqId: "RFQ-900",
    ...overrides,
  }
}
