import { describe, expect, it } from "vitest"

import {
  buildOfferReleaseProviderOutcomeReadSyncState,
  offerReleaseProviderOutcomeReadSyncIntegrationDetail,
} from "./offerReleaseProviderOutcomeReadSync"

describe("offer release provider outcome read sync", () => {
  it("summarizes local provider outcome batches while Convex reads are unwired", () => {
    const sync = buildOfferReleaseProviderOutcomeReadSyncState({
      localBatchCount: 1,
      status: "local",
    })

    expect(sync).toEqual({
      fallbackCount: 0,
      localBatchCount: 1,
      persistedBatchCount: 0,
      status: "local",
    })
    expect(offerReleaseProviderOutcomeReadSyncIntegrationDetail(sync)).toBe(
      "1 local provider outcome batch available; Convex provider outcome reads are not configured.",
    )
  })

  it("keeps persisted counts gated to Convex reads", () => {
    const pending = buildOfferReleaseProviderOutcomeReadSyncState({
      localBatchCount: 2,
      persistedBatchCount: 4,
      status: "pending",
    })
    const convex = buildOfferReleaseProviderOutcomeReadSyncState({
      localBatchCount: 1,
      persistedBatchCount: 3,
      status: "convex",
    })

    expect(pending.persistedBatchCount).toBe(0)
    expect(offerReleaseProviderOutcomeReadSyncIntegrationDetail(pending)).toBe(
      "Checking Convex provider outcome history; 2 local fallback batches remain visible.",
    )
    expect(convex.persistedBatchCount).toBe(3)
    expect(offerReleaseProviderOutcomeReadSyncIntegrationDetail(convex)).toBe(
      "3 persisted provider outcome batches read from Convex and merged with 1 local fallback batch.",
    )
  })

  it("rejects invalid batch counts", () => {
    expect(() =>
      buildOfferReleaseProviderOutcomeReadSyncState({
        localBatchCount: 1.5,
        status: "local",
      }),
    ).toThrow("localBatchCount must be a non-negative integer")
  })
})
