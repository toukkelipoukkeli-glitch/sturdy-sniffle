import { describe, expect, it } from "vitest"

import {
  buildProviderRunReadSyncState,
  providerRunReadSyncIntegrationDetail,
  providerRunReadSyncIntegrationReviewSuffix,
  providerRunReadSyncLabel,
  providerRunReadSyncPanelSummary,
} from "./providerRunReadSync"

describe("provider run read sync", () => {
  it("normalizes read sync counts", () => {
    expect(buildProviderRunReadSyncState("convex", 2, 3)).toEqual({
      fallbackCount: 0,
      localRunCount: 2,
      persistedRunCount: 3,
      status: "convex",
    })
    expect(buildProviderRunReadSyncState("fallback", 2, 3)).toEqual({
      fallbackCount: 1,
      localRunCount: 2,
      persistedRunCount: 0,
      status: "fallback",
    })
    expect(buildProviderRunReadSyncState("pending", 2, 3)).toEqual({
      fallbackCount: 0,
      localRunCount: 2,
      persistedRunCount: 0,
      status: "pending",
    })
    expect(buildProviderRunReadSyncState("local", 2, 3)).toEqual({
      fallbackCount: 0,
      localRunCount: 2,
      persistedRunCount: 0,
      status: "local",
    })
  })

  it("builds panel labels and summaries for each read state", () => {
    expect(providerRunReadSyncLabel("convex")).toBe("Convex")
    expect(providerRunReadSyncLabel("fallback")).toBe("Local fallback")
    expect(providerRunReadSyncLabel("pending")).toBe("Checking Convex")
    expect(providerRunReadSyncLabel("local")).toBe("Local")

    expect(providerRunReadSyncPanelSummary(buildProviderRunReadSyncState("convex", 2, 1))).toBe(
      "1 persisted provider audit merged with 2 local fallback audits.",
    )
    expect(providerRunReadSyncPanelSummary(buildProviderRunReadSyncState("fallback", 2, 0))).toBe(
      "Convex provider-run read failed; showing 2 local provider audits.",
    )
    expect(providerRunReadSyncPanelSummary(buildProviderRunReadSyncState("pending", 2, 0))).toBe(
      "Checking Convex for provider-run audits; 2 local audits remain visible.",
    )
    expect(providerRunReadSyncPanelSummary(buildProviderRunReadSyncState("local", 2, 0))).toBe(
      "2 local provider audits available; Convex provider-run read is not configured.",
    )
    expect(providerRunReadSyncPanelSummary(buildProviderRunReadSyncState("convex", 2, 0))).toBe(
      "Convex returned no persisted provider runs; 2 local provider audits remain visible.",
    )
  })

  it("builds integration health copy and review suffixes", () => {
    expect(providerRunReadSyncIntegrationDetail(buildProviderRunReadSyncState("convex", 2, 1))).toBe(
      "1 persisted provider audit read from Convex and merged with 2 local audits.",
    )
    expect(providerRunReadSyncIntegrationDetail(buildProviderRunReadSyncState("fallback", 2, 0))).toBe(
      "Provider run history fell back to 2 local audits after a Convex read failure.",
    )
    expect(providerRunReadSyncIntegrationDetail(buildProviderRunReadSyncState("pending", 2, 0))).toBe(
      "Checking Convex provider-run history; 2 local audits remain visible.",
    )
    expect(providerRunReadSyncIntegrationDetail(buildProviderRunReadSyncState("local", 2, 0))).toBe(
      "2 local provider audits available; Convex provider-run reads are not configured.",
    )
    expect(providerRunReadSyncIntegrationDetail(buildProviderRunReadSyncState("convex", 2, 0))).toBe(
      "Convex returned no persisted provider runs; 2 local provider audits remain visible.",
    )
    expect(providerRunReadSyncIntegrationReviewSuffix(buildProviderRunReadSyncState("convex", 2, 1))).toBe(
      " 1 persisted provider audit read from Convex.",
    )
    expect(providerRunReadSyncIntegrationReviewSuffix(buildProviderRunReadSyncState("fallback", 2, 0))).toBe("")
    expect(providerRunReadSyncIntegrationReviewSuffix(buildProviderRunReadSyncState("pending", 2, 0))).toBe("")
    expect(providerRunReadSyncIntegrationReviewSuffix(buildProviderRunReadSyncState("local", 2, 0))).toBe("")
    expect(providerRunReadSyncIntegrationReviewSuffix(buildProviderRunReadSyncState("convex", 2, 0))).toBe("")
  })
})
