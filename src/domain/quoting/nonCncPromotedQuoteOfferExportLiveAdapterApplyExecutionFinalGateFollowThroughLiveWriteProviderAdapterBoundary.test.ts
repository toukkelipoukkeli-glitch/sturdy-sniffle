import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence"

describe("non-CNC final-gate follow-through live-write provider adapter boundary", () => {
  it("blocks provider-adapter preparation for empty provider read-model history", () => {
    const boundary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary({
      history: historySummary([]),
      requestedAt: "2026-08-22T10:00:00+00:00",
      requestedBy: "Sari",
    })

    expect(boundary).toMatchObject({
      blockedCommandCount: 6,
      commandCount: 6,
      evidenceFingerprints: [],
      operatorSummary:
        "Persist a final-gate follow-through provider read-model history record before preparing provider-adapter writes.",
      pendingWriteIntentCount: 0,
      plannedCommandCount: 0,
      providerReadModelRecordId: undefined,
      sourceCommandIdempotencyKeys: [],
      sourceHistoryStatus: "empty",
      status: "blocked",
    })
    expect(boundary.blockerLabels).toEqual([
      "Persist a final-gate follow-through provider read-model history record before preparing provider-adapter writes.",
    ])
    expect(boundary.commands).toHaveLength(6)
    expect(boundary.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(boundary.exportText).toContain("Evidence fingerprints: withheld")
    expect(boundary.providerBoundary).toContain("does not create customer offers")
  })

  it("plans review-only provider-adapter commands from the latest ready provider read-model record", () => {
    const boundary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary({
      history: historySummary([readyRecord({ recordedAt: "2026-08-22T10:15:00Z" })]),
      requestedAt: "2026-08-22T10:30:00+00:00",
      requestedBy: "Mika",
    })

    expect(boundary).toMatchObject({
      adapterBoundaryId: "adapter-boundary-ready",
      blockedCommandCount: 0,
      blockerLabels: [],
      commandCount: 6,
      committedExecutionFingerprint: "committed-execution-1",
      commitRecordId: "commit-record-1",
      evidenceFingerprints: [
        "adapter-boundary-ready:fingerprint",
        "commit-record-1",
        "committed-execution-1",
        "live-write-boundary-ready:fingerprint",
      ],
      followThroughId: "follow-through-1",
      liveWriteBoundaryId: "live-write-boundary-ready",
      pendingWriteIntentCount: 6,
      plannedCommandCount: 6,
      providerReadModelRecordId: "final-gate-live-write-provider-read-model:live-write-boundary-ready",
      requestedAt: "2026-08-22T10:30:00.000Z",
      requestedBy: "Mika",
      reviewedOutcomeCount: 5,
      sourceCommandIdempotencyKeys: [
        "provider-read-model-ready:live-write-boundary-ready:connector_reference_follow_through",
        "provider-read-model-ready:live-write-boundary-ready:customer_offer_follow_through",
        "provider-read-model-ready:live-write-boundary-ready:file_export_follow_through",
        "provider-read-model-ready:live-write-boundary-ready:final_gate_follow_through",
        "provider-read-model-ready:live-write-boundary-ready:release_review_follow_through",
        "provider-read-model-ready:live-write-boundary-ready:rollback_evidence_follow_through",
      ],
      sourceHistoryStatus: "ready_to_prepare",
      status: "ready",
      targetRfqId: "RFQ-900",
    })
    expect(boundary.providerAdapterBoundaryFingerprint).toMatch(/^[a-f0-9]{32}$/)
    expect(boundary.providerAdapterBoundaryId).toBe(
      `non-cnc-final-gate-follow-through-live-write-provider-adapter-boundary-${boundary.providerAdapterBoundaryFingerprint}`,
    )
    expect(boundary.commands).toEqual([
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("non-cnc-final-gate-provider-adapter:RFQ-900:customer_offer_provider_prepare:"),
        key: "customer_offer_provider_prepare",
        sourceCommandIdempotencyKeys: boundary.sourceCommandIdempotencyKeys,
        status: "planned",
        target: "customer_offer",
      }),
      expect.objectContaining({ key: "file_export_provider_prepare", status: "planned", target: "file_export" }),
      expect.objectContaining({ key: "release_review_provider_prepare", status: "planned", target: "release_review" }),
      expect.objectContaining({ key: "connector_reference_provider_prepare", status: "planned", target: "connector" }),
      expect.objectContaining({
        key: "final_gate_follow_through_provider_prepare",
        status: "planned",
        target: "final_gate_follow_through",
      }),
      expect.objectContaining({ key: "rollback_evidence_provider_prepare", status: "planned", target: "diagnostics" }),
    ])
    expect(boundary.operatorSummary).toBe(
      "Prepared 6 review-only final-gate provider-adapter commands for RFQ-900; live writes remain disabled.",
    )
    expect(boundary.exportText).toContain("Provider adapter commands:")
    expect(boundary.exportText).toContain("Boundary: Final-gate follow-through provider-adapter boundaries")
  })

  it("uses only latest provider read-model evidence instead of unioned older history indexes", () => {
    const older = readyRecord({
      adapterBoundaryId: "adapter-boundary-older",
      liveWriteBoundaryId: "live-write-boundary-older",
      recordedAt: "2026-08-22T10:00:00Z",
      targetRfqId: "RFQ-899",
    })
    const newer = readyRecord({
      adapterBoundaryId: "adapter-boundary-newer",
      liveWriteBoundaryId: "live-write-boundary-newer",
      recordedAt: "2026-08-22T10:30:00Z",
      targetRfqId: "RFQ-901",
    })

    const boundary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary({
      history: historySummary([older, newer]),
      requestedAt: "2026-08-22T10:45:00Z",
      requestedBy: "Mika",
    })

    expect(boundary).toMatchObject({
      adapterBoundaryId: "adapter-boundary-newer",
      evidenceFingerprints: [
        "adapter-boundary-newer:fingerprint",
        "commit-record-1",
        "committed-execution-1",
        "live-write-boundary-newer:fingerprint",
      ],
      liveWriteBoundaryId: "live-write-boundary-newer",
      sourceCommandIdempotencyKeys: [
        "provider-read-model-ready:live-write-boundary-newer:connector_reference_follow_through",
        "provider-read-model-ready:live-write-boundary-newer:customer_offer_follow_through",
        "provider-read-model-ready:live-write-boundary-newer:file_export_follow_through",
        "provider-read-model-ready:live-write-boundary-newer:final_gate_follow_through",
        "provider-read-model-ready:live-write-boundary-newer:release_review_follow_through",
        "provider-read-model-ready:live-write-boundary-newer:rollback_evidence_follow_through",
      ],
      status: "ready",
      targetRfqId: "RFQ-901",
      totalRecords: 2,
    })
    expect(boundary.evidenceFingerprints).not.toContain("adapter-boundary-older:fingerprint")
    expect(boundary.evidenceFingerprints).not.toContain("live-write-boundary-older:fingerprint")
    expect(boundary.sourceCommandIdempotencyKeys).not.toContain(
      "provider-read-model-ready:live-write-boundary-older:customer_offer_follow_through",
    )
    for (const command of boundary.commands) {
      expect(command.evidenceFingerprints).toEqual(boundary.evidenceFingerprints)
      expect(command.sourceCommandIdempotencyKeys).toEqual(boundary.sourceCommandIdempotencyKeys)
    }
  })

  it("blocks and withholds provider evidence when latest ready records are missing required history indexes", () => {
    const ready = readyRecord({ recordedAt: "2026-08-22T10:15:00Z" })
    const summary = historySummary([ready])
    const malformedSummary: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary =
      {
        ...summary,
        evidenceFingerprints: summary.evidenceFingerprints.filter(
          (fingerprint) => fingerprint !== ready.liveWriteBoundaryFingerprint,
        ),
        providerReadyRecordIds: [],
      }

    const boundary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary({
      history: malformedSummary,
      requestedAt: "2026-08-22T10:30:00Z",
      requestedBy: "Sari",
    })

    expect(boundary).toMatchObject({
      adapterBoundaryId: undefined,
      blockedCommandCount: 6,
      evidenceFingerprints: [],
      liveWriteBoundaryId: undefined,
      pendingWriteIntentCount: 0,
      plannedCommandCount: 0,
      providerReadModelRecordId: undefined,
      sourceCommandIdempotencyKeys: [],
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(boundary.blockerLabels).toContain(
      "Latest provider read-model record must be present in the provider-ready history index.",
    )
    expect(boundary.blockerLabels).toContain(
      "Latest provider read model evidence fingerprints must be present in the history index.",
    )
    expect(boundary.commands.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(boundary.exportText).toContain("Target RFQ: withheld")
  })
})

function historySummary(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord[],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
      initialSnapshot: {
        records,
      },
    }).snapshot(),
  )
}

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
      `provider-read-model-ready:${liveWriteBoundaryId}:connector_reference_follow_through`,
      `provider-read-model-ready:${liveWriteBoundaryId}:customer_offer_follow_through`,
      `provider-read-model-ready:${liveWriteBoundaryId}:file_export_follow_through`,
      `provider-read-model-ready:${liveWriteBoundaryId}:final_gate_follow_through`,
      `provider-read-model-ready:${liveWriteBoundaryId}:release_review_follow_through`,
      `provider-read-model-ready:${liveWriteBoundaryId}:rollback_evidence_follow_through`,
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
