import { describe, expect, it } from "vitest"

import { summarizeOfferFollowUpActivities, type ConvexOfferFollowUpActivityRecord } from "./offerFollowUpActivityReadPersistence"
import {
  buildOfferFollowUpActivityReadiness,
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
} from "./offerFollowUpActivityReadiness"

describe("offer follow-up activity readiness", () => {
  it("marks an empty persisted activity read as pending", () => {
    expect(
      buildOfferFollowUpActivityReadiness({
        summary: summarizeOfferFollowUpActivities([], { offerId: "convex-offer-204" }),
      }),
    ).toEqual({
      expectedFollowUpTaskIds: [],
      expectedTaskCount: 0,
      missingFollowUpTaskIds: [],
      missingTaskCount: 0,
      nextActions: ["No persisted follow-up activities have been recorded yet."],
      readinessVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
      recordedFollowUpTaskIds: [],
      recordedTaskCount: 0,
      status: "pending",
      totalActivities: 0,
      unexpectedFollowUpTaskIds: [],
      unexpectedTaskCount: 0,
      unmatchedActivityCount: 0,
    })
  })

  it("marks expected follow-up task coverage as partial until all task ids are recorded", () => {
    expect(
      buildOfferFollowUpActivityReadiness({
        expectedFollowUpTaskIds: ["follow-first", "follow-later"],
        summary: followUpSummary([
          followUpRecord({
            _id: "activity-first",
            message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
          }),
        ]),
      }),
    ).toMatchObject({
      expectedFollowUpTaskIds: ["follow-first", "follow-later"],
      missingFollowUpTaskIds: ["follow-later"],
      nextActions: ["Record 1 missing follow-up activity for follow-later."],
      recordedFollowUpTaskIds: ["follow-first"],
      status: "partial",
      totalActivities: 1,
    })
  })

  it("marks complete expected follow-up task coverage as recorded", () => {
    expect(
      buildOfferFollowUpActivityReadiness({
        expectedFollowUpTaskIds: [" follow-later ", "follow-first", "follow-first"],
        summary: followUpSummary([
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
        ]),
      }),
    ).toMatchObject({
      expectedFollowUpTaskIds: ["follow-first", "follow-later"],
      latestActivityMessage: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
      missingFollowUpTaskIds: [],
      nextActions: ["Persisted follow-up activity coverage is complete."],
      recordedFollowUpTaskIds: ["follow-first", "follow-later"],
      status: "recorded",
      unexpectedFollowUpTaskIds: [],
    })
  })

  it("asks for review when persisted activity records cannot be matched to expected task ids", () => {
    expect(
      buildOfferFollowUpActivityReadiness({
        expectedFollowUpTaskIds: ["follow-first"],
        summary: followUpSummary([
          followUpRecord({
            _id: "activity-first",
            createdAt: 200,
            message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
          }),
          followUpRecord({
            _id: "activity-extra",
            createdAt: 100,
            message: "Scheduled offer follow-up follow-extra for OFFER-204 at 2026-07-04T07:00:00.000Z.",
          }),
        ]),
      }),
    ).toMatchObject({
      nextActions: ["Review 1 unexpected follow-up task id: follow-extra."],
      status: "review",
      unexpectedFollowUpTaskIds: ["follow-extra"],
      unmatchedActivityCount: 0,
    })

    expect(
      buildOfferFollowUpActivityReadiness({
        summary: followUpSummary([
          followUpRecord({
            message: "Legacy calendar activity without a task id.",
          }),
        ]),
      }),
    ).toMatchObject({
      nextActions: ["Review 1 persisted follow-up activity message without a recognized task id."],
      status: "review",
      unmatchedActivityCount: 1,
    })

    expect(
      buildOfferFollowUpActivityReadiness({
        summary: followUpSummary([
          followUpRecord({
            _id: "activity-first",
            message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
          }),
          followUpRecord({
            _id: "activity-legacy",
            message: "Legacy calendar activity without a task id.",
          }),
        ]),
      }),
    ).toMatchObject({
      nextActions: ["Review 1 persisted follow-up activity message without a recognized task id."],
      recordedFollowUpTaskIds: ["follow-first"],
      status: "review",
      unmatchedActivityCount: 1,
    })
  })

  it("rejects malformed readiness inputs", () => {
    expect(() =>
      buildOfferFollowUpActivityReadiness({
        expectedFollowUpTaskIds: [" "],
        summary: followUpSummary([]),
      }),
    ).toThrow("expectedFollowUpTaskIds[0] is required")

    expect(() =>
      buildOfferFollowUpActivityReadiness({
        summary: {
          ...followUpSummary([]),
          readVersion: "unsupported" as never,
        },
      }),
    ).toThrow("offer follow-up activity read version is not supported")
  })
})

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
