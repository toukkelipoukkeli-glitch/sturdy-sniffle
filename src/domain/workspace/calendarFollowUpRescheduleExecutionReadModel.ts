import type { CalendarFollowUpRescheduleExecutionStatus } from "./calendarFollowUpRescheduleExecution"
import type { CalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import type { CalendarFollowUpReschedulePlanStatus } from "./calendarFollowUpReschedulePlan"
import type { CalendarFollowUpRescheduleExecutionPersistenceSnapshot } from "./calendarFollowUpRescheduleExecutionPersistence"

export type CalendarFollowUpRescheduleExecutionReadModelStatus =
  | CalendarFollowUpRescheduleExecutionStatus
  | "empty"
  | "stale"

export interface CalendarFollowUpRescheduleExecutionReadModelInput {
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot
}

export interface CalendarFollowUpRescheduleExecutionReadModel {
  blockedCommandCount: number
  commandCount: number
  createdCommandCount: number
  detail: string
  executionFingerprint?: string
  failedCommandCount: number
  latestExecutedAt?: string
  mode?: CalendarFollowUpRescheduleExecutionRun["mode"]
  nextActions: string[]
  pendingActionCount: number
  pendingCommandCount: number
  planStatus?: CalendarFollowUpReschedulePlanStatus
  preparedCommandCount: number
  recordCount: number
  rfqIds: string[]
  status: CalendarFollowUpRescheduleExecutionReadModelStatus
  taskIds: string[]
  title: string
  warningCount: number
}

export function buildCalendarFollowUpRescheduleExecutionReadModel({
  snapshot,
}: CalendarFollowUpRescheduleExecutionReadModelInput): CalendarFollowUpRescheduleExecutionReadModel {
  const latestRun = snapshot.latestRun
  const status = readModelStatus(snapshot)

  return {
    blockedCommandCount: latestRun?.blockedCommandCount ?? 0,
    commandCount: latestRun?.commandCount ?? 0,
    createdCommandCount: latestRun?.createdCommandCount ?? 0,
    detail: detailForStatus(status, snapshot),
    ...(latestRun ? { executionFingerprint: latestRun.executionFingerprint } : {}),
    failedCommandCount: latestRun?.failedCommandCount ?? 0,
    ...(latestRun ? { latestExecutedAt: latestRun.executedAt } : {}),
    ...(latestRun ? { mode: latestRun.mode } : {}),
    nextActions: nextActionsForStatus(status, snapshot),
    pendingActionCount: latestRun?.pendingActionCount ?? snapshot.pendingActionCount,
    pendingCommandCount: latestRun?.pendingCommandCount ?? 0,
    ...(latestRun ? { planStatus: latestRun.planStatus } : {}),
    preparedCommandCount: latestRun?.preparedCommandCount ?? 0,
    recordCount: snapshot.recordCount,
    rfqIds: [...snapshot.rfqIds],
    status,
    taskIds: [...snapshot.taskIds],
    title: titleForStatus(status),
    warningCount: latestRun?.warningCount ?? snapshot.warningCount,
  }
}

function readModelStatus(
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
): CalendarFollowUpRescheduleExecutionReadModelStatus {
  if (snapshot.recordCount === 0) {
    return "empty"
  }
  return snapshot.latestRun?.status ?? "stale"
}

function titleForStatus(status: CalendarFollowUpRescheduleExecutionReadModelStatus): string {
  switch (status) {
    case "blocked":
      return "Reschedule execution blocked"
    case "empty":
      return "No reschedule execution"
    case "failed":
      return "Reschedule execution failed"
    case "partial":
      return "Reschedule execution partial"
    case "pending":
      return "Reschedule execution pending"
    case "prepared":
      return "Reschedule execution prepared"
    case "stale":
      return "Reschedule execution history needs refresh"
    case "succeeded":
      return "Reschedule execution succeeded"
  }
}

function detailForStatus(
  status: CalendarFollowUpRescheduleExecutionReadModelStatus,
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
): string {
  const latestRun = snapshot.latestRun
  switch (status) {
    case "blocked":
      return `${latestRun?.blockedCommandCount ?? 0} calendar reschedule command(s) are blocked before provider execution.`
    case "empty":
      return "No calendar follow-up reschedule execution audit records have been recorded."
    case "failed":
      return `${latestRun?.failedCommandCount ?? 0} calendar reschedule command(s) failed during provider execution.`
    case "partial":
      return `${latestRun?.createdCommandCount ?? 0} command(s) completed while ${remainingCommandCount(latestRun)} still need operator attention.`
    case "pending":
      return `${latestRun?.pendingCommandCount ?? 0} calendar reschedule command(s) are waiting for provider outcomes.`
    case "prepared":
      return `${latestRun?.preparedCommandCount ?? 0} calendar reschedule command(s) are prepared in dry-run mode.`
    case "stale":
      return "Execution history exists, but no latest execution record is selected."
    case "succeeded":
      return `${latestRun?.createdCommandCount ?? 0} calendar reschedule command(s) completed successfully.`
  }
}

function nextActionsForStatus(
  status: CalendarFollowUpRescheduleExecutionReadModelStatus,
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
): string[] {
  const latestRun = snapshot.latestRun
  switch (status) {
    case "blocked":
      return [
        "Resolve blocked reschedule commands before any calendar provider side effects.",
        "Keep the execution audit as review evidence for the blocked plan.",
      ]
    case "empty":
      return ["Run a reviewed dry-run execution after a reschedule plan is approved."]
    case "failed":
      return [
        "Review failed provider outcomes before retrying calendar reschedule execution.",
        "Keep the failed audit fingerprint linked to the retry decision.",
      ]
    case "partial":
      return [
        "Review blocked, failed, or pending commands before retrying the remaining calendar work.",
        "Do not recreate already completed replacement holds without checking provider IDs.",
      ]
    case "pending":
      return [`Record provider outcomes for ${latestRun?.pendingCommandCount ?? 0} calendar reschedule command(s).`]
    case "prepared":
      return [
        "Review the dry-run execution audit before committing provider calendar changes.",
        "Keep live calendar writes disabled until the operator approves the prepared commands.",
      ]
    case "stale":
      return [`Rebuild the latest reschedule execution summary from ${snapshot.recordCount} stored record(s).`]
    case "succeeded":
      return ["Keep the execution fingerprint with the customer follow-up timeline for audit review."]
  }
}

function remainingCommandCount(
  latestRun: CalendarFollowUpRescheduleExecutionPersistenceSnapshot["latestRun"],
): number {
  if (!latestRun) {
    return 0
  }
  return latestRun.blockedCommandCount + latestRun.failedCommandCount + latestRun.pendingCommandCount
}
