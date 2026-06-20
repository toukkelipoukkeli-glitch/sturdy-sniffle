import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import type { ConvexConnectorRfqSyncPayload } from "../integrations/convexConnectorSync"
import type { ProviderRunAudit } from "../providers/providerRunAudit"
import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import type { WorkspaceActionRecord } from "./workspaceActions"

export const WORKSPACE_AUDIT_FEED_VERSION = "workspace-audit-feed.v1"

export type WorkspaceAuditEventSource =
  | "calendar_follow_up"
  | "connector"
  | "offer_reply"
  | "provider_run"
  | "workspace_action"

export type WorkspaceAuditEventSeverity = "info" | "attention" | "blocked"

export interface WorkspaceAuditConnectorSync {
  payload: ConvexConnectorRfqSyncPayload
  recordedAt: string
}

export interface WorkspaceAuditOfferReplySync {
  result: GmailOfferReplySyncResult
  syncedAt: string
}

export interface WorkspaceAuditFollowUp {
  offerId?: string
  offerNumber: string
  rfqId?: string
  scheduledAt: string
}

export interface WorkspaceAuditFeedInput {
  actions?: WorkspaceActionRecord[]
  connectorSyncs?: WorkspaceAuditConnectorSync[]
  followUps?: WorkspaceAuditFollowUp[]
  offerReplySyncs?: WorkspaceAuditOfferReplySync[]
  providerRuns?: ProviderRunAudit[]
}

export interface WorkspaceAuditFeedOptions {
  limit?: number
  offerId?: string
  quoteId?: string
  rfqId?: string
}

export interface WorkspaceAuditEvent {
  auditVersion: typeof WORKSPACE_AUDIT_FEED_VERSION
  key: string
  source: WorkspaceAuditEventSource
  severity: WorkspaceAuditEventSeverity
  occurredAt: string
  label: string
  message: string
  actor?: string
  offerId?: string
  quoteId?: string
  rfqId?: string
  status?: string
}

export interface WorkspaceAuditFeed {
  auditVersion: typeof WORKSPACE_AUDIT_FEED_VERSION
  events: WorkspaceAuditEvent[]
  generatedAt: string
  summary: {
    attentionCount: number
    blockedCount: number
    eventCount: number
    latestEventAt?: string
  }
}

export function buildWorkspaceAuditFeed(
  input: WorkspaceAuditFeedInput,
  options: WorkspaceAuditFeedOptions & { generatedAt: string },
): WorkspaceAuditFeed {
  const generatedAt = normalizeIsoTimestamp(options.generatedAt, "generatedAt")
  const events = [
    ...(input.actions ?? []).map(actionEvent),
    ...(input.connectorSyncs ?? []).flatMap(connectorEvents),
    ...(input.providerRuns ?? []).map(providerRunEvent),
    ...(input.offerReplySyncs ?? []).flatMap(offerReplyEvents),
    ...(input.followUps ?? []).map(followUpEvent),
  ]
    .filter((event) => matchesFilter(event, options))
    .sort(compareEvents)
    .slice(0, normalizeLimit(options.limit))

  return {
    auditVersion: WORKSPACE_AUDIT_FEED_VERSION,
    events,
    generatedAt,
    summary: {
      attentionCount: events.filter((event) => event.severity === "attention").length,
      blockedCount: events.filter((event) => event.severity === "blocked").length,
      eventCount: events.length,
      ...(events[0] ? { latestEventAt: events[0].occurredAt } : {}),
    },
  }
}

function actionEvent(action: WorkspaceActionRecord): WorkspaceAuditEvent {
  return compactEvent({
    actor: action.actor,
    key: `workspace:${action.key}`,
    label: "Workspace action",
    message: action.activityMessage,
    occurredAt: action.occurredAt,
    offerId: action.offerId,
    quoteId: action.quoteId,
    rfqId: action.rfqId,
    severity: "info",
    source: "workspace_action",
    status: action.kind,
  })
}

function connectorEvents(sync: WorkspaceAuditConnectorSync): WorkspaceAuditEvent[] {
  const recordedAt = normalizeIsoTimestamp(sync.recordedAt, "connectorSync.recordedAt")
  const activityEvents = sync.payload.activities.map((activity) =>
    compactEvent({
      actor: activity.actorName,
      key: `connector:activity:${hashKey(
        `${activity.kind}|${activity.message}|${activity.actorName ?? ""}|${activity.rfqId ?? ""}|${recordedAt}`,
      )}`,
      label: connectorActivityLabel(activity.kind),
      message: activity.message,
      occurredAt: recordedAt,
      rfqId: activity.rfqId,
      severity: connectorActivitySeverity(activity.message),
      source: "connector",
      status: activity.kind,
    }),
  )
  const linkEvents = sync.payload.links.map((link) =>
    compactEvent({
      key: `connector:link:${hashKey(
        `${link.provider}|${link.externalId}|${link.syncStatus}|${link.rfqId ?? ""}|${recordedAt}`,
      )}`,
      label: `${link.provider.toUpperCase()} link`,
      message: `${link.provider} link ${link.externalId} is ${link.syncStatus}.`,
      occurredAt: recordedAt,
      rfqId: link.rfqId,
      severity: connectorLinkSeverity(link.syncStatus),
      source: "connector",
      status: link.syncStatus,
    }),
  )

  return [...activityEvents, ...linkEvents]
}

function providerRunEvent(audit: ProviderRunAudit): WorkspaceAuditEvent {
  const message = audit.outputSummary ?? audit.errorMessage ?? audit.promptExcerpt
  return compactEvent({
    key: `provider:${audit.runKey}`,
    label: `${audit.provider} ${audit.purpose}`,
    message,
    occurredAt: audit.completedAt,
    offerId: audit.trace?.offerId,
    quoteId: audit.trace?.quoteId,
    rfqId: audit.trace?.rfqId,
    severity: providerSeverity(audit),
    source: "provider_run",
    status: audit.status,
  })
}

function offerReplyEvents(sync: WorkspaceAuditOfferReplySync): WorkspaceAuditEvent[] {
  const syncedAt = normalizeIsoTimestamp(sync.syncedAt, "offerReplySync.syncedAt")
  if (sync.result.records.length === 0) {
    return [
      compactEvent({
        key: `offer-reply:sync:${sync.result.offerNumber}:${syncedAt}`,
        label: "Offer reply sync",
        message: `Offer reply sync ${sync.result.status} for ${sync.result.offerNumber}.`,
        occurredAt: syncedAt,
        severity: sync.result.status === "failed" ? "blocked" : "attention",
        source: "offer_reply",
        status: sync.result.status,
      }),
    ]
  }

  return sync.result.records.map((record) =>
    compactEvent({
      actor: record.message.senderName ?? record.message.senderEmail,
      key: `offer-reply:${sync.result.offerNumber}:${record.message.id}`,
      label: "Customer reply",
      message: record.parsed.matched
        ? `${record.parsed.signal ?? "matched"} reply for ${sync.result.offerNumber}.`
        : `Ignored reply for ${sync.result.offerNumber}.`,
      occurredAt: record.message.receivedAt,
      severity: record.parsed.matched ? "info" : "attention",
      source: "offer_reply",
      status: record.parsed.signal ?? (record.parsed.matched ? "matched" : "ignored"),
    }),
  )
}

function followUpEvent(followUp: WorkspaceAuditFollowUp): WorkspaceAuditEvent {
  return compactEvent({
    key: `calendar-follow-up:${followUp.offerNumber}:${followUp.scheduledAt}`,
    label: "Calendar follow-up",
    message: `Follow-up scheduled for ${followUp.offerNumber}.`,
    occurredAt: followUp.scheduledAt,
    offerId: followUp.offerId,
    rfqId: followUp.rfqId,
    severity: "info",
    source: "calendar_follow_up",
    status: "scheduled",
  })
}

function compactEvent(event: Omit<WorkspaceAuditEvent, "auditVersion" | "occurredAt"> & { occurredAt: string }): WorkspaceAuditEvent {
  const occurredAt = normalizeIsoTimestamp(event.occurredAt, `${event.source}.occurredAt`)
  return {
    auditVersion: WORKSPACE_AUDIT_FEED_VERSION,
    key: event.key,
    source: event.source,
    severity: event.severity,
    occurredAt,
    label: event.label,
    message: event.message,
    ...(event.actor ? { actor: event.actor } : {}),
    ...(event.offerId ? { offerId: event.offerId } : {}),
    ...(event.quoteId ? { quoteId: event.quoteId } : {}),
    ...(event.rfqId ? { rfqId: event.rfqId } : {}),
    ...(event.status ? { status: event.status } : {}),
  }
}

function matchesFilter(event: WorkspaceAuditEvent, options: WorkspaceAuditFeedOptions): boolean {
  return (
    (!options.rfqId || event.rfqId === options.rfqId) &&
    (!options.quoteId || event.quoteId === options.quoteId) &&
    (!options.offerId || event.offerId === options.offerId)
  )
}

function compareEvents(left: WorkspaceAuditEvent, right: WorkspaceAuditEvent): number {
  return compareLex(right.occurredAt, left.occurredAt) || compareLex(left.key, right.key)
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return Number.POSITIVE_INFINITY
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("limit must be a positive integer")
  }
  return limit
}

function connectorActivityLabel(kind: string): string {
  switch (kind) {
    case "email_received":
      return "RFQ email"
    case "calendar_event":
      return "Calendar sync"
    default:
      return "Connector note"
  }
}

function connectorActivitySeverity(message: string): WorkspaceAuditEventSeverity {
  const normalized = message.toLowerCase()
  if (normalized.includes("failed") || normalized.includes("blocked")) {
    return "blocked"
  }
  if (normalized.includes("skipped") || normalized.includes("fallback") || normalized.includes("not persisted")) {
    return "attention"
  }
  return "info"
}

function connectorLinkSeverity(status: string): WorkspaceAuditEventSeverity {
  if (status === "blocked") {
    return "blocked"
  }
  return status === "stale" ? "attention" : "info"
}

function providerSeverity(audit: ProviderRunAudit): WorkspaceAuditEventSeverity {
  if (audit.status === "failed") {
    return "blocked"
  }
  if (audit.status === "skipped" || audit.warnings.length > 0) {
    return "attention"
  }
  return "info"
}

function hashKey(value: string): string {
  let hash = 0
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}
