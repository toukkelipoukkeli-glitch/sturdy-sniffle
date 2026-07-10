export type ProviderRunReadSyncStatus = "convex" | "fallback" | "local" | "pending"

export interface ProviderRunReadSyncState {
  fallbackCount: number
  localRunCount: number
  persistedRunCount: number
  status: ProviderRunReadSyncStatus
}

export function buildProviderRunReadSyncState(
  status: ProviderRunReadSyncStatus,
  localRunCount: number,
  persistedRunCount: number,
): ProviderRunReadSyncState {
  return {
    fallbackCount: status === "fallback" ? 1 : 0,
    localRunCount,
    persistedRunCount: status === "convex" ? persistedRunCount : 0,
    status,
  }
}

export function providerRunReadSyncLabel(status: ProviderRunReadSyncStatus): string {
  switch (status) {
    case "convex":
      return "Convex"
    case "fallback":
      return "Local fallback"
    case "pending":
      return "Checking Convex"
    case "local":
      return "Local"
  }
}

export function providerRunReadSyncPanelSummary(sync: ProviderRunReadSyncState): string {
  switch (sync.status) {
    case "convex":
      return sync.persistedRunCount > 0
        ? `${sync.persistedRunCount} persisted provider audit${plural(sync.persistedRunCount)} merged with ${sync.localRunCount} local fallback audit${plural(sync.localRunCount)}.`
        : `Convex returned no persisted provider runs; ${sync.localRunCount} local provider audit${plural(sync.localRunCount)} remain visible.`
    case "fallback":
      return `Convex provider-run read failed; showing ${sync.localRunCount} local provider audit${plural(sync.localRunCount)}.`
    case "pending":
      return `Checking Convex for provider-run audits; ${sync.localRunCount} local audit${plural(sync.localRunCount)} remain visible.`
    case "local":
      return `${sync.localRunCount} local provider audit${plural(sync.localRunCount)} available; Convex provider-run read is not configured.`
  }
}

export function providerRunReadSyncIntegrationDetail(sync: ProviderRunReadSyncState): string {
  switch (sync.status) {
    case "convex":
      return sync.persistedRunCount > 0
        ? `${sync.persistedRunCount} persisted provider audit${plural(sync.persistedRunCount)} read from Convex and merged with ${sync.localRunCount} local audit${plural(sync.localRunCount)}.`
        : `Convex returned no persisted provider runs; ${sync.localRunCount} local provider audit${plural(sync.localRunCount)} remain visible.`
    case "fallback":
      return `Provider run history fell back to ${sync.localRunCount} local audit${plural(sync.localRunCount)} after a Convex read failure.`
    case "pending":
      return `Checking Convex provider-run history; ${sync.localRunCount} local audit${plural(sync.localRunCount)} remain visible.`
    case "local":
      return `${sync.localRunCount} local provider audit${plural(sync.localRunCount)} available; Convex provider-run reads are not configured.`
  }
}

export function providerRunReadSyncIntegrationReviewSuffix(sync: ProviderRunReadSyncState): string {
  return sync.status === "convex" && sync.persistedRunCount > 0
    ? ` ${sync.persistedRunCount} persisted provider audit${plural(sync.persistedRunCount)} read from Convex.`
    : ""
}

function plural(count: number): string {
  return count === 1 ? "" : "s"
}
