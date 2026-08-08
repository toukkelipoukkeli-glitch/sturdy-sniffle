import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlan"
import { decideNonCncPromotedQuoteOfferExportLiveAdapter } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import { createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary,
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
const executedAt = "2026-08-08T09:15:00.000Z"
const requestedAt = "2026-08-08T09:20:00.000Z"

describe("non-CNC live-adapter apply plan", () => {
  it("blocks empty outcome commit history without live-write commands", () => {
    const history = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence().snapshot(),
    )

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
      outcomeCommitHistory: history,
      requestedAt,
      requestedBy: actor,
    })

    expect(plan).toMatchObject({
      applyPlanVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION,
      blockedCommandCount: 5,
      blockerLabels: ["Persist a committed live-adapter outcome history record before planning live apply commands."],
      committedOutcomeCount: 0,
      historyRecordCount: 0,
      plannedCommandCount: 0,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(plan.commands).toHaveLength(5)
    expect(plan.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(plan.commands.every((command) => command.idempotencyKey === undefined)).toBe(true)
    expect(plan.exportText).toContain("Status: blocked")
    expect(plan.exportText).toContain("Boundary: Live-adapter apply plans are deterministic review data only")
  })

  it("builds deterministic review-only apply commands from committed outcome history", async () => {
    const history = await committedHistory()

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
      outcomeCommitHistory: history,
      requestedAt,
      requestedBy: actor,
    })

    expect(plan).toMatchObject({
      applyPlanVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION,
      blockedCommandCount: 0,
      blockerLabels: [],
      commandCount: 5,
      committedOutcomeCount: 5,
      historyRecordCount: 1,
      latestCommitPlanId: history.latestRecord?.planId,
      latestCommitRecordId: history.latestRecord?.commitRecordId,
      latestCommittedExecutionFingerprint: history.latestRecord?.committedExecutionFingerprint,
      latestSourceExecutionFingerprint: history.latestRecord?.sourceExecutionFingerprint,
      plannedCommandCount: 5,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(plan.applyPlanId).toBe(`non-cnc-promoted-quote-offer-export-live-adapter-apply-plan-${plan.applyPlanFingerprint}`)
    expect(plan.commands.map((command) => command.key)).toEqual([
      "customer_offer_apply",
      "file_export_apply",
      "release_review_apply",
      "connector_reference_apply",
      "rollback_evidence_apply",
    ])
    expect(plan.commands.every((command) => command.status === "planned")).toBe(true)
    expect(plan.commands.every((command) => command.idempotencyKey?.startsWith("non-cnc-live-adapter-apply:rfq-demo-204:"))).toBe(true)
    expect(plan.commands[0]?.evidenceFingerprints).toContain(history.latestRecord?.commitRecordId)
    expect(plan.commands[0]?.evidenceFingerprints).toContain(history.latestRecord?.committedExecutionFingerprint)
    expect(plan.operatorSummary).toBe(
      "Ready live-adapter apply plan prepares 5 review-only apply commands for rfq-demo-204; live customer-offer, file, release-review, export, and connector writes remain disabled.",
    )
    expect(plan.exportText).toContain("Planned commands: 5")
    expect(plan.exportText).toContain(`Latest committed execution: ${history.latestRecord?.committedExecutionFingerprint}`)
  })

  it("blocks stale or inconsistent committed history summaries", async () => {
    const history = await committedHistory()
    const staleHistory: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary = {
      ...history,
      committedExecutionFingerprints: [],
      commitReadyPlanIds: [],
    }

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
      outcomeCommitHistory: staleHistory,
      requestedAt,
      requestedBy: actor,
    })

    expect(plan).toMatchObject({
      blockedCommandCount: 5,
      committedOutcomeCount: 0,
      plannedCommandCount: 0,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(plan.blockerLabels).toEqual([
      "Outcome commit history summary does not include the latest committed execution evidence.",
      "Outcome commit history summary does not include the latest commit-ready plan.",
    ])
    expect(plan.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(plan.exportText).toContain("Latest committed execution: none")
  })

  it("returns cloned command and warning data", async () => {
    const history = await committedHistory()
    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
      outcomeCommitHistory: history,
      requestedAt,
      requestedBy: actor,
    })
    plan.commands[0]!.blockerLabels.push("mutated blocker")
    plan.commands[0]!.evidenceFingerprints.push("mutated evidence")
    plan.reviewWarnings.push("mutated warning")

    const rebuilt = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
      outcomeCommitHistory: history,
      requestedAt,
      requestedBy: actor,
    })

    expect(rebuilt.commands[0]?.blockerLabels).toEqual([])
    expect(rebuilt.commands[0]?.evidenceFingerprints).not.toContain("mutated evidence")
    expect(rebuilt.reviewWarnings).not.toContain("mutated warning")
    expect(rebuilt.applyPlanFingerprint).toBe(plan.applyPlanFingerprint)
  })
})

async function committedHistory(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary> {
  const plan = await readyPlan()
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
    recordedAt: "2026-08-08T09:18:00.000Z",
    recordedBy: actor,
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(snapshot)
}

async function readyPlan(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan> {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: readyReadiness,
  })
  const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const snapshot = await history.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-08T09:10:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt: "2026-08-08T09:12:00.000Z",
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
  requestedAt: "2026-08-08T09:00:00.000Z",
  requestedBy: actor,
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}
