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
export type OfferFollowUpActivityReadinessSyncHealthSeverity = "critical" | "healthy" | "warning"

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
  operatorSummary: string
  recentFallbacks: OfferFollowUpActivityReadinessSyncHealthEvent[]
  recoveryActionLabels: string[]
  readFallbackCount: number
  severity: OfferFollowUpActivityReadinessSyncHealthSeverity
  status: OfferFollowUpActivityReadinessSyncHealthStatus
  totalFallbackCount: number
  writeFallbackCount: number
}

export function buildOfferFollowUpActivityReadinessSyncHealthExportSummary(
  summary: OfferFollowUpActivityReadinessSyncHealthSummary,
): string {
  const lines = [
    `Follow-up readiness sync health: ${summary.status}`,
    `Severity: ${summary.severity}`,
    `Fallbacks: total ${summary.totalFallbackCount}, read ${summary.readFallbackCount}, write ${summary.writeFallbackCount}`,
    `Recency: ${summary.latestFallbackRecency}`,
    `Summary: ${summary.operatorSummary}`,
  ]

  if (summary.latestFallback) {
    lines.push(
      `Latest fallback: ${summary.latestFallback.operation} ${summary.latestFallback.recordedAt} ${summary.latestFallback.eventId}`,
    )
  }
  if (summary.recoveryActionLabels.length > 0) {
    lines.push(`Recovery actions: ${summary.recoveryActionLabels.join(" | ")}`)
  }
  if (summary.recentFallbacks.length > 0) {
    lines.push("Recent fallbacks:")
    for (const fallback of summary.recentFallbacks) {
      lines.push(`- ${fallback.operation} ${fallback.recordedAt} ${fallback.eventId}`)
    }
  }

  return lines.join("\n")
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
  const latestFallbackRecency = determineLatestFallbackRecency(latestFallback, options)
  const recentFallbacks = [...normalizedEvents].sort(compareEventsNewestFirst)

  return {
    healthVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
    latestFallback,
    latestFallbackRecency,
    latestReadFallback: newestEvent(readFallbacks),
    latestWriteFallback: newestEvent(writeFallbacks),
    operatorSummary: buildOperatorSummary({
      latestFallbackRecency,
      readFallbackCount: readFallbacks.length,
      totalFallbackCount: normalizedEvents.length,
      writeFallbackCount: writeFallbacks.length,
    }),
    recentFallbacks,
    recoveryActionLabels: recoveryActionsForStatus(status),
    readFallbackCount: readFallbacks.length,
    severity: determineSummarySeverity(status, latestFallbackRecency),
    status,
    totalFallbackCount: normalizedEvents.length,
    writeFallbackCount: writeFallbacks.length,
  }
}

function buildOperatorSummary(input: {
  latestFallbackRecency: OfferFollowUpActivityReadinessSyncHealthRecency
  readFallbackCount: number
  totalFallbackCount: number
  writeFallbackCount: number
}): string {
  if (input.totalFallbackCount === 0) {
    return "Follow-up readiness persistence is healthy with no local fallback operations recorded."
  }
  const fallbackText = `${input.totalFallbackCount} fallback${input.totalFallbackCount === 1 ? "" : "s"}`
  const operationText = `read ${input.readFallbackCount}, write ${input.writeFallbackCount}`
  const recencyText = input.latestFallbackRecency === "stale" ? "latest fallback is stale" : "latest fallback is current"
  return `Follow-up readiness persistence used ${fallbackText} (${operationText}); ${recencyText}.`
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

function determineSummarySeverity(
  status: OfferFollowUpActivityReadinessSyncHealthStatus,
  latestFallbackRecency: OfferFollowUpActivityReadinessSyncHealthRecency,
): OfferFollowUpActivityReadinessSyncHealthSeverity {
  if (status === "healthy") {
    return "healthy"
  }
  return latestFallbackRecency === "stale" ? "critical" : "warning"
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

function compareEventsNewestFirst(
  left: OfferFollowUpActivityReadinessSyncHealthEvent,
  right: OfferFollowUpActivityReadinessSyncHealthEvent,
): number {
  const recordedAtComparison = compareLex(right.recordedAt, left.recordedAt)
  return recordedAtComparison === 0 ? compareLex(left.eventId, right.eventId) : recordedAtComparison
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
