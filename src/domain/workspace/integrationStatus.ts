import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import type { ConnectorSyncPersistenceSnapshot } from "../integrations/connectorSyncPersistence"
import type { OfferFollowUpActivityReadinessSyncHealthSummary } from "../offers/offerFollowUpActivityReadinessSyncHealth"
import type { ProviderRunAudit } from "../providers/providerRunAudit"
import {
  providerRunReadSyncIntegrationDetail,
  providerRunReadSyncIntegrationReviewSuffix,
  type ProviderRunReadSyncState,
} from "../providers/providerRunReadSync"
import type { WorkspacePersistenceMode } from "./workspacePersistenceRuntime"

export type IntegrationHealthStatus = "live" | "fallback" | "attention" | "blocked"
export type IntegrationSourceSeverity = "healthy" | "attention" | "blocked"
export type IntegrationStatusSourceKey =
  | "calendar_follow_up"
  | "connector"
  | "convex_bridge"
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

export type WorkspaceConvexBridgeHealthStatus = "configured" | "missing" | "partial"

export interface WorkspaceConvexBridgeHealth {
  availableCapabilityCount: number
  missingCapabilityLabels: string[]
  status: WorkspaceConvexBridgeHealthStatus
  totalCapabilityCount: number
}

export interface WorkspaceIntegrationStatusInput {
  convexBridgeHealth?: WorkspaceConvexBridgeHealth
  connectorErrorCount?: number
  connectorSnapshot: ConnectorSyncPersistenceSnapshot
  followUpReadinessSyncHealth?: OfferFollowUpActivityReadinessSyncHealthSummary
  followUpScheduledAt?: string
  persistenceMode: WorkspacePersistenceMode
  providerRunReadSync?: ProviderRunReadSyncState
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
  convexBridgeHealth,
  connectorErrorCount = 0,
  connectorSnapshot,
  followUpReadinessSyncHealth,
  followUpScheduledAt,
  persistenceMode,
  providerRunReadSync,
  providerRuns,
  replySync,
  rfqId,
  syncErrorCount,
}: WorkspaceIntegrationStatusInput): WorkspaceIntegrationStatus {
  const sources = [
    ...(convexBridgeHealth ? [convexBridgeSource(convexBridgeHealth)] : []),
    persistenceSource(persistenceMode, syncErrorCount, followUpReadinessSyncHealth),
    connectorSource(connectorSnapshot, rfqId, connectorErrorCount),
    providerRunSource(providerRuns, providerRunReadSync),
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

function convexBridgeSource(health: WorkspaceConvexBridgeHealth): IntegrationStatusSource {
  if (health.status === "configured") {
    return {
      count: health.availableCapabilityCount,
      detail: `${health.availableCapabilityCount}/${health.totalCapabilityCount} optional Convex bridge capabilities are configured.`,
      key: "convex_bridge",
      label: "Convex bridge",
      severity: "healthy",
      status: "convex",
    }
  }

  if (health.status === "partial") {
    const missingText = health.missingCapabilityLabels.slice(0, 3).join(", ")
    const hiddenCount = Math.max(0, health.missingCapabilityLabels.length - 3)
    const suffix = hiddenCount > 0 ? `, and ${hiddenCount} more` : ""
    return {
      count: health.availableCapabilityCount,
      detail: `${health.availableCapabilityCount}/${health.totalCapabilityCount} optional Convex bridge capabilities are configured; missing ${missingText}${suffix}.`,
      key: "convex_bridge",
      label: "Convex bridge",
      severity: "attention",
      status: "review",
    }
  }

  return {
    count: 0,
    detail: "No optional browser Convex bridge is configured; workspace uses local fallback paths.",
    key: "convex_bridge",
    label: "Convex bridge",
    severity: "attention",
    status: "local",
  }
}

function persistenceSource(
  mode: WorkspacePersistenceMode,
  syncErrorCount: number,
  followUpReadinessSyncHealth: OfferFollowUpActivityReadinessSyncHealthSummary | undefined,
): IntegrationStatusSource {
  if (followUpReadinessSyncHealth && followUpReadinessSyncHealth.totalFallbackCount > 0) {
    const fallbackCount = followUpReadinessSyncHealth.totalFallbackCount
    const fallbackNoun = `fallback${fallbackCount === 1 ? "" : "s"}`
    const latestRecency = followUpReadinessSyncHealth.latestFallbackRecency === "stale" ? "stale" : "current"
    const operationText = `read ${followUpReadinessSyncHealth.readFallbackCount}, write ${followUpReadinessSyncHealth.writeFallbackCount}`
    const totalFallbackText =
      syncErrorCount > fallbackCount ? ` ${syncErrorCount} total workspace fallback operations recorded.` : ""

    return {
      detail: `${fallbackCount} follow-up readiness persistence ${fallbackNoun} recorded (${operationText}); latest fallback is ${latestRecency}.${totalFallbackText}`,
      key: "persistence",
      label: "Persistence",
      severity: followUpReadinessSyncHealth.severity === "critical" ? "blocked" : "attention",
      status: followUpReadinessSyncHealth.severity === "critical" ? "stale" : "fallback",
      count: Math.max(syncErrorCount, fallbackCount),
    }
  }

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

function providerRunSource(
  providerRuns: ProviderRunAudit[],
  readSync: ProviderRunReadSyncState | undefined,
): IntegrationStatusSource {
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

  if (readSync?.status === "fallback") {
    return {
      count: providerRuns.length,
      detail: providerRunReadSyncIntegrationDetail(readSync),
      key: "provider_runs",
      label: "Provider runs",
      severity: "attention",
      status: "fallback",
    }
  }

  if (readSync?.status === "pending") {
    return {
      count: providerRuns.length,
      detail: providerRunReadSyncIntegrationDetail(readSync),
      key: "provider_runs",
      label: "Provider runs",
      severity: "attention",
      status: "pending",
    }
  }

  if (reviewCount > 0) {
    return {
      count: providerRuns.length,
      detail: `${reviewCount} provider run${reviewCount === 1 ? "" : "s"} used fallback or warning paths.${readSync ? providerRunReadSyncIntegrationReviewSuffix(readSync) : ""}`,
      key: "provider_runs",
      label: "Provider runs",
      severity: "attention",
      status: "review",
    }
  }

  if (readSync?.status === "convex") {
    return {
      count: providerRuns.length,
      detail: providerRunReadSyncIntegrationDetail(readSync),
      key: "provider_runs",
      label: "Provider runs",
      severity: "healthy",
      status: "convex",
    }
  }

  if (readSync?.status === "local") {
    return {
      count: providerRuns.length,
      detail: providerRunReadSyncIntegrationDetail(readSync),
      key: "provider_runs",
      label: "Provider runs",
      severity: "attention",
      status: "local",
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
