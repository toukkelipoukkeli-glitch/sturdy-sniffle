import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"

describe("non-CNC live-adapter apply execution readiness history", () => {
  it("summarizes empty readiness snapshots without live-write side effects", () => {
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence().snapshot()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(snapshot)

    expect(summary).toMatchObject({
      actionItems: ["Persist apply-execution readiness before enabling customer-offer export adapters."],
      appliedCommandCount: 0,
      blockedCount: 0,
      readyCount: 0,
      recentRecords: [],
      severity: "neutral",
      status: "empty",
      title: "No live-adapter apply readiness history",
      totalRecords: 0,
    })
    expect(summary.operatorSummary).toBe(
      "No non-CNC live-adapter apply execution readiness records have been persisted yet.",
    )
    expect(summary.exportText).toContain("Status: empty")
    expect(summary.exportText).toContain("Boundary: apply-execution readiness history is deterministic review data only")
  })

  it("summarizes blocked readiness history with blockers and warning actions", () => {
    const blocked = blockedRecord({ recordedAt: "2026-08-09T14:00:00.000Z" })
    const olderReady = readyRecord({ recordedAt: "2026-08-09T13:00:00.000Z" })
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
      initialSnapshot: { records: [olderReady, blocked] },
    }).snapshot()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(snapshot, {
      recentRecordLimit: 1,
    })

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve apply-execution readiness blockers before using final-gate evidence.",
        "Review 2 warnings before customer-visible release.",
      ],
      appliedCommandCount: 5,
      blockedCount: 1,
      blockerCount: 1,
      readyCount: 1,
      recentRecords: [blocked],
      severity: "attention",
      status: "blocked",
      title: "Live-adapter apply readiness history blocked",
      totalRecords: 2,
      warningCount: 2,
    })
    expect(summary.operatorSummary).toContain("blocked after 2 records")
    expect(summary.exportText).toContain("Blocked records: 1")
    expect(summary.exportText).toContain(`Latest readiness: ${blocked.recordedAt} | blocked`)
    expect(summary.exportText).not.toContain(`- ${olderReady.recordedAt}`)
  })

  it("summarizes ready readiness evidence and returns cloned records", () => {
    const ready = readyRecord({ recordedAt: "2026-08-09T14:00:00.000Z" })
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
      initialSnapshot: { records: [ready] },
    }).snapshot()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(snapshot)
    summary.recentRecords[0].reviewWarnings.push("mutated warning")
    if (summary.latestRecord) {
      summary.latestRecord.blockerLabels.push("mutated blocker")
    }
    summary.latestExecutionFingerprints.push("mutated-execution")

    const rebuilt = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(snapshot)

    expect(summary).toMatchObject({
      appliedCommandCount: 5,
      blockedCount: 0,
      latestApplyPlanIds: [ready.latestApplyPlanId],
      latestCommitRecordIds: [ready.latestCommitRecordId],
      latestCommittedExecutionFingerprints: [ready.latestCommittedExecutionFingerprint],
      latestSourceExecutionFingerprints: [ready.latestSourceExecutionFingerprint],
      readyCount: 1,
      readyRecordIds: [ready.readinessRecordId],
      severity: "success",
      status: "ready",
      title: "Live-adapter apply readiness history ready",
      totalRecords: 1,
    })
    expect(summary.operatorSummary).toContain("final-gate ready with 5 applied commands")
    expect(summary.exportText).toContain(`Apply executions: ${ready.latestExecutionFingerprint}`)
    expect(rebuilt.recentRecords[0].reviewWarnings).not.toContain("mutated warning")
    expect(rebuilt.latestRecord?.blockerLabels).not.toContain("mutated blocker")
    expect(rebuilt.latestExecutionFingerprints).not.toContain("mutated-execution")
  })

  it("rejects invalid recent record limits", () => {
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(snapshot, {
        recentRecordLimit: 0,
      }),
    ).toThrow("recentRecordLimit must be a positive safe integer")
  })
})

function readyRecord({ recordedAt }: { recordedAt: string }): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  return {
    appliedCommandCount: 5,
    blockerCount: 0,
    blockerLabels: [],
    latestApplyPlanFingerprint: "non-cnc-apply-plan-fingerprint:rfq-demo-204:ready",
    latestApplyPlanId: "non-cnc-apply-plan:rfq-demo-204:ready",
    latestCommitPlanId: "non-cnc-outcome-commit-plan:rfq-demo-204:ready",
    latestCommitRecordId: "non-cnc-outcome-commit-record:rfq-demo-204:ready",
    latestCommittedExecutionFingerprint: "non-cnc-outcome-commit-execution:rfq-demo-204:ready",
    latestExecutionFingerprint: "non-cnc-apply-execution:rfq-demo-204:ready",
    latestSourceExecutionFingerprint: "non-cnc-live-adapter-source-execution:rfq-demo-204:ready",
    latestStatus: "succeeded",
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
    persistedRunCount: 1,
    readinessRecordId: "non-cnc-apply-readiness:rfq-demo-204:ready",
    readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
    recordedAt,
    recordedBy: "FactoryBid Operator",
    requestedAt: "2026-08-09T13:55:00.000Z",
    requestedBy: "FactoryBid Operator",
    reviewWarnings: ["Latest apply execution record has 1 warning(s)."],
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
  }
}

function blockedRecord({
  recordedAt,
}: {
  recordedAt: string
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  return {
    appliedCommandCount: 0,
    blockerCount: 1,
    blockerLabels: ["No persisted non-CNC live-adapter apply execution records are available."],
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
    persistedRunCount: 0,
    readinessRecordId: "non-cnc-apply-readiness:rfq-demo-204:blocked",
    readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
    recordedAt,
    recordedBy: "FactoryBid Operator",
    requestedAt: "2026-08-09T13:58:00.000Z",
    requestedBy: "FactoryBid Operator",
    reviewWarnings: ["Operator must record apply execution history before final-gate readiness."],
    status: "blocked",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
  }
}
