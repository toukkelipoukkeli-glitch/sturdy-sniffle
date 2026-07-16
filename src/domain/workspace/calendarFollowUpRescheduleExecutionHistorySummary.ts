import { compareLex } from "../shared/deterministic"
import {
  CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION,
  type CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
  type CalendarFollowUpRescheduleExecutionRecord,
} from "./calendarFollowUpRescheduleExecutionPersistence"

export const CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_HISTORY_SUMMARY_VERSION =
  "calendar-follow-up-reschedule-execution-history-summary.v1"

export type CalendarFollowUpRescheduleExecutionHistorySummaryStatus =
  | "completed"
  | "empty"
  | "needs_attention"
  | "pending_provider"
  | "ready_for_review"

export type CalendarFollowUpRescheduleExecutionHistorySummarySeverity = "healthy" | "info" | "warning"

export interface CalendarFollowUpRescheduleExecutionHistoryActionItem {
  detail: string
  key: string
  label: string
  severity: CalendarFollowUpRescheduleExecutionHistorySummarySeverity
}

export interface CalendarFollowUpRescheduleExecutionHistorySummary {
  actionItems: CalendarFollowUpRescheduleExecutionHistoryActionItem[]
  commandCount: number
  latestRun?: CalendarFollowUpRescheduleExecutionRecord
  operatorSummary: string
  pendingActionCount: number
  recentRuns: CalendarFollowUpRescheduleExecutionRecord[]
  rfqIds: string[]
  severity: CalendarFollowUpRescheduleExecutionHistorySummarySeverity
  status: CalendarFollowUpRescheduleExecutionHistorySummaryStatus
  summaryVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_HISTORY_SUMMARY_VERSION
  taskIds: string[]
  totalRuns: number
  warningCount: number
}

export function summarizeCalendarFollowUpRescheduleExecutionHistory(
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
): CalendarFollowUpRescheduleExecutionHistorySummary {
  assertPersistenceVersion(snapshot)
  const recentRuns = snapshot.records.map(cloneRecord).sort(sortNewestFirst)
  const status = determineStatus(snapshot)

  return {
    actionItems: actionItemsForStatus(status, snapshot),
    commandCount: recentRuns.reduce((total, record) => total + record.commandCount, 0),
    latestRun: recentRuns[0],
    operatorSummary: operatorSummaryForStatus(status, snapshot),
    pendingActionCount: snapshot.pendingActionCount,
    recentRuns,
    rfqIds: [...snapshot.rfqIds],
    severity: severityForStatus(status),
    status,
    summaryVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_HISTORY_SUMMARY_VERSION,
    taskIds: [...snapshot.taskIds],
    totalRuns: snapshot.recordCount,
    warningCount: snapshot.warningCount,
  }
}

export function buildCalendarFollowUpRescheduleExecutionHistoryExportSummary(
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
): string {
  const summary = summarizeCalendarFollowUpRescheduleExecutionHistory(snapshot)
  const lines = [
    `Calendar reschedule execution history: ${summary.status}`,
    `Severity: ${summary.severity}`,
    `Runs: ${summary.totalRuns}; commands ${summary.commandCount}; pending actions ${summary.pendingActionCount}; warnings ${summary.warningCount}`,
    `RFQs: ${summary.rfqIds.length > 0 ? summary.rfqIds.join(", ") : "none"}`,
    `Tasks: ${summary.taskIds.length > 0 ? summary.taskIds.join(", ") : "none"}`,
    `Summary: ${summary.operatorSummary}`,
  ]

  if (summary.latestRun) {
    lines.push(
      `Latest execution: ${summary.latestRun.status} ${summary.latestRun.executedAt} ${summary.latestRun.executionFingerprint}`,
    )
  }
  if (summary.actionItems.length > 0) {
    lines.push("Next actions:")
    for (const action of summary.actionItems) {
      lines.push(`- ${action.severity} ${action.label}: ${action.detail}`)
    }
  }
  if (summary.recentRuns.length > 0) {
    lines.push("Recent executions:")
    for (const run of summary.recentRuns.slice(0, 5)) {
      lines.push(`- ${run.status} ${run.mode} ${run.executedAt} commands ${run.commandCount} ${run.executionFingerprint}`)
    }
  }

  return lines.join("\n")
}

function determineStatus(
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
): CalendarFollowUpRescheduleExecutionHistorySummaryStatus {
  const latest = snapshot.latestRun
  if (!latest) {
    return "empty"
  }
  switch (latest.status) {
    case "prepared":
      return "ready_for_review"
    case "pending":
      return "pending_provider"
    case "succeeded":
      return "completed"
    case "blocked":
    case "failed":
    case "partial":
      return "needs_attention"
  }
}

function severityForStatus(
  status: CalendarFollowUpRescheduleExecutionHistorySummaryStatus,
): CalendarFollowUpRescheduleExecutionHistorySummarySeverity {
  switch (status) {
    case "completed":
      return "healthy"
    case "empty":
    case "pending_provider":
    case "ready_for_review":
      return "info"
    case "needs_attention":
      return "warning"
  }
}

function operatorSummaryForStatus(
  status: CalendarFollowUpRescheduleExecutionHistorySummaryStatus,
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
): string {
  const latest = snapshot.latestRun
  if (!latest) {
    return "No calendar reschedule execution history has been recorded yet."
  }
  const runText = `${snapshot.recordCount} execution run${snapshot.recordCount === 1 ? "" : "s"}`
  switch (status) {
    case "completed":
      return `Calendar reschedule execution history has ${runText}; latest run completed ${latest.createdCommandCount} provider command(s).`
    case "needs_attention":
      return `Calendar reschedule execution history has ${runText}; latest run needs operator attention before retry or commit.`
    case "pending_provider":
      return `Calendar reschedule execution history has ${runText}; latest run is waiting for ${latest.pendingCommandCount} provider outcome(s).`
    case "ready_for_review":
      return `Calendar reschedule execution history has ${runText}; latest dry-run prepared ${latest.preparedCommandCount} command(s) for review.`
    case "empty":
      return "No calendar reschedule execution history has been recorded yet."
  }
}

function actionItemsForStatus(
  status: CalendarFollowUpRescheduleExecutionHistorySummaryStatus,
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
): CalendarFollowUpRescheduleExecutionHistoryActionItem[] {
  switch (status) {
    case "completed":
      return [
        {
          detail: "Keep the successful execution fingerprint with the customer follow-up timeline.",
          key: "retain-successful-calendar-execution",
          label: "Retain successful audit",
          severity: "healthy",
        },
      ]
    case "empty":
      return [
        {
          detail: "Create a reviewed dry-run execution after a calendar reschedule plan is ready.",
          key: "prepare-calendar-reschedule-dry-run",
          label: "Prepare dry-run",
          severity: "info",
        },
      ]
    case "needs_attention":
      return [
        {
          detail: "Review blocked, failed, or partial calendar commands before creating replacement holds.",
          key: "review-calendar-reschedule-blockers",
          label: "Review execution blockers",
          severity: "warning",
        },
        {
          detail: "Keep local execution history visible until retry/provider outcome records are reconciled.",
          key: "retain-calendar-reschedule-history",
          label: "Retain execution history",
          severity: "info",
        },
      ]
    case "pending_provider":
      return [
        {
          detail: `Record provider outcomes for ${snapshot.latestRun?.pendingCommandCount ?? 0} pending calendar command(s).`,
          key: "record-calendar-provider-outcomes",
          label: "Record provider outcomes",
          severity: "info",
        },
      ]
    case "ready_for_review":
      return [
        {
          detail: "Review the dry-run execution before enabling calendar provider side effects.",
          key: "review-calendar-reschedule-dry-run",
          label: "Review dry-run",
          severity: "info",
        },
        {
          detail: "Keep live calendar writes disabled until the operator approves the prepared commands.",
          key: "keep-calendar-writes-disabled",
          label: "Keep writes disabled",
          severity: "info",
        },
      ]
  }
}

function assertPersistenceVersion(snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot): void {
  if (snapshot.persistenceVersion !== CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("calendar reschedule execution persistence version is not supported")
  }
}

function cloneRecord(
  record: CalendarFollowUpRescheduleExecutionRecord,
): CalendarFollowUpRescheduleExecutionRecord {
  return {
    ...record,
    rfqIds: [...record.rfqIds],
    taskIds: [...record.taskIds],
  }
}

function sortNewestFirst(
  left: CalendarFollowUpRescheduleExecutionRecord,
  right: CalendarFollowUpRescheduleExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode)
  )
}
