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

describe("Convex connector sync persistence payload", () => {
  it("maps successful Gmail and calendar sync records to tenant-safe payloads", async () => {
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

    const payload = buildConvexConnectorRfqSyncPayload(result, {
      actorName: "Connector sync",
      resolveRfqId: (rfqId) => `convex-${rfqId}`,
    })

    expect(payload.links).toEqual([
      {
        externalId: "thread-001:msg-001",
        provider: "gmail",
        rfqId: "convex-rfq-thread-001-001",
        syncStatus: "linked",
      },
      {
        externalId: "mock-calendar-001",
        provider: "calendar",
        rfqId: "convex-rfq-thread-001-001",
        syncStatus: "linked",
      },
      {
        externalId: "mock-calendar-002",
        provider: "calendar",
        rfqId: "convex-rfq-thread-001-001",
        syncStatus: "linked",
      },
    ])
    expect(payload.activities.map((activity) => activity.kind)).toEqual([
      "email_received",
      "calendar_event",
      "calendar_event",
    ])
    expect(payload.activities[0]).toMatchObject({
      actorName: "Connector sync",
      message: "Synced Gmail RFQ thread-001:msg-001: RFQ: CNC bracket PN FB-204-A.",
      rfqId: "convex-rfq-thread-001-001",
    })
  })

  it("marks fallback links stale and records calendar failures without calendar link writes", async () => {
    const failingGmail: GmailRfqMessageProvider = {
      adapterVersion: "gmail.live.test",
      provider: "gmail",
      async search() {
        throw new Error("Gmail auth revoked")
      },
    }
    const failingCalendar: CalendarRfqProviderAdapter = {
      adapterVersion: "calendar.live.test",
      provider: "calendar",
      async createEvents() {
        throw new Error("Calendar auth revoked")
      },
    }
    const fallbackResult = await createConnectorRfqSyncOrchestrator({
      calendarScheduler: createCalendarRfqScheduler({
        fallbackProvider: createMockCalendarRfqProvider(),
        provider: failingCalendar,
      }),
      gmailAdapter: createGmailRfqIntakeAdapter({
        fallbackProvider: createMockGmailRfqProvider({ messages: [cncMessage] }),
        provider: failingGmail,
      }),
    }).syncRfqInbox({
      gmail: { query: "rfq" },
      timezone: "Europe/Helsinki",
    })
    const failedCalendarResult = await createConnectorRfqSyncOrchestrator({
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

    expect(buildConvexConnectorRfqSyncPayload(fallbackResult).links.map((link) => link.syncStatus)).toEqual([
      "stale",
      "stale",
      "stale",
    ])
    const failedPayload = buildConvexConnectorRfqSyncPayload(failedCalendarResult)
    expect(failedPayload.links).toEqual([
      {
        externalId: "thread-001:msg-001",
        provider: "gmail",
        rfqId: "rfq-thread-001-001",
        syncStatus: "linked",
      },
    ])
    expect(failedPayload.activities.at(-1)?.message).toContain("Calendar sync failed for RFQ rfq-thread-001-001.")
  })

  it("records skipped syncs and unresolved RFQ mappings as note activities", async () => {
    const skippedResult = await createConnectorRfqSyncOrchestrator({
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [cncMessage] }),
      }),
    }).syncRfqInbox({
      gmail: { query: "wire edm" },
      timezone: "Europe/Helsinki",
    })
    const noDueResult = await createConnectorRfqSyncOrchestrator({
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [noDueMessage] }),
      }),
    }).syncRfqInbox({
      gmail: { query: "prototype" },
      timezone: "Europe/Helsinki",
    })

    expect(buildConvexConnectorRfqSyncPayload(skippedResult)).toEqual({
      activities: [
        {
          kind: "note",
          message: 'Connector RFQ sync skipped for Gmail query "wire edm" with 0 RFQs.',
        },
      ],
      links: [],
    })
    expect(buildConvexConnectorRfqSyncPayload(noDueResult, { resolveRfqId: () => undefined })).toEqual({
      activities: [
        {
          kind: "note",
          message: "Skipped connector sync for rfq-msg-002-001 because the RFQ is not persisted.",
        },
      ],
      links: [],
    })
  })

  it("rejects unsupported sync status and blank record identifiers", () => {
    const result = {
      adapterVersion: "connector-rfq-sync.v1",
      gmail: {
        adapterVersion: "gmail-rfq.v1.mock",
        provider: "mock",
        query: "rfq",
        records: [],
        status: "succeeded",
        warnings: [],
      },
      records: [],
      status: "unknown",
      warnings: [],
    } as unknown as ConnectorRfqSyncResult

    expect(() => buildConvexConnectorRfqSyncPayload(result)).toThrow("connector sync status is not supported")
    expect(() =>
      buildConvexConnectorRfqSyncPayload({
        ...result,
        records: [
          {
            calendar: {
              adapterVersion: "calendar-rfq.v1.mock",
              plan: { events: [], warnings: [] },
              provider: "mock",
              results: [],
              status: "skipped",
              warnings: [],
            },
            messageId: " ",
            parsedSubject: "RFQ",
            rfqId: "rfq-001",
            status: "calendar_skipped",
            warnings: [],
          },
        ],
        status: "succeeded",
      }),
    ).toThrow("records[0].messageId is required")
  })
})
