import { describe, expect, it } from "vitest"

import {
  decideNonCncPromotedQuoteOfferExportLiveAdapter,
  type NonCncPromotedQuoteOfferExportLiveAdapterDecision,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PLAN_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"
const requestedAt = "2026-08-04T06:45:00.000Z"

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

describe("non-CNC promoted quote offer export live-adapter execution plan", () => {
  it("plans idempotent live-adapter commands from a recorded ready decision without executing writes", async () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: readyReadiness,
    })
    const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    const snapshot = await history.recordDecision(decision, {
      actor,
      recordedAt: "2026-08-04T06:40:00.000Z",
    })

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision,
      decisionHistory: snapshot,
      requestedAt,
      requestedBy: actor,
    })

    expect(plan).toMatchObject({
      adapterAction: "enable_live_adapter",
      blockedCommandCount: 0,
      blockerLabels: [],
      canUseLiveAdapter: true,
      commandCount: 5,
      decisionStatus: "ready",
      enabled: true,
      historyRecordCount: 1,
      latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
      latestHistoryDecisionFingerprint: snapshot.latestDecision?.decisionFingerprint,
      mode: "live_adapter",
      planVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PLAN_VERSION,
      plannedCommandCount: 5,
      status: "ready",
      targetRfqId: "rfq-demo-204",
      withheldCommandCount: 0,
    })
    expect(plan.planId).toMatch(/^non-cnc-promoted-quote-offer-export-live-adapter-execution-plan-[a-f0-9]{32}$/)
    expect(plan.decisionFingerprint).toBe(snapshot.latestDecision?.decisionFingerprint)
    expect(plan.commands.map((command) => [command.key, command.status, command.target])).toEqual([
      ["customer_offer_write", "planned", "customer_offer"],
      ["file_export_write", "planned", "file_export"],
      ["release_review_write", "planned", "release_review"],
      ["connector_sync", "planned", "connector"],
      ["rollback_diagnostics", "planned", "diagnostics"],
    ])
    expect(plan.commands[0]).toMatchObject({
      blockerLabels: [],
      evidenceFingerprints: [
        "non-cnc-export-provider-commit:rfq-demo-204:ready",
        "non-cnc-export-source:rfq-demo-204:ready",
        "non-cnc-release-execution:rfq-demo-204:ready",
      ],
      idempotencyKey: expect.stringMatching(
        /^non-cnc-live-adapter:rfq-demo-204:customer_offer_write:[a-f0-9]{16}$/,
      ),
    })
    expect(plan.operatorSummary).toBe(
      "Ready live-adapter execution plan schedules 5 idempotent provider-write commands for rfq-demo-204; execution still requires a separate live adapter to consume this plan.",
    )
    expect(plan.adapterExecutionBoundary).toContain("does not create customer offers")
    expect(plan.exportText).toContain("Status: ready")
    expect(plan.exportText).toContain("customer_offer_write | planned | customer_offer")
  })

  it("withholds execution commands when readiness is ready but provider-write opt-in is disabled", async () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      readiness: readyReadiness,
    })
    const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    const snapshot = await history.recordDecision(decision, {
      actor,
      recordedAt: "2026-08-04T06:40:00.000Z",
    })

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision,
      decisionHistory: snapshot,
      requestedAt,
      requestedBy: actor,
    })

    expect(plan).toMatchObject({
      blockedCommandCount: 0,
      blockerLabels: ["VITE_FACTORYBID_ENABLE_NON_CNC_EXPORT_PROVIDER_WRITES disabled"],
      decisionStatus: "fallback",
      mode: "review_only",
      plannedCommandCount: 0,
      status: "fallback",
      withheldCommandCount: 5,
    })
    expect(plan.commands.every((command) => command.status === "withheld")).toBe(true)
    expect(plan.commands.every((command) => command.idempotencyKey === undefined)).toBe(true)
    expect(plan.latestExecutionFingerprint).toBe("non-cnc-export-provider-commit:rfq-demo-204:ready")
    expect(plan.nextActionLabels).toContain("Do not run live customer-offer export adapters from this plan.")
    expect(plan.exportText).toContain("Withheld commands: 5")
  })

  it("blocks execution plans when final readiness is blocked and withholds live evidence", () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: blockedReadiness,
    })

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision,
      requestedAt,
      requestedBy: actor,
    })

    expect(plan).toMatchObject({
      blockedCommandCount: 5,
      blockerLabels: ["No persisted non-CNC offer export provider commit records are available."],
      decisionStatus: "blocked",
      historyRecordCount: 0,
      latestExecutionFingerprint: undefined,
      latestPackageId: undefined,
      latestReleaseExecutionFingerprint: undefined,
      plannedCommandCount: 0,
      status: "blocked",
      withheldCommandCount: 0,
    })
    expect(plan.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(plan.commands.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(plan.operatorSummary).toBe(
      "Live-adapter execution plan is blocked for rfq-demo-204 by 1 blocker; live customer-offer export writes remain disabled.",
    )
  })

  it("requires the latest decision-history record to match a ready execution decision", async () => {
    const readyDecision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: readyReadiness,
    })
    const fallbackDecision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      readiness: readyReadiness,
    })
    const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    await history.recordDecision(readyDecision, {
      actor,
      recordedAt: "2026-08-04T06:39:00.000Z",
    })
    const fallbackSnapshot = await history.recordDecision(fallbackDecision, {
      actor,
      recordedAt: "2026-08-04T06:40:00.000Z",
    })

    const missingHistoryPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision: readyDecision,
      requestedAt,
      requestedBy: actor,
    })
    const mismatchedHistoryPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision: readyDecision,
      decisionHistory: fallbackSnapshot,
      requestedAt,
      requestedBy: actor,
    })

    expect(missingHistoryPlan).toMatchObject({
      blockedCommandCount: 5,
      blockerLabels: ["No recorded live-adapter decision history is available for execution planning."],
      decisionStatus: "ready",
      status: "blocked",
    })
    expect(mismatchedHistoryPlan).toMatchObject({
      blockedCommandCount: 5,
      blockerLabels: ["Latest live-adapter decision history does not match the requested execution decision."],
      latestHistoryDecisionFingerprint: fallbackSnapshot.latestDecision?.decisionFingerprint,
      status: "blocked",
    })
  })

  it("blocks ready decisions whose execution evidence is whitespace-only even when history matches", async () => {
    const readyDecision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: readyReadiness,
    })
    const whitespaceDecision = {
      ...readyDecision,
      latestExecutionFingerprint: " ",
      latestPackageId: " ",
      latestPlanId: " ",
      latestReleaseExecutionFingerprint: " ",
      latestSourceExecutionFingerprint: " ",
    } satisfies NonCncPromotedQuoteOfferExportLiveAdapterDecision
    const initialPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision: whitespaceDecision,
      requestedAt,
      requestedBy: actor,
    })
    const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    const readySnapshot = await history.recordDecision(readyDecision, {
      actor,
      recordedAt: "2026-08-04T06:40:00.000Z",
    })
    const matchingWhitespaceSnapshot = {
      ...readySnapshot,
      decisionFingerprints: [initialPlan.decisionFingerprint],
      latestDecision: {
        ...readySnapshot.latestDecision!,
        decisionFingerprint: initialPlan.decisionFingerprint,
      },
      records: [
        {
          ...readySnapshot.records[0]!,
          decisionFingerprint: initialPlan.decisionFingerprint,
        },
      ],
    }

    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision: whitespaceDecision,
      decisionHistory: matchingWhitespaceSnapshot,
      requestedAt,
      requestedBy: actor,
    })

    expect(plan).toMatchObject({
      blockedCommandCount: 5,
      plannedCommandCount: 0,
      status: "blocked",
    })
    expect(plan.blockerLabels).toEqual([
      "Ready live-adapter execution requires provider commit evidence.",
      "Ready live-adapter execution requires provider export plan evidence.",
      "Ready live-adapter execution requires package evidence.",
      "Ready live-adapter execution requires release execution evidence.",
      "Ready live-adapter execution requires source execution evidence.",
    ])
    expect(plan.commands.every((command) => command.status === "blocked")).toBe(true)
  })

  it("normalizes request metadata and returns clone-safe command collections", async () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: readyReadiness,
    })
    const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
    const snapshot = await history.recordDecision(decision, {
      actor,
      recordedAt: "2026-08-04T06:40:00.000Z",
    })
    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision,
      decisionHistory: snapshot,
      requestedAt: "2026-08-04T09:45:00+03:00",
      requestedBy: actor,
    })

    plan.commands[0].blockerLabels.push("mutated")
    plan.commands[0].evidenceFingerprints.push("mutated")

    const restored = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision,
      decisionHistory: snapshot,
      requestedAt: "2026-08-04T09:45:00+03:00",
      requestedBy: actor,
    })
    expect(restored.requestedAt).toBe(requestedAt)
    expect(restored.commands[0].blockerLabels).toEqual([])
    expect(restored.commands[0].evidenceFingerprints).not.toContain("mutated")

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
        decision,
        decisionHistory: snapshot,
        requestedAt: "not-a-date",
        requestedBy: actor,
      }),
    ).toThrow("requestedAt must be a valid ISO timestamp")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
        decision,
        decisionHistory: snapshot,
        requestedAt,
        requestedBy: " ",
      }),
    ).toThrow("requestedBy is required")
  })
})
