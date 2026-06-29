import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteApplicationMutationExecutionRun,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteApplicationMutationExecution"
import {
  buildNonCncPromotedQuoteApplicationMutationPackage,
  type NonCncPromotedQuoteApplicationMutationPackage,
} from "./nonCncPromotedQuoteApplicationMutationPackage"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation execution", () => {
  it("prepares deterministic dry-run audit rows for ready mutation packages", () => {
    const mutationPackage = buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel())
    const run = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:00:00.000Z",
      mode: "dry_run",
      mutationPackage,
    })
    const repeatedRun = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:00:00.000Z",
      mode: "dry_run",
      mutationPackage,
    })

    expect(run.executionVersion).toBe(NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION)
    expect(run.executionFingerprint).toMatch(/^non-cnc-promoted-quote-application-mutation-execution-/)
    expect(repeatedRun).toEqual(run)
    expect(run.status).toBe("prepared")
    expect(run.nextActions).toEqual(["Review 3 prepared non-CNC application mutation commands before committing."])
    expect(run.warnings).toEqual([
      "Material certificate required.",
      "Apply active RFQ quote: Material certificate required.",
      "Refresh offer workspace: Material certificate required.",
      "Refresh release state: Material certificate required.",
    ])
    expect(run.commands.map((command) => [command.key, command.mutationTarget, command.status])).toEqual([
      ["replace_active_quote", "active_rfq_quote", "prepared"],
      ["refresh_offer_workspace", "offer_workspace", "prepared"],
      ["open_offer_builder", "release_state", "prepared"],
    ])
    expect(run.commands.every((command) => command.externalId === undefined && command.message === undefined)).toBe(true)
    expect(run.commands.every((command) => command.targetRfqId === "rfq-demo-204")).toBe(true)
  })

  it("records committed successes and failures without changing package descriptors", () => {
    const mutationPackage = buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel())
    const run = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      commandOutcomes: [
        { externalId: "quote:rfq-demo-204:promoted", key: "replace_active_quote", status: "applied" },
        {
          key: "refresh_offer_workspace",
          message: "Offer workspace rejected stale terms.",
          status: "failed",
          warnings: ["Terms need review."],
        },
      ],
      executedAt: "2026-06-29T12:05:00.000Z",
      mode: "commit",
      mutationPackage,
    })

    expect(run.status).toBe("partial")
    expect(run.commands.map((command) => command.status)).toEqual(["applied", "failed", "pending"])
    expect(run.warnings).toContain("Material certificate required.")
    expect(run.warnings).toContain("Apply active RFQ quote: Material certificate required.")
    expect(run.warnings).toContain("Refresh offer workspace: Terms need review.")
    expect(run.warnings).toContain("Refresh offer workspace failed: Offer workspace rejected stale terms.")
    expect(mutationPackage.commands.map((command) => command.status)).toEqual(["ready", "ready", "ready"])
  })

  it("blocks review-only packages and drops impossible outcome side effects", () => {
    const mutationPackage = buildNonCncPromotedQuoteApplicationMutationPackage({
      ...readyReadModel(),
      blockerLabels: ["Application outcome commit read model is not ready to apply."],
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      mutationTargets: [],
      status: "blocked",
    })
    const run = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:10:00.000Z",
      mode: "commit",
      mutationPackage,
    })

    expect(run.status).toBe("blocked")
    expect(run.nextActions).toEqual([
      "Application outcome commit read model is not ready to apply.",
      "Application outcome commit execution fingerprint is missing.",
      "Application outcome commit has no committed outcomes.",
      "Application outcome commit has no mutation targets.",
      "Apply active RFQ quote: Application outcome commit read model is not ready to apply.",
      "Apply active RFQ quote: Application outcome commit execution fingerprint is missing.",
      "Apply active RFQ quote: Application outcome commit has no committed outcomes.",
      "Apply active RFQ quote: Application outcome commit has no mutation targets.",
      "Refresh offer workspace: Application outcome commit read model is not ready to apply.",
      "Refresh offer workspace: Application outcome commit execution fingerprint is missing.",
      "Refresh offer workspace: Application outcome commit has no committed outcomes.",
      "Refresh offer workspace: Application outcome commit has no mutation targets.",
      "Refresh release state: Application outcome commit read model is not ready to apply.",
      "Refresh release state: Application outcome commit execution fingerprint is missing.",
      "Refresh release state: Application outcome commit has no committed outcomes.",
      "Refresh release state: Application outcome commit has no mutation targets.",
    ])
    expect(run.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(run.commands.every((command) => command.externalId === undefined && command.message === undefined)).toBe(true)
    expect(run.commands.every((command) => command.sourceExecutionFingerprint === undefined)).toBe(true)
  })

  it("rejects dry-run, duplicate, unknown, and blocked command outcomes", () => {
    const mutationPackage = buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel())
    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationExecutionRun({
        actor: "FactoryBid Operator",
        commandOutcomes: [{ key: "replace_active_quote", status: "applied" }],
        executedAt: "2026-06-29T12:15:00.000Z",
        mode: "dry_run",
        mutationPackage,
      }),
    ).toThrow("command outcome replace_active_quote cannot be recorded for a dry-run non-CNC application mutation execution")

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationExecutionRun({
        actor: "FactoryBid Operator",
        commandOutcomes: [
          { key: "replace_active_quote", status: "applied" },
          { key: "replace_active_quote", status: "failed" },
        ],
        executedAt: "2026-06-29T12:15:00.000Z",
        mode: "commit",
        mutationPackage,
      }),
    ).toThrow("duplicate command outcome replace_active_quote")

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationExecutionRun({
        actor: "FactoryBid Operator",
        commandOutcomes: [{ key: "unknown", status: "applied" }],
        executedAt: "2026-06-29T12:15:00.000Z",
        mode: "commit",
        mutationPackage,
      }),
    ).toThrow("command outcome unknown does not match a non-CNC application mutation command")

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationExecutionRun({
        actor: "FactoryBid Operator",
        commandOutcomes: [{ key: "replace_active_quote", status: "applied" }],
        executedAt: "2026-06-29T12:15:00.000Z",
        mode: "commit",
        mutationPackage: blockedPackage(),
      }),
    ).toThrow("command outcome replace_active_quote cannot be recorded for a blocked non-CNC application mutation command")
  })
})

function blockedPackage(): NonCncPromotedQuoteApplicationMutationPackage {
  return buildNonCncPromotedQuoteApplicationMutationPackage({
    ...readyReadModel(),
    blockerLabels: ["Application outcome commit read model is not ready to apply."],
    executionFingerprint: undefined,
    mutationTargets: [],
    status: "blocked",
  })
}

function readyReadModel(): NonCncPromotedQuoteApplicationOutcomeCommitReadModel {
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId:
      "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    blockerLabels: [],
    committedOutcomeCount: 3,
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
    mutationBoundary:
      "Application outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later mutation adapter applies them.",
    mutationTargets: ["active_rfq_quote", "offer_workspace", "release_state"],
    nextOperatorMessage: "Promoted non-CNC application outcome commit is ready for a future active RFQ, offer, and release mutation adapter.",
    packageId: "package-ready",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: ["Material certificate required."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    status: "ready_to_apply",
    targetRfqId: "rfq-demo-204",
  }
}
