import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlan"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistory"
import { createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence"
import { decideNonCncPromotedQuoteOfferExportLiveAdapter } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import { createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistory"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft"
import { createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"
const requestedAt = "2026-08-08T12:20:00.000Z"

describe("non-CNC live-adapter apply plan history", () => {
  it("summarizes empty apply plan history with guarded next action", () => {
    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence().snapshot(),
    )

    expect(summary).toMatchObject({
      actionItems: ["Persist a reviewed live-adapter apply plan before enabling customer-offer export adapters."],
      applyReadyCount: 0,
      blockedCommandCount: 0,
      blockedCount: 0,
      committedOutcomeCount: 0,
      exportText: expect.stringContaining("Recent apply plans:\n- none"),
      operatorSummary: "No non-CNC live-adapter apply plan records have been persisted yet.",
      plannedCommandCount: 0,
      severity: "neutral",
      status: "empty",
      title: "No live-adapter apply plan history",
      totalRecords: 0,
      warningCount: 0,
    })
  })

  it("summarizes blocked apply plan history without exposing committed execution evidence", async () => {
    const applyPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
      outcomeCommitHistory: buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence().snapshot(),
      ),
      requestedAt,
      requestedBy: actor,
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary(
      await persistence.recordApplyPlan({
        applyPlan,
        recordedAt: "2026-08-08T12:25:00.000Z",
        recordedBy: actor,
      }),
    )

    expect(summary).toMatchObject({
      actionItems: ["Resolve apply-plan blockers before retrying live-adapter export wiring."],
      applyReadyCount: 0,
      blockedCommandCount: 5,
      blockedCount: 1,
      blockedPlanIds: [applyPlan.applyPlanId],
      committedExecutionFingerprints: [],
      committedOutcomeCount: 0,
      latestRecord: expect.objectContaining({
        disposition: "review_only",
        latestCommittedExecutionFingerprint: undefined,
        status: "blocked",
      }),
      operatorSummary:
        "Latest non-CNC live-adapter apply plan is blocked after 1 record; live customer-offer, file, release-review, export, and connector writes remain disabled.",
      plannedCommandCount: 0,
      severity: "attention",
      status: "blocked",
      title: "Live-adapter apply plan history blocked",
      totalRecords: 1,
      warningCount: 0,
    })
    expect(summary.exportText).toContain("Committed executions: none")
    expect(summary.exportText).toContain("Blocked commands: 5")
  })

  it("summarizes apply-ready history with latest evidence and export text", async () => {
    const applyPlan = await readyApplyPlan()
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary(
      await persistence.recordApplyPlan({
        applyPlan,
        recordedAt: "2026-08-08T12:30:00.000Z",
        recordedBy: actor,
      }),
    )

    expect(summary).toMatchObject({
      actionItems: [
        "Review persisted apply-plan commands before wiring active export state.",
        "Review 1 warning before customer-visible release.",
      ],
      applyReadyCount: 1,
      applyReadyPlanIds: [applyPlan.applyPlanId],
      blockedCommandCount: 0,
      blockedCount: 0,
      committedExecutionFingerprints: [applyPlan.latestCommittedExecutionFingerprint],
      committedOutcomeCount: 5,
      latestRecord: expect.objectContaining({
        disposition: "apply_ready",
        latestCommittedExecutionFingerprint: applyPlan.latestCommittedExecutionFingerprint,
        plannedCommandCount: 5,
        status: "ready",
      }),
      operatorSummary:
        "Latest non-CNC live-adapter apply plan has 5 planned commands backed by committed outcome evidence for future adapter wiring.",
      plannedCommandCount: 5,
      severity: "success",
      status: "apply_ready",
      title: "Live-adapter apply plan history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.exportText).toContain("Non-CNC live adapter apply plan history")
    expect(summary.exportText).toContain("Apply-ready records: 1")
    expect(summary.exportText).toContain(`Committed executions: ${applyPlan.latestCommittedExecutionFingerprint}`)
    expect(summary.exportText).toContain("Boundary: apply plan history is deterministic review data only")
  })

  it("limits recent records and returns cloned history data", async () => {
    const blockedPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
      outcomeCommitHistory: buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence().snapshot(),
      ),
      requestedAt,
      requestedBy: actor,
    })
    const readyPlan = await readyApplyPlan()
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence()
    await persistence.recordApplyPlan({
      applyPlan: blockedPlan,
      recordedAt: "2026-08-08T12:25:00.000Z",
      recordedBy: actor,
    })
    await persistence.recordApplyPlan({
      applyPlan: readyPlan,
      recordedAt: "2026-08-08T12:35:00.000Z",
      recordedBy: "Replacement Operator",
    })

    const snapshot = persistence.snapshot()
    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary(snapshot, {
      recentRecordLimit: 1,
    })
    summary.recentRecords[0]!.recordedBy = "Mutated Operator"
    summary.latestRecord!.recordedBy = "Mutated Latest Operator"
    summary.committedExecutionFingerprints.push("mutated-fingerprint")

    const restored = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary(snapshot, {
      recentRecordLimit: 1,
    })

    expect(restored).toMatchObject({
      applyReadyCount: 1,
      blockedCount: 1,
      committedOutcomeCount: 5,
      recentRecords: [expect.objectContaining({ recordedAt: "2026-08-08T12:35:00.000Z" })],
      totalRecords: 2,
      warningCount: 1,
    })
    expect(restored.recentRecords[0]?.recordedBy).toBe("Replacement Operator")
    expect(restored.latestRecord?.recordedBy).toBe("Replacement Operator")
    expect(restored.committedExecutionFingerprints).not.toContain("mutated-fingerprint")
    expect(snapshot.records[0]?.recordedBy).toBe("Replacement Operator")
    expect(snapshot.latestRecord?.recordedBy).toBe("Replacement Operator")
  })

  it("rejects invalid recent record limits", () => {
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary(snapshot, {
        recentRecordLimit: 0,
      }),
    ).toThrow("recentRecordLimit must be a positive safe integer")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary(snapshot, {
        recentRecordLimit: 1.5,
      }),
    ).toThrow("recentRecordLimit must be a positive safe integer")
  })
})

async function readyApplyPlan() {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: readyReadiness,
  })
  const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const decisionHistory = await history.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-08T12:10:00.000Z",
  })
  const executionPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory,
    requestedAt: "2026-08-08T12:12:00.000Z",
    requestedBy: actor,
  })
  const dryRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
    actor,
    executedAt: "2026-08-08T12:15:00.000Z",
    mode: "dry_run",
    plan: executionPlan,
  })
  const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(dryRun)
  const { commitPlan, executionRun } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
    actor,
    executedAt: "2026-08-08T12:16:00.000Z",
    outcomeDraft,
    plan: executionPlan,
  })
  if (!executionRun) {
    throw new Error("Expected committed live-adapter outcome execution run")
  }
  const outcomeCommitPersistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()
  const outcomeCommitSnapshot = await outcomeCommitPersistence.recordCommit({
    commitPlan,
    executionRun,
    recordedAt: "2026-08-08T12:18:00.000Z",
    recordedBy: actor,
  })
  const outcomeCommitHistory =
    buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(outcomeCommitSnapshot)
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
    outcomeCommitHistory,
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
  requestedAt: "2026-08-08T12:00:00.000Z",
  requestedBy: actor,
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}
