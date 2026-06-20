import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import type { ConvexConnectorRfqSyncPayload } from "../integrations/convexConnectorSync"
import type { ProviderRunAudit } from "../providers/providerRunAudit"
import { buildWorkspaceAction } from "./workspaceActions"
import { buildWorkspaceAuditFeed } from "./workspaceAuditFeed"

describe("workspace audit feed", () => {
  it("merges workspace, connector, provider, reply, and follow-up events newest first", () => {
    const feed = buildWorkspaceAuditFeed(
      {
        actions: [
          buildWorkspaceAction({
            actor: "Sari",
            fromStatus: "triage",
            kind: "status_change",
            occurredAt: "2026-06-20T08:00:00.000Z",
            rfqId: "rfq-204",
            toStatus: "estimating",
          }),
        ],
        connectorSyncs: [
          {
            payload: connectorPayload("stale"),
            recordedAt: "2026-06-20T08:05:00.000Z",
          },
        ],
        followUps: [
          {
            offerId: "offer-204",
            offerNumber: "OFFER-204",
            rfqId: "rfq-204",
            scheduledAt: "2026-06-20T08:12:00.000Z",
          },
        ],
        offerReplySyncs: [
          {
            result: replySync({ matched: true, status: "fallback" }),
            syncedAt: "2026-06-20T08:11:00.000Z",
          },
        ],
        providerRuns: [providerAudit({ status: "failed" })],
      },
      { generatedAt: "2026-06-20T09:00:00.000Z" },
    )

    expect(feed.auditVersion).toBe("workspace-audit-feed.v1")
    expect(feed.summary).toMatchObject({
      attentionCount: 2,
      blockedCount: 1,
      eventCount: 7,
      latestEventAt: "2026-06-20T08:12:00.000Z",
    })
    expect(feed.events.map((event) => [event.source, event.status, event.severity])).toEqual([
      ["calendar_follow_up", "scheduled", "info"],
      ["offer_reply", "accepted", "info"],
      ["provider_run", "failed", "blocked"],
      ["connector", "email_received", "info"],
      ["connector", "stale", "attention"],
      ["connector", "stale", "attention"],
      ["workspace_action", "status_change", "info"],
    ])
  })

  it("filters by RFQ and applies deterministic limits", () => {
    const feed = buildWorkspaceAuditFeed(
      {
        actions: [
          buildWorkspaceAction({
            actor: "Sari",
            fromStatus: "triage",
            kind: "status_change",
            occurredAt: "2026-06-20T08:00:00.000Z",
            rfqId: "rfq-204",
            toStatus: "estimating",
          }),
        ],
        connectorSyncs: [
          {
            payload: connectorPayload("linked"),
            recordedAt: "2026-06-20T08:05:00.000Z",
          },
        ],
        providerRuns: [
          providerAudit({ rfqId: "rfq-999", status: "succeeded" }),
          providerAudit({ rfqId: "rfq-204", status: "succeeded" }),
        ],
      },
      {
        generatedAt: "2026-06-20T09:00:00.000Z",
        limit: 2,
        rfqId: "rfq-204",
      },
    )

    expect(feed.events).toHaveLength(2)
    expect(feed.events.map((event) => event.rfqId)).toEqual(["rfq-204", "rfq-204"])
    expect(feed.events.map((event) => event.occurredAt)).toEqual([
      "2026-06-20T08:10:00.000Z",
      "2026-06-20T08:05:00.000Z",
    ])
  })

  it("records failed empty reply syncs as blocked audit events", () => {
    const feed = buildWorkspaceAuditFeed(
      {
        offerReplySyncs: [
          {
            result: replySync({ matched: false, status: "failed" }),
            syncedAt: "2026-06-20T08:11:00.000Z",
          },
        ],
      },
      { generatedAt: "2026-06-20T09:00:00.000Z" },
    )

    expect(feed.events).toEqual([
      expect.objectContaining({
        message: "Offer reply sync failed for OFFER-204.",
        severity: "blocked",
        source: "offer_reply",
        status: "failed",
      }),
    ])
  })

  it("keeps connector event keys stable when payload order changes", () => {
    const payload = connectorPayload("linked")
    const reversedPayload: ConvexConnectorRfqSyncPayload = {
      activities: [...payload.activities].reverse(),
      links: [...payload.links].reverse(),
    }
    const options = { generatedAt: "2026-06-20T09:00:00.000Z" }

    const original = buildWorkspaceAuditFeed(
      { connectorSyncs: [{ payload, recordedAt: "2026-06-20T08:05:00.000Z" }] },
      options,
    )
    const reversed = buildWorkspaceAuditFeed(
      { connectorSyncs: [{ payload: reversedPayload, recordedAt: "2026-06-20T08:05:00.000Z" }] },
      options,
    )

    const originalKeys = original.events.map((event) => event.key).toSorted()
    const reversedKeys = reversed.events.map((event) => event.key).toSorted()
    expect(originalKeys).toEqual(reversedKeys)
  })

  it("rejects invalid generated timestamps and limits", () => {
    expect(() =>
      buildWorkspaceAuditFeed({}, { generatedAt: "not-a-date" }),
    ).toThrow("generatedAt must be a valid ISO timestamp")
    expect(() =>
      buildWorkspaceAuditFeed({}, { generatedAt: "2026-06-20T09:00:00.000Z", limit: 0 }),
    ).toThrow("limit must be a positive integer")
  })
})

function connectorPayload(syncStatus: "linked" | "stale" | "blocked"): ConvexConnectorRfqSyncPayload {
  return {
    activities: [
      {
        actorName: "FactoryBid connector",
        kind: "email_received",
        message: "Synced Gmail RFQ thread-204:msg-204.",
        rfqId: "rfq-204",
      },
    ],
    links: [
      {
        externalId: "thread-204:msg-204",
        provider: "gmail",
        rfqId: "rfq-204",
        syncStatus,
      },
      {
        externalId: "event-204",
        provider: "calendar",
        rfqId: "rfq-204",
        syncStatus,
      },
    ],
  }
}

function providerAudit({
  rfqId = "rfq-204",
  status,
}: {
  rfqId?: string
  status: ProviderRunAudit["status"]
}): ProviderRunAudit {
  return {
    adapterVersion: "provider-adapter.v1.mock",
    auditVersion: "provider-run-audit.v1",
    completedAt: "2026-06-20T08:10:00.000Z",
    durationMs: 1000,
    errorMessage: status === "failed" ? "Provider unavailable." : undefined,
    inputHash: "hash-204",
    metadata: {},
    promptExcerpt: "Summarize RFQ.",
    provider: "mock",
    purpose: "summarize",
    runKey: `summarize:mock:hash-204:${rfqId}:${status}`,
    startedAt: "2026-06-20T08:09:59.000Z",
    status,
    trace: { rfqId },
    warnings: status === "skipped" ? ["Used mock fallback."] : [],
  }
}

function replySync({
  matched,
  status,
}: {
  matched: boolean
  status: GmailOfferReplySyncResult["status"]
}): GmailOfferReplySyncResult {
  return {
    adapterVersion: "gmail-offer-reply.v1",
    offerNumber: "OFFER-204",
    provider: status === "succeeded" ? "gmail" : "mock",
    query: "offer OFFER-204",
    records:
      status === "failed"
        ? []
        : [
            {
              message: {
                id: "msg-accepted",
                plainText: matched ? "We accept OFFER-204." : "Thanks for the update.",
                receivedAt: "2026-06-20T08:11:00.000Z",
                senderName: "Buyer",
                subject: "Re: OFFER-204",
              },
              parsed: {
                adapterVersion: "gmail-offer-reply.v1",
                matched,
                messageId: "msg-accepted",
                offerNumber: "OFFER-204",
                signal: matched ? "accepted" : undefined,
                warnings: matched ? [] : ["Message msg-accepted does not mention offer OFFER-204."],
              },
            },
          ],
    status,
    warnings: status === "fallback" ? ["Used mock offer reply fallback."] : [],
  }
}
