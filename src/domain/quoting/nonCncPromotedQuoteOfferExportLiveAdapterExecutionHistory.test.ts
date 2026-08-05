import { describe, expect, it } from "vitest"

import {
  decideNonCncPromotedQuoteOfferExportLiveAdapter,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"
const requestedAt = "2026-08-04T17:15:00.000Z"

describe("non-CNC promoted quote offer export live-adapter execution history", () => {
  it("summarizes empty live-adapter execution history with a guarded next action", () => {
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence().snapshot()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummary(snapshot)

    expect(summary).toMatchObject({
      actionItems: ["Persist a live-adapter dry-run execution audit before enabling customer-offer export adapters."],
      commandCount: 0,
      exportText: expect.stringContaining("Recent runs:\n- none"),
      operatorSummary: "No non-CNC offer export live-adapter execution audits have been persisted yet.",
      severity: "neutral",
      status: "empty",
      title: "No live-adapter execution history",
      totalRuns: 0,
    })
  })

  it("summarizes blocked live-adapter execution history without exposing live evidence ids", async () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: {
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
      },
    })
    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision,
      requestedAt,
      requestedBy: actor,
    })
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt: requestedAt,
      mode: "commit",
      plan,
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummary(await adapter.recordRun(run))

    expect(summary).toMatchObject({
      actionItems: ["Resolve live-adapter execution blockers before recording another execution."],
      blockedCommandCount: 5,
      commandCount: 5,
      latestExecutionFingerprints: [],
      latestReleaseExecutionFingerprints: [],
      operatorSummary:
        "Latest non-CNC live-adapter execution is blocked after 1 run; live customer-offer, file, release-review, export, and connector writes remain disabled.",
      severity: "attention",
      status: "blocked",
      targetRfqIds: [],
      title: "Live-adapter execution history blocked",
      totalRuns: 1,
    })
    expect(summary.exportText).toContain("Latest provider commits: none")
    expect(summary.exportText).toContain("Blocked commands: 5")
  })

  it("summarizes prepared live-adapter dry-runs with command counts and export text", async () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: readyReadiness,
    })
    const decisionHistory = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    const historySnapshot = await decisionHistory.recordDecision(decision, {
      actor,
      recordedAt: "2026-08-04T17:10:00.000Z",
    })
    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision,
      decisionHistory: historySnapshot,
      requestedAt,
      requestedBy: actor,
    })
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt: requestedAt,
      mode: "dry_run",
      plan,
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummary(await adapter.recordRun(run))

    expect(summary).toMatchObject({
      actionItems: [
        "Review prepared live-adapter commands before committing provider side effects.",
        "Review 1 warning before customer-visible release.",
      ],
      commandCount: 5,
      latestExecutionFingerprints: ["non-cnc-export-provider-commit:rfq-demo-204:ready"],
      preparedCommandCount: 5,
      severity: "ready",
      status: "prepared",
      targetRfqIds: ["rfq-demo-204"],
      title: "Live-adapter dry-run prepared",
      totalRuns: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toBe(
      "Latest non-CNC live-adapter dry-run prepared 5 commands for review before any provider side effects.",
    )
    expect(summary.exportText).toContain("Non-CNC offer export live adapter execution history")
    expect(summary.exportText).toContain("Prepared commands: 5")
    expect(summary.exportText).toContain("Release executions: non-cnc-release-execution:rfq-demo-204:ready")
  })
})

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
