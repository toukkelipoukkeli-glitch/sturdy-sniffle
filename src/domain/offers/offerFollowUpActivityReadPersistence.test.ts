import { describe, expect, it, vi } from "vitest"

import {
  createConvexOfferFollowUpActivityReader,
  createLocalOfferFollowUpActivityReader,
  OFFER_FOLLOW_UP_ACTIVITY_READ_VERSION,
  summarizeOfferFollowUpActivities,
  type ConvexOfferFollowUpActivityRecord,
} from "./offerFollowUpActivityReadPersistence"

describe("offer follow-up activity read persistence", () => {
  it("lists persisted follow-up calendar activities through the configured Convex query", async () => {
    const queryCalls: Array<{ args: Record<string, unknown>; queryRef: unknown }> = []
    const reader = createConvexOfferFollowUpActivityReader({
      queryRef: "listOfferFollowUpActivities",
      runQuery: async (queryRef, args) => {
        queryCalls.push({ args, queryRef })
        return [
          followUpRecord({
            _id: "activity-later",
            createdAt: 200,
            message: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
          }),
          followUpRecord({
            _id: "activity-first",
            createdAt: 100,
            message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
          }),
          followUpRecord({
            _id: "activity-other",
            offerId: "convex-offer-999",
          }),
        ]
      },
    })

    await expect(reader.listActivities({ limit: 5, offerId: " convex-offer-204 " })).resolves.toEqual({
      readVersion: OFFER_FOLLOW_UP_ACTIVITY_READ_VERSION,
      totalActivities: 2,
      latestActivity: {
        activityId: "activity-later",
        createdAt: 200,
        followUpTaskId: "follow-later",
        message: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
        offerId: "convex-offer-204",
      },
      recordedFollowUpTaskIds: ["follow-first", "follow-later"],
      messages: [
        "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
        "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
      ],
    })
    expect(queryCalls).toEqual([
      {
        args: {
          limit: 5,
          offerId: "convex-offer-204",
        },
        queryRef: "listOfferFollowUpActivities",
      },
    ])
  })

  it("falls back to local follow-up activity records when the Convex query fails", async () => {
    const onQueryError = vi.fn()
    const reader = createConvexOfferFollowUpActivityReader({
      fallback: createLocalOfferFollowUpActivityReader({
        records: [
          followUpRecord({
            _id: "local-activity",
            createdAt: 300,
            message: "Scheduled offer follow-up local-task for OFFER-204 at 2026-07-04T07:00:00.000Z.",
          }),
        ],
      }),
      onQueryError,
      queryRef: "listOfferFollowUpActivities",
      runQuery: async () => {
        throw new Error("calendar connector unavailable")
      },
    })

    const summary = await reader.listActivities({ offerId: "convex-offer-204" })

    expect(summary).toMatchObject({
      totalActivities: 1,
      recordedFollowUpTaskIds: ["local-task"],
    })
    expect(onQueryError).toHaveBeenCalledWith(expect.any(Error), {
      offerId: "convex-offer-204",
    })
  })

  it("normalizes local summaries and keeps nonstandard messages without task ids", () => {
    expect(
      summarizeOfferFollowUpActivities(
        [
          followUpRecord({
            _id: "activity-note",
            message: "Calendar follow-up imported from legacy connector.",
          }),
          followUpRecord({
            _id: "activity-task",
            message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
          }),
        ],
        { offerId: "convex-offer-204" },
      ),
    ).toMatchObject({
      totalActivities: 2,
      recordedFollowUpTaskIds: ["follow-first"],
      messages: [
        "Calendar follow-up imported from legacy connector.",
        "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
      ],
    })
  })

  it("rejects malformed seeded follow-up activity records", async () => {
    expect(() =>
      summarizeOfferFollowUpActivities(
        [
          {
            ...followUpRecord(),
            createdAt: Number.POSITIVE_INFINITY,
          },
        ],
        { offerId: "convex-offer-204" },
      ),
    ).toThrow("record.createdAt must be a non-negative integer")

    const reader = createConvexOfferFollowUpActivityReader({
      queryRef: "listOfferFollowUpActivities",
      runQuery: async () => [
        {
          ...followUpRecord(),
          kind: "note",
        },
      ],
    })
    await expect(reader.listActivities({ offerId: "convex-offer-204" })).resolves.toMatchObject({
      totalActivities: 0,
    })
  })
})

function followUpRecord(overrides: Partial<ConvexOfferFollowUpActivityRecord> = {}): ConvexOfferFollowUpActivityRecord {
  return {
    _id: "activity-follow-up",
    createdAt: 100,
    kind: "calendar_event",
    message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
    offerId: "convex-offer-204",
    ...overrides,
  }
}
