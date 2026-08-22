import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence"

describe("non-CNC final-gate follow-through live-write provider read-model history", () => {
  it("summarizes empty provider read-model history", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence().snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Persist a final-gate follow-through live-write provider read model before enabling any provider-preparation adapter.",
      ],
      blockedCommandCount: 0,
      blockedCount: 0,
      blockerCount: 0,
      commandCount: 0,
      latestRecord: undefined,
      operatorSummary:
        "No non-CNC final-gate follow-through live-write provider read-model records have been persisted yet.",
      pendingWriteIntentCount: 0,
      providerReadyCount: 0,
      recentRecords: [],
      reviewedOutcomeCount: 0,
      severity: "neutral",
      status: "empty",
      title: "No final-gate follow-through provider read-model history",
      totalRecords: 0,
      warningCount: 0,
    })
    expect(summary.exportText).toContain("Recent final-gate provider read models:\n- none")
  })

  it("summarizes blocked provider read-model history without exposing provider evidence", () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
      initialSnapshot: {
        records: [blockedRecord()],
      },
    })

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
        persistence.snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve provider read-model blockers before retrying final-gate follow-through provider preparation.",
      ],
      adapterBoundaryIds: [],
      blockedCommandCount: 6,
      blockedCount: 1,
      blockedRecordIds: [
        "final-gate-live-write-provider-read-model:blocked:blocked:2026-08-21T10:00:00.000Z",
      ],
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
      liveWriteBoundaryIds: [],
      pendingWriteIntentCount: 0,
      providerReadyRecordIds: [],
      providerReadyCount: 0,
      severity: "attention",
      status: "blocked",
      title: "Final-gate follow-through provider read-model history blocked",
      totalRecords: 1,
    })
    expect(summary.operatorSummary).toContain("blocked after 1 record")
    expect(summary.exportText).toContain("Pending write intents: 0")
    expect(summary.exportText).toContain("Evidence fingerprints: none")
  })

  it("summarizes ready provider read-model history with provider-preparation evidence", () => {
    const ready = readyRecord({ recordedAt: "2026-08-21T10:15:00Z" })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
      initialSnapshot: {
        records: [ready],
      },
    })

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
        persistence.snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Review provider-preparation evidence before wiring active final-gate follow-through provider writes.",
        "Review 1 warning before customer-visible release.",
      ],
      adapterBoundaryFingerprints: ["adapter-boundary-ready:fingerprint"],
      adapterBoundaryIds: ["adapter-boundary-ready"],
      blockedCommandCount: 0,
      blockedCount: 0,
      commandCount: 6,
      commandIdempotencyKeys: [
        "provider-read-model-ready:connector_reference_follow_through",
        "provider-read-model-ready:customer_offer_follow_through",
        "provider-read-model-ready:file_export_follow_through",
        "provider-read-model-ready:final_gate_follow_through",
        "provider-read-model-ready:release_review_follow_through",
        "provider-read-model-ready:rollback_evidence_follow_through",
      ],
      committedExecutionFingerprints: ["committed-execution-1"],
      commitRecordIds: ["commit-record-1"],
      evidenceFingerprints: [
        "adapter-boundary-ready:fingerprint",
        "commit-record-1",
        "committed-execution-1",
        "live-write-boundary-ready:fingerprint",
      ],
      latestRecord: expect.objectContaining({
        disposition: "provider_prepare_ready",
        pendingWriteIntentCount: 6,
        status: "ready_to_prepare",
        targetRfqId: "RFQ-900",
      }),
      liveWriteBoundaryFingerprints: ["live-write-boundary-ready:fingerprint"],
      liveWriteBoundaryIds: ["live-write-boundary-ready"],
      pendingWriteIntentCount: 6,
      providerReadyCount: 1,
      providerReadyRecordIds: ["final-gate-live-write-provider-read-model:live-write-boundary-ready"],
      readinessRecordIds: ["readiness-record-1"],
      reviewedOutcomeCount: 5,
      severity: "success",
      status: "ready_to_prepare",
      targetRfqIds: ["RFQ-900"],
      title: "Final-gate follow-through provider read-model history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toContain("6 pending write intents")
    expect(summary.exportText).toContain("Non-CNC final-gate follow-through live-write provider read-model history")
    expect(summary.exportText).toContain(
      "Command idempotency keys: provider-read-model-ready:connector_reference_follow_through, provider-read-model-ready:customer_offer_follow_through",
    )
    expect(summary.exportText).toContain("Boundary: final-gate follow-through provider read-model history is deterministic review data only")
  })

  it("limits recent records without dropping aggregate evidence and returns clones", () => {
    const older = readyRecord({ liveWriteBoundaryId: "live-write-boundary-older", recordedAt: "2026-08-21T10:00:00Z" })
    const newer = readyRecord({
      adapterBoundaryId: "adapter-boundary-newer",
      liveWriteBoundaryId: "live-write-boundary-newer",
      recordedAt: "2026-08-21T10:30:00Z",
      recordedBy: "Mika",
      targetRfqId: "RFQ-901",
    })
    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
        initialSnapshot: {
          records: [older, newer],
        },
      }).snapshot()

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )
    summary.latestRecord!.targetRfqId = "mutated-rfq"
    summary.recentRecords[0]!.reviewWarnings.push("mutated warning")
    summary.providerReadyRecordIds.push("mutated-record")
    summary.commandIdempotencyKeys.push("mutated-key")

    const restored =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )

    expect(restored).toMatchObject({
      adapterBoundaryIds: ["adapter-boundary-newer", "adapter-boundary-ready"],
      commandCount: 12,
      pendingWriteIntentCount: 12,
      providerReadyCount: 2,
      recentRecords: [expect.objectContaining({ recordedBy: "Mika", targetRfqId: "RFQ-901" })],
      targetRfqIds: ["RFQ-900", "RFQ-901"],
      totalRecords: 2,
      warningCount: 2,
    })
    expect(restored.latestRecord?.targetRfqId).toBe("RFQ-901")
    expect(restored.recentRecords[0]?.reviewWarnings).toEqual(["Review connector rollback evidence."])
    expect(restored.providerReadyRecordIds).not.toContain("mutated-record")
    expect(restored.commandIdempotencyKeys).not.toContain("mutated-key")
    expect(snapshot.latestRecord?.targetRfqId).toBe("RFQ-901")
    expect(snapshot.records[0]?.recordedBy).toBe("Mika")
  })

  it("rejects invalid recent record limits", () => {
    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
        snapshot,
        { recentRecordLimit: 0 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
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
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord {
  return {
    adapterBoundaryFingerprint: `${adapterBoundaryId}:fingerprint`,
    adapterBoundaryId,
    blockedBoundaryCount: 0,
    blockedCommandCount: 0,
    blockerLabels: [],
    commandCount: 6,
    commandIdempotencyKeys: [
      "provider-read-model-ready:connector_reference_follow_through",
      "provider-read-model-ready:customer_offer_follow_through",
      "provider-read-model-ready:file_export_follow_through",
      "provider-read-model-ready:final_gate_follow_through",
      "provider-read-model-ready:release_review_follow_through",
      "provider-read-model-ready:rollback_evidence_follow_through",
    ],
    committedExecutionFingerprint: "committed-execution-1",
    commitRecordId: "commit-record-1",
    disposition: "provider_prepare_ready",
    evidenceFingerprints: [
      `${adapterBoundaryId}:fingerprint`,
      "commit-record-1",
      "committed-execution-1",
      `${liveWriteBoundaryId}:fingerprint`,
    ],
    followThroughId: "follow-through-1",
    liveWriteBoundaryFingerprint: `${liveWriteBoundaryId}:fingerprint`,
    liveWriteBoundaryId,
    nextOperatorMessage: "Review 6 pending final-gate follow-through write intents before enabling a provider adapter.",
    pendingWriteIntentCount: 6,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
    providerBoundary:
      "Final-gate follow-through live-write provider read models are deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until an explicit provider adapter is enabled.",
    providerReadModelRecordId: `final-gate-live-write-provider-read-model:${liveWriteBoundaryId}`,
    readinessRecordId: "readiness-record-1",
    readModelVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
    readyBoundaryCount: 1,
    recordedAt,
    recordedBy,
    reviewedOutcomeCount: 5,
    reviewWarnings: ["Review connector rollback evidence."],
    sourceHistoryStatus: "ready",
    status: "ready_to_prepare",
    targetRfqId,
    totalRecords: 1,
  }
}

function blockedRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord {
  return {
    adapterBoundaryFingerprint: undefined,
    adapterBoundaryId: undefined,
    blockedBoundaryCount: 1,
    blockedCommandCount: 6,
    blockerLabels: ["Final-gate follow-through live-write provider read models require ready boundary history."],
    commandCount: 6,
    commandIdempotencyKeys: [],
    committedExecutionFingerprint: undefined,
    commitRecordId: undefined,
    disposition: "review_only",
    evidenceFingerprints: [],
    followThroughId: undefined,
    liveWriteBoundaryFingerprint: undefined,
    liveWriteBoundaryId: undefined,
    nextOperatorMessage: "Final-gate follow-through live-write provider read models require ready boundary history.",
    pendingWriteIntentCount: 0,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
    providerBoundary:
      "Final-gate follow-through live-write provider read models are deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until an explicit provider adapter is enabled.",
    providerReadModelRecordId: "final-gate-live-write-provider-read-model:blocked:blocked:2026-08-21T10:00:00.000Z",
    readinessRecordId: undefined,
    readModelVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
    readyBoundaryCount: 0,
    recordedAt: "2026-08-21T10:00:00Z",
    recordedBy: "Sari",
    reviewedOutcomeCount: 0,
    reviewWarnings: [],
    sourceHistoryStatus: "blocked",
    status: "blocked",
    targetRfqId: undefined,
    totalRecords: 1,
  }
}
