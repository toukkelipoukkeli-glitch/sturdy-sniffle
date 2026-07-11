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

export type WorkspaceConvexBridgeHealthStatus = "configured" | "missing" | "partial"

export interface WorkspaceConvexBridgeHealth {
  availableCapabilityCount: number
  capabilities: WorkspaceConvexBridgeCapability[]
  missingCapabilityLabels: string[]
  status: WorkspaceConvexBridgeHealthStatus
  totalCapabilityCount: number
}

export type WorkspaceConvexBridgeCapabilityAvailability = Record<WorkspaceConvexBridgeCapabilityKey, boolean>

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
    capabilities,
    missingCapabilityLabels,
    status:
      availableCapabilityCount === 0
        ? "missing"
        : availableCapabilityCount === capabilities.length
          ? "configured"
          : "partial",
    totalCapabilityCount: capabilities.length,
  }
}
