import { nonNegativeInteger } from "../shared/numberValidation"

export type OfferReleaseProviderOutcomeReadinessReadSyncStatus = "convex" | "fallback" | "local" | "pending"

export interface OfferReleaseProviderOutcomeReadinessReadSyncState {
  fallbackCount: number
  localRecordCount: number
  persistedRecordCount: number
  status: OfferReleaseProviderOutcomeReadinessReadSyncStatus
}

export interface OfferReleaseProviderOutcomeReadinessReadSyncStateInput {
  localRecordCount: number
  persistedRecordCount?: number
  status: OfferReleaseProviderOutcomeReadinessReadSyncStatus
}

export function buildOfferReleaseProviderOutcomeReadinessReadSyncState({
  localRecordCount,
  persistedRecordCount = 0,
  status,
}: OfferReleaseProviderOutcomeReadinessReadSyncStateInput): OfferReleaseProviderOutcomeReadinessReadSyncState {
  return {
    fallbackCount: status === "fallback" ? 1 : 0,
    localRecordCount: nonNegativeInteger(localRecordCount, "localRecordCount"),
    persistedRecordCount: status === "convex" ? nonNegativeInteger(persistedRecordCount, "persistedRecordCount") : 0,
    status,
  }
}

export function offerReleaseProviderOutcomeReadinessReadSyncIntegrationDetail(
  sync: OfferReleaseProviderOutcomeReadinessReadSyncState,
): string {
  const localReadinessText = `${sync.localRecordCount} local readiness ${recordNoun(sync.localRecordCount)}`
  const persistedReadinessText = `${sync.persistedRecordCount} persisted provider readiness ${recordNoun(sync.persistedRecordCount)}`
  switch (sync.status) {
    case "convex":
      return sync.persistedRecordCount > 0
        ? `${persistedReadinessText} read from Convex and merged with ${sync.localRecordCount} local fallback ${recordNoun(sync.localRecordCount)}.`
        : `Convex returned no persisted provider readiness records; ${localReadinessText} ${visibleVerb(sync.localRecordCount)} visible.`
    case "fallback":
      return `Provider readiness history fell back to ${localReadinessText} after a Convex read failure.`
    case "local":
      return `${localReadinessText} available; Convex provider readiness reads are not configured.`
    case "pending":
      return `Checking Convex provider readiness history; ${sync.localRecordCount} local fallback ${recordNoun(sync.localRecordCount)} ${visibleVerb(sync.localRecordCount)} visible.`
  }
}

function recordNoun(count: number): string {
  return count === 1 ? "record" : "records"
}

function visibleVerb(count: number): string {
  return count === 1 ? "remains" : "remain"
}
