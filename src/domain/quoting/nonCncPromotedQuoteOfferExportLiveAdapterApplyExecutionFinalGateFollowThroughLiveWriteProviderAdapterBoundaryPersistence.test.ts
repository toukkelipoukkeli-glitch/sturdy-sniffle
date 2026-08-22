import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence"

describe("non-CNC final-gate follow-through provider-adapter boundary persistence", () => {
  it("records ready provider-adapter boundaries with command and evidence aggregates", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence()
    const providerAdapterBoundary = buildBoundary()

    const snapshot = await persistence.recordProviderAdapterBoundary({
      providerAdapterBoundary,
      recordedAt: "2026-08-22T14:00:00+03:00",
      recordedBy: "Sari",
    })

    expect(snapshot.persistenceVersion).toBe(
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    )
    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.readyBoundaryIds).toEqual([providerAdapterBoundary.providerAdapterBoundaryId])
    expect(snapshot.blockedBoundaryIds).toEqual([])
    expect(snapshot.statusCounts).toEqual({ ready: 1 })
    expect(snapshot.commandCount).toBe(6)
    expect(snapshot.plannedCommandCount).toBe(6)
    expect(snapshot.blockedCommandCount).toBe(0)
    expect(snapshot.pendingWriteIntentCount).toBe(6)
    expect(snapshot.reviewedOutcomeCount).toBe(5)
    expect(snapshot.providerReadModelRecordIds).toEqual([
      "final-gate-live-write-provider-read-model:live-write-boundary-ready",
    ])
    expect(snapshot.commandIdempotencyKeys).toHaveLength(6)
    expect(snapshot.sourceCommandIdempotencyKeys).toHaveLength(6)
    expect(snapshot.evidenceFingerprints).toContain("commit-record-1")
    expect(snapshot.latestRecord?.disposition).toBe("provider_adapter_ready")
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-08-22T11:00:00.000Z")
  })

  it("records blocked provider-adapter boundaries while withholding provider evidence identifiers", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence()
    const providerAdapterBoundary = buildBoundary({
      historyRecords: [],
      requestedAt: "2026-08-22T11:30:00Z",
    })

    const snapshot = await persistence.recordProviderAdapterBoundary({
      providerAdapterBoundary,
      recordedAt: "2026-08-22T11:45:00Z",
      recordedBy: "Mika",
    })

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.readyBoundaryIds).toEqual([])
    expect(snapshot.blockedBoundaryIds).toEqual([providerAdapterBoundary.providerAdapterBoundaryId])
    expect(snapshot.statusCounts).toEqual({ blocked: 1 })
    expect(snapshot.plannedCommandCount).toBe(0)
    expect(snapshot.blockedCommandCount).toBe(6)
    expect(snapshot.commandIdempotencyKeys).toEqual([])
    expect(snapshot.sourceCommandIdempotencyKeys).toEqual([])
    expect(snapshot.evidenceFingerprints).toEqual([])
    expect(snapshot.providerReadModelRecordIds).toEqual([])
    expect(snapshot.latestRecord?.disposition).toBe("review_only")
  })

  it("dedupes provider-adapter boundary records by ID while preserving the newest record", () => {
    const ready = recordFromBoundary(buildBoundary(), {
      recordedAt: "2026-08-22T11:00:00Z",
      recordedBy: "Sari",
    })
    const newer = {
      ...ready,
      recordedAt: "2026-08-22T12:00:00Z",
      recordedBy: "Mika",
      reviewWarnings: ["Reviewed by second operator."],
      warningCount: 1,
    }

    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence({
      initialSnapshot: { records: [ready, newer, ready] },
    })
    const snapshot = persistence.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-08-22T12:00:00.000Z")
    expect(snapshot.latestRecord?.recordedBy).toBe("Mika")
    expect(snapshot.warningCount).toBe(1)
  })

  it("rejects seeded blocked records that expose provider command evidence", () => {
    const blocked = recordFromBoundary(buildBoundary({ historyRecords: [] }), {
      recordedAt: "2026-08-22T11:00:00Z",
      recordedBy: "Sari",
    })

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence({
        initialSnapshot: {
          records: [
            {
              ...blocked,
              commandIdempotencyKeys: ["non-cnc-final-gate-provider-adapter:RFQ-900:forged"],
            },
          ],
        },
      }),
    ).toThrow("blocked final-gate follow-through provider-adapter boundary records cannot include provider evidence identifiers")
  })

  it("keeps snapshots and records clone-safe", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence()
    const snapshot = await persistence.recordProviderAdapterBoundary({
      providerAdapterBoundary: buildBoundary(),
      recordedAt: "2026-08-22T11:00:00Z",
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

  it("rejects conflicting seeded records sharing providerAdapterBoundaryId and recordedAt", () => {
    const ready = recordFromBoundary(buildBoundary(), {
      recordedAt: "2026-08-22T11:00:00Z",
      recordedBy: "Sari",
    })

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence({
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
    ).toThrow("conflicting final-gate follow-through provider-adapter boundary records cannot share providerAdapterBoundaryId and recordedAt")
  })
})

function buildBoundary({
  historyRecords = [readyRecord({ recordedAt: "2026-08-22T10:15:00Z" })],
  requestedAt = "2026-08-22T10:30:00Z",
  requestedBy = "Sari",
}: {
  historyRecords?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord[]
  requestedAt?: string
  requestedBy?: string
} = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary({
    history: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
        initialSnapshot: { records: historyRecords },
      }).snapshot(),
    ),
    requestedAt,
    requestedBy,
  })
}

function recordFromBoundary(
  providerAdapterBoundary: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary,
  {
    recordedAt,
    recordedBy,
  }: {
    recordedAt: string
    recordedBy: string
  },
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  return {
    adapterBoundaryFingerprint: providerAdapterBoundary.adapterBoundaryFingerprint,
    adapterBoundaryId: providerAdapterBoundary.adapterBoundaryId,
    blockedCommandCount: providerAdapterBoundary.blockedCommandCount,
    blockedReadModelCount: providerAdapterBoundary.blockedReadModelCount,
    blockerCount: providerAdapterBoundary.blockerLabels.length,
    blockerLabels: [...providerAdapterBoundary.blockerLabels],
    commandCount: providerAdapterBoundary.commandCount,
    commandIdempotencyKeys: providerAdapterBoundary.commands.flatMap((command) => command.idempotencyKey ? [command.idempotencyKey] : []),
    commandStatuses: providerAdapterBoundary.commands.map((command) => command.status),
    committedExecutionFingerprint: providerAdapterBoundary.committedExecutionFingerprint,
    commitRecordId: providerAdapterBoundary.commitRecordId,
    disposition: providerAdapterBoundary.status === "ready" ? "provider_adapter_ready" : "review_only",
    evidenceFingerprints: providerAdapterBoundary.commands.flatMap((command) => command.evidenceFingerprints),
    followThroughId: providerAdapterBoundary.followThroughId,
    liveWriteBoundaryFingerprint: providerAdapterBoundary.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: providerAdapterBoundary.liveWriteBoundaryId,
    nextActionCount: providerAdapterBoundary.nextActionLabels.length,
    nextActionLabels: [...providerAdapterBoundary.nextActionLabels],
    operatorSummary: providerAdapterBoundary.operatorSummary,
    pendingWriteIntentCount: providerAdapterBoundary.pendingWriteIntentCount,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: providerAdapterBoundary.plannedCommandCount,
    providerAdapterBoundaryFingerprint: providerAdapterBoundary.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: providerAdapterBoundary.providerAdapterBoundaryId,
    providerAdapterBoundaryVersion: providerAdapterBoundary.providerAdapterBoundaryVersion,
    providerBoundary: providerAdapterBoundary.providerBoundary,
    providerReadyCount: providerAdapterBoundary.providerReadyCount,
    providerReadModelRecordId: providerAdapterBoundary.providerReadModelRecordId,
    readinessRecordId: providerAdapterBoundary.readinessRecordId,
    recordedAt,
    recordedBy,
    requestedAt: providerAdapterBoundary.requestedAt,
    requestedBy: providerAdapterBoundary.requestedBy,
    reviewedOutcomeCount: providerAdapterBoundary.reviewedOutcomeCount,
    reviewWarnings: [...providerAdapterBoundary.reviewWarnings],
    sourceCommandIdempotencyKeys: [...providerAdapterBoundary.sourceCommandIdempotencyKeys],
    sourceHistoryStatus: providerAdapterBoundary.sourceHistoryStatus,
    status: providerAdapterBoundary.status,
    targetRfqId: providerAdapterBoundary.targetRfqId,
    totalRecords: providerAdapterBoundary.totalRecords,
    warningCount: providerAdapterBoundary.reviewWarnings.length,
  }
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
