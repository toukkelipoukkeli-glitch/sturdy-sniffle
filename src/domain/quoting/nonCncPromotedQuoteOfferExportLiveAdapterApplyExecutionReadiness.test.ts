import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistory"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"
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
const executedAt = "2026-08-09T13:05:00.000Z"
const requestedAt = "2026-08-09T13:10:00.000Z"

describe("non-CNC live-adapter apply execution readiness", () => {
  it("blocks empty apply execution history before final-gate modeling", () => {
    const history = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence().snapshot(),
    )

    const readiness = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
      history,
      requestedAt,
      requestedBy: actor,
      targetRfqId: "rfq-demo-204",
    })

    expect(readiness).toEqual({
      appliedCommandCount: 0,
      applyExecutionReadinessBoundary:
        "Apply execution readiness is deterministic review data only; this helper does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
      blockerLabels: ["No persisted non-CNC live-adapter apply execution records are available."],
      latestApplyPlanFingerprint: undefined,
      latestApplyPlanId: undefined,
      latestCommitPlanId: undefined,
      latestCommitRecordId: undefined,
      latestCommittedExecutionFingerprint: undefined,
      latestExecutionFingerprint: undefined,
      latestSourceExecutionFingerprint: undefined,
      latestStatus: undefined,
      nextOperatorMessage:
        "Keep live customer-offer, file, release-review, export, and connector writes disabled until apply execution history has ready local evidence.",
      persistedRunCount: 0,
      readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
      requestedAt,
      requestedBy: actor,
      reviewWarnings: [],
      status: "blocked",
      targetRfqId: "rfq-demo-204",
    })
  })

  it("marks a matching succeeded apply execution ready while preserving review warnings", async () => {
    const plan = await readyApplyPlan()
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      commandOutcomes: plan.commands.map((command) => ({
        externalId: `external-${command.key}`,
        key: command.key,
        status: "applied",
      })),
      executedAt,
      mode: "commit",
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence()
    const history = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
      await persistence.recordRun(run),
    )

    const readiness = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
      history,
      requestedAt,
      requestedBy: actor,
      targetRfqId: "rfq-demo-204",
    })

    expect(readiness).toMatchObject({
      appliedCommandCount: 5,
      blockerLabels: [],
      latestApplyPlanFingerprint: plan.applyPlanFingerprint,
      latestApplyPlanId: plan.applyPlanId,
      latestCommitPlanId: plan.latestCommitPlanId,
      latestCommitRecordId: plan.latestCommitRecordId,
      latestCommittedExecutionFingerprint: plan.latestCommittedExecutionFingerprint,
      latestExecutionFingerprint: run.executionFingerprint,
      latestSourceExecutionFingerprint: plan.latestSourceExecutionFingerprint,
      latestStatus: "succeeded",
      nextOperatorMessage: "Live-adapter apply execution history is ready for future final-gate modeling.",
      persistedRunCount: 1,
      readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
      reviewWarnings: ["Latest apply execution record has 1 warning(s)."],
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(readiness.applyExecutionReadinessBoundary).toContain("does not create customer offers")
  })

  it("withholds ready evidence when the latest apply execution target does not match", async () => {
    const plan = await readyApplyPlan()
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      commandOutcomes: plan.commands.map((command) => ({
        externalId: `external-${command.key}`,
        key: command.key,
        status: "applied",
      })),
      executedAt,
      mode: "commit",
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence()
    const history = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
      await persistence.recordRun(run),
    )

    const readiness = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
      history,
      requestedAt,
      requestedBy: actor,
      targetRfqId: "rfq-demo-999",
    })

    expect(readiness).toMatchObject({
      appliedCommandCount: 0,
      blockerLabels: ["Latest apply execution target RFQ does not match active RFQ: rfq-demo-204."],
      latestApplyPlanId: undefined,
      latestCommitRecordId: undefined,
      latestCommittedExecutionFingerprint: undefined,
      latestExecutionFingerprint: undefined,
      persistedRunCount: 1,
      status: "blocked",
      targetRfqId: "rfq-demo-999",
    })
  })

  it("blocks dry-run or partial latest apply executions before exposing final readiness", async () => {
    const plan = await readyApplyPlan()
    const dryRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      executedAt,
      mode: "dry_run",
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence()
    const history = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
      await persistence.recordRun(dryRun),
    )

    const readiness = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
      history,
      requestedAt,
      requestedBy: actor,
      targetRfqId: "rfq-demo-204",
    })

    expect(readiness).toMatchObject({
      appliedCommandCount: 0,
      blockerLabels: [
        "Latest apply execution history status is prepared.",
        "Latest apply execution status is prepared.",
        "Latest apply execution mode is dry_run.",
        "Latest apply execution record must have all commands applied.",
      ],
      latestExecutionFingerprint: undefined,
      latestStatus: "prepared",
      status: "blocked",
    })
  })

  it("normalizes request metadata and rejects malformed boundaries", () => {
    const history = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence().snapshot(),
    )

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
        history,
        requestedAt: "not-a-date",
        requestedBy: actor,
        targetRfqId: "rfq-demo-204",
      }),
    ).toThrow("requestedAt must be a valid ISO timestamp")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
        history,
        requestedAt,
        requestedBy: " ",
        targetRfqId: "rfq-demo-204",
      }),
    ).toThrow("requestedBy is required")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
        history,
        requestedAt,
        requestedBy: actor,
        targetRfqId: " ",
      }),
    ).toThrow("targetRfqId is required")
  })
})

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
    recordedAt: "2026-08-09T12:58:00.000Z",
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
    recordedAt: "2026-08-09T12:50:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt: "2026-08-09T12:55:00.000Z",
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
  requestedAt: "2026-08-09T12:45:00.000Z",
  requestedBy: actor,
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}
