import { describe, expect, it } from "vitest"

import { summarizeOfferFollowUpActivities, type ConvexOfferFollowUpActivityRecord } from "./offerFollowUpActivityReadPersistence"
import {
  buildOfferFollowUpActivityReadiness,
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
  type OfferFollowUpActivityReadiness,
} from "./offerFollowUpActivityReadiness"
import {
  summarizeOfferFollowUpActivityReadinessSync,
  summarizeOfferFollowUpActivityReadinessHistory,
  type OfferFollowUpActivityReadinessHistoryRecord,
} from "./offerFollowUpActivityReadinessHistory"

describe("offer follow-up activity readiness history", () => {
  it("summarizes readiness records and selects the requested current key", () => {
    const summary = summarizeOfferFollowUpActivityReadinessHistory(historyRecords(), "readiness:offer-204:recorded")

    expect(summary).toEqual({
      currentReadiness: {
        expectedTaskCount: 2,
        missingTaskCount: 0,
        nextActionCount: 1,
        offerId: "offer-204",
        readinessKey: "readiness:offer-204:recorded",
        readinessVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
        recordedAt: "2026-07-03T07:10:00.000Z",
        recordedTaskCount: 2,
        rfqId: "rfq-204",
        status: "recorded",
        totalActivities: 2,
        unexpectedTaskCount: 0,
        unmatchedActivityCount: 0,
      },
      historyVersion: "offer-follow-up-activity-readiness-history.v1",
      latestRecordedAt: "2026-07-03T07:10:00.000Z",
      missingTaskTotal: 1,
      partialRecordCount: 1,
      pendingRecordCount: 1,
      recordedRecordCount: 1,
      reviewRecordCount: 1,
      statusCounts: {
        partial: 1,
        pending: 1,
        recorded: 1,
        review: 1,
      },
      totalReadinessRecords: 4,
      unexpectedTaskTotal: 1,
      unmatchedActivityTotal: 0,
    })
  })

  it("returns an empty deterministic summary when no readiness records exist", () => {
    expect(summarizeOfferFollowUpActivityReadinessHistory(undefined, "readiness:missing")).toEqual({
      currentReadiness: undefined,
      historyVersion: "offer-follow-up-activity-readiness-history.v1",
      latestRecordedAt: undefined,
      missingTaskTotal: 0,
      partialRecordCount: 0,
      pendingRecordCount: 0,
      recordedRecordCount: 0,
      reviewRecordCount: 0,
      statusCounts: {},
      totalReadinessRecords: 0,
      unexpectedTaskTotal: 0,
      unmatchedActivityTotal: 0,
    })
  })

  it("summarizes local fallback readiness sync records", () => {
    expect(
      summarizeOfferFollowUpActivityReadinessSync({
        currentReadinessKey: "readiness:offer-204:pending",
        localOfferId: "offer-204",
        localRfqId: "rfq-204",
        records: [
          historyRecord({
            readiness: readinessPending(),
            readinessKey: "readiness:offer-204:pending",
          }),
        ],
      }),
    ).toEqual({
      convexRecordCount: 0,
      currentSource: "local",
      localRecordCount: 1,
      mode: "local",
      otherRecordCount: 0,
      totalReadinessRecords: 1,
    })
  })

  it("summarizes mixed Convex and local readiness sync records after dedupe", () => {
    expect(
      summarizeOfferFollowUpActivityReadinessSync({
        convexOfferId: "convex-offer-204",
        convexRfqId: "convex-rfq-204",
        currentReadinessKey: "readiness:convex-recorded",
        localOfferId: "offer-204",
        localRfqId: "rfq-204",
        records: [
          historyRecord({
            readiness: readinessPending(),
            readinessKey: "readiness:local-pending",
          }),
          historyRecord({
            offerId: "convex-offer-204",
            readiness: readinessRecorded(),
            readinessKey: "readiness:convex-recorded",
            rfqId: "convex-rfq-204",
          }),
          historyRecord({
            offerId: "convex-offer-204",
            readiness: readinessPartial(),
            readinessKey: "readiness:convex-recorded",
            rfqId: "convex-rfq-204",
          }),
          historyRecord({
            offerId: "legacy-offer-204",
            readiness: readinessReview(),
            readinessKey: "readiness:legacy-review",
            rfqId: "legacy-rfq-204",
          }),
        ],
      }),
    ).toEqual({
      convexRecordCount: 1,
      currentSource: "convex",
      localRecordCount: 1,
      mode: "mixed",
      otherRecordCount: 1,
      totalReadinessRecords: 3,
    })
  })

  it("dedupes repeated readiness keys with the last record winning", () => {
    const summary = summarizeOfferFollowUpActivityReadinessHistory([
      historyRecord({
        readiness: readinessPartial(),
        readinessKey: "readiness:offer-204:coverage",
        recordedAt: "2026-07-03T07:00:00.000Z",
      }),
      historyRecord({
        readiness: readinessRecorded(),
        readinessKey: "readiness:offer-204:coverage",
        recordedAt: "2026-07-03T07:20:00.000Z",
      }),
    ])

    expect(summary).toMatchObject({
      currentReadiness: {
        readinessKey: "readiness:offer-204:coverage",
        status: "recorded",
      },
      partialRecordCount: 0,
      recordedRecordCount: 1,
      totalReadinessRecords: 1,
    })
  })

  it("uses the newest record as the fallback current readiness", () => {
    const summary = summarizeOfferFollowUpActivityReadinessHistory([...historyRecords()].reverse())

    expect(summary.currentReadiness).toMatchObject({
      readinessKey: "readiness:offer-204:recorded",
      status: "recorded",
    })
  })

  it("rejects malformed readiness history records", () => {
    expect(() =>
      summarizeOfferFollowUpActivityReadinessHistory([
        historyRecord({
          readinessKey: " ",
        }),
      ]),
    ).toThrow("record.readinessKey is required")

    expect(() =>
      summarizeOfferFollowUpActivityReadinessHistory([
        historyRecord({
          recordedAt: "not-a-date",
        }),
      ]),
    ).toThrow("record.recordedAt must be a valid date string")

    expect(() =>
      summarizeOfferFollowUpActivityReadinessHistory([
        historyRecord({
          readiness: {
            ...readinessRecorded(),
            recordedTaskCount: 99,
          },
        }),
      ]),
    ).toThrow("readiness.recordedFollowUpTaskIds length must match its count")

    expect(() =>
      summarizeOfferFollowUpActivityReadinessHistory([
        historyRecord({
          readiness: {
            ...readinessRecorded(),
            readinessVersion: "unsupported" as never,
          },
        }),
      ]),
    ).toThrow("follow-up activity readiness history version is not supported")
  })
})

function historyRecords(): OfferFollowUpActivityReadinessHistoryRecord[] {
  return [
    historyRecord({
      readiness: readinessPending(),
      readinessKey: "readiness:offer-204:pending",
      recordedAt: "2026-07-03T07:00:00.000Z",
    }),
    historyRecord({
      readiness: readinessPartial(),
      readinessKey: "readiness:offer-204:partial",
      recordedAt: "2026-07-03T07:05:00.000Z",
    }),
    historyRecord({
      readiness: readinessReview(),
      readinessKey: "readiness:offer-204:review",
      recordedAt: "2026-07-03T07:08:00.000Z",
    }),
    historyRecord({
      readiness: readinessRecorded(),
      readinessKey: "readiness:offer-204:recorded",
      recordedAt: "2026-07-03T07:10:00.000Z",
    }),
  ]
}

function historyRecord(
  overrides: Partial<OfferFollowUpActivityReadinessHistoryRecord> = {},
): OfferFollowUpActivityReadinessHistoryRecord {
  return {
    offerId: "offer-204",
    readiness: readinessRecorded(),
    readinessKey: "readiness:offer-204:recorded",
    recordedAt: "2026-07-03T07:10:00.000Z",
    rfqId: "rfq-204",
    ...overrides,
  }
}

function readinessPending(): OfferFollowUpActivityReadiness {
  return buildOfferFollowUpActivityReadiness({
    summary: summarizeOfferFollowUpActivities([], { offerId: "convex-offer-204" }),
  })
}

function readinessPartial(): OfferFollowUpActivityReadiness {
  return buildOfferFollowUpActivityReadiness({
    expectedFollowUpTaskIds: ["follow-first", "follow-later"],
    summary: followUpSummary([
      followUpRecord({
        message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
      }),
    ]),
  })
}

function readinessReview(): OfferFollowUpActivityReadiness {
  return buildOfferFollowUpActivityReadiness({
    expectedFollowUpTaskIds: ["follow-first"],
    summary: followUpSummary([
      followUpRecord({
        message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
      }),
      followUpRecord({
        _id: "activity-extra",
        createdAt: 200,
        message: "Scheduled offer follow-up follow-extra for OFFER-204 at 2026-07-04T07:00:00.000Z.",
      }),
    ]),
  })
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
