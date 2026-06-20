import { describe, expect, it } from "vitest"

import {
  createCalendarRfqScheduler,
  createMockCalendarRfqProvider,
  type CalendarRfqProviderAdapter,
} from "./calendarRfq"
import { buildConvexConnectorRfqSyncPayload } from "./convexConnectorSync"
import { createConnectorRfqSyncOrchestrator, type ConnectorRfqSyncResult } from "./connectorSync"
import {
  createGmailRfqIntakeAdapter,
  createMockGmailRfqProvider,
  type GmailRfqMessage,
  type GmailRfqMessageProvider,
} from "./gmailRfq"

const cncMessage: GmailRfqMessage = {
  id: "msg-001",
  threadId: "thread-001",
  subject: "RFQ: CNC bracket PN FB-204-A",
  fromHeader: '"North Forge" <sari.virtanen@northforge.fi>',
  receivedAt: "2026-06-15T08:30:00+03:00",
  plainText:
    "Hello, please quote part: FB-204-A. CNC milling, aluminum 6082, qty 25 pcs. Dimensions 120 x 80 x 6 mm. Deadline 2026-06-30. Budget in EUR.",
}

const noDueMessage: GmailRfqMessage = {
  id: "msg-002",
  subject: "Prototype spacer RFQ",
  senderEmail: "mikael@example.test",
  receivedAt: "2026-06-15T09:00:00.000Z",
  plainText: "Please quote part: TURN-019. CNC turning, stainless 316L, qty 4 pcs.",
}

describe("convex connector sync persistence payload", () => {
  it("builds compact integration links and activities for successful RFQ syncs", async () => {
    const result = await createConnectorRfqSyncOrchestrator({
      calendarScheduler: createCalendarRfqScheduler({
        provider: createMockCalendarRfqProvider(),
      }),
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [cncMessage] }),
      }),
    }).syncRfqInbox({
      gmail: { query: "rfq" },
      timezone: "Europe/Helsinki",
    })

    expect(
      buildConvexConnectorRfqSyncPayload(result, {
        actorName: " FactoryBid connector ",
        resolveRfqId: (rfqId) => (rfqId === "rfq-thread-001-001" ? "convex-rfq-001" : undefined),
      }),
    ).toEqual({
      activities: [
        {
          actorName: "FactoryBid connector",
          kind: "email_received",
          message: "Synced Gmail RFQ thread-001:msg-001: RFQ: CNC bracket PN FB-204-A.",
          rfqId: "convex-rfq-001",
        },
        {
          actorName: "FactoryBid connector",
          kind: "calendar_event",
          message: 'Synced calendar quote_work_hold event "Quote work: RFQ: CNC bracket PN FB-204-A" for RFQ rfq-thread-001-001.',
          rfqId: "convex-rfq-001",
        },
        {
          actorName: "FactoryBid connector",
          kind: "calendar_event",
          message: 'Synced calendar quote_due event "Quote due: RFQ: CNC bracket PN FB-204-A" for RFQ rfq-thread-001-001.',
          rfqId: "convex-rfq-001",
        },
      ],
      links: [
        {
          externalId: "thread-001:msg-001",
          provider: "gmail",
          rfqId: "convex-rfq-001",
          syncStatus: "linked",
        },
        {
          externalId: "mock-calendar-001",
          provider: "calendar",
          rfqId: "convex-rfq-001",
          syncStatus: "linked",
        },
        {
          externalId: "mock-calendar-002",
          provider: "calendar",
          rfqId: "convex-rfq-001",
          syncStatus: "linked",
        },
      ],
    })
  })

  it("marks fallback links stale and records calendar skip details", async () => {
    const failingGmail: GmailRfqMessageProvider = {
      adapterVersion: "gmail.live.test",
      provider: "gmail",
      async search() {
        throw new Error("Gmail auth revoked")
      },
    }
    const result = await createConnectorRfqSyncOrchestrator({
      gmailAdapter: createGmailRfqIntakeAdapter({
        fallbackProvider: createMockGmailRfqProvider({ messages: [noDueMessage] }),
        provider: failingGmail,
      }),
    }).syncRfqInbox({
      gmail: { query: "prototype" },
      timezone: "Europe/Helsinki",
    })

    expect(buildConvexConnectorRfqSyncPayload(result)).toEqual({
      activities: [
        {
          kind: "email_received",
          message: "Synced Gmail RFQ msg-002: Prototype spacer RFQ.",
          rfqId: "rfq-msg-002-001",
        },
        {
          kind: "calendar_event",
          message:
            "Calendar sync skipped for RFQ rfq-msg-002-001. RFQ has no due date; calendar quote due events were not created.",
          rfqId: "rfq-msg-002-001",
        },
      ],
      links: [
        {
          externalId: "msg-002",
          provider: "gmail",
          rfqId: "rfq-msg-002-001",
          syncStatus: "stale",
        },
      ],
    })
  })

  it("records unpersisted RFQs as notes without unsafe links", async () => {
    const result = await createConnectorRfqSyncOrchestrator({
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [cncMessage] }),
      }),
    }).syncRfqInbox({
      gmail: { query: "rfq" },
      timezone: "Europe/Helsinki",
    })

    expect(
      buildConvexConnectorRfqSyncPayload(result, {
        resolveRfqId: () => undefined,
      }),
    ).toEqual({
      activities: [
        {
          kind: "note",
          message: "Skipped connector sync for rfq-thread-001-001 because the RFQ is not persisted.",
        },
      ],
      links: [],
    })
  })

  it("summarizes empty inbox syncs and rejects unsupported statuses", async () => {
    const emptyResult = await createConnectorRfqSyncOrchestrator({
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [cncMessage] }),
      }),
    }).syncRfqInbox({
      gmail: { query: "wire edm" },
      timezone: "Europe/Helsinki",
    })

    expect(buildConvexConnectorRfqSyncPayload(emptyResult)).toEqual({
      activities: [
        {
          kind: "note",
          message: 'Connector RFQ sync skipped for Gmail query "wire edm" with 0 RFQs.',
        },
      ],
      links: [],
    })

    expect(() =>
      buildConvexConnectorRfqSyncPayload({
        ...emptyResult,
        status: "queued" as never,
      }),
    ).toThrow("connector sync status is not supported")
  })

  it("marks failed calendar provider runs blocked when no fallback can write events", async () => {
    const failingCalendar: CalendarRfqProviderAdapter = {
      adapterVersion: "calendar.live.test",
      provider: "calendar",
      async createEvents() {
        throw new Error("Calendar quota exhausted")
      },
    }
    const result = await createConnectorRfqSyncOrchestrator({
      calendarScheduler: createCalendarRfqScheduler({
        fallbackProvider: failingCalendar,
        provider: failingCalendar,
      }),
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [cncMessage] }),
      }),
    }).syncRfqInbox({
      gmail: { query: "rfq" },
      timezone: "Europe/Helsinki",
    })

    expect((result satisfies ConnectorRfqSyncResult).status).toBe("partial")
    expect(buildConvexConnectorRfqSyncPayload(result).activities.at(-1)).toEqual({
      kind: "calendar_event",
      message:
        "Calendar sync failed for RFQ rfq-thread-001-001. Calendar provider calendar failed: Calendar quota exhausted. Fallback calendar provider calendar failed: Calendar quota exhausted.",
      rfqId: "rfq-thread-001-001",
    })
  })
})
