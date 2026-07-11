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

function positiveCount(value: number | undefined): number {
  return Number.isFinite(value) && value !== undefined && value > 0 ? Math.floor(value) : 0
}
