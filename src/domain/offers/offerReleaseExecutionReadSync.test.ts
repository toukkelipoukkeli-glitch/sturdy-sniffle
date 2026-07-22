import { describe, expect, it } from "vitest"

import {
  buildOfferReleaseExecutionReadSyncState,
  offerReleaseExecutionReadSyncIntegrationDetail,
} from "./offerReleaseExecutionReadSync"

describe("offer release execution read sync", () => {
  it("normalizes persisted counts only for Convex reads", () => {
    expect(
      buildOfferReleaseExecutionReadSyncState({
        localRunCount: 2,
        persistedRunCount: 4,
        status: "fallback",
      }),
    ).toEqual({
      fallbackCount: 1,
      localRunCount: 2,
      persistedRunCount: 0,
      status: "fallback",
    })
  })

  it("summarizes pending local fallback release execution runs", () => {
    const sync = buildOfferReleaseExecutionReadSyncState({
      localRunCount: 1,
      status: "pending",
    })

    expect(offerReleaseExecutionReadSyncIntegrationDetail(sync)).toBe(
      "Checking Convex release execution history; 1 local fallback run remains visible.",
    )
  })

  it("rejects invalid run counts at the boundary", () => {
    expect(() =>
      buildOfferReleaseExecutionReadSyncState({
        localRunCount: -1,
        status: "local",
      }),
    ).toThrow("localRunCount")
  })
})
