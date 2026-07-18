import { nonNegativeInteger } from "../shared/numberValidation"

export type CalendarFollowUpRescheduleProviderOutcomeReadSyncStatus =
  | "convex"
  | "fallback"
  | "local"
  | "pending"

export interface CalendarFollowUpRescheduleProviderOutcomeReadSyncState {
  fallbackCount: number
  localBatchCount: number
  persistedBatchCount: number
  status: CalendarFollowUpRescheduleProviderOutcomeReadSyncStatus
}

export interface CalendarFollowUpRescheduleProviderOutcomeReadSyncStateInput {
  localBatchCount: number
  persistedBatchCount?: number
  status: CalendarFollowUpRescheduleProviderOutcomeReadSyncStatus
}

export function buildCalendarFollowUpRescheduleProviderOutcomeReadSyncState({
  localBatchCount,
  persistedBatchCount = 0,
  status,
}: CalendarFollowUpRescheduleProviderOutcomeReadSyncStateInput): CalendarFollowUpRescheduleProviderOutcomeReadSyncState {
  return {
    fallbackCount: status === "fallback" ? 1 : 0,
    localBatchCount: nonNegativeInteger(localBatchCount, "localBatchCount"),
    persistedBatchCount: status === "convex" ? nonNegativeInteger(persistedBatchCount, "persistedBatchCount") : 0,
    status,
  }
}

export function calendarFollowUpRescheduleProviderOutcomeReadSyncLabel(
  status: CalendarFollowUpRescheduleProviderOutcomeReadSyncStatus,
): string {
  switch (status) {
    case "convex":
      return "Convex"
    case "fallback":
      return "Local fallback"
    case "local":
      return "Local"
    case "pending":
      return "Checking Convex"
  }
}

export function calendarFollowUpRescheduleProviderOutcomeReadSyncPanelSummary(
  sync: CalendarFollowUpRescheduleProviderOutcomeReadSyncState,
): string {
  const localFallbackBatchText = `${sync.localBatchCount} local fallback ${batchNoun(sync.localBatchCount)}`
  const localProviderOutcomeBatchText = `${sync.localBatchCount} local provider outcome ${batchNoun(sync.localBatchCount)}`
  const localCalendarProviderOutcomeBatchText = `${sync.localBatchCount} local calendar provider outcome ${batchNoun(sync.localBatchCount)}`
  const persistedBatchText = `${sync.persistedBatchCount} persisted calendar provider outcome ${batchNoun(sync.persistedBatchCount)}`
  switch (sync.status) {
    case "convex":
      return sync.persistedBatchCount > 0
        ? `${persistedBatchText} merged with ${localFallbackBatchText}.`
        : `Convex returned no persisted calendar provider outcome batches; ${localFallbackBatchText} ${visibleVerb(sync.localBatchCount)} visible.`
    case "fallback":
      return `Convex calendar provider outcome read failed; showing ${localProviderOutcomeBatchText}.`
    case "local":
      return `${localCalendarProviderOutcomeBatchText} available; Convex outcome reads are not configured.`
    case "pending":
      return `Checking Convex for calendar provider outcome batches; ${localFallbackBatchText} ${visibleVerb(sync.localBatchCount)} visible.`
  }
}

function batchNoun(count: number): string {
  return count === 1 ? "batch" : "batches"
}

function visibleVerb(count: number): string {
  return count === 1 ? "remains" : "remain"
}
