import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import type { ConnectorSyncPersistenceSnapshot } from "../integrations/connectorSyncPersistence"
import type { OfferFollowUpActivityReadinessReadModel } from "../offers/offerFollowUpActivityReadinessReadModel"
import type { OfferFollowUpActivityReadinessSyncHealthSummary } from "../offers/offerFollowUpActivityReadinessSyncHealth"
import type { ProviderRunAudit } from "../providers/providerRunAudit"
import {
  providerRunReadSyncIntegrationDetail,
  providerRunReadSyncIntegrationReviewSuffix,
  type ProviderRunReadSyncState,
} from "../providers/providerRunReadSync"
import {
  calendarFollowUpRescheduleProviderOutcomeReadSyncIntegrationDetail,
  type CalendarFollowUpRescheduleProviderOutcomeReadSyncState,
} from "./calendarFollowUpRescheduleProviderOutcomeReadSync"
import type { WorkspaceConvexBrowserBridgeInstallPlan } from "./convexBrowserBridgeInstallPlan"
import type { WorkspaceConvexBrowserBridgeInstallerDecision } from "./convexBrowserBridgeInstaller"
import type { WorkspaceConvexBridgeHealth, WorkspaceConvexRuntimeConfigHealth } from "./convexBridgeHealth"
import type { WorkspacePersistenceMode } from "./workspacePersistenceRuntime"

export type IntegrationHealthStatus = "live" | "fallback" | "attention" | "blocked"
export type IntegrationSourceSeverity = "healthy" | "attention" | "blocked"
export type IntegrationStatusSourceKey =
  | "calendar_provider_outcome_reads"
  | "calendar_follow_up"
  | "connector"
  | "convex_bridge"
  | "convex_install_plan"
  | "convex_runtime"
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
  | "ready"
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
  actions?: IntegrationStatusSourceAction[]
  details?: IntegrationStatusSourceDetail[]
  diagnosticExport?: string
  count?: number
}

export interface IntegrationStatusSourceAction {
  detail: string
  key: string
  label: string
}

export interface IntegrationStatusSourceDetail {
  key: string
  label: string
  status: "configured" | "missing"
}

export interface WorkspaceIntegrationStatusInput {
  convexBridgeInstallPlan?: WorkspaceConvexBrowserBridgeInstallPlan
  convexBridgeInstallerDecision?: WorkspaceConvexBrowserBridgeInstallerDecision
  convexBridgeHealth?: WorkspaceConvexBridgeHealth
  convexRuntimeConfigHealth?: WorkspaceConvexRuntimeConfigHealth
  connectorErrorCount?: number
  connectorSnapshot: ConnectorSyncPersistenceSnapshot
  calendarProviderOutcomeReadSync?: CalendarFollowUpRescheduleProviderOutcomeReadSyncState
  followUpReadinessReadModel?: OfferFollowUpActivityReadinessReadModel
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
  convexBridgeInstallPlan,
  convexBridgeInstallerDecision,
  convexBridgeHealth,
  convexRuntimeConfigHealth,
  connectorErrorCount = 0,
  connectorSnapshot,
  calendarProviderOutcomeReadSync,
  followUpReadinessReadModel,
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
    ...(convexBridgeInstallPlan ? [convexBridgeInstallPlanSource(convexBridgeInstallPlan, convexBridgeInstallerDecision)] : []),
    ...(!convexBridgeInstallPlan && convexRuntimeConfigHealth ? [convexRuntimeSource(convexRuntimeConfigHealth)] : []),
    ...(!convexBridgeInstallPlan && convexBridgeHealth ? [convexBridgeSource(convexBridgeHealth)] : []),
    persistenceSource(persistenceMode, syncErrorCount, followUpReadinessSyncHealth, followUpReadinessReadModel),
    connectorSource(connectorSnapshot, rfqId, connectorErrorCount),
    providerRunSource(providerRuns, providerRunReadSync),
    offerReplySource(replySync),
    followUpSource(followUpScheduledAt),
    ...(calendarProviderOutcomeReadSync ? [calendarProviderOutcomeReadSource(calendarProviderOutcomeReadSync)] : []),
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

function convexBridgeInstallPlanSource(
  plan: WorkspaceConvexBrowserBridgeInstallPlan,
  installerDecision?: WorkspaceConvexBrowserBridgeInstallerDecision,
): IntegrationStatusSource {
  const runtimeReady = plan.runtimeConfigHealth.status === "configured"
  const bridgeReady = plan.bridgeHealth.status === "configured"
  const optInReady = installerDecision?.status === "ready"
  const details = [
    {
      key: "runtime_config",
      label: `Runtime config (${plan.runtimeConfigHealth.configuredCount}/${plan.runtimeConfigHealth.totalCount})`,
      status: runtimeReady ? ("configured" as const) : ("missing" as const),
    },
    {
      key: "bridge_runtime",
      label: `Bridge refs and identity maps (${plan.readyFactCount - plan.runtimeConfigHealth.configuredCount}/${
        plan.totalFactCount - plan.runtimeConfigHealth.totalCount
      })`,
      status: bridgeReady ? ("configured" as const) : ("missing" as const),
    },
    ...(installerDecision
      ? [
          {
            key: "installer_opt_in",
            label: `Installer opt-in (${installerDecision.enabled ? "enabled" : "disabled"})`,
            status: optInReady ? ("configured" as const) : ("missing" as const),
          },
        ]
      : []),
  ]
  const sourceActionLabels = installerDecision?.nextActionLabels ?? plan.nextActionLabels
  const actions = sourceActionLabels.map((detail, index) => ({
    detail,
    key: `convex_install_plan_${index + 1}`,
    label: installPlanActionLabel(plan.status, installerDecision?.status, detail),
  }))
  const sourceStatus = installerDecision?.status ?? plan.status

  return {
    actions,
    count: plan.readyFactCount,
    detail: installerDecision?.operatorSummary ?? plan.operatorSummary,
    details,
    key: "convex_install_plan",
    label: "Convex bridge install",
    severity: sourceStatus === "ready" ? "healthy" : "attention",
    status: sourceStatus === "ready" ? "ready" : sourceStatus === "fallback" ? "fallback" : "blocked",
  }
}

function installPlanActionLabel(
  planStatus: WorkspaceConvexBrowserBridgeInstallPlan["status"],
  installerStatus: WorkspaceConvexBrowserBridgeInstallerDecision["status"] | undefined,
  detail: string,
): string {
  if (detail.startsWith("Keep local fallback")) {
    return "Keep fallback active"
  }

  if (installerStatus === "ready" || (installerStatus === undefined && planStatus === "ready")) {
    return "Install guarded bridge"
  }

  if (installerStatus === "fallback") {
    return "Enable guarded bridge"
  }

  return "Resolve install blocker"
}

function convexRuntimeSource(health: WorkspaceConvexRuntimeConfigHealth): IntegrationStatusSource {
  const details = health.entries.map((entry) => ({
    key: entry.key,
    label: entry.issue ? `${entry.label} (${entry.issue})` : entry.label,
    status: entry.configured ? ("configured" as const) : ("missing" as const),
  }))

  if (health.status === "configured") {
    return {
      count: health.configuredCount,
      detail: health.operatorSummary,
      actions: health.nextActionLabels.map((detail, index) => ({
        detail,
        key: `convex_runtime_next_${index + 1}`,
        label: index === 0 ? "Install browser bridge" : "Runtime next action",
      })),
      details,
      key: "convex_runtime",
      label: "Convex runtime",
      severity: "healthy",
      status: "convex",
    }
  }

  if (health.status === "invalid") {
    return {
      count: health.configuredCount,
      detail: health.operatorSummary,
      actions: health.nextActionLabels.map((detail, index) => ({
        detail,
        key: `convex_runtime_fix_${index + 1}`,
        label: "Fix runtime config",
      })),
      details,
      key: "convex_runtime",
      label: "Convex runtime",
      severity: "attention",
      status: "review",
    }
  }

  return {
    count: health.configuredCount,
    detail: health.operatorSummary,
    actions: [
      ...health.nextActionLabels.map((detail, index) => ({
        detail,
        key: `convex_runtime_set_${index + 1}`,
        label: "Set Convex URL",
      })),
      {
        detail: "Keep local fallback paths visible until runtime config and browser bridge health are both ready.",
        key: "keep_local_fallback",
        label: "Keep local fallback",
      },
    ],
    details,
    key: "convex_runtime",
    label: "Convex runtime",
    severity: "attention",
    status: "local",
  }
}

function convexBridgeSource(health: WorkspaceConvexBridgeHealth): IntegrationStatusSource {
  if (health.status === "configured") {
    return {
      count: health.availableCapabilityCount,
      detail: convexBridgeConfiguredDetail(health),
      details: convexBridgeCapabilityDetails(health),
      diagnosticExport: convexBridgeDiagnosticExport(health, []),
      key: "convex_bridge",
      label: "Convex bridge",
      severity: "healthy",
      status: "convex",
    }
  }

  if (health.status === "partial") {
    const missingText = convexBridgeMissingCapabilitySummary([
      ...health.missingCapabilityLabels,
      ...(health.missingIdentityMapLabels ?? []),
    ])
    const actions = [
      {
        detail: `Wire ${missingText} in the optional browser bridge.`,
        key: "wire_missing_capabilities",
        label: "Add missing bridge refs",
      },
      {
        detail: "Keep local fallback paths visible until bridge health reports configured.",
        key: "keep_local_fallback",
        label: "Keep local fallback",
      },
    ] satisfies IntegrationStatusSourceAction[]

    return {
      count: health.availableCapabilityCount,
      detail: `${health.availableCapabilityCount}/${health.totalCapabilityCount} optional Convex bridge capabilities are configured; missing ${missingText}.`,
      actions,
      details: convexBridgeCapabilityDetails(health),
      diagnosticExport: convexBridgeDiagnosticExport(health, actions),
      key: "convex_bridge",
      label: "Convex bridge",
      severity: "attention",
      status: "review",
    }
  }

  const actions = [
    {
      detail: "Expose browser bridge refs plus runQuery/runMutation before expecting persisted workspace reads or writes.",
      key: "configure_bridge",
      label: "Configure Convex bridge",
    },
    {
      detail: "Keep local fallback paths visible until bridge health reports configured.",
      key: "keep_local_fallback",
      label: "Keep local fallback",
    },
  ] satisfies IntegrationStatusSourceAction[]

  return {
    count: 0,
    detail: "No optional browser Convex bridge is configured; workspace uses local fallback paths.",
    actions,
    details: convexBridgeCapabilityDetails(health),
    diagnosticExport: convexBridgeDiagnosticExport(health, actions),
    key: "convex_bridge",
    label: "Convex bridge",
    severity: "attention",
    status: "local",
  }
}

function convexBridgeCapabilityDetails(health: WorkspaceConvexBridgeHealth): IntegrationStatusSourceDetail[] | undefined {
  const identityMapDetails = (health.identityMaps ?? []).map((identityMap) => ({
    key: identityMap.key,
    label: `${identityMap.label} (${identityMap.localIdCount} local ${identityMap.localIdCount === 1 ? "ID" : "IDs"})`,
    status: identityMap.configured ? ("configured" as const) : ("missing" as const),
  }))

  if ((!health.capabilities || health.capabilities.length === 0) && identityMapDetails.length === 0) {
    return undefined
  }

  return [
    ...health.capabilities.map((capability) => ({
      key: capability.key,
      label: capability.label,
      status: capability.configured ? ("configured" as const) : ("missing" as const),
    })),
    ...identityMapDetails,
  ]
}

function convexBridgeConfiguredDetail(health: WorkspaceConvexBridgeHealth): string {
  const capabilityText = `${health.availableCapabilityCount}/${health.totalCapabilityCount} optional Convex bridge capabilities are configured.`
  if (!health.totalIdentityMapCount) {
    return capabilityText
  }

  return `${capabilityText} ${health.availableIdentityMapCount ?? 0}/${health.totalIdentityMapCount} identity maps are ready.`
}

function convexBridgeMissingCapabilitySummary(labels: string[]): string {
  if (labels.length === 0) {
    return "the missing bridge refs"
  }

  const visibleLabels = labels.slice(0, 3)
  const hiddenCount = Math.max(0, labels.length - visibleLabels.length)
  const visibleText = visibleLabels.join(", ")

  return hiddenCount > 0 ? `${visibleText}, and ${hiddenCount} more` : visibleText
}

function convexBridgeDiagnosticExport(
  health: WorkspaceConvexBridgeHealth,
  actions: IntegrationStatusSourceAction[],
): string {
  const capabilityLines = (health.capabilities ?? []).map(
    (capability) => `- ${capability.label}: ${capability.configured ? "configured" : "missing"}`,
  )
  const missingLines = health.missingCapabilityLabels.map((label) => `- ${label}`)
  const hasIdentityMapDetails = Boolean(health.totalIdentityMapCount)
  const identityMapLines = (health.identityMaps ?? []).map(
    (identityMap) =>
      `- ${identityMap.label}: ${identityMap.configured ? "configured" : "missing"} (${identityMap.localIdCount} local ${
        identityMap.localIdCount === 1 ? "ID" : "IDs"
      })`,
  )
  const missingIdentityMapLines = (health.missingIdentityMapLabels ?? []).map((label) => `- ${label}`)
  const actionLines = actions.map((action) => `- ${action.label}: ${action.detail}`)

  return [
    "Convex bridge health",
    `Status: ${health.status}`,
    `Capabilities configured: ${health.availableCapabilityCount}/${health.totalCapabilityCount}`,
    "Capability details:",
    ...(capabilityLines.length > 0 ? capabilityLines : ["- no capability details available"]),
    "Missing capabilities:",
    ...(missingLines.length > 0 ? missingLines : ["- none"]),
    ...(hasIdentityMapDetails
      ? [
          "Identity maps:",
          ...(identityMapLines.length > 0 ? identityMapLines : ["- no identity map details available"]),
          "Missing identity maps:",
          ...(missingIdentityMapLines.length > 0 ? missingIdentityMapLines : ["- none"]),
        ]
      : []),
    "Recovery actions:",
    ...(actionLines.length > 0 ? actionLines : ["- none"]),
  ].join("\n")
}

function persistenceSource(
  mode: WorkspacePersistenceMode,
  syncErrorCount: number,
  followUpReadinessSyncHealth: OfferFollowUpActivityReadinessSyncHealthSummary | undefined,
  followUpReadinessReadModel: OfferFollowUpActivityReadinessReadModel | undefined,
): IntegrationStatusSource {
  if (followUpReadinessSyncHealth && followUpReadinessSyncHealth.totalFallbackCount > 0) {
    const fallbackCount = followUpReadinessSyncHealth.totalFallbackCount
    const fallbackNoun = `fallback${fallbackCount === 1 ? "" : "s"}`
    const latestRecency = followUpReadinessSyncHealth.latestFallbackRecency === "stale" ? "stale" : "current"
    const operationText = `read ${followUpReadinessSyncHealth.readFallbackCount}, write ${followUpReadinessSyncHealth.writeFallbackCount}`
    const totalFallbackText =
      syncErrorCount > fallbackCount ? ` ${syncErrorCount} total workspace fallback operations recorded.` : ""

    return {
      actions: followUpReadinessIntegrationActions(followUpReadinessReadModel),
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
      actions: followUpReadinessIntegrationActions(followUpReadinessReadModel),
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
      actions: followUpReadinessIntegrationActions(followUpReadinessReadModel),
      detail: followUpReadinessReadModel
        ? `Workspace writes are routed through Convex. ${followUpReadinessIntegrationDetail(followUpReadinessReadModel)}`
        : "Workspace writes are routed through Convex.",
      key: "persistence",
      label: "Persistence",
      severity: followUpReadinessIntegrationSeverity(followUpReadinessReadModel, "healthy"),
      status: "convex",
    }
  }

  return {
    actions: followUpReadinessIntegrationActions(followUpReadinessReadModel),
    detail: followUpReadinessReadModel
      ? `Workspace writes are kept in local fallback storage. ${followUpReadinessIntegrationDetail(followUpReadinessReadModel)}`
      : "Workspace writes are kept in local fallback storage.",
    key: "persistence",
    label: "Persistence",
    severity: "attention",
    status: "local",
  }
}

function followUpReadinessIntegrationDetail(readModel: OfferFollowUpActivityReadinessReadModel): string {
  const sourceText = readModel.source === "none" ? "no source" : readModel.source
  const recordText = `${readModel.totalReadinessRecords} readiness record${readModel.totalReadinessRecords === 1 ? "" : "s"}`
  if (readModel.canUsePersistedRead) {
    return `Follow-up persisted read is ready from ${sourceText} with ${recordText}.`
  }
  return `Follow-up persisted read is ${readModel.status} from ${sourceText} with ${recordText}; local fallback remains guarded.`
}

function followUpReadinessIntegrationActions(
  readModel: OfferFollowUpActivityReadinessReadModel | undefined,
): IntegrationStatusSourceAction[] | undefined {
  if (!readModel || readModel.nextActionLabels.length === 0) {
    return undefined
  }

  return readModel.nextActionLabels.slice(0, 3).map((detail, index) => ({
    detail,
    key: `follow_up_readiness_read_${index + 1}`,
    label: followUpReadinessIntegrationActionLabel(readModel.status),
  }))
}

function followUpReadinessIntegrationActionLabel(status: OfferFollowUpActivityReadinessReadModel["status"]): string {
  switch (status) {
    case "ready":
      return "Use persisted readiness"
    case "partial":
      return "Record missing readiness"
    case "pending":
      return "Read readiness history"
    case "review":
      return "Review readiness read"
    case "fallback":
      return "Recover readiness reads"
  }
}

function followUpReadinessIntegrationSeverity(
  readModel: OfferFollowUpActivityReadinessReadModel | undefined,
  fallbackSeverity: IntegrationSourceSeverity,
): IntegrationSourceSeverity {
  if (!readModel || readModel.status === "ready") {
    return fallbackSeverity
  }
  return readModel.status === "fallback" ? "blocked" : "attention"
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

function calendarProviderOutcomeReadSource(
  readSync: CalendarFollowUpRescheduleProviderOutcomeReadSyncState,
): IntegrationStatusSource {
  const actions = calendarProviderOutcomeReadActions(readSync)

  return {
    actions: actions.length > 0 ? actions : undefined,
    count:
      readSync.status === "fallback"
        ? readSync.fallbackCount
        : readSync.status === "convex"
          ? readSync.persistedBatchCount
          : readSync.localBatchCount,
    detail: calendarFollowUpRescheduleProviderOutcomeReadSyncIntegrationDetail(readSync),
    diagnosticExport: calendarProviderOutcomeReadDiagnosticExport(readSync, actions),
    key: "calendar_provider_outcome_reads",
    label: "Calendar outcome reads",
    severity: readSync.status === "convex" ? "healthy" : "attention",
    status: readSync.status,
  }
}

function calendarProviderOutcomeReadActions(
  readSync: CalendarFollowUpRescheduleProviderOutcomeReadSyncState,
): IntegrationStatusSourceAction[] {
  switch (readSync.status) {
    case "convex":
      return readSync.persistedBatchCount > 0
        ? [
            {
              detail:
                "Use persisted calendar provider outcome batches when reviewing reschedule execution audits; keep local fallback batches visible for comparison.",
              key: "review_convex_calendar_outcomes",
              label: "Review Convex outcomes",
            },
          ]
        : []
    case "fallback":
      return [
        {
          detail:
            "Keep local calendar provider outcome batches visible and retry the optional Convex read before committing provider-side calendar changes.",
          key: "retry_calendar_outcome_read",
          label: "Retry outcome read",
        },
      ]
    case "local":
      return [
        {
          detail:
            "Configure the optional browser bridge calendar outcome query before expecting persisted calendar provider outcome history.",
          key: "configure_calendar_outcome_read",
          label: "Configure Convex read",
        },
      ]
    case "pending":
      return [
        {
          detail:
            "Keep local fallback batches visible while the optional Convex calendar provider outcome query is still loading.",
          key: "wait_for_calendar_outcome_read",
          label: "Wait for read result",
        },
      ]
  }
}

function calendarProviderOutcomeReadDiagnosticExport(
  readSync: CalendarFollowUpRescheduleProviderOutcomeReadSyncState,
  actions: IntegrationStatusSourceAction[],
): string {
  return [
    "Calendar provider outcome read diagnostics",
    `Status: ${readSync.status}`,
    `Batches: persisted ${readSync.persistedBatchCount}, local ${readSync.localBatchCount}, fallback ${readSync.fallbackCount}`,
    `Detail: ${calendarFollowUpRescheduleProviderOutcomeReadSyncIntegrationDetail(readSync)}`,
    "Recovery actions:",
    ...(actions.length > 0 ? actions.map((action) => `- ${action.label}: ${action.detail}`) : ["- none"]),
  ].join("\n")
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
