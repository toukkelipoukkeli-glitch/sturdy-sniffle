import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel"

describe("non-CNC final-gate follow-through live-write provider read model", () => {
  it("blocks empty live-write boundary history without provider evidence", () => {
    const readModel = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel(
      historySummary(),
    )

    expect(readModel).toMatchObject({
      blockedBoundaryCount: 0,
      blockedCommandCount: 0,
      blockerLabels: [
        "Persist a reviewed final-gate follow-through live-write boundary before preparing provider read-model evidence.",
      ],
      commandCount: 0,
      commandIdempotencyKeys: [],
      evidenceFingerprints: [],
      pendingWriteIntentCount: 0,
      readModelVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
      readyBoundaryCount: 0,
      sourceHistoryStatus: "empty",
      status: "blocked",
      totalRecords: 0,
    })
    expect(readModel.providerBoundary).toContain("writes stay disabled")
  })

  it("blocks unresolved live-write boundary history and withholds identifiers", () => {
    const readModel = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel(
      historySummary(blockedRecord()),
    )

    expect(readModel).toMatchObject({
      blockedBoundaryCount: 1,
      blockedCommandCount: 6,
      commandIdempotencyKeys: [],
      evidenceFingerprints: [],
      pendingWriteIntentCount: 0,
      sourceHistoryStatus: "blocked",
      status: "blocked",
    })
    expect(readModel.blockerLabels).toContain(
      "Final-gate follow-through live-write provider read models require ready boundary history.",
    )
    expect(readModel.liveWriteBoundaryId).toBeUndefined()
    expect(readModel.targetRfqId).toBeUndefined()
  })

  it("exposes ready provider-preparation evidence for indexed live-write boundary history", () => {
    const readModel = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel(
      historySummary(readyRecord()),
    )

    expect(readModel).toMatchObject({
      adapterBoundaryFingerprint: "adapter-boundary-ready:fingerprint",
      adapterBoundaryId: "adapter-boundary-ready",
      blockedBoundaryCount: 0,
      blockedCommandCount: 0,
      blockerLabels: [],
      commandCount: 6,
      committedExecutionFingerprint: "committed-execution-1",
      commitRecordId: "commit-record-1",
      followThroughId: "follow-through-1",
      liveWriteBoundaryFingerprint: "live-write-boundary-ready:fingerprint",
      liveWriteBoundaryId: "live-write-boundary-ready",
      pendingWriteIntentCount: 6,
      readinessRecordId: "readiness-record-1",
      readyBoundaryCount: 1,
      reviewedOutcomeCount: 5,
      reviewWarnings: ["Review connector rollback evidence."],
      sourceHistoryStatus: "ready",
      status: "ready_to_prepare",
      targetRfqId: "RFQ-900",
      totalRecords: 1,
    })
    expect(readModel.commandIdempotencyKeys).toHaveLength(6)
    expect(readModel.evidenceFingerprints).toEqual([
      "adapter-boundary-ready:fingerprint",
      "commit-record-1",
      "committed-execution-1",
    ])
    expect(readModel.nextOperatorMessage).toBe(
      "Review 6 pending final-gate follow-through write intents before enabling a provider adapter.",
    )
    expect(readModel.providerBoundary).toContain("customer-offer, file, release-review, export, connector")
  })

  it("blocks ready-looking history when latest ready indexes are inconsistent", () => {
    const summary = historySummary(readyRecord())
    const readModel = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel(
      {
        ...summary,
        adapterBoundaryIds: [],
        committedExecutionFingerprints: [],
        readyBoundaryIds: [],
        targetRfqIds: [],
      },
    )

    expect(readModel).toMatchObject({
      commandIdempotencyKeys: [],
      evidenceFingerprints: [],
      status: "blocked",
    })
    expect(readModel.blockerLabels).toEqual([
      "Latest final-gate follow-through live-write boundary is missing from the ready boundary index.",
      "Latest final-gate follow-through live-write adapter boundary is missing from the history index.",
      "Latest final-gate follow-through live-write committed execution is missing from the history index.",
      "Latest final-gate follow-through live-write target RFQ is missing from the history index.",
    ])
    expect(readModel.liveWriteBoundaryId).toBeUndefined()
  })
})

function historySummary(
  record?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence({
      initialSnapshot: record ? { records: [record] } : undefined,
    }).snapshot(),
  )
}

function readyRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
  return {
    adapterBoundaryFingerprint: "adapter-boundary-ready:fingerprint",
    adapterBoundaryId: "adapter-boundary-ready",
    blockedCommandCount: 0,
    blockerCount: 0,
    blockerLabels: [],
    commandCount: 6,
    commandIdempotencyKeys: [
      "live-write-boundary-ready:customer_offer_follow_through",
      "live-write-boundary-ready:file_export_follow_through",
      "live-write-boundary-ready:release_review_follow_through",
      "live-write-boundary-ready:connector_reference_follow_through",
      "live-write-boundary-ready:final_gate_follow_through",
      "live-write-boundary-ready:rollback_evidence_follow_through",
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
      "adapter-boundary-ready:fingerprint",
      "commit-record-1",
      "committed-execution-1",
    ],
    followThroughId: "follow-through-1",
    historyRecordCount: 1,
    historyStatus: "ready",
    liveWriteBoundary:
      "Final-gate follow-through live-write boundaries are deterministic review data only.",
    liveWriteBoundaryFingerprint: "live-write-boundary-ready:fingerprint",
    liveWriteBoundaryId: "live-write-boundary-ready",
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
    recordedAt: "2026-08-21T08:45:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-21T08:30:00Z",
    requestedBy: "Sari",
    reviewedOutcomeCount: 5,
    reviewWarnings: ["Review connector rollback evidence."],
    status: "review_ready",
    targetRfqId: "RFQ-900",
    warningCount: 1,
  }
}

function blockedRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
  return {
    ...readyRecord(),
    adapterBoundaryFingerprint: undefined,
    adapterBoundaryId: undefined,
    blockedCommandCount: 6,
    blockerCount: 1,
    blockerLabels: ["Operator review must explicitly approve the final-gate follow-through live-write boundary."],
    commandIdempotencyKeys: [],
    commandStatuses: ["blocked", "blocked", "blocked", "blocked", "blocked", "blocked"],
    committedExecutionFingerprint: undefined,
    commitRecordId: undefined,
    disposition: "review_only",
    evidenceFingerprints: [],
    followThroughId: undefined,
    liveWriteBoundaryFingerprint: "live-write-boundary-blocked:fingerprint",
    liveWriteBoundaryId: "live-write-boundary-blocked",
    operatorReviewApproved: false,
    operatorReviewNote: undefined,
    operatorSummary: "Live-write boundary is blocked until operator approval is captured.",
    pendingCommandCount: 0,
    readinessRecordId: undefined,
    recordedAt: "2026-08-21T08:40:00Z",
    reviewedOutcomeCount: 0,
    reviewWarnings: [],
    status: "blocked",
    targetRfqId: undefined,
    warningCount: 0,
  }
}
