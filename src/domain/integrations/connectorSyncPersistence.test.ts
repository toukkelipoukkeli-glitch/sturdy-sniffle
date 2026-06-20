import { describe, expect, it } from "vitest"

import { createCalendarRfqScheduler, createMockCalendarRfqProvider } from "./calendarRfq"
import { createConnectorRfqSyncOrchestrator } from "./connectorSync"
import {
  createConvexConnectorSyncPersistence,
  createLocalConnectorSyncPersistence,
  type ConvexConnectorSyncPersistenceOptions,
} from "./connectorSyncPersistence"
import { createGmailRfqIntakeAdapter, createMockGmailRfqProvider, type GmailRfqMessage } from "./gmailRfq"

const cncMessage: GmailRfqMessage = {
  id: "msg-001",
  threadId: "thread-001",
  subject: "RFQ: CNC bracket PN FB-204-A",
  receivedAt: "2026-06-15T08:30:00+03:00",
  plainText:
    "Hello, please quote part: FB-204-A. CNC milling, aluminum 6082, qty 25 pcs. Dimensions 120 x 80 x 6 mm. Deadline 2026-06-30.",
}

describe("connector sync persistence", () => {
  it("stores local payload snapshots without requiring Convex", async () => {
    const result = await connectorResult()
    const initialPayload = {
      activities: [
        {
          kind: "note" as const,
          message: "seeded sync",
        },
      ],
      links: [],
    }
    const adapter = createLocalConnectorSyncPersistence({
      initialSnapshot: {
        payloads: [initialPayload],
      },
      payloadOptions: {
        resolveRfqId: (rfqId) => (rfqId === "rfq-thread-001-001" ? "convex-rfq-001" : undefined),
      },
    })
    initialPayload.activities.push({
      kind: "note",
      message: "mutated after adapter creation",
    })

    const snapshot = await adapter.recordSync(result)
    snapshot.payloads[0]?.activities.push({
      kind: "note",
      message: "mutated outside snapshot",
    })

    expect(snapshot.syncCount).toBe(2)
    expect(adapter.snapshot().payloads[0]?.activities).toEqual([{ kind: "note", message: "seeded sync" }])
    expect(adapter.snapshot().payloads[1]?.links.map((link) => link.provider)).toEqual(["gmail", "calendar", "calendar"])
  })

  it("routes connector sync payloads through the configured Convex mutation", async () => {
    const calls: Array<{ mutationRef: unknown; args: Record<string, unknown> }> = []
    const adapter = createConvexConnectorSyncPersistence({
      mutationRef: "recordConnectorRfqSync",
      payloadOptions: {
        actorName: "Connector sync",
        resolveRfqId: (rfqId) => (rfqId === "rfq-thread-001-001" ? "convex-rfq-001" : undefined),
      },
      runMutation: async (mutationRef, args) => {
        calls.push({ args, mutationRef })
      },
    })

    const snapshot = await adapter.recordSync(await connectorResult())

    expect(calls).toEqual([
      {
        args: {
          activities: [
            {
              actorName: "Connector sync",
              kind: "email_received",
              message: "Synced Gmail RFQ thread-001:msg-001: RFQ: CNC bracket PN FB-204-A.",
              rfqId: "convex-rfq-001",
            },
            {
              actorName: "Connector sync",
              kind: "calendar_event",
              message: 'Synced calendar quote_work_hold event "Quote work: RFQ: CNC bracket PN FB-204-A" for RFQ rfq-thread-001-001.',
              rfqId: "convex-rfq-001",
            },
            {
              actorName: "Connector sync",
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
        },
        mutationRef: "recordConnectorRfqSync",
      },
    ])
    expect(snapshot.syncCount).toBe(1)
  })

  it("keeps the local fallback useful when Convex persistence fails", async () => {
    const errors: Array<{ error: unknown; linkCount: number }> = []
    const options: ConvexConnectorSyncPersistenceOptions = {
      mutationRef: "recordConnectorRfqSync",
      onSyncError: (error, payload) => errors.push({ error, linkCount: payload.links.length }),
      payloadOptions: {
        resolveRfqId: (rfqId) => (rfqId === "rfq-thread-001-001" ? "convex-rfq-001" : undefined),
      },
      runMutation: async () => {
        throw new Error("Convex unavailable")
      },
    }

    const adapter = createConvexConnectorSyncPersistence(options)
    const snapshot = await adapter.recordSync(await connectorResult())

    expect(errors).toHaveLength(1)
    expect(errors[0]?.error).toBeInstanceOf(Error)
    expect(errors[0]?.linkCount).toBe(3)
    expect(snapshot.payloads[0]?.links).toHaveLength(3)
  })

  it("keeps the local fallback useful when the sync error observer throws", async () => {
    const adapter = createConvexConnectorSyncPersistence({
      mutationRef: "recordConnectorRfqSync",
      onSyncError: () => {
        throw new Error("observer failed")
      },
      payloadOptions: {
        resolveRfqId: (rfqId) => (rfqId === "rfq-thread-001-001" ? "convex-rfq-001" : undefined),
      },
      runMutation: async () => {
        throw new Error("Convex unavailable")
      },
    })

    const snapshot = await adapter.recordSync(await connectorResult())

    expect(snapshot.syncCount).toBe(1)
    expect(snapshot.payloads[0]?.links).toHaveLength(3)
  })
})

async function connectorResult() {
  return await createConnectorRfqSyncOrchestrator({
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
}
