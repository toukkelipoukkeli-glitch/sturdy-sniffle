import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferCreationExecutionRun,
  type NonCncPromotedQuoteOfferCreationExecutionRun,
} from "./nonCncPromotedQuoteOfferCreationExecution"
import {
  buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft,
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_OUTCOME_DRAFT_VERSION,
} from "./nonCncPromotedQuoteOfferCreationExecutionOutcomeDraft"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
  type NonCncPromotedQuoteOfferCreationPlan,
} from "./nonCncPromotedQuoteOfferCreationPlan"

const request = {
  actor: "FactoryBid Operator",
  executedAt: "2026-07-23T14:30:00.000Z",
}

describe("non-CNC promoted quote offer creation execution outcome drafts", () => {
  it("builds deterministic succeeded outcomes for prepared dry-run offer creation executions", () => {
    const dryRun = readyDryRun()

    const outcomeDraft = buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft(dryRun)
    const suggestedOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
      command.suggestedOutcome ? [command.suggestedOutcome] : [],
    )
    const committedRun = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      commandOutcomes: suggestedOutcomes,
      mode: "commit",
      plan: readyPlan(),
    })

    expect(outcomeDraft).toMatchObject({
      blockedOutcomeCount: 0,
      creationPlanId: dryRun.creationPlanId,
      draftVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_OUTCOME_DRAFT_VERSION,
      executionFingerprint: dryRun.executionFingerprint,
      mode: "dry_run",
      packageId: dryRun.packageId,
      readyOutcomeCount: 3,
      releaseExecutionFingerprint: dryRun.releaseExecutionFingerprint,
      selectedPlanId: dryRun.selectedPlanId,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(outcomeDraft.nextOperatorMessage).toBe("Review and commit 3 non-CNC customer-offer creation outcomes.")
    expect(outcomeDraft.offerCreationBoundary).toContain("active RFQ quote, offer, release, export, and connector state stay unchanged")
    expect(outcomeDraft.commandOutcomes.map((command) => command.key)).toEqual([
      "draft_customer_offer",
      "prepare_export_package",
      "open_release_review",
    ])
    expect(suggestedOutcomes).toEqual([
      {
        externalId: `customer-offer-draft:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "draft_customer_offer",
        message: "Prepared customer-offer draft from reviewed non-CNC offer creation package.",
        status: "succeeded",
        warnings: ["Offer wiring has a review warning."],
      },
      {
        externalId: `customer-offer-export:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "prepare_export_package",
        message: "Prepared customer-offer export package from reviewed non-CNC offer creation package.",
        status: "succeeded",
        warnings: ["Offer wiring has a review warning."],
      },
      {
        externalId: `customer-offer-release-review:rfq-demo-204:${dryRun.executionFingerprint}`,
        key: "open_release_review",
        message: "Prepared customer-offer release review from reviewed non-CNC offer creation package.",
        status: "succeeded",
        warnings: ["Offer wiring has a review warning."],
      },
    ])
    expect(committedRun.status).toBe("succeeded")
    expect(committedRun.commands.map((command) => command.status)).toEqual(["succeeded", "succeeded", "succeeded"])
  })

  it("keeps blocked offer creation executions outcome-free", () => {
    const blockedRun = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      mode: "dry_run",
      plan: {
        ...readyPlan(),
        blockerLabels: ["Offer-wiring readiness is not ready."],
        quoteSummary: undefined,
        releaseExecutionFingerprint: undefined,
        status: "blocked",
      },
    })

    const outcomeDraft = buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft(blockedRun)

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.readyOutcomeCount).toBe(0)
    expect(outcomeDraft.blockedOutcomeCount).toBe(3)
    expect(outcomeDraft.nextOperatorMessage).toContain("Resolve non-CNC customer-offer creation blockers")
    expect(outcomeDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.externalId === undefined)).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })

  it("does not draft outcomes from committed offer creation executions", () => {
    const committedRun = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      commandOutcomes: [{ externalId: "customer-offer-draft:rfq-demo-204:ready", key: "draft_customer_offer", status: "succeeded" }],
      mode: "commit",
      plan: readyPlan(),
    })

    const outcomeDraft = buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft(committedRun)

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.nextOperatorMessage).toContain("Offer creation outcome drafts must be based on a dry-run execution.")
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })

  it.each(["rfq A", "rfq_A", "RFQ-A", "!!!"])(
    "rejects non-canonical outcome id part %s instead of drafting colliding external ids",
    (targetRfqId) => {
      const dryRun = readyDryRun()
      const malformedRun = {
        ...dryRun,
        commands: dryRun.commands.map((command) => ({ ...command, targetRfqId })),
        targetRfqId,
      }

      expect(() => buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft(malformedRun)).toThrow(
        "Non-CNC offer creation execution outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
      )
    },
  )
})

function readyDryRun(): NonCncPromotedQuoteOfferCreationExecutionRun {
  return buildNonCncPromotedQuoteOfferCreationExecutionRun({
    ...request,
    mode: "dry_run",
    plan: readyPlan(),
  })
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
