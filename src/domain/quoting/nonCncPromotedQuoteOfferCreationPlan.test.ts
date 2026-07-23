import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferCreationPlan,
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
} from "./nonCncPromotedQuoteOfferCreationPlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_WIRING_READINESS_VERSION,
  type NonCncPromotedQuoteOfferWiringReadiness,
} from "./nonCncPromotedQuoteOfferWiringReadiness"

const request = {
  requestedAt: "2026-07-23T13:30:00.000Z",
  requestedBy: "FactoryBid Operator",
}

describe("non-CNC promoted quote offer creation plan", () => {
  it("blocks customer-offer creation until offer-wiring readiness is ready", () => {
    const plan = buildNonCncPromotedQuoteOfferCreationPlan({
      ...request,
      readiness: {
        ...readyReadiness(),
        blockerLabels: ["Promoted quote read model is not ready."],
        candidate: undefined,
        releaseExecutionFingerprint: undefined,
        status: "blocked",
      },
    })

    expect(plan).toMatchObject({
      blockerLabels: [
        "Offer-wiring readiness is not ready.",
        "Offer-wiring candidate is missing.",
        "Release execution fingerprint is missing.",
        "Promoted quote read model is not ready.",
      ],
      commandCount: 3,
      nextOperatorMessage: "Keep non-CNC customer-offer creation blocked until offer-wiring readiness is ready.",
      quoteSummary: undefined,
      releaseExecutionFingerprint: undefined,
      status: "blocked",
    })
    expect(plan.commands).toEqual([
      expect.objectContaining({
        blockerLabels: plan.blockerLabels,
        idempotencyKey: `${plan.creationPlanId}:draft_customer_offer`,
        key: "draft_customer_offer",
        quoteExternalId: undefined,
        status: "blocked",
        targetRfqId: undefined,
      }),
      expect.objectContaining({
        blockerLabels: plan.blockerLabels,
        idempotencyKey: `${plan.creationPlanId}:prepare_export_package`,
        key: "prepare_export_package",
        status: "blocked",
      }),
      expect.objectContaining({
        blockerLabels: plan.blockerLabels,
        idempotencyKey: `${plan.creationPlanId}:open_release_review`,
        key: "open_release_review",
        status: "blocked",
      }),
    ])
  })

  it("builds ready adapter commands from offer-wiring evidence without creating an offer draft", () => {
    const readiness = readyReadiness()
    const plan = buildNonCncPromotedQuoteOfferCreationPlan({
      readiness,
      requestedAt: "2026-07-23T16:30:00+03:00",
      requestedBy: "  FactoryBid Operator  ",
    })

    expect(plan).toMatchObject({
      blockerLabels: [],
      creationPlanId:
        "non-cnc-promoted-quote-offer-creation-plan:rfq-demo-204:non-cnc-quote-promotion-command-package-rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal",
      nextOperatorMessage: "Non-CNC promoted quote is ready for a future customer-offer creation adapter.",
      offerCreationBoundary:
        "Offer creation plans are deterministic adapter descriptors only; building the plan does not create customer offers, export packages, release plans, or connector side effects.",
      packageId: readiness.packageId,
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
      releaseExecutionFingerprint: readiness.releaseExecutionFingerprint,
      requestedAt: "2026-07-23T13:30:00.000Z",
      requestedBy: request.requestedBy,
      reviewWarnings: ["Latest persisted apply execution has 1 warning(s)."],
      selectedPlanId: readiness.selectedPlanId,
      status: "ready",
      targetRfqId: readiness.targetRfqId,
    })
    expect(plan.commands).toEqual([
      expect.objectContaining({
        blockerLabels: [],
        idempotencyKey: `${plan.creationPlanId}:draft_customer_offer`,
        key: "draft_customer_offer",
        label: "Draft customer offer",
        offerBuilderExternalId: readiness.candidate?.offerBuilderExternalId,
        offerReadinessExternalId: readiness.candidate?.offerReadinessExternalId,
        quoteExternalId: readiness.candidate?.quoteExternalId,
        releaseExecutionFingerprint: readiness.releaseExecutionFingerprint,
        status: "ready",
        targetRfqId: readiness.targetRfqId,
      }),
      expect.objectContaining({
        idempotencyKey: `${plan.creationPlanId}:prepare_export_package`,
        key: "prepare_export_package",
        label: "Prepare export package",
        status: "ready",
      }),
      expect.objectContaining({
        idempotencyKey: `${plan.creationPlanId}:open_release_review`,
        key: "open_release_review",
        label: "Open release review",
        status: "ready",
      }),
    ])
  })

  it("rejects unsluggable identifiers before building a colliding creation plan id", () => {
    expect(() =>
      buildNonCncPromotedQuoteOfferCreationPlan({
        ...request,
        readiness: { ...readyReadiness(), packageId: "!!!" },
      }),
    ).toThrow("readiness.packageId must contain at least one alphanumeric character")
  })
})

function readyReadiness(): NonCncPromotedQuoteOfferWiringReadiness {
  return {
    blockerLabels: [],
    candidate: {
      currency: "EUR",
      leadTimeDays: 12,
      offerBuilderExternalId:
        "offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal-sm-120-bracket-sheet-metal-v1:non-cnc-quote-promotion-command-package-v1",
      offerReadinessExternalId: "offer-readiness:rfq-demo-204:sheet-metal:54905",
      partNumber: "SM-120-BRACKET",
      processLabel: "Sheet metal",
      quantity: 20,
      quoteExternalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
      totalCents: 54905,
      unitPriceCents: 2745,
    },
    nextOperatorMessage: "Non-CNC promoted quote has persisted apply evidence for a future customer-offer wiring adapter.",
    offerWiringBoundary:
      "Offer wiring readiness is deterministic review data only; this helper does not create customer offers, mutate release state, or call connectors.",
    packageId: "non-cnc-quote-promotion-command-package:rfq-demo-204",
    readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_WIRING_READINESS_VERSION,
    releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-succeeded",
    releaseStatus: "ready",
    requestedAt: "2026-07-23T11:30:00.000Z",
    requestedBy: request.requestedBy,
    reviewWarnings: ["Latest persisted apply execution has 1 warning(s)."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal",
    status: "ready",
    targetRfqId: "rfq-demo-204",
  }
}
