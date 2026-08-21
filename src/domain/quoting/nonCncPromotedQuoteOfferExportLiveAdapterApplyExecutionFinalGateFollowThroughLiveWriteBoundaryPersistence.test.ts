import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence"

describe("non-CNC final-gate follow-through live-write boundary persistence", () => {
  it("records review-ready live-write boundaries with pending command and evidence aggregates", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence()
    const liveWriteBoundary = buildBoundary()

    const snapshot = await persistence.recordLiveWriteBoundary({
      liveWriteBoundary,
      recordedAt: "2026-08-21T11:00:00+03:00",
      recordedBy: "Sari",
    })

    expect(snapshot.persistenceVersion).toBe(
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION,
    )
    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.readyBoundaryIds).toEqual([liveWriteBoundary.liveWriteBoundaryId])
    expect(snapshot.blockedBoundaryIds).toEqual([])
    expect(snapshot.statusCounts).toEqual({ review_ready: 1 })
    expect(snapshot.commandCount).toBe(6)
    expect(snapshot.pendingCommandCount).toBe(6)
    expect(snapshot.blockedCommandCount).toBe(0)
    expect(snapshot.reviewedOutcomeCount).toBe(5)
    expect(snapshot.adapterBoundaryIds).toEqual(["adapter-boundary-ready"])
    expect(snapshot.commitRecordIds).toEqual(["commit-record-1"])
    expect(snapshot.targetRfqIds).toEqual(["RFQ-900"])
    expect(snapshot.commandIdempotencyKeys).toHaveLength(6)
    expect(snapshot.evidenceFingerprints).toContain("adapter-boundary-ready:fingerprint")
    expect(snapshot.latestRecord?.disposition).toBe("live_write_ready")
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-08-21T08:00:00.000Z")
  })

  it("records blocked live-write boundaries while withholding ready evidence identifiers", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence()
    const liveWriteBoundary = buildBoundary({ operatorReviewApproved: false })

    const snapshot = await persistence.recordLiveWriteBoundary({
      liveWriteBoundary,
      recordedAt: "2026-08-21T08:15:00Z",
      recordedBy: "Sari",
    })

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.readyBoundaryIds).toEqual([])
    expect(snapshot.blockedBoundaryIds).toEqual([liveWriteBoundary.liveWriteBoundaryId])
    expect(snapshot.statusCounts).toEqual({ blocked: 1 })
    expect(snapshot.pendingCommandCount).toBe(0)
    expect(snapshot.blockedCommandCount).toBe(6)
    expect(snapshot.commandIdempotencyKeys).toEqual([])
    expect(snapshot.evidenceFingerprints).toEqual([])
    expect(snapshot.adapterBoundaryIds).toEqual([])
    expect(snapshot.targetRfqIds).toEqual([])
    expect(snapshot.latestRecord?.disposition).toBe("review_only")
  })

  it("dedupes live-write boundary records by ID while preserving the newest record", () => {
    const ready = recordFromBoundary(buildBoundary(), {
      recordedAt: "2026-08-21T08:00:00Z",
      recordedBy: "Sari",
    })
    const newer = {
      ...ready,
      recordedAt: "2026-08-21T09:00:00Z",
      recordedBy: "Mika",
      reviewWarnings: ["Reviewed by second operator."],
      warningCount: 1,
    }

    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence({
      initialSnapshot: { records: [ready, newer, ready] },
    })
    const snapshot = persistence.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-08-21T09:00:00.000Z")
    expect(snapshot.latestRecord?.recordedBy).toBe("Mika")
    expect(snapshot.warningCount).toBe(1)
  })

  it("rejects seeded blocked records that expose ready live-write evidence", () => {
    const blocked = recordFromBoundary(buildBoundary({ operatorReviewApproved: false }), {
      recordedAt: "2026-08-21T08:00:00Z",
      recordedBy: "Sari",
    })

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence({
        initialSnapshot: {
          records: [
            {
              ...blocked,
              commandIdempotencyKeys: ["non-cnc-final-gate-follow-through-live-write:RFQ-900:forged"],
            },
          ],
        },
      }),
    ).toThrow("blocked final-gate follow-through live-write boundary records cannot include ready evidence identifiers")
  })

  it("keeps snapshots and records clone-safe", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence()
    const snapshot = await persistence.recordLiveWriteBoundary({
      liveWriteBoundary: buildBoundary(),
      recordedAt: "2026-08-21T08:00:00Z",
      recordedBy: "Sari",
    })

    snapshot.records[0].blockerLabels.push("mutated")
    snapshot.latestRecord?.commandIdempotencyKeys.push("mutated")
    snapshot.readyBoundaryIds.push("mutated")

    const restored = persistence.snapshot()
    expect(restored.records[0].blockerLabels).toEqual([])
    expect(restored.latestRecord?.commandIdempotencyKeys).not.toContain("mutated")
    expect(restored.readyBoundaryIds).not.toContain("mutated")
  })

  it("rejects conflicting seeded records sharing liveWriteBoundaryId and recordedAt", () => {
    const ready = recordFromBoundary(buildBoundary(), {
      recordedAt: "2026-08-21T08:00:00Z",
      recordedBy: "Sari",
    })

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence({
        initialSnapshot: {
          records: [
            ready,
            {
              ...ready,
              operatorSummary: "Conflicting operator summary.",
            },
          ],
        },
      }),
    ).toThrow("conflicting final-gate follow-through live-write boundary records cannot share liveWriteBoundaryId and recordedAt")
  })
})

function buildBoundary({
  operatorReviewApproved = true,
}: {
  operatorReviewApproved?: boolean
} = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
    adapterBoundaryHistory: buildHistory([readyRecord()]),
    operatorReviewApproved,
    operatorReviewNote: operatorReviewApproved ? "Sari approved the reviewed follow-through boundary." : undefined,
    requestedAt: "2026-08-21T08:00:00Z",
    requestedBy: "Sari",
  })
}

function buildHistory(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord[] = [],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence({
      initialSnapshot: { records },
    }).snapshot(),
  )
}

function recordFromBoundary(
  liveWriteBoundary: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary,
  {
    recordedAt,
    recordedBy,
  }: {
    recordedAt: string
    recordedBy: string
  },
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
  return {
    adapterBoundaryFingerprint: liveWriteBoundary.adapterBoundaryFingerprint,
    adapterBoundaryId: liveWriteBoundary.adapterBoundaryId,
    blockedCommandCount: liveWriteBoundary.blockedCommandCount,
    blockerCount: liveWriteBoundary.blockerLabels.length,
    blockerLabels: [...liveWriteBoundary.blockerLabels],
    commandCount: liveWriteBoundary.commandCount,
    commandIdempotencyKeys: liveWriteBoundary.commands.flatMap((command) => command.idempotencyKey ? [command.idempotencyKey] : []),
    commandStatuses: liveWriteBoundary.commands.map((command) => command.status),
    committedExecutionFingerprint: liveWriteBoundary.committedExecutionFingerprint,
    commitRecordId: liveWriteBoundary.commitRecordId,
    disposition: liveWriteBoundary.status === "review_ready" ? "live_write_ready" : "review_only",
    evidenceFingerprints: liveWriteBoundary.commands.flatMap((command) => command.evidenceFingerprints),
    followThroughId: liveWriteBoundary.followThroughId,
    historyRecordCount: liveWriteBoundary.historyRecordCount,
    historyStatus: liveWriteBoundary.historyStatus,
    liveWriteBoundary: liveWriteBoundary.liveWriteBoundary,
    liveWriteBoundaryFingerprint: liveWriteBoundary.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: liveWriteBoundary.liveWriteBoundaryId,
    liveWriteBoundaryVersion: liveWriteBoundary.liveWriteBoundaryVersion,
    nextActionCount: liveWriteBoundary.nextActionLabels.length,
    nextActionLabels: [...liveWriteBoundary.nextActionLabels],
    operatorReviewApproved: liveWriteBoundary.operatorReviewApproved,
    operatorReviewNote: liveWriteBoundary.operatorReviewNote,
    operatorSummary: liveWriteBoundary.operatorSummary,
    pendingCommandCount: liveWriteBoundary.pendingCommandCount,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION,
    readinessRecordId: liveWriteBoundary.readinessRecordId,
    recordedAt,
    recordedBy,
    requestedAt: liveWriteBoundary.requestedAt,
    requestedBy: liveWriteBoundary.requestedBy,
    reviewedOutcomeCount: liveWriteBoundary.reviewedOutcomeCount,
    reviewWarnings: [...liveWriteBoundary.reviewWarnings],
    status: liveWriteBoundary.status,
    targetRfqId: liveWriteBoundary.targetRfqId,
    warningCount: liveWriteBoundary.reviewWarnings.length,
  }
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
