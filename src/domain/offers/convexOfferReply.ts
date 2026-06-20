import type { GmailOfferReplyRecord, GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { OfferStatus } from "./offer"

export type ConvexOfferReplyActivityKind = "email_received" | "note"

export interface ConvexOfferReplyActivityPayload {
  kind: ConvexOfferReplyActivityKind
  message: string
  actorName?: string
}

export interface ConvexOfferReplyStatusTransitionPayload {
  status: Extract<OfferStatus, "accepted" | "declined">
  message?: string
}

export interface ConvexOfferReplySyncPayload {
  offerId: string
  activities: ConvexOfferReplyActivityPayload[]
  statusTransitions: ConvexOfferReplyStatusTransitionPayload[]
  appliedMessageIds: string[]
  ignoredMessageIds: string[]
  warnings: string[]
  quoteId?: string
  rfqId?: string
}

export interface BuildConvexOfferReplySyncPayloadOptions {
  offerId: string
  actorName?: string
  quoteId?: string
  recordedMessageIds?: string[]
  rfqId?: string
}

export function buildConvexOfferReplySyncPayload(
  syncResult: GmailOfferReplySyncResult,
  options: BuildConvexOfferReplySyncPayloadOptions,
): ConvexOfferReplySyncPayload {
  const offerId = nonBlank(options.offerId, "offerId")
  const actorName = optionalTrim(options.actorName) ?? "Gmail offer reply sync"
  const quoteId = optionalTrim(options.quoteId)
  const recordedMessageIds = normalizeRecordedMessageIds(options.recordedMessageIds ?? [])
  const rfqId = optionalTrim(options.rfqId)
  const offerNumber = nonBlank(syncResult.offerNumber, "syncResult.offerNumber")
  const activities: ConvexOfferReplyActivityPayload[] = []
  const appliedMessageIds: string[] = []
  const ignoredMessageIds: string[] = []
  const warnings = [...syncResult.warnings.map(compactMessage)]
  const statusSignals: ConvexOfferReplyStatusTransitionPayload[] = []

  for (const record of sortedRecords(syncResult.records)) {
    const messageId = nonBlank(record.parsed.messageId, "record.parsed.messageId")
    if (recordedMessageIds.has(messageId)) {
      continue
    }

    warnings.push(...record.parsed.warnings.map(compactMessage))
    if (record.parsed.matched && record.parsed.event) {
      appliedMessageIds.push(messageId)
      activities.push({
        actorName,
        kind: "email_received",
        message: compactMessage(`Synced Gmail offer reply ${externalReplyId(record)} for ${offerNumber}: ${signalLabel(record)}.`),
      })

      const transition = statusTransitionForRecord(record)
      if (transition) {
        statusSignals.push(transition)
      }
    } else {
      ignoredMessageIds.push(messageId)
      activities.push({
        actorName,
        kind: "note",
        message: compactMessage(`Ignored Gmail offer reply ${externalReplyId(record)} for ${offerNumber}: no lifecycle signal matched.`),
      })
    }
  }

  const statusTransitions = dedupeStatusTransitions(statusSignals)
  if (activities.length === 0) {
    activities.push({
      actorName,
      kind: "note",
      message: compactMessage(`Offer reply sync ${syncResult.status} for ${offerNumber} recorded no new messages.`),
    })
  }

  return {
    activities,
    appliedMessageIds,
    ignoredMessageIds,
    offerId,
    ...(quoteId ? { quoteId } : {}),
    ...(rfqId ? { rfqId } : {}),
    statusTransitions,
    warnings: warnings.filter(Boolean),
  }
}

function sortedRecords(records: GmailOfferReplyRecord[]): GmailOfferReplyRecord[] {
  return [...records].sort((left, right) => {
    const leftReceived = normalizeIsoTimestamp(left.message.receivedAt, "message.receivedAt")
    const rightReceived = normalizeIsoTimestamp(right.message.receivedAt, "message.receivedAt")
    return leftReceived.localeCompare(rightReceived) || left.parsed.messageId.localeCompare(right.parsed.messageId)
  })
}

function statusTransitionForRecord(record: GmailOfferReplyRecord): ConvexOfferReplyStatusTransitionPayload | undefined {
  const event = record.parsed.event
  if (!event || (event.kind !== "accepted" && event.kind !== "declined")) {
    return undefined
  }

  const message = optionalTrim(event.note)
  return {
    ...(message ? { message: compactMessage(message) } : {}),
    status: event.kind,
  }
}

function dedupeStatusTransitions(
  transitions: ConvexOfferReplyStatusTransitionPayload[],
): ConvexOfferReplyStatusTransitionPayload[] {
  const statuses = new Set(transitions.map((transition) => transition.status))
  if (statuses.has("accepted") && statuses.has("declined")) {
    throw new Error("offer reply sync has conflicting accepted and declined signals")
  }

  const [firstTransition] = transitions
  return firstTransition ? [firstTransition] : []
}

function externalReplyId(record: GmailOfferReplyRecord): string {
  const messageId = nonBlank(record.parsed.messageId, "record.parsed.messageId")
  const threadId = optionalTrim(record.parsed.threadId)
  return threadId ? `${threadId}:${messageId}` : messageId
}

function signalLabel(record: GmailOfferReplyRecord): string {
  return record.parsed.signal?.replaceAll("_", " ") ?? record.parsed.event?.kind.replaceAll("_", " ") ?? "note"
}

function normalizeRecordedMessageIds(values: string[]): Set<string> {
  return new Set(values.map((value, index) => nonBlank(value, `recordedMessageIds[${index}]`)))
}

function compactMessage(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 500)
}
