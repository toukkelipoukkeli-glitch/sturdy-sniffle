import { describe, expect, it } from "vitest"

import { parseGmailOfferReplies, parseGmailOfferReply } from "./gmailOfferReply"
import type { GmailRfqMessage } from "./gmailRfq"

const acceptedReply: GmailRfqMessage = {
  id: "reply-001",
  threadId: "offer-thread-019",
  subject: "Re: Offer OFFER-019",
  fromHeader: '"Mikael Laine" <mikael.laine@baltic.example>',
  receivedAt: "2026-06-25T12:00:00+03:00",
  plainText: "Hello, we accept OFFER-019. Please proceed with production.",
}

describe("Gmail offer reply ingestion", () => {
  it("turns accepted customer replies into lifecycle events", () => {
    const result = parseGmailOfferReply({
      message: acceptedReply,
      offerNumber: "OFFER-019",
    })

    expect(result).toEqual({
      adapterVersion: "gmail-offer-reply.v1",
      messageId: "reply-001",
      threadId: "offer-thread-019",
      offerNumber: "OFFER-019",
      matched: true,
      signal: "accepted",
      event: {
        actor: "mikael.laine@baltic.example",
        kind: "accepted",
        occurredAt: "2026-06-25T09:00:00.000Z",
        note: "Customer accepted reply: Hello, we accept OFFER-019. Please proceed with production.",
      },
      warnings: [],
    })
  })

  it("detects declined replies before weaker acknowledgement language", () => {
    const result = parseGmailOfferReply({
      offerNumber: "OFFER-019",
      message: {
        ...acceptedReply,
        id: "reply-002",
        receivedAt: "2026-06-26T10:00:00+03:00",
        plainText: "Thanks for the quote OFFER-019, but we decline because it is too expensive.",
      },
    })

    expect(result.signal).toBe("declined")
    expect(result.event).toMatchObject({
      kind: "declined",
      occurredAt: "2026-06-26T07:00:00.000Z",
    })
  })

  it("marks follow-up tasks completed only when a known task id is present", () => {
    const result = parseGmailOfferReply({
      offerNumber: "OFFER-019",
      followUpTaskIds: ["fu-001"],
      message: {
        ...acceptedReply,
        id: "reply-003",
        receivedAt: "2026-06-24T09:30:00+03:00",
        plainText: "Received OFFER-019, thanks for the offer. This closes follow-up fu-001.",
      },
    })

    expect(result).toMatchObject({
      matched: true,
      signal: "follow_up_completed",
      event: {
        kind: "follow_up_completed",
        followUpTaskId: "fu-001",
        occurredAt: "2026-06-24T06:30:00.000Z",
      },
      warnings: [],
    })
  })

  it("downgrades acknowledgement replies without known task ids to notes", () => {
    const result = parseGmailOfferReply({
      offerNumber: "OFFER-019",
      followUpTaskIds: ["fu-002"],
      message: {
        ...acceptedReply,
        id: "reply-004",
        plainText: "Received OFFER-019, thanks. We will review it.",
      },
    })

    expect(result.signal).toBe("follow_up_completed")
    expect(result.event?.kind).toBe("note_added")
    expect(result.event?.followUpTaskId).toBeUndefined()
    expect(result.warnings).toEqual([
      "Follow-up completion signal found, but no matching follow-up task id was present.",
    ])
  })

  it("ignores replies that do not mention the target offer", () => {
    const result = parseGmailOfferReply({
      offerNumber: "OFFER-019",
      message: {
        ...acceptedReply,
        subject: "Re: Offer OFFER-020",
        plainText: "We accept OFFER-020.",
      },
    })

    expect(result).toEqual({
      adapterVersion: "gmail-offer-reply.v1",
      messageId: "reply-001",
      threadId: "offer-thread-019",
      offerNumber: "OFFER-019",
      matched: false,
      warnings: ["Message reply-001 does not mention offer OFFER-019."],
    })
  })

  it("parses batches deterministically and rejects non-ISO received timestamps", () => {
    expect(
      parseGmailOfferReplies([
        {
          offerNumber: "OFFER-019",
          message: acceptedReply,
        },
      ]),
    ).toHaveLength(1)

    expect(() =>
      parseGmailOfferReply({
        offerNumber: "OFFER-019",
        message: {
          ...acceptedReply,
          receivedAt: "2026/06/25 12:00",
        },
      }),
    ).toThrow("message.receivedAt must be a valid ISO timestamp")
  })
})
