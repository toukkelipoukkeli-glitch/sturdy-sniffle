import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { CalendarRfqProviderEventResult } from "./calendarRfq"
import type {
  ConnectorRfqSyncRecord,
  ConnectorRfqSyncResult,
  ConnectorRfqSyncStatus,
} from "./connectorSync"
import type { GmailRfqIngestStatus } from "./gmailRfq"

export type ConvexConnectorProvider = "gmail" | "calendar"
export type ConvexConnectorSyncStatus = "linked" | "stale" | "blocked"
export type ConvexConnectorActivityKind = "email_received" | "calendar_event" | "note"

export interface ConvexConnectorIntegrationLinkPayload {
  provider: ConvexConnectorProvider
  externalId: string
  syncStatus: ConvexConnectorSyncStatus
  externalUrl?: string
  rfqId?: string
}

export interface ConvexConnectorActivityPayload {
  kind: ConvexConnectorActivityKind
  message: string
  actorName?: string
  rfqId?: string
}

export interface ConvexConnectorRfqSyncPayload {
  activities: ConvexConnectorActivityPayload[]
  links: ConvexConnectorIntegrationLinkPayload[]
}

export interface BuildConvexConnectorRfqSyncPayloadOptions {
  actorName?: string
  resolveRfqId?: (rfqId: string) => string | undefined
}

export function buildConvexConnectorRfqSyncPayload(
  result: ConnectorRfqSyncResult,
  options: BuildConvexConnectorRfqSyncPayloadOptions = {},
): ConvexConnectorRfqSyncPayload {
  const actorName = optionalTrim(options.actorName)
  const activities: ConvexConnectorActivityPayload[] = []
  const links = new Map<string, ConvexConnectorIntegrationLinkPayload>()

  for (const [index, record] of result.records.entries()) {
    const rfqId = resolveRecordRfqId(record, index, options)
    if (!rfqId) {
      activities.push(
        compactActivity({
          actorName,
          kind: "note",
          message: `Skipped connector sync for ${nonBlank(record.rfqId, `records[${index}].rfqId`)} because the RFQ is not persisted.`,
        }),
      )
      continue
    }

    const gmailExternalId = recordGmailExternalId(record, index)
    mergeLink(links, {
      externalId: gmailExternalId,
      provider: "gmail",
      rfqId,
      syncStatus: gmailLinkStatus(result.gmail.status),
    })
    activities.push(
      compactActivity({
        actorName,
        kind: "email_received",
        message: `Synced Gmail RFQ ${gmailExternalId}: ${nonBlank(record.parsedSubject, `records[${index}].parsedSubject`)}.`,
        rfqId,
      }),
    )

    if (record.calendar.results.length === 0) {
      activities.push(
        compactActivity({
          actorName,
          kind: "calendar_event",
          message: calendarEmptyResultMessage(record),
          rfqId,
        }),
      )
      continue
    }

    for (const [eventIndex, eventResult] of record.calendar.results.entries()) {
      const externalId = optionalTrim(eventResult.externalId)
      if (externalId) {
        mergeLink(links, {
          externalId,
          provider: "calendar",
          rfqId,
          syncStatus: calendarLinkStatus(record, eventResult),
        })
      }
      activities.push(
        compactActivity({
          actorName,
          kind: "calendar_event",
          message: calendarEventMessage(record, eventResult, index, eventIndex),
          rfqId,
        }),
      )
    }
  }

  if (result.records.length === 0) {
    activities.push(
      compactActivity({
        actorName,
        kind: "note",
        message: `Connector RFQ sync ${normalizeSyncStatus(result.status)} for Gmail query "${nonBlank(result.gmail.query, "gmail.query")}" with 0 RFQs.`,
      }),
    )
  }

  return {
    activities,
    links: [...links.values()],
  }
}

function resolveRecordRfqId(
  record: ConnectorRfqSyncRecord,
  index: number,
  options: BuildConvexConnectorRfqSyncPayloadOptions,
): string | undefined {
  const rfqId = nonBlank(record.rfqId, `records[${index}].rfqId`)
  const resolved = options.resolveRfqId?.(rfqId)
  return optionalTrim(resolved)
}

function recordGmailExternalId(record: ConnectorRfqSyncRecord, index: number): string {
  const messageId = nonBlank(record.messageId, `records[${index}].messageId`)
  const threadId = optionalTrim(record.threadId)
  return threadId ? `${threadId}:${messageId}` : messageId
}

function gmailLinkStatus(status: GmailRfqIngestStatus): ConvexConnectorSyncStatus {
  if (status === "failed") {
    return "blocked"
  }
  return status === "fallback" ? "stale" : "linked"
}

function calendarLinkStatus(
  record: ConnectorRfqSyncRecord,
  eventResult: CalendarRfqProviderEventResult,
): ConvexConnectorSyncStatus {
  if (record.status === "calendar_failed") {
    return "blocked"
  }
  if (record.status === "calendar_fallback" || eventResult.status === "skipped") {
    return "stale"
  }
  return "linked"
}

function calendarEmptyResultMessage(record: ConnectorRfqSyncRecord): string {
  const warnings = record.warnings.length > 0 ? ` ${record.warnings.join(" ")}` : ""
  if (record.status === "calendar_failed") {
    return `Calendar sync failed for RFQ ${record.rfqId}.${warnings}`
  }
  if (record.status === "calendar_skipped") {
    return `Calendar sync skipped for RFQ ${record.rfqId}.${warnings}`
  }
  return `Calendar sync produced no events for RFQ ${record.rfqId}.${warnings}`
}

function calendarEventMessage(
  record: ConnectorRfqSyncRecord,
  eventResult: CalendarRfqProviderEventResult,
  recordIndex: number,
  eventIndex: number,
): string {
  const title = nonBlank(eventResult.event.title, `records[${recordIndex}].calendar.results[${eventIndex}].event.title`)
  const eventKind = nonBlank(eventResult.event.kind, `records[${recordIndex}].calendar.results[${eventIndex}].event.kind`)
  const warningSuffix = eventResult.warnings.length > 0 ? ` ${eventResult.warnings.join(" ")}` : ""
  return `${eventResult.status === "created" ? "Synced" : "Skipped"} calendar ${eventKind} event "${title}" for RFQ ${record.rfqId}.${warningSuffix}`
}

function normalizeSyncStatus(status: ConnectorRfqSyncStatus): ConnectorRfqSyncStatus {
  if (
    status !== "failed" &&
    status !== "fallback" &&
    status !== "partial" &&
    status !== "skipped" &&
    status !== "succeeded"
  ) {
    throw new Error("connector sync status is not supported")
  }
  return status
}

function mergeLink(
  links: Map<string, ConvexConnectorIntegrationLinkPayload>,
  link: ConvexConnectorIntegrationLinkPayload,
) {
  const normalized = compactLink(link)
  const key = `${normalized.provider}:${normalized.externalId}`
  const existing = links.get(key)
  if (!existing) {
    links.set(key, normalized)
    return
  }

  links.set(key, {
    ...existing,
    syncStatus: worstSyncStatus(existing.syncStatus, normalized.syncStatus),
  })
}

function compactLink(link: ConvexConnectorIntegrationLinkPayload): ConvexConnectorIntegrationLinkPayload {
  const externalUrl = optionalTrim(link.externalUrl)
  const rfqId = optionalTrim(link.rfqId)
  return {
    externalId: nonBlank(link.externalId, "externalId"),
    ...(externalUrl ? { externalUrl } : {}),
    provider: link.provider,
    ...(rfqId ? { rfqId } : {}),
    syncStatus: link.syncStatus,
  }
}

function compactActivity(activity: ConvexConnectorActivityPayload): ConvexConnectorActivityPayload {
  const actorName = optionalTrim(activity.actorName)
  const rfqId = optionalTrim(activity.rfqId)
  return {
    ...(actorName ? { actorName } : {}),
    kind: activity.kind,
    message: compactMessage(nonBlank(activity.message, "message")),
    ...(rfqId ? { rfqId } : {}),
  }
}

function worstSyncStatus(
  left: ConvexConnectorSyncStatus,
  right: ConvexConnectorSyncStatus,
): ConvexConnectorSyncStatus {
  const severity: Record<ConvexConnectorSyncStatus, number> = {
    blocked: 3,
    stale: 2,
    linked: 1,
  }
  return severity[right] > severity[left] ? right : left
}

function compactMessage(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 500)
}
