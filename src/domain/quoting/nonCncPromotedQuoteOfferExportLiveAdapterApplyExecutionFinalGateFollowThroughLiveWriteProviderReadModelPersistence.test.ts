import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence"

describe("non-CNC final-gate follow-through live-write provider read-model persistence", () => {
  it("records ready provider read models with provider-preparation evidence aggregates", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence()
    const readModel = readyReadModel()

    const snapshot = await persistence.recordProviderReadModel({
      readModel,
      recordedAt: "2026-08-21T14:00:00+03:00",
      recordedBy: "Sari",
    })

    expect(snapshot.persistenceVersion).toBe(
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
    )
    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.providerReadyRecordIds).toEqual([
      "final-gate-live-write-provider-read-model:live-write-boundary-1",
    ])
    expect(snapshot.blockedRecordIds).toEqual([])
    expect(snapshot.statusCounts).toEqual({ ready_to_prepare: 1 })
    expect(snapshot.commandCount).toBe(2)
    expect(snapshot.pendingWriteIntentCount).toBe(2)
    expect(snapshot.blockedCommandCount).toBe(0)
    expect(snapshot.reviewedOutcomeCount).toBe(2)
    expect(snapshot.liveWriteBoundaryIds).toEqual(["live-write-boundary-1"])
    expect(snapshot.adapterBoundaryIds).toEqual(["adapter-boundary-1"])
    expect(snapshot.commitRecordIds).toEqual(["commit-record-1"])
    expect(snapshot.commandIdempotencyKeys).toEqual(["command-key-1", "command-key-2"])
    expect(snapshot.evidenceFingerprints).toEqual(["evidence-fingerprint-1", "evidence-fingerprint-2"])
    expect(snapshot.latestRecord?.disposition).toBe("provider_prepare_ready")
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-08-21T11:00:00.000Z")
  })

  it("records blocked provider read models while withholding provider evidence identifiers", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence()
    const readModel = blockedReadModel()

    const snapshot = await persistence.recordProviderReadModel({
      readModel,
      recordedAt: "2026-08-21T11:05:00Z",
      recordedBy: "Sari",
    })

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.providerReadyRecordIds).toEqual([])
    expect(snapshot.blockedRecordIds).toEqual([
      "final-gate-live-write-provider-read-model:blocked:blocked:2026-08-21T11:05:00.000Z",
    ])
    expect(snapshot.statusCounts).toEqual({ blocked: 1 })
    expect(snapshot.pendingWriteIntentCount).toBe(0)
    expect(snapshot.blockedCommandCount).toBe(2)
    expect(snapshot.commandIdempotencyKeys).toEqual([])
    expect(snapshot.evidenceFingerprints).toEqual([])
    expect(snapshot.liveWriteBoundaryIds).toEqual([])
    expect(snapshot.adapterBoundaryIds).toEqual([])
    expect(snapshot.latestRecord?.disposition).toBe("review_only")
  })

  it("dedupes provider read-model records by ID while preserving the newest record", () => {
    const ready = recordFromReadModel(readyReadModel(), {
      recordedAt: "2026-08-21T11:00:00Z",
      recordedBy: "Sari",
    })
    const newer = {
      ...ready,
      recordedAt: "2026-08-21T12:00:00Z",
      recordedBy: "Mika",
      reviewWarnings: ["Reviewed by second operator."],
    }

    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
      initialSnapshot: { records: [ready, newer, ready] },
    })
    const snapshot = persistence.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-08-21T12:00:00.000Z")
    expect(snapshot.latestRecord?.recordedBy).toBe("Mika")
    expect(snapshot.warningCount).toBe(1)
  })

  it("keeps a newer recorded provider read model when a stale write arrives later", async () => {
    const readModel = readyReadModel()
    const newer = recordFromReadModel(readModel, {
      recordedAt: "2026-08-21T12:00:00Z",
      recordedBy: "Mika",
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
      initialSnapshot: { records: [newer] },
    })

    const snapshot = await persistence.recordProviderReadModel({
      readModel,
      recordedAt: "2026-08-21T11:00:00Z",
      recordedBy: "Sari",
    })

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-08-21T12:00:00.000Z")
    expect(snapshot.latestRecord?.recordedBy).toBe("Mika")
  })

  it("rejects seeded blocked records that expose provider evidence", () => {
    const blocked = recordFromReadModel(blockedReadModel(), {
      recordedAt: "2026-08-21T11:00:00Z",
      recordedBy: "Sari",
    })

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
        initialSnapshot: {
          records: [
            {
              ...blocked,
              commandIdempotencyKeys: ["forged-command-key"],
            },
          ],
        },
      }),
    ).toThrow("blocked final-gate follow-through live-write provider read-model records cannot include provider evidence identifiers")
  })

  it("rejects seeded ready records missing provider evidence", () => {
    const ready = recordFromReadModel(readyReadModel(), {
      recordedAt: "2026-08-21T11:00:00Z",
      recordedBy: "Sari",
    })

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
        initialSnapshot: {
          records: [
            {
              ...ready,
              evidenceFingerprints: [],
            },
          ],
        },
      }),
    ).toThrow("ready final-gate follow-through live-write provider read-model records require pending write evidence")
  })

  it("rejects conflicting seeded records sharing providerReadModelRecordId and recordedAt", () => {
    const ready = recordFromReadModel(readyReadModel(), {
      recordedAt: "2026-08-21T11:00:00Z",
      recordedBy: "Sari",
    })

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence({
        initialSnapshot: {
          records: [
            ready,
            {
              ...ready,
              nextOperatorMessage: "Conflicting next operator message.",
            },
          ],
        },
      }),
    ).toThrow("conflicting final-gate follow-through live-write provider read-model records cannot share providerReadModelRecordId and recordedAt")
  })

  it("keeps snapshots and records clone-safe", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence()
    const snapshot = await persistence.recordProviderReadModel({
      readModel: readyReadModel(),
      recordedAt: "2026-08-21T11:00:00Z",
      recordedBy: "Sari",
    })

    snapshot.records[0].blockerLabels.push("mutated")
    snapshot.latestRecord?.commandIdempotencyKeys.push("mutated")
    snapshot.providerReadyRecordIds.push("mutated")

    const restored = persistence.snapshot()
    expect(restored.records[0].blockerLabels).toEqual([])
    expect(restored.latestRecord?.commandIdempotencyKeys).not.toContain("mutated")
    expect(restored.providerReadyRecordIds).not.toContain("mutated")
  })
})

function readyReadModel(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel {
  return {
    adapterBoundaryFingerprint: "adapter-boundary-fingerprint-1",
    adapterBoundaryId: "adapter-boundary-1",
    blockedBoundaryCount: 0,
    blockedCommandCount: 0,
    blockerLabels: [],
    commandCount: 2,
    commandIdempotencyKeys: ["command-key-2", "command-key-1", "command-key-1"],
    committedExecutionFingerprint: "committed-execution-1",
    commitRecordId: "commit-record-1",
    evidenceFingerprints: ["evidence-fingerprint-2", "evidence-fingerprint-1", "evidence-fingerprint-1"],
    followThroughId: "follow-through-1",
    liveWriteBoundaryFingerprint: "live-write-boundary-fingerprint-1",
    liveWriteBoundaryId: "live-write-boundary-1",
    nextOperatorMessage: "Review 2 pending final-gate follow-through write intents before enabling a provider adapter.",
    pendingWriteIntentCount: 2,
    providerBoundary:
      "Final-gate follow-through live-write provider read models are deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until an explicit provider adapter is enabled.",
    readinessRecordId: "readiness-record-1",
    readModelVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
    readyBoundaryCount: 1,
    reviewedOutcomeCount: 2,
    reviewWarnings: [],
    sourceHistoryStatus: "ready",
    status: "ready_to_prepare",
    targetRfqId: "RFQ-900",
    totalRecords: 1,
  }
}

function blockedReadModel(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel {
  return {
    blockedBoundaryCount: 1,
    blockedCommandCount: 2,
    blockerLabels: ["Final-gate follow-through live-write provider read models require ready boundary history."],
    commandCount: 2,
    commandIdempotencyKeys: [],
    evidenceFingerprints: [],
    nextOperatorMessage: "Final-gate follow-through live-write provider read models require ready boundary history.",
    pendingWriteIntentCount: 0,
    providerBoundary:
      "Final-gate follow-through live-write provider read models are deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until an explicit provider adapter is enabled.",
    readModelVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_VERSION,
    readyBoundaryCount: 0,
    reviewedOutcomeCount: 0,
    reviewWarnings: [],
    sourceHistoryStatus: "blocked",
    status: "blocked",
    totalRecords: 1,
  }
}

function recordFromReadModel(
  readModel: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModel,
  {
    recordedAt,
    recordedBy,
  }: {
    recordedAt: string
    recordedBy: string
  },
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord {
  return {
    adapterBoundaryFingerprint: readModel.adapterBoundaryFingerprint,
    adapterBoundaryId: readModel.adapterBoundaryId,
    blockedBoundaryCount: readModel.blockedBoundaryCount,
    blockedCommandCount: readModel.blockedCommandCount,
    blockerLabels: [...readModel.blockerLabels],
    commandCount: readModel.commandCount,
    commandIdempotencyKeys: [...readModel.commandIdempotencyKeys],
    committedExecutionFingerprint: readModel.committedExecutionFingerprint,
    commitRecordId: readModel.commitRecordId,
    disposition: readModel.status === "ready_to_prepare" ? "provider_prepare_ready" : "review_only",
    evidenceFingerprints: [...readModel.evidenceFingerprints],
    followThroughId: readModel.followThroughId,
    liveWriteBoundaryFingerprint: readModel.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: readModel.liveWriteBoundaryId,
    nextOperatorMessage: readModel.nextOperatorMessage,
    pendingWriteIntentCount: readModel.pendingWriteIntentCount,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
    providerBoundary: readModel.providerBoundary,
    providerReadModelRecordId: readModel.liveWriteBoundaryId
      ? `final-gate-live-write-provider-read-model:${readModel.liveWriteBoundaryId}`
      : `final-gate-live-write-provider-read-model:${readModel.status}:${readModel.sourceHistoryStatus}:${recordedAt}`,
    readinessRecordId: readModel.readinessRecordId,
    readModelVersion: readModel.readModelVersion,
    readyBoundaryCount: readModel.readyBoundaryCount,
    recordedAt,
    recordedBy,
    reviewedOutcomeCount: readModel.reviewedOutcomeCount,
    reviewWarnings: [...readModel.reviewWarnings],
    sourceHistoryStatus: readModel.sourceHistoryStatus,
    status: readModel.status,
    targetRfqId: readModel.targetRfqId,
    totalRecords: readModel.totalRecords,
  }
}
