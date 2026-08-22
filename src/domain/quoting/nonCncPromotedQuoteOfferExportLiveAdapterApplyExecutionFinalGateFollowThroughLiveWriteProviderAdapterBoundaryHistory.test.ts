import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence"

describe("non-CNC final-gate follow-through provider-adapter boundary history", () => {
  it("summarizes empty provider-adapter boundary history", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence().snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Persist final-gate follow-through provider-adapter boundary records before surfacing provider-adapter readiness.",
      ],
      blockedCommandCount: 0,
      blockedCount: 0,
      blockerCount: 0,
      commandCount: 0,
      latestRecord: undefined,
      operatorSummary:
        "No non-CNC final-gate follow-through provider-adapter boundary records have been persisted yet.",
      pendingWriteIntentCount: 0,
      plannedCommandCount: 0,
      readyCount: 0,
      recentRecords: [],
      reviewedOutcomeCount: 0,
      severity: "neutral",
      status: "empty",
      title: "No final-gate follow-through provider-adapter history",
      totalRecords: 0,
      warningCount: 0,
    })
    expect(summary.exportText).toContain("Recent final-gate provider-adapter boundaries:\n- none")
  })

  it("summarizes blocked provider-adapter boundary history without exposing command evidence", () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence({
      initialSnapshot: {
        records: [blockedRecord()],
      },
    })

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
        persistence.snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve provider-adapter boundary blockers before retrying final-gate follow-through provider preparation.",
      ],
      blockedBoundaryIds: ["final-gate-provider-adapter-boundary:blocked"],
      blockedCommandCount: 6,
      blockedCount: 1,
      blockerCount: 1,
      commandCount: 6,
      commandIdempotencyKeys: [],
      evidenceFingerprints: [],
      latestRecord: expect.objectContaining({
        disposition: "review_only",
        providerReadModelRecordId: undefined,
        status: "blocked",
        targetRfqId: undefined,
      }),
      plannedCommandCount: 0,
      readyBoundaryIds: [],
      readyCount: 0,
      severity: "attention",
      status: "blocked",
      title: "Final-gate follow-through provider-adapter history blocked",
      totalRecords: 1,
    })
    expect(summary.operatorSummary).toContain("blocked after 1 record")
    expect(summary.exportText).toContain("Command idempotency keys: none")
    expect(summary.exportText).toContain("Evidence fingerprints: none")
  })

  it("summarizes ready provider-adapter boundary history with provider-preparation command evidence", () => {
    const ready = readyRecord({ recordedAt: "2026-08-22T11:15:00Z" })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence({
      initialSnapshot: {
        records: [ready],
      },
    })

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
        persistence.snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Review persisted provider-preparation command descriptors before enabling live provider-adapter writes.",
        "Review 1 warning before customer-visible provider follow-through.",
      ],
      adapterBoundaryFingerprints: ["adapter-boundary-ready:fingerprint"],
      adapterBoundaryIds: ["adapter-boundary-ready"],
      blockedCommandCount: 0,
      blockedCount: 0,
      commandCount: 6,
      commandIdempotencyKeys: [
        "provider-adapter-ready:connector_reference_follow_through",
        "provider-adapter-ready:customer_offer_follow_through",
        "provider-adapter-ready:file_export_follow_through",
        "provider-adapter-ready:final_gate_follow_through",
        "provider-adapter-ready:release_review_follow_through",
        "provider-adapter-ready:rollback_evidence_follow_through",
      ],
      evidenceFingerprints: [
        "adapter-boundary-ready:fingerprint",
        "commit-record-1",
        "committed-execution-1",
        "live-write-boundary-ready:fingerprint",
      ],
      latestRecord: expect.objectContaining({
        disposition: "provider_adapter_ready",
        plannedCommandCount: 6,
        status: "ready",
        targetRfqId: "RFQ-900",
      }),
      pendingWriteIntentCount: 6,
      plannedCommandCount: 6,
      providerReadModelRecordIds: ["final-gate-live-write-provider-read-model:live-write-boundary-ready"],
      readyBoundaryIds: ["final-gate-provider-adapter-boundary:ready"],
      readyCount: 1,
      reviewedOutcomeCount: 5,
      severity: "success",
      status: "ready",
      targetRfqIds: ["RFQ-900"],
      title: "Final-gate follow-through provider-adapter history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toContain("6 review-only provider commands")
    expect(summary.exportText).toContain("Non-CNC final-gate follow-through provider-adapter boundary history")
    expect(summary.exportText).toContain(
      "Source command idempotency keys: source:connector_reference_follow_through, source:customer_offer_follow_through",
    )
    expect(summary.exportText).toContain(
      "Boundary: final-gate follow-through provider-adapter boundary history is deterministic review data only",
    )
  })

  it("limits recent records without dropping aggregate evidence and returns clones", () => {
    const older = readyRecord({
      providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:older",
      recordedAt: "2026-08-22T11:00:00Z",
    })
    const newer = readyRecord({
      adapterBoundaryId: "adapter-boundary-newer",
      liveWriteBoundaryId: "live-write-boundary-newer",
      providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:newer",
      recordedAt: "2026-08-22T11:30:00Z",
      recordedBy: "Mika",
      targetRfqId: "RFQ-901",
    })
    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence({
        initialSnapshot: {
          records: [older, newer],
        },
      }).snapshot()

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )
    summary.latestRecord!.targetRfqId = "mutated-rfq"
    summary.recentRecords[0]!.reviewWarnings.push("mutated warning")
    summary.readyBoundaryIds.push("mutated-boundary")
    summary.commandIdempotencyKeys.push("mutated-key")

    const restored =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )

    expect(restored).toMatchObject({
      adapterBoundaryIds: ["adapter-boundary-newer", "adapter-boundary-ready"],
      commandCount: 12,
      pendingWriteIntentCount: 12,
      plannedCommandCount: 12,
      readyCount: 2,
      recentRecords: [expect.objectContaining({ recordedBy: "Mika", targetRfqId: "RFQ-901" })],
      targetRfqIds: ["RFQ-900", "RFQ-901"],
      totalRecords: 2,
      warningCount: 2,
    })
    expect(restored.latestRecord?.targetRfqId).toBe("RFQ-901")
    expect(restored.recentRecords[0]?.reviewWarnings).toEqual(["Review provider rollback evidence."])
    expect(restored.readyBoundaryIds).not.toContain("mutated-boundary")
    expect(restored.commandIdempotencyKeys).not.toContain("mutated-key")
    expect(snapshot.latestRecord?.targetRfqId).toBe("RFQ-901")
    expect(snapshot.records[0]?.recordedBy).toBe("Mika")
  })

  it("rejects invalid recent record limits", () => {
    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 0 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 1.5 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
  })
})

function readyRecord({
  adapterBoundaryId = "adapter-boundary-ready",
  liveWriteBoundaryId = "live-write-boundary-ready",
  providerAdapterBoundaryId = "final-gate-provider-adapter-boundary:ready",
  recordedAt,
  recordedBy = "Sari",
  targetRfqId = "RFQ-900",
}: {
  adapterBoundaryId?: string
  liveWriteBoundaryId?: string
  providerAdapterBoundaryId?: string
  recordedAt: string
  recordedBy?: string
  targetRfqId?: string
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  return {
    adapterBoundaryFingerprint: `${adapterBoundaryId}:fingerprint`,
    adapterBoundaryId,
    blockedCommandCount: 0,
    blockedReadModelCount: 0,
    blockerCount: 0,
    blockerLabels: [],
    commandCount: 6,
    commandIdempotencyKeys: [
      "provider-adapter-ready:connector_reference_follow_through",
      "provider-adapter-ready:customer_offer_follow_through",
      "provider-adapter-ready:file_export_follow_through",
      "provider-adapter-ready:final_gate_follow_through",
      "provider-adapter-ready:release_review_follow_through",
      "provider-adapter-ready:rollback_evidence_follow_through",
    ],
    commandStatuses: [
      "planned",
      "planned",
      "planned",
      "planned",
      "planned",
      "planned",
    ],
    committedExecutionFingerprint: "committed-execution-1",
    commitRecordId: "commit-record-1",
    disposition: "provider_adapter_ready",
    evidenceFingerprints: [
      `${adapterBoundaryId}:fingerprint`,
      "commit-record-1",
      "committed-execution-1",
      `${liveWriteBoundaryId}:fingerprint`,
    ],
    followThroughId: "follow-through-1",
    liveWriteBoundaryFingerprint: `${liveWriteBoundaryId}:fingerprint`,
    liveWriteBoundaryId,
    nextActionCount: 1,
    nextActionLabels: ["Review provider-preparation command descriptors before enabling live writes."],
    operatorSummary: "Review 6 provider-preparation command descriptors before enabling live writes.",
    pendingWriteIntentCount: 6,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: 6,
    providerAdapterBoundaryFingerprint: `${providerAdapterBoundaryId}:fingerprint`,
    providerAdapterBoundaryId,
    providerAdapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    providerBoundary:
      "Final-gate follow-through provider-adapter boundaries are deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until an explicit provider adapter is enabled.",
    providerReadyCount: 1,
    providerReadModelRecordId: `final-gate-live-write-provider-read-model:${liveWriteBoundaryId}`,
    readinessRecordId: "readiness-record-1",
    recordedAt,
    recordedBy,
    requestedAt: "2026-08-22T10:30:00Z",
    requestedBy: "Sari",
    reviewedOutcomeCount: 5,
    reviewWarnings: ["Review provider rollback evidence."],
    sourceCommandIdempotencyKeys: [
      "source:connector_reference_follow_through",
      "source:customer_offer_follow_through",
      "source:file_export_follow_through",
      "source:final_gate_follow_through",
      "source:release_review_follow_through",
      "source:rollback_evidence_follow_through",
    ],
    sourceHistoryStatus: "ready_to_prepare",
    status: "ready",
    targetRfqId,
    totalRecords: 1,
    warningCount: 1,
  }
}

function blockedRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  return {
    adapterBoundaryFingerprint: undefined,
    adapterBoundaryId: undefined,
    blockedCommandCount: 6,
    blockedReadModelCount: 1,
    blockerCount: 1,
    blockerLabels: ["Provider-adapter boundary requires a ready provider read-model history record."],
    commandCount: 6,
    commandIdempotencyKeys: [],
    commandStatuses: [
      "blocked",
      "blocked",
      "blocked",
      "blocked",
      "blocked",
      "blocked",
    ],
    committedExecutionFingerprint: undefined,
    commitRecordId: undefined,
    disposition: "review_only",
    evidenceFingerprints: [],
    followThroughId: undefined,
    liveWriteBoundaryFingerprint: undefined,
    liveWriteBoundaryId: undefined,
    nextActionCount: 1,
    nextActionLabels: ["Resolve provider-adapter boundary blockers before enabling live writes."],
    operatorSummary: "Provider-adapter boundary requires ready provider read-model evidence.",
    pendingWriteIntentCount: 0,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: 0,
    providerAdapterBoundaryFingerprint: "final-gate-provider-adapter-boundary:blocked:fingerprint",
    providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:blocked",
    providerAdapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    providerBoundary:
      "Final-gate follow-through provider-adapter boundaries are deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until an explicit provider adapter is enabled.",
    providerReadyCount: 0,
    providerReadModelRecordId: undefined,
    readinessRecordId: undefined,
    recordedAt: "2026-08-22T10:45:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-22T10:30:00Z",
    requestedBy: "Sari",
    reviewedOutcomeCount: 0,
    reviewWarnings: [],
    sourceCommandIdempotencyKeys: [],
    sourceHistoryStatus: "blocked",
    status: "blocked",
    targetRfqId: undefined,
    totalRecords: 0,
    warningCount: 0,
  }
}
