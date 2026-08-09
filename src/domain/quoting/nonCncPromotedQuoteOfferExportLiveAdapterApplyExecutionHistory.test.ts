import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlan"
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
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-09T12:05:00.000Z"
const requestedAt = "2026-08-09T12:00:00.000Z"

describe("non-CNC live-adapter apply execution history", () => {
  it("summarizes empty apply execution history with guarded next action", () => {
    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence().snapshot(),
    )

    expect(summary).toMatchObject({
      actionItems: ["Persist a live-adapter apply dry-run before enabling customer-offer export adapters."],
      appliedCommandCount: 0,
      blockedCommandCount: 0,
      commandCount: 0,
      exportText: expect.stringContaining("Recent runs:\n- none"),
      operatorSummary: "No non-CNC live-adapter apply execution runs have been persisted yet.",
      severity: "neutral",
      status: "empty",
      title: "No live-adapter apply execution history",
      totalRuns: 0,
      warningCount: 0,
    })
  })

  it("summarizes blocked apply execution history without ready evidence", async () => {
    const plan = blockedApplyPlan()
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      executedAt,
      mode: "commit",
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence()

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
      await persistence.recordRun(run),
    )

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve live-adapter apply execution blockers before recording another execution.",
      ],
      appliedCommandCount: 0,
      applyPlanIds: [plan.applyPlanId],
      blockedCommandCount: 5,
      latestCommittedExecutionFingerprints: [],
      latestCommitPlanIds: [],
      latestCommitRecordIds: [],
      latestRun: expect.objectContaining({
        status: "blocked",
        targetRfqId: undefined,
      }),
      operatorSummary:
        "Latest non-CNC live-adapter apply execution is blocked after 1 run; live customer-offer, file, release-review, export, and connector writes remain disabled.",
      severity: "attention",
      status: "blocked",
      targetRfqIds: [],
      title: "Live-adapter apply execution history blocked",
      totalRuns: 1,
      warningCount: 0,
    })
    expect(summary.exportText).toContain("Committed executions: none")
    expect(summary.exportText).toContain("Blocked commands: 5")
  })

  it("summarizes applied execution history with latest evidence and export text", async () => {
    const plan = await readyApplyPlan()
    const dryRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      executedAt,
      mode: "dry_run",
    })
    const commitRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      commandOutcomes: plan.commands.map((command) => ({
        externalId: `external-${command.key}`,
        key: command.key,
        status: "applied",
      })),
      executedAt: "2026-08-09T12:06:00.000Z",
      mode: "commit",
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence()
    await persistence.recordRun(dryRun)

    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
      await persistence.recordRun(commitRun),
    )

    expect(summary).toMatchObject({
      actionItems: [
        "Review applied live-adapter evidence before wiring active export state.",
        "Review 2 warnings before customer-visible release.",
      ],
      appliedCommandCount: 5,
      applyPlanFingerprints: [plan.applyPlanFingerprint],
      applyPlanIds: [plan.applyPlanId],
      commandCount: 10,
      latestCommittedExecutionFingerprints: [plan.latestCommittedExecutionFingerprint],
      latestRun: expect.objectContaining({
        appliedCommandCount: 5,
        executionFingerprint: commitRun.executionFingerprint,
        mode: "commit",
        status: "succeeded",
      }),
      operatorSummary:
        "Latest non-CNC live-adapter apply execution succeeded with 5 commands recorded for review-only export wiring.",
      preparedCommandCount: 5,
      severity: "success",
      status: "applied",
      targetRfqIds: ["rfq-demo-204"],
      title: "Live-adapter apply execution history ready",
      totalRuns: 2,
      warningCount: 2,
    })
    expect(summary.exportText).toContain("Non-CNC offer export live adapter apply execution history")
    expect(summary.exportText).toContain("Applied commands: 5")
    expect(summary.exportText).toContain(`Committed executions: ${plan.latestCommittedExecutionFingerprint}`)
    expect(summary.exportText).toContain("Boundary: apply execution history is deterministic review data only")
  })

  it("limits recent runs and returns cloned history data", async () => {
    const plan = await readyApplyPlan()
    const olderRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      executedAt: "2026-08-09T12:05:00.000Z",
      mode: "dry_run",
    })
    const newerRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor: "Replacement Operator",
      applyPlan: plan,
      commandOutcomes: plan.commands.map((command) => ({
        externalId: `external-${command.key}`,
        key: command.key,
        status: "applied",
      })),
      executedAt: "2026-08-09T12:15:00.000Z",
      mode: "commit",
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence()
    await persistence.recordRun(olderRun)
    await persistence.recordRun(newerRun)

    const snapshot = persistence.snapshot()
    const summary = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(snapshot, {
      recentRunLimit: 1,
    })
    summary.recentRuns[0]!.actor = "Mutated Operator"
    summary.latestRun!.actor = "Mutated Latest Operator"
    summary.latestCommittedExecutionFingerprints.push("mutated-fingerprint")

    const restored = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(snapshot, {
      recentRunLimit: 1,
    })

    expect(restored).toMatchObject({
      appliedCommandCount: 5,
      preparedCommandCount: 5,
      recentRuns: [expect.objectContaining({ executedAt: "2026-08-09T12:15:00.000Z" })],
      totalRuns: 2,
      warningCount: 2,
    })
    expect(restored.recentRuns[0]?.actor).toBe("Replacement Operator")
    expect(restored.latestRun?.actor).toBe("Replacement Operator")
    expect(restored.latestCommittedExecutionFingerprints).not.toContain("mutated-fingerprint")
    expect(snapshot.records[0]?.actor).toBe("Replacement Operator")
    expect(snapshot.latestRun?.actor).toBe("Replacement Operator")
    expect(snapshot.latestCommittedExecutionFingerprints).not.toContain("mutated-fingerprint")
  })

  it("rejects invalid recent run limits", () => {
    const snapshot = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(snapshot, {
        recentRunLimit: 0,
      }),
    ).toThrow("recentRunLimit must be a positive safe integer")
  })
})

function blockedApplyPlan(): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan {
  const history = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence().snapshot(),
  )
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
    outcomeCommitHistory: history,
    requestedAt,
    requestedBy: actor,
  })
}

async function readyApplyPlan(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan> {
  const plan = await readyExecutionPlan()
  const dryRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
    actor,
    executedAt,
    mode: "dry_run",
    plan,
  })
  const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(dryRun)
  const { commitPlan, executionRun } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
    actor,
    executedAt,
    outcomeDraft,
    plan,
  })
  if (!executionRun) {
    throw new Error("Expected committed live-adapter outcome execution run")
  }
  const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()
  const snapshot = await persistence.recordCommit({
    commitPlan,
    executionRun,
    recordedAt: "2026-08-09T11:58:00.000Z",
    recordedBy: actor,
  })
  const history = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(snapshot)
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
    outcomeCommitHistory: history,
    requestedAt,
    requestedBy: actor,
  })
}

async function readyExecutionPlan(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan> {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: readyReadiness,
  })
  const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const snapshot = await history.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-09T11:50:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt: "2026-08-09T11:55:00.000Z",
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
  requestedAt: "2026-08-09T11:45:00.000Z",
  requestedBy: actor,
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}
