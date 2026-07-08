import { describe, expect, it } from "vitest"

import {
  buildOfferFollowUpActivityReadinessSyncHealthEvent,
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
  offerFollowUpActivityReadinessSyncHealthReadRecoveryAction,
  offerFollowUpActivityReadinessSyncHealthWriteRecoveryAction,
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
      latestFallbackRecency: "current",
      latestReadFallback: readFallback,
      latestWriteFallback: writeFallback,
      operatorSummary: "Follow-up readiness persistence used 2 fallbacks (read 1, write 1); latest fallback is current.",
      recoveryActionLabels: [
        offerFollowUpActivityReadinessSyncHealthReadRecoveryAction,
        offerFollowUpActivityReadinessSyncHealthWriteRecoveryAction,
      ],
      readFallbackCount: 1,
      status: "read_write_fallback",
      totalFallbackCount: 2,
      writeFallbackCount: 1,
    })
  })

  it("classifies read-only and write-only fallback states", () => {
    expect(
      summarizeOfferFollowUpActivityReadinessSyncHealth([
        syncHealthEvent({
          operation: "read",
        }),
      ]),
    ).toMatchObject({
      recoveryActionLabels: [offerFollowUpActivityReadinessSyncHealthReadRecoveryAction],
      readFallbackCount: 1,
      status: "read_fallback",
      totalFallbackCount: 1,
      writeFallbackCount: 0,
    })

    expect(
      summarizeOfferFollowUpActivityReadinessSyncHealth([
        syncHealthEvent({
          operation: "write",
        }),
      ]),
    ).toMatchObject({
      recoveryActionLabels: [offerFollowUpActivityReadinessSyncHealthWriteRecoveryAction],
      readFallbackCount: 0,
      status: "write_fallback",
      totalFallbackCount: 1,
      writeFallbackCount: 1,
    })
  })

  it("marks latest fallback recency using the injected clock", () => {
    const latestFallback = syncHealthEvent({
      operation: "write",
      recordedAt: "2026-07-03T07:05:00.000Z",
    })

    expect(
      summarizeOfferFollowUpActivityReadinessSyncHealth([latestFallback], {
        now: "2026-07-03T20:05:00.000Z",
      }),
    ).toMatchObject({
      latestFallbackRecency: "current",
    })

    expect(
      summarizeOfferFollowUpActivityReadinessSyncHealth([latestFallback], {
        now: "2026-07-04T08:05:01.000Z",
      }),
    ).toMatchObject({
      latestFallbackRecency: "stale",
      operatorSummary: "Follow-up readiness persistence used 1 fallback (read 0, write 1); latest fallback is stale.",
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
      status: "read_fallback",
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
      latestFallbackRecency: "none",
      latestReadFallback: undefined,
      latestWriteFallback: undefined,
      operatorSummary: "Follow-up readiness persistence is healthy with no local fallback operations recorded.",
      recoveryActionLabels: [],
      readFallbackCount: 0,
      status: "healthy",
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

    expect(() =>
      summarizeOfferFollowUpActivityReadinessSyncHealth([syncHealthEvent()], {
        now: "2026-07-03T08:00:00.000Z",
        staleAfterHours: 0,
      }),
    ).toThrow("syncHealth.staleAfterHours must be a positive number")
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
