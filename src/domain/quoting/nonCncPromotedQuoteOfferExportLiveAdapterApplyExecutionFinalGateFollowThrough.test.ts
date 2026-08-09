import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"

describe("non-CNC live-adapter apply execution final-gate follow-through", () => {
  it("blocks empty readiness history without leaking live evidence", () => {
    const history = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence().snapshot(),
    )

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
      readinessHistory: history,
      requestedAt: "2026-08-09T20:00:00.000Z",
      requestedBy: "FactoryBid Operator",
    })

    expect(plan).toMatchObject({
      appliedCommandCount: 0,
      blockedCommandCount: 5,
      blockedRecordCount: 0,
      commandCount: 5,
      historyRecordCount: 0,
      plannedCommandCount: 0,
      readyRecordCount: 0,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(plan.blockerLabels).toEqual([
      "Persist ready apply-execution readiness history before final-gate follow-through.",
    ])
    expect(plan.commands).toHaveLength(5)
    expect(plan.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(plan.commands.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(plan.commands.every((command) => command.idempotencyKey === undefined)).toBe(true)
    expect(plan.exportText).toContain("Target RFQ: none")
    expect(plan.exportText).toContain("Boundary: Apply-execution final-gate follow-through plans are deterministic")
  })

  it("plans review-only final-gate commands from ready readiness history", () => {
    const ready = readyRecord({ recordedAt: "2026-08-09T19:00:00.000Z" })
    const history = historyFromRecords([ready])

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
      readinessHistory: history,
      requestedAt: "2026-08-09T20:00:00+00:00",
      requestedBy: "FactoryBid Operator",
    })

    expect(plan).toMatchObject({
      appliedCommandCount: 5,
      blockedCommandCount: 0,
      commandCount: 5,
      followThroughVersion:
        "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through.v1",
      historyRecordCount: 1,
      latestApplyPlanId: ready.latestApplyPlanId,
      latestCommitRecordId: ready.latestCommitRecordId,
      latestCommittedExecutionFingerprint: ready.latestCommittedExecutionFingerprint,
      latestExecutionFingerprint: ready.latestExecutionFingerprint,
      latestSourceExecutionFingerprint: ready.latestSourceExecutionFingerprint,
      plannedCommandCount: 5,
      readinessRecordId: ready.readinessRecordId,
      requestedAt: "2026-08-09T20:00:00.000Z",
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(plan.blockerLabels).toEqual([])
    expect(plan.commands.map((command) => command.key)).toEqual([
      "customer_offer_final_gate",
      "file_export_final_gate",
      "release_review_final_gate",
      "connector_reference_final_gate",
      "rollback_evidence_final_gate",
    ])
    expect(plan.commands.every((command) => command.status === "planned")).toBe(true)
    expect(plan.commands.every((command) => command.idempotencyKey?.startsWith("non-cnc-live-adapter-final-gate:rfq-demo-204:"))).toBe(true)
    expect(plan.commands[0].evidenceFingerprints).toEqual([
      ready.latestApplyPlanFingerprint,
      ready.latestApplyPlanId,
      ready.latestCommitPlanId,
      ready.latestCommitRecordId,
      ready.latestCommittedExecutionFingerprint,
      ready.latestExecutionFingerprint,
      ready.latestSourceExecutionFingerprint,
      ready.readinessRecordId,
    ].sort())
    expect(plan.operatorSummary).toContain("Ready final-gate follow-through prepares 5 review-only commands")
    expect(plan.nextActionLabels).toContain("Review 5 final-gate follow-through commands before enabling live adapters.")
    expect(plan.exportText).toContain(`Readiness record: ${ready.readinessRecordId}`)
  })

  it("withholds evidence when readiness history is blocked", () => {
    const ready = readyRecord({ recordedAt: "2026-08-09T18:00:00.000Z" })
    const blocked = blockedRecord({ recordedAt: "2026-08-09T19:00:00.000Z" })
    const history = historyFromRecords([ready, blocked])

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
      readinessHistory: history,
      requestedAt: "2026-08-09T20:00:00.000Z",
      requestedBy: "FactoryBid Operator",
    })

    expect(plan).toMatchObject({
      appliedCommandCount: 0,
      blockedCommandCount: 5,
      latestApplyPlanId: undefined,
      latestCommitRecordId: undefined,
      latestExecutionFingerprint: undefined,
      plannedCommandCount: 0,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(plan.blockerLabels).toContain("Latest apply-execution readiness history status is blocked.")
    expect(plan.blockerLabels).toContain("Latest apply-execution readiness record must be ready.")
    expect(plan.commands.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
  })

  it("blocks internally inconsistent ready summaries deterministically", () => {
    const ready = readyRecord({ recordedAt: "2026-08-09T19:00:00.000Z" })
    const history = {
      ...historyFromRecords([ready]),
      latestCommitRecordIds: [],
      latestExecutionFingerprints: ["different-execution"],
    } satisfies NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
      readinessHistory: history,
      requestedAt: "2026-08-09T20:00:00.000Z",
      requestedBy: "FactoryBid Operator",
    })

    expect(plan.status).toBe("blocked")
    expect(plan.latestCommitRecordId).toBeUndefined()
    expect(plan.blockerLabels).toEqual([
      "Readiness history summary does not include the latest apply execution evidence.",
      "Readiness history summary does not include the latest commit record evidence.",
    ])
    expect(plan.commands.every((command) => command.status === "blocked")).toBe(true)
  })

  it("blocks malformed ready summaries with missing readiness identity or target index membership", () => {
    const ready = readyRecord({ recordedAt: "2026-08-09T19:00:00.000Z" })
    const readyHistory = historyFromRecords([ready])
    const blankReadinessIdHistory = {
      ...readyHistory,
      latestRecord: { ...readyHistory.latestRecord!, readinessRecordId: "" },
      readyRecordIds: [""],
    } satisfies NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary
    const unindexedTargetHistory = {
      ...historyFromRecords([ready]),
      targetRfqIds: [],
    } satisfies NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary

    const blankReadinessIdPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
      readinessHistory: blankReadinessIdHistory,
      requestedAt: "2026-08-09T20:00:00.000Z",
      requestedBy: "FactoryBid Operator",
    })
    const unindexedTargetPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
      readinessHistory: unindexedTargetHistory,
      requestedAt: "2026-08-09T20:00:00.000Z",
      requestedBy: "FactoryBid Operator",
    })

    expect(blankReadinessIdPlan.status).toBe("blocked")
    expect(blankReadinessIdPlan.blockerLabels).toContain("Latest readiness record is missing readiness record evidence.")
    expect(blankReadinessIdPlan.commands.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(unindexedTargetPlan.status).toBe("blocked")
    expect(unindexedTargetPlan.blockerLabels).toContain(
      "Readiness history summary does not include the latest target RFQ evidence.",
    )
    expect(unindexedTargetPlan.commands.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
  })

  it("uses stable fingerprints for equivalent inputs", () => {
    const ready = readyRecord({ recordedAt: "2026-08-09T19:00:00.000Z" })
    const history = historyFromRecords([ready])

    const first = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
      readinessHistory: history,
      requestedAt: "2026-08-09T20:00:00Z",
      requestedBy: "FactoryBid Operator",
    })
    const second = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
      readinessHistory: history,
      requestedAt: "2026-08-09T20:00:00.000+00:00",
      requestedBy: " FactoryBid Operator ",
    })

    expect(second.followThroughFingerprint).toBe(first.followThroughFingerprint)
    expect(second.followThroughId).toBe(first.followThroughId)
    expect(second.commands.map((command) => command.idempotencyKey)).toEqual(
      first.commands.map((command) => command.idempotencyKey),
    )
  })
})

function historyFromRecords(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord[],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
      initialSnapshot: { records },
    }).snapshot(),
  )
}

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
    requestedAt: "2026-08-09T18:55:00.000Z",
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
    requestedAt: "2026-08-09T18:58:00.000Z",
    requestedBy: "FactoryBid Operator",
    reviewWarnings: ["Operator must record apply execution history before final-gate readiness."],
    status: "blocked",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
  }
}
