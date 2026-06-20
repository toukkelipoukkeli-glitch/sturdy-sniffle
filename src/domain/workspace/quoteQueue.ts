import type { QuoteProcessKey } from "../quoting/registry"

export const QUOTE_QUEUE_VERSION = "quote-queue.v1"

export type QuoteQueuePriority = "normal" | "rush"
export type QuoteQueueStatus = "new" | "triage" | "estimating" | "ready" | "sent" | "won" | "lost"
export type QuoteQueueUrgency = "overdue" | "due_today" | "due_soon" | "normal"

export interface QuoteQueueItem {
  id: string
  customerName: string
  subject: string
  dueAt: string
  priority: QuoteQueuePriority
  process: QuoteProcessKey
  receivedAt: string
  status: QuoteQueueStatus
  estimatedValueCents?: number
}

export interface RankQuoteQueueOptions {
  now: string
}

export interface RankedQuoteQueueItem extends QuoteQueueItem {
  queueVersion: typeof QUOTE_QUEUE_VERSION
  rank: number
  score: number
  urgency: QuoteQueueUrgency
  daysUntilDue: number
  badges: string[]
}

export function rankQuoteQueue(items: QuoteQueueItem[], options: RankQuoteQueueOptions): RankedQuoteQueueItem[] {
  const now = normalizeIsoTimestamp(options.now, "now")
  const normalizedItems = items.map(normalizeQueueItem)

  return normalizedItems
    .map((item): Omit<RankedQuoteQueueItem, "rank"> => {
      const daysUntilDue = calculateDaysUntilDue(now, item.dueAt)
      const urgency = urgencyForDays(daysUntilDue)
      return {
        ...item,
        queueVersion: QUOTE_QUEUE_VERSION,
        score: scoreItem(item, urgency, daysUntilDue),
        urgency,
        daysUntilDue,
        badges: badgesForItem(item, urgency),
      }
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        compareLex(left.dueAt, right.dueAt) ||
        compareLex(left.receivedAt, right.receivedAt) ||
        compareLex(left.customerName, right.customerName) ||
        compareLex(left.id, right.id),
    )
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }))
}

function normalizeQueueItem(item: QuoteQueueItem): QuoteQueueItem {
  const estimatedValueCents = item.estimatedValueCents
  if (estimatedValueCents !== undefined && (!Number.isInteger(estimatedValueCents) || estimatedValueCents < 0)) {
    throw new Error("estimatedValueCents must be a non-negative integer")
  }

  return {
    id: nonBlank(item.id, "id"),
    customerName: nonBlank(item.customerName, "customerName"),
    subject: nonBlank(item.subject, "subject"),
    dueAt: normalizeIsoTimestamp(item.dueAt, "dueAt"),
    priority: item.priority,
    process: item.process,
    receivedAt: normalizeIsoTimestamp(item.receivedAt, "receivedAt"),
    status: item.status,
    estimatedValueCents,
  }
}

function calculateDaysUntilDue(now: string, dueAt: string): number {
  const nowDate = new Date(now)
  const dueDate = new Date(dueAt)
  const nowDay = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate())
  const dueDay = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate())
  return Math.round((dueDay - nowDay) / 86_400_000)
}

function urgencyForDays(daysUntilDue: number): QuoteQueueUrgency {
  if (daysUntilDue < 0) {
    return "overdue"
  }
  if (daysUntilDue === 0) {
    return "due_today"
  }
  if (daysUntilDue <= 3) {
    return "due_soon"
  }
  return "normal"
}

function scoreItem(item: QuoteQueueItem, urgency: QuoteQueueUrgency, daysUntilDue: number): number {
  const urgencyScore: Record<QuoteQueueUrgency, number> = {
    overdue: 1200,
    due_today: 820,
    due_soon: 620,
    normal: 220,
  }
  const statusScore: Record<QuoteQueueStatus, number> = {
    new: 90,
    triage: 75,
    estimating: 55,
    ready: 15,
    sent: -120,
    won: -220,
    lost: -220,
  }
  const priorityScore = item.priority === "rush" ? 180 : 0
  const valueScore = Math.min(90, Math.floor((item.estimatedValueCents ?? 0) / 100_000))
  const dueSoonTiebreaker = urgency === "due_today" || urgency === "due_soon" ? Math.max(0, 4 - daysUntilDue) * 5 : 0

  return urgencyScore[urgency] + statusScore[item.status] + priorityScore + valueScore + dueSoonTiebreaker
}

function badgesForItem(item: QuoteQueueItem, urgency: QuoteQueueUrgency): string[] {
  const badges: string[] = [urgency]
  if (item.priority === "rush") {
    badges.push("rush")
  }
  if (item.status === "new" || item.status === "triage") {
    badges.push("needs_triage")
  }
  if (item.status === "ready") {
    badges.push("ready_to_send")
  }
  return badges
}

function compareLex(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function normalizeIsoTimestamp(value: string, key: string): string {
  const trimmed = nonBlank(value, key)
  const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/
  if (!isoTimestampPattern.test(trimmed)) {
    throw new Error(`${key} must be a valid ISO timestamp`)
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${key} must be a valid ISO timestamp`)
  }
  return parsed.toISOString()
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
