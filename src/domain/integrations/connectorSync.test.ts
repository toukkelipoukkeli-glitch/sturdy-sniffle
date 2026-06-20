import { describe, expect, it } from "vitest"

import {
  createCalendarRfqScheduler,
  createMockCalendarRfqProvider,
  type CalendarRfqProviderAdapter,
} from "./calendarRfq"
import {
  createConnectorRfqSyncOrchestrator,
  CONNECTOR_RFQ_SYNC_VERSION,
} from "./connectorSync"
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
  attachments: [
    {
      fileName: "FB-204-A.step",
      mimeType: "model/step",
      sizeBytes: 245760,
    },
  ],
}

const noDueMessage: GmailRfqMessage = {
  id: "msg-002",
  subject: "Prototype spacer RFQ",
  senderEmail: "mikael@example.test",
  receivedAt: "2026-06-15T09:00:00.000Z",
  plainText: "Please quote part: TURN-019. CNC turning, stainless 316L, qty 4 pcs.",
}

describe("connector RFQ sync orchestration", () => {
  it("ingests Gmail RFQs and schedules deterministic calendar events", async () => {
    const orchestrator = createConnectorRfqSyncOrchestrator({
      calendarScheduler: createCalendarRfqScheduler({
        provider: createMockCalendarRfqProvider(),
      }),
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [cncMessage] }),
      }),
    })

    const result = await orchestrator.syncRfqInbox({
      gmail: { query: "rfq" },
      timezone: "Europe/Helsinki",
    })

    expect(result.adapterVersion).toBe(CONNECTOR_RFQ_SYNC_VERSION)
    expect(result.status).toBe("succeeded")
    expect(result.records).toHaveLength(1)
    expect(result.records[0]).toMatchObject({
      messageId: "msg-001",
      parsedSubject: "RFQ: CNC bracket PN FB-204-A",
      rfqId: "rfq-thread-001-001",
      status: "scheduled",
      threadId: "thread-001",
    })
    expect(result.records[0]?.calendar.results.map((item) => [item.status, item.event.kind])).toEqual([
      ["created", "quote_work_hold"],
      ["created", "quote_due"],
    ])
    expect(result.warnings).toEqual([])
  })

  it("rolls up Gmail and calendar fallback warnings", async () => {
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
        throw new Error("Calendar quota exhausted")
      },
    }
    const orchestrator = createConnectorRfqSyncOrchestrator({
      calendarScheduler: createCalendarRfqScheduler({
        fallbackProvider: createMockCalendarRfqProvider(),
        provider: failingCalendar,
      }),
      gmailAdapter: createGmailRfqIntakeAdapter({
        fallbackProvider: createMockGmailRfqProvider({ messages: [cncMessage] }),
        provider: failingGmail,
      }),
    })

    const result = await orchestrator.syncRfqInbox({
      gmail: { query: "rfq" },
      timezone: "Europe/Helsinki",
    })

    expect(result.status).toBe("fallback")
    expect(result.gmail.status).toBe("fallback")
    expect(result.records[0]?.status).toBe("calendar_fallback")
    expect(result.warnings).toEqual([
      "Gmail RFQ provider gmail failed: Gmail auth revoked.",
      "Used mock RFQ intake fallback.",
      "rfq-thread-001-001: Calendar provider calendar failed: Calendar quota exhausted.",
      "rfq-thread-001-001: Used mock calendar fallback.",
    ])
  })

  it("keeps successful Gmail intake visible when calendar scheduling fails", async () => {
    const failingCalendar: CalendarRfqProviderAdapter = {
      adapterVersion: "calendar.live.test",
      provider: "calendar",
      async createEvents() {
        throw new Error("Calendar auth revoked")
      },
    }
    const orchestrator = createConnectorRfqSyncOrchestrator({
      calendarScheduler: createCalendarRfqScheduler({
        fallbackProvider: failingCalendar,
        provider: failingCalendar,
      }),
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [cncMessage] }),
      }),
    })

    const result = await orchestrator.syncRfqInbox({
      gmail: { query: "rfq" },
      timezone: "Europe/Helsinki",
    })

    expect(result.status).toBe("partial")
    expect(result.gmail.status).toBe("succeeded")
    expect(result.records[0]?.status).toBe("calendar_failed")
    expect(result.records[0]?.calendar.results).toEqual([])
  })

  it("skips calendar scheduling cleanly when no RFQs match", async () => {
    const orchestrator = createConnectorRfqSyncOrchestrator({
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [cncMessage] }),
      }),
    })

    const result = await orchestrator.syncRfqInbox({
      gmail: { query: "wire edm" },
      timezone: "Europe/Helsinki",
    })

    expect(result.status).toBe("skipped")
    expect(result.records).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it("records per-RFQ calendar skips when an RFQ has no due date", async () => {
    const orchestrator = createConnectorRfqSyncOrchestrator({
      gmailAdapter: createGmailRfqIntakeAdapter({
        provider: createMockGmailRfqProvider({ messages: [noDueMessage] }),
      }),
    })

    const result = await orchestrator.syncRfqInbox({
      gmail: { query: "prototype" },
      timezone: "Europe/Helsinki",
    })

    expect(result.status).toBe("succeeded")
    expect(result.records[0]).toMatchObject({
      rfqId: "rfq-msg-002-001",
      status: "calendar_skipped",
      warnings: ["RFQ has no due date; calendar quote due events were not created."],
    })
    expect(result.warnings).toEqual([
      "rfq-msg-002-001: RFQ has no due date; calendar quote due events were not created.",
    ])
  })

  it("rejects invalid orchestration inputs", async () => {
    await expect(
      createConnectorRfqSyncOrchestrator().syncRfqInbox({
        gmail: { query: "rfq" },
        timezone: " ",
      }),
    ).rejects.toThrow("timezone is required")
  })
})
