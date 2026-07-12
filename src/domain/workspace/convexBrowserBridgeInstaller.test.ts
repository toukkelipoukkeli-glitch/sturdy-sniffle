import { describe, expect, it } from "vitest"

import { summarizeWorkspaceConvexRuntimeConfig } from "./convexBridgeHealth"
import { buildWorkspaceConvexBrowserBridgeInstallPlan } from "./convexBrowserBridgeInstallPlan"
import { decideWorkspaceConvexBrowserBridgeInstaller } from "./convexBrowserBridgeInstaller"

const readyInstallPlan = buildWorkspaceConvexBrowserBridgeInstallPlan({
  bridgeProbe: {
    hasFollowUpActivityReadQueryRef: true,
    hasFollowUpReadinessMutationRef: true,
    hasOfferProviderOutcomeReadinessMutationRef: true,
    hasOfferReleaseExecutionsQueryRef: true,
    hasOfferReplyMutationRef: true,
    hasProviderRunsByRfqQueryRef: true,
    hasRunMutation: true,
    hasRunQuery: true,
    hasWorkspaceMutationRefs: true,
    offerIdMapLocalIdCount: 2,
    quoteIdMapLocalIdCount: 2,
    rfqIdMapLocalIdCount: 2,
  },
  runtimeConfigHealth: summarizeWorkspaceConvexRuntimeConfig({
    convexSiteUrl: "https://factorybid-os.convex.site",
    convexUrl: "https://necessary-fly-178.convex.cloud",
  }),
})

const blockedInstallPlan = buildWorkspaceConvexBrowserBridgeInstallPlan({
  bridgeProbe: {
    hasRunMutation: true,
    hasRunQuery: true,
    hasWorkspaceMutationRefs: true,
    rfqIdMapLocalIdCount: 1,
  },
  runtimeConfigHealth: summarizeWorkspaceConvexRuntimeConfig({
    convexUrl: "",
  }),
})

describe("workspace Convex browser bridge installer boundary", () => {
  it("keeps local fallback active while the install plan is blocked", () => {
    const decision = decideWorkspaceConvexBrowserBridgeInstaller({
      enabled: true,
      installPlan: blockedInstallPlan,
    })

    expect(decision).toMatchObject({
      canInstall: false,
      enabled: true,
      installAction: "keep_local_fallback",
      mode: "local",
      status: "blocked",
    })
    expect(decision.blockedReasonLabels).toEqual(blockedInstallPlan.blockedReasonLabels)
    expect(decision.nextActionLabels).toEqual(blockedInstallPlan.nextActionLabels)
    expect(decision.operatorSummary).toBe(
      "Convex browser bridge installation is blocked by VITE_CONVEX_URL missing, provider run reads, offer release reads, and 6 more; local fallback remains active.",
    )
  })

  it("does not enable Convex mode by default even when install facts are ready", () => {
    const decision = decideWorkspaceConvexBrowserBridgeInstaller({
      installPlan: readyInstallPlan,
    })

    expect(decision).toEqual({
      blockedReasonLabels: ["VITE_FACTORYBID_ENABLE_CONVEX_BROWSER_BRIDGE disabled"],
      canInstall: true,
      enabled: false,
      installAction: "keep_local_fallback",
      mode: "local",
      nextActionLabels: [
        "Set VITE_FACTORYBID_ENABLE_CONVEX_BROWSER_BRIDGE=true only after generated Convex refs, runners, and identity maps are deployed together.",
        "Keep local fallback active while the optional browser bridge is disabled.",
      ],
      operatorSummary:
        "Convex browser bridge install facts are ready, but the guarded opt-in is disabled; local fallback remains active.",
      status: "fallback",
    })
  })

  it("allows guarded Convex mode only when the ready plan is explicitly enabled", () => {
    const decision = decideWorkspaceConvexBrowserBridgeInstaller({
      enabled: true,
      installPlan: readyInstallPlan,
    })

    expect(decision).toEqual({
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
    })
  })

  it("uses the supplied opt-in label in fallback copy", () => {
    const decision = decideWorkspaceConvexBrowserBridgeInstaller({
      installPlan: readyInstallPlan,
      optInLabel: "VITE_ENABLE_TEST_BRIDGE",
    })

    expect(decision.blockedReasonLabels).toEqual(["VITE_ENABLE_TEST_BRIDGE disabled"])
    expect(decision.nextActionLabels[0]).toBe(
      "Set VITE_ENABLE_TEST_BRIDGE=true only after generated Convex refs, runners, and identity maps are deployed together.",
    )
  })

  it("clones plan arrays before returning blocked fallback decisions", () => {
    const decision = decideWorkspaceConvexBrowserBridgeInstaller({
      enabled: true,
      installPlan: blockedInstallPlan,
    })

    decision.blockedReasonLabels.push("mutated")
    decision.nextActionLabels.push("mutated action")

    expect(blockedInstallPlan.blockedReasonLabels).not.toContain("mutated")
    expect(blockedInstallPlan.nextActionLabels).not.toContain("mutated action")
  })
})
