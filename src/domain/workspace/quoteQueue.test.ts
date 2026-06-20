import { describe, expect, it } from "vitest"

import { rankQuoteQueue, type QuoteQueueItem } from "./quoteQueue"

const items: QuoteQueueItem[] = [
  {
    customerName: "North Forge",
    dueAt: "2026-06-24T15:00:00+03:00",
    estimatedValueCents: 115418,
    id: "rfq-204",
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-20T08:30:00+03:00",
    status: "estimating",
    subject: "CNC bracket FB-204-A",
  },
  {
    customerName: "Baltic Hydraulics",
    dueAt: "2026-06-20T16:00:00+03:00",
    estimatedValueCents: 50000,
    id: "rfq-019",
    priority: "rush",
    process: "cnc_turning",
    receivedAt: "2026-06-19T15:44:00+03:00",
    status: "triage",
    subject: "Turned spacer FB-TURN-019",
  },
  {
    customerName: "Arctic Instruments",
    dueAt: "2026-06-19T12:00:00+03:00",
    id: "rfq-331",
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-17T10:12:00+03:00",
    status: "new",
    subject: "Prototype sensor housing",
  },
  {
    customerName: "Kemi Works",
    dueAt: "2026-06-21T12:00:00+03:00",
    id: "rfq-412",
    priority: "rush",
    process: "fabrication",
    receivedAt: "2026-06-20T09:00:00+03:00",
    status: "sent",
    subject: "Welded guard frame",
  },
]

describe("quote queue ranking", () => {
  it("ranks RFQs by urgency, priority, status, and stable tiebreakers", () => {
    const ranked = rankQuoteQueue(items, {
      now: "2026-06-20T12:00:00+03:00",
    })

    expect(ranked.map((item) => [item.id, item.rank, item.urgency, item.daysUntilDue])).toEqual([
      ["rfq-331", 1, "overdue", -1],
      ["rfq-019", 2, "due_today", 0],
      ["rfq-412", 3, "due_soon", 1],
      ["rfq-204", 4, "normal", 4],
    ])
    expect(ranked[0]).toMatchObject({
      badges: ["overdue", "needs_triage"],
      queueVersion: "quote-queue.v1",
      score: 1290,
    })
    expect(ranked[1]?.badges).toEqual(["due_today", "rush", "needs_triage"])
    expect(ranked[2]?.badges).toEqual(["due_soon", "rush"])
  })

  it("uses due date, received date, customer, and id as deterministic tiebreakers", () => {
    const tied: QuoteQueueItem[] = [
      {
        customerName: "Beta",
        dueAt: "2026-06-22T12:00:00Z",
        id: "b",
        priority: "normal",
        process: "sheet_metal",
        receivedAt: "2026-06-20T09:00:00Z",
        status: "estimating",
        subject: "Beta bracket",
      },
      {
        customerName: "Alpha",
        dueAt: "2026-06-22T12:00:00Z",
        id: "a",
        priority: "normal",
        process: "sheet_metal",
        receivedAt: "2026-06-20T09:00:00Z",
        status: "estimating",
        subject: "Alpha bracket",
      },
    ]

    expect(rankQuoteQueue(tied, { now: "2026-06-20T12:00:00Z" }).map((item) => item.id)).toEqual(["a", "b"])
  })

  it("rejects invalid queue inputs", () => {
    expect(() =>
      rankQuoteQueue(
        [
          {
            customerName: "Bad Buyer",
            dueAt: "06/20/2026 09:00:00",
            id: "bad-iso",
            priority: "normal",
            process: "plastic",
            receivedAt: "2026-06-20T09:00:00Z",
            status: "new",
            subject: "Bad RFQ",
          },
        ],
        { now: "2026-06-20T12:00:00Z" },
      ),
    ).toThrow("dueAt must be a valid ISO timestamp")

    expect(() =>
      rankQuoteQueue(
        [
          {
            customerName: "Bad Buyer",
            dueAt: "not-a-date",
            id: "bad",
            priority: "normal",
            process: "plastic",
            receivedAt: "2026-06-20T09:00:00Z",
            status: "new",
            subject: "Bad RFQ",
          },
        ],
        { now: "2026-06-20T12:00:00Z" },
      ),
    ).toThrow("dueAt must be a valid ISO timestamp")

    expect(() =>
      rankQuoteQueue(
        [
          {
            customerName: "Bad Buyer",
            dueAt: "2026-06-20T09:00:00Z",
            estimatedValueCents: 10.5,
            id: "bad",
            priority: "normal",
            process: "plastic",
            receivedAt: "2026-06-20T09:00:00Z",
            status: "new",
            subject: "Bad RFQ",
          },
        ],
        { now: "2026-06-20T12:00:00Z" },
      ),
    ).toThrow("estimatedValueCents must be a non-negative integer")
  })
})
