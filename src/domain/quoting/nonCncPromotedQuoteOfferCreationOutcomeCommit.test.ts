import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferCreationExecutionRun } from "./nonCncPromotedQuoteOfferCreationExecution"
import { buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferCreationExecutionOutcomeDraft"
import {
  buildNonCncPromotedQuoteOfferCreationOutcomeCommitPlan,
  buildNonCncPromotedQuoteOfferCreationOutcomeCommitRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommit"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
  type NonCncPromotedQuoteOfferCreationPlan,
} from "./nonCncPromotedQuoteOfferCreationPlan"

const request = {
  actor: "FactoryBid Operator",
  executedAt: "2026-07-23T14:30:00.000Z",
}

describe("non-CNC promoted quote offer creation outcome commit adapter", () => {
  it("builds a ready commit plan and committed execution run from reviewed customer-offer creation outcomes", () => {
    const plan = readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft(
      buildNonCncPromotedQuoteOfferCreationExecutionRun({
        ...request,
        mode: "dry_run",
        plan,
      }),
    )

    const result = buildNonCncPromotedQuoteOfferCreationOutcomeCommitRun({
      ...request,
      outcomeDraft,
      plan,
    })

    expect(result.commitPlan).toMatchObject({
      blockerLabels: [],
      commandOutcomeCount: 3,
      commitVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION,
      creationPlanId: plan.creationPlanId,
      packageId: plan.packageId,
      releaseExecutionFingerprint: plan.releaseExecutionFingerprint,
      selectedPlanId: plan.selectedPlanId,
      status: "ready",
      targetRfqId: plan.targetRfqId,
    })
    expect(result.commitPlan.nextOperatorMessage).toBe("Commit 3 reviewed non-CNC customer-offer creation outcomes.")
    expect(result.commitPlan.offerCreationBoundary).toContain("active RFQ quote, offer, release, export, and connector state stay unchanged")
    expect(result.commitPlan.commandOutcomes.map((outcome) => outcome.key)).toEqual([
      "draft_customer_offer",
      "prepare_export_package",
      "open_release_review",
    ])
    expect(result.executionRun).toMatchObject({
      creationPlanId: plan.creationPlanId,
      mode: "commit",
      packageId: plan.packageId,
      status: "succeeded",
      targetRfqId: plan.targetRfqId,
    })
    expect(result.executionRun?.commands.map((command) => command.status)).toEqual(["succeeded", "succeeded", "succeeded"])
  })

  it("keeps blocked drafts outcome-free and commit-run-free", () => {
    const plan = {
      ...readyPlan(),
      blockerLabels: ["Offer-wiring readiness is not ready."],
      quoteSummary: undefined,
      releaseExecutionFingerprint: undefined,
      status: "blocked",
    } satisfies NonCncPromotedQuoteOfferCreationPlan
    const outcomeDraft = buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft(
      buildNonCncPromotedQuoteOfferCreationExecutionRun({
        ...request,
        mode: "dry_run",
        plan,
      }),
    )

    const result = buildNonCncPromotedQuoteOfferCreationOutcomeCommitRun({
      ...request,
      outcomeDraft,
      plan,
    })

    expect(result.commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      packageId: plan.packageId,
      status: "blocked",
    })
    expect(result.commitPlan.blockerLabels).toContain("Customer-offer creation outcome draft must be ready before commit.")
    expect(result.commitPlan.nextOperatorMessage).not.toContain("Commit")
    expect(result.executionRun).toBeUndefined()
  })

  it("rejects outcome drafts from a different creation plan", () => {
    const plan = readyPlan()
    const outcomeDraft = buildReadyOutcomeDraft(plan)

    expect(() =>
      buildNonCncPromotedQuoteOfferCreationOutcomeCommitPlan({
        outcomeDraft: {
          ...outcomeDraft,
          creationPlanId: "non-cnc-promoted-quote-offer-creation-plan:other",
        },
        plan,
      }),
    ).toThrow("customer-offer creation outcome draft does not match creation plan: creationPlanId")
  })

  it("rejects outcome drafts with mismatched release execution evidence", () => {
    const plan = readyPlan()
    const outcomeDraft = buildReadyOutcomeDraft(plan)

    expect(() =>
      buildNonCncPromotedQuoteOfferCreationOutcomeCommitPlan({
        outcomeDraft: {
          ...outcomeDraft,
          releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-other",
        },
        plan,
      }),
    ).toThrow("customer-offer creation outcome draft does not match creation plan: releaseExecutionFingerprint")
  })

  it("blocks malformed ready drafts that are missing a suggested outcome", () => {
    const plan = readyPlan()
    const outcomeDraft = buildReadyOutcomeDraft(plan)
    const malformedDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0 ? { ...command, suggestedOutcome: undefined } : command,
      ),
    }

    const commitPlan = buildNonCncPromotedQuoteOfferCreationOutcomeCommitPlan({
      outcomeDraft: malformedDraft,
      plan,
    })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain("Missing suggested customer-offer creation outcome for Draft customer offer.")
  })

  it("blocks ready drafts with missing creation plan commands", () => {
    const plan = readyPlan()
    const outcomeDraft = buildReadyOutcomeDraft(plan)
    const staleDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.slice(0, -1),
    }

    const commitPlan = buildNonCncPromotedQuoteOfferCreationOutcomeCommitPlan({
      outcomeDraft: staleDraft,
      plan,
    })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain("Customer-offer creation outcome draft command list does not match creation plan commands.")
  })

  it("blocks suggested outcomes whose key diverges from the draft command", () => {
    const plan = readyPlan()
    const outcomeDraft = buildReadyOutcomeDraft(plan)
    const malformedDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0 && command.suggestedOutcome
          ? {
              ...command,
              suggestedOutcome: {
                ...command.suggestedOutcome,
                key: "prepare_export_package",
              },
            }
          : command,
      ),
    }

    const result = buildNonCncPromotedQuoteOfferCreationOutcomeCommitRun({
      ...request,
      outcomeDraft: malformedDraft,
      plan,
    })

    expect(result.commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(result.commitPlan.blockerLabels).toContain(
      "Suggested customer-offer creation outcome for Draft customer offer does not match the creation plan command.",
    )
    expect(result.commitPlan.nextOperatorMessage).toContain("Suggested customer-offer creation outcome for Draft customer offer")
    expect(result.executionRun).toBeUndefined()
  })

  it("clones suggested outcomes so later draft mutation cannot change commit inputs", () => {
    const plan = readyPlan()
    const outcomeDraft = buildReadyOutcomeDraft(plan)
    const commitPlan = buildNonCncPromotedQuoteOfferCreationOutcomeCommitPlan({ outcomeDraft, plan })

    const firstOutcome = outcomeDraft.commandOutcomes[0]?.suggestedOutcome
    if (!firstOutcome) {
      throw new Error("Expected ready customer-offer creation outcome draft")
    }
    firstOutcome.externalId = "mutated-after-plan"
    firstOutcome.warnings?.push("mutated warning")

    expect(commitPlan.commandOutcomes[0]).toMatchObject({
      externalId: `customer-offer-draft:rfq-demo-204:${outcomeDraft.executionFingerprint}`,
      key: "draft_customer_offer",
      warnings: ["Offer wiring has a review warning."],
    })
  })
})

function buildReadyOutcomeDraft(plan: NonCncPromotedQuoteOfferCreationPlan) {
  return buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft(
    buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      mode: "dry_run",
      plan,
    }),
  )
}

function readyPlan(): NonCncPromotedQuoteOfferCreationPlan {
  const creationPlanId =
    "non-cnc-promoted-quote-offer-creation-plan:rfq-demo-204:non-cnc-quote-promotion-command-package-rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal"
  return {
    blockerLabels: [],
    commandCount: 3,
    commands: [
      command("draft_customer_offer", "Draft customer offer", creationPlanId),
      command("prepare_export_package", "Prepare export package", creationPlanId),
      command("open_release_review", "Open release review", creationPlanId),
    ],
    creationPlanId,
    nextOperatorMessage: "Non-CNC promoted quote is ready for a future customer-offer creation adapter.",
    offerCreationBoundary:
      "Offer creation plans are deterministic adapter descriptors only; building the plan does not create customer offers, export packages, release plans, or connector side effects.",
    packageId: "non-cnc-quote-promotion-command-package:rfq-demo-204",
    planVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
    quoteSummary: {
      currency: "EUR",
      leadTimeDays: 12,
      partNumber: "SM-120-BRACKET",
      processLabel: "Sheet metal",
      quantity: 20,
      totalCents: 54905,
      unitPriceCents: 2745,
    },
    releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-succeeded",
    requestedAt: "2026-07-23T13:30:00.000Z",
    requestedBy: request.actor,
    reviewWarnings: ["Offer wiring has a review warning."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal",
    status: "ready",
    targetRfqId: "rfq-demo-204",
  }
}

function command(
  key: NonCncPromotedQuoteOfferCreationPlan["commands"][number]["key"],
  label: string,
  creationPlanId: string,
): NonCncPromotedQuoteOfferCreationPlan["commands"][number] {
  return {
    blockerLabels: [],
    idempotencyKey: `${creationPlanId}:${key}`,
    key,
    label,
    offerBuilderExternalId: "offer-builder:rfq-demo-204:package",
    offerReadinessExternalId: "offer-readiness:rfq-demo-204:sheet-metal:54905",
    quoteExternalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
    releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-succeeded",
    reviewWarnings: ["Offer wiring has a review warning."],
    status: "ready",
    targetRfqId: "rfq-demo-204",
  }
}
