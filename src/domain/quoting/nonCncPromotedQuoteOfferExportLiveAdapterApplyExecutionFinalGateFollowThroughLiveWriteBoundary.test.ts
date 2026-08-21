import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary"

describe("non-CNC final-gate follow-through live-write boundary", () => {
  it("blocks empty adapter-boundary history and withholds live-write evidence", () => {
    const history = buildHistory()

    const boundary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
      adapterBoundaryHistory: history,
      requestedAt: "2026-08-21T08:00:00Z",
      requestedBy: "Sari",
    })

    expect(boundary).toMatchObject({
      blockedCommandCount: 6,
      commandCount: 6,
      historyRecordCount: 0,
      historyStatus: "empty",
      liveWriteBoundaryVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION,
      operatorReviewApproved: false,
      pendingCommandCount: 0,
      reviewedOutcomeCount: 0,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(boundary.blockerLabels).toEqual([
      "Persist final-gate follow-through adapter-boundary history before preparing live-write follow-through boundaries.",
    ])
    expect(boundary.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(boundary.commands.flatMap((command) => command.evidenceFingerprints)).toEqual([])
    expect(boundary.exportText).toContain("Target RFQ: withheld")
  })

  it("keeps ready history blocked until the operator explicitly approves review", () => {
    const history = buildHistory([readyRecord()])

    const boundary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
      adapterBoundaryHistory: history,
      requestedAt: "2026-08-21T08:00:00Z",
      requestedBy: "Sari",
    })

    expect(boundary.status).toBe("blocked")
    expect(boundary.pendingCommandCount).toBe(0)
    expect(boundary.blockedCommandCount).toBe(6)
    expect(boundary.adapterBoundaryId).toBeUndefined()
    expect(boundary.commands.every((command) => command.idempotencyKey === undefined)).toBe(true)
    expect(boundary.blockerLabels).toContain(
      "Operator review must explicitly approve the final-gate follow-through live-write boundary.",
    )
  })

  it("builds deterministic pending live-write commands after operator review while still not enabling writes", () => {
    const history = buildHistory([readyRecord()])

    const boundary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
      adapterBoundaryHistory: history,
      operatorReviewApproved: true,
      operatorReviewNote: " Sari reviewed the adapter-boundary evidence. ",
      requestedAt: "2026-08-21T08:00:00Z",
      requestedBy: "Sari",
    })

    expect(boundary).toMatchObject({
      adapterBoundaryId: "adapter-boundary-ready",
      blockedCommandCount: 0,
      commandCount: 6,
      committedExecutionFingerprint: "committed-execution-1",
      commitRecordId: "commit-record-1",
      followThroughId: "follow-through-1",
      historyRecordCount: 1,
      operatorReviewApproved: true,
      operatorReviewNote: "Sari reviewed the adapter-boundary evidence.",
      pendingCommandCount: 6,
      readinessRecordId: "readiness-record-1",
      reviewedOutcomeCount: 5,
      status: "review_ready",
      targetRfqId: "RFQ-900",
    })
    expect(boundary.commands.map((command) => command.key)).toEqual([
      "customer_offer_follow_through_write",
      "file_export_follow_through_write",
      "release_review_follow_through_write",
      "connector_reference_follow_through_write",
      "final_gate_follow_through_write",
      "rollback_evidence_follow_through_write",
    ])
    expect(boundary.commands.every((command) => command.status === "pending_enablement")).toBe(true)
    expect(boundary.commands.every((command) => command.idempotencyKey?.startsWith("non-cnc-final-gate-follow-through-live-write:RFQ-900:"))).toBe(true)
    expect(boundary.commands[0]?.evidenceFingerprints).toContain("adapter-boundary-ready:fingerprint")
    expect(boundary.commands[0]?.evidenceFingerprints).toContain("commit-record-1")
    expect(boundary.liveWriteBoundary).toContain("does not create customer offers")
    expect(boundary.exportText).toContain("Pending commands: 6")
  })

  it("blocks stale summaries that do not index the latest ready evidence", () => {
    const history = buildHistory([readyRecord()])
    const staleHistory: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary = {
      ...history,
      adapterBoundaryFingerprints: [],
      readyBoundaryIds: [],
      targetRfqIds: [],
    }

    const boundary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
      adapterBoundaryHistory: staleHistory,
      operatorReviewApproved: true,
      requestedAt: "2026-08-21T08:00:00Z",
      requestedBy: "Sari",
    })

    expect(boundary.status).toBe("blocked")
    expect(boundary.targetRfqId).toBeUndefined()
    expect(boundary.blockerLabels).toEqual([
      "Final-gate follow-through history summary does not index the latest ready adapter-boundary ID.",
      "Final-gate follow-through history summary does not index the latest adapter-boundary fingerprint.",
      "Final-gate follow-through history summary does not index the latest target RFQ.",
    ])
    expect(boundary.commands.flatMap((command) => command.evidenceFingerprints)).toEqual([])
  })

  it("keeps fingerprints stable for equivalent timestamps and changes when review state changes", () => {
    const history = buildHistory([readyRecord()])
    const zulu = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
      adapterBoundaryHistory: history,
      operatorReviewApproved: true,
      requestedAt: "2026-08-21T08:00:00Z",
      requestedBy: "Sari",
    })
    const offset = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
      adapterBoundaryHistory: history,
      operatorReviewApproved: true,
      requestedAt: "2026-08-21T11:00:00+03:00",
      requestedBy: "Sari",
    })
    const blocked = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
      adapterBoundaryHistory: history,
      operatorReviewApproved: false,
      requestedAt: "2026-08-21T08:00:00Z",
      requestedBy: "Sari",
    })

    expect(offset.requestedAt).toBe(zulu.requestedAt)
    expect(offset.liveWriteBoundaryFingerprint).toBe(zulu.liveWriteBoundaryFingerprint)
    expect(blocked.liveWriteBoundaryFingerprint).not.toBe(zulu.liveWriteBoundaryFingerprint)
  })

  it("returns cloned command and warning data", () => {
    const history = buildHistory([readyRecord()])
    const boundary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
      adapterBoundaryHistory: history,
      operatorReviewApproved: true,
      requestedAt: "2026-08-21T08:00:00Z",
      requestedBy: "Sari",
    })
    boundary.commands[0]!.blockerLabels.push("mutated blocker")
    boundary.commands[0]!.evidenceFingerprints.push("mutated evidence")
    boundary.reviewWarnings.push("mutated warning")

    const rebuilt = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
      adapterBoundaryHistory: history,
      operatorReviewApproved: true,
      requestedAt: "2026-08-21T08:00:00Z",
      requestedBy: "Sari",
    })

    expect(rebuilt.commands[0]?.blockerLabels).toEqual([])
    expect(rebuilt.commands[0]?.evidenceFingerprints).not.toContain("mutated evidence")
    expect(rebuilt.reviewWarnings).toEqual(["Review connector rollback evidence."])
    expect(rebuilt.liveWriteBoundaryFingerprint).toBe(boundary.liveWriteBoundaryFingerprint)
  })
})

function buildHistory(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord[] = [],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence({
      initialSnapshot: { records },
    }).snapshot(),
  )
}

function readyRecord(
  overrides: Partial<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord> = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord {
  const adapterBoundaryId = overrides.adapterBoundaryId ?? "adapter-boundary-ready"
  return {
    adapterBoundaryFingerprint: `${adapterBoundaryId}:fingerprint`,
    adapterBoundaryId,
    adapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION,
    blockedCommandCount: 0,
    blockerCount: 0,
    blockerLabels: [],
    commandCount: 6,
    commandIdempotencyKeys: [
      `${adapterBoundaryId}:customer_offer_follow_through`,
      `${adapterBoundaryId}:file_export_follow_through`,
      `${adapterBoundaryId}:release_review_follow_through`,
      `${adapterBoundaryId}:connector_reference_follow_through`,
      `${adapterBoundaryId}:final_gate_follow_through`,
      `${adapterBoundaryId}:rollback_evidence_follow_through`,
    ],
    commandStatuses: ["planned", "planned", "planned", "planned", "planned", "planned"],
    committedExecutionFingerprint: "committed-execution-1",
    committedOutcomeCount: 5,
    commitRecordId: "commit-record-1",
    disposition: "follow_through_ready",
    evidenceFingerprints: ["adapter-boundary-ready:fingerprint", "commit-record-1", "committed-execution-1"],
    executionFingerprint: "draft-execution-1",
    followThroughFingerprint: "follow-through-fingerprint-1",
    followThroughId: "follow-through-1",
    latestApplyPlanId: "apply-plan-1",
    latestCommittedExecutionFingerprint: "apply-committed-execution-1",
    latestCommitRecordId: "apply-commit-record-1",
    latestExecutionFingerprint: "apply-execution-1",
    latestSourceExecutionFingerprint: "source-execution-1",
    liveWriteBoundary:
      "Final-gate follow-through adapter boundary is review-only; live writes remain disabled.",
    nextActionCount: 1,
    nextActionLabels: ["Review final-gate follow-through command descriptors."],
    operatorSummary: "Ready final-gate follow-through command descriptors are available for review.",
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: 6,
    readinessRecordId: "readiness-record-1",
    readModelStatus: "ready_to_follow_through",
    recordedAt: "2026-08-21T07:00:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-21T06:55:00Z",
    requestedBy: "Sari",
    reviewWarnings: ["Review connector rollback evidence."],
    status: "ready",
    targetRfqId: "RFQ-900",
    warningCount: 1,
    ...overrides,
  }
}
