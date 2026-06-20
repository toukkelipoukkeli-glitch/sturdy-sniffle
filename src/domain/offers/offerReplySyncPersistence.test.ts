import { describe, expect, it } from "vitest"

import type { GmailOfferReplyRecord, GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import {
  createConvexOfferReplySyncPersistence,
  createLocalOfferReplySyncPersistence,
} from "./offerReplySyncPersistence"

describe("offer reply sync persistence", () => {
  it("keeps a deterministic local snapshot and skips already recorded messages", async () => {
    const adapter = createLocalOfferReplySyncPersistence({
      payloadOptions: {
        actorName: "Reply sync",
        offerId: "offer-019",
        quoteId: "quote-019",
        rfqId: "rfq-019",
      },
    })

    const first = await adapter.recordSync(syncResult([replyRecord({ id: "reply-accepted", signal: "accepted" })]))
    const second = await adapter.recordSync(syncResult([replyRecord({ id: "reply-accepted", signal: "accepted" })]))

    expect(first.recordedMessageIds).toEqual(["reply-accepted"])
    expect(first.payloads[0]?.statusTransitions).toEqual([{ status: "accepted" }])
    expect(second).toMatchObject({
      recordedMessageIds: ["reply-accepted"],
      syncCount: 2,
    })
    expect(second.payloads[1]?.activities).toEqual([
      {
        actorName: "Reply sync",
        kind: "note",
        message: "Offer reply sync succeeded for OFFER-019 recorded no new messages.",
      },
    ])
  })

  it("routes offer reply sync payloads through the configured Convex mutation", async () => {
    const calls: Array<{ args: Record<string, unknown>; mutationRef: unknown }> = []
    const adapter = createConvexOfferReplySyncPersistence({
      mutationRef: "recordOfferReplySync",
      payloadOptions: {
        actorName: "Reply sync",
        offerId: "convex-offer-019",
        quoteId: "convex-quote-019",
        rfqId: "convex-rfq-019",
      },
      runMutation: async (mutationRef, args) => {
        calls.push({ args, mutationRef })
      },
    })

    const snapshot = await adapter.recordSync(syncResult([replyRecord({ id: "reply-declined", signal: "declined" })]))

    expect(calls).toEqual([
      {
        mutationRef: "recordOfferReplySync",
        args: {
          activities: [
            {
              actorName: "Reply sync",
              kind: "email_received",
              message: "Synced Gmail offer reply thread-replies:reply-declined for OFFER-019: declined.",
            },
          ],
          offerId: "convex-offer-019",
          quoteId: "convex-quote-019",
          rfqId: "convex-rfq-019",
          statusTransitions: [
            {
              status: "declined",
            },
          ],
        },
      },
    ])
    expect(snapshot.recordedMessageIds).toEqual(["reply-declined"])
  })

  it("keeps the local fallback hot when Convex persistence fails", async () => {
    const errors: string[] = []
    const adapter = createConvexOfferReplySyncPersistence({
      mutationRef: "recordOfferReplySync",
      onSyncError: (error, payload) => {
        errors.push(`${error instanceof Error ? error.message : String(error)}:${payload.offerId}`)
      },
      payloadOptions: {
        offerId: "convex-offer-019",
      },
      runMutation: async () => {
        throw new Error("Convex unavailable")
      },
    })

    const snapshot = await adapter.recordSync(syncResult([replyRecord({ id: "reply-accepted", signal: "accepted" })]))

    expect(errors).toEqual(["Convex unavailable:convex-offer-019"])
    expect(snapshot).toMatchObject({
      recordedMessageIds: ["reply-accepted"],
      syncCount: 1,
    })
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
  id,
  receivedAt = "2026-06-25T13:00:00+03:00",
  signal,
}: {
  id: string
  receivedAt?: string
  signal: "accepted" | "declined"
}): GmailOfferReplyRecord {
  return {
    message: {
      id,
      receivedAt,
      subject: "Re: OFFER-019",
      threadId: "thread-replies",
    },
    parsed: {
      adapterVersion: "gmail-offer-reply.v1",
      event: {
        actor: "customer",
        kind: signal,
        occurredAt: receivedAt,
      },
      matched: true,
      messageId: id,
      offerNumber: "OFFER-019",
      signal,
      threadId: "thread-replies",
      warnings: [],
    },
  }
}
