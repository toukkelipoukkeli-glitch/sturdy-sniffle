import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence"

describe("non-CNC final-gate follow-through live-write boundary history", () => {
  it("summarizes empty live-write boundary history", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence().snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Persist a reviewed final-gate follow-through live-write boundary before enabling any provider write adapter.",
      ],
      blockedCommandCount: 0,
      blockedCount: 0,
      blockerCount: 0,
      commandCount: 0,
      latestRecord: undefined,
      operatorSummary:
        "No non-CNC final-gate follow-through live-write boundary records have been persisted yet.",
      pendingCommandCount: 0,
      readyCount: 0,
      recentRecords: [],
      reviewedOutcomeCount: 0,
      severity: "neutral",
      status: "empty",
      title: "No final-gate follow-through live-write boundary history",
      totalRecords: 0,
      warningCount: 0,
    })
    expect(summary.exportText).toContain("Recent final-gate live-write boundaries:\n- none")
  })

  it("summarizes blocked live-write boundary history without exposing ready evidence", () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence({
      initialSnapshot: {
        records: [blockedRecord()],
      },
    })

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary(
        persistence.snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve final-gate follow-through live-write boundary blockers before retrying write-adapter preparation.",
      ],
      adapterBoundaryIds: [],
      blockedBoundaryIds: ["live-write-boundary-blocked"],
      blockedCommandCount: 6,
      blockedCount: 1,
      blockerCount: 1,
      commandCount: 6,
      commandIdempotencyKeys: [],
      evidenceFingerprints: [],
      latestRecord: expect.objectContaining({
        adapterBoundaryId: undefined,
        disposition: "review_only",
        status: "blocked",
        targetRfqId: undefined,
      }),
      pendingCommandCount: 0,
      readyBoundaryIds: [],
      readyCount: 0,
      severity: "attention",
      status: "blocked",
      title: "Final-gate follow-through live-write boundary history blocked",
      totalRecords: 1,
    })
    expect(summary.operatorSummary).toContain("blocked after 1 record")
    expect(summary.exportText).toContain("Pending write intents: 0")
    expect(summary.exportText).toContain("Evidence fingerprints: none")
  })

  it("summarizes ready live-write boundary history with pending write intent evidence", () => {
    const ready = readyRecord({ recordedAt: "2026-08-21T08:45:00Z" })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence({
      initialSnapshot: {
        records: [ready],
      },
    })

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary(
        persistence.snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Review pending final-gate follow-through write intents before wiring active provider writes.",
        "Review 1 warning before customer-visible release.",
      ],
      adapterBoundaryIds: ["adapter-boundary-ready"],
      blockedCommandCount: 0,
      blockedCount: 0,
      commandCount: 6,
      committedExecutionFingerprints: ["committed-execution-1"],
      commitRecordIds: ["commit-record-1"],
      evidenceFingerprints: [
        "adapter-boundary-ready:fingerprint",
        "commit-record-1",
        "committed-execution-1",
      ],
      latestRecord: expect.objectContaining({
        disposition: "live_write_ready",
        operatorReviewApproved: true,
        pendingCommandCount: 6,
        status: "review_ready",
        targetRfqId: "RFQ-900",
      }),
      pendingCommandCount: 6,
      readinessRecordIds: ["readiness-record-1"],
      readyBoundaryIds: ["live-write-boundary-ready"],
      readyCount: 1,
      reviewedOutcomeCount: 5,
      severity: "success",
      status: "ready",
      targetRfqIds: ["RFQ-900"],
      title: "Final-gate follow-through live-write boundary history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toContain("6 pending write intents")
    expect(summary.exportText).toContain("Non-CNC final-gate follow-through live-write boundary history")
    expect(summary.exportText).toContain(
      "Command idempotency keys: live-write-boundary-ready:connector_reference_follow_through, live-write-boundary-ready:customer_offer_follow_through",
    )
    expect(summary.exportText).toContain("Boundary: final-gate follow-through live-write boundary history is deterministic review data only")
  })

  it("limits recent records without dropping aggregate evidence and returns clones", () => {
    const older = readyRecord({ liveWriteBoundaryId: "live-write-boundary-older", recordedAt: "2026-08-21T08:45:00Z" })
    const newer = readyRecord({
      adapterBoundaryId: "adapter-boundary-newer",
      liveWriteBoundaryId: "live-write-boundary-newer",
      recordedAt: "2026-08-21T09:00:00Z",
      recordedBy: "Mika",
      targetRfqId: "RFQ-901",
    })
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence({
      initialSnapshot: {
        records: [older, newer],
      },
    }).snapshot()

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )
    summary.latestRecord!.targetRfqId = "mutated-rfq"
    summary.recentRecords[0]!.reviewWarnings.push("mutated warning")
    summary.readyBoundaryIds.push("mutated-boundary")
    summary.commandIdempotencyKeys.push("mutated-key")

    const restored =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )

    expect(restored).toMatchObject({
      adapterBoundaryIds: ["adapter-boundary-newer", "adapter-boundary-ready"],
      commandCount: 12,
      pendingCommandCount: 12,
      readyCount: 2,
      recentRecords: [expect.objectContaining({ recordedBy: "Mika", targetRfqId: "RFQ-901" })],
      targetRfqIds: ["RFQ-900", "RFQ-901"],
      totalRecords: 2,
      warningCount: 2,
    })
    expect(restored.latestRecord?.targetRfqId).toBe("RFQ-901")
    expect(restored.recentRecords[0]?.reviewWarnings).toEqual(["Review connector rollback evidence."])
    expect(restored.readyBoundaryIds).not.toContain("mutated-boundary")
    expect(restored.commandIdempotencyKeys).not.toContain("mutated-key")
    expect(snapshot.latestRecord?.targetRfqId).toBe("RFQ-901")
    expect(snapshot.records[0]?.recordedBy).toBe("Mika")
  })

  it("rejects invalid recent record limits", () => {
    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 0 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 1.5 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
  })
})

function readyRecord({
  adapterBoundaryId = "adapter-boundary-ready",
  liveWriteBoundaryId = "live-write-boundary-ready",
  recordedAt,
  recordedBy = "Sari",
  targetRfqId = "RFQ-900",
}: {
  adapterBoundaryId?: string
  liveWriteBoundaryId?: string
  recordedAt: string
  recordedBy?: string
  targetRfqId?: string
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
  return {
    adapterBoundaryFingerprint: `${adapterBoundaryId}:fingerprint`,
    adapterBoundaryId,
    blockedCommandCount: 0,
    blockerCount: 0,
    blockerLabels: [],
    commandCount: 6,
    commandIdempotencyKeys: [
      `${liveWriteBoundaryId}:customer_offer_follow_through`,
      `${liveWriteBoundaryId}:file_export_follow_through`,
      `${liveWriteBoundaryId}:release_review_follow_through`,
      `${liveWriteBoundaryId}:connector_reference_follow_through`,
      `${liveWriteBoundaryId}:final_gate_follow_through`,
      `${liveWriteBoundaryId}:rollback_evidence_follow_through`,
    ],
    commandStatuses: [
      "pending_enablement",
      "pending_enablement",
      "pending_enablement",
      "pending_enablement",
      "pending_enablement",
      "pending_enablement",
    ],
    committedExecutionFingerprint: "committed-execution-1",
    commitRecordId: "commit-record-1",
    disposition: "live_write_ready",
    evidenceFingerprints: [
      `${adapterBoundaryId}:fingerprint`,
      "commit-record-1",
      "committed-execution-1",
    ],
    followThroughId: "follow-through-1",
    historyRecordCount: 1,
    historyStatus: "ready",
    liveWriteBoundary:
      "Final-gate follow-through live-write boundaries are deterministic review data only.",
    liveWriteBoundaryFingerprint: `${liveWriteBoundaryId}:fingerprint`,
    liveWriteBoundaryId,
    liveWriteBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION,
    nextActionCount: 1,
    nextActionLabels: ["Review pending final-gate follow-through write intents."],
    operatorReviewApproved: true,
    operatorReviewNote: "Approved for provider-boundary review.",
    operatorSummary: "Ready pending write intents are available for operator review.",
    pendingCommandCount: 6,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION,
    readinessRecordId: "readiness-record-1",
    recordedAt,
    recordedBy,
    requestedAt: "2026-08-21T08:30:00Z",
    requestedBy: "Sari",
    reviewedOutcomeCount: 5,
    reviewWarnings: ["Review connector rollback evidence."],
    status: "review_ready",
    targetRfqId,
    warningCount: 1,
  }
}

function blockedRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
  return {
    adapterBoundaryFingerprint: undefined,
    adapterBoundaryId: undefined,
    blockedCommandCount: 6,
    blockerCount: 1,
    blockerLabels: ["Operator review must explicitly approve the final-gate follow-through live-write boundary."],
    commandCount: 6,
    commandIdempotencyKeys: [],
    commandStatuses: ["blocked", "blocked", "blocked", "blocked", "blocked", "blocked"],
    committedExecutionFingerprint: undefined,
    commitRecordId: undefined,
    disposition: "review_only",
    evidenceFingerprints: [],
    followThroughId: undefined,
    historyRecordCount: 1,
    historyStatus: "ready",
    liveWriteBoundary:
      "Final-gate follow-through live-write boundaries are deterministic review data only.",
    liveWriteBoundaryFingerprint: "live-write-boundary-blocked:fingerprint",
    liveWriteBoundaryId: "live-write-boundary-blocked",
    liveWriteBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION,
    nextActionCount: 1,
    nextActionLabels: ["Collect explicit operator approval before enabling pending write intents."],
    operatorReviewApproved: false,
    operatorReviewNote: undefined,
    operatorSummary: "Live-write boundary is blocked until operator approval is captured.",
    pendingCommandCount: 0,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION,
    readinessRecordId: undefined,
    recordedAt: "2026-08-21T08:40:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-21T08:30:00Z",
    requestedBy: "Sari",
    reviewedOutcomeCount: 0,
    reviewWarnings: [],
    status: "blocked",
    targetRfqId: undefined,
    warningCount: 0,
  }
}
