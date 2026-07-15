import type {
  ConvexConnectorActivityKind,
  ConvexConnectorProvider,
  ConvexConnectorSyncStatus,
} from "./convexConnectorSync"
import type { ConnectorSyncPersistenceSnapshot } from "./connectorSyncPersistence"
import { nonBlank } from "../shared/stringValidation"

export type ConnectorLinkDrilldownFilter = "all" | "gmail" | "calendar" | "attention" | "activity"
export type ConnectorLinkDrilldownItemKind = "activity" | "link"

export interface ConnectorLinkDrilldownOptions {
  filter?: ConnectorLinkDrilldownFilter
  limit?: number
  rfqId: string
}

export interface ConnectorLinkDrilldownSummary {
  activityCount: number
  blockedCount: number
  calendarLinkCount: number
  gmailLinkCount: number
  linkedCount: number
  linkCount: number
  staleCount: number
  syncCount: number
}

export interface ConnectorLinkDrilldownItem {
  detail: string
  externalUrl?: string
  key: string
  kind: ConnectorLinkDrilldownItemKind
  label: string
  provider?: ConvexConnectorProvider
  status?: ConvexConnectorSyncStatus | ConvexConnectorActivityKind
}

export interface ConnectorLinkDrilldown {
  filter: ConnectorLinkDrilldownFilter
  items: ConnectorLinkDrilldownItem[]
  recoveryActionLabels: string[]
  summary: ConnectorLinkDrilldownSummary
}

interface LinkAccumulator {
  externalId: string
  externalUrl?: string
  provider: ConvexConnectorProvider
  status: ConvexConnectorSyncStatus
  syncOccurrences: number
}

export function buildConnectorLinkDrilldown(
  snapshot: ConnectorSyncPersistenceSnapshot,
  options: ConnectorLinkDrilldownOptions,
): ConnectorLinkDrilldown {
  const rfqId = nonBlank(options.rfqId, "rfqId")
  const limit = normalizeLimit(options.limit)
  const filter = options.filter ?? "all"
  const linkMap = new Map<string, LinkAccumulator>()
  const activities: ConnectorLinkDrilldownItem[] = []

  for (const [payloadIndex, payload] of snapshot.payloads.entries()) {
    for (const link of payload.links) {
      if (link.rfqId !== rfqId) {
        continue
      }

      const key = `${link.provider}:${link.externalId}`
      const existing = linkMap.get(key)
      if (!existing) {
        linkMap.set(key, {
          externalId: link.externalId,
          externalUrl: link.externalUrl,
          provider: link.provider,
          status: link.syncStatus,
          syncOccurrences: 1,
        })
        continue
      }

      linkMap.set(key, {
        ...existing,
        externalUrl: existing.externalUrl ?? link.externalUrl,
        status: worstSyncStatus(existing.status, link.syncStatus),
        syncOccurrences: existing.syncOccurrences + 1,
      })
    }

    for (const [activityIndex, activity] of payload.activities.entries()) {
      if (activity.rfqId !== rfqId) {
        continue
      }

      activities.push({
        detail: activity.actorName ? `Recorded by ${activity.actorName}.` : "Connector activity.",
        key: `activity:${payloadIndex}:${activityIndex}:${activity.kind}`,
        kind: "activity",
        label: activity.message,
        status: activity.kind,
      })
    }
  }

  const linkAccumulators = [...linkMap.values()].sort(compareLinks)
  const links = linkAccumulators.map(linkItem)
  const summary = summarize(links, activities, snapshot.syncCount)
  const items = [...filterLinks(links, filter), ...filterActivities(activities, filter)].slice(0, limit)

  return {
    filter,
    items,
    recoveryActionLabels: recoveryActionsForLinks(linkAccumulators),
    summary,
  }
}

function summarize(
  links: ConnectorLinkDrilldownItem[],
  activities: ConnectorLinkDrilldownItem[],
  syncCount: number,
): ConnectorLinkDrilldownSummary {
  return {
    activityCount: activities.length,
    blockedCount: links.filter((link) => link.status === "blocked").length,
    calendarLinkCount: links.filter((link) => link.provider === "calendar").length,
    gmailLinkCount: links.filter((link) => link.provider === "gmail").length,
    linkedCount: links.filter((link) => link.status === "linked").length,
    linkCount: links.length,
    staleCount: links.filter((link) => link.status === "stale").length,
    syncCount,
  }
}

function linkItem(link: LinkAccumulator): ConnectorLinkDrilldownItem {
  const occurrenceSuffix = link.syncOccurrences > 1 ? ` - ${link.syncOccurrences} syncs` : ""
  return {
    detail: `${link.externalId}${occurrenceSuffix}`,
    ...(link.externalUrl ? { externalUrl: link.externalUrl } : {}),
    key: `link:${link.provider}:${link.externalId}`,
    kind: "link",
    label: link.provider === "gmail" ? "Gmail message thread" : "Calendar event",
    provider: link.provider,
    status: link.status,
  }
}

function recoveryActionsForLinks(links: LinkAccumulator[]): string[] {
  return links.flatMap((link) => {
    if (link.status === "linked") {
      return []
    }
    const providerLabel = link.provider === "gmail" ? "Gmail" : "Calendar"
    if (link.status === "blocked") {
      return [`Reconnect ${providerLabel} before resyncing ${link.externalId}.`]
    }
    return [`Refresh ${providerLabel} sync for ${link.externalId}.`]
  })
}

function filterLinks(
  links: ConnectorLinkDrilldownItem[],
  filter: ConnectorLinkDrilldownFilter,
): ConnectorLinkDrilldownItem[] {
  if (filter === "activity") {
    return []
  }
  if (filter === "gmail" || filter === "calendar") {
    return links.filter((link) => link.provider === filter)
  }
  if (filter === "attention") {
    return links.filter((link) => link.status === "blocked" || link.status === "stale")
  }
  return links
}

function filterActivities(
  activities: ConnectorLinkDrilldownItem[],
  filter: ConnectorLinkDrilldownFilter,
): ConnectorLinkDrilldownItem[] {
  if (filter === "all" || filter === "activity") {
    return activities
  }
  return []
}

function compareLinks(left: LinkAccumulator, right: LinkAccumulator): number {
  const providerOrder: Record<ConvexConnectorProvider, number> = {
    gmail: 1,
    calendar: 2,
  }
  const providerDelta = providerOrder[left.provider] - providerOrder[right.provider]
  if (providerDelta !== 0) {
    return providerDelta
  }
  return left.externalId.localeCompare(right.externalId)
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

function normalizeLimit(value: number | undefined): number {
  if (value === undefined) {
    return 6
  }
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("limit must be a positive integer")
  }
  return value
}
