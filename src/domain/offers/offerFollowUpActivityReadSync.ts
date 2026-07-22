import { nonNegativeInteger } from "../shared/numberValidation"

export type OfferFollowUpActivityReadSyncStatus = "convex" | "fallback" | "local" | "pending"

export interface OfferFollowUpActivityReadSyncState {
  fallbackCount: number
  localActivityCount: number
  persistedActivityCount: number
  status: OfferFollowUpActivityReadSyncStatus
}

export interface OfferFollowUpActivityReadSyncStateInput {
  localActivityCount: number
  persistedActivityCount?: number
  status: OfferFollowUpActivityReadSyncStatus
}

export function buildOfferFollowUpActivityReadSyncState({
  localActivityCount,
  persistedActivityCount = 0,
  status,
}: OfferFollowUpActivityReadSyncStateInput): OfferFollowUpActivityReadSyncState {
  return {
    fallbackCount: status === "fallback" ? 1 : 0,
    localActivityCount: nonNegativeInteger(localActivityCount, "localActivityCount"),
    persistedActivityCount: status === "convex" ? nonNegativeInteger(persistedActivityCount, "persistedActivityCount") : 0,
    status,
  }
}

export function offerFollowUpActivityReadSyncIntegrationDetail(sync: OfferFollowUpActivityReadSyncState): string {
  const localActivityText = `${sync.localActivityCount} local follow-up ${activityNoun(sync.localActivityCount)}`
  const persistedActivityText = `${sync.persistedActivityCount} persisted follow-up ${activityNoun(sync.persistedActivityCount)}`
  switch (sync.status) {
    case "convex":
      return sync.persistedActivityCount > 0
        ? `${persistedActivityText} read from Convex and merged with ${sync.localActivityCount} local fallback ${activityNoun(sync.localActivityCount)}.`
        : `Convex returned no persisted follow-up activity records; ${localActivityText} ${visibleVerb(sync.localActivityCount)} visible.`
    case "fallback":
      return `Follow-up activity history fell back to ${localActivityText} after a Convex read failure.`
    case "local":
      return `${localActivityText} available; Convex follow-up activity reads are not configured.`
    case "pending":
      return `Checking Convex follow-up activity history; ${sync.localActivityCount} local fallback ${activityNoun(sync.localActivityCount)} ${visibleVerb(sync.localActivityCount)} visible.`
  }
}

function activityNoun(count: number): string {
  return count === 1 ? "activity" : "activities"
}

function visibleVerb(count: number): string {
  return count === 1 ? "remains" : "remain"
}
