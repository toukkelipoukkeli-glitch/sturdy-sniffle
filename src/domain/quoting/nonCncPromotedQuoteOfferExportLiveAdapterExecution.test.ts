import { describe, expect, it } from "vitest"

import {
  decideNonCncPromotedQuoteOfferExportLiveAdapter,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
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

describe("non-CNC promoted quote offer export live-adapter execution audits", () => {
  it("records prepared commands for a ready dry-run without executing live writes", async () => {
    const plan = await readyPlan()

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt: "2026-08-04T20:20:00+03:00",
      mode: "dry_run",
      plan,
    })

    expect(run).toMatchObject({
      actor,
      blockedCommandCount: 0,
      commandCount: 5,
      decisionFingerprint: plan.decisionFingerprint,
      executedAt,
      executionVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_VERSION,
      latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
      mode: "dry_run",
      plannedCommandCount: 5,
      planFingerprint: plan.planFingerprint,
      planId: plan.planId,
      status: "prepared",
      targetRfqId: "rfq-demo-204",
      withheldCommandCount: 0,
    })
    expect(run.executionFingerprint).toMatch(
      /^non-cnc-promoted-quote-offer-export-live-adapter-execution-[a-f0-9]{32}$/,
    )
    expect(run.commands.map((command) => [command.key, command.status, command.target])).toEqual([
      ["customer_offer_write", "prepared", "customer_offer"],
      ["file_export_write", "prepared", "file_export"],
      ["release_review_write", "prepared", "release_review"],
      ["connector_sync", "prepared", "connector"],
      ["rollback_diagnostics", "prepared", "diagnostics"],
    ])
    expect(run.commands.every((command) => command.idempotencyKey?.startsWith("non-cnc-live-adapter:"))).toBe(true)
    expect(run.commands[0].evidenceFingerprints).toEqual([
      "non-cnc-export-provider-commit:rfq-demo-204:ready",
      "non-cnc-export-source:rfq-demo-204:ready",
      "non-cnc-release-execution:rfq-demo-204:ready",
    ])
    expect(run.nextActions).toEqual(["Review 5 prepared live-adapter commands before committing."])
    expect(run.adapterExecutionBoundary).toContain("does not create customer offers")
  })

  it("commits successful live-adapter command outcomes into a deterministic audit record", async () => {
    const plan = await readyPlan()

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      commandOutcomes: plan.commands.map((command) => ({
        externalId: ` live-${command.key} `,
        key: command.key,
        message: ` ${command.label} complete `,
        status: "succeeded",
        warnings: command.key === "rollback_diagnostics" ? [" retained local fallback evidence ", " "] : [],
      })),
      executedAt,
      mode: "commit",
      plan,
    })

    expect(run).toMatchObject({
      blockedCommandCount: 0,
      latestPackageId: "non-cnc-export-package:rfq-demo-204:ready",
      mode: "commit",
      plannedCommandCount: 5,
      status: "succeeded",
      targetRfqId: "rfq-demo-204",
      warnings: ["Latest provider commit record has 1 warning(s).", "Fallback rollback diagnostics: retained local fallback evidence"],
    })
    expect(run.commands[0]).toMatchObject({
      externalId: "live-customer_offer_write",
      message: "Customer-offer export write complete",
      status: "succeeded",
    })
    expect(run.nextActions).toEqual([
      "Review the recorded live-adapter execution audit before wiring live customer-offer export state.",
    ])
  })

  it("summarizes pending failed and partial commit outcomes by command", async () => {
    const plan = await readyPlan()

    const pendingRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt,
      mode: "commit",
      plan,
    })

    expect(pendingRun.status).toBe("pending")
    expect(pendingRun.commands.every((command) => command.status === "pending")).toBe(true)
    expect(pendingRun.nextActions).toEqual(["Record live-adapter outcomes for 5 commands."])

    const failedRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      commandOutcomes: plan.commands.map((command) => ({
        key: command.key,
        message: `${command.label} adapter failed`,
        status: "failed",
      })),
      executedAt,
      mode: "commit",
      plan,
    })

    expect(failedRun.status).toBe("failed")
    expect(failedRun.commands.every((command) => command.status === "failed")).toBe(true)
    expect(failedRun.nextActions).toEqual([
      "Resolve failed live-adapter command: Customer-offer export write.",
      "Resolve failed live-adapter command: Customer offer file exports.",
      "Resolve failed live-adapter command: Release-review packet write.",
      "Resolve failed live-adapter command: Connector reference sync.",
      "Resolve failed live-adapter command: Fallback rollback diagnostics.",
    ])
    expect(failedRun.warnings).toEqual([
      "Latest provider commit record has 1 warning(s).",
      "Customer-offer export write failed: Customer-offer export write adapter failed",
      "Customer offer file exports failed: Customer offer file exports adapter failed",
      "Release-review packet write failed: Release-review packet write adapter failed",
      "Connector reference sync failed: Connector reference sync adapter failed",
      "Fallback rollback diagnostics failed: Fallback rollback diagnostics adapter failed",
    ])

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      commandOutcomes: [
        {
          key: "customer_offer_write",
          message: "Customer offer write succeeded",
          status: "succeeded",
        },
        {
          key: "file_export_write",
          message: "PDF adapter timed out",
          status: "failed",
        },
      ],
      executedAt,
      mode: "commit",
      plan,
    })

    expect(run.status).toBe("partial")
    expect(run.commands.map((command) => [command.key, command.status])).toEqual([
      ["customer_offer_write", "succeeded"],
      ["file_export_write", "failed"],
      ["release_review_write", "pending"],
      ["connector_sync", "pending"],
      ["rollback_diagnostics", "pending"],
    ])
    expect(run.nextActions).toEqual([
      "Resolve failed live-adapter command: Customer offer file exports.",
      "Record live-adapter outcome for command: Release-review packet write.",
      "Record live-adapter outcome for command: Connector reference sync.",
      "Record live-adapter outcome for command: Fallback rollback diagnostics.",
    ])
    expect(run.warnings).toContain("Customer offer file exports failed: PDF adapter timed out")
  })

  it("withholds fallback plans and rejects outcomes for withheld commands", async () => {
    const plan = await fallbackPlan()

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt,
      mode: "dry_run",
      plan,
    })

    expect(run).toMatchObject({
      latestExecutionFingerprint: undefined,
      plannedCommandCount: 0,
      status: "withheld",
      targetRfqId: undefined,
      withheldCommandCount: 5,
    })
    expect(run.commands.every((command) => command.status === "withheld")).toBe(true)
    expect(run.commands.every((command) => command.idempotencyKey === undefined)).toBe(true)
    expect(run.nextActions).toContain(
      "Keep review-only local/mock fallback active until provider-write opt-in is explicitly enabled.",
    )
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor,
        commandOutcomes: [{ key: "customer_offer_write", status: "succeeded" }],
        executedAt,
        mode: "commit",
        plan,
      }),
    ).toThrow("command outcome customer_offer_write cannot be recorded for a withheld live-adapter execution command")
  })

  it("blocks blocked plans and rejects outcomes for blocked commands", () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: blockedReadiness,
    })
    const plan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
      decision,
      requestedAt,
      requestedBy: actor,
    })

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt,
      mode: "commit",
      plan,
    })

    expect(run).toMatchObject({
      blockedCommandCount: 5,
      latestPackageId: undefined,
      plannedCommandCount: 0,
      status: "blocked",
      targetRfqId: undefined,
      withheldCommandCount: 0,
    })
    expect(run.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(run.nextActions).toContain("Resolve live-adapter execution blockers before recording outcomes.")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor,
        commandOutcomes: [{ key: "customer_offer_write", status: "succeeded" }],
        executedAt,
        mode: "commit",
        plan,
      }),
    ).toThrow("command outcome customer_offer_write cannot be recorded for a blocked live-adapter execution command")
  })

  it("rejects invalid command outcomes before recording execution audits", async () => {
    const plan = await readyPlan()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor,
        commandOutcomes: [{ key: "missing_command", status: "succeeded" }],
        executedAt,
        mode: "commit",
        plan,
      }),
    ).toThrow("command outcome missing_command does not match a live-adapter execution command")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor,
        commandOutcomes: [
          { key: "customer_offer_write", status: "succeeded" },
          { key: "customer_offer_write", status: "failed" },
        ],
        executedAt,
        mode: "commit",
        plan,
      }),
    ).toThrow("duplicate command outcome customer_offer_write")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor,
        commandOutcomes: [{ key: "customer_offer_write", status: "succeeded" }],
        executedAt,
        mode: "dry_run",
        plan,
      }),
    ).toThrow("command outcome customer_offer_write cannot be recorded for a dry-run live-adapter execution")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor,
        commandOutcomes: [{ key: "customer_offer_write", status: "skipped" as "succeeded" }],
        executedAt,
        mode: "commit",
        plan,
      }),
    ).toThrow("command outcome customer_offer_write status must be failed or succeeded")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor: " ",
        executedAt,
        mode: "commit",
        plan,
      }),
    ).toThrow("actor is required")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor,
        executedAt: "not-a-date",
        mode: "commit",
        plan,
      }),
    ).toThrow("executedAt must be a valid ISO timestamp")
  })
})

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
