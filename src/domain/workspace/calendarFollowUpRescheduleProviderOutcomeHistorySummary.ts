import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type { CalendarFollowUpRescheduleCommandOutcomeInput } from "./calendarFollowUpRescheduleExecution"
import {
  CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
  type CalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
  type CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot,
} from "./calendarFollowUpRescheduleProviderOutcomePersistence"
import type { CalendarFollowUpRescheduleProviderOutcomeReadModelStatus } from "./calendarFollowUpRescheduleProviderOutcomeReadModel"
import type { CalendarFollowUpReschedulePlanStatus } from "./calendarFollowUpReschedulePlan"

export const CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_HISTORY_SUMMARY_VERSION =
  "calendar-follow-up-reschedule-provider-outcome-history-summary.v1"

export type CalendarFollowUpRescheduleProviderOutcomeHistorySummaryStatus =
  | "blocked"
  | "empty"
  | "needs_review"
  | "partial"
  | "ready"

export type CalendarFollowUpRescheduleProviderOutcomeHistorySummarySeverity =
  | "critical"
  | "healthy"
  | "neutral"
  | "warning"

export interface CalendarFollowUpRescheduleProviderOutcomeHistorySummary {
  commandOutcomeCount: number
  commandSummaries: CalendarFollowUpRescheduleProviderOutcomeCommandSummary[]
  createdOutcomeCount: number
  detail: string
  expectedOutcomeCount: number
  exportText: string
  failedOutcomeCount: number
  historyVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_HISTORY_SUMMARY_VERSION
  latestOutcomeBatch?: CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary
  missingOutcomeCount: number
  nextActions: string[]
  outcomeStatusCounts: Partial<Record<CalendarFollowUpRescheduleCommandOutcomeInput["status"], number>>
  planStatusCounts: Partial<Record<CalendarFollowUpReschedulePlanStatus, number>>
  readModelStatusCounts: Partial<Record<CalendarFollowUpRescheduleProviderOutcomeReadModelStatus, number>>
  recentOutcomeBatches: CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary[]
  rfqIds: string[]
  severity: CalendarFollowUpRescheduleProviderOutcomeHistorySummarySeverity
  status: CalendarFollowUpRescheduleProviderOutcomeHistorySummaryStatus
  taskIds: string[]
  title: string
  totalOutcomeBatches: number
  unexpectedOutcomeCount: number
  warningCount: number
}

export interface CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary {
  blockedCommandCount: number
  commandOutcomeCount: number
  createdOutcomeCount: number
  expectedOutcomeCount: number
  failedCommandIds: string[]
  failedOutcomeCount: number
  missingOutcomeCount: number
  outcomeFingerprint: string
  planStatus: CalendarFollowUpReschedulePlanStatus
  readModelStatus: CalendarFollowUpRescheduleProviderOutcomeReadModelStatus
  recordedAt: string
  recordedBy: string
  rfqId: string
  taskIds: string[]
  unexpectedOutcomeCount: number
  warningCount: number
}

export interface CalendarFollowUpRescheduleProviderOutcomeCommandSummary {
  commandId: string
  latestRecordedAt: string
  outcomeCount: number
  statuses: CalendarFollowUpRescheduleCommandOutcomeInput["status"][]
  warningCount: number
}

export function summarizeCalendarFollowUpRescheduleProviderOutcomeHistory(
  snapshot: Pick<CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot, "persistenceVersion" | "records">,
): CalendarFollowUpRescheduleProviderOutcomeHistorySummary {
  assertPersistenceVersion(snapshot.persistenceVersion)
  const records = snapshot.records.map(normalizeRecordSummary).sort(sortNewestFirst)
  const latestOutcomeBatch = records[0] ? toPublicRecordSummary(records[0]) : undefined
  const status = determineStatus(latestOutcomeBatch)
  const baseSummary: Omit<CalendarFollowUpRescheduleProviderOutcomeHistorySummary, "exportText"> = {
    commandOutcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    commandSummaries: summarizeCommands(records),
    createdOutcomeCount: records.reduce((total, record) => total + record.createdOutcomeCount, 0),
    detail: detailForStatus(status, latestOutcomeBatch),
    expectedOutcomeCount: records.reduce((total, record) => total + record.expectedOutcomeCount, 0),
    failedOutcomeCount: records.reduce((total, record) => total + record.failedOutcomeCount, 0),
    historyVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_HISTORY_SUMMARY_VERSION,
    ...(latestOutcomeBatch ? { latestOutcomeBatch } : {}),
    missingOutcomeCount: records.reduce((total, record) => total + record.missingOutcomeCount, 0),
    nextActions: nextActionsForStatus(status, latestOutcomeBatch),
    outcomeStatusCounts: countOutcomeStatuses(records),
    planStatusCounts: countPlanStatuses(records),
    readModelStatusCounts: countReadModelStatuses(records),
    recentOutcomeBatches: records.map(toPublicRecordSummary),
    rfqIds: uniqueSorted(records.map((record) => record.rfqId)),
    severity: severityForStatus(status),
    status,
    taskIds: uniqueSorted(records.flatMap((record) => record.taskIds)),
    title: titleForStatus(status, latestOutcomeBatch),
    totalOutcomeBatches: records.length,
    unexpectedOutcomeCount: records.reduce((total, record) => total + record.unexpectedOutcomeCount, 0),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }

  return {
    ...baseSummary,
    commandSummaries: baseSummary.commandSummaries.map(toPublicCommandSummary),
    exportText: buildExportText(baseSummary),
    nextActions: [...baseSummary.nextActions],
    recentOutcomeBatches: baseSummary.recentOutcomeBatches.map(cloneRecordSummary),
    rfqIds: [...baseSummary.rfqIds],
    taskIds: [...baseSummary.taskIds],
  }
}

export function buildCalendarFollowUpRescheduleProviderOutcomeHistoryExportSummary(
  snapshot: Pick<CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot, "persistenceVersion" | "records">,
): string {
  return summarizeCalendarFollowUpRescheduleProviderOutcomeHistory(snapshot).exportText
}

function normalizeRecordSummary(
  record: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
): NormalizedRecordSummary {
  assertPersistenceVersion(record.persistenceVersion)
  const commandOutcomes = record.commandOutcomes.map(normalizeCommandOutcome).sort(sortOutcomes)
  const commandOutcomeCount = normalizeCount(record.commandOutcomeCount, "record.commandOutcomeCount")
  const createdOutcomeCount = normalizeCount(record.createdOutcomeCount, "record.createdOutcomeCount")
  const failedOutcomeCount = normalizeCount(record.failedOutcomeCount, "record.failedOutcomeCount")
  const readyCommandIds = readyPlanCommandIds(record)
  const matchedCommandOutcomes = commandOutcomes.filter((outcome) => readyCommandIds.has(outcome.commandId))
  const normalizedCreatedCount = matchedCommandOutcomes.filter((outcome) => outcome.status === "created").length
  const normalizedFailedCount = matchedCommandOutcomes.filter((outcome) => outcome.status === "failed").length

  if (commandOutcomeCount !== commandOutcomes.length) {
    throw new Error("record.commandOutcomeCount must match normalized provider outcome count")
  }
  if (createdOutcomeCount !== normalizedCreatedCount || failedOutcomeCount !== normalizedFailedCount) {
    throw new Error("record outcome counts must match normalized provider outcome statuses")
  }

  return {
    blockedCommandCount: normalizeCount(record.blockedCommandCount, "record.blockedCommandCount"),
    commandOutcomeCount,
    commandOutcomes,
    createdOutcomeCount,
    expectedOutcomeCount: normalizeCount(record.expectedOutcomeCount, "record.expectedOutcomeCount"),
    failedCommandIds: commandOutcomes
      .filter((outcome) => outcome.status === "failed")
      .map((outcome) => outcome.commandId),
    failedOutcomeCount,
    missingOutcomeCount: normalizeCount(record.missingOutcomeCount, "record.missingOutcomeCount"),
    outcomeFingerprint: nonBlank(record.outcomeFingerprint, "record.outcomeFingerprint"),
    planStatus: normalizePlanStatus(record.planStatus, "record.planStatus"),
    readModelStatus: normalizeReadModelStatus(record.readModelStatus, "record.readModelStatus"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "record.recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "record.recordedBy"),
    rfqId: nonBlank(record.rfqId, "record.rfqId"),
    taskIds: uniqueSorted(record.taskIds.map((taskId, index) => nonBlank(taskId, `record.taskIds[${index}]`))),
    unexpectedOutcomeCount: normalizeCount(record.unexpectedOutcomeCount, "record.unexpectedOutcomeCount"),
    warningCount: normalizeCount(record.warningCount, "record.warningCount"),
  }
}

function normalizeCommandOutcome(
  outcome: CalendarFollowUpRescheduleCommandOutcomeInput,
): NormalizedCommandOutcome {
  return {
    commandId: nonBlank(outcome.commandId, "record.commandOutcomes.commandId"),
    status: normalizeOutcomeStatus(outcome.status),
    warningCount: [...new Set((outcome.warnings ?? []).map((warning) => warning.trim()).filter(Boolean))].length,
  }
}

function readyPlanCommandIds(record: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord): Set<string> {
  if (!Array.isArray(record.plan?.commands)) {
    throw new Error("record.plan.commands must be an array")
  }
  return new Set(
    record.plan.commands
      .filter((command) => command.status === "ready")
      .map((command, index) => nonBlank(command.commandId, `record.plan.commands[${index}].commandId`)),
  )
}

function determineStatus(
  latestOutcomeBatch: CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary | undefined,
): CalendarFollowUpRescheduleProviderOutcomeHistorySummaryStatus {
  if (!latestOutcomeBatch) {
    return "empty"
  }
  switch (latestOutcomeBatch.readModelStatus) {
    case "blocked":
    case "empty":
    case "needs_review":
    case "partial":
    case "ready":
      return latestOutcomeBatch.readModelStatus
  }
}

function severityForStatus(
  status: CalendarFollowUpRescheduleProviderOutcomeHistorySummaryStatus,
): CalendarFollowUpRescheduleProviderOutcomeHistorySummarySeverity {
  switch (status) {
    case "blocked":
    case "needs_review":
      return "critical"
    case "empty":
      return "neutral"
    case "partial":
      return "warning"
    case "ready":
      return "healthy"
  }
}

function titleForStatus(
  status: CalendarFollowUpRescheduleProviderOutcomeHistorySummaryStatus,
  latest: CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary | undefined,
): string {
  switch (status) {
    case "blocked":
      return "Calendar provider outcome history blocked"
    case "empty":
      return latest ? "Calendar provider outcome history empty" : "No calendar provider outcome history"
    case "needs_review":
      return "Calendar provider outcome history needs review"
    case "partial":
      return "Calendar provider outcome history partial"
    case "ready":
      return "Calendar provider outcome history ready"
  }
}

function detailForStatus(
  status: CalendarFollowUpRescheduleProviderOutcomeHistorySummaryStatus,
  latest: CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary | undefined,
): string {
  if (!latest) {
    return "No calendar provider outcome batches have been recorded yet."
  }
  switch (status) {
    case "blocked":
      return `Latest provider outcome batch for ${latest.rfqId} is blocked by ${latest.blockedCommandCount} reschedule command(s).`
    case "empty":
      return `Latest provider outcome batch for ${latest.rfqId} has no expected provider outcomes.`
    case "needs_review":
      return `Latest provider outcome batch for ${latest.rfqId} has ${latest.failedOutcomeCount + latest.missingOutcomeCount + latest.unexpectedOutcomeCount} failed, missing, or unexpected outcome(s).`
    case "partial":
      return `Latest provider outcome batch for ${latest.rfqId} created ${latest.createdOutcomeCount} of ${latest.expectedOutcomeCount} expected outcome(s) and still needs review.`
    case "ready":
      return `Latest provider outcome batch for ${latest.rfqId} created ${latest.createdOutcomeCount} of ${latest.expectedOutcomeCount} expected outcome(s) for the execution audit.`
  }
}

function nextActionsForStatus(
  status: CalendarFollowUpRescheduleProviderOutcomeHistorySummaryStatus,
  latest: CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary | undefined,
): string[] {
  switch (status) {
    case "blocked":
      return ["Resolve blocked reschedule commands before recording calendar provider outcomes."]
    case "empty":
      return latest
        ? ["Create a reviewed calendar reschedule plan before recording provider outcomes."]
        : ["Record reviewed local calendar provider outcomes before commit execution."]
    case "needs_review":
      return ["Review failed, missing, or unexpected calendar provider outcomes before commit execution."]
    case "partial":
      return ["Resolve partial calendar provider outcomes before committing the reschedule execution."]
    case "ready":
      return ["Use the latest local provider outcomes when recording the calendar reschedule execution audit."]
  }
}

function countOutcomeStatuses(
  records: NormalizedRecordSummary[],
): Partial<Record<CalendarFollowUpRescheduleCommandOutcomeInput["status"], number>> {
  return records.reduce<Partial<Record<CalendarFollowUpRescheduleCommandOutcomeInput["status"], number>>>((counts, record) => {
    for (const outcome of record.commandOutcomes) {
      counts[outcome.status] = (counts[outcome.status] ?? 0) + 1
    }
    return counts
  }, {})
}

function countPlanStatuses(
  records: NormalizedRecordSummary[],
): Partial<Record<CalendarFollowUpReschedulePlanStatus, number>> {
  return records.reduce<Partial<Record<CalendarFollowUpReschedulePlanStatus, number>>>((counts, record) => {
    counts[record.planStatus] = (counts[record.planStatus] ?? 0) + 1
    return counts
  }, {})
}

function countReadModelStatuses(
  records: NormalizedRecordSummary[],
): Partial<Record<CalendarFollowUpRescheduleProviderOutcomeReadModelStatus, number>> {
  return records.reduce<Partial<Record<CalendarFollowUpRescheduleProviderOutcomeReadModelStatus, number>>>((counts, record) => {
    counts[record.readModelStatus] = (counts[record.readModelStatus] ?? 0) + 1
    return counts
  }, {})
}

function summarizeCommands(
  records: NormalizedRecordSummary[],
): CalendarFollowUpRescheduleProviderOutcomeCommandSummary[] {
  const byCommand = new Map<string, CommandSummaryAccumulator>()
  for (const record of records) {
    for (const outcome of record.commandOutcomes) {
      appendCommandSummary(byCommand, outcome, record.recordedAt)
    }
  }

  return [...byCommand.entries()]
    .map(([commandId, summary]) => ({
      commandId,
      latestRecordedAt: summary.latestRecordedAt,
      outcomeCount: summary.outcomeCount,
      statuses: [...summary.statuses].sort(compareLex),
      warningCount: summary.warningCount,
    }))
    .sort((left, right) => compareLex(right.latestRecordedAt, left.latestRecordedAt) || compareLex(left.commandId, right.commandId))
}

function appendCommandSummary(
  byCommand: Map<string, CommandSummaryAccumulator>,
  outcome: NormalizedCommandOutcome,
  recordedAt: string,
): void {
  const existing = byCommand.get(outcome.commandId)
  if (existing) {
    existing.latestRecordedAt =
      compareLex(recordedAt, existing.latestRecordedAt) > 0 ? recordedAt : existing.latestRecordedAt
    existing.outcomeCount += 1
    existing.statuses.add(outcome.status)
    existing.warningCount += outcome.warningCount
    return
  }

  byCommand.set(outcome.commandId, {
    latestRecordedAt: recordedAt,
    outcomeCount: 1,
    statuses: new Set([outcome.status]),
    warningCount: outcome.warningCount,
  })
}

function buildExportText(
  summary: Omit<CalendarFollowUpRescheduleProviderOutcomeHistorySummary, "exportText">,
): string {
  const lines = [
    `Calendar provider outcome history: ${summary.status}`,
    `Severity: ${summary.severity}`,
    `Batches: ${summary.totalOutcomeBatches}; outcomes ${summary.commandOutcomeCount}; expected ${summary.expectedOutcomeCount}; created ${summary.createdOutcomeCount}; failed ${summary.failedOutcomeCount}; missing ${summary.missingOutcomeCount}; unexpected ${summary.unexpectedOutcomeCount}; warnings ${summary.warningCount}`,
    `RFQs: ${summary.rfqIds.length > 0 ? summary.rfqIds.join(", ") : "none"}`,
    `Tasks: ${summary.taskIds.length > 0 ? summary.taskIds.join(", ") : "none"}`,
    `Summary: ${summary.detail}`,
  ]

  if (summary.latestOutcomeBatch) {
    lines.push(
      `Latest provider outcome batch: ${summary.latestOutcomeBatch.readModelStatus} ${summary.latestOutcomeBatch.recordedAt} ${summary.latestOutcomeBatch.outcomeFingerprint}`,
    )
  }
  if (summary.nextActions.length > 0) {
    lines.push("Next actions:")
    for (const action of summary.nextActions) {
      lines.push(`- ${action}`)
    }
  }
  if (summary.recentOutcomeBatches.length > 0) {
    lines.push("Recent provider outcome batches:")
    for (const batch of summary.recentOutcomeBatches.slice(0, 5)) {
      lines.push(
        `- ${batch.readModelStatus} ${batch.planStatus} ${batch.recordedAt} outcomes ${batch.commandOutcomeCount}/${batch.expectedOutcomeCount} ${batch.outcomeFingerprint}`,
      )
    }
  }
  if (summary.commandSummaries.length > 0) {
    lines.push("Command outcomes:")
    for (const command of summary.commandSummaries.slice(0, 8)) {
      lines.push(
        `- ${command.commandId} statuses ${command.statuses.join(", ")} latest ${command.latestRecordedAt} batches ${command.outcomeCount} warnings ${command.warningCount}`,
      )
    }
  }

  return lines.join("\n")
}

function toPublicRecordSummary(
  record: NormalizedRecordSummary,
): CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary {
  return cloneRecordSummary(record)
}

function cloneRecordSummary(
  record: CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary,
): CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary {
  return {
    ...record,
    failedCommandIds: [...record.failedCommandIds],
    taskIds: [...record.taskIds],
  }
}

function toPublicCommandSummary(
  command: CalendarFollowUpRescheduleProviderOutcomeCommandSummary,
): CalendarFollowUpRescheduleProviderOutcomeCommandSummary {
  return {
    ...command,
    statuses: [...command.statuses],
  }
}

function sortNewestFirst(
  left: NormalizedRecordSummary,
  right: NormalizedRecordSummary,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.outcomeFingerprint, right.outcomeFingerprint) ||
    compareLex(left.rfqId, right.rfqId) ||
    compareLex(left.recordedBy, right.recordedBy)
  )
}

function sortOutcomes(left: NormalizedCommandOutcome, right: NormalizedCommandOutcome): number {
  return compareLex(left.commandId, right.commandId) || compareLex(left.status, right.status)
}

function normalizeOutcomeStatus(
  status: CalendarFollowUpRescheduleCommandOutcomeInput["status"],
): CalendarFollowUpRescheduleCommandOutcomeInput["status"] {
  if (status !== "created" && status !== "failed") {
    throw new Error("calendar provider outcome history status must be created or failed")
  }
  return status
}

function normalizePlanStatus(status: CalendarFollowUpReschedulePlanStatus, key: string): CalendarFollowUpReschedulePlanStatus {
  if (status === "blocked" || status === "empty" || status === "mixed" || status === "ready") {
    return status
  }
  throw new Error(`${key} is invalid`)
}

function normalizeReadModelStatus(
  status: CalendarFollowUpRescheduleProviderOutcomeReadModelStatus,
  key: string,
): CalendarFollowUpRescheduleProviderOutcomeReadModelStatus {
  if (
    status === "blocked" ||
    status === "empty" ||
    status === "needs_review" ||
    status === "partial" ||
    status === "ready"
  ) {
    return status
  }
  throw new Error(`${key} is invalid`)
}

function normalizeCount(value: number, key: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer`)
  }
  return value
}

function assertPersistenceVersion(version: string): void {
  if (version !== CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION) {
    throw new Error("calendar reschedule provider outcome persistence version is not supported")
  }
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareLex)
}

interface NormalizedCommandOutcome {
  commandId: string
  status: CalendarFollowUpRescheduleCommandOutcomeInput["status"]
  warningCount: number
}

interface NormalizedRecordSummary extends CalendarFollowUpRescheduleProviderOutcomeHistoryRecordSummary {
  commandOutcomes: NormalizedCommandOutcome[]
}

interface CommandSummaryAccumulator {
  latestRecordedAt: string
  outcomeCount: number
  statuses: Set<CalendarFollowUpRescheduleCommandOutcomeInput["status"]>
  warningCount: number
}
