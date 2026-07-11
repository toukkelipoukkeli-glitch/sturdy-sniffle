import { describe, expect, it } from "vitest"

import type { ConnectorSyncPersistenceSnapshot } from "../integrations/connectorSyncPersistence"
import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import {
  buildOfferFollowUpActivityReadinessSyncHealthEvent,
  summarizeOfferFollowUpActivityReadinessSyncHealth,
} from "../offers/offerFollowUpActivityReadinessSyncHealth"
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

  it("surfaces configured optional Convex bridge capability health", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: {
        availableCapabilityCount: 4,
        capabilities: [
          { configured: true, key: "workspace_writes", label: "workspace writes" },
          { configured: true, key: "provider_run_reads", label: "provider run reads" },
          { configured: true, key: "offer_release_reads", label: "offer release reads" },
          { configured: true, key: "follow_up_activity_reads", label: "follow-up activity reads" },
        ],
        missingCapabilityLabels: [],
        status: "configured",
        totalCapabilityCount: 4,
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    const convexBridgeSource = status.sources.find((source) => source.key === "convex_bridge")
    expect(convexBridgeSource?.actions).toBeUndefined()
    expect(convexBridgeSource).toMatchObject({
      count: 4,
      detail: "4/4 optional Convex bridge capabilities are configured.",
      details: [
        { key: "workspace_writes", label: "workspace writes", status: "configured" },
        { key: "provider_run_reads", label: "provider run reads", status: "configured" },
        { key: "offer_release_reads", label: "offer release reads", status: "configured" },
        { key: "follow_up_activity_reads", label: "follow-up activity reads", status: "configured" },
      ],
      severity: "healthy",
      status: "convex",
    })
  })

  it("surfaces missing and partial optional Convex bridge capability health", () => {
    const missing = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: {
        availableCapabilityCount: 0,
        capabilities: [
          { configured: false, key: "workspace_writes", label: "workspace writes" },
          { configured: false, key: "provider_run_reads", label: "provider run reads" },
        ],
        missingCapabilityLabels: ["workspace writes", "provider run reads"],
        status: "missing",
        totalCapabilityCount: 2,
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "local",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })
    const partial = summarizeWorkspaceIntegrationStatus({
      convexBridgeHealth: {
        availableCapabilityCount: 1,
        capabilities: [
          { configured: true, key: "workspace_writes", label: "workspace writes" },
          { configured: false, key: "provider_run_reads", label: "provider run reads" },
          { configured: false, key: "offer_release_reads", label: "offer release reads" },
          { configured: false, key: "follow_up_activity_reads", label: "follow-up activity reads" },
          { configured: false, key: "readiness_writes", label: "readiness writes" },
        ],
        missingCapabilityLabels: ["provider run reads", "offer release reads", "follow-up activity reads", "readiness writes"],
        status: "partial",
        totalCapabilityCount: 5,
      },
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(missing.status).toBe("fallback")
    expect(missing.sources.find((source) => source.key === "convex_bridge")).toMatchObject({
      actions: [
        {
          detail:
            "Expose browser bridge refs plus runQuery/runMutation before expecting persisted workspace reads or writes.",
          key: "configure_bridge",
          label: "Configure Convex bridge",
        },
        {
          detail: "Keep local fallback paths visible until bridge health reports configured.",
          key: "keep_local_fallback",
          label: "Keep local fallback",
        },
      ],
      count: 0,
      detail: "No optional browser Convex bridge is configured; workspace uses local fallback paths.",
      details: [
        { key: "workspace_writes", label: "workspace writes", status: "missing" },
        { key: "provider_run_reads", label: "provider run reads", status: "missing" },
      ],
      severity: "attention",
      status: "local",
    })
    expect(partial.status).toBe("attention")
    expect(partial.sources.find((source) => source.key === "convex_bridge")).toMatchObject({
      actions: [
        {
          detail: "Wire provider run reads, offer release reads and follow-up activity reads, plus 1 more in the optional browser bridge.",
          key: "wire_missing_capabilities",
          label: "Add missing bridge refs",
        },
        {
          detail: "Keep local fallback paths visible until bridge health reports configured.",
          key: "keep_local_fallback",
          label: "Keep local fallback",
        },
      ],
      count: 1,
      detail:
        "1/5 optional Convex bridge capabilities are configured; missing provider run reads, offer release reads, follow-up activity reads, and 1 more.",
      details: [
        { key: "workspace_writes", label: "workspace writes", status: "configured" },
        { key: "provider_run_reads", label: "provider run reads", status: "missing" },
        { key: "offer_release_reads", label: "offer release reads", status: "missing" },
        { key: "follow_up_activity_reads", label: "follow-up activity reads", status: "missing" },
        { key: "readiness_writes", label: "readiness writes", status: "missing" },
      ],
      severity: "attention",
      status: "review",
    })
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

  it("surfaces follow-up readiness sync health on the persistence source", () => {
    const syncHealth = summarizeOfferFollowUpActivityReadinessSyncHealth(
      [
        buildOfferFollowUpActivityReadinessSyncHealthEvent({
          offerId: "offer-204",
          operation: "read",
          recordedAt: "2026-06-18T05:00:00.000Z",
          rfqId: "rfq-204",
        }),
        buildOfferFollowUpActivityReadinessSyncHealthEvent({
          nonce: "write",
          offerId: "offer-204",
          operation: "write",
          recordedAt: "2026-06-18T05:10:00.000Z",
          rfqId: "rfq-204",
        }),
      ],
      { now: "2026-06-20T06:00:00.000Z" },
    )

    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpReadinessSyncHealth: syncHealth,
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 2,
    })

    expect(status.status).toBe("blocked")
    expect(status.sources.find((source) => source.key === "persistence")).toMatchObject({
      count: 2,
      detail: "2 follow-up readiness persistence fallbacks recorded (read 1, write 1); latest fallback is stale.",
      severity: "blocked",
      status: "stale",
    })
    expect(status.warnings).toContain(
      "Persistence: 2 follow-up readiness persistence fallbacks recorded (read 1, write 1); latest fallback is stale.",
    )
  })

  it("surfaces Convex provider-run read health on the provider source", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRunReadSync: {
        fallbackCount: 0,
        localRunCount: 1,
        persistedRunCount: 1,
        status: "convex",
      },
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("live")
    expect(status.sources.find((source) => source.key === "provider_runs")).toMatchObject({
      count: 1,
      detail: "1 persisted provider audit read from Convex and merged with 1 local audit.",
      severity: "healthy",
      status: "convex",
    })
  })

  it("surfaces provider-run read fallback health on the provider source", () => {
    const status = summarizeWorkspaceIntegrationStatus({
      connectorSnapshot: connectorSnapshot("linked"),
      followUpScheduledAt: "2026-06-27T06:00:00.000Z",
      persistenceMode: "convex",
      providerRunReadSync: {
        fallbackCount: 1,
        localRunCount: 1,
        persistedRunCount: 0,
        status: "fallback",
      },
      providerRuns: [providerAudit({ status: "succeeded" })],
      replySync: replySync({ matched: true, status: "succeeded" }),
      rfqId: "rfq-204",
      syncErrorCount: 0,
    })

    expect(status.status).toBe("fallback")
    expect(status.sources.find((source) => source.key === "provider_runs")).toMatchObject({
      count: 1,
      detail: "Provider run history fell back to 1 local audit after a Convex read failure.",
      severity: "attention",
      status: "fallback",
    })
    expect(status.warnings).toContain(
      "Provider runs: Provider run history fell back to 1 local audit after a Convex read failure.",
    )
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
