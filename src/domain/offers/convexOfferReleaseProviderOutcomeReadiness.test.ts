import { describe, expect, it } from "vitest"

import {
  buildConvexOfferReleaseProviderOutcomeReadinessPayload,
  buildOfferReleaseProviderOutcomeReadinessFromConvex,
  type ConvexOfferReleaseProviderOutcomeReadinessPayload,
} from "./convexOfferReleaseProviderOutcomeReadiness"
import {
  OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
  type OfferReleaseProviderOutcomeReadiness,
} from "./offerReleaseProviderOutcomeReadiness"

describe("convex offer release provider outcome readiness payload", () => {
  it("maps readiness into a deterministic Convex payload", () => {
    const payload = buildConvexOfferReleaseProviderOutcomeReadinessPayload(readiness(), {
      offerId: "convex-offer-204",
    })

    expect(payload).toEqual<ConvexOfferReleaseProviderOutcomeReadinessPayload>({
      appliedCommandCount: 6,
      blockerLabels: [],
      expectedCommandCount: 6,
      failedCommandCount: 0,
      latestCommandCount: 6,
      latestOutcomeFingerprint: "offer-release-provider-outcomes-abc123",
      missingCommandCount: 0,
      nextActions: ["Provider outcomes are ready for release execution."],
      offerId: "convex-offer-204",
      offerNumber: "OFFER-204",
      readinessKey:
        "offer-provider-outcome-readiness:convex-offer-204:rfq-204:offer-release-provider-outcome-readiness-v1:ready",
      readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
      rfqId: "rfq-204",
      status: "ready",
    })
  })

  it("round-trips persisted records with normalized text fields", () => {
    const record = buildConvexOfferReleaseProviderOutcomeReadinessPayload({
      ...readiness(),
      blockerLabels: ["  Missing provider outcome. ", " "],
      latestOutcomeFingerprint: " ",
      nextActions: [" Resolve provider outcome. ", " "],
      status: "blocked",
    })

    expect(buildOfferReleaseProviderOutcomeReadinessFromConvex(record)).toEqual({
      ...readiness(),
      blockerLabels: ["Missing provider outcome."],
      latestOutcomeFingerprint: undefined,
      nextActions: ["Resolve provider outcome."],
      status: "blocked",
    })
  })

  it("rejects readiness payloads with unsafe fields", () => {
    expect(() =>
      buildConvexOfferReleaseProviderOutcomeReadinessPayload({
        ...readiness(),
        expectedCommandCount: -1,
      }),
    ).toThrow("readiness.expectedCommandCount must be a non-negative integer")

    expect(() =>
      buildConvexOfferReleaseProviderOutcomeReadinessPayload({
        ...readiness(),
        readinessVersion: "unsupported" as never,
      }),
    ).toThrow("provider outcome readiness version is not supported")

    expect(() =>
      buildOfferReleaseProviderOutcomeReadinessFromConvex({
        ...buildConvexOfferReleaseProviderOutcomeReadinessPayload(readiness()),
        status: "queued" as never,
      }),
    ).toThrow("provider outcome readiness status must be blocked or ready")
  })
})

function readiness(): OfferReleaseProviderOutcomeReadiness {
  return {
    appliedCommandCount: 6,
    blockerLabels: [],
    expectedCommandCount: 6,
    failedCommandCount: 0,
    latestCommandCount: 6,
    latestOutcomeFingerprint: "offer-release-provider-outcomes-abc123",
    missingCommandCount: 0,
    nextActions: ["Provider outcomes are ready for release execution."],
    offerId: "offer-204",
    offerNumber: "OFFER-204",
    readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
    rfqId: "rfq-204",
    status: "ready",
  }
}
