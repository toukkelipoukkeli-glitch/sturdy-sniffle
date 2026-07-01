import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteApplicationMutationExecutionRun,
  type NonCncPromotedQuoteApplicationMutationExecutionRun,
} from "./nonCncPromotedQuoteApplicationMutationExecution"
import { buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft } from "./nonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft"
import {
  buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan,
  buildNonCncPromotedQuoteApplicationMutationOutcomeCommitRun,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommit"
import {
  buildNonCncPromotedQuoteApplicationMutationPackage,
  type NonCncPromotedQuoteApplicationMutationPackage,
} from "./nonCncPromotedQuoteApplicationMutationPackage"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation outcome commit adapter", () => {
  it("builds a ready commit plan and committed mutation execution run from reviewed mutation outcome drafts", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun())

    const result = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:15:00.000Z",
      mutationPackage,
      outcomeDraft,
    })

    expect(result.commitPlan).toMatchObject({
      blockerLabels: [],
      commandOutcomeCount: 3,
      commitVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION,
      mutationPackageId: mutationPackage.mutationPackageId,
      sourceExecutionFingerprint: outcomeDraft.executionFingerprint,
      status: "ready",
      targetRfqId: mutationPackage.targetRfqId,
    })
    expect(result.commitPlan.nextOperatorMessage).toBe("Commit 3 reviewed non-CNC application mutation outcomes.")
    expect(result.commitPlan.mutationBoundary).toContain("active RFQ quote, offer, and release state stay unchanged")
    expect(result.commitPlan.commandOutcomes.map((outcome) => outcome.key)).toEqual([
      "replace_active_quote",
      "refresh_offer_workspace",
      "open_offer_builder",
    ])
    expect(result.executionRun).toMatchObject({
      mode: "commit",
      mutationPackageId: mutationPackage.mutationPackageId,
      status: "succeeded",
      targetRfqId: mutationPackage.targetRfqId,
    })
    expect(result.executionRun?.commands.map((command) => command.status)).toEqual(["applied", "applied", "applied"])
  })

  it("keeps blocked drafts outcome-free and commit-run-free", () => {
    const mutationPackage = blockedMutationPackage()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(
      buildNonCncPromotedQuoteApplicationMutationExecutionRun({
        actor: "FactoryBid Operator",
        executedAt: "2026-06-29T12:00:00.000Z",
        mode: "dry_run",
        mutationPackage,
      }),
    )

    const result = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:15:00.000Z",
      mutationPackage,
      outcomeDraft,
    })

    expect(result.commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      mutationPackageId: mutationPackage.mutationPackageId,
      status: "blocked",
    })
    expect(result.commitPlan.blockerLabels).toContain("Application mutation outcome draft must be ready before commit.")
    expect(result.commitPlan.nextOperatorMessage).not.toContain("Commit")
    expect(result.executionRun).toBeUndefined()
  })

  it("rejects outcome drafts from a different mutation package", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = {
      ...buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun()),
      mutationPackageId: "non-cnc-promoted-quote-application-mutation-package:other",
    }

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan({
        mutationPackage,
        outcomeDraft,
      }),
    ).toThrow("application mutation outcome draft does not match mutation package: mutationPackageId")
  })

  it("rejects outcome drafts from a different package id", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = {
      ...buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun()),
      packageId: "package-other",
    }

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan({
        mutationPackage,
        outcomeDraft,
      }),
    ).toThrow("application mutation outcome draft does not match mutation package: packageId")
  })

  it("blocks ready outcome drafts that were not sourced from a dry run", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = {
      ...buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun()),
      mode: "commit" as const,
    }

    const commitPlan = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan({
      mutationPackage,
      outcomeDraft,
    })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain("Application mutation outcome draft must come from a dry run before commit.")
    expect(commitPlan.nextOperatorMessage).toContain("Application mutation outcome draft must come from a dry run before commit.")
  })

  it("blocks malformed ready drafts that are missing a suggested outcome", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun())
    const malformedDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0 ? { ...command, suggestedOutcome: undefined } : command,
      ),
    }

    const commitPlan = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan({
      mutationPackage,
      outcomeDraft: malformedDraft,
    })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain("Missing suggested application mutation outcome for Apply active RFQ quote.")
  })

  it("blocks ready drafts with missing mutation package commands", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun())
    const staleDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.slice(0, -1),
    }

    const commitPlan = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan({
      mutationPackage,
      outcomeDraft: staleDraft,
    })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain(
      "Application mutation outcome draft command list does not match mutation package commands.",
    )
  })

  it("blocks ready drafts whose command order diverges from the mutation package", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun())
    const reorderedDraft = {
      ...outcomeDraft,
      commandOutcomes: [
        outcomeDraft.commandOutcomes[1]!,
        outcomeDraft.commandOutcomes[0]!,
        ...outcomeDraft.commandOutcomes.slice(2),
      ],
    }

    const commitPlan = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan({
      mutationPackage,
      outcomeDraft: reorderedDraft,
    })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain(
      "Application mutation outcome draft command list does not match mutation package commands.",
    )
  })

  it("compares command key and mutation target fields directly instead of relying on delimiter-joined tokens", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun())
    const aliasingPackage = {
      ...mutationPackage,
      commands: mutationPackage.commands.map((command, index) =>
        index === 0
          ? {
              ...command,
              key: "replace_active_quote:active" as typeof command.key,
              mutationTarget: "rfq_quote" as typeof command.mutationTarget,
            }
          : command,
      ),
    }
    const aliasingDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0
          ? {
              ...command,
              key: "replace_active_quote" as typeof command.key,
              mutationTarget: "active:rfq_quote" as typeof command.mutationTarget,
            }
          : command,
      ),
    }

    const commitPlan = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan({
      mutationPackage: aliasingPackage,
      outcomeDraft: aliasingDraft,
    })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain(
      "Application mutation outcome draft command list does not match mutation package commands.",
    )
  })

  it("blocks suggested outcomes whose key diverges from the draft command", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun())
    const malformedDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0 && command.suggestedOutcome
          ? {
              ...command,
              suggestedOutcome: {
                ...command.suggestedOutcome,
                key: "refresh_offer_workspace",
              },
            }
          : command,
      ),
    }

    const result = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      executedAt: "2026-06-29T12:15:00.000Z",
      mutationPackage,
      outcomeDraft: malformedDraft,
    })

    expect(result.commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(result.commitPlan.blockerLabels).toContain(
      "Suggested application mutation outcome for Apply active RFQ quote does not match the mutation package command.",
    )
    expect(result.executionRun).toBeUndefined()
  })

  it("clones suggested outcomes so later draft mutation cannot change commit inputs", () => {
    const mutationPackage = readyMutationPackage()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(readyDryRun())
    const commitPlan = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan({ mutationPackage, outcomeDraft })

    const firstOutcome = outcomeDraft.commandOutcomes[0]?.suggestedOutcome
    if (!firstOutcome) {
      throw new Error("Expected ready mutation outcome draft")
    }
    firstOutcome.externalId = "mutated-after-plan"
    firstOutcome.warnings?.push("mutated warning")

    expect(commitPlan.commandOutcomes[0]).toMatchObject({
      externalId: "active-rfq-quote:rfq-demo-204:non-cnc-promoted-quote-application-execution-ready",
      key: "replace_active_quote",
      warnings: ["Material certificate required."],
    })
  })
})

function readyDryRun(): NonCncPromotedQuoteApplicationMutationExecutionRun {
  return buildNonCncPromotedQuoteApplicationMutationExecutionRun({
    actor: "FactoryBid Operator",
    executedAt: "2026-06-29T12:00:00.000Z",
    mode: "dry_run",
    mutationPackage: readyMutationPackage(),
  })
}

function readyMutationPackage(): NonCncPromotedQuoteApplicationMutationPackage {
  return buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel())
}

function blockedMutationPackage(): NonCncPromotedQuoteApplicationMutationPackage {
  return buildNonCncPromotedQuoteApplicationMutationPackage({
    ...readyReadModel(),
    blockerLabels: ["Application outcome commit read model is not ready to apply."],
    committedOutcomeCount: 0,
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
