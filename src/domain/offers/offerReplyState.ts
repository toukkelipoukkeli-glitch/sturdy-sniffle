import type { ConvexOfferReplySyncPayload } from "./convexOfferReply"
import type { OfferReplySyncPersistenceSnapshot } from "./offerReplySyncPersistence"

export type OfferReplyStateFilter = "all" | "applied" | "duplicates" | "ignored" | "transitions" | "warnings"
export type OfferReplyStateEventKind = "applied" | "duplicate" | "ignored" | "transition" | "warning"

export interface OfferReplyStateEvent {
  key: string
  kind: OfferReplyStateEventKind
  label: string
  message: string
  offerId: string
  syncIndex: number
}

export interface OfferReplyStateSummary {
  appliedMessageCount: number
  duplicateSyncCount: number
  events: OfferReplyStateEvent[]
  filter: OfferReplyStateFilter
  ignoredMessageCount: number
  recordedMessageCount: number
  syncCount: number
  transitionCount: number
  warningCount: number
}

export interface BuildOfferReplyStateSummaryOptions {
  filter?: OfferReplyStateFilter
}

export function buildOfferReplyStateSummary(
  snapshot: OfferReplySyncPersistenceSnapshot,
  options: BuildOfferReplyStateSummaryOptions = {},
): OfferReplyStateSummary {
  const filter = options.filter ?? "all"
  const allEvents = snapshot.payloads.flatMap((payload, index) => payloadEvents(payload, index))
  const events = filter === "all" ? allEvents : allEvents.filter((event) => eventMatchesFilter(event, filter))

  return {
    appliedMessageCount: snapshot.payloads.reduce((count, payload) => count + payload.appliedMessageIds.length, 0),
    duplicateSyncCount: snapshot.payloads.filter(isDuplicatePayload).length,
    events,
    filter,
    ignoredMessageCount: snapshot.payloads.reduce((count, payload) => count + payload.ignoredMessageIds.length, 0),
    recordedMessageCount: snapshot.recordedMessageIds.length,
    syncCount: snapshot.syncCount,
    transitionCount: snapshot.payloads.reduce((count, payload) => count + payload.statusTransitions.length, 0),
    warningCount: snapshot.payloads.reduce((count, payload) => count + payload.warnings.length, 0),
  }
}

function payloadEvents(payload: ConvexOfferReplySyncPayload, syncIndex: number): OfferReplyStateEvent[] {
  const events: OfferReplyStateEvent[] = []

  for (const messageId of payload.appliedMessageIds) {
    events.push({
      key: `sync-${syncIndex}:applied:${messageId}`,
      kind: "applied",
      label: "Applied reply",
      message: messageId,
      offerId: payload.offerId,
      syncIndex,
    })
  }

  for (const messageId of payload.ignoredMessageIds) {
    events.push({
      key: `sync-${syncIndex}:ignored:${messageId}`,
      kind: "ignored",
      label: "Ignored reply",
      message: messageId,
      offerId: payload.offerId,
      syncIndex,
    })
  }

  for (const [transitionIndex, transition] of payload.statusTransitions.entries()) {
    events.push({
      key: `sync-${syncIndex}:transition:${transition.status}:${transitionIndex}`,
      kind: "transition",
      label: "Status transition",
      message: transition.message ? `${transition.status}: ${transition.message}` : transition.status,
      offerId: payload.offerId,
      syncIndex,
    })
  }

  payload.warnings.forEach((warning, warningIndex) => {
    events.push({
      key: `sync-${syncIndex}:warning:${warningIndex}`,
      kind: "warning",
      label: "Warning",
      message: warning,
      offerId: payload.offerId,
      syncIndex,
    })
  })

  if (isDuplicatePayload(payload)) {
    events.push({
      key: `sync-${syncIndex}:duplicate`,
      kind: "duplicate",
      label: "Duplicate sync",
      message: "Reply sync recorded no new messages.",
      offerId: payload.offerId,
      syncIndex,
    })
  }

  return events
}

function isDuplicatePayload(payload: ConvexOfferReplySyncPayload): boolean {
  return payload.appliedMessageIds.length === 0 && payload.ignoredMessageIds.length === 0 && payload.statusTransitions.length === 0
}

function eventMatchesFilter(event: OfferReplyStateEvent, filter: OfferReplyStateFilter): boolean {
  switch (filter) {
    case "all":
      return true
    case "applied":
      return event.kind === "applied"
    case "duplicates":
      return event.kind === "duplicate"
    case "ignored":
      return event.kind === "ignored"
    case "transitions":
      return event.kind === "transition"
    case "warnings":
      return event.kind === "warning"
  }
}
