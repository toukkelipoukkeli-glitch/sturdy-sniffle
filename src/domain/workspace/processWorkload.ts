import type { QuoteProcessKey } from "../quoting/registry"
import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { rankQuoteQueue, type QuoteQueueItem, type QuoteQueueStatus, type RankedQuoteQueueItem } from "./quoteQueue"

export const PROCESS_WORKLOAD_VERSION = "process-workload.v1"

export type ProcessWorkloadBadge = "overdue" | "due_today" | "due_soon" | "rush" | "ready_to_send" | "high_load"

export interface ProcessWorkloadInput {
  items: QuoteQueueItem[]
  now: string
  topItemLimit?: number
}

export interface ProcessWorkloadBucket {
  process: QuoteProcessKey
  rank: number
  openItemCount: number
  rushItemCount: number
  overdueItemCount: number
  dueTodayItemCount: number
  dueSoonItemCount: number
  readyItemCount: number
  estimatedValueCents: number
  earliestDueAt: string
  highestRiskQueueItemId: string
  topQueueItemIds: string[]
  riskScore: number
  badges: ProcessWorkloadBadge[]
}

export interface ProcessWorkloadSummary {
  workloadVersion: typeof PROCESS_WORKLOAD_VERSION
  generatedAt: string
  totalOpenItems: number
  totalEstimatedValueCents: number
  buckets: ProcessWorkloadBucket[]
}

const openStatuses: ReadonlySet<QuoteQueueStatus> = new Set(["new", "triage", "estimating", "ready"])

export function summarizeProcessWorkload(input: ProcessWorkloadInput): ProcessWorkloadSummary {
  const generatedAt = normalizeIsoTimestamp(input.now, "now")
  const topItemLimit = positiveInteger(input.topItemLimit ?? 3, "topItemLimit")
  const activeItems = rankQuoteQueue(input.items, { now: generatedAt }).filter((item) => openStatuses.has(item.status))
  const buckets = [...groupByProcess(activeItems).entries()]
    .map(([process, items]) => buildBucket(process, items, topItemLimit))
    .sort(
      (left, right) =>
        right.riskScore - left.riskScore ||
        compareLex(left.earliestDueAt, right.earliestDueAt) ||
        compareLex(left.process, right.process),
    )
    .map((bucket, index) => ({
      ...bucket,
      rank: index + 1,
    }))

  return {
    workloadVersion: PROCESS_WORKLOAD_VERSION,
    generatedAt,
    totalOpenItems: activeItems.length,
    totalEstimatedValueCents: sumEstimatedValue(activeItems),
    buckets,
  }
}

function groupByProcess(items: RankedQuoteQueueItem[]): Map<QuoteProcessKey, RankedQuoteQueueItem[]> {
  const groups = new Map<QuoteProcessKey, RankedQuoteQueueItem[]>()
  for (const item of items) {
    const group = groups.get(item.process)
    if (group) {
      group.push(item)
    } else {
      groups.set(item.process, [item])
    }
  }
  return groups
}

function buildBucket(
  process: QuoteProcessKey,
  items: RankedQuoteQueueItem[],
  topItemLimit: number,
): Omit<ProcessWorkloadBucket, "rank"> {
  if (items.length === 0) {
    throw new Error("process workload bucket requires at least one item")
  }

  const orderedByQueueRank = [...items].sort((left, right) => left.rank - right.rank || compareLex(left.id, right.id))
  const overdueItemCount = items.filter((item) => item.urgency === "overdue").length
  const dueTodayItemCount = items.filter((item) => item.urgency === "due_today").length
  const dueSoonItemCount = items.filter((item) => item.urgency === "due_soon").length
  const readyItemCount = items.filter((item) => item.status === "ready").length
  const rushItemCount = items.filter((item) => item.priority === "rush").length

  return {
    process,
    openItemCount: items.length,
    rushItemCount,
    overdueItemCount,
    dueTodayItemCount,
    dueSoonItemCount,
    readyItemCount,
    estimatedValueCents: sumEstimatedValue(items),
    earliestDueAt: [...items].map((item) => item.dueAt).sort(compareLex)[0],
    highestRiskQueueItemId: orderedByQueueRank[0].id,
    topQueueItemIds: orderedByQueueRank.slice(0, topItemLimit).map((item) => item.id),
    riskScore: calculateRiskScore(items),
    badges: buildBadges({
      dueSoonItemCount,
      dueTodayItemCount,
      openItemCount: items.length,
      overdueItemCount,
      readyItemCount,
      rushItemCount,
    }),
  }
}

function calculateRiskScore(items: RankedQuoteQueueItem[]): number {
  return items.reduce((total, item) => total + Math.max(0, item.score), 0) + items.length * 25
}

function buildBadges(input: {
  dueSoonItemCount: number
  dueTodayItemCount: number
  openItemCount: number
  overdueItemCount: number
  readyItemCount: number
  rushItemCount: number
}): ProcessWorkloadBadge[] {
  const badges: ProcessWorkloadBadge[] = []
  if (input.overdueItemCount > 0) {
    badges.push("overdue")
  }
  if (input.dueTodayItemCount > 0) {
    badges.push("due_today")
  }
  if (input.dueSoonItemCount > 0) {
    badges.push("due_soon")
  }
  if (input.rushItemCount > 0) {
    badges.push("rush")
  }
  if (input.readyItemCount > 0) {
    badges.push("ready_to_send")
  }
  if (input.openItemCount >= 4) {
    badges.push("high_load")
  }
  return badges
}

function sumEstimatedValue(items: RankedQuoteQueueItem[]): number {
  return items.reduce((total, item) => total + (item.estimatedValueCents ?? 0), 0)
}

function positiveInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
  return value
}
