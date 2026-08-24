import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence"

describe("non-CNC final-gate provider-adapter execution history", () => {
  it("summarizes empty provider-adapter execution history", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence().snapshot(),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Persist a final-gate provider-adapter dry-run before enabling live provider adapters.",
      ],
      commandCount: 0,
      latestRun: undefined,
      operatorSummary:
        "No non-CNC final-gate provider-adapter execution runs have been persisted yet.",
      recentRuns: [],
      severity: "neutral",
      status: "empty",
      title: "No final-gate provider-adapter execution history",
      totalRuns: 0,
    })
    expect(summary.exportText).toContain("Recent provider-adapter execution runs:\n- none")
  })

  it("summarizes prepared dry-run provider evidence", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary(
        snapshotFromRecords([providerAdapterExecutionRecord()]),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Review prepared final-gate provider-adapter commands before committing provider side effects.",
        "Review 1 warning before customer-visible provider release.",
      ],
      commandCount: 6,
      pendingWriteIntentCount: 6,
      plannedCommandCount: 6,
      preparedCommandCount: 6,
      reviewedOutcomeCount: 5,
      severity: "ready",
      status: "prepared",
      title: "Final-gate provider-adapter dry-run prepared",
      totalRuns: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toContain("dry-run prepared 6 provider commands")
    expect(summary.providerAdapterBoundaryIds).toEqual(["final-gate-provider-adapter-boundary:ready"])
    expect(summary.providerReadModelRecordIds).toEqual(["final-gate-live-write-provider-read-model:ready"])
    expect(summary.liveWriteBoundaryIds).toEqual(["live-write-boundary-ready"])
    expect(summary.targetRfqIds).toEqual(["RFQ-900"])
    expect(summary.exportText).toContain("Prepared commands: 6")
    expect(summary.exportText).toContain(
      "Boundary: final-gate follow-through provider-adapter execution history is deterministic review data only",
    )
  })

  it("summarizes partial commit outcomes as needs-review", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary(
        snapshotFromRecords([
          providerAdapterExecutionRecord({
            appliedCommandCount: 1,
            executedAt: "2026-08-24T14:40:00.000Z",
            executionFingerprint: "provider-adapter-execution:partial",
            externalIds: ["customer-offer-draft-1"],
            failedCommandCount: 1,
            mode: "commit",
            nextActionCount: 5,
            pendingCommandCount: 4,
            preparedCommandCount: 0,
            status: "partial",
            warningCount: 2,
          }),
        ]),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Review failed or partial final-gate provider-adapter command outcomes before retrying.",
        "Review 2 warnings before customer-visible provider release.",
      ],
      appliedCommandCount: 1,
      externalIds: ["customer-offer-draft-1"],
      failedCommandCount: 1,
      nextActionCount: 5,
      pendingCommandCount: 4,
      severity: "attention",
      status: "needs_review",
      title: "Final-gate provider-adapter execution history needs review",
      warningCount: 2,
    })
    expect(summary.operatorSummary).toContain("recorded partial command outcomes")
    expect(summary.exportText).toContain("Failed commands: 1")
  })

  it("summarizes blocked latest runs while retaining prior aggregate evidence", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary(
        snapshotFromRecords([
          providerAdapterExecutionRecord(),
          blockedProviderAdapterExecutionRecord(),
        ]),
      )

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve final-gate provider-adapter execution blockers before recording provider outcomes.",
        "Review 1 warning before customer-visible provider release.",
      ],
      blockedCommandCount: 6,
      preparedCommandCount: 6,
      severity: "attention",
      status: "blocked",
      title: "Final-gate provider-adapter execution history blocked",
      totalRuns: 2,
    })
    expect(summary.operatorSummary).toContain("blocked after 2 runs")
    expect(summary.latestRun).toMatchObject({
      providerAdapterBoundaryId: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(summary.targetRfqIds).toEqual(["RFQ-900"])
    expect(summary.providerAdapterBoundaryIds).toEqual(["final-gate-provider-adapter-boundary:ready"])
    expect(summary.exportText).toContain("Blocked commands: 6")
  })

  it("limits recent runs without dropping aggregate counts", () => {
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary(
        snapshotFromRecords([
          providerAdapterExecutionRecord(),
          providerAdapterExecutionRecord({
            executedAt: "2026-08-24T14:45:00.000Z",
            executionFingerprint: "provider-adapter-execution:ready-2",
            targetRfqId: "RFQ-901",
          }),
        ]),
        { recentRunLimit: 1 },
      )

    expect(summary.totalRuns).toBe(2)
    expect(summary.commandCount).toBe(12)
    expect(summary.preparedCommandCount).toBe(12)
    expect(summary.recentRuns).toHaveLength(1)
    expect(summary.recentRuns[0]?.targetRfqId).toBe("RFQ-901")
  })

  it("returns cloned summary records and arrays", () => {
    const snapshot = snapshotFromRecords([providerAdapterExecutionRecord()])
    const summary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary(
        snapshot,
      )
    summary.recentRuns[0]!.actor = "Mutated Operator"
    summary.latestRun!.targetRfqId = "mutated-rfq"
    summary.commandIdempotencyKeys.push("mutated-key")

    const restoredSummary =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary(
        snapshot,
      )

    expect(restoredSummary.recentRuns[0]?.actor).toBe("FactoryBid Operator")
    expect(restoredSummary.latestRun?.targetRfqId).toBe("RFQ-900")
    expect(restoredSummary.commandIdempotencyKeys).not.toContain("mutated-key")
  })

  it("rejects invalid recent run limits", () => {
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence().snapshot(),
        { recentRunLimit: 0 },
      ),
    ).toThrow("recentRunLimit must be a positive safe integer")
  })
})

function snapshotFromRecords(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord[],
) {
  return createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence({
    initialSnapshot: { records },
  }).snapshot()
}

function providerAdapterExecutionRecord(
  overrides: Partial<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord> = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord {
  return {
    actor: "FactoryBid Operator",
    adapterBoundaryFingerprint: "adapter-boundary-ready:fingerprint",
    adapterBoundaryId: "adapter-boundary-ready",
    appliedCommandCount: 0,
    blockedCommandCount: 0,
    blockedRecordCount: 0,
    commandCount: 6,
    commandIdempotencyKeys: [
      "provider-adapter-ready:connector_reference_follow_through",
      "provider-adapter-ready:customer_offer_follow_through",
      "provider-adapter-ready:file_export_follow_through",
      "provider-adapter-ready:final_gate_follow_through",
      "provider-adapter-ready:release_review_follow_through",
      "provider-adapter-ready:rollback_evidence_follow_through",
    ],
    committedExecutionFingerprint: "committed-execution-1",
    commitRecordId: "commit-record-1",
    evidenceFingerprints: [
      "adapter-boundary-ready:fingerprint",
      "commit-record-1",
      "committed-execution-1",
      "live-write-boundary-ready:fingerprint",
    ],
    executedAt: "2026-08-24T14:30:00.000Z",
    executionFingerprint: "provider-adapter-execution:ready-1",
    executionVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
    externalIds: [],
    failedCommandCount: 0,
    followThroughId: "follow-through-1",
    historyRecordCount: 1,
    liveWriteBoundaryFingerprint: "live-write-boundary-ready:fingerprint",
    liveWriteBoundaryId: "live-write-boundary-ready",
    mode: "dry_run",
    nextActionCount: 1,
    pendingCommandCount: 0,
    pendingWriteIntentCount: 6,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
    plannedCommandCount: 6,
    preparedCommandCount: 6,
    providerAdapterBoundaryFingerprint: "final-gate-provider-adapter-boundary:ready:fingerprint",
    providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:ready",
    providerAdapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    providerReadModelRecordId: "final-gate-live-write-provider-read-model:ready",
    readinessRecordId: "readiness-record-1",
    readyRecordCount: 1,
    reviewedOutcomeCount: 5,
    status: "prepared",
    targetRfqId: "RFQ-900",
    warningCount: 1,
    ...overrides,
  }
}

function blockedProviderAdapterExecutionRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord {
  return {
    ...providerAdapterExecutionRecord({
      adapterBoundaryFingerprint: undefined,
      adapterBoundaryId: undefined,
      blockedCommandCount: 6,
      blockedRecordCount: 1,
      commandIdempotencyKeys: [],
      committedExecutionFingerprint: undefined,
      commitRecordId: undefined,
      evidenceFingerprints: [],
      executedAt: "2026-08-24T14:35:00.000Z",
      executionFingerprint: "provider-adapter-execution:blocked",
      externalIds: [],
      failedCommandCount: 0,
      followThroughId: undefined,
      liveWriteBoundaryFingerprint: undefined,
      liveWriteBoundaryId: undefined,
      mode: "commit",
      pendingCommandCount: 0,
      pendingWriteIntentCount: 0,
      plannedCommandCount: 0,
      preparedCommandCount: 0,
      providerAdapterBoundaryFingerprint: undefined,
      providerAdapterBoundaryId: undefined,
      providerAdapterBoundaryVersion: undefined,
      providerReadModelRecordId: undefined,
      readinessRecordId: undefined,
      readyRecordCount: 0,
      reviewedOutcomeCount: 0,
      status: "blocked",
      targetRfqId: undefined,
      warningCount: 0,
    }),
  }
}
