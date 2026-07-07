import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"

export const OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION = "offer-follow-up-activity-readiness-sync-health.v1"

export type OfferFollowUpActivityReadinessSyncOperation = "read" | "write"

export interface OfferFollowUpActivityReadinessSyncHealthEventInput {
  offerId: string
  operation: OfferFollowUpActivityReadinessSyncOperation
  recordedAt: string
  rfqId: string
}

export interface OfferFollowUpActivityReadinessSyncHealthEvent {
  eventId: string
  healthVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION
  offerId: string
  operation: OfferFollowUpActivityReadinessSyncOperation
  recordedAt: string
  rfqId: string
}

export interface OfferFollowUpActivityReadinessSyncHealthSummary {
  healthVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION
  latestFallback?: OfferFollowUpActivityReadinessSyncHealthEvent
  readFallbackCount: number
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

  return {
    eventId: `offer-follow-up-activity-readiness-sync:${operation}:${offerId}:${rfqId}:${recordedAt}`,
    healthVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
    offerId,
    operation,
    recordedAt,
    rfqId,
  }
}

export function summarizeOfferFollowUpActivityReadinessSyncHealth(
  events: OfferFollowUpActivityReadinessSyncHealthEvent[] | undefined,
): OfferFollowUpActivityReadinessSyncHealthSummary {
  const normalizedEvents = normalizeEvents(events ?? [])
  const latestFallback = newestEvent(normalizedEvents)

  return {
    healthVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
    latestFallback,
    readFallbackCount: normalizedEvents.filter((event) => event.operation === "read").length,
    totalFallbackCount: normalizedEvents.length,
    writeFallbackCount: normalizedEvents.filter((event) => event.operation === "write").length,
  }
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
