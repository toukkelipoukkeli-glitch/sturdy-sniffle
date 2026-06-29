import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteApplicationMutationExecutionRun,
  type NonCncPromotedQuoteApplicationMutationExecutionRun,
} from "./nonCncPromotedQuoteApplicationMutationExecution"
import {
  buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_OUTCOME_DRAFT_VERSION,
} from "./nonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft"
import { buildNonCncPromotedQuoteApplicationMutationPackage } from "./nonCncPromotedQuoteApplicationMutationPackage"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation execution outcome drafts", () => {
  it("builds deterministic applied outcomes for prepared dry-run mutation executions", () => {
    const dryRun = readyDryRun()

    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(dryRun)
    const suggestedOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
      command.suggestedOutcome ? [command.suggestedOutcome] : [],
    )
    const committedRun = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      commandOutcomes: suggestedOutcomes,
      executedAt: "2026-06-29T12:10:00.000Z",
      mode: "commit",
      mutationPackage: buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel()),
    })

    expect(outcomeDraft).toMatchObject({
      blockedOutcomeCount: 0,
      draftVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_OUTCOME_DRAFT_VERSION,
      executionFingerprint: dryRun.executionFingerprint,
      mode: "dry_run",
      mutationPackageId: dryRun.mutationPackageId,
      readyOutcomeCount: 3,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(outcomeDraft.nextOperatorMessage).toBe("Review and commit 3 non-CNC application mutation outcomes.")
    expect(outcomeDraft.mutationBoundary).toContain("active RFQ quote, offer, and release state stay unchanged")
    expect(outcomeDraft.commandOutcomes.map((command) => command.key)).toEqual([
      "replace_active_quote",
      "refresh_offer_workspace",
      "open_offer_builder",
    ])
    expect(outcomeDraft.commandOutcomes.map((command) => command.externalId)).toEqual([
      "active-rfq-quote:rfq-demo-204:non-cnc-promoted-quote-application-execution-ready",
      "offer-workspace:rfq-demo-204:non-cnc-promoted-quote-application-execution-ready",
      "release-state:rfq-demo-204:non-cnc-promoted-quote-application-execution-ready",
    ])
    expect(suggestedOutcomes).toEqual([
      {
        externalId: "active-rfq-quote:rfq-demo-204:non-cnc-promoted-quote-application-execution-ready",
        key: "replace_active_quote",
        message: "Prepared active RFQ quote mutation from reviewed non-CNC application package.",
        status: "applied",
        warnings: ["Material certificate required."],
      },
      {
        externalId: "offer-workspace:rfq-demo-204:non-cnc-promoted-quote-application-execution-ready",
        key: "refresh_offer_workspace",
        message: "Prepared offer workspace mutation from reviewed non-CNC application package.",
        status: "applied",
        warnings: ["Material certificate required."],
      },
      {
        externalId: "release-state:rfq-demo-204:non-cnc-promoted-quote-application-execution-ready",
        key: "open_offer_builder",
        message: "Prepared release-state mutation from reviewed non-CNC application package.",
        status: "applied",
        warnings: ["Material certificate required."],
      },
    ])
    expect(committedRun.status).toBe("succeeded")
    expect(committedRun.commands.map((command) => command.status)).toEqual(["applied", "applied", "applied"])
  })

  it("keeps blocked mutation executions outcome-free", () => {
    const mutationPackage = buildNonCncPromotedQuoteApplicationMutationPackage({
      ...readyReadModel(),
      blockerLabels: ["Application outcome commit read model is not ready to apply."],
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      mutationTargets: [],
      status: "blocked",
    })
    const dryRun = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:00:00.000Z",
      mode: "dry_run",
      mutationPackage,
    })

    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(dryRun)

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.readyOutcomeCount).toBe(0)
    expect(outcomeDraft.blockedOutcomeCount).toBe(3)
    expect(outcomeDraft.nextOperatorMessage).toContain("Application outcome commit read model is not ready to apply.")
    expect(outcomeDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.externalId === undefined)).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })

  it("does not draft outcomes from committed mutation executions", () => {
    const mutationPackage = buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel())
    const committedRun = buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: "FactoryBid Operator",
      commandOutcomes: [
        { externalId: "active-rfq-quote:rfq-demo-204:ready", key: "replace_active_quote", status: "applied" },
      ],
      executedAt: "2026-06-29T12:10:00.000Z",
      mode: "commit",
      mutationPackage,
    })

    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(committedRun)

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.nextOperatorMessage).toContain("Application mutation outcome drafts must be based on a dry-run execution.")
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })
})

function readyDryRun(): NonCncPromotedQuoteApplicationMutationExecutionRun {
  return buildNonCncPromotedQuoteApplicationMutationExecutionRun({
    actor: "FactoryBid Operator",
    executedAt: "2026-06-29T12:00:00.000Z",
    mode: "dry_run",
    mutationPackage: buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel()),
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
