import { describe, expect, it } from "vitest"

import {
  decideNonCncPromotedQuoteOfferExportLiveAdapter,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION,
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

describe("non-CNC promoted quote offer export live-adapter execution outcome drafts", () => {
  it("builds deterministic succeeded outcomes for prepared dry-run live-adapter executions", async () => {
    const dryRun = await readyDryRun()

    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(dryRun)
    const suggestedOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
      command.suggestedOutcome ? [command.suggestedOutcome] : [],
    )
    const committedRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      commandOutcomes: suggestedOutcomes,
      executedAt,
      mode: "commit",
      plan: await readyPlan(),
    })

    expect(outcomeDraft).toMatchObject({
      blockedOutcomeCount: 0,
      decisionFingerprint: dryRun.decisionFingerprint,
      draftVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION,
      executionFingerprint: dryRun.executionFingerprint,
      latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
      latestPackageId: "non-cnc-export-package:rfq-demo-204:ready",
      latestPlanId: "non-cnc-export-plan:rfq-demo-204:ready",
      latestReleaseExecutionFingerprint: "non-cnc-release-execution:rfq-demo-204:ready",
      latestSourceExecutionFingerprint: "non-cnc-export-source:rfq-demo-204:ready",
      mode: "dry_run",
      planFingerprint: dryRun.planFingerprint,
      planId: dryRun.planId,
      readyOutcomeCount: 5,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(outcomeDraft.nextOperatorMessage).toBe("Review and commit 5 live-adapter command outcomes.")
    expect(outcomeDraft.adapterOutcomeBoundary).toContain("active customer-offer")
    expect(outcomeDraft.commandOutcomes.map((command) => [command.key, command.status, command.target])).toEqual([
      ["customer_offer_write", "ready", "customer_offer"],
      ["file_export_write", "ready", "file_export"],
      ["release_review_write", "ready", "release_review"],
      ["connector_sync", "ready", "connector"],
      ["rollback_diagnostics", "ready", "diagnostics"],
    ])
    expect(outcomeDraft.commandOutcomes.every((command) => command.evidenceFingerprints.length === 3)).toBe(true)
    expect(suggestedOutcomes).toEqual([
      {
        externalId: `customer-offer-write:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "customer_offer_write",
        message: "Prepared customer-offer write outcome from reviewed non-CNC live-adapter execution evidence.",
        status: "succeeded",
        warnings: [],
      },
      {
        externalId: `file-export-write:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "file_export_write",
        message: "Prepared file export write outcome from reviewed non-CNC live-adapter execution evidence.",
        status: "succeeded",
        warnings: [],
      },
      {
        externalId: `release-review-write:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "release_review_write",
        message: "Prepared release-review write outcome from reviewed non-CNC live-adapter execution evidence.",
        status: "succeeded",
        warnings: [],
      },
      {
        externalId: `connector-sync:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "connector_sync",
        message: "Prepared connector sync outcome from reviewed non-CNC live-adapter execution evidence.",
        status: "succeeded",
        warnings: [],
      },
      {
        externalId: `rollback-diagnostics:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "rollback_diagnostics",
        message: "Prepared rollback diagnostics outcome from reviewed non-CNC live-adapter execution evidence.",
        status: "succeeded",
        warnings: [],
      },
    ])
    expect(committedRun.status).toBe("succeeded")
    expect(committedRun.commands.map((command) => command.status)).toEqual([
      "succeeded",
      "succeeded",
      "succeeded",
      "succeeded",
      "succeeded",
    ])
  })

  it("keeps blocked and withheld live-adapter executions outcome-free", async () => {
    const withheldRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt,
      mode: "dry_run",
      plan: await fallbackPlan(),
    })
    const blockedRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt,
      mode: "commit",
      plan: blockedPlan(),
    })

    const withheldDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(withheldRun)
    const blockedDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(blockedRun)

    expect(withheldDraft.status).toBe("blocked")
    expect(withheldDraft.readyOutcomeCount).toBe(0)
    expect(withheldDraft.blockedOutcomeCount).toBe(5)
    expect(withheldDraft.nextOperatorMessage).toContain("Keep review-only local/mock fallback active")
    expect(withheldDraft.latestExecutionFingerprint).toBeUndefined()
    expect(withheldDraft.targetRfqId).toBeUndefined()
    expect(withheldDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(withheldDraft.commandOutcomes.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(withheldDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)

    expect(blockedDraft.status).toBe("blocked")
    expect(blockedDraft.nextOperatorMessage).toContain("Resolve live-adapter execution blockers")
    expect(blockedDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })

  it("does not draft outcomes from committed live-adapter executions", async () => {
    const committedRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt,
      mode: "commit",
      plan: await readyPlan(),
    })

    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(committedRun)

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.readyOutcomeCount).toBe(0)
    expect(outcomeDraft.nextOperatorMessage).toContain("Live-adapter outcome drafts must be based on a dry-run execution.")
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })

  it.each(["rfq A", "rfq_A", "RFQ-A", "!!!"])(
    "rejects non-canonical target RFQ id part %s instead of drafting colliding external ids",
    async (targetRfqId) => {
      const dryRun = await readyDryRun()
      const malformedRun = {
        ...dryRun,
        targetRfqId,
      }

      expect(() => buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(malformedRun)).toThrow(
        "Non-CNC live-adapter execution outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
      )
    },
  )

  it("rejects non-canonical execution fingerprints before drafting external ids", async () => {
    const dryRun = await readyDryRun()
    const malformedRun: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun = {
      ...dryRun,
      executionFingerprint: "non canonical fingerprint",
    }

    expect(() => buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(malformedRun)).toThrow(
      "Non-CNC live-adapter execution outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
    )
  })
})

async function readyDryRun(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun> {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
    actor,
    executedAt,
    mode: "dry_run",
    plan: await readyPlan(),
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

function blockedPlan(): NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: blockedReadiness,
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
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
