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
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan,
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft"
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

describe("non-CNC promoted quote offer export live-adapter execution outcome commits", () => {
  it("commits ready reviewed outcome drafts into deterministic execution audit runs", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))

    const result = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft,
      plan,
    })

    expect(result.commitPlan).toMatchObject({
      blockerLabels: [],
      commandOutcomeCount: 5,
      commitVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
      decisionFingerprint: plan.decisionFingerprint,
      executionFingerprint: outcomeDraft.executionFingerprint,
      latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
      latestPackageId: "non-cnc-export-package:rfq-demo-204:ready",
      latestPlanId: "non-cnc-export-plan:rfq-demo-204:ready",
      latestReleaseExecutionFingerprint: "non-cnc-release-execution:rfq-demo-204:ready",
      latestSourceExecutionFingerprint: "non-cnc-export-source:rfq-demo-204:ready",
      nextOperatorMessage: "Commit 5 reviewed non-CNC live-adapter execution outcomes.",
      planFingerprint: plan.planFingerprint,
      planId: plan.planId,
      planVersion: plan.planVersion,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(result.commitPlan.adapterOutcomeBoundary).toContain("deterministic review data only")
    expect(result.commitPlan.commandOutcomes.map((outcome) => outcome.key)).toEqual([
      "customer_offer_write",
      "file_export_write",
      "release_review_write",
      "connector_sync",
      "rollback_diagnostics",
    ])
    expect(result.executionRun).toMatchObject({
      mode: "commit",
      plannedCommandCount: 5,
      status: "succeeded",
      targetRfqId: "rfq-demo-204",
    })
    expect(result.executionRun?.commands.map((command) => command.status)).toEqual([
      "succeeded",
      "succeeded",
      "succeeded",
      "succeeded",
      "succeeded",
    ])
  })

  it("blocks non-ready drafts and withholds command outcomes", async () => {
    const plan = await fallbackPlan()
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt,
      mode: "dry_run",
      plan,
    })
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(run)

    const result = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft,
      plan,
    })

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: expect.arrayContaining([
        "Live-adapter execution outcome draft must be ready before commit.",
        "Live-adapter execution outcome draft entry for Customer-offer export write is not ready for commit.",
        "Missing suggested live-adapter execution outcome for Customer-offer export write.",
      ]),
      commandOutcomeCount: 0,
      commandOutcomes: [],
      latestExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(result.commitPlan.nextOperatorMessage).toContain("Live-adapter execution outcome draft must be ready")
  })

  it("rejects ready drafts that do not match the execution plan identity", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan({
        outcomeDraft: {
          ...outcomeDraft,
          latestPackageId: "non-cnc-export-package:rfq-demo-204:other",
        },
        plan,
      }),
    ).toThrow("live-adapter execution outcome draft does not match execution plan: latestPackageId")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan({
        outcomeDraft: {
          ...outcomeDraft,
          planFingerprint: "different-plan-fingerprint",
        },
        plan,
      }),
    ).toThrow("live-adapter execution outcome draft does not match execution plan: planFingerprint")
  })

  it("blocks reordered command outcomes without passing command outcomes to commit execution", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))
    const reorderedDraft: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft = {
      ...outcomeDraft,
      commandOutcomes: [...outcomeDraft.commandOutcomes].reverse(),
    }

    const result = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft: reorderedDraft,
      plan,
    })

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: ["Live-adapter execution outcome draft command list does not match execution plan commands."],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("blocks forged ready drafts that were not produced from dry-run execution", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))
    const forgedCommitDraft: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft = {
      ...outcomeDraft,
      mode: "commit",
    }

    const result = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft: forgedCommitDraft,
      plan,
    })

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: ["Live-adapter execution outcome commit requires a dry-run outcome draft."],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("blocks non-succeeded suggested outcomes before commit execution", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))
    const failedOutcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0 && command.suggestedOutcome
          ? {
              ...command,
              suggestedOutcome: {
                ...command.suggestedOutcome,
                message: "Provider write failed in fixture review.",
                status: "failed",
              },
            }
          : command,
      ),
    }

    const result = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft: failedOutcomeDraft,
      plan,
    })

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: [
        "Suggested live-adapter execution outcome for Customer-offer export write must have succeeded status.",
      ],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("clones command outcomes so draft mutations cannot alter commit plans", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))

    const commitPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan({
      outcomeDraft,
      plan,
    })
    outcomeDraft.commandOutcomes[0].suggestedOutcome!.externalId = "customer-offer-write:rfq-demo-204:mutated"
    outcomeDraft.commandOutcomes[0].suggestedOutcome!.warnings?.push("mutated warning")

    expect(commitPlan.commandOutcomes[0]).toMatchObject({
      externalId: expect.stringMatching(
        /^customer-offer-write:rfq-demo-204:non-cnc-promoted-quote-offer-export-live-adapter-execution-[a-f0-9]{32}$/,
      ),
      warnings: [],
    })
  })
})

async function readyDryRun(
  plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
) {
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
