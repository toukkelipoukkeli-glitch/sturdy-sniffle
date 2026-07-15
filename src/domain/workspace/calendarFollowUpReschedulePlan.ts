import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import type { CalendarFollowUpStatusTask } from "./calendarFollowUpStatus"

export type CalendarFollowUpRescheduleCommandMode = "blocked" | "review_required"
export type CalendarFollowUpRescheduleCommandStatus = "blocked" | "ready"
export type CalendarFollowUpReschedulePlanStatus = "blocked" | "empty" | "mixed" | "ready"

export interface CalendarFollowUpReschedulePlanInput {
  rfqId: string
  tasks: CalendarFollowUpStatusTask[]
}

export interface CalendarFollowUpRescheduleCommand {
  actionKey: string
  blockerLabels: string[]
  commandId: string
  detail: string
  mode: CalendarFollowUpRescheduleCommandMode
  nextOperatorMessage: string
  offerId: string
  previousDueAt: string
  provider: "calendar"
  rfqId: string
  status: CalendarFollowUpRescheduleCommandStatus
  suggestedDueAt?: string
  taskId: string
  title: string
}

export interface CalendarFollowUpReschedulePlanSummary {
  blockedCount: number
  commandCount: number
  readyCount: number
}

export interface CalendarFollowUpReschedulePlan {
  commands: CalendarFollowUpRescheduleCommand[]
  status: CalendarFollowUpReschedulePlanStatus
  summary: CalendarFollowUpReschedulePlanSummary
}

export function buildCalendarFollowUpReschedulePlan({
  rfqId,
  tasks,
}: CalendarFollowUpReschedulePlanInput): CalendarFollowUpReschedulePlan {
  const normalizedRfqId = nonBlank(rfqId, "rfqId")
  const commands = tasks
    .flatMap((task, index) => commandForTask(task, normalizedRfqId, index))
    .sort(compareCommands)
  const summary = summarize(commands)

  return {
    commands,
    status: planStatus(summary),
    summary,
  }
}

function commandForTask(
  task: CalendarFollowUpStatusTask,
  rfqId: string,
  index: number,
): CalendarFollowUpRescheduleCommand[] {
  const preview = task.reschedulePreview
  if (!preview) {
    return []
  }

  const taskId = nonBlank(task.id, `tasks[${index}].id`)
  const actionKey = nonBlank(task.key, `tasks[${index}].key`)
  const offerId = nonBlank(task.offerId, `tasks[${index}].offerId`)
  const previousDueAt = normalizeIsoTimestamp(task.dueAt, `tasks[${index}].dueAt`)
  const commandId = `calendar-reschedule:${stableIdToken(rfqId, "rfqId")}:${stableIdToken(taskId, `tasks[${index}].id`)}:${stableIdToken(actionKey, `tasks[${index}].key`)}`

  if (preview.tone === "blocked") {
    return [
      {
        actionKey,
        blockerLabels: ["Terminal customer reply"],
        commandId,
        detail: preview.detail,
        mode: "blocked",
        nextOperatorMessage: "Keep the existing hold closed; the customer has already reached a terminal offer state.",
        offerId,
        previousDueAt,
        provider: "calendar",
        rfqId,
        status: "blocked",
        taskId,
        title: preview.label,
      },
    ]
  }

  if (!preview.suggestedDueAt) {
    return [
      {
        actionKey,
        blockerLabels: ["Missing suggested due date"],
        commandId,
        detail: preview.detail,
        mode: "blocked",
        nextOperatorMessage: "Review the overdue hold and choose a replacement due date before connector execution.",
        offerId,
        previousDueAt,
        provider: "calendar",
        rfqId,
        status: "blocked",
        taskId,
        title: "Reschedule blocked",
      },
    ]
  }

  const suggestedDueAt = normalizeIsoTimestamp(preview.suggestedDueAt, `tasks[${index}].reschedulePreview.suggestedDueAt`)
  return [
    {
      actionKey,
      blockerLabels: [],
      commandId,
      detail: preview.detail,
      mode: "review_required",
      nextOperatorMessage: "Review the replacement hold before any calendar provider creates it.",
      offerId,
      previousDueAt,
      provider: "calendar",
      rfqId,
      status: "ready",
      suggestedDueAt,
      taskId,
      title: preview.label,
    },
  ]
}

function summarize(commands: CalendarFollowUpRescheduleCommand[]): CalendarFollowUpReschedulePlanSummary {
  return {
    blockedCount: commands.filter((command) => command.status === "blocked").length,
    commandCount: commands.length,
    readyCount: commands.filter((command) => command.status === "ready").length,
  }
}

function planStatus(summary: CalendarFollowUpReschedulePlanSummary): CalendarFollowUpReschedulePlanStatus {
  if (summary.commandCount === 0) {
    return "empty"
  }
  if (summary.readyCount > 0 && summary.blockedCount > 0) {
    return "mixed"
  }
  return summary.readyCount > 0 ? "ready" : "blocked"
}

function compareCommands(left: CalendarFollowUpRescheduleCommand, right: CalendarFollowUpRescheduleCommand): number {
  return (
    compareLex(left.previousDueAt, right.previousDueAt) ||
    compareLex(left.taskId, right.taskId) ||
    compareLex(left.actionKey, right.actionKey)
  )
}

function stableIdToken(value: string, key: string): string {
  const token = nonBlank(value, key)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  if (!token) {
    throw new Error(`${key} must contain at least one letter or number`)
  }
  return token
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
