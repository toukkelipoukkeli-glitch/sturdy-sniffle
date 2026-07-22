import { nonNegativeInteger } from "../shared/numberValidation"

export type OfferReleaseProviderOutcomeReadSyncStatus = "convex" | "fallback" | "local" | "pending"

export interface OfferReleaseProviderOutcomeReadSyncState {
  fallbackCount: number
  localBatchCount: number
  persistedBatchCount: number
  status: OfferReleaseProviderOutcomeReadSyncStatus
}

export interface OfferReleaseProviderOutcomeReadSyncStateInput {
  localBatchCount: number
  persistedBatchCount?: number
  status: OfferReleaseProviderOutcomeReadSyncStatus
}

export function buildOfferReleaseProviderOutcomeReadSyncState({
  localBatchCount,
  persistedBatchCount = 0,
  status,
}: OfferReleaseProviderOutcomeReadSyncStateInput): OfferReleaseProviderOutcomeReadSyncState {
  return {
    fallbackCount: status === "fallback" ? 1 : 0,
    localBatchCount: nonNegativeInteger(localBatchCount, "localBatchCount"),
    persistedBatchCount: status === "convex" ? nonNegativeInteger(persistedBatchCount, "persistedBatchCount") : 0,
    status,
  }
}

export function offerReleaseProviderOutcomeReadSyncIntegrationDetail(
  sync: OfferReleaseProviderOutcomeReadSyncState,
): string {
  const localBatchText = `${sync.localBatchCount} local provider outcome ${batchNoun(sync.localBatchCount)}`
  const persistedBatchText = `${sync.persistedBatchCount} persisted provider outcome ${batchNoun(sync.persistedBatchCount)}`
  switch (sync.status) {
    case "convex":
      return sync.persistedBatchCount > 0
        ? `${persistedBatchText} read from Convex and merged with ${sync.localBatchCount} local fallback ${batchNoun(sync.localBatchCount)}.`
        : `Convex returned no persisted provider outcome batches; ${localBatchText} ${visibleVerb(sync.localBatchCount)} visible.`
    case "fallback":
      return `Provider outcome history fell back to ${localBatchText} after a Convex read failure.`
    case "local":
      return `${localBatchText} available; Convex provider outcome reads are not configured.`
    case "pending":
      return `Checking Convex provider outcome history; ${sync.localBatchCount} local fallback ${batchNoun(sync.localBatchCount)} ${visibleVerb(sync.localBatchCount)} visible.`
  }
}

function batchNoun(count: number): string {
  return count === 1 ? "batch" : "batches"
}

function visibleVerb(count: number): string {
  return count === 1 ? "remains" : "remain"
}
