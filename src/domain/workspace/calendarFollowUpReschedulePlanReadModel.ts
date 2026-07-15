import type { CalendarFollowUpReschedulePlanStatus } from "./calendarFollowUpReschedulePlan"
import type { CalendarFollowUpReschedulePlanHistorySummary } from "./calendarFollowUpReschedulePlanPersistence"

export type CalendarFollowUpReschedulePlanReadModelStatus =
  | "blocked"
  | "empty"
  | "mixed"
  | "ready"
  | "stale"

export interface CalendarFollowUpReschedulePlanReadModelInput {
  summary: CalendarFollowUpReschedulePlanHistorySummary
}

export interface CalendarFollowUpReschedulePlanReadModel {
  blockedCommandCount: number
  commandCount: number
  currentPlanStatus?: CalendarFollowUpReschedulePlanStatus
  currentRecordKey?: string
  detail: string
  latestRecordedAt?: string
  nextActions: string[]
  readyCommandCount: number
  recordCount: number
  status: CalendarFollowUpReschedulePlanReadModelStatus
  title: string
}

export function buildCalendarFollowUpReschedulePlanReadModel({
  summary,
}: CalendarFollowUpReschedulePlanReadModelInput): CalendarFollowUpReschedulePlanReadModel {
  const currentPlanStatus = summary.currentRecord?.plan.status
  const status = readModelStatus(summary, currentPlanStatus)

  return {
    blockedCommandCount: summary.blockedCommandCount,
    commandCount: summary.commandCount,
    ...(currentPlanStatus ? { currentPlanStatus } : {}),
    ...(summary.currentRecord ? { currentRecordKey: summary.currentRecord.recordKey } : {}),
    detail: detailForStatus(status, summary),
    ...(summary.latestRecordedAt ? { latestRecordedAt: summary.latestRecordedAt } : {}),
    nextActions: nextActionsForStatus(status, summary),
    readyCommandCount: summary.readyCommandCount,
    recordCount: summary.recordCount,
    status,
    title: titleForStatus(status),
  }
}

function readModelStatus(
  summary: CalendarFollowUpReschedulePlanHistorySummary,
  currentPlanStatus: CalendarFollowUpReschedulePlanStatus | undefined,
): CalendarFollowUpReschedulePlanReadModelStatus {
  if (summary.recordCount === 0) {
    return "empty"
  }
  if (!currentPlanStatus) {
    return "stale"
  }
  return currentPlanStatus
}

function titleForStatus(status: CalendarFollowUpReschedulePlanReadModelStatus): string {
  switch (status) {
    case "blocked":
      return "Reschedule blocked"
    case "empty":
      return "No reschedule plan"
    case "mixed":
      return "Reschedule review mixed"
    case "ready":
      return "Reschedule ready"
    case "stale":
      return "Reschedule history needs refresh"
  }
}

function detailForStatus(
  status: CalendarFollowUpReschedulePlanReadModelStatus,
  summary: CalendarFollowUpReschedulePlanHistorySummary,
): string {
  switch (status) {
    case "blocked":
      return `${summary.blockedCommandCount} reschedule command(s) are blocked before calendar provider execution.`
    case "empty":
      return "No reviewed calendar follow-up reschedule commands have been recorded for this RFQ."
    case "mixed":
      return `${summary.readyCommandCount} ready and ${summary.blockedCommandCount} blocked reschedule command(s) need operator review.`
    case "ready":
      return `${summary.readyCommandCount} reviewed reschedule command(s) are ready for operator approval before provider execution.`
    case "stale":
      return "Reschedule plan history exists, but no current plan record is selected for this RFQ."
  }
}

function nextActionsForStatus(
  status: CalendarFollowUpReschedulePlanReadModelStatus,
  summary: CalendarFollowUpReschedulePlanHistorySummary,
): string[] {
  switch (status) {
    case "blocked":
      return [
        "Review the blocker labels before creating any replacement calendar hold.",
        "Keep live calendar execution disabled until a provider adapter can reject the same blockers.",
      ]
    case "empty":
      return ["Create or review an overdue follow-up status before planning a replacement calendar hold."]
    case "mixed":
      return [
        "Resolve blocked commands before provider execution.",
        "Review ready commands individually before creating replacement calendar holds.",
      ]
    case "ready":
      return [
        "Review the replacement due dates with the operator.",
        "Keep the local persistence snapshot until the calendar provider execution adapter is configured.",
      ]
    case "stale":
      return [
        `Rebuild the current reschedule plan from the latest follow-up status history (${summary.recordCount} stored record(s)).`,
      ]
  }
}
