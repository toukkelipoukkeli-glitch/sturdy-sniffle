import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence"

describe("non-CNC final-gate provider-adapter execution outcome commit history", () => {
  it("summarizes empty provider-adapter outcome commit history", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence().snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Persist a reviewed final-gate provider-adapter execution outcome commit before enabling provider-backed follow-through adapters.",
      ],
      blockedCount: 0,
      blockerCount: 0,
      commandOutcomeCount: 0,
      committedCount: 0,
      latestRecord: undefined,
      operatorSummary:
        "No non-CNC final-gate provider-adapter execution outcome commit records have been persisted yet.",
      recentRecords: [],
      severity: "neutral",
      status: "empty",
      title: "No final-gate provider-adapter execution outcome commit history",
      totalRecords: 0,
      warningCount: 0,
    })
    expect(summary.exportText).toContain("Recent provider-adapter outcome commits:\n- none")
  })

  it("summarizes committed provider-adapter outcome evidence", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary(
        snapshotFromRecords([providerAdapterOutcomeCommitRecord()]),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Review committed provider-adapter execution outcome evidence before wiring live customer-offer, file, release-review, export, connector, or follow-through writes.",
        "Review 1 warning before customer-visible provider release.",
      ],
      commandOutcomeCount: 6,
      committedCount: 1,
      externalIds: expect.arrayContaining([
        "customer-offer-provider-prepare:rfq-900:provider-adapter-execution:dry-run",
        "rollback-evidence-provider-prepare:rfq-900:provider-adapter-execution:dry-run",
      ]),
      pendingWriteIntentCount: 6,
      providerAdapterBoundaryIds: ["final-gate-provider-adapter-boundary:ready"],
      providerAdapterExecutionFingerprints: ["provider-adapter-execution:commit"],
      providerReadModelRecordIds: ["final-gate-live-write-provider-read-model:ready"],
      reviewedOutcomeCount: 5,
      severity: "success",
      status: "committed",
      targetRfqIds: ["rfq-900"],
      title: "Final-gate provider-adapter execution outcome commit history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toContain("persisted 6 reviewed provider outcomes")
    expect(summary.exportText).toContain("Non-CNC final-gate provider-adapter execution outcome commit history")
    expect(summary.exportText).toContain("Provider-adapter commit executions: provider-adapter-execution:commit")
    expect(summary.exportText).toContain(
      "Boundary: final-gate provider-adapter execution outcome commit history is deterministic review data only",
    )
  })

  it("summarizes blocked latest commits while retaining prior aggregate provider evidence", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary(
        snapshotFromRecords([
          providerAdapterOutcomeCommitRecord(),
          blockedProviderAdapterOutcomeCommitRecord(),
        ]),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve final-gate provider-adapter execution outcome commit blockers before retrying provider follow-through wiring.",
        "Review 1 warning before customer-visible provider release.",
      ],
      blockedCount: 1,
      commandOutcomeCount: 6,
      committedCount: 1,
      externalIds: expect.arrayContaining([
        "customer-offer-provider-prepare:rfq-900:provider-adapter-execution:dry-run",
      ]),
      latestRecord: expect.objectContaining({
        providerAdapterBoundaryId: undefined,
        status: "blocked",
        targetRfqId: undefined,
      }),
      providerAdapterBoundaryIds: ["final-gate-provider-adapter-boundary:ready"],
      severity: "attention",
      status: "blocked",
      title: "Final-gate provider-adapter execution outcome commit history blocked",
      totalRecords: 2,
    })
    expect(summary.operatorSummary).toContain("blocked after 2 records")
    expect(summary.exportText).toContain("Blocked records: 1")
  })

  it("limits recent records without dropping aggregate counts and returns clones", () => {
    const snapshot = snapshotFromRecords([
      providerAdapterOutcomeCommitRecord(),
      providerAdapterOutcomeCommitRecord({
        executionFingerprint: "provider-adapter-execution:dry-run-2",
        providerAdapterExecutionFingerprint: "provider-adapter-execution:commit-2",
        providerAdapterExecutionOutcomeCommitRecordId:
          "non-cnc-final-gate-provider-adapter-execution-outcome-commit:provider-adapter-execution:dry-run-2",
        recordedAt: "2026-08-24T12:45:00.000Z",
        recordedBy: "Release Reviewer",
        targetRfqId: "rfq-901",
      }),
    ])
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )
    summary.latestRecord!.targetRfqId = "mutated-rfq"
    summary.recentRecords[0]!.reviewWarnings.push("mutated warning")
    summary.externalIds.push("mutated-external")

    const restored =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary(
        snapshot,
        { recentRecordLimit: 1 },
      )

    expect(restored).toMatchObject({
      commandOutcomeCount: 12,
      committedCount: 2,
      recentRecords: [expect.objectContaining({ recordedBy: "Release Reviewer", targetRfqId: "rfq-901" })],
      targetRfqIds: ["rfq-900", "rfq-901"],
      totalRecords: 2,
      warningCount: 2,
    })
    expect(restored.externalIds).not.toContain("mutated-external")
    expect(restored.latestRecord?.targetRfqId).toBe("rfq-901")
    expect(restored.recentRecords[0]?.reviewWarnings).toEqual(["Review provider rollback evidence."])
    expect(snapshot.latestRecord?.targetRfqId).toBe("rfq-901")
  })

  it("rejects invalid recent record limits", () => {
    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary(
        snapshot,
        { recentRecordLimit: 0 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary(
        snapshot,
        { recentRecordLimit: 1.5 },
      ),
    ).toThrow("recentRecordLimit must be a positive safe integer")
  })
})

function snapshotFromRecords(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord[],
) {
  return createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence({
    initialSnapshot: { records },
  }).snapshot()
}

function providerAdapterOutcomeCommitRecord(
  overrides: Partial<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord> = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord {
  return {
    adapterBoundaryFingerprint: "adapter-boundary-ready:fingerprint",
    adapterBoundaryId: "adapter-boundary-ready",
    blockerCount: 0,
    blockerLabels: [],
    commandIdempotencyKeys: [
      "provider-adapter-ready:connector_reference_follow_through",
      "provider-adapter-ready:customer_offer_follow_through",
      "provider-adapter-ready:file_export_follow_through",
      "provider-adapter-ready:final_gate_follow_through",
      "provider-adapter-ready:release_review_follow_through",
      "provider-adapter-ready:rollback_evidence_follow_through",
    ],
    commandOutcomeCount: 6,
    commandOutcomeKeys: [
      "customer_offer_provider_prepare",
      "file_export_provider_prepare",
      "release_review_provider_prepare",
      "connector_reference_provider_prepare",
      "final_gate_follow_through_provider_prepare",
      "rollback_evidence_provider_prepare",
    ],
    commandOutcomeStatuses: [
      "applied",
      "applied",
      "applied",
      "applied",
      "applied",
      "applied",
    ],
    committedExecutionFingerprint: "committed-execution-1",
    commitRecordId: "commit-record-1",
    commitVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
    disposition: "provider_adapter_commit_ready",
    evidenceFingerprints: [
      "adapter-boundary-ready:fingerprint",
      "commit-record-1",
      "committed-execution-1",
      "live-write-boundary-ready:fingerprint",
    ],
    executionFingerprint: "provider-adapter-execution:dry-run",
    externalIds: [
      "connector-reference-provider-prepare:rfq-900:provider-adapter-execution:dry-run",
      "customer-offer-provider-prepare:rfq-900:provider-adapter-execution:dry-run",
      "file-export-provider-prepare:rfq-900:provider-adapter-execution:dry-run",
      "final-gate-follow-through-provider-prepare:rfq-900:provider-adapter-execution:dry-run",
      "release-review-provider-prepare:rfq-900:provider-adapter-execution:dry-run",
      "rollback-evidence-provider-prepare:rfq-900:provider-adapter-execution:dry-run",
    ],
    followThroughId: "follow-through-1",
    liveWriteBoundaryFingerprint: "live-write-boundary-ready:fingerprint",
    liveWriteBoundaryId: "live-write-boundary-ready",
    pendingWriteIntentCount: 6,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    providerAdapterBoundaryFingerprint: "final-gate-provider-adapter-boundary:ready:fingerprint",
    providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:ready",
    providerAdapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    providerAdapterExecutionFingerprint: "provider-adapter-execution:commit",
    providerAdapterExecutionOutcomeCommitRecordId:
      "non-cnc-final-gate-provider-adapter-execution-outcome-commit:provider-adapter-execution:dry-run",
    providerAdapterExecutionStatus: "succeeded",
    providerAdapterExecutionVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
    providerReadModelRecordId: "final-gate-live-write-provider-read-model:ready",
    readinessRecordId: "readiness-record-1",
    recordedAt: "2026-08-24T12:30:00.000Z",
    recordedBy: "FactoryBid Operator",
    reviewedOutcomeCount: 5,
    reviewWarnings: ["Review provider rollback evidence."],
    status: "ready",
    targetRfqId: "rfq-900",
    warningCount: 1,
    ...overrides,
  }
}

function blockedProviderAdapterOutcomeCommitRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord {
  return {
    adapterBoundaryFingerprint: undefined,
    adapterBoundaryId: undefined,
    blockerCount: 1,
    blockerLabels: ["Final-gate provider-adapter execution outcome draft must be ready before commit."],
    commandIdempotencyKeys: [],
    commandOutcomeCount: 0,
    commandOutcomeKeys: [],
    commandOutcomeStatuses: [],
    committedExecutionFingerprint: undefined,
    commitRecordId: undefined,
    commitVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
    disposition: "review_only",
    evidenceFingerprints: [],
    executionFingerprint: "provider-adapter-execution:blocked",
    externalIds: [],
    followThroughId: undefined,
    liveWriteBoundaryFingerprint: undefined,
    liveWriteBoundaryId: undefined,
    pendingWriteIntentCount: 0,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    providerAdapterBoundaryFingerprint: undefined,
    providerAdapterBoundaryId: undefined,
    providerAdapterBoundaryVersion: undefined,
    providerAdapterExecutionFingerprint: undefined,
    providerAdapterExecutionOutcomeCommitRecordId:
      "non-cnc-final-gate-provider-adapter-execution-outcome-commit:provider-adapter-execution:blocked",
    providerAdapterExecutionStatus: undefined,
    providerAdapterExecutionVersion: undefined,
    providerReadModelRecordId: undefined,
    readinessRecordId: undefined,
    recordedAt: "2026-08-24T12:35:00.000Z",
    recordedBy: "FactoryBid Operator",
    reviewedOutcomeCount: 0,
    reviewWarnings: [],
    status: "blocked",
    targetRfqId: undefined,
    warningCount: 0,
  }
}
