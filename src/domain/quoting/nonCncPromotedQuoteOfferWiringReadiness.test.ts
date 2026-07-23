import { describe, expect, it } from "vitest"

import {
  NON_CNC_QUOTE_PROMOTION_READ_MODEL_VERSION,
  type NonCncQuotePromotionReadModel,
} from "./nonCncQuotePromotionReadModel"
import {
  buildNonCncPromotedQuoteOfferWiringReadiness,
  NON_CNC_PROMOTED_QUOTE_OFFER_WIRING_READINESS_VERSION,
} from "./nonCncPromotedQuoteOfferWiringReadiness"
import {
  NON_CNC_PROMOTED_QUOTE_RELEASE_READINESS_VERSION,
  type NonCncPromotedQuoteReleaseReadiness,
} from "./nonCncPromotedQuoteReleaseReadiness"

const request = {
  requestedAt: "2026-07-23T11:30:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC promoted quote offer wiring readiness", () => {
  it("blocks offer wiring until both promoted quote and release readiness are ready", () => {
    const readiness = buildNonCncPromotedQuoteOfferWiringReadiness({
      ...request,
      readModel: {
        ...readyReadModel(),
        blockerLabels: ["Promotion execution must be committed, not dry-run only."],
        offerBuilderExternalId: undefined,
        quoteSnapshot: undefined,
        status: "blocked",
      },
      releaseReadiness: {
        ...readyReleaseReadiness(),
        blockerLabels: ["No persisted non-CNC application apply execution records are available."],
        latestExecutionFingerprint: undefined,
        status: "blocked",
      },
    })

    expect(readiness).toMatchObject({
      blockerLabels: [
        "Promoted quote read model is not ready.",
        "Promoted quote snapshot is missing.",
        "Offer builder external id is missing.",
        "Persisted non-CNC release readiness is not ready.",
        "Release-ready apply execution fingerprint is missing.",
        "Promotion execution must be committed, not dry-run only.",
        "No persisted non-CNC application apply execution records are available.",
      ],
      candidate: undefined,
      nextOperatorMessage: "Keep non-CNC offer wiring blocked until promoted quote and release-readiness evidence are both ready.",
      releaseExecutionFingerprint: undefined,
      releaseStatus: "blocked",
      status: "blocked",
    })
  })

  it("blocks offer wiring when target RFQ evidence does not match the active RFQ", () => {
    const readiness = buildNonCncPromotedQuoteOfferWiringReadiness({
      ...request,
      readModel: { ...readyReadModel(), targetRfqId: "rfq-other-001" },
      releaseReadiness: { ...readyReleaseReadiness(), targetRfqId: "rfq-other-002" },
    })

    expect(readiness).toMatchObject({
      blockerLabels: [
        "Promoted quote target RFQ does not match active RFQ: rfq-other-001.",
        "Release readiness target RFQ does not match active RFQ: rfq-other-002.",
      ],
      candidate: undefined,
      status: "blocked",
    })
  })

  it("returns a ready offer-wiring candidate from promoted quote and persisted release evidence", () => {
    const readModel = readyReadModel()
    const releaseReadiness = readyReleaseReadiness()

    const readiness = buildNonCncPromotedQuoteOfferWiringReadiness({
      ...request,
      readModel,
      releaseReadiness,
    })

    expect(readiness).toMatchObject({
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
      packageId: readModel.packageId,
      readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_WIRING_READINESS_VERSION,
      releaseExecutionFingerprint: releaseReadiness.latestExecutionFingerprint,
      releaseStatus: "ready",
      reviewWarnings: ["Latest persisted apply execution has 1 warning(s)."],
      selectedPlanId: readModel.selectedPlanId,
      status: "ready",
      targetRfqId: request.targetRfqId,
    })
  })
})

function readyReadModel(): NonCncQuotePromotionReadModel {
  return {
    blockerLabels: [],
    executionFingerprint: "non-cnc-quote-promotion-execution-succeeded",
    nextOperatorMessage: "Non-CNC quote promotion is available as a read-only promoted quote candidate.",
    offerBuilderExternalId:
      "offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal-sm-120-bracket-sheet-metal-v1:non-cnc-quote-promotion-command-package-v1",
    offerReadinessExternalId: "offer-readiness:rfq-demo-204:sheet-metal:54905",
    packageId: "non-cnc-quote-promotion-command-package:rfq-demo-204",
    quoteExternalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
    quoteSnapshot: {
      calculatorVersion: "sheet-metal-v1",
      currency: "EUR",
      leadTimeDays: 12,
      partNumber: "SM-120-BRACKET",
      process: "sheet_metal",
      processLabel: "Sheet metal",
      quantity: 20,
      totalCents: 54905,
      unitPriceCents: 2745,
    },
    readModelVersion: NON_CNC_QUOTE_PROMOTION_READ_MODEL_VERSION,
    reviewWarnings: [],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal",
    status: "promoted",
    targetRfqId: request.targetRfqId,
  }
}

function readyReleaseReadiness(): NonCncPromotedQuoteReleaseReadiness {
  return {
    appliedCommandCount: 3,
    blockerLabels: [],
    commandCount: 3,
    latestApplyPlanId: "non-cnc-promoted-quote-application-mutation-apply-plan:rfq-demo-204:package",
    latestExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-succeeded",
    latestStatus: "succeeded",
    nextOperatorMessage: "Persisted non-CNC quote promotion is ready for a future customer-release adapter.",
    persistedRecordCount: 1,
    readinessVersion: NON_CNC_PROMOTED_QUOTE_RELEASE_READINESS_VERSION,
    releaseBoundary:
      "Release readiness is deterministic review data only; this helper does not mutate active RFQ quote, offer, release, or connector state.",
    requestedAt: request.requestedAt,
    requestedBy: request.requestedBy,
    reviewWarnings: ["Latest persisted apply execution has 1 warning(s)."],
    status: "ready",
    targetRfqId: request.targetRfqId,
  }
}
