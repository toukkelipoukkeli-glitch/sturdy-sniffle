import { describe, expect, it } from "vitest"

import { rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { calculateCncQuote } from "../quoting/cnc"
import { buildCncOfferDraft } from "./offer"
import {
  buildConvexOfferStatusTransitionPayload,
  buildConvexOfferStatusTransitionPayloads,
  type ConvexOfferStatusTransitionPayload,
} from "./convexOfferStatus"
import { buildOfferLifecycleTimeline, type OfferLifecycleEvent } from "./offerLifecycle"

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

describe("convex offer status persistence", () => {
  it("maps status-changing lifecycle events to Convex transition payloads", () => {
    const timeline = buildOfferLifecycleTimeline(offer, [
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
    ])

    expect(buildConvexOfferStatusTransitionPayloads(timeline, { offerId: "convex-offer-019" })).toEqual<
      ConvexOfferStatusTransitionPayload[]
    >([
      {
        message: "Sent by email.",
        offerId: "convex-offer-019",
        status: "sent",
      },
      {
        offerId: "convex-offer-019",
        status: "accepted",
      },
    ])
  })

  it("skips lifecycle events that do not change offer status", () => {
    expect(
      buildConvexOfferStatusTransitionPayload(
        lifecycleEvent({
          kind: "note_added",
          note: "Customer asked for technical drawings.",
          statusAfter: "sent",
        }),
        { offerId: "convex-offer-019" },
      ),
    ).toBeUndefined()
  })

  it("rejects unsafe Convex transition inputs", () => {
    expect(() =>
      buildConvexOfferStatusTransitionPayload(
        lifecycleEvent({
          kind: "accepted",
          statusAfter: "sent",
        }),
        { offerId: "convex-offer-019" },
      ),
    ).toThrow("lifecycle event OFFER-019:event-99 statusAfter must be accepted")

    expect(() =>
      buildConvexOfferStatusTransitionPayload(lifecycleEvent(), {
        offerId: " ",
      }),
    ).toThrow("offerId is required")
  })
})

function lifecycleEvent(overrides: Partial<OfferLifecycleEvent> = {}): OfferLifecycleEvent {
  return {
    actor: "sales",
    key: "OFFER-019:event-99",
    kind: "sent",
    occurredAt: "2026-06-20T06:00:00.000Z",
    statusAfter: "sent",
    ...overrides,
  }
}
