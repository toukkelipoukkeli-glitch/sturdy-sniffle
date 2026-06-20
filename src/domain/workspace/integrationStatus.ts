import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import type { ConnectorSyncPersistenceSnapshot } from "../integrations/connectorSyncPersistence"
import type { ProviderRunAudit } from "../providers/providerRunAudit"
import type { WorkspacePersistenceMode } from "./workspacePersistenceRuntime"

export type IntegrationHealthStatus = "live" | "fallback" | "attention" | "blocked"
export type IntegrationSourceSeverity = "healthy" | "attention" | "blocked"
export type IntegrationStatusSourceKey =
  | "calendar_follow_up"
  | "connector"
  | "offer_replies"
  | "persistence"
  | "provider_runs"
export type IntegrationStatusSourceStatus =
  | "audited"
  | "blocked"
  | "convex"
  | "failed"
  | "fallback"
  | "linked"
  | "local"
  | "matched"
  | "no_match"
  | "none"
  | "pending"
  | "review"
  | "scheduled"
  | "stale"
  | "unlinked"

export interface IntegrationStatusSource {
  key: IntegrationStatusSourceKey
  label: string
  severity: IntegrationSourceSeverity
  status: IntegrationStatusSourceStatus
  detail: string
  count?: number
}

export interface WorkspaceIntegrationStatusInput {
  connectorErrorCount?: number
  connectorSnapshot: ConnectorSyncPersistenceSnapshot
  followUpScheduledAt?: string
  persistenceMode: WorkspacePersistenceMode
  providerRuns: ProviderRunAudit[]
  replySync?: GmailOfferReplySyncResult
  rfqId: string
  syncErrorCount: number
}

export interface WorkspaceIntegrationStatus {
  status: IntegrationHealthStatus
  sources: IntegrationStatusSource[]
  warningCount: number
  warnings: string[]
}

export function summarizeWorkspaceIntegrationStatus({
  connectorErrorCount = 0,
  connectorSnapshot,
  followUpScheduledAt,
  persistenceMode,
  providerRuns,
  replySync,
  rfqId,
  syncErrorCount,
}: WorkspaceIntegrationStatusInput): WorkspaceIntegrationStatus {
  const sources = [
    persistenceSource(persistenceMode, syncErrorCount),
    connectorSource(connectorSnapshot, rfqId, connectorErrorCount),
    providerRunSource(providerRuns),
    offerReplySource(replySync),
    followUpSource(followUpScheduledAt),
  ]
  const warnings = sources
    .filter((source) => source.severity !== "healthy")
    .map((source) => `${source.label}: ${source.detail}`)

  return {
    sources,
    status: overallStatus(sources),
    warningCount: warnings.length,
    warnings,
  }
}

function persistenceSource(mode: WorkspacePersistenceMode, syncErrorCount: number): IntegrationStatusSource {
  if (syncErrorCount > 0) {
    return {
      detail: `${syncErrorCount} operation${syncErrorCount === 1 ? "" : "s"} used local fallback.`,
      key: "persistence",
      label: "Persistence",
      severity: "attention",
      status: "fallback",
      count: syncErrorCount,
    }
  }

  if (mode === "convex") {
    return {
      detail: "Workspace writes are routed through Convex.",
      key: "persistence",
      label: "Persistence",
      severity: "healthy",
      status: "convex",
    }
  }

  return {
    detail: "Workspace writes are kept in local fallback storage.",
    key: "persistence",
    label: "Persistence",
    severity: "attention",
    status: "local",
  }
}

function connectorSource(
  snapshot: ConnectorSyncPersistenceSnapshot,
  rfqId: string,
  connectorErrorCount: number,
): IntegrationStatusSource {
  const links = snapshot.payloads.flatMap((payload) => payload.links).filter((link) => link.rfqId === rfqId)
  const activities = snapshot.payloads.flatMap((payload) => payload.activities).filter((activity) => activity.rfqId === rfqId)
  const blockedCount = links.filter((link) => link.syncStatus === "blocked").length
  const staleCount = links.filter((link) => link.syncStatus === "stale").length

  if (connectorErrorCount > 0) {
    return {
      count: connectorErrorCount,
      detail: `${connectorErrorCount} connector sync attempt${connectorErrorCount === 1 ? "" : "s"} failed for this RFQ.`,
      key: "connector",
      label: "RFQ connectors",
      severity: "blocked",
      status: "failed",
    }
  }

  if (blockedCount > 0) {
    return {
      count: links.length,
      detail: `${blockedCount} connector link${blockedCount === 1 ? "" : "s"} blocked for this RFQ.`,
      key: "connector",
      label: "RFQ connectors",
      severity: "blocked",
      status: "blocked",
    }
  }

  if (staleCount > 0) {
    return {
      count: links.length,
      detail: `${staleCount} connector link${staleCount === 1 ? "" : "s"} stale while fallback data remains available.`,
      key: "connector",
      label: "RFQ connectors",
      severity: "attention",
      status: "stale",
    }
  }

  if (links.length > 0) {
    return {
      count: links.length,
      detail: `${links.length} Gmail/calendar link${links.length === 1 ? "" : "s"} attached to this RFQ.`,
      key: "connector",
      label: "RFQ connectors",
      severity: "healthy",
      status: "linked",
    }
  }

  if (activities.length > 0 || snapshot.syncCount > 0) {
    return {
      count: activities.length,
      detail: "Connector sync ran, but no persisted links match this RFQ yet.",
      key: "connector",
      label: "RFQ connectors",
      severity: "attention",
      status: "unlinked",
    }
  }

  return {
    detail: "No RFQ connector sync has been recorded in this workspace session.",
    key: "connector",
    label: "RFQ connectors",
    severity: "attention",
    status: "pending",
  }
}

function providerRunSource(providerRuns: ProviderRunAudit[]): IntegrationStatusSource {
  const failedCount = providerRuns.filter((run) => run.status === "failed").length
  const reviewCount = providerRuns.filter((run) => run.status === "skipped" || run.warnings.length > 0).length

  if (failedCount > 0) {
    return {
      count: providerRuns.length,
      detail: `${failedCount} provider run${failedCount === 1 ? "" : "s"} failed and need review.`,
      key: "provider_runs",
      label: "Provider runs",
      severity: "blocked",
      status: "failed",
    }
  }

  if (reviewCount > 0) {
    return {
      count: providerRuns.length,
      detail: `${reviewCount} provider run${reviewCount === 1 ? "" : "s"} used fallback or warning paths.`,
      key: "provider_runs",
      label: "Provider runs",
      severity: "attention",
      status: "review",
    }
  }

  if (providerRuns.length > 0) {
    return {
      count: providerRuns.length,
      detail: `${providerRuns.length} provider audit${providerRuns.length === 1 ? "" : "s"} available for review.`,
      key: "provider_runs",
      label: "Provider runs",
      severity: "healthy",
      status: "audited",
    }
  }

  return {
    detail: "No provider audit records are attached to this RFQ.",
    key: "provider_runs",
    label: "Provider runs",
    severity: "attention",
    status: "none",
  }
}

function offerReplySource(replySync: GmailOfferReplySyncResult | undefined): IntegrationStatusSource {
  if (!replySync) {
    return {
      detail: "Customer reply sync has not been run for this offer.",
      key: "offer_replies",
      label: "Offer replies",
      severity: "attention",
      status: "pending",
    }
  }

  const matchedCount = replySync.records.filter((record) => record.parsed.matched).length
  if (replySync.status === "failed") {
    return {
      count: replySync.records.length,
      detail: "Gmail reply sync failed; offer lifecycle stays unchanged.",
      key: "offer_replies",
      label: "Offer replies",
      severity: "blocked",
      status: "failed",
    }
  }

  if (replySync.status === "fallback") {
    return {
      count: matchedCount,
      detail: `${matchedCount} matched reply signal${matchedCount === 1 ? "" : "s"} from fallback search.`,
      key: "offer_replies",
      label: "Offer replies",
      severity: "attention",
      status: "fallback",
    }
  }

  if (matchedCount === 0) {
    return {
      count: replySync.records.length,
      detail: "Gmail sync returned messages, but no offer lifecycle signals matched.",
      key: "offer_replies",
      label: "Offer replies",
      severity: "attention",
      status: "no_match",
    }
  }

  return {
    count: matchedCount,
    detail: `${matchedCount} matched customer reply signal${matchedCount === 1 ? "" : "s"}.`,
    key: "offer_replies",
    label: "Offer replies",
    severity: "healthy",
    status: "matched",
  }
}

function followUpSource(followUpScheduledAt: string | undefined): IntegrationStatusSource {
  if (followUpScheduledAt) {
    return {
      detail: `Follow-up hold scheduled for ${followUpScheduledAt}.`,
      key: "calendar_follow_up",
      label: "Calendar follow-up",
      severity: "healthy",
      status: "scheduled",
    }
  }

  return {
    detail: "No offer follow-up calendar hold is scheduled yet.",
    key: "calendar_follow_up",
    label: "Calendar follow-up",
    severity: "attention",
    status: "pending",
  }
}

function overallStatus(sources: IntegrationStatusSource[]): IntegrationHealthStatus {
  if (sources.some((source) => source.severity === "blocked")) {
    return "blocked"
  }

  const fallbackStatuses = new Set(["fallback", "local", "stale"])
  if (sources.some((source) => fallbackStatuses.has(source.status))) {
    return "fallback"
  }

  if (sources.some((source) => source.severity === "attention")) {
    return "attention"
  }

  return "live"
}
