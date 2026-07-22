import { describe, expect, it } from "vitest"

import {
  buildOfferReleaseProviderOutcomeReadinessReadSyncState,
  offerReleaseProviderOutcomeReadinessReadSyncIntegrationDetail,
} from "./offerReleaseProviderOutcomeReadinessReadSync"

describe("offer release provider outcome readiness read sync", () => {
  it("normalizes persisted counts only for Convex reads", () => {
    expect(
      buildOfferReleaseProviderOutcomeReadinessReadSyncState({
        localRecordCount: 2,
        persistedRecordCount: 4,
        status: "fallback",
      }),
    ).toEqual({
      fallbackCount: 1,
      localRecordCount: 2,
      persistedRecordCount: 0,
      status: "fallback",
    })
  })

  it("summarizes pending local fallback readiness records", () => {
    const sync = buildOfferReleaseProviderOutcomeReadinessReadSyncState({
      localRecordCount: 1,
      status: "pending",
    })

    expect(offerReleaseProviderOutcomeReadinessReadSyncIntegrationDetail(sync)).toBe(
      "Checking Convex provider readiness history; 1 local fallback record remains visible.",
    )
  })

  it("rejects invalid record counts at the boundary", () => {
    expect(() =>
      buildOfferReleaseProviderOutcomeReadinessReadSyncState({
        localRecordCount: -1,
        status: "local",
      }),
    ).toThrow("localRecordCount")
  })
})
