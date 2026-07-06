import { describe, expect, it } from "vitest"

import {
  buildOfferFollowUpActivityReadiness,
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
  type OfferFollowUpActivityReadiness,
} from "./offerFollowUpActivityReadiness"
import type { ConvexOfferFollowUpActivityReadinessPayload } from "./convexOfferFollowUpActivityReadiness"
import { summarizeOfferFollowUpActivities, type ConvexOfferFollowUpActivityRecord } from "./offerFollowUpActivityReadPersistence"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
  type OfferFollowUpActivityReadinessHistoryRecord,
} from "./offerFollowUpActivityReadinessHistory"
import {
  createConvexOfferFollowUpActivityReadinessPersistence,
  createConvexOfferFollowUpActivityReadinessReader,
  createLocalOfferFollowUpActivityReadinessPersistence,
  createLocalOfferFollowUpActivityReadinessReader,
} from "./offerFollowUpActivityReadinessPersistence"

describe("offer follow-up activity readiness persistence", () => {
  it("keeps a deterministic local snapshot and dedupes by readiness key", async () => {
    const adapter = createLocalOfferFollowUpActivityReadinessPersistence({
      initialSnapshot: {
        records: [
          readinessPayload({
            readinessKey: "offer-follow-up-activity-readiness:offer-204:rfq-204:recorded",
            recordedAt: "2026-07-03T07:00:00.000Z",
            status: "recorded",
          }),
          readinessPayload({
            latestActivityMessage: "newer persisted activity",
            readinessKey: "offer-follow-up-activity-readiness:offer-204:rfq-204:recorded",
            recordedAt: "2026-07-03T07:05:00.000Z",
            status: "recorded",
          }),
        ],
      },
    })

    const snapshot = await adapter.recordReadiness(historyRecord({ readiness: readinessPartial(), readinessKey: "offer-follow-up-activity-readiness:offer-204:rfq-204:partial" }))

    expect(snapshot).toMatchObject({
      partialReadinessKeys: ["offer-follow-up-activity-readiness:offer-204:rfq-204:partial"],
      recordedReadinessKeys: ["offer-follow-up-activity-readiness:offer-204:rfq-204:recorded"],
      recordCount: 2,
      statusCounts: {
        partial: 1,
        recorded: 1,
      },
    })
    expect(snapshot.records.map((record) => record.readinessKey)).toEqual([
      "offer-follow-up-activity-readiness:offer-204:rfq-204:partial",
      "offer-follow-up-activity-readiness:offer-204:rfq-204:recorded",
    ])
    expect(snapshot.records[1]?.latestActivityMessage).toBe("newer persisted activity")
  })

  it("routes readiness payloads through the configured Convex mutation", async () => {
    const calls: Array<{ args: Record<string, unknown>; mutationRef: unknown }> = []
    const adapter = createConvexOfferFollowUpActivityReadinessPersistence({
      mutationRef: "recordOfferFollowUpActivityReadiness",
      runMutation: async (mutationRef, args) => {
        calls.push({ args, mutationRef })
      },
    })

    const snapshot = await adapter.recordReadiness(historyRecord({ offerId: "convex-offer-204" }))

    expect(calls).toEqual([
      {
        args: {
          expectedFollowUpTaskIds: ["follow-first", "follow-later"],
          expectedTaskCount: 2,
          latestActivityMessage: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
          missingFollowUpTaskIds: [],
          missingTaskCount: 0,
          nextActions: ["Persisted follow-up activity coverage is complete."],
          offerId: "convex-offer-204",
          readinessHistoryVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
          readinessKey: "offer-follow-up-activity-readiness:offer-204:rfq-204:recorded",
          readinessVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
          recordedAt: Date.parse("2026-07-03T07:10:00.000Z"),
          recordedFollowUpTaskIds: ["follow-first", "follow-later"],
          recordedTaskCount: 2,
          status: "recorded",
          totalActivities: 2,
          unexpectedFollowUpTaskIds: [],
          unexpectedTaskCount: 0,
          unmatchedActivityCount: 0,
        },
        mutationRef: "recordOfferFollowUpActivityReadiness",
      },
    ])
    expect(snapshot.recordedReadinessKeys).toEqual(["offer-follow-up-activity-readiness:offer-204:rfq-204:recorded"])
  })

  it("keeps the local fallback hot when Convex persistence fails", async () => {
    const errors: string[] = []
    const adapter = createConvexOfferFollowUpActivityReadinessPersistence({
      mutationRef: "recordOfferFollowUpActivityReadiness",
      onPersistError: (error, payload) => {
        errors.push(`${error instanceof Error ? error.message : String(error)}:${payload.readinessKey}`)
      },
      runMutation: async () => {
        throw new Error("Convex unavailable")
      },
    })

    const snapshot = await adapter.recordReadiness(historyRecord({ readiness: readinessPartial(), readinessKey: "offer-follow-up-activity-readiness:offer-204:rfq-204:partial" }))

    expect(errors).toEqual(["Convex unavailable:offer-follow-up-activity-readiness:offer-204:rfq-204:partial"])
    expect(snapshot).toMatchObject({
      partialReadinessKeys: ["offer-follow-up-activity-readiness:offer-204:rfq-204:partial"],
      recordCount: 1,
    })
  })

  it("lists readiness records through the configured Convex query", async () => {
    const calls: Array<{ args: Record<string, unknown>; queryRef: unknown }> = []
    const reader = createConvexOfferFollowUpActivityReadinessReader({
      queryRef: "listOfferFollowUpActivityReadiness",
      runQuery: async (queryRef, args) => {
        calls.push({ args, queryRef })
        return [
          {
            ...readinessPayload({
              offerId: "convex-offer-204",
              readinessKey: "offer-follow-up-activity-readiness:convex-offer-204:rfq-204:recorded",
              rfqId: "convex-rfq-204",
              status: "recorded",
            }),
            _id: "readiness-doc-1",
            createdAt: 1_789_000_000_000,
            quoteId: "quote-204",
            recordedAt: 1_788_178_200_000,
            tenantId: "tenant-1",
            updatedAt: 1_789_000_000_500,
          },
        ]
      },
    })

    const snapshot = await reader.listReadiness({ limit: 5, offerId: "convex-offer-204" })

    expect(calls).toEqual([
      {
        args: {
          limit: 5,
          offerId: "convex-offer-204",
        },
        queryRef: "listOfferFollowUpActivityReadiness",
      },
    ])
    expect(snapshot).toMatchObject({
      recordedReadinessKeys: ["offer-follow-up-activity-readiness:convex-offer-204:rfq-204:recorded"],
      recordCount: 1,
      statusCounts: {
        recorded: 1,
      },
    })
    expect(snapshot.records[0]).toMatchObject({
      offerId: "convex-offer-204",
      readinessKey: "offer-follow-up-activity-readiness:convex-offer-204:rfq-204:recorded",
      recordedAt: new Date(1_788_178_200_000).toISOString(),
      rfqId: "convex-rfq-204",
      status: "recorded",
    })
  })

  it("falls back to local readiness records when the Convex query fails", async () => {
    const errors: string[] = []
    const fallback = createLocalOfferFollowUpActivityReadinessReader({
      initialSnapshot: {
        records: [
          readinessPayload({
            offerId: "offer-204",
            readinessKey: "offer-follow-up-activity-readiness:offer-204:rfq-204:partial",
            status: "partial",
          }),
        ],
      },
    })
    const reader = createConvexOfferFollowUpActivityReadinessReader({
      fallback,
      onQueryError: (error, args) => {
        errors.push(`${error instanceof Error ? error.message : String(error)}:${args.offerId}`)
      },
      queryRef: "listOfferFollowUpActivityReadiness",
      runQuery: async () => {
        throw new Error("Convex query unavailable")
      },
    })

    const snapshot = await reader.listReadiness({ offerId: "offer-204" })

    expect(errors).toEqual(["Convex query unavailable:offer-204"])
    expect(snapshot).toMatchObject({
      partialReadinessKeys: ["offer-follow-up-activity-readiness:offer-204:rfq-204:partial"],
      recordCount: 1,
      statusCounts: {
        partial: 1,
      },
    })
  })

  it("rejects malformed Convex query records before snapshot hydration", async () => {
    const fallback = createLocalOfferFollowUpActivityReadinessReader()
    const errors: string[] = []
    const reader = createConvexOfferFollowUpActivityReadinessReader({
      fallback,
      onQueryError: (error) => {
        errors.push(error instanceof Error ? error.message : String(error))
      },
      queryRef: "listOfferFollowUpActivityReadiness",
      runQuery: async () => [
        {
          ...readinessPayload(),
          recordedFollowUpTaskIds: undefined,
        },
      ],
    })

    const snapshot = await reader.listReadiness({ offerId: "offer-204" })

    expect(errors).toEqual(["record.recordedFollowUpTaskIds must be an array"])
    expect(snapshot.recordCount).toBe(0)
  })
})

function historyRecord(
  overrides: Partial<OfferFollowUpActivityReadinessHistoryRecord> = {},
): OfferFollowUpActivityReadinessHistoryRecord {
  return {
    offerId: "offer-204",
    readiness: readinessRecorded(),
    readinessKey: "offer-follow-up-activity-readiness:offer-204:rfq-204:recorded",
    recordedAt: "2026-07-03T07:10:00.000Z",
    rfqId: "rfq-204",
    ...overrides,
  }
}

function readinessRecorded(): OfferFollowUpActivityReadiness {
  return buildOfferFollowUpActivityReadiness({
    expectedFollowUpTaskIds: ["follow-first", "follow-later"],
    summary: followUpSummary([
      followUpRecord({
        message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
      }),
      followUpRecord({
        _id: "activity-later",
        createdAt: 200,
        message: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
      }),
    ]),
  })
}

function readinessPartial(): OfferFollowUpActivityReadiness {
  return buildOfferFollowUpActivityReadiness({
    expectedFollowUpTaskIds: ["follow-first", "follow-later", "follow-final"],
    summary: followUpSummary([
      followUpRecord({
        message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
      }),
      followUpRecord({
        _id: "activity-later",
        createdAt: 200,
        message: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
      }),
    ]),
  })
}

function readinessPayload(
  overrides: Partial<ReturnType<typeof createPayload>> = {},
): ReturnType<typeof createPayload> {
  return createPayload(overrides)
}

function createPayload(
  overrides: Partial<ConvexOfferFollowUpActivityReadinessPayload> = {},
): ConvexOfferFollowUpActivityReadinessPayload {
  const source = overrides.status === "partial" ? readinessPartial() : readinessRecorded()
  return {
    expectedFollowUpTaskIds: [...(overrides.expectedFollowUpTaskIds ?? source.expectedFollowUpTaskIds)],
    expectedTaskCount: overrides.expectedTaskCount ?? source.expectedTaskCount,
    ...(overrides.latestActivityMessage ?? source.latestActivityMessage
      ? { latestActivityMessage: overrides.latestActivityMessage ?? source.latestActivityMessage }
      : {}),
    missingFollowUpTaskIds: [...(overrides.missingFollowUpTaskIds ?? source.missingFollowUpTaskIds)],
    missingTaskCount: overrides.missingTaskCount ?? source.missingTaskCount,
    nextActions: [...(overrides.nextActions ?? source.nextActions)],
    offerId: overrides.offerId ?? "offer-204",
    readinessHistoryVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
    readinessKey: overrides.readinessKey ?? "offer-follow-up-activity-readiness:offer-204:rfq-204:recorded",
    readinessVersion: source.readinessVersion,
    recordedAt: overrides.recordedAt ?? "2026-07-03T07:10:00.000Z",
    recordedFollowUpTaskIds: [...(overrides.recordedFollowUpTaskIds ?? source.recordedFollowUpTaskIds)],
    recordedTaskCount: overrides.recordedTaskCount ?? source.recordedTaskCount,
    rfqId: overrides.rfqId ?? "rfq-204",
    status: overrides.status ?? source.status,
    totalActivities: overrides.totalActivities ?? source.totalActivities,
    unexpectedFollowUpTaskIds: [...(overrides.unexpectedFollowUpTaskIds ?? source.unexpectedFollowUpTaskIds)],
    unexpectedTaskCount: overrides.unexpectedTaskCount ?? source.unexpectedTaskCount,
    unmatchedActivityCount: overrides.unmatchedActivityCount ?? source.unmatchedActivityCount,
  }
}

function followUpSummary(records: ConvexOfferFollowUpActivityRecord[]) {
  return summarizeOfferFollowUpActivities(records, { offerId: "convex-offer-204" })
}

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
