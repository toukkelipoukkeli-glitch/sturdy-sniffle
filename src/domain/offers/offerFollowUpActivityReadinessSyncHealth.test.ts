import { describe, expect, it } from "vitest"

import {
  buildOfferFollowUpActivityReadinessSyncHealthEvent,
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
  summarizeOfferFollowUpActivityReadinessSyncHealth,
  type OfferFollowUpActivityReadinessSyncHealthEvent,
} from "./offerFollowUpActivityReadinessSyncHealth"

describe("offer follow-up activity readiness sync health", () => {
  it("summarizes read and write fallback events with the latest fallback", () => {
    const readFallback = syncHealthEvent({
      operation: "read",
      recordedAt: "2026-07-03T07:00:00.000Z",
    })
    const writeFallback = syncHealthEvent({
      operation: "write",
      recordedAt: "2026-07-03T07:05:00.000Z",
    })

    expect(summarizeOfferFollowUpActivityReadinessSyncHealth([readFallback, writeFallback])).toEqual({
      healthVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
      latestFallback: writeFallback,
      readFallbackCount: 1,
      totalFallbackCount: 2,
      writeFallbackCount: 1,
    })
  })

  it("dedupes stable fallback event ids and normalizes timestamp offsets", () => {
    const first = syncHealthEvent({
      operation: "read",
      recordedAt: "2026-07-03T10:00:00+03:00",
    })
    const duplicate = syncHealthEvent({
      operation: "read",
      recordedAt: "2026-07-03T07:00:00.000Z",
    })

    expect(summarizeOfferFollowUpActivityReadinessSyncHealth([first, duplicate])).toMatchObject({
      latestFallback: duplicate,
      readFallbackCount: 1,
      totalFallbackCount: 1,
      writeFallbackCount: 0,
    })
  })

  it("breaks latest fallback timestamp ties using stable event ids", () => {
    const first = syncHealthEvent({
      offerId: "offer-b",
      operation: "read",
      recordedAt: "2026-07-03T07:00:00.000Z",
    })
    const second = syncHealthEvent({
      offerId: "offer-a",
      operation: "write",
      recordedAt: "2026-07-03T07:00:00.000Z",
    })

    const result = summarizeOfferFollowUpActivityReadinessSyncHealth([first, second])

    expect(result.latestFallback?.eventId).toBe([first.eventId, second.eventId].sort()[0])
  })

  it("returns an empty deterministic summary when no fallbacks are recorded", () => {
    expect(summarizeOfferFollowUpActivityReadinessSyncHealth(undefined)).toEqual({
      healthVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
      latestFallback: undefined,
      readFallbackCount: 0,
      totalFallbackCount: 0,
      writeFallbackCount: 0,
    })
  })

  it("rejects malformed fallback events", () => {
    expect(() =>
      summarizeOfferFollowUpActivityReadinessSyncHealth([
        {
          ...syncHealthEvent(),
          healthVersion: "unsupported" as never,
        },
      ]),
    ).toThrow("follow-up readiness sync health version is not supported")

    expect(() =>
      summarizeOfferFollowUpActivityReadinessSyncHealth([
        {
          ...syncHealthEvent(),
          eventId: "unstable",
        },
      ]),
    ).toThrow("follow-up readiness sync health eventId is not stable")

    expect(() =>
      buildOfferFollowUpActivityReadinessSyncHealthEvent({
        offerId: "offer-204",
        operation: "delete" as never,
        recordedAt: "2026-07-03T07:00:00.000Z",
        rfqId: "rfq-204",
      }),
    ).toThrow("follow-up readiness sync operation is not supported")
  })
})

function syncHealthEvent(
  overrides: Partial<{
    offerId: string
    operation: "read" | "write"
    recordedAt: string
    rfqId: string
  }> = {},
): OfferFollowUpActivityReadinessSyncHealthEvent {
  return buildOfferFollowUpActivityReadinessSyncHealthEvent({
    offerId: "offer-204",
    operation: "read",
    recordedAt: "2026-07-03T07:00:00.000Z",
    rfqId: "rfq-204",
    ...overrides,
  })
}
