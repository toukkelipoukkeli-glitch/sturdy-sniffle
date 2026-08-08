import { describe, expect, it } from "vitest"

import { decideNonCncPromotedQuoteOfferExportLiveAdapter } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import { createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommit"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistory"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft"
import { createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-04T17:20:00.000Z"
const requestedAt = "2026-08-04T17:15:00.000Z"

describe("non-CNC live-adapter outcome commit history", () => {
  it("summarizes empty outcome commit history with guarded next action", () => {
    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence().snapshot(),
    )

    expect(summary).toMatchObject({
      actionItems: ["Persist a reviewed live-adapter outcome commit before enabling customer-offer export adapters."],
      blockedCount: 0,
      committedCount: 0,
      exportText: expect.stringContaining("Recent outcome commits:\n- none"),
      operatorSummary: "No non-CNC live-adapter outcome commit records have been persisted yet.",
      outcomeCount: 0,
      severity: "neutral",
      status: "empty",
      title: "No live-adapter outcome commit history",
      totalRecords: 0,
      warningCount: 0,
    })
  })

  it("summarizes blocked outcome commits without exposing committed evidence", async () => {
    const plan = await fallbackPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor,
        executedAt,
        mode: "dry_run",
        plan,
      }),
    )
    const { commitPlan } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft,
      plan,
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
      await persistence.recordCommit({
        commitPlan,
        recordedAt: "2026-08-04T17:25:00.000Z",
        recordedBy: actor,
      }),
    )

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve outcome commit blockers before retrying live-adapter export wiring.",
        "Review 1 warning before customer-visible release.",
      ],
      blockedCount: 1,
      blockedPlanIds: [plan.planId],
      committedCount: 0,
      committedExecutionFingerprints: [],
      latestRecord: expect.objectContaining({
        committedExecutionFingerprint: undefined,
        disposition: "review_only",
        status: "blocked",
      }),
      operatorSummary:
        "Latest non-CNC live-adapter outcome commit is blocked after 1 record; live customer-offer, file, release-review, export, and connector writes remain disabled.",
      outcomeCount: 0,
      severity: "attention",
      sourceExecutionFingerprints: [commitPlan.executionFingerprint],
      status: "blocked",
      title: "Live-adapter outcome commit history blocked",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.exportText).toContain("Committed executions: none")
    expect(summary.exportText).toContain("Blocked records: 1")
  })

  it("summarizes committed outcome history with latest evidence and export text", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))
    const { commitPlan, executionRun } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft,
      plan,
    })
    if (!executionRun) {
      throw new Error("Expected ready live-adapter outcome commit run")
    }
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
      await persistence.recordCommit({
        commitPlan,
        executionRun,
        recordedAt: "2026-08-04T17:30:00.000Z",
        recordedBy: actor,
      }),
    )

    expect(summary).toMatchObject({
      actionItems: [
        "Review committed live-adapter outcome evidence before wiring active export state.",
        "Review 1 warning before customer-visible release.",
      ],
      blockedCount: 0,
      committedCount: 1,
      committedExecutionFingerprints: [executionRun.executionFingerprint],
      commitReadyPlanIds: [plan.planId],
      latestRecord: expect.objectContaining({
        commandOutcomeCount: 5,
        committedExecutionFingerprint: executionRun.executionFingerprint,
        disposition: "commit_ready",
        status: "ready",
      }),
      operatorSummary:
        "Latest non-CNC live-adapter outcome commit persisted 5 outcomes with committed execution evidence for review-only export wiring.",
      outcomeCount: 5,
      severity: "success",
      sourceExecutionFingerprints: [commitPlan.executionFingerprint],
      status: "committed",
      title: "Live-adapter outcome commit history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.exportText).toContain("Non-CNC live adapter outcome commit history")
    expect(summary.exportText).toContain("Outcomes: 5")
    expect(summary.exportText).toContain(`Committed executions: ${executionRun.executionFingerprint}`)
    expect(summary.exportText).toContain("Boundary: outcome commit history is deterministic review data only")
  })

  it("limits recent records and returns cloned history data", async () => {
    const olderPlan = await fallbackPlan()
    const olderDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(olderPlan))
    const olderRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft: olderDraft,
      plan: olderPlan,
    })
    const newerPlan = await readyPlan()
    const newerDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(newerPlan))
    const newerRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft: newerDraft,
      plan: newerPlan,
    })
    if (!newerRun.executionRun) {
      throw new Error("Expected newer ready live-adapter outcome commit run")
    }
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()
    await persistence.recordCommit({
      commitPlan: olderRun.commitPlan,
      recordedAt: "2026-08-04T17:30:00.000Z",
      recordedBy: actor,
    })
    await persistence.recordCommit({
      commitPlan: newerRun.commitPlan,
      executionRun: newerRun.executionRun,
      recordedAt: "2026-08-04T17:45:00.000Z",
      recordedBy: "Replacement Operator",
    })

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
      persistence.snapshot(),
      { recentRecordLimit: 1 },
    )
    summary.recentRecords[0]!.recordedBy = "Mutated Operator"
    summary.latestRecord!.recordedBy = "Mutated Latest Operator"
    summary.committedExecutionFingerprints.push("mutated-fingerprint")

    const restored = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
      persistence.snapshot(),
      { recentRecordLimit: 1 },
    )

    expect(restored).toMatchObject({
      committedCount: 1,
      outcomeCount: 5,
      recentRecords: [expect.objectContaining({ recordedAt: "2026-08-04T17:45:00.000Z" })],
      totalRecords: 2,
      warningCount: 2,
    })
    expect(restored.recentRecords[0]?.recordedBy).toBe("Replacement Operator")
    expect(restored.latestRecord?.recordedBy).toBe("Replacement Operator")
    expect(restored.committedExecutionFingerprints).not.toContain("mutated-fingerprint")
  })

  it("rejects invalid recent record limits", () => {
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(snapshot, {
        recentRecordLimit: 0,
      }),
    ).toThrow("recentRecordLimit must be a positive safe integer")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(snapshot, {
        recentRecordLimit: 1.5,
      }),
    ).toThrow("recentRecordLimit must be a positive safe integer")
  })
})

async function readyDryRun(plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan) {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
    actor,
    executedAt,
    mode: "dry_run",
    plan,
  })
}

async function readyPlan(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan> {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: readyReadiness,
  })
  const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const snapshot = await history.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-04T17:10:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt,
    requestedBy: actor,
  })
}

async function fallbackPlan(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan> {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    readiness: readyReadiness,
  })
  const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const snapshot = await history.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-04T17:10:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt,
    requestedBy: actor,
  })
}

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
