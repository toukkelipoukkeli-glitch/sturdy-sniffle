import { describe, expect, it } from "vitest"

import { decideNonCncPromotedQuoteOfferExportLiveAdapter } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import {
  buildLiveAdapterDecisionRecord,
  buildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_HISTORY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"

const readyReadiness: NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness = {
  artifactOutcomeCount: 4,
  blockerLabels: [],
  latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
  latestPackageId: "non-cnc-export-package:rfq-demo-204:ready",
  latestPlanId: "non-cnc-export-plan:rfq-demo-204:ready",
  latestReleaseExecutionFingerprint: "non-cnc-release-execution:rfq-demo-204:ready",
  latestSourceExecutionFingerprint: "non-cnc-export-source:rfq-demo-204:ready",
  latestStatus: "succeeded",
  nextOperatorMessage: "Provider commit history is ready for a future customer-offer export adapter.",
  persistedRecordCount: 1,
  providerCommitBoundary:
    "Provider commit readiness is deterministic review data only; this helper does not create customer offers, files, release reviews, exports, or connector writes.",
  readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  requestedAt: "2026-08-03T12:40:00.000Z",
  requestedBy: actor,
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}

const blockedReadiness: NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness = {
  ...readyReadiness,
  artifactOutcomeCount: 0,
  blockerLabels: ["No persisted non-CNC offer export provider commit records are available."],
  latestExecutionFingerprint: undefined,
  latestPackageId: undefined,
  latestPlanId: undefined,
  latestReleaseExecutionFingerprint: undefined,
  latestSourceExecutionFingerprint: undefined,
  latestStatus: undefined,
  persistedRecordCount: 0,
  reviewWarnings: [],
  status: "blocked",
}

describe("non-CNC promoted quote offer export live-adapter decision history", () => {
  it("records blocked review-only decisions into deterministic snapshots", async () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: blockedReadiness,
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()

    const snapshot = await persistence.recordDecision(decision, {
      actor,
      recordedAt: "2026-08-03T13:00:00.000Z",
    })

    expect(snapshot).toMatchObject({
      adapterActionCounts: { keep_review_only: 1 },
      blockerCount: 1,
      historyVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_HISTORY_VERSION,
      latestExecutionFingerprints: [],
      latestReleaseExecutionFingerprints: [],
      modeCounts: { review_only: 1 },
      recordCount: 1,
      statusCounts: { blocked: 1 },
      targetRfqIds: ["rfq-demo-204"],
      warningCount: 0,
    })
    expect(snapshot.latestDecision).toMatchObject({
      actor,
      adapterAction: "keep_review_only",
      canUseLiveAdapter: false,
      enabled: true,
      mode: "review_only",
      status: "blocked",
      targetRfqId: "rfq-demo-204",
    })
    expect(snapshot.latestDecision?.decisionFingerprint).toMatch(
      /^non-cnc-promoted-quote-offer-export-live-adapter-decision-[a-f0-9]{32}$/,
    )
  })

  it("records fallback and ready decisions while preserving readiness evidence", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()

    await persistence.recordDecision(decideNonCncPromotedQuoteOfferExportLiveAdapter({ readiness: readyReadiness }), {
      actor,
      recordedAt: "2026-08-03T13:05:00.000Z",
    })
    const snapshot = await persistence.recordDecision(
      decideNonCncPromotedQuoteOfferExportLiveAdapter({
        enabled: true,
        readiness: readyReadiness,
      }),
      {
        actor,
        recordedAt: "2026-08-03T13:10:00.000Z",
      },
    )

    expect(snapshot).toMatchObject({
      adapterActionCounts: { enable_live_adapter: 1, keep_review_only: 1 },
      blockerCount: 1,
      latestExecutionFingerprints: ["non-cnc-export-provider-commit:rfq-demo-204:ready"],
      latestReleaseExecutionFingerprints: ["non-cnc-release-execution:rfq-demo-204:ready"],
      modeCounts: { live_adapter: 1, review_only: 1 },
      recordCount: 2,
      statusCounts: { fallback: 1, ready: 1 },
      warningCount: 2,
    })
    expect(snapshot.latestDecision).toMatchObject({
      adapterAction: "enable_live_adapter",
      canUseLiveAdapter: true,
      enabled: true,
      latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
      latestReleaseExecutionFingerprint: "non-cnc-release-execution:rfq-demo-204:ready",
      mode: "live_adapter",
      status: "ready",
    })
  })

  it("dedupes seeded records by decision fingerprint and keeps the newest record", () => {
    const older = buildLiveAdapterDecisionRecord(
      decideNonCncPromotedQuoteOfferExportLiveAdapter({ readiness: readyReadiness }),
      { actor, recordedAt: "2026-08-03T13:05:00.000Z" },
    )
    const newer = {
      ...older,
      actor: "FactoryBid Supervisor",
      recordedAt: "2026-08-03T13:20:00.000Z",
      reviewWarnings: [...older.reviewWarnings, "Supervisor requested staged rollout."],
    }
    // Seeded history records preserve their stored fingerprint while review metadata can be corrected later.

    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory({
      initialSnapshot: {
        records: [older, newer],
      },
    }).snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.latestDecision).toMatchObject({
      actor: "FactoryBid Supervisor",
      recordedAt: "2026-08-03T13:20:00.000Z",
    })
    expect(snapshot.warningCount).toBe(2)
  })

  it("returns clone-safe snapshots and summaries", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    const snapshot = await persistence.recordDecision(
      decideNonCncPromotedQuoteOfferExportLiveAdapter({
        readiness: readyReadiness,
      }),
      { actor, recordedAt: "2026-08-03T13:05:00.000Z" },
    )
    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary(snapshot)

    snapshot.records[0].actor = "Mutated"
    snapshot.records[0].blockerLabels.push("mutated")
    snapshot.statusCounts.fallback = 99
    summary.recentDecisions[0].actor = "Mutated summary"

    const restoredSnapshot = persistence.snapshot()
    const restoredSummary = buildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary(restoredSnapshot)
    expect(restoredSnapshot.records[0].actor).toBe(actor)
    expect(restoredSnapshot.records[0].blockerLabels).toEqual([
      "VITE_FACTORYBID_ENABLE_NON_CNC_EXPORT_PROVIDER_WRITES disabled",
    ])
    expect(restoredSnapshot.statusCounts.fallback).toBe(1)
    expect(restoredSummary.latestDecision?.actor).toBe(actor)
  })

  it("summarizes empty, fallback, blocked, and ready histories with copyable export text", async () => {
    const emptySummary = buildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory().snapshot(),
    )
    expect(emptySummary).toMatchObject({
      severity: "neutral",
      status: "empty",
      title: "No live-adapter decision history",
      totalRecords: 0,
    })
    expect(emptySummary.exportText).toContain("Recent decisions:\n- none")

    const fallbackPersistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    const fallbackSummary = buildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary(
      await fallbackPersistence.recordDecision(
        decideNonCncPromotedQuoteOfferExportLiveAdapter({
          readiness: readyReadiness,
        }),
        { actor, recordedAt: "2026-08-03T13:05:00.000Z" },
      ),
    )
    expect(fallbackSummary).toMatchObject({
      severity: "warning",
      status: "fallback",
      title: "Live-adapter decision fallback",
      totalRecords: 1,
    })
    expect(fallbackSummary.exportText).toContain("Status: fallback")
    expect(fallbackSummary.exportText).toContain("live customer-offer, file, release-review, export, and connector writes remain disabled")

    const blockedPersistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    const blockedSummary = buildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary(
      await blockedPersistence.recordDecision(
        decideNonCncPromotedQuoteOfferExportLiveAdapter({
          readiness: blockedReadiness,
        }),
        { actor, recordedAt: "2026-08-03T13:00:00.000Z" },
      ),
    )
    expect(blockedSummary).toMatchObject({
      severity: "blocked",
      status: "blocked",
      title: "Live-adapter decision blocked",
    })

    const readyPersistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    const readySummary = buildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary(
      await readyPersistence.recordDecision(
        decideNonCncPromotedQuoteOfferExportLiveAdapter({
          enabled: true,
          readiness: readyReadiness,
        }),
        { actor, recordedAt: "2026-08-03T13:10:00.000Z" },
      ),
    )
    expect(readySummary).toMatchObject({
      severity: "success",
      status: "ready",
      title: "Live-adapter decision ready",
    })
  })

  it("rejects malformed seeded records that imply impossible live-write state", () => {
    const readyRecord = buildLiveAdapterDecisionRecord(
      decideNonCncPromotedQuoteOfferExportLiveAdapter({
        enabled: true,
        readiness: readyReadiness,
      }),
      { actor, recordedAt: "2026-08-03T13:10:00.000Z" },
    )
    const fallbackRecord = buildLiveAdapterDecisionRecord(
      decideNonCncPromotedQuoteOfferExportLiveAdapter({ readiness: readyReadiness }),
      { actor, recordedAt: "2026-08-03T13:05:00.000Z" },
    )
    const blockedRecord = buildLiveAdapterDecisionRecord(
      decideNonCncPromotedQuoteOfferExportLiveAdapter({ readiness: blockedReadiness }),
      { actor, recordedAt: "2026-08-03T13:00:00.000Z" },
    )

    const malformedSeedCases: Array<{
      expectedError: string
      record: unknown
    }> = [
      {
        expectedError: "records[] entries must be non-null objects",
        record: null,
      },
      {
        expectedError: "records[] entries must be non-null objects",
        record: "not-a-record",
      },
      {
        expectedError: "ready live-adapter decision records cannot include blockers",
        record: {
          ...readyRecord,
          blockerLabels: ["Impossible ready blocker."],
        },
      },
      {
        expectedError: "ready live-adapter decision records must include latest execution evidence",
        record: {
          ...readyRecord,
          latestExecutionFingerprint: undefined,
        },
      },
      {
        expectedError: "blocked or fallback live-adapter decision records must keep review-only mode",
        record: {
          ...blockedRecord,
          mode: "live_adapter",
        },
      },
      {
        expectedError: "blocked or fallback live-adapter decision records must keep review-only mode",
        record: {
          ...fallbackRecord,
          adapterAction: "enable_live_adapter",
        },
      },
      {
        expectedError: "blocked live-adapter decision records cannot use live adapters",
        record: {
          ...blockedRecord,
          canUseLiveAdapter: true,
        },
      },
      {
        expectedError: "blocked or fallback live-adapter decision records must include blocker labels",
        record: {
          ...blockedRecord,
          blockerLabels: [],
        },
      },
      {
        expectedError: "blocked or fallback live-adapter decision records must include blocker labels",
        record: {
          ...fallbackRecord,
          blockerLabels: [],
        },
      },
      {
        expectedError: "fallback live-adapter decision records must have ready evidence and disabled opt-in",
        record: {
          ...fallbackRecord,
          enabled: true,
        },
      },
      {
        expectedError: "historyVersion is not a supported non-CNC offer export live-adapter decision history version",
        record: {
          ...readyRecord,
          historyVersion: "unsupported",
        },
      },
      {
        expectedError: "status is not a supported non-CNC offer export live-adapter decision status",
        record: {
          ...readyRecord,
          status: "unsupported",
        },
      },
      {
        expectedError: "mode is not a supported non-CNC offer export live-adapter decision mode",
        record: {
          ...readyRecord,
          mode: "unsupported",
        },
      },
      {
        expectedError: "adapterAction is not a supported non-CNC offer export live-adapter decision action",
        record: {
          ...readyRecord,
          adapterAction: "unsupported",
        },
      },
      {
        expectedError: "enabled must be a boolean",
        record: {
          ...readyRecord,
          enabled: "yes",
        },
      },
      {
        expectedError: "canUseLiveAdapter must be a boolean",
        record: {
          ...readyRecord,
          canUseLiveAdapter: "yes",
        },
      },
      {
        expectedError: "recordedAt must be a valid ISO timestamp",
        record: {
          ...fallbackRecord,
          recordedAt: "not-a-date",
        },
      },
      {
        expectedError: "blockerLabels must be an array",
        record: {
          ...fallbackRecord,
          blockerLabels: "not-an-array",
        },
      },
      {
        expectedError: "reviewWarnings[0] must be a string",
        record: {
          ...fallbackRecord,
          reviewWarnings: [1],
        },
      },
    ]

    for (const { expectedError, record } of malformedSeedCases) {
      expect(() =>
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory({
          initialSnapshot: {
            records: [record as never],
          },
        }),
      ).toThrow(expectedError)
    }
  })

  it("rejects invalid live-adapter decision history summary limits", () => {
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory().snapshot()

    for (const recentDecisionLimit of [0, -1, 1.5]) {
      expect(() =>
        buildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary(snapshot, {
          recentDecisionLimit,
        }),
      ).toThrow("recentDecisionLimit must be a positive safe integer")
    }
  })
})
