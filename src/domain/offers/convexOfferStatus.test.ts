import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { buildCncOfferDraft } from "./offer"
import {
  buildConvexOfferStatusTransitionPayload,
  buildConvexOfferStatusTransitionPayloads,
  type ConvexOfferStatusTransitionPayload,
} from "./convexOfferStatus"
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

describe("Convex offer status persistence", () => {
  it("maps lifecycle status changes to deterministic Convex transition payloads", () => {
    const timeline = buildOfferLifecycleTimeline(offer, [
      sentEvent(),
      {
        actor: "customer",
        kind: "accepted",
        note: " Approved by purchasing. ",
        occurredAt: "2026-06-25T12:00:00+03:00",
      },
    ])

    expect(
      buildConvexOfferStatusTransitionPayloads(timeline, {
        offerId: " convex-offer-019 ",
      }),
    ).toEqual<ConvexOfferStatusTransitionPayload[]>([
      {
        message: "Sent by email.",
        offerId: "convex-offer-019",
        status: "sent",
      },
      {
        message: "Approved by purchasing.",
        offerId: "convex-offer-019",
        status: "accepted",
      },
    ])
  })

  it("builds only the status transitions that Convex still needs", () => {
    const timeline = buildOfferLifecycleTimeline(offer, [
      sentEvent(),
      {
        actor: "customer",
        kind: "declined",
        occurredAt: "2026-06-25T12:00:00+03:00",
      },
    ])

    expect(
      buildConvexOfferStatusTransitionPayloads(timeline, {
        currentStatus: "sent",
        offerId: "convex-offer-019",
      }),
    ).toEqual([
      {
        offerId: "convex-offer-019",
        status: "declined",
      },
    ])

    expect(
      buildConvexOfferStatusTransitionPayloads(timeline, {
        currentStatus: "declined",
        offerId: "convex-offer-019",
      }),
    ).toEqual([])
  })

  it("ignores lifecycle events that do not change persisted offer status", () => {
    const timeline = buildOfferLifecycleTimeline(offer, [
      sentEvent(),
      {
        actor: "sales",
        followUpDueAt: "2026-06-24T09:00:00+03:00",
        followUpTaskId: "fu-001",
        kind: "follow_up_scheduled",
        occurredAt: "2026-06-20T09:05:00+03:00",
      },
      {
        actor: "sales",
        followUpTaskId: "fu-001",
        kind: "follow_up_completed",
        occurredAt: "2026-06-24T09:30:00+03:00",
      },
    ])

    expect(buildConvexOfferStatusTransitionPayload(timeline.events[1]!, { offerId: "convex-offer-019" })).toBeUndefined()
    expect(buildConvexOfferStatusTransitionPayloads(timeline, { offerId: "convex-offer-019" })).toEqual([
      {
        message: "Sent by email.",
        offerId: "convex-offer-019",
        status: "sent",
      },
    ])
  })

  it("rejects unsafe persisted status reconciliation", () => {
    const timeline = buildOfferLifecycleTimeline(offer, [
      sentEvent(),
      {
        actor: "customer",
        kind: "accepted",
        occurredAt: "2026-06-25T12:00:00+03:00",
      },
    ])

    expect(() =>
      buildConvexOfferStatusTransitionPayloads(timeline, {
        currentStatus: "declined",
        offerId: "convex-offer-019",
      }),
    ).toThrow("current status declined is not represented in lifecycle OFFER-019")

    expect(() =>
      buildConvexOfferStatusTransitionPayloads(timeline, {
        currentStatus: "queued" as never,
        offerId: "convex-offer-019",
      }),
    ).toThrow("currentStatus is not a supported offer status")
  })

  it("rejects lifecycle events whose resulting status does not match their status-changing kind", () => {
    const timeline = buildOfferLifecycleTimeline(offer, [sentEvent()])
    const invalidTimeline = {
      ...timeline,
      events: [
        {
          ...timeline.events[0]!,
          statusAfter: "draft" as const,
        },
      ],
    }

    expect(() => buildConvexOfferStatusTransitionPayloads(invalidTimeline, { offerId: "convex-offer-019" })).toThrow(
      "lifecycle event OFFER-019:event-1 statusAfter must be sent",
    )
  })
})

function sentEvent(): OfferLifecycleEventInput {
  return {
    actor: "sales",
    kind: "sent",
    note: " Sent by email. ",
    occurredAt: "2026-06-20T09:00:00+03:00",
  }
}
