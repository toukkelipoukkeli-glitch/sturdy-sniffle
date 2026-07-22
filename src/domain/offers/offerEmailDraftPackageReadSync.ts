import { nonNegativeInteger } from "../shared/numberValidation"

export type OfferEmailDraftPackageReadSyncStatus = "convex" | "fallback" | "local" | "pending"

export interface OfferEmailDraftPackageReadSyncState {
  fallbackCount: number
  localPackageCount: number
  persistedPackageCount: number
  status: OfferEmailDraftPackageReadSyncStatus
}

export interface OfferEmailDraftPackageReadSyncStateInput {
  localPackageCount: number
  persistedPackageCount?: number
  status: OfferEmailDraftPackageReadSyncStatus
}

export function buildOfferEmailDraftPackageReadSyncState({
  localPackageCount,
  persistedPackageCount = 0,
  status,
}: OfferEmailDraftPackageReadSyncStateInput): OfferEmailDraftPackageReadSyncState {
  return {
    fallbackCount: status === "fallback" ? 1 : 0,
    localPackageCount: nonNegativeInteger(localPackageCount, "localPackageCount"),
    persistedPackageCount: status === "convex" ? nonNegativeInteger(persistedPackageCount, "persistedPackageCount") : 0,
    status,
  }
}

export function offerEmailDraftPackageReadSyncIntegrationDetail(sync: OfferEmailDraftPackageReadSyncState): string {
  const localPackageText = `${sync.localPackageCount} local email draft ${packageNoun(sync.localPackageCount)}`
  const persistedPackageText = `${sync.persistedPackageCount} persisted email draft ${packageNoun(sync.persistedPackageCount)}`
  switch (sync.status) {
    case "convex":
      return sync.persistedPackageCount > 0
        ? `${persistedPackageText} read from Convex and merged with ${sync.localPackageCount} local fallback ${packageNoun(sync.localPackageCount)}.`
        : `Convex returned no persisted email draft packages; ${localPackageText} ${visibleVerb(sync.localPackageCount)} visible.`
    case "fallback":
      return `Email draft package history fell back to ${localPackageText} after a Convex read failure.`
    case "local":
      return `${localPackageText} available; Convex email draft package reads are not configured.`
    case "pending":
      return `Checking Convex email draft package history; ${sync.localPackageCount} local fallback ${packageNoun(sync.localPackageCount)} ${visibleVerb(sync.localPackageCount)} visible.`
  }
}

function packageNoun(count: number): string {
  return count === 1 ? "package" : "packages"
}

function visibleVerb(count: number): string {
  return count === 1 ? "remains" : "remain"
}
