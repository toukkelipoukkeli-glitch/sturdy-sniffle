import { nonNegativeInteger } from "../shared/numberValidation"

export type OfferReleaseExecutionReadSyncStatus = "convex" | "fallback" | "local" | "pending"

export interface OfferReleaseExecutionReadSyncState {
  fallbackCount: number
  localRunCount: number
  persistedRunCount: number
  status: OfferReleaseExecutionReadSyncStatus
}

export interface OfferReleaseExecutionReadSyncStateInput {
  localRunCount: number
  persistedRunCount?: number
  status: OfferReleaseExecutionReadSyncStatus
}

export function buildOfferReleaseExecutionReadSyncState({
  localRunCount,
  persistedRunCount = 0,
  status,
}: OfferReleaseExecutionReadSyncStateInput): OfferReleaseExecutionReadSyncState {
  return {
    fallbackCount: status === "fallback" ? 1 : 0,
    localRunCount: nonNegativeInteger(localRunCount, "localRunCount"),
    persistedRunCount: status === "convex" ? nonNegativeInteger(persistedRunCount, "persistedRunCount") : 0,
    status,
  }
}

export function offerReleaseExecutionReadSyncIntegrationDetail(sync: OfferReleaseExecutionReadSyncState): string {
  const localRunText = `${sync.localRunCount} local release ${runNoun(sync.localRunCount)}`
  const persistedRunText = `${sync.persistedRunCount} persisted release execution ${runNoun(sync.persistedRunCount)}`
  switch (sync.status) {
    case "convex":
      return sync.persistedRunCount > 0
        ? `${persistedRunText} read from Convex and merged with ${sync.localRunCount} local fallback ${runNoun(sync.localRunCount)}.`
        : `Convex returned no persisted release execution runs; ${localRunText} ${visibleVerb(sync.localRunCount)} visible.`
    case "fallback":
      return `Release execution history fell back to ${localRunText} after a Convex read failure.`
    case "local":
      return `${localRunText} available; Convex release execution reads are not configured.`
    case "pending":
      return `Checking Convex release execution history; ${sync.localRunCount} local fallback ${runNoun(sync.localRunCount)} ${visibleVerb(sync.localRunCount)} visible.`
  }
}

function runNoun(count: number): string {
  return count === 1 ? "run" : "runs"
}

function visibleVerb(count: number): string {
  return count === 1 ? "remains" : "remain"
}
