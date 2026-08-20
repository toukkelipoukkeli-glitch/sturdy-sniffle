import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence"

describe("non-CNC final-gate follow-through outcome commit adapter-boundary history", () => {
  it("summarizes empty adapter-boundary history", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence().snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Persist final-gate follow-through adapter-boundary records before surfacing live follow-through readiness.",
      ],
      blockedCommandCount: 0,
      blockedCount: 0,
      blockerCount: 0,
      commandCount: 0,
      committedOutcomeCount: 0,
      latestRecord: undefined,
      operatorSummary:
        "No non-CNC live-adapter final-gate follow-through adapter-boundary records have been persisted yet.",
      plannedCommandCount: 0,
      readyCount: 0,
      recentRecords: [],
      severity: "neutral",
      status: "empty",
      title: "No final-gate follow-through adapter boundary history",
      totalRecords: 0,
      warningCount: 0,
    })
    expect(summary.exportText).toContain("Recent final-gate adapter boundaries:\n- none")
  })

  it("summarizes blocked adapter-boundary records without ready evidence", () => {
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence({
        initialSnapshot: { records: [blockedRecord()] },
      })

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
        persistence.snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve final-gate follow-through adapter-boundary blockers before retrying follow-through review.",
      ],
      blockedBoundaryIds: ["adapter-boundary-blocked"],
      blockedCommandCount: 6,
      blockedCount: 1,
      blockerCount: 1,
      commandCount: 6,
      commandIdempotencyKeys: [],
      committedExecutionFingerprints: [],
      committedOutcomeCount: 0,
      commitRecordIds: [],
      evidenceFingerprints: [],
      latestRecord: expect.objectContaining({
        disposition: "review_only",
        status: "blocked",
        targetRfqId: undefined,
      }),
      plannedCommandCount: 0,
      readyBoundaryIds: [],
      severity: "attention",
      status: "blocked",
      title: "Final-gate follow-through adapter boundary history blocked",
      totalRecords: 1,
    })
    expect(summary.operatorSummary).toContain("blocked after 1 record")
    expect(summary.exportText).toContain("Blocked boundaries: 1")
    expect(summary.exportText).toContain("Evidence fingerprints: none")
    expect(summary.exportText).toContain(
      "Boundary: final-gate follow-through adapter-boundary history is deterministic review data only",
    )
  })

  it("summarizes ready adapter-boundary records with command and evidence aggregates", () => {
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence({
        initialSnapshot: { records: [readyRecord()] },
      })

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
        persistence.snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Review persisted final-gate follow-through command descriptors before enabling live follow-through writes.",
        "Review 1 warning before customer-visible release follow-through.",
      ],
      blockedCommandCount: 0,
      blockedCount: 0,
      commandCount: 6,
      committedOutcomeCount: 5,
      committedExecutionFingerprints: ["committed-execution-1"],
      commitRecordIds: ["commit-record-1"],
      evidenceFingerprints: ["commit-record-1", "committed-execution-1"],
      followThroughIds: ["follow-through-1"],
      latestRecord: expect.objectContaining({
        disposition: "follow_through_ready",
        plannedCommandCount: 6,
        status: "ready",
        targetRfqId: "RFQ-900",
      }),
      plannedCommandCount: 6,
      readyBoundaryIds: ["adapter-boundary-ready"],
      readyCount: 1,
      severity: "success",
      status: "ready",
      targetRfqIds: ["RFQ-900"],
      title: "Final-gate follow-through adapter boundary history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toContain("6 review-only commands ready")
    expect(summary.exportText).toContain("Non-CNC live adapter final-gate follow-through adapter boundary history")
    expect(summary.exportText).toContain("Planned commands: 6")
    expect(summary.exportText).toContain("Committed executions: committed-execution-1")
  })

  it("limits recent records without dropping aggregates and returns clones", () => {
    const older = readyRecord({
      adapterBoundaryId: "adapter-boundary-old",
      recordedAt: "2026-08-20T07:00:00Z",
      targetRfqId: "RFQ-900",
    })
    const newer = readyRecord({
      adapterBoundaryId: "adapter-boundary-new",
      recordedAt: "2026-08-20T08:00:00Z",
      recordedBy: "Mika",
      targetRfqId: "RFQ-901",
    })
    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence({
        initialSnapshot: { records: [older, newer] },
      }).snapshot()

    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )
    summary.recentRecords[0]!.reviewWarnings.push("mutated warning")
    summary.latestRecord!.targetRfqId = "mutated-rfq"
    summary.readyBoundaryIds.push("mutated-boundary")
    summary.commandIdempotencyKeys.push("mutated-key")

    const restored =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )

    expect(restored).toMatchObject({
      commandCount: 12,
      committedOutcomeCount: 10,
      readyBoundaryIds: ["adapter-boundary-new", "adapter-boundary-old"],
      readyCount: 2,
      recentRecords: [expect.objectContaining({ adapterBoundaryId: "adapter-boundary-new", recordedBy: "Mika" })],
      targetRfqIds: ["RFQ-900", "RFQ-901"],
      totalRecords: 2,
      warningCount: 2,
    })
    expect(restored.readyBoundaryIds).not.toContain("mutated-boundary")
    expect(restored.commandIdempotencyKeys).not.toContain("mutated-key")
    expect(restored.latestRecord?.targetRfqId).toBe("RFQ-901")
    expect(restored.recentRecords[0]?.reviewWarnings).toEqual(["Review connector rollback evidence."])
    expect(snapshot.latestRecord?.targetRfqId).toBe("RFQ-901")
    expect(snapshot.records[0]?.recordedBy).toBe("Mika")
  })

  it("rejects invalid recent record limits", () => {
    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 0 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
        snapshot,
        { recentRecordLimit: 1.5 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
  })
})

function readyRecord(
  overrides: Partial<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord> = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord {
  const adapterBoundaryId = overrides.adapterBoundaryId ?? "adapter-boundary-ready"
  const targetRfqId = overrides.targetRfqId ?? "RFQ-900"
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
      `${adapterBoundaryId}:customer-offer`,
      `${adapterBoundaryId}:file-export`,
      `${adapterBoundaryId}:release-review`,
      `${adapterBoundaryId}:connector-reference`,
      `${adapterBoundaryId}:final-gate`,
      `${adapterBoundaryId}:audit`,
    ],
    commandStatuses: ["planned", "planned", "planned", "planned", "planned", "planned"],
    committedExecutionFingerprint: "committed-execution-1",
    committedOutcomeCount: 5,
    commitRecordId: "commit-record-1",
    disposition: "follow_through_ready",
    evidenceFingerprints: ["commit-record-1", "committed-execution-1"],
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
    recordedAt: "2026-08-20T07:00:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-20T06:55:00Z",
    requestedBy: "Sari",
    reviewWarnings: ["Review connector rollback evidence."],
    status: "ready",
    targetRfqId,
    warningCount: 1,
    ...overrides,
  }
}

function blockedRecord(
  overrides: Partial<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord> = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord {
  return {
    adapterBoundaryFingerprint: "adapter-boundary-blocked:fingerprint",
    adapterBoundaryId: "adapter-boundary-blocked",
    adapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION,
    blockedCommandCount: 6,
    blockerCount: 1,
    blockerLabels: ["No committed final-gate outcome read model is available."],
    commandCount: 6,
    commandIdempotencyKeys: [],
    commandStatuses: ["blocked", "blocked", "blocked", "blocked", "blocked", "blocked"],
    committedOutcomeCount: 0,
    disposition: "review_only",
    evidenceFingerprints: [],
    liveWriteBoundary:
      "Final-gate follow-through adapter boundary is review-only; live writes remain disabled.",
    nextActionCount: 1,
    nextActionLabels: ["Resolve final-gate follow-through outcome commit read-model blockers."],
    operatorSummary: "Final-gate follow-through command descriptors are blocked.",
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: 0,
    readModelStatus: "blocked",
    recordedAt: "2026-08-20T07:15:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-20T07:10:00Z",
    requestedBy: "Sari",
    reviewWarnings: [],
    status: "blocked",
    warningCount: 0,
    ...overrides,
  }
}
