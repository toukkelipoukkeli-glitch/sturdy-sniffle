import { describe, expect, it } from "vitest"

import {
  buildConvexOfferFollowUpActivityReadinessPayload,
  buildOfferFollowUpActivityReadinessHistoryRecordFromConvex,
  type ConvexOfferFollowUpActivityReadinessPayload,
} from "./convexOfferFollowUpActivityReadiness"
import { summarizeOfferFollowUpActivities, type ConvexOfferFollowUpActivityRecord } from "./offerFollowUpActivityReadPersistence"
import {
  buildOfferFollowUpActivityReadiness,
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
  type OfferFollowUpActivityReadiness,
} from "./offerFollowUpActivityReadiness"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
  type OfferFollowUpActivityReadinessHistoryRecord,
} from "./offerFollowUpActivityReadinessHistory"

describe("convex offer follow-up activity readiness payload", () => {
  it("maps readiness history records into deterministic Convex payloads", () => {
    expect(buildConvexOfferFollowUpActivityReadinessPayload(historyRecord())).toEqual<ConvexOfferFollowUpActivityReadinessPayload>({
      expectedFollowUpTaskIds: ["follow-first", "follow-later"],
      expectedTaskCount: 2,
      latestActivityMessage: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
      missingFollowUpTaskIds: [],
      missingTaskCount: 0,
      nextActions: ["Persisted follow-up activity coverage is complete."],
      offerId: "offer-204",
      readinessHistoryVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
      readinessKey: "offer-follow-up-activity-readiness:offer-204:rfq-204:recorded",
      readinessVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
      recordedAt: "2026-07-03T07:10:00.000Z",
      recordedFollowUpTaskIds: ["follow-first", "follow-later"],
      recordedTaskCount: 2,
      rfqId: "rfq-204",
      status: "recorded",
      totalActivities: 2,
      unexpectedFollowUpTaskIds: [],
      unexpectedTaskCount: 0,
      unmatchedActivityCount: 0,
    })
  })

  it("round-trips persisted payload records with normalized optional text", () => {
    const payload = buildConvexOfferFollowUpActivityReadinessPayload({
      ...historyRecord(),
      readiness: {
        ...readinessRecorded(),
        latestActivityMessage: " ",
        nextActions: [" Persisted follow-up activity coverage is complete. "],
      },
    })

    expect(buildOfferFollowUpActivityReadinessHistoryRecordFromConvex(payload)).toEqual({
      offerId: "offer-204",
      readiness: {
        ...readinessRecorded(),
        latestActivityMessage: undefined,
        nextActions: ["Persisted follow-up activity coverage is complete."],
      },
      readinessKey: "offer-follow-up-activity-readiness:offer-204:rfq-204:recorded",
      recordedAt: "2026-07-03T07:10:00.000Z",
      rfqId: "rfq-204",
    })
  })

  it("rejects payloads with unsupported status version or malformed counts", () => {
    expect(() =>
      buildConvexOfferFollowUpActivityReadinessPayload({
        ...historyRecord(),
        readiness: {
          ...readinessRecorded(),
          readinessVersion: "unsupported" as never,
        },
      }),
    ).toThrow("follow-up activity readiness history version is not supported")

    expect(() =>
      buildOfferFollowUpActivityReadinessHistoryRecordFromConvex({
        ...buildConvexOfferFollowUpActivityReadinessPayload(historyRecord()),
        status: "blocked" as never,
      }),
    ).toThrow("follow-up activity readiness status is not supported")

    expect(() =>
      buildOfferFollowUpActivityReadinessHistoryRecordFromConvex({
        ...buildConvexOfferFollowUpActivityReadinessPayload(historyRecord()),
        recordedTaskCount: 99,
      }),
    ).toThrow("readiness.recordedFollowUpTaskIds length must match its count")
  })

  it("rejects blank task ids before future workflow writes", () => {
    expect(() =>
      buildOfferFollowUpActivityReadinessHistoryRecordFromConvex({
        ...buildConvexOfferFollowUpActivityReadinessPayload(historyRecord()),
        recordedFollowUpTaskIds: [" "],
        recordedTaskCount: 1,
      }),
    ).toThrow("record.recordedFollowUpTaskIds[0] is required")
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
