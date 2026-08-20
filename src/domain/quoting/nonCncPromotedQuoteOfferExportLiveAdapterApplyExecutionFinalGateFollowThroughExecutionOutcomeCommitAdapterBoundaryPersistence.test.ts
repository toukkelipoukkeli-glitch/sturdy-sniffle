import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel"

describe("non-CNC final-gate follow-through outcome commit adapter-boundary persistence", () => {
  it("records ready adapter boundaries with command and evidence aggregates", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence()
    const adapterBoundary = buildBoundary()

    const snapshot = await persistence.recordAdapterBoundary({
      adapterBoundary,
      recordedAt: "2026-08-20T10:00:00+03:00",
      recordedBy: "Sari",
    })

    expect(snapshot.persistenceVersion).toBe(
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    )
    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.readyBoundaryIds).toEqual([adapterBoundary.adapterBoundaryId])
    expect(snapshot.blockedBoundaryIds).toEqual([])
    expect(snapshot.statusCounts).toEqual({ ready: 1 })
    expect(snapshot.commandCount).toBe(6)
    expect(snapshot.plannedCommandCount).toBe(6)
    expect(snapshot.blockedCommandCount).toBe(0)
    expect(snapshot.committedOutcomeCount).toBe(5)
    expect(snapshot.commitRecordIds).toEqual(["commit-record-1"])
    expect(snapshot.targetRfqIds).toEqual(["RFQ-900"])
    expect(snapshot.commandIdempotencyKeys).toHaveLength(6)
    expect(snapshot.evidenceFingerprints).toContain("commit-record-1")
    expect(snapshot.latestRecord?.disposition).toBe("follow_through_ready")
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-08-20T07:00:00.000Z")
  })

  it("records blocked adapter boundaries while withholding live evidence identifiers", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence()
    const adapterBoundary = buildBoundary({
      readModel: {
        blockerLabels: ["No committed final-gate outcome read model is available."],
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

    const snapshot = await persistence.recordAdapterBoundary({
      adapterBoundary,
      recordedAt: "2026-08-20T07:15:00Z",
      recordedBy: "Sari",
    })

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.readyBoundaryIds).toEqual([])
    expect(snapshot.blockedBoundaryIds).toEqual([adapterBoundary.adapterBoundaryId])
    expect(snapshot.statusCounts).toEqual({ blocked: 1 })
    expect(snapshot.plannedCommandCount).toBe(0)
    expect(snapshot.blockedCommandCount).toBe(6)
    expect(snapshot.commandIdempotencyKeys).toEqual([])
    expect(snapshot.evidenceFingerprints).toEqual([])
    expect(snapshot.commitRecordIds).toEqual([])
    expect(snapshot.targetRfqIds).toEqual([])
    expect(snapshot.latestRecord?.disposition).toBe("review_only")
  })

  it("dedupes adapter-boundary records by ID while preserving the newest record", () => {
    const ready = recordFromBoundary(buildBoundary(), {
      recordedAt: "2026-08-20T07:00:00Z",
      recordedBy: "Sari",
    })
    const newer = {
      ...ready,
      recordedAt: "2026-08-20T08:00:00Z",
      recordedBy: "Mika",
      reviewWarnings: ["Reviewed by second operator."],
      warningCount: 1,
    }

    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence({
      initialSnapshot: { records: [ready, newer, ready] },
    })
    const snapshot = persistence.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-08-20T08:00:00.000Z")
    expect(snapshot.latestRecord?.recordedBy).toBe("Mika")
    expect(snapshot.warningCount).toBe(1)
  })

  it("rejects seeded blocked records that expose ready command evidence", () => {
    const blocked = recordFromBoundary(
      buildBoundary({
        readModel: {
          blockerLabels: ["No committed final-gate outcome read model is available."],
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
      }),
      { recordedAt: "2026-08-20T07:00:00Z", recordedBy: "Sari" },
    )

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence({
        initialSnapshot: {
          records: [
            {
              ...blocked,
              commandIdempotencyKeys: ["non-cnc-final-gate-follow-through-adapter:RFQ-900:forged"],
            },
          ],
        },
      }),
    ).toThrow("blocked final-gate follow-through adapter-boundary records cannot include ready evidence identifiers")
  })

  it("keeps snapshots and records clone-safe", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence()
    const snapshot = await persistence.recordAdapterBoundary({
      adapterBoundary: buildBoundary(),
      recordedAt: "2026-08-20T07:00:00Z",
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

  it("rejects conflicting seeded records sharing adapterBoundaryId and recordedAt", () => {
    const ready = recordFromBoundary(buildBoundary(), {
      recordedAt: "2026-08-20T07:00:00Z",
      recordedBy: "Sari",
    })

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence({
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
    ).toThrow("conflicting final-gate follow-through adapter-boundary records cannot share adapterBoundaryId and recordedAt")
  })
})

function recordFromBoundary(
  adapterBoundary: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary,
  {
    recordedAt,
    recordedBy,
  }: {
    recordedAt: string
    recordedBy: string
  },
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord {
  return {
    adapterBoundaryFingerprint: adapterBoundary.adapterBoundaryFingerprint,
    adapterBoundaryId: adapterBoundary.adapterBoundaryId,
    adapterBoundaryVersion: adapterBoundary.adapterBoundaryVersion,
    blockedCommandCount: adapterBoundary.blockedCommandCount,
    blockerCount: adapterBoundary.blockerLabels.length,
    blockerLabels: [...adapterBoundary.blockerLabels],
    commandCount: adapterBoundary.commandCount,
    commandIdempotencyKeys: adapterBoundary.commands.flatMap((command) => command.idempotencyKey ? [command.idempotencyKey] : []),
    commandStatuses: adapterBoundary.commands.map((command) => command.status),
    committedExecutionFingerprint: adapterBoundary.committedExecutionFingerprint,
    committedOutcomeCount: adapterBoundary.committedOutcomeCount,
    commitRecordId: adapterBoundary.commitRecordId,
    disposition: adapterBoundary.status === "ready" ? "follow_through_ready" : "review_only",
    evidenceFingerprints: adapterBoundary.commands.flatMap((command) => command.evidenceFingerprints),
    executionFingerprint: adapterBoundary.executionFingerprint,
    followThroughFingerprint: adapterBoundary.followThroughFingerprint,
    followThroughId: adapterBoundary.followThroughId,
    latestApplyPlanId: adapterBoundary.latestApplyPlanId,
    latestCommittedExecutionFingerprint: adapterBoundary.latestCommittedExecutionFingerprint,
    latestCommitRecordId: adapterBoundary.latestCommitRecordId,
    latestExecutionFingerprint: adapterBoundary.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: adapterBoundary.latestSourceExecutionFingerprint,
    liveWriteBoundary: adapterBoundary.liveWriteBoundary,
    nextActionCount: adapterBoundary.nextActionLabels.length,
    nextActionLabels: [...adapterBoundary.nextActionLabels],
    operatorSummary: adapterBoundary.operatorSummary,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: adapterBoundary.plannedCommandCount,
    readinessRecordId: adapterBoundary.readinessRecordId,
    readModelStatus: adapterBoundary.readModelStatus,
    recordedAt,
    recordedBy,
    requestedAt: adapterBoundary.requestedAt,
    requestedBy: adapterBoundary.requestedBy,
    reviewWarnings: [...adapterBoundary.reviewWarnings],
    status: adapterBoundary.status,
    targetRfqId: adapterBoundary.targetRfqId,
    warningCount: adapterBoundary.reviewWarnings.length,
  }
}

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
