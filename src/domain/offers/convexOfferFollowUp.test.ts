import { describe, expect, it } from "vitest"

import { buildOfferFollowUpCalendarPlan } from "../integrations/calendarRfq"
import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import { buildCncOfferDraft } from "./offer"
import {
  buildConvexOfferFollowUpActivityPayloads,
  type ConvexOfferFollowUpActivityPayload,
} from "./convexOfferFollowUp"
import { buildOfferLifecycleTimeline, type OfferLifecycleTimeline } from "./offerLifecycle"

const offer = buildCncOfferDraft({
  customer: {
    contactName: "Nora Buyer",
    email: "nora@example.test",
    name: "North Forge",
  },
  issuedAt: "2026-06-20",
  offerNumber: "OFFER-204",
  quote: calculateCncQuote(aluminumBracketFixture),
  rfqReference: "rfq-204",
  subject: "Aluminum bracket production batch",
  validUntil: "2026-07-04",
})

describe("Convex offer follow-up persistence", () => {
  it("builds deterministic Convex activity payloads for open lifecycle follow-ups", () => {
    const timeline = followUpTimeline()
    const calendarPlan = buildOfferFollowUpCalendarPlan({
      customerName: "North Forge",
      offerId: "offer-204",
      timeline,
      timezone: "Europe/Helsinki",
    })

    expect(
      buildConvexOfferFollowUpActivityPayloads(timeline, {
        actorName: " Sari ",
        calendarPlan,
        offerId: " convex-offer-204 ",
        quoteId: " convex-quote-204 ",
        rfqId: " convex-rfq-204 ",
      }),
    ).toEqual<ConvexOfferFollowUpActivityPayload[]>([
      {
        actorName: "Sari",
        message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z. Calendar: Follow up: OFFER-204.",
        offerId: "convex-offer-204",
        quoteId: "convex-quote-204",
        rfqId: "convex-rfq-204",
      },
      {
        actorName: "Sari",
        message: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z. Calendar: Follow up: OFFER-204.",
        offerId: "convex-offer-204",
        quoteId: "convex-quote-204",
        rfqId: "convex-rfq-204",
      },
    ])
  })

  it("skips already recorded task ids while still validating top-level ids", () => {
    const timeline = followUpTimeline()

    expect(
      buildConvexOfferFollowUpActivityPayloads(timeline, {
        offerId: "convex-offer-204",
        recordedFollowUpTaskIds: ["follow-first"],
      }),
    ).toEqual([
      {
        message: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
        offerId: "convex-offer-204",
      },
    ])

    expect(() =>
      buildConvexOfferFollowUpActivityPayloads(timeline, {
        offerId: " ",
        recordedFollowUpTaskIds: ["follow-first", "follow-later"],
      }),
    ).toThrow("offerId is required")
  })

  it("rejects unsafe follow-up task and calendar metadata", () => {
    const timeline = followUpTimeline()
    const calendarPlan = buildOfferFollowUpCalendarPlan({
      customerName: "North Forge",
      offerId: "offer-204",
      timeline,
      timezone: "Europe/Helsinki",
    })

    expect(() =>
      buildConvexOfferFollowUpActivityPayloads(timeline, {
        calendarPlan: {
          ...calendarPlan,
          events: [calendarPlan.events[0]!, calendarPlan.events[0]!],
        },
        offerId: "convex-offer-204",
      }),
    ).toThrow("duplicate calendar event for follow-up task follow-first")

    expect(() =>
      buildConvexOfferFollowUpActivityPayloads(timeline, {
        calendarPlan: {
          ...calendarPlan,
          events: [
            {
              ...calendarPlan.events[0]!,
              metadata: {
                ...calendarPlan.events[0]!.metadata,
                followUpTaskId: " ",
              },
            },
          ],
        },
        offerId: "convex-offer-204",
      }),
    ).toThrow("calendarPlan.events[0].metadata.followUpTaskId is required")

    expect(() =>
      buildConvexOfferFollowUpActivityPayloads(
        {
          ...timeline,
          followUpTasks: timeline.followUpTasks.map((task) =>
            task.id === "follow-later"
              ? {
                  ...task,
                  offerNumber: "OFFER-999",
                }
              : task,
          ),
        },
        {
          offerId: "convex-offer-204",
        },
      ),
    ).toThrow("follow-up task follow-later offerNumber OFFER-999 does not match OFFER-204")

    expect(() =>
      buildConvexOfferFollowUpActivityPayloads(timeline, {
        offerId: "convex-offer-204",
        recordedFollowUpTaskIds: [" "],
      }),
    ).toThrow("recordedFollowUpTaskIds[0] is required")
  })
})

function followUpTimeline(): OfferLifecycleTimeline {
  return buildOfferLifecycleTimeline(offer, [
    {
      actor: "sales",
      kind: "sent",
      occurredAt: "2026-06-20T09:00:00+03:00",
    },
    {
      actor: "sales",
      followUpDueAt: "2026-07-03T10:00:00+03:00",
      followUpTaskId: "follow-later",
      kind: "follow_up_scheduled",
      occurredAt: "2026-06-20T09:05:00+03:00",
    },
    {
      actor: "sales",
      followUpDueAt: "2026-07-02T10:00:00+03:00",
      followUpTaskId: "follow-first",
      kind: "follow_up_scheduled",
      occurredAt: "2026-06-20T09:06:00+03:00",
    },
    {
      actor: "sales",
      followUpDueAt: "2026-06-27T10:00:00+03:00",
      followUpTaskId: "follow-done",
      kind: "follow_up_scheduled",
      occurredAt: "2026-06-20T09:07:00+03:00",
    },
    {
      actor: "sales",
      followUpTaskId: "follow-done",
      kind: "follow_up_completed",
      occurredAt: "2026-06-27T11:00:00+03:00",
    },
  ])
}
