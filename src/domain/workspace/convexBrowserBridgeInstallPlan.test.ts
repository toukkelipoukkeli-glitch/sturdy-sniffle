import { describe, expect, it } from "vitest"

import { summarizeWorkspaceConvexRuntimeConfig } from "./convexBridgeHealth"
import { buildWorkspaceConvexBrowserBridgeInstallPlan } from "./convexBrowserBridgeInstallPlan"

describe("workspace Convex browser bridge install plan", () => {
  it("marks the guarded install plan ready when runtime config, refs, runners, and identity maps are complete", () => {
    const plan = buildWorkspaceConvexBrowserBridgeInstallPlan({
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

    expect(plan.status).toBe("ready")
    expect(plan.readyFactCount).toBe(12)
    expect(plan.totalFactCount).toBe(12)
    expect(plan.blockedReasonLabels).toEqual([])
    expect(plan.operatorSummary).toBe(
      "12/12 Convex browser bridge install facts are ready; guarded runtime installation can proceed.",
    )
    expect(plan.nextActionLabels).toEqual([
      "Install the optional browser bridge with guarded Convex query and mutation runners.",
    ])
  })

  it("blocks installation while the required public Convex client URL is missing", () => {
    const plan = buildWorkspaceConvexBrowserBridgeInstallPlan({
      bridgeProbe: {
        hasRunMutation: true,
        hasRunQuery: true,
        hasWorkspaceMutationRefs: true,
        offerIdMapLocalIdCount: 1,
        quoteIdMapLocalIdCount: 1,
        rfqIdMapLocalIdCount: 1,
      },
      runtimeConfigHealth: summarizeWorkspaceConvexRuntimeConfig({
        convexUrl: "",
      }),
    })

    expect(plan.status).toBe("blocked")
    expect(plan.blockedReasonLabels).toEqual([
      "VITE_CONVEX_URL missing",
      "provider run reads",
      "offer release reads",
      "follow-up activity reads",
      "follow-up readiness writes",
      "provider outcome readiness writes",
      "offer reply writes",
    ])
    expect(plan.operatorSummary).toBe(
      "4/12 Convex browser bridge install facts are ready; blocked by VITE_CONVEX_URL missing, provider run reads, offer release reads, and 4 more.",
    )
    expect(plan.nextActionLabels).toEqual([
      "Set VITE_CONVEX_URL in ignored local env before creating a Convex browser client.",
      "Wire missing browser bridge refs: provider run reads, offer release reads, follow-up activity reads, and 3 more.",
      "Keep local fallback active until runtime config, generated refs, runners, and identity maps are ready together.",
    ])
  })

  it("blocks installation on malformed runtime URLs and missing identity maps", () => {
    const plan = buildWorkspaceConvexBrowserBridgeInstallPlan({
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
        rfqIdMapLocalIdCount: 1,
      },
      runtimeConfigHealth: summarizeWorkspaceConvexRuntimeConfig({
        convexSiteUrl: "file:///tmp/convex-site",
        convexUrl: "javascript:alert(1)",
      }),
    })

    expect(plan.status).toBe("blocked")
    expect(plan.readyFactCount).toBe(8)
    expect(plan.totalFactCount).toBe(12)
    expect(plan.blockedReasonLabels).toEqual([
      "VITE_CONVEX_URL invalid",
      "VITE_CONVEX_SITE_URL invalid",
      "offer ID map",
      "quote ID map",
    ])
    expect(plan.nextActionLabels).toEqual([
      "Fix malformed public Convex runtime settings: VITE_CONVEX_URL, VITE_CONVEX_SITE_URL.",
      "Seed browser bridge identity maps: offer ID map, quote ID map.",
      "Keep local fallback active until runtime config, generated refs, runners, and identity maps are ready together.",
    ])
  })
})
