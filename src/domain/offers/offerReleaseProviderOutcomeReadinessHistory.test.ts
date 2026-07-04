import { describe, expect, it } from "vitest"

import { OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION } from "./offerReleaseProviderOutcomeReadiness"
import { summarizeOfferReleaseProviderOutcomeReadinessHistory } from "./offerReleaseProviderOutcomeReadinessHistory"
import type { OfferReleaseProviderOutcomeReadinessPersistenceSnapshot } from "./offerReleaseProviderOutcomeReadinessPersistence"

describe("offer release provider outcome readiness history", () => {
  it("summarizes readiness persistence records and selects the current key", () => {
    const summary = summarizeOfferReleaseProviderOutcomeReadinessHistory(snapshot(), "readiness:offer-204:ready")

    expect(summary).toEqual({
      blockedRecordCount: 1,
      currentReadiness: {
        appliedCommandCount: 6,
        blockerCount: 0,
        expectedCommandCount: 6,
        failedCommandCount: 0,
        latestCommandCount: 6,
        missingCommandCount: 0,
        nextActionCount: 1,
        offerId: "offer-204",
        offerNumber: "OFFER-204",
        readinessKey: "readiness:offer-204:ready",
        readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
        rfqId: "rfq-204",
        status: "ready",
      },
      historyVersion: "offer-release-provider-outcome-readiness-history.v1",
      readyRecordCount: 1,
      statusCounts: {
        blocked: 1,
        ready: 1,
      },
      totalReadinessRecords: 2,
    })
  })

  it("returns an empty deterministic summary when no readiness records exist", () => {
    expect(summarizeOfferReleaseProviderOutcomeReadinessHistory(undefined, "readiness:missing")).toEqual({
      blockedRecordCount: 0,
      currentReadiness: undefined,
      historyVersion: "offer-release-provider-outcome-readiness-history.v1",
      readyRecordCount: 0,
      statusCounts: {},
      totalReadinessRecords: 0,
    })
  })
})

function snapshot(): OfferReleaseProviderOutcomeReadinessPersistenceSnapshot {
  return {
    blockedReadinessKeys: ["readiness:offer-204:blocked"],
    readyReadinessKeys: ["readiness:offer-204:ready"],
    recordCount: 2,
    records: [
      {
        appliedCommandCount: 0,
        blockerLabels: ["6 provider outcome commands missing."],
        expectedCommandCount: 6,
        failedCommandCount: 0,
        latestCommandCount: 0,
        missingCommandCount: 6,
        nextActions: ["Resolve provider outcome readiness: 6 provider outcome commands missing."],
        offerId: "offer-204",
        offerNumber: "OFFER-204",
        readinessKey: "readiness:offer-204:blocked",
        readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
        rfqId: "rfq-204",
        status: "blocked",
      },
      {
        appliedCommandCount: 6,
        blockerLabels: [],
        expectedCommandCount: 6,
        failedCommandCount: 0,
        latestCommandCount: 6,
        missingCommandCount: 0,
        nextActions: ["Provider outcomes are ready for release execution."],
        offerId: "offer-204",
        offerNumber: "OFFER-204",
        readinessKey: "readiness:offer-204:ready",
        readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
        rfqId: "rfq-204",
        status: "ready",
      },
    ],
    statusCounts: {
      blocked: 1,
      ready: 1,
    },
  }
}
