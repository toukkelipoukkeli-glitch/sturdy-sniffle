import {
  summarizeWorkspaceConvexBridgeProbe,
  type WorkspaceConvexBridgeHealth,
  type WorkspaceConvexBridgeProbe,
  type WorkspaceConvexRuntimeConfigHealth,
} from "./convexBridgeHealth"

export type WorkspaceConvexBrowserBridgeInstallPlanStatus = "blocked" | "ready"

export interface WorkspaceConvexBrowserBridgeInstallPlanInput {
  bridgeHealth?: WorkspaceConvexBridgeHealth
  bridgeProbe?: WorkspaceConvexBridgeProbe
  runtimeConfigHealth: WorkspaceConvexRuntimeConfigHealth
}

export interface WorkspaceConvexBrowserBridgeInstallPlan {
  blockedReasonLabels: string[]
  bridgeHealth: WorkspaceConvexBridgeHealth
  nextActionLabels: string[]
  operatorSummary: string
  readyFactCount: number
  runtimeConfigHealth: WorkspaceConvexRuntimeConfigHealth
  status: WorkspaceConvexBrowserBridgeInstallPlanStatus
  totalFactCount: number
}

export function buildWorkspaceConvexBrowserBridgeInstallPlan({
  bridgeHealth: providedBridgeHealth,
  bridgeProbe,
  runtimeConfigHealth,
}: WorkspaceConvexBrowserBridgeInstallPlanInput): WorkspaceConvexBrowserBridgeInstallPlan {
  const bridgeHealth = providedBridgeHealth ?? summarizeWorkspaceConvexBridgeProbe(bridgeProbe)
  const runtimeReady = runtimeConfigHealth.status === "configured"
  const bridgeReady = bridgeHealth.status === "configured"
  const blockedReasonLabels = [
    ...runtimeBlockedReasonLabels(runtimeConfigHealth),
    ...bridgeHealth.missingCapabilityLabels,
    ...(bridgeHealth.missingIdentityMapLabels ?? []),
  ]
  const readyFactCount =
    runtimeConfigHealth.configuredCount + bridgeHealth.availableCapabilityCount + (bridgeHealth.availableIdentityMapCount ?? 0)
  const totalFactCount =
    runtimeConfigHealth.totalCount + bridgeHealth.totalCapabilityCount + (bridgeHealth.totalIdentityMapCount ?? 0)
  const status: WorkspaceConvexBrowserBridgeInstallPlanStatus = runtimeReady && bridgeReady ? "ready" : "blocked"

  return {
    blockedReasonLabels,
    bridgeHealth,
    nextActionLabels: bridgeInstallNextActions(status, runtimeConfigHealth, bridgeHealth),
    operatorSummary: bridgeInstallOperatorSummary(status, readyFactCount, totalFactCount, blockedReasonLabels),
    readyFactCount,
    runtimeConfigHealth,
    status,
    totalFactCount,
  }
}

function runtimeBlockedReasonLabels(runtimeConfigHealth: WorkspaceConvexRuntimeConfigHealth): string[] {
  if (runtimeConfigHealth.status === "configured") {
    return []
  }

  if (runtimeConfigHealth.status === "invalid") {
    return runtimeConfigHealth.invalidLabels.map((label) => `${label} invalid`)
  }

  return runtimeConfigHealth.missingLabels.map((label) => `${label} missing`)
}

function bridgeInstallNextActions(
  status: WorkspaceConvexBrowserBridgeInstallPlanStatus,
  runtimeConfigHealth: WorkspaceConvexRuntimeConfigHealth,
  bridgeHealth: WorkspaceConvexBridgeHealth,
): string[] {
  if (status === "ready") {
    return ["Install the optional browser bridge with guarded Convex query and mutation runners."]
  }

  return [
    ...runtimeConfigHealth.nextActionLabels,
    ...bridgeMissingNextActions(bridgeHealth),
    "Keep local fallback active until runtime config, generated refs, runners, and identity maps are ready together.",
  ]
}

function bridgeMissingNextActions(bridgeHealth: WorkspaceConvexBridgeHealth): string[] {
  const missingCapabilities = bridgeHealth.missingCapabilityLabels
  const missingIdentityMaps = bridgeHealth.missingIdentityMapLabels ?? []
  const actions: string[] = []

  if (missingCapabilities.length > 0) {
    actions.push(`Wire missing browser bridge refs: ${summarizeLabels(missingCapabilities)}.`)
  }
  if (missingIdentityMaps.length > 0) {
    actions.push(`Seed browser bridge identity maps: ${summarizeLabels(missingIdentityMaps)}.`)
  }

  return actions
}

function bridgeInstallOperatorSummary(
  status: WorkspaceConvexBrowserBridgeInstallPlanStatus,
  readyFactCount: number,
  totalFactCount: number,
  blockedReasonLabels: string[],
): string {
  if (status === "ready") {
    return `${readyFactCount}/${totalFactCount} Convex browser bridge install facts are ready; guarded runtime installation can proceed.`
  }

  return `${readyFactCount}/${totalFactCount} Convex browser bridge install facts are ready; blocked by ${summarizeLabels(blockedReasonLabels)}.`
}

function summarizeLabels(labels: string[]): string {
  const visibleLabels = labels.slice(0, 3)
  const hiddenCount = Math.max(0, labels.length - visibleLabels.length)
  const visibleText = visibleLabels.join(", ")
  return hiddenCount > 0 ? `${visibleText}, and ${hiddenCount} more` : visibleText
}
