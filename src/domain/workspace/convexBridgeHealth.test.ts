import { describe, expect, it } from "vitest"

import {
  countWorkspaceConvexBridgeIdMapEntries,
  resolveWorkspaceConvexBridgeMappedId,
  summarizeWorkspaceConvexBridgeHealth,
  summarizeWorkspaceConvexBridgeProbe,
  summarizeWorkspaceConvexRuntimeConfig,
} from "./convexBridgeHealth"

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

  it("normalizes browser bridge ID map values for counts and lookups", () => {
    const idMap = {
      blank: "   ",
      nonString: 42,
      offer: " convex-offer-204 ",
      rfq: "convex-rfq-204",
    }

    expect(countWorkspaceConvexBridgeIdMapEntries(undefined)).toBe(0)
    expect(countWorkspaceConvexBridgeIdMapEntries(idMap)).toBe(2)
    expect(resolveWorkspaceConvexBridgeMappedId(idMap, "offer")).toBe("convex-offer-204")
    expect(resolveWorkspaceConvexBridgeMappedId(idMap, "rfq")).toBe("convex-rfq-204")
    expect(resolveWorkspaceConvexBridgeMappedId(idMap, "blank")).toBeUndefined()
    expect(resolveWorkspaceConvexBridgeMappedId(idMap, "missing")).toBeUndefined()
    expect(resolveWorkspaceConvexBridgeMappedId(idMap, "nonString")).toBeUndefined()
  })

  it("classifies configured public Convex runtime URLs without requiring the optional site URL", () => {
    const health = summarizeWorkspaceConvexRuntimeConfig({
      convexSiteUrl: " https://factorybid-os.convex.site ",
      convexUrl: " https://necessary-fly-178.convex.cloud ",
    })
    const clientOnly = summarizeWorkspaceConvexRuntimeConfig({
      convexUrl: "http://127.0.0.1:3210",
    })

    expect(health).toMatchObject({
      configuredCount: 2,
      invalidLabels: [],
      missingLabels: [],
      status: "configured",
      totalCount: 2,
    })
    expect(health.entries).toEqual([
      {
        configured: true,
        key: "convex_url",
        label: "VITE_CONVEX_URL",
        value: "https://necessary-fly-178.convex.cloud/",
      },
      {
        configured: true,
        key: "convex_site_url",
        label: "VITE_CONVEX_SITE_URL",
        value: "https://factorybid-os.convex.site/",
      },
    ])
    expect(health.operatorSummary).toBe(
      "2/2 public Convex runtime URLs configured; browser bridge can be installed behind the existing fallback boundary.",
    )
    expect(health.nextActionLabels).toEqual([
      "Install the optional browser bridge with generated Convex refs before enabling persisted reads or writes.",
    ])
    expect(clientOnly.status).toBe("configured")
    expect(clientOnly.configuredCount).toBe(1)
    expect(clientOnly.missingLabels).toEqual([])
  })

  it("keeps the runtime probe missing when the required public Convex client URL is absent", () => {
    const health = summarizeWorkspaceConvexRuntimeConfig({
      convexSiteUrl: "https://factorybid-os.convex.site",
      convexUrl: "   ",
    })

    expect(health.status).toBe("missing")
    expect(health.configuredCount).toBe(1)
    expect(health.missingLabels).toEqual(["VITE_CONVEX_URL"])
    expect(health.operatorSummary).toBe(
      "Public Convex runtime config is missing: VITE_CONVEX_URL. Local fallback remains active.",
    )
    expect(health.nextActionLabels).toEqual([
      "Set VITE_CONVEX_URL in ignored local env before creating a Convex browser client.",
    ])
  })

  it("rejects malformed public Convex runtime URL values before browser client wiring", () => {
    const health = summarizeWorkspaceConvexRuntimeConfig({
      convexSiteUrl: "convex.site/path",
      convexUrl: "javascript:alert(1)",
    })

    expect(health.status).toBe("invalid")
    expect(health.configuredCount).toBe(0)
    expect(health.invalidLabels).toEqual(["VITE_CONVEX_URL", "VITE_CONVEX_SITE_URL"])
    expect(health.entries.map((entry) => [entry.key, entry.configured, entry.issue])).toEqual([
      ["convex_url", false, "invalid URL"],
      ["convex_site_url", false, "invalid URL"],
    ])
    expect(health.operatorSummary).toBe(
      "Public Convex runtime config is invalid: VITE_CONVEX_URL, VITE_CONVEX_SITE_URL.",
    )
    expect(health.nextActionLabels).toEqual([
      "Fix malformed public Convex runtime settings: VITE_CONVEX_URL, VITE_CONVEX_SITE_URL.",
    ])
  })
})
