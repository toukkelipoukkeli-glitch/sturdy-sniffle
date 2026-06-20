import { describe, expect, it } from "vitest"

import type { GmailOfferReplyRecord, GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildConvexOfferReplySyncPayload, type ConvexOfferReplySyncPayload } from "./convexOfferReply"

describe("Convex offer reply persistence", () => {
  it("builds deterministic activity and status transition payloads from matched replies", () => {
    const payload = buildConvexOfferReplySyncPayload(
      syncResult([
        replyRecord({
          eventKind: "follow_up_completed",
          followUpTaskId: "follow-up-019",
          id: "reply-follow-up",
          receivedAt: "2026-06-25T13:05:00+03:00",
          signal: "follow_up_completed",
        }),
        replyRecord({
          eventKind: "accepted",
          id: "reply-accepted",
          note: "Customer accepted reply: Please proceed.",
          receivedAt: "2026-06-25T13:00:00+03:00",
          signal: "accepted",
        }),
        replyRecord({
          id: "reply-ignored",
          matched: false,
          receivedAt: "2026-06-25T13:10:00+03:00",
          warnings: ["Message reply-ignored does not mention offer OFFER-019."],
        }),
      ]),
      {
        actorName: " FactoryBid replies ",
        offerId: " convex-offer-019 ",
        quoteId: " convex-quote-019 ",
        rfqId: " convex-rfq-019 ",
      },
    )

    expect(payload).toEqual<ConvexOfferReplySyncPayload>({
      activities: [
        {
          actorName: "FactoryBid replies",
          kind: "email_received",
          message: "Synced Gmail offer reply thread-replies:reply-accepted for OFFER-019: accepted.",
        },
        {
          actorName: "FactoryBid replies",
          kind: "email_received",
          message: "Synced Gmail offer reply thread-replies:reply-follow-up for OFFER-019: follow up completed.",
        },
        {
          actorName: "FactoryBid replies",
          kind: "note",
          message: "Ignored Gmail offer reply thread-replies:reply-ignored for OFFER-019: no lifecycle signal matched.",
        },
      ],
      appliedMessageIds: ["reply-accepted", "reply-follow-up"],
      ignoredMessageIds: ["reply-ignored"],
      offerId: "convex-offer-019",
      quoteId: "convex-quote-019",
      rfqId: "convex-rfq-019",
      statusTransitions: [
        {
          message: "Customer accepted reply: Please proceed.",
          status: "accepted",
        },
      ],
      warnings: ["Message reply-ignored does not mention offer OFFER-019."],
    })
  })

  it("skips already recorded messages and records an explicit no-op activity", () => {
    const payload = buildConvexOfferReplySyncPayload(syncResult([replyRecord({ id: "reply-accepted", signal: "accepted" })]), {
      offerId: "convex-offer-019",
      recordedMessageIds: ["reply-accepted"],
    })

    expect(payload.activities).toEqual([
      {
        actorName: "Gmail offer reply sync",
        kind: "note",
        message: "Offer reply sync succeeded for OFFER-019 recorded no new messages.",
      },
    ])
    expect(payload.appliedMessageIds).toEqual([])
    expect(payload.statusTransitions).toEqual([])
  })

  it("rejects conflicting accepted and declined reply signals", () => {
    expect(() =>
      buildConvexOfferReplySyncPayload(
        syncResult([
          replyRecord({ eventKind: "accepted", id: "reply-accepted", signal: "accepted" }),
          replyRecord({ eventKind: "declined", id: "reply-declined", receivedAt: "2026-06-25T13:05:00+03:00", signal: "declined" }),
        ]),
        {
          offerId: "convex-offer-019",
        },
      ),
    ).toThrow("offer reply sync has conflicting accepted and declined signals")
  })

  it("validates required persistence identifiers", () => {
    expect(() =>
      buildConvexOfferReplySyncPayload(syncResult([]), {
        offerId: " ",
      }),
    ).toThrow("offerId is required")

    expect(() =>
      buildConvexOfferReplySyncPayload(syncResult([]), {
        offerId: "convex-offer-019",
        recordedMessageIds: [" "],
      }),
    ).toThrow("recordedMessageIds[0] is required")
  })
})

function syncResult(records: GmailOfferReplyRecord[]): GmailOfferReplySyncResult {
  return {
    adapterVersion: "gmail-offer-reply.v1",
    offerNumber: "OFFER-019",
    provider: "gmail",
    query: "offer OFFER-019",
    records,
    status: "succeeded",
    warnings: [],
  }
}

function replyRecord({
  eventKind = "accepted",
  followUpTaskId,
  id,
  matched = true,
  note,
  receivedAt = "2026-06-25T13:00:00+03:00",
  signal,
  warnings = [],
}: {
  id: string
  eventKind?: "accepted" | "declined" | "follow_up_completed" | "note_added"
  followUpTaskId?: string
  matched?: boolean
  note?: string
  receivedAt?: string
  signal?: "accepted" | "declined" | "follow_up_completed" | "note_added"
  warnings?: string[]
}): GmailOfferReplyRecord {
  return {
    message: {
      id,
      plainText: note,
      receivedAt,
      subject: "Re: OFFER-019",
      threadId: "thread-replies",
    },
    parsed: {
      adapterVersion: "gmail-offer-reply.v1",
      ...(matched
        ? {
            event: {
              actor: "customer",
              kind: eventKind,
              ...(followUpTaskId ? { followUpTaskId } : {}),
              ...(note ? { note } : {}),
              occurredAt: receivedAt,
            },
            signal: signal ?? eventKind,
          }
        : {}),
      matched,
      messageId: id,
      offerNumber: "OFFER-019",
      threadId: "thread-replies",
      warnings,
    },
  }
}
