import { describe, expect, it } from "vitest"

import {
  buildOfferFollowUpActivityReadSyncState,
  offerFollowUpActivityReadSyncIntegrationDetail,
} from "./offerFollowUpActivityReadSync"

describe("offer follow-up activity read sync", () => {
  it("normalizes persisted counts only for Convex reads", () => {
    expect(
      buildOfferFollowUpActivityReadSyncState({
        localActivityCount: 2,
        persistedActivityCount: 4,
        status: "fallback",
      }),
    ).toEqual({
      fallbackCount: 1,
      localActivityCount: 2,
      persistedActivityCount: 0,
      status: "fallback",
    })
  })

  it("summarizes pending local fallback follow-up activities", () => {
    const sync = buildOfferFollowUpActivityReadSyncState({
      localActivityCount: 1,
      status: "pending",
    })

    expect(offerFollowUpActivityReadSyncIntegrationDetail(sync)).toBe(
      "Checking Convex follow-up activity history; 1 local fallback activity remains visible.",
    )
  })

  it("rejects invalid activity counts at the boundary", () => {
    expect(() =>
      buildOfferFollowUpActivityReadSyncState({
        localActivityCount: -1,
        status: "local",
      }),
    ).toThrow("localActivityCount")
  })
})
