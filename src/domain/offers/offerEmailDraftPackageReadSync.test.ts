import { describe, expect, it } from "vitest"

import {
  buildOfferEmailDraftPackageReadSyncState,
  offerEmailDraftPackageReadSyncIntegrationDetail,
} from "./offerEmailDraftPackageReadSync"

describe("offer email draft package read sync", () => {
  it("summarizes local draft package history while Convex reads are unwired", () => {
    const sync = buildOfferEmailDraftPackageReadSyncState({
      localPackageCount: 1,
      status: "local",
    })

    expect(sync).toEqual({
      fallbackCount: 0,
      localPackageCount: 1,
      persistedPackageCount: 0,
      status: "local",
    })
    expect(offerEmailDraftPackageReadSyncIntegrationDetail(sync)).toBe(
      "1 local email draft package available; Convex email draft package reads are not configured.",
    )
  })

  it("keeps persisted counts gated to Convex reads", () => {
    const fallback = buildOfferEmailDraftPackageReadSyncState({
      localPackageCount: 2,
      persistedPackageCount: 4,
      status: "fallback",
    })
    const convex = buildOfferEmailDraftPackageReadSyncState({
      localPackageCount: 1,
      persistedPackageCount: 3,
      status: "convex",
    })

    expect(fallback.persistedPackageCount).toBe(0)
    expect(fallback.fallbackCount).toBe(1)
    expect(offerEmailDraftPackageReadSyncIntegrationDetail(fallback)).toBe(
      "Email draft package history fell back to 2 local email draft packages after a Convex read failure.",
    )
    expect(convex.persistedPackageCount).toBe(3)
    expect(offerEmailDraftPackageReadSyncIntegrationDetail(convex)).toBe(
      "3 persisted email draft packages read from Convex and merged with 1 local fallback package.",
    )
  })

  it("rejects invalid package counts", () => {
    expect(() =>
      buildOfferEmailDraftPackageReadSyncState({
        localPackageCount: -1,
        status: "local",
      }),
    ).toThrow("localPackageCount must be a non-negative integer")
  })
})
