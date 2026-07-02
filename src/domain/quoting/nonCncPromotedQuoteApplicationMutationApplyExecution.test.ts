import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteApplicationMutationApplyPlan } from "./nonCncPromotedQuoteApplicationMutationApplyPlan"
import {
  buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun,
  fingerprintNonCncPromotedQuoteApplicationMutationApplyExecutionRun,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteApplicationMutationApplyExecution"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation apply execution", () => {
  it("builds prepared dry-run audit records from ready apply plans", () => {
    const applyPlan = buildReadyApplyPlan()

    const run = buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
      actor: "FactoryBid Operator",
      applyPlan,
      executedAt: "2026-07-02T13:30:00.000Z",
      mode: "dry_run",
    })

    expect(run).toMatchObject({
      actor: "FactoryBid Operator",
      applicationId: applyPlan.applicationId,
      applyPlanId: applyPlan.applyPlanId,
      executedAt: "2026-07-02T13:30:00.000Z",
      executionVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION,
      mode: "dry_run",
      mutationBoundary:
        "Application mutation apply execution runs are deterministic audit records only; this adapter does not mutate active RFQ quote, offer, or release state.",
      nextActions: ["Review 3 prepared non-CNC application mutation apply commands before committing."],
      sourceExecutionFingerprint: applyPlan.sourceExecutionFingerprint,
      status: "prepared",
      targetRfqId: applyPlan.targetRfqId,
    })
    expect(run.executionFingerprint).toBe(fingerprintNonCncPromotedQuoteApplicationMutationApplyExecutionRun(run))
    expect(run.executionFingerprint).toMatch(/^non-cnc-promoted-quote-application-mutation-apply-execution-[0-9a-f]{16}$/)
    expect(run.commands.map((command) => command.status)).toEqual(["prepared", "prepared", "prepared"])
    expect(run.commands[0]).toMatchObject({
      applicationTargetId: applyPlan.commands[0]?.applicationTargetId,
      externalId: undefined,
      key: "apply_active_rfq_quote",
      mutationTarget: "active_rfq_quote",
      sourceExecutionFingerprint: applyPlan.commands[0]?.sourceExecutionFingerprint,
    })
    expect(run.warnings).toContain("Material certificate required.")
    expect(run.warnings).toContain("Apply active RFQ quote: Material certificate required.")
  })

  it("builds pending commit audit records until apply outcomes are recorded", () => {
    const applyPlan = buildReadyApplyPlan()

    const run = buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
      actor: "FactoryBid Operator",
      applyPlan,
      executedAt: "2026-07-02T13:35:00.000Z",
      mode: "commit",
    })

    expect(run.status).toBe("pending")
    expect(run.nextActions).toEqual(["Record apply outcomes for 3 non-CNC application mutation commands."])
    expect(run.commands.map((command) => command.status)).toEqual(["pending", "pending", "pending"])
    expect(run.commands.every((command) => command.externalId === undefined)).toBe(true)
  })

  it("records applied and failed command outcomes with deterministic partial status", () => {
    const applyPlan = buildReadyApplyPlan()

    const run = buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
      actor: "FactoryBid Operator",
      applyPlan,
      commandOutcomes: [
        {
          externalId: "quote:rfq-demo-204:active",
          key: "apply_active_rfq_quote",
          message: "Active RFQ quote updated.",
          mutationTarget: "active_rfq_quote",
          status: "applied",
        },
        {
          key: "apply_offer_workspace",
          message: "Offer workspace adapter unavailable.",
          mutationTarget: "offer_workspace",
          status: "failed",
          warnings: [" Offer workspace fallback used. ", "Offer workspace fallback used.", ""],
        },
      ],
      executedAt: "2026-07-02T13:40:00.000Z",
      mode: "commit",
    })

    expect(run.status).toBe("partial")
    expect(run.commands.map((command) => command.status)).toEqual(["applied", "failed", "pending"])
    expect(run.commands[0]).toMatchObject({
      externalId: "quote:rfq-demo-204:active",
      message: "Active RFQ quote updated.",
    })
    expect(run.commands[1]).toMatchObject({
      externalId: undefined,
      message: "Offer workspace adapter unavailable.",
      warnings: ["Offer workspace fallback used."],
    })
    expect(run.nextActions).toEqual([
      "Resolve failed non-CNC application mutation apply command: Apply offer workspace.",
      "Record apply outcome for non-CNC application mutation command: Apply release state.",
    ])
    expect(run.warnings).toContain("Apply offer workspace: Offer workspace fallback used.")
    expect(run.warnings).toContain("Apply offer workspace failed: Offer workspace adapter unavailable.")
  })

  it("rejects unsupported execution modes at the runtime boundary", () => {
    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
        actor: "FactoryBid Operator",
        applyPlan: buildReadyApplyPlan(),
        executedAt: "2026-07-02T13:55:00.000Z",
        mode: "preview" as never,
      }),
    ).toThrow("mode must be commit or dry_run")
  })

  it("builds succeeded commit audit records when every command is applied", () => {
    const applyPlan = buildReadyApplyPlan()

    const run = buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
      actor: "FactoryBid Operator",
      applyPlan,
      commandOutcomes: applyPlan.commands.map((command) => ({
        externalId: command.applicationTargetId,
        key: command.key,
        message: `${command.label} applied.`,
        mutationTarget: command.mutationTarget,
        status: "applied" as const,
      })),
      executedAt: "2026-07-02T13:45:00.000Z",
      mode: "commit",
    })

    expect(run.status).toBe("succeeded")
    expect(run.nextActions).toEqual(["Non-CNC application mutation apply execution completed."])
    expect(run.commands.every((command) => command.status === "applied")).toBe(true)
  })

  it("keeps blocked apply plans review-only and drops ready-only identifiers", () => {
    const applyPlan = buildNonCncPromotedQuoteApplicationMutationApplyPlan({
      ...readyReadModel(),
      blockerLabels: ["Mutation commit must be reviewed."],
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      mutationTargets: [],
      status: "blocked",
    })

    const run = buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
      actor: "FactoryBid Operator",
      applyPlan,
      executedAt: "2026-07-02T13:50:00.000Z",
      mode: "dry_run",
    })

    expect(run).toMatchObject({
      sourceExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(run.commands).toHaveLength(3)
    expect(run.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(run.commands.every((command) => command.applicationTargetId === undefined)).toBe(true)
    expect(run.nextActions).toContain("Application mutation outcome commit read model is not ready to apply.")
    expect(run.nextActions).toContain("Apply active RFQ quote: Mutation commit must be reviewed.")
  })

  it("rejects outcomes that cannot belong to a commit-ready apply command", () => {
    const applyPlan = buildReadyApplyPlan()
    const blockedApplyPlan = buildNonCncPromotedQuoteApplicationMutationApplyPlan({
      ...readyReadModel(),
      blockerLabels: ["Mutation commit must be reviewed."],
      status: "blocked",
    })

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
        actor: "FactoryBid Operator",
        applyPlan,
        commandOutcomes: [{ key: "apply_active_rfq_quote", mutationTarget: "active_rfq_quote", status: "applied" }],
        executedAt: "2026-07-02T13:55:00.000Z",
        mode: "dry_run",
      }),
    ).toThrow("cannot be recorded for a dry-run non-CNC application mutation apply execution")

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
        actor: "FactoryBid Operator",
        applyPlan,
        commandOutcomes: [{ key: "apply_active_rfq_quote", mutationTarget: "release_state", status: "applied" }],
        executedAt: "2026-07-02T13:55:00.000Z",
        mode: "commit",
      }),
    ).toThrow("does not match a non-CNC application mutation apply command")

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
        actor: "FactoryBid Operator",
        applyPlan,
        commandOutcomes: [
          { key: "apply_active_rfq_quote", mutationTarget: "active_rfq_quote", status: "applied" },
          { key: "apply_active_rfq_quote", mutationTarget: "active_rfq_quote", status: "applied" },
        ],
        executedAt: "2026-07-02T13:55:00.000Z",
        mode: "commit",
      }),
    ).toThrow("duplicate command outcome apply_active_rfq_quote:active_rfq_quote")

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun({
        actor: "FactoryBid Operator",
        applyPlan: blockedApplyPlan,
        commandOutcomes: [{ key: "apply_active_rfq_quote", mutationTarget: "active_rfq_quote", status: "applied" }],
        executedAt: "2026-07-02T13:55:00.000Z",
        mode: "commit",
      }),
    ).toThrow("cannot be recorded for a blocked non-CNC application mutation apply command")
  })
})

function buildReadyApplyPlan() {
  return buildNonCncPromotedQuoteApplicationMutationApplyPlan(readyReadModel())
}

function readyReadModel(): NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel {
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId:
      "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    blockerLabels: [],
    committedOutcomeCount: 3,
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
    executionStatus: "succeeded",
    mutationBoundary:
      "Application mutation outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
    mutationPackageId: "non-cnc-promoted-quote-application-mutation-package:rfq-demo-204:ready",
    mutationTargets: ["active_rfq_quote", "offer_workspace", "release_state"],
    nextOperatorMessage:
      "Promoted non-CNC application mutation outcome commit is ready for a future active RFQ, offer, and release mutation adapter.",
    packageId: "package-ready",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: ["Material certificate required."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    sourceExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-dry-run-ready",
    status: "ready_to_apply",
    targetRfqId: "rfq-demo-204",
  }
}
