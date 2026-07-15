import { describe, expect, it } from "vitest"

import type { ConnectorSyncPersistenceSnapshot } from "./connectorSyncPersistence"
import { buildConnectorLinkDrilldown } from "./connectorLinkDrilldown"

describe("connector link drill-down", () => {
  it("summarizes unique RFQ links and activities with deterministic ordering", () => {
    const drilldown = buildConnectorLinkDrilldown(snapshot(), { rfqId: "rfq-204" })

    expect(drilldown.summary).toEqual({
      activityCount: 3,
      blockedCount: 0,
      calendarLinkCount: 2,
      gmailLinkCount: 1,
      linkedCount: 1,
      linkCount: 3,
      staleCount: 2,
      syncCount: 2,
    })
    expect(drilldown.items.map((item) => [item.kind, item.provider, item.status, item.label])).toEqual([
      ["link", "gmail", "stale", "Gmail message thread"],
      ["link", "calendar", "linked", "Calendar event"],
      ["link", "calendar", "stale", "Calendar event"],
      ["activity", undefined, "email_received", "Synced Gmail RFQ rfq-204-thread:rfq-204-gmail-message."],
      ["activity", undefined, "calendar_event", "Synced calendar quote work hold."],
      ["activity", undefined, "calendar_event", "Synced calendar quote due."],
    ])
    expect(drilldown.items[0]).toMatchObject({
      detail: "rfq-204-thread:rfq-204-gmail-message - 2 syncs",
      key: "link:gmail:rfq-204-thread:rfq-204-gmail-message",
    })
    expect(drilldown.recoveryActionLabels).toEqual([
      "Refresh Gmail sync for rfq-204-thread:rfq-204-gmail-message.",
      "Refresh Calendar sync for mock-calendar-002.",
    ])
  })

  it("filters provider links and attention links without leaking other RFQs", () => {
    const gmail = buildConnectorLinkDrilldown(snapshot(), { filter: "gmail", rfqId: "rfq-204" })
    const calendar = buildConnectorLinkDrilldown(snapshot(), { filter: "calendar", rfqId: "rfq-204" })
    const attention = buildConnectorLinkDrilldown(snapshot(), { filter: "attention", rfqId: "rfq-204" })

    expect(gmail.items.map((item) => item.provider)).toEqual(["gmail"])
    expect(calendar.items.map((item) => item.provider)).toEqual(["calendar", "calendar"])
    expect(attention.items.map((item) => item.status)).toEqual(["stale", "stale"])
    expect(attention.items.map((item) => item.detail)).not.toContain("rfq-999-message")
  })

  it("filters activity rows and applies positive limits", () => {
    const drilldown = buildConnectorLinkDrilldown(snapshot(), { filter: "activity", limit: 2, rfqId: "rfq-204" })

    expect(drilldown.items).toHaveLength(2)
    expect(drilldown.items.every((item) => item.kind === "activity")).toBe(true)
    expect(() => buildConnectorLinkDrilldown(snapshot(), { limit: 0, rfqId: "rfq-204" })).toThrow(
      "limit must be a positive integer",
    )
    expect(() => buildConnectorLinkDrilldown(snapshot(), { rfqId: " " })).toThrow("rfqId is required")
  })

  it("builds deterministic recovery actions for blocked links", () => {
    const drilldown = buildConnectorLinkDrilldown(
      {
        payloads: [
          {
            activities: [],
            links: [
              {
                externalId: "blocked-thread",
                provider: "gmail",
                rfqId: "rfq-204",
                syncStatus: "blocked",
              },
              {
                externalId: "blocked-calendar",
                provider: "calendar",
                rfqId: "rfq-204",
                syncStatus: "blocked",
              },
            ],
          },
        ],
        syncCount: 1,
      },
      { filter: "attention", rfqId: "rfq-204" },
    )

    expect(drilldown.recoveryActionLabels).toEqual([
      "Reconnect Gmail before resyncing blocked-thread.",
      "Reconnect Calendar before resyncing blocked-calendar.",
    ])
    expect(drilldown.items.map((item) => item.status)).toEqual(["blocked", "blocked"])
  })
})

function snapshot(): ConnectorSyncPersistenceSnapshot {
  return {
    payloads: [
      {
        activities: [
          {
            actorName: "FactoryBid connector",
            kind: "email_received",
            message: "Synced Gmail RFQ rfq-204-thread:rfq-204-gmail-message.",
            rfqId: "rfq-204",
          },
          {
            kind: "email_received",
            message: "Synced Gmail RFQ rfq-999-message.",
            rfqId: "rfq-999",
          },
        ],
        links: [
          {
            externalId: "rfq-204-thread:rfq-204-gmail-message",
            provider: "gmail",
            rfqId: "rfq-204",
            syncStatus: "linked",
          },
          {
            externalId: "mock-calendar-002",
            provider: "calendar",
            rfqId: "rfq-204",
            syncStatus: "stale",
          },
          {
            externalId: "rfq-999-message",
            provider: "gmail",
            rfqId: "rfq-999",
            syncStatus: "blocked",
          },
        ],
      },
      {
        activities: [
          {
            actorName: "FactoryBid connector",
            kind: "calendar_event",
            message: "Synced calendar quote work hold.",
            rfqId: "rfq-204",
          },
          {
            actorName: "FactoryBid connector",
            kind: "calendar_event",
            message: "Synced calendar quote due.",
            rfqId: "rfq-204",
          },
        ],
        links: [
          {
            externalId: "rfq-204-thread:rfq-204-gmail-message",
            provider: "gmail",
            rfqId: "rfq-204",
            syncStatus: "stale",
          },
          {
            externalId: "mock-calendar-001",
            provider: "calendar",
            rfqId: "rfq-204",
            syncStatus: "linked",
          },
        ],
      },
    ],
    syncCount: 2,
  }
}
