import { describe, expect, it } from "vitest"

import { summarizeWorkspaceConvexBridgeHealth, summarizeWorkspaceConvexBridgeProbe } from "./convexBridgeHealth"

describe("workspace Convex bridge health", () => {
  it("classifies a fully configured bridge and preserves capability order", () => {
    const health = summarizeWorkspaceConvexBridgeHealth({
      follow_up_activity_reads: true,
      follow_up_readiness_writes: true,
      offer_release_reads: true,
      offer_reply_writes: true,
      provider_outcome_readiness_writes: true,
      provider_run_reads: true,
      workspace_writes: true,
    })

    expect(health.status).toBe("configured")
    expect(health.availableCapabilityCount).toBe(7)
    expect(health.availableIdentityMapCount).toBe(0)
    expect(health.totalCapabilityCount).toBe(7)
    expect(health.totalIdentityMapCount).toBe(0)
    expect(health.missingCapabilityLabels).toEqual([])
    expect(health.missingIdentityMapLabels).toEqual([])
    expect(health.identityMaps).toEqual([])
    expect(health.capabilities.map((capability) => [capability.key, capability.label, capability.configured])).toEqual([
      ["workspace_writes", "workspace writes", true],
      ["provider_run_reads", "provider run reads", true],
      ["offer_release_reads", "offer release reads", true],
      ["follow_up_activity_reads", "follow-up activity reads", true],
      ["follow_up_readiness_writes", "follow-up readiness writes", true],
      ["provider_outcome_readiness_writes", "provider outcome readiness writes", true],
      ["offer_reply_writes", "offer reply writes", true],
    ])
  })

  it("classifies missing and partial bridge capability states", () => {
    const missing = summarizeWorkspaceConvexBridgeHealth({
      follow_up_activity_reads: false,
      follow_up_readiness_writes: false,
      offer_release_reads: false,
      offer_reply_writes: false,
      provider_outcome_readiness_writes: false,
      provider_run_reads: false,
      workspace_writes: false,
    })
    const partial = summarizeWorkspaceConvexBridgeHealth({
      follow_up_activity_reads: false,
      follow_up_readiness_writes: false,
      offer_release_reads: false,
      offer_reply_writes: false,
      provider_outcome_readiness_writes: false,
      provider_run_reads: true,
      workspace_writes: true,
    })

    expect(missing.status).toBe("missing")
    expect(missing.availableCapabilityCount).toBe(0)
    expect(missing.missingCapabilityLabels).toHaveLength(7)
    expect(partial.status).toBe("partial")
    expect(partial.availableCapabilityCount).toBe(2)
    expect(partial.missingCapabilityLabels).toEqual([
      "offer release reads",
      "follow-up activity reads",
      "follow-up readiness writes",
      "provider outcome readiness writes",
      "offer reply writes",
    ])
  })

  it("derives capability health from browser bridge probe facts", () => {
    const missing = summarizeWorkspaceConvexBridgeProbe(undefined)
    const partial = summarizeWorkspaceConvexBridgeProbe({
      hasFollowUpActivityReadQueryRef: true,
      hasFollowUpReadinessMutationRef: true,
      hasOfferReleaseExecutionsQueryRef: true,
      hasProviderRunsByRfqQueryRef: true,
      hasRunMutation: true,
      hasRunQuery: true,
      hasWorkspaceMutationRefs: true,
      rfqIdMapLocalIdCount: 2,
    })
    const missingRunner = summarizeWorkspaceConvexBridgeProbe({
      hasOfferReplyMutationRef: true,
      hasProviderRunsByRfqQueryRef: true,
      hasRunMutation: false,
      hasRunQuery: false,
    })

    expect(missing.status).toBe("missing")
    expect(partial.status).toBe("partial")
    expect(partial.availableCapabilityCount).toBe(5)
    expect(partial.availableIdentityMapCount).toBe(1)
    expect(partial.missingIdentityMapLabels).toEqual(["offer ID map", "quote ID map"])
    expect(partial.identityMaps).toEqual([
      { configured: true, key: "rfq_id_map", label: "RFQ ID map", localIdCount: 2 },
      { configured: false, key: "offer_id_map", label: "offer ID map", localIdCount: 0 },
      { configured: false, key: "quote_id_map", label: "quote ID map", localIdCount: 0 },
    ])
    expect(partial.missingCapabilityLabels).toEqual([
      "provider outcome readiness writes",
      "offer reply writes",
    ])
    expect(missingRunner.status).toBe("missing")
    expect(missingRunner.availableCapabilityCount).toBe(0)
  })

  it("requires identity maps before a probed bridge is fully configured", () => {
    const missingMaps = summarizeWorkspaceConvexBridgeProbe({
      hasFollowUpActivityReadQueryRef: true,
      hasFollowUpReadinessMutationRef: true,
      hasOfferProviderOutcomeReadinessMutationRef: true,
      hasOfferReleaseExecutionsQueryRef: true,
      hasOfferReplyMutationRef: true,
      hasProviderRunsByRfqQueryRef: true,
      hasRunMutation: true,
      hasRunQuery: true,
      hasWorkspaceMutationRefs: true,
    })
    const configured = summarizeWorkspaceConvexBridgeProbe({
      hasFollowUpActivityReadQueryRef: true,
      hasFollowUpReadinessMutationRef: true,
      hasOfferProviderOutcomeReadinessMutationRef: true,
      hasOfferReleaseExecutionsQueryRef: true,
      hasOfferReplyMutationRef: true,
      hasProviderRunsByRfqQueryRef: true,
      hasRunMutation: true,
      hasRunQuery: true,
      hasWorkspaceMutationRefs: true,
      offerIdMapLocalIdCount: 1,
      quoteIdMapLocalIdCount: 1,
      rfqIdMapLocalIdCount: 1,
    })

    expect(missingMaps.status).toBe("partial")
    expect(missingMaps.availableCapabilityCount).toBe(7)
    expect(missingMaps.availableIdentityMapCount).toBe(0)
    expect(missingMaps.missingIdentityMapLabels).toEqual(["RFQ ID map", "offer ID map", "quote ID map"])
    expect(configured.status).toBe("configured")
    expect(configured.availableIdentityMapCount).toBe(3)
  })
})
