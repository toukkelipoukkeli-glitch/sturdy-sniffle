import { describe, expect, it } from "vitest"

import { rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { calculateCncQuote } from "../quoting/cnc"
import { buildCncOfferDraft } from "./offer"
import { buildOfferLifecycleTimeline, type OfferLifecycleEventInput } from "./offerLifecycle"

const offer = buildCncOfferDraft({
  customer: {
    contactName: "Mikael Laine",
    name: "Baltic Hydraulics",
  },
  issuedAt: "2026-06-19",
  offerNumber: "OFFER-019",
  quote: calculateCncQuote(rushTurnedSpacerFixture),
  validUntil: "2026-07-03",
})

describe("offer lifecycle", () => {
  it("sorts lifecycle events and tracks completed follow-up tasks", () => {
    const events: OfferLifecycleEventInput[] = [
      {
        actor: "sales",
        kind: "follow_up_completed",
        occurredAt: "2026-06-24T09:30:00+03:00",
        followUpTaskId: "fu-001",
        note: "Customer confirmed they received the offer.",
      },
      {
        actor: "sales",
        kind: "sent",
        note: "Sent by email.",
        occurredAt: "2026-06-20T09:00:00+03:00",
      },
      {
        actor: "sales",
        followUpDueAt: "2026-06-24T09:00:00+03:00",
        followUpTaskId: "fu-001",
        kind: "follow_up_scheduled",
        occurredAt: "2026-06-20T09:05:00+03:00",
      },
      {
        actor: "customer",
        kind: "accepted",
        occurredAt: "2026-06-25T12:00:00+03:00",
      },
    ]

    const timeline = buildOfferLifecycleTimeline(offer, events)

    expect(timeline).toMatchObject({
      lifecycleVersion: "offer-lifecycle.v1",
      offerNumber: "OFFER-019",
      status: "accepted",
    })
    expect(timeline.events.map((event) => [event.kind, event.statusAfter])).toEqual([
      ["sent", "sent"],
      ["follow_up_scheduled", "sent"],
      ["follow_up_completed", "sent"],
      ["accepted", "accepted"],
    ])
    expect(timeline.events[0]).toMatchObject({
      key: "OFFER-019:event-1",
      note: "Sent by email.",
      occurredAt: "2026-06-20T06:00:00.000Z",
    })
    expect(timeline.followUpTasks).toEqual([
      {
        completedAt: "2026-06-24T06:30:00.000Z",
        createdAt: "2026-06-20T06:05:00.000Z",
        dueAt: "2026-06-24T06:00:00.000Z",
        id: "fu-001",
        offerNumber: "OFFER-019",
        status: "completed",
        title: "Follow up OFFER-019",
      },
    ])
  })

  it("cancels open follow-up tasks when the offer reaches a terminal status", () => {
    const timeline = buildOfferLifecycleTimeline(offer, [
      {
        actor: "sales",
        kind: "sent",
        occurredAt: "2026-06-20T09:00:00+03:00",
      },
      {
        actor: "sales",
        followUpDueAt: "2026-06-24T09:00:00+03:00",
        followUpTaskId: "fu-002",
        kind: "follow_up_scheduled",
        occurredAt: "2026-06-20T09:05:00+03:00",
      },
      {
        actor: "customer",
        kind: "declined",
        note: "Budget moved to next quarter.",
        occurredAt: "2026-06-21T12:00:00+03:00",
      },
    ])

    expect(timeline.status).toBe("declined")
    expect(timeline.followUpTasks).toEqual([
      {
        cancelledAt: "2026-06-21T09:00:00.000Z",
        createdAt: "2026-06-20T06:05:00.000Z",
        dueAt: "2026-06-24T06:00:00.000Z",
        id: "fu-002",
        offerNumber: "OFFER-019",
        status: "cancelled",
        title: "Follow up OFFER-019",
      },
    ])
  })

  it("rejects invalid lifecycle transitions and follow-up task references", () => {
    expect(() =>
      buildOfferLifecycleTimeline(offer, [
        {
          actor: "customer",
          kind: "accepted",
          occurredAt: "2026-06-20T09:00:00+03:00",
        },
      ]),
    ).toThrow("accepted cannot be applied when offer status is draft")

    expect(() =>
      buildOfferLifecycleTimeline(offer, [
        {
          actor: "sales",
          kind: "sent",
          occurredAt: "2026-06-20T09:00:00+03:00",
        },
        {
          actor: "sales",
          followUpTaskId: "missing",
          kind: "follow_up_completed",
          occurredAt: "2026-06-20T10:00:00+03:00",
        },
      ]),
    ).toThrow("follow-up task missing does not exist")

    expect(() =>
      buildOfferLifecycleTimeline(offer, [
        {
          actor: "sales",
          kind: "sent",
          occurredAt: "not-a-date",
        },
      ]),
    ).toThrow("events[0].occurredAt must be a valid ISO timestamp")
  })
})
