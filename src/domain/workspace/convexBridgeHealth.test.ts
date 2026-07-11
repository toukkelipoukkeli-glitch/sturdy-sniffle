import { describe, expect, it } from "vitest"

import { summarizeWorkspaceConvexBridgeHealth } from "./convexBridgeHealth"

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
    expect(health.totalCapabilityCount).toBe(7)
    expect(health.missingCapabilityLabels).toEqual([])
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
})
