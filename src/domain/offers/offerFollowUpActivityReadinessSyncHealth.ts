import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"

export const OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION = "offer-follow-up-activity-readiness-sync-health.v1"
export const offerFollowUpActivityReadinessSyncHealthReadRecoveryAction =
  "Check Convex readiness reads before trusting remote follow-up history."
export const offerFollowUpActivityReadinessSyncHealthWriteRecoveryAction =
  "Retry readiness writes after Convex persistence recovers."
export const offerFollowUpActivityReadinessSyncHealthStaleAfterHours = 24

export type OfferFollowUpActivityReadinessSyncOperation = "read" | "write"
export type OfferFollowUpActivityReadinessSyncHealthStatus =
  | "healthy"
  | "read_fallback"
  | "read_write_fallback"
  | "write_fallback"
export type OfferFollowUpActivityReadinessSyncHealthRecency = "current" | "none" | "stale"

export interface OfferFollowUpActivityReadinessSyncHealthSummaryOptions {
  now?: string
  staleAfterHours?: number
}

export interface OfferFollowUpActivityReadinessSyncHealthEventInput {
  nonce?: string
  offerId: string
  operation: OfferFollowUpActivityReadinessSyncOperation
  recordedAt: string
  rfqId: string
}

export interface OfferFollowUpActivityReadinessSyncHealthEvent {
  eventId: string
  healthVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION
  nonce: string
  offerId: string
  operation: OfferFollowUpActivityReadinessSyncOperation
  recordedAt: string
  rfqId: string
}

export interface OfferFollowUpActivityReadinessSyncHealthSummary {
  healthVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION
  latestFallback?: OfferFollowUpActivityReadinessSyncHealthEvent
  latestFallbackRecency: OfferFollowUpActivityReadinessSyncHealthRecency
  latestReadFallback?: OfferFollowUpActivityReadinessSyncHealthEvent
  latestWriteFallback?: OfferFollowUpActivityReadinessSyncHealthEvent
  recoveryActionLabels: string[]
  readFallbackCount: number
  status: OfferFollowUpActivityReadinessSyncHealthStatus
  totalFallbackCount: number
  writeFallbackCount: number
}

export function buildOfferFollowUpActivityReadinessSyncHealthEvent(
  input: OfferFollowUpActivityReadinessSyncHealthEventInput,
): OfferFollowUpActivityReadinessSyncHealthEvent {
  const offerId = nonBlank(input.offerId, "syncHealth.offerId")
  const rfqId = nonBlank(input.rfqId, "syncHealth.rfqId")
  const operation = normalizeOperation(input.operation)
  const recordedAt = normalizeIsoTimestamp(input.recordedAt, "syncHealth.recordedAt")
  const nonce = nonBlank(input.nonce ?? "0", "syncHealth.nonce")

  return {
    eventId: `offer-follow-up-activity-readiness-sync:${operation}:${offerId}:${rfqId}:${recordedAt}:${nonce}`,
    healthVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
    nonce,
    offerId,
    operation,
    recordedAt,
    rfqId,
  }
}

export function summarizeOfferFollowUpActivityReadinessSyncHealth(
  events: OfferFollowUpActivityReadinessSyncHealthEvent[] | undefined,
  options: OfferFollowUpActivityReadinessSyncHealthSummaryOptions = {},
): OfferFollowUpActivityReadinessSyncHealthSummary {
  const normalizedEvents = normalizeEvents(events ?? [])
  const latestFallback = newestEvent(normalizedEvents)
  const readFallbacks = normalizedEvents.filter((event) => event.operation === "read")
  const writeFallbacks = normalizedEvents.filter((event) => event.operation === "write")
  const status = determineSummaryStatus(readFallbacks.length, writeFallbacks.length)

  return {
    healthVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
    latestFallback,
    latestFallbackRecency: determineLatestFallbackRecency(latestFallback, options),
    latestReadFallback: newestEvent(readFallbacks),
    latestWriteFallback: newestEvent(writeFallbacks),
    recoveryActionLabels: recoveryActionsForStatus(status),
    readFallbackCount: readFallbacks.length,
    status,
    totalFallbackCount: normalizedEvents.length,
    writeFallbackCount: writeFallbacks.length,
  }
}

function determineLatestFallbackRecency(
  latestFallback: OfferFollowUpActivityReadinessSyncHealthEvent | undefined,
  options: OfferFollowUpActivityReadinessSyncHealthSummaryOptions,
): OfferFollowUpActivityReadinessSyncHealthRecency {
  if (!latestFallback) {
    return "none"
  }
  if (!options.now) {
    return "current"
  }
  const now = normalizeIsoTimestamp(options.now, "syncHealth.now")
  const staleAfterHours = options.staleAfterHours ?? offerFollowUpActivityReadinessSyncHealthStaleAfterHours
  if (!Number.isFinite(staleAfterHours) || staleAfterHours <= 0) {
    throw new Error("syncHealth.staleAfterHours must be a positive number")
  }
  return Date.parse(now) - Date.parse(latestFallback.recordedAt) > staleAfterHours * 60 * 60 * 1000 ? "stale" : "current"
}

function recoveryActionsForStatus(status: OfferFollowUpActivityReadinessSyncHealthStatus): string[] {
  switch (status) {
    case "healthy":
      return []
    case "read_fallback":
      return [offerFollowUpActivityReadinessSyncHealthReadRecoveryAction]
    case "read_write_fallback":
      return [
        offerFollowUpActivityReadinessSyncHealthReadRecoveryAction,
        offerFollowUpActivityReadinessSyncHealthWriteRecoveryAction,
      ]
    case "write_fallback":
      return [offerFollowUpActivityReadinessSyncHealthWriteRecoveryAction]
  }
}

function determineSummaryStatus(
  readFallbackCount: number,
  writeFallbackCount: number,
): OfferFollowUpActivityReadinessSyncHealthStatus {
  if (readFallbackCount > 0 && writeFallbackCount > 0) {
    return "read_write_fallback"
  }
  if (readFallbackCount > 0) {
    return "read_fallback"
  }
  if (writeFallbackCount > 0) {
    return "write_fallback"
  }
  return "healthy"
}

function normalizeEvents(
  events: OfferFollowUpActivityReadinessSyncHealthEvent[],
): OfferFollowUpActivityReadinessSyncHealthEvent[] {
  const eventsById = new Map<string, OfferFollowUpActivityReadinessSyncHealthEvent>()
  for (const event of events) {
    const normalized = buildOfferFollowUpActivityReadinessSyncHealthEvent(event)
    if (event.healthVersion !== OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION) {
      throw new Error("follow-up readiness sync health version is not supported")
    }
    if (event.eventId !== normalized.eventId) {
      throw new Error("follow-up readiness sync health eventId is not stable")
    }
    eventsById.set(normalized.eventId, normalized)
  }
  return [...eventsById.values()]
}

function newestEvent(
  events: OfferFollowUpActivityReadinessSyncHealthEvent[],
): OfferFollowUpActivityReadinessSyncHealthEvent | undefined {
  return events.reduce<OfferFollowUpActivityReadinessSyncHealthEvent | undefined>((newest, event) => {
    if (!newest) {
      return event
    }
    return compareLex(event.recordedAt, newest.recordedAt) > 0 ||
      (event.recordedAt === newest.recordedAt && compareLex(event.eventId, newest.eventId) < 0)
      ? event
      : newest
  }, undefined)
}

function normalizeOperation(
  operation: OfferFollowUpActivityReadinessSyncOperation,
): OfferFollowUpActivityReadinessSyncOperation {
  if (operation !== "read" && operation !== "write") {
    throw new Error("follow-up readiness sync operation is not supported")
  }
  return operation
}
