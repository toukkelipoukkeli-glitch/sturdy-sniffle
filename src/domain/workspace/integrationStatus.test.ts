import { describe, expect, it } from "vitest"

import type { ConnectorSyncPersistenceSnapshot } from "../integrations/connectorSyncPersistence"
import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import type { ProviderRunAudit } from "../providers/providerRunAudit"
import { summarizeWorkspaceIntegrationStatus } from "./integrationStatus"

describe("workspace integration status", () => {
  it("summarizes live connector, provider, reply, and follow-up state", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    expect(status.warningCount).toBe(0)
    expect(status.sources.map((source) => [source.key, source.status, source.severity])).toEqual([
      ["persistence", "convex", "healthy"],
      ["connector", "linked", "healthy"],
      ["provider_runs", "audited", "healthy"],
      ["offer_replies", "matched", "healthy"],
      ["calendar_follow_up", "scheduled", "healthy"],
    ])
  })

  it("marks local and stale integration paths as fallback while preserving counts", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("stale"),
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded", warnings: ["Used mock fallback."] })],
      replySync: replySync({ matched: false, status: "fallback" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.warningCount).toBe(5)
    expect(status.sources.find((source) => source.key === "connector")).toMatchObject({
      count: 2,
      severity: "attention",
      status: "stale",
    })
    expect(status.warnings).toContain("Persistence: Workspace writes are kept in local fallback storage.")
    expect(status.warnings).toContain("Calendar follow-up: No offer follow-up calendar hold is scheduled yet.")
  })

  it("escalates blocked connector, provider, and reply failures", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("blocked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "failed" })],
      replySync: replySync({ matched: false, status: "failed" }),
      rfqId: "rfq-204",
      syncErrorCount: 2,
    })

    expect(status.status).toBe("blocked")
    expect(status.warningCount).toBe(4)
    expect(status.sources.filter((source) => source.severity === "blocked").map((source) => source.key)).toEqual([
      "connector",
      "provider_runs",
      "offer_replies",
    ])
  })

  it("keeps connector sync failures separate from persistence fallback health", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorErrorCount: 1,
      connectorSnapshot: { payloads: [], syncCount: 0 },
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("blocked")
    expect(status.sources.find((source) => source.key === "persistence")).toMatchObject({
      severity: "healthy",
      status: "convex",
    })
    expect(status.sources.find((source) => source.key === "connector")).toMatchObject({
      count: 1,
      severity: "blocked",
      status: "failed",
    })
    expect(status.warnings).not.toContain("Persistence: Workspace writes are routed through Convex.")
  })
})

function connectorSnapshot(syncStatus: "linked" | "stale" | "blocked"): ConnectorSyncPersistenceSnapshot {
  return {
    payloads: [
      {
        activities: [
          {
            kind: "email_received",
            message: "Synced Gmail RFQ thread-001:msg-001.",
            rfqId: "rfq-204",
          },
        ],
        links: [
          {
            externalId: "thread-001:msg-001",
            provider: "gmail",
            rfqId: "rfq-204",
            syncStatus,
          },
          {
            externalId: "event-001",
            provider: "calendar",
            rfqId: "rfq-204",
            syncStatus,
          },
        ],
      },
    ],
    syncCount: 1,
  }
}

function providerAudit({
  status,
  warnings = [],
}: {
  status: ProviderRunAudit["status"]
  warnings?: string[]
}): ProviderRunAudit {
  return {
    adapterVersion: "provider-adapter.v1.mock",
    auditVersion: "provider-run-audit.v1",
    completedAt: "2026-06-20T06:00:01.000Z",
    durationMs: 1000,
    inputHash: "hash-001",
    metadata: {},
    promptExcerpt: "Summarize RFQ.",
    provider: "mock",
    purpose: "summarize",
    runKey: `summarize:mock:hash-001:${status}`,
    startedAt: "2026-06-20T06:00:00.000Z",
    status,
    warnings,
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
    records: [
      {
        message: {
          id: "msg-001",
          plainText: matched ? "We accept offer OFFER-204." : "Thanks for the update.",
          receivedAt: "2026-06-20T07:00:00.000Z",
          subject: "Re: OFFER-204",
        },
        parsed: {
          adapterVersion: "gmail-offer-reply.v1",
          matched,
          messageId: "msg-001",
          offerNumber: "OFFER-204",
          warnings: matched ? [] : ["Message msg-001 does not mention offer OFFER-204."],
        },
      },
    ],
    status,
    warnings: status === "fallback" ? ["Used mock offer reply fallback."] : [],
  }
}
