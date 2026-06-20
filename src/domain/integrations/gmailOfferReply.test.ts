import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { buildCncOfferDraft } from "../offers/offer"
import {
  buildOfferLifecycleFromGmailReplySync,
  createGmailOfferReplyAdapter,
  parseGmailOfferReplies,
  parseGmailOfferReply,
} from "./gmailOfferReply"
import { createMockGmailRfqProvider, type GmailRfqMessage, type GmailRfqMessageProvider } from "./gmailRfq"

const acceptedReply: GmailRfqMessage = {
  id: "reply-001",
  threadId: "offer-thread-019",
  subject: "Re: Offer OFFER-019",
  fromHeader: '"Mikael Laine" <mikael.laine@baltic.example>',
  receivedAt: "2026-06-25T12:00:00+03:00",
  plainText: "Hello, we accept OFFER-019. Please proceed with production.",
}

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

  it("does not match offer numbers by prefix", () => {
    const result = parseGmailOfferReply({
      offerNumber: "OFFER-019",
      message: {
        ...acceptedReply,
        subject: "Re: Offer OFFER-01",
        plainText: "We accept OFFER-01.",
      },
    })

    expect(result.matched).toBe(false)
    expect(result.event).toBeUndefined()
  })

  it("does not match follow-up task ids by prefix", () => {
    const result = parseGmailOfferReply({
      offerNumber: "OFFER-019",
      followUpTaskIds: ["fu-01"],
      message: {
        ...acceptedReply,
        id: "reply-005",
        plainText: "Received OFFER-019, thanks. This is about follow-up fu-019.",
      },
    })

    expect(result).toMatchObject({
      matched: true,
      signal: "follow_up_completed",
      event: {
        kind: "note_added",
      },
      warnings: ["Follow-up completion signal found, but no matching follow-up task id was present."],
    })
    expect(result.event?.followUpTaskId).toBeUndefined()
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

  it("syncs offer replies through the configured provider", async () => {
    const adapter = createGmailOfferReplyAdapter({
      provider: createMockGmailRfqProvider({ messages: [acceptedReply] }),
    })

    const result = await adapter.sync({
      offerNumber: "OFFER-019",
      query: "offer OFFER-019",
    })

    expect(result).toMatchObject({
      adapterVersion: "gmail-offer-reply.v1",
      provider: "mock",
      status: "succeeded",
      offerNumber: "OFFER-019",
      query: "offer OFFER-019",
      warnings: [],
    })
    expect(result.records).toHaveLength(1)
    expect(result.records[0]?.parsed.signal).toBe("accepted")
    expect(result.records[0]?.message).not.toBe(acceptedReply)
  })

  it("falls back to mock offer reply fixtures when the primary provider fails", async () => {
    const failingProvider: GmailRfqMessageProvider = {
      adapterVersion: "gmail-rfq.v1.gmail",
      provider: "gmail",
      async search() {
        throw new Error("Gmail auth revoked")
      },
    }
    const adapter = createGmailOfferReplyAdapter({
      provider: failingProvider,
      fallbackProvider: createMockGmailRfqProvider({ messages: [acceptedReply] }),
    })

    const result = await adapter.sync({
      offerNumber: "OFFER-019",
      query: "offer OFFER-019",
    })

    expect(result.status).toBe("fallback")
    expect(result.provider).toBe("mock")
    expect(result.records[0]?.parsed.signal).toBe("accepted")
    expect(result.warnings).toEqual([
      "Gmail offer reply provider gmail failed: Gmail auth revoked.",
      "Used mock offer reply fallback.",
    ])
  })

  it("reports failed syncs when primary and fallback providers fail", async () => {
    const adapter = createGmailOfferReplyAdapter({
      provider: createMockGmailRfqProvider({ shouldFail: true }),
      fallbackProvider: createMockGmailRfqProvider({ shouldFail: true }),
    })

    const result = await adapter.sync({
      offerNumber: "OFFER-019",
      query: "offer OFFER-019",
    })

    expect(result).toEqual({
      adapterVersion: "gmail-offer-reply.v1",
      provider: "mock",
      status: "failed",
      offerNumber: "OFFER-019",
      query: "offer OFFER-019",
      records: [],
      warnings: [
        "Gmail offer reply provider mock failed: Mock Gmail RFQ provider failure.",
        "Fallback offer reply provider mock failed: Mock Gmail RFQ provider failure.",
      ],
    })
  })

  it("rejects invalid sync requests", async () => {
    const adapter = createGmailOfferReplyAdapter()

    await expect(adapter.sync({ offerNumber: "OFFER-019", query: " " })).rejects.toThrow("query is required")
    await expect(adapter.sync({ offerNumber: " ", query: "offer" })).rejects.toThrow("offerNumber is required")
    await expect(adapter.sync({ offerNumber: "OFFER-019", query: "offer", maxResults: 0 })).rejects.toThrow(
      "maxResults must be a positive integer",
    )
    await expect(adapter.sync({ offerNumber: "OFFER-019", query: "offer", maxResults: 1.5 })).rejects.toThrow(
      "maxResults must be a positive integer",
    )
  })

  it("applies synced reply events to an offer lifecycle timeline", async () => {
    const adapter = createGmailOfferReplyAdapter({
      provider: createMockGmailRfqProvider({
        messages: [
          {
            ...acceptedReply,
            id: "reply-accepted",
            receivedAt: "2026-06-25T12:00:00+03:00",
            plainText: "We accept OFFER-019. Please proceed.",
          },
          {
            ...acceptedReply,
            id: "reply-follow-up",
            receivedAt: "2026-06-24T09:30:00+03:00",
            plainText: "Received OFFER-019, thanks for the offer. This closes follow-up fu-001.",
          },
          {
            ...acceptedReply,
            id: "reply-ignored",
            plainText: "We accept OFFER-020.",
            subject: "Re: Offer OFFER-020",
          },
        ],
      }),
    })
    const syncResult = await adapter.sync({
      followUpTaskIds: ["fu-001"],
      offerNumber: "OFFER-019",
      query: "offer",
    })

    const result = buildOfferLifecycleFromGmailReplySync({
      existingEvents: [
        {
          actor: "sales",
          kind: "sent",
          occurredAt: "2026-06-20T09:00:00+03:00",
        },
        {
          actor: "sales",
          followUpDueAt: "2026-06-24T09:00:00+03:00",
          followUpTaskId: "fu-001",
          kind: "follow_up_scheduled",
          occurredAt: "2026-06-20T09:05:00+03:00",
        },
      ],
      offer,
      syncResult,
    })

    expect(result.appliedMessageIds).toEqual(["reply-accepted", "reply-follow-up"])
    expect(result.ignoredMessageIds).toEqual(["reply-ignored"])
    expect(result.warnings).toEqual(["Message reply-ignored does not mention offer OFFER-019."])
    expect(result.timeline.status).toBe("accepted")
    expect(result.timeline.events.map((event) => [event.kind, event.statusAfter])).toEqual([
      ["sent", "sent"],
      ["follow_up_scheduled", "sent"],
      ["follow_up_completed", "sent"],
      ["accepted", "accepted"],
    ])
    expect(result.timeline.followUpTasks[0]).toMatchObject({
      completedAt: "2026-06-24T06:30:00.000Z",
      id: "fu-001",
      status: "completed",
    })
  })

  it("preserves provider warnings when lifecycle sync used a fallback", async () => {
    const adapter = createGmailOfferReplyAdapter({
      provider: createMockGmailRfqProvider({ shouldFail: true }),
      fallbackProvider: createMockGmailRfqProvider({ messages: [acceptedReply] }),
    })
    const syncResult = await adapter.sync({
      offerNumber: "OFFER-019",
      query: "offer OFFER-019",
    })

    const result = buildOfferLifecycleFromGmailReplySync({
      existingEvents: [{ actor: "sales", kind: "sent", occurredAt: "2026-06-20T09:00:00+03:00" }],
      offer,
      syncResult,
    })

    expect(result.timeline.status).toBe("accepted")
    expect(result.warnings).toEqual([
      "Gmail offer reply provider mock failed: Mock Gmail RFQ provider failure.",
      "Used mock offer reply fallback.",
    ])
  })

  it("rejects lifecycle sync results for a different offer", async () => {
    const adapter = createGmailOfferReplyAdapter({
      provider: createMockGmailRfqProvider({ messages: [acceptedReply] }),
    })
    const syncResult = await adapter.sync({
      offerNumber: "OFFER-019",
      query: "offer OFFER-019",
    })
    const otherOffer = buildCncOfferDraft({
      customer: {
        name: "North Forge",
      },
      issuedAt: "2026-06-19",
      offerNumber: "OFFER-204",
      quote: calculateCncQuote(rushTurnedSpacerFixture),
      validUntil: "2026-07-03",
    })

    expect(() =>
      buildOfferLifecycleFromGmailReplySync({
        offer: otherOffer,
        syncResult,
      }),
    ).toThrow("sync result offerNumber OFFER-019 does not match offer OFFER-204")
  })
})
