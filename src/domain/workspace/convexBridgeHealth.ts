export type WorkspaceConvexBridgeCapabilityKey =
  | "follow_up_activity_reads"
  | "follow_up_readiness_writes"
  | "offer_release_reads"
  | "offer_reply_writes"
  | "provider_outcome_readiness_writes"
  | "provider_run_reads"
  | "workspace_writes"

export interface WorkspaceConvexBridgeCapability {
  configured: boolean
  key: WorkspaceConvexBridgeCapabilityKey
  label: string
}

export type WorkspaceConvexBridgeIdentityMapKey = "offer_id_map" | "quote_id_map" | "rfq_id_map"

export interface WorkspaceConvexBridgeIdentityMap {
  configured: boolean
  key: WorkspaceConvexBridgeIdentityMapKey
  label: string
  localIdCount: number
}

export type WorkspaceConvexBridgeHealthStatus = "configured" | "missing" | "partial"
export type WorkspaceConvexRuntimeConfigStatus = "configured" | "invalid" | "missing"
export type WorkspaceConvexRuntimeConfigKey = "convex_site_url" | "convex_url"

export interface WorkspaceConvexBridgeHealth {
  availableCapabilityCount: number
  availableIdentityMapCount?: number
  capabilities: WorkspaceConvexBridgeCapability[]
  identityMaps?: WorkspaceConvexBridgeIdentityMap[]
  missingCapabilityLabels: string[]
  missingIdentityMapLabels?: string[]
  status: WorkspaceConvexBridgeHealthStatus
  totalCapabilityCount: number
  totalIdentityMapCount?: number
}

export interface WorkspaceConvexRuntimeConfigEntry {
  configured: boolean
  issue?: string
  key: WorkspaceConvexRuntimeConfigKey
  label: string
  value?: string
}

export interface WorkspaceConvexRuntimeProbe {
  convexSiteUrl?: unknown
  convexUrl?: unknown
}

export interface WorkspaceConvexRuntimeConfigHealth {
  configuredCount: number
  entries: WorkspaceConvexRuntimeConfigEntry[]
  invalidLabels: string[]
  missingLabels: string[]
  nextActionLabels: string[]
  operatorSummary: string
  status: WorkspaceConvexRuntimeConfigStatus
  totalCount: number
}

export type WorkspaceConvexBridgeCapabilityAvailability = Record<WorkspaceConvexBridgeCapabilityKey, boolean>

export interface WorkspaceConvexBridgeProbe {
  offerIdMapLocalIdCount?: number
  hasFollowUpActivityReadQueryRef?: boolean
  hasFollowUpReadinessMutationRef?: boolean
  hasOfferProviderOutcomeReadinessMutationRef?: boolean
  hasOfferReleaseExecutionsQueryRef?: boolean
  hasOfferReplyMutationRef?: boolean
  hasProviderRunsByRfqQueryRef?: boolean
  hasRunMutation?: boolean
  hasRunQuery?: boolean
  hasWorkspaceMutationRefs?: boolean
  quoteIdMapLocalIdCount?: number
  rfqIdMapLocalIdCount?: number
}

const convexBridgeCapabilityDefinitions: Array<{
  key: WorkspaceConvexBridgeCapabilityKey
  label: string
}> = [
  { key: "workspace_writes", label: "workspace writes" },
  { key: "provider_run_reads", label: "provider run reads" },
  { key: "offer_release_reads", label: "offer release reads" },
  { key: "follow_up_activity_reads", label: "follow-up activity reads" },
  { key: "follow_up_readiness_writes", label: "follow-up readiness writes" },
  { key: "provider_outcome_readiness_writes", label: "provider outcome readiness writes" },
  { key: "offer_reply_writes", label: "offer reply writes" },
]

const convexBridgeIdentityMapDefinitions: Array<{
  key: WorkspaceConvexBridgeIdentityMapKey
  label: string
}> = [
  { key: "rfq_id_map", label: "RFQ ID map" },
  { key: "offer_id_map", label: "offer ID map" },
  { key: "quote_id_map", label: "quote ID map" },
]

const convexRuntimeConfigDefinitions: Array<{
  key: WorkspaceConvexRuntimeConfigKey
  label: string
  required: boolean
}> = [
  { key: "convex_url", label: "VITE_CONVEX_URL", required: true },
  { key: "convex_site_url", label: "VITE_CONVEX_SITE_URL", required: false },
]

export function summarizeWorkspaceConvexBridgeHealth(
  availability: WorkspaceConvexBridgeCapabilityAvailability,
): WorkspaceConvexBridgeHealth {
  const capabilities = convexBridgeCapabilityDefinitions.map((definition) => ({
    configured: availability[definition.key],
    key: definition.key,
    label: definition.label,
  }))
  const missingCapabilityLabels = capabilities
    .filter((capability) => !capability.configured)
    .map((capability) => capability.label)
  const availableCapabilityCount = capabilities.length - missingCapabilityLabels.length

  return {
    availableCapabilityCount,
    availableIdentityMapCount: 0,
    capabilities,
    identityMaps: [],
    missingCapabilityLabels,
    missingIdentityMapLabels: [],
    status:
      availableCapabilityCount === 0
        ? "missing"
        : availableCapabilityCount === capabilities.length
          ? "configured"
          : "partial",
    totalCapabilityCount: capabilities.length,
    totalIdentityMapCount: 0,
  }
}

export function summarizeWorkspaceConvexBridgeProbe(
  probe: WorkspaceConvexBridgeProbe | undefined,
): WorkspaceConvexBridgeHealth {
  const capabilityHealth = summarizeWorkspaceConvexBridgeHealth({
    follow_up_activity_reads: Boolean(probe?.hasFollowUpActivityReadQueryRef && probe.hasRunQuery),
    follow_up_readiness_writes: Boolean(probe?.hasFollowUpReadinessMutationRef && probe.hasRunMutation),
    offer_release_reads: Boolean(probe?.hasOfferReleaseExecutionsQueryRef && probe.hasRunQuery),
    offer_reply_writes: Boolean(probe?.hasOfferReplyMutationRef && probe.hasRunMutation),
    provider_outcome_readiness_writes: Boolean(
      probe?.hasOfferProviderOutcomeReadinessMutationRef && probe.hasRunMutation,
    ),
    provider_run_reads: Boolean(probe?.hasProviderRunsByRfqQueryRef && probe.hasRunQuery),
    workspace_writes: Boolean(probe?.hasWorkspaceMutationRefs && probe.hasRunMutation),
  })
  const identityMapCounts: Record<WorkspaceConvexBridgeIdentityMapKey, number> = {
    offer_id_map: positiveCount(probe?.offerIdMapLocalIdCount),
    quote_id_map: positiveCount(probe?.quoteIdMapLocalIdCount),
    rfq_id_map: positiveCount(probe?.rfqIdMapLocalIdCount),
  }
  const identityMaps = convexBridgeIdentityMapDefinitions.map((definition) => {
    const localIdCount = identityMapCounts[definition.key]
    return {
      configured: localIdCount > 0,
      key: definition.key,
      label: definition.label,
      localIdCount,
    }
  })
  const missingIdentityMapLabels = identityMaps.filter((identityMap) => !identityMap.configured).map((identityMap) => identityMap.label)
  const availableIdentityMapCount = identityMaps.length - missingIdentityMapLabels.length
  const availableBridgeFactCount = capabilityHealth.availableCapabilityCount + availableIdentityMapCount
  const totalBridgeFactCount = capabilityHealth.totalCapabilityCount + identityMaps.length

  return {
    ...capabilityHealth,
    availableIdentityMapCount,
    identityMaps,
    missingIdentityMapLabels,
    status:
      availableBridgeFactCount === 0
        ? "missing"
        : availableBridgeFactCount === totalBridgeFactCount
          ? "configured"
          : "partial",
    totalIdentityMapCount: identityMaps.length,
  }
}

export function countWorkspaceConvexBridgeIdMapEntries(map: Record<string, unknown> | undefined): number {
  if (!map) {
    return 0
  }

  return Object.values(map).filter((value) => normalizeWorkspaceConvexBridgeMappedId(value) !== undefined).length
}

export function resolveWorkspaceConvexBridgeMappedId(
  map: Record<string, unknown> | undefined,
  localId: string,
): string | undefined {
  return normalizeWorkspaceConvexBridgeMappedId(map?.[localId])
}

export function summarizeWorkspaceConvexRuntimeConfig(
  probe: WorkspaceConvexRuntimeProbe,
): WorkspaceConvexRuntimeConfigHealth {
  const rawValues: Record<WorkspaceConvexRuntimeConfigKey, unknown> = {
    convex_site_url: probe.convexSiteUrl,
    convex_url: probe.convexUrl,
  }
  const entries = convexRuntimeConfigDefinitions.map((definition) => {
    const normalized = normalizeWorkspaceConvexRuntimeUrl(rawValues[definition.key], definition.required)
    return {
      configured: normalized.configured,
      issue: normalized.issue,
      key: definition.key,
      label: definition.label,
      value: normalized.value,
    }
  })
  const invalidLabels = entries.filter((entry) => entry.issue === "invalid URL").map((entry) => entry.label)
  const missingLabels = entries.filter((entry) => entry.issue === "missing").map((entry) => entry.label)
  const requiredConvexUrl = entries.find((entry) => entry.key === "convex_url")
  const configuredCount = entries.filter((entry) => entry.configured).length
  const status: WorkspaceConvexRuntimeConfigStatus =
    invalidLabels.length > 0 ? "invalid" : requiredConvexUrl?.configured ? "configured" : "missing"

  return {
    configuredCount,
    entries,
    invalidLabels,
    missingLabels,
    nextActionLabels: convexRuntimeConfigNextActions(status, invalidLabels, missingLabels),
    operatorSummary: convexRuntimeConfigOperatorSummary(status, configuredCount, entries.length, invalidLabels, missingLabels),
    status,
    totalCount: entries.length,
  }
}

function positiveCount(value: number | undefined): number {
  return Number.isFinite(value) && value !== undefined && value > 0 ? Math.floor(value) : 0
}

function normalizeWorkspaceConvexBridgeMappedId(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const normalizedId = value.trim()
  return normalizedId.length > 0 ? normalizedId : undefined
}

function normalizeWorkspaceConvexRuntimeUrl(
  value: unknown,
  required: boolean,
): { configured: boolean; issue?: string; value?: string } {
  if (typeof value !== "string") {
    return { configured: false, issue: required ? "missing" : undefined }
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return { configured: false, issue: required ? "missing" : undefined }
  }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { configured: false, issue: "invalid URL" }
    }
    return { configured: true, value: url.toString() }
  } catch {
    return { configured: false, issue: "invalid URL" }
  }
}

function convexRuntimeConfigNextActions(
  status: WorkspaceConvexRuntimeConfigStatus,
  invalidLabels: string[],
  missingLabels: string[],
): string[] {
  if (status === "configured") {
    return ["Install the optional browser bridge with generated Convex refs before enabling persisted reads or writes."]
  }

  if (status === "invalid") {
    return [`Fix malformed public Convex runtime setting${invalidLabels.length === 1 ? "" : "s"}: ${invalidLabels.join(", ")}.`]
  }

  const missingRequired = missingLabels.includes("VITE_CONVEX_URL") ? "VITE_CONVEX_URL" : missingLabels.join(", ")
  return [`Set ${missingRequired} in ignored local env before creating a Convex browser client.`]
}

function convexRuntimeConfigOperatorSummary(
  status: WorkspaceConvexRuntimeConfigStatus,
  configuredCount: number,
  totalCount: number,
  invalidLabels: string[],
  missingLabels: string[],
): string {
  if (status === "configured") {
    return `${configuredCount}/${totalCount} public Convex runtime URL${totalCount === 1 ? "" : "s"} configured; browser bridge can be installed behind the existing fallback boundary.`
  }

  if (status === "invalid") {
    return `Public Convex runtime config is invalid: ${invalidLabels.join(", ")}.`
  }

  return `Public Convex runtime config is missing: ${missingLabels.join(", ")}. Local fallback remains active.`
}
