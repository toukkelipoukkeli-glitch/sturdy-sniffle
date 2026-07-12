import type { WorkspaceConvexBrowserBridgeInstallPlan } from "./convexBrowserBridgeInstallPlan"

export type WorkspaceConvexBrowserBridgeInstallerStatus = "blocked" | "fallback" | "ready"
export type WorkspaceConvexBrowserBridgeInstallerMode = "convex" | "local"

export interface WorkspaceConvexBrowserBridgeInstallerInput {
  enabled?: boolean
  installPlan: WorkspaceConvexBrowserBridgeInstallPlan
  optInLabel?: string
}

export interface WorkspaceConvexBrowserBridgeInstallerDecision {
  blockedReasonLabels: string[]
  canInstall: boolean
  enabled: boolean
  installAction: "keep_local_fallback" | "install_guarded_bridge"
  mode: WorkspaceConvexBrowserBridgeInstallerMode
  nextActionLabels: string[]
  operatorSummary: string
  status: WorkspaceConvexBrowserBridgeInstallerStatus
}

const DEFAULT_OPT_IN_LABEL = "VITE_FACTORYBID_ENABLE_CONVEX_BROWSER_BRIDGE"

export function decideWorkspaceConvexBrowserBridgeInstaller({
  enabled = false,
  installPlan,
  optInLabel = DEFAULT_OPT_IN_LABEL,
}: WorkspaceConvexBrowserBridgeInstallerInput): WorkspaceConvexBrowserBridgeInstallerDecision {
  if (installPlan.status !== "ready") {
    return {
      blockedReasonLabels: [...installPlan.blockedReasonLabels],
      canInstall: false,
      enabled,
      installAction: "keep_local_fallback",
      mode: "local",
      nextActionLabels: [...installPlan.nextActionLabels],
      operatorSummary: `Convex browser bridge installation is blocked by ${summarizeLabels(
        installPlan.blockedReasonLabels,
      )}; local fallback remains active.`,
      status: "blocked",
    }
  }

  if (!enabled) {
    return {
      blockedReasonLabels: [`${optInLabel} disabled`],
      canInstall: true,
      enabled: false,
      installAction: "keep_local_fallback",
      mode: "local",
      nextActionLabels: [
        `Set ${optInLabel}=true only after generated Convex refs, runners, and identity maps are deployed together.`,
        "Keep local fallback active while the optional browser bridge is disabled.",
      ],
      operatorSummary:
        "Convex browser bridge install facts are ready, but the guarded opt-in is disabled; local fallback remains active.",
      status: "fallback",
    }
  }

  return {
    blockedReasonLabels: [],
    canInstall: true,
    enabled: true,
    installAction: "install_guarded_bridge",
    mode: "convex",
    nextActionLabels: [
      "Install the optional browser bridge with guarded Convex query and mutation runners.",
      "Keep local fallback and sync-error telemetry attached after installation.",
    ],
    operatorSummary:
      "Convex browser bridge install facts are ready and explicitly enabled; guarded runtime installation can proceed.",
    status: "ready",
  }
}

function summarizeLabels(labels: string[]): string {
  if (labels.length === 0) {
    return "no remaining blockers"
  }

  const visibleLabels = labels.slice(0, 3)
  const hiddenCount = Math.max(0, labels.length - visibleLabels.length)
  const visibleText = visibleLabels.join(", ")
  return hiddenCount > 0 ? `${visibleText}, and ${hiddenCount} more` : visibleText
}
