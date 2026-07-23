import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferCreationExecutionRun,
  fingerprintNonCncPromotedQuoteOfferCreationExecutionRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteOfferCreationExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
  type NonCncPromotedQuoteOfferCreationPlan,
} from "./nonCncPromotedQuoteOfferCreationPlan"

const request = {
  actor: "FactoryBid Operator",
  executedAt: "2026-07-23T14:30:00.000Z",
}

describe("non-CNC promoted quote offer creation execution", () => {
  it("blocks execution for blocked creation plans and withholds external evidence", () => {
    const run = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      mode: "commit",
      plan: {
        ...readyPlan(),
        blockerLabels: ["Offer-wiring readiness is not ready."],
        quoteSummary: undefined,
        releaseExecutionFingerprint: undefined,
        status: "blocked",
      },
      commandOutcomes: [
        {
          externalId: "offer:should-not-leak",
          key: "draft_customer_offer",
          message: "Should be ignored",
          status: "succeeded",
          warnings: ["Should be ignored"],
        },
      ],
    })

    expect(run).toMatchObject({
      commandCount: 3,
      executionVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_VERSION,
      mode: "commit",
      nextActions: [
        "Resolve non-CNC customer-offer creation blockers before running the adapter.",
        "Offer-wiring readiness is not ready.",
      ],
      releaseExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
      warnings: ["Offer wiring has a review warning."],
    })
    expect(run.commands).toEqual(
      readyPlan().commands.map((command) =>
        expect.objectContaining({
          externalId: undefined,
          key: command.key,
          message: undefined,
          offerBuilderExternalId: undefined,
          quoteExternalId: undefined,
          releaseExecutionFingerprint: undefined,
          status: "blocked",
          targetRfqId: undefined,
          warnings: [],
        }),
      ),
    )
  })

  it("prepares ready commands in dry-run mode without retaining command outcomes", () => {
    const plan = readyPlan()
    const run = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      commandOutcomes: [{ externalId: "offer:ignored", key: "draft_customer_offer", status: "succeeded" }],
      executedAt: "2026-07-23T17:30:00+03:00",
      mode: "dry_run",
      plan,
    })

    expect(run).toMatchObject({
      creationPlanId: plan.creationPlanId,
      executedAt: request.executedAt,
      mode: "dry_run",
      nextActions: ["Review prepared customer-offer creation commands before committing them."],
      releaseExecutionFingerprint: plan.releaseExecutionFingerprint,
      status: "prepared",
      targetRfqId: plan.targetRfqId,
    })
    expect(run.commands).toEqual(
      plan.commands.map((command) =>
        expect.objectContaining({
          externalId: undefined,
          idempotencyKey: command.idempotencyKey,
          key: command.key,
          message: undefined,
          offerBuilderExternalId: command.offerBuilderExternalId,
          quoteExternalId: command.quoteExternalId,
          status: "prepared",
          targetRfqId: plan.targetRfqId,
          warnings: [],
        }),
      ),
    )
  })

  it("records succeeded commit outcomes with a stable fingerprint", () => {
    const plan = readyPlan()
    const run = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      commandOutcomes: [
        { externalId: "offer-draft:rfq-demo-204", key: "draft_customer_offer", message: "Draft ready", status: "succeeded" },
        { externalId: "offer-export:rfq-demo-204", key: "prepare_export_package", status: "succeeded" },
        {
          externalId: "release-review:rfq-demo-204",
          key: "open_release_review",
          status: "succeeded",
          warnings: ["Release review still needs manager approval."],
        },
      ],
      mode: "commit",
      plan,
    })

    expect(run).toMatchObject({
      nextActions: ["Review the recorded customer-offer creation audit before wiring active offer state."],
      status: "succeeded",
      warnings: ["Offer wiring has a review warning.", "Release review still needs manager approval."],
    })
    expect(run.commands).toEqual([
      expect.objectContaining({
        externalId: "offer-draft:rfq-demo-204",
        key: "draft_customer_offer",
        message: "Draft ready",
        status: "succeeded",
      }),
      expect.objectContaining({
        externalId: "offer-export:rfq-demo-204",
        key: "prepare_export_package",
        status: "succeeded",
      }),
      expect.objectContaining({
        externalId: "release-review:rfq-demo-204",
        key: "open_release_review",
        status: "succeeded",
        warnings: ["Release review still needs manager approval."],
      }),
    ])
    expect(run.executionFingerprint).toBe(fingerprintNonCncPromotedQuoteOfferCreationExecutionRun(run))
  })

  it("keeps pending and partial commit runs deterministic", () => {
    const pendingRun = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      mode: "commit",
      plan: readyPlan(),
    })
    const partialRun = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      commandOutcomes: [
        { externalId: "offer-draft:rfq-demo-204", key: "draft_customer_offer", status: "succeeded" },
        { key: "prepare_export_package", message: "PDF renderer unavailable", status: "failed" },
      ],
      mode: "commit",
      plan: readyPlan(),
    })

    expect(pendingRun).toMatchObject({
      nextActions: ["Wait for customer-offer creation command outcomes before marking the run complete."],
      status: "pending",
    })
    expect(pendingRun.commands.map((command) => command.status)).toEqual(["pending", "pending", "pending"])
    expect(partialRun).toMatchObject({
      nextActions: ["Review failed or partial customer-offer creation command outcomes before retrying."],
      status: "partial",
    })
    expect(partialRun.commands.map((command) => command.status)).toEqual(["succeeded", "failed", "pending"])
  })

  it("rejects duplicate or unknown command outcomes", () => {
    expect(() =>
      buildNonCncPromotedQuoteOfferCreationExecutionRun({
        ...request,
        commandOutcomes: [
          { key: "draft_customer_offer", status: "succeeded" },
          { key: "draft_customer_offer", status: "failed" },
        ],
        mode: "commit",
        plan: readyPlan(),
      }),
    ).toThrow("commandOutcomes[1].key is duplicated")

    expect(() =>
      buildNonCncPromotedQuoteOfferCreationExecutionRun({
        ...request,
        commandOutcomes: [{ key: "unknown", status: "succeeded" }],
        mode: "commit",
        plan: readyPlan(),
      }),
    ).toThrow("commandOutcomes[0].key must be a valid offer creation command key")
  })
})

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
