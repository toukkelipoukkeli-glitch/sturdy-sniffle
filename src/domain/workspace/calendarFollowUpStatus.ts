import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import type { WorkspaceActionRecord } from "./workspaceActions"

export type CalendarFollowUpStatusFilter = "all" | "open" | "completed" | "review"
export type CalendarFollowUpTaskStatus = "cancelled" | "completed" | "open" | "review"

export interface CalendarFollowUpStatusInput {
  actions: WorkspaceActionRecord[]
  filter?: CalendarFollowUpStatusFilter
  now: string
  offerId: string
  replySync?: GmailOfferReplySyncResult
  rfqId: string
}

export interface CalendarFollowUpStatusTask {
  completedAt?: string
  detail: string
  dueAt: string
  id: string
  key: string
  offerId: string
  reschedulePreview?: CalendarFollowUpReschedulePreview
  scheduledAt: string
  status: CalendarFollowUpTaskStatus
}

export interface CalendarFollowUpReschedulePreview {
  detail: string
  label: string
  suggestedDueAt?: string
  tone: "blocked" | "ready"
}

export interface CalendarFollowUpStatusSummary {
  cancelledCount: number
  completedCount: number
  openCount: number
  rescheduleBlockedCount: number
  rescheduleReadyCount: number
  reviewCount: number
  taskCount: number
  warningCount: number
}

export interface CalendarFollowUpStatus {
  filter: CalendarFollowUpStatusFilter
  summary: CalendarFollowUpStatusSummary
  tasks: CalendarFollowUpStatusTask[]
  warnings: string[]
}

export function buildCalendarFollowUpStatus(input: CalendarFollowUpStatusInput): CalendarFollowUpStatus {
  const filter = input.filter ?? "all"
  const now = normalizeIsoTimestamp(input.now, "now")
  const offerId = nonBlank(input.offerId, "offerId")
  const rfqId = nonBlank(input.rfqId, "rfqId")
  const completedByTaskId = completedFollowUps(input.replySync)
  const hasTerminalReply = hasTerminalOfferReply(input.replySync)
  const warnings = input.replySync?.warnings ?? []
  const tasks = input.actions
    .filter((action) => action.kind === "follow_up_created" && action.rfqId === rfqId && action.offerId === offerId)
    .map((action) => taskFromAction({ action, completedByTaskId, hasTerminalReply, now, rfqId }))
    .sort(compareTasks)

  return {
    filter,
    summary: summarize(tasks, warnings),
    tasks: filterTasks(tasks, filter),
    warnings,
  }
}

function taskFromAction(input: {
  action: WorkspaceActionRecord
  completedByTaskId: Map<string, string>
  hasTerminalReply: boolean
  now: string
  rfqId: string
}): CalendarFollowUpStatusTask {
  const taskId = followUpTaskIdFor(input.action, input.rfqId)
  const dueAt = normalizeIsoTimestamp(input.action.followUpDueAt ?? "", "action.followUpDueAt")
  const completedAt = input.completedByTaskId.get(taskId)
  const status = completedAt
    ? "completed"
    : input.hasTerminalReply
      ? "cancelled"
      : dueAt < input.now
        ? "review"
        : "open"
  const reschedulePreview = reschedulePreviewForStatus(status, input.now)

  return {
    ...(completedAt ? { completedAt } : {}),
    detail: followUpDetail(status, dueAt, completedAt),
    dueAt,
    id: taskId,
    key: input.action.key,
    offerId: input.action.offerId ?? "",
    ...(reschedulePreview ? { reschedulePreview } : {}),
    scheduledAt: input.action.occurredAt,
    status,
  }
}

function followUpTaskIdFor(action: WorkspaceActionRecord, rfqId: string): string {
  return optionalTrim(action.followUpTaskId) ?? optionalTrim(action.note) ?? `follow-up-${rfqId}`
}

function completedFollowUps(replySync: GmailOfferReplySyncResult | undefined): Map<string, string> {
  const completed = new Map<string, string>()
  for (const record of replySync?.records ?? []) {
    const event = record.parsed.event
    if (record.parsed.matched && event?.kind === "follow_up_completed" && event.followUpTaskId) {
      completed.set(event.followUpTaskId, normalizeIsoTimestamp(event.occurredAt, "reply.event.occurredAt"))
    }
  }
  return completed
}

function hasTerminalOfferReply(replySync: GmailOfferReplySyncResult | undefined): boolean {
  return (replySync?.records ?? []).some((record) => {
    const kind = record.parsed.event?.kind
    return record.parsed.matched && (kind === "accepted" || kind === "declined")
  })
}

function summarize(
  tasks: CalendarFollowUpStatusTask[],
  warnings: string[],
): CalendarFollowUpStatusSummary {
  return {
    cancelledCount: tasks.filter((task) => task.status === "cancelled").length,
    completedCount: tasks.filter((task) => task.status === "completed").length,
    openCount: tasks.filter((task) => task.status === "open").length,
    rescheduleBlockedCount: tasks.filter((task) => task.reschedulePreview?.tone === "blocked").length,
    rescheduleReadyCount: tasks.filter((task) => task.reschedulePreview?.tone === "ready").length,
    reviewCount: tasks.filter((task) => task.status === "review").length,
    taskCount: tasks.length,
    warningCount: warnings.length,
  }
}

function filterTasks(
  tasks: CalendarFollowUpStatusTask[],
  filter: CalendarFollowUpStatusFilter,
): CalendarFollowUpStatusTask[] {
  if (filter === "all") {
    return tasks
  }
  if (filter === "review") {
    return tasks.filter((task) => task.status === "review" || task.status === "cancelled")
  }
  return tasks.filter((task) => task.status === filter)
}

function compareTasks(left: CalendarFollowUpStatusTask, right: CalendarFollowUpStatusTask): number {
  return compareLex(left.dueAt, right.dueAt) || compareLex(left.key, right.key)
}

function followUpDetail(status: CalendarFollowUpTaskStatus, dueAt: string, completedAt: string | undefined): string {
  switch (status) {
    case "cancelled":
      return `Cancelled after terminal customer reply; was due ${dueAt}.`
    case "completed":
      return `Completed at ${completedAt}.`
    case "open":
      return `Calendar hold due ${dueAt}.`
    case "review":
      return `Due ${dueAt}; needs operator review.`
  }
}

function reschedulePreviewForStatus(
  status: CalendarFollowUpTaskStatus,
  now: string,
): CalendarFollowUpReschedulePreview | undefined {
  if (status === "cancelled") {
    return {
      detail: "Terminal customer reply recorded; do not reschedule this calendar hold.",
      label: "Reschedule blocked",
      tone: "blocked",
    }
  }
  if (status !== "review") {
    return undefined
  }

  return {
    detail: "Previous follow-up hold is overdue; create a reviewed replacement hold before contacting the customer.",
    label: "Reschedule ready",
    suggestedDueAt: addUtcDays(now, 2),
    tone: "ready",
  }
}

function addUtcDays(isoTimestamp: string, days: number): string {
  const date = new Date(isoTimestamp)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
