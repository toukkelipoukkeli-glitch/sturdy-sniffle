import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_VERSION,
  type CalendarFollowUpRescheduleCommandExecutionStatus,
  type CalendarFollowUpRescheduleExecutionRun,
  type CalendarFollowUpRescheduleExecutionStatus,
} from "./calendarFollowUpRescheduleExecution"
import type { CalendarFollowUpReschedulePlanStatus } from "./calendarFollowUpReschedulePlan"

export const CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION =
  "calendar-follow-up-reschedule-execution-persistence.v1"

export interface CalendarFollowUpRescheduleExecutionRecord {
  actor: string
  blockedCommandCount: number
  commandCount: number
  createdCommandCount: number
  executedAt: string
  executionFingerprint: string
  executionVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_VERSION
  failedCommandCount: number
  mode: CalendarFollowUpRescheduleExecutionRun["mode"]
  pendingActionCount: number
  pendingCommandCount: number
  persistenceVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION
  planStatus: CalendarFollowUpReschedulePlanStatus
  preparedCommandCount: number
  rfqIds: string[]
  status: CalendarFollowUpRescheduleExecutionStatus
  taskIds: string[]
  warningCount: number
}

export interface CalendarFollowUpRescheduleExecutionPersistenceSnapshot {
  latestRun?: CalendarFollowUpRescheduleExecutionRecord
  pendingActionCount: number
  persistenceVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION
  planStatusCounts: Partial<Record<CalendarFollowUpReschedulePlanStatus, number>>
  recordCount: number
  records: CalendarFollowUpRescheduleExecutionRecord[]
  rfqIds: string[]
  statusCounts: Partial<Record<CalendarFollowUpRescheduleExecutionStatus, number>>
  taskIds: string[]
  warningCount: number
}

export interface CalendarFollowUpRescheduleExecutionPersistenceAdapter {
  recordRun(
    run: CalendarFollowUpRescheduleExecutionRun,
  ): Promise<CalendarFollowUpRescheduleExecutionPersistenceSnapshot>
  snapshot(): CalendarFollowUpRescheduleExecutionPersistenceSnapshot
}

export interface LocalCalendarFollowUpRescheduleExecutionPersistenceOptions {
  initialSnapshot?: Partial<CalendarFollowUpRescheduleExecutionPersistenceSnapshot>
}

export function createLocalCalendarFollowUpRescheduleExecutionPersistence({
  initialSnapshot,
}: LocalCalendarFollowUpRescheduleExecutionPersistenceOptions = {}): CalendarFollowUpRescheduleExecutionPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordRun(run) {
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records,
          buildExecutionRecord(run),
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): CalendarFollowUpRescheduleExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(run: CalendarFollowUpRescheduleExecutionRun): CalendarFollowUpRescheduleExecutionRecord {
  const statusCounts = commandStatusCounts(run.commands.map((command) => command.status))
  return {
    actor: run.actor,
    blockedCommandCount: statusCounts.blocked ?? 0,
    commandCount: run.commands.length,
    createdCommandCount: statusCounts.created ?? 0,
    executedAt: run.executedAt,
    executionFingerprint: run.executionFingerprint,
    executionVersion: run.executionVersion,
    failedCommandCount: statusCounts.failed ?? 0,
    mode: run.mode,
    pendingActionCount: run.nextActions.length,
    pendingCommandCount: statusCounts.pending ?? 0,
    persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION,
    planStatus: run.planStatus,
    preparedCommandCount: statusCounts.prepared ?? 0,
    rfqIds: uniqueSorted(run.commands.map((command) => command.rfqId)),
    status: run.status,
    taskIds: uniqueSorted(run.commands.map((command) => command.taskId)),
    warningCount: run.warnings.length,
  }
}

function normalizeSnapshot(
  snapshot: Partial<CalendarFollowUpRescheduleExecutionPersistenceSnapshot> | undefined,
): CalendarFollowUpRescheduleExecutionPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, CalendarFollowUpRescheduleExecutionRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.executionFingerprint)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.executionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    latestRun: records[0],
    pendingActionCount: records.reduce((total, record) => total + record.pendingActionCount, 0),
    persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION,
    planStatusCounts: countPlanStatuses(records),
    recordCount: records.length,
    records,
    rfqIds: uniqueSorted(records.flatMap((record) => record.rfqIds)),
    statusCounts: countStatuses(records),
    taskIds: uniqueSorted(records.flatMap((record) => record.taskIds)),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: CalendarFollowUpRescheduleExecutionRecord,
): CalendarFollowUpRescheduleExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    createdCommandCount: nonNegativeInteger(record.createdCommandCount, "createdCommandCount"),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionVersion: normalizeExecutionVersion(record.executionVersion),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "failedCommandCount"),
    mode: normalizeMode(record.mode),
    pendingActionCount: nonNegativeInteger(record.pendingActionCount, "pendingActionCount"),
    pendingCommandCount: nonNegativeInteger(record.pendingCommandCount, "pendingCommandCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    planStatus: normalizePlanStatus(record.planStatus),
    preparedCommandCount: nonNegativeInteger(record.preparedCommandCount, "preparedCommandCount"),
    rfqIds: normalizeTextList(record.rfqIds, "rfqIds"),
    status: normalizeStatus(record.status),
    taskIds: normalizeTextList(record.taskIds, "taskIds"),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  const countedCommands =
    normalized.blockedCommandCount +
    normalized.createdCommandCount +
    normalized.failedCommandCount +
    normalized.pendingCommandCount +
    normalized.preparedCommandCount
  if (countedCommands !== normalized.commandCount) {
    throw new Error("commandCount must equal the sum of per-status command counts")
  }
  if (normalized.commandCount > 0 && (normalized.rfqIds.length === 0 || normalized.taskIds.length === 0)) {
    throw new Error("records with commands must include rfqIds and taskIds")
  }
  if (normalized.commandCount === 0 && (normalized.rfqIds.length > 0 || normalized.taskIds.length > 0)) {
    throw new Error("records without commands must not include rfqIds or taskIds")
  }

  return normalized
}

function cloneSnapshot(
  snapshot: CalendarFollowUpRescheduleExecutionPersistenceSnapshot,
): CalendarFollowUpRescheduleExecutionPersistenceSnapshot {
  return {
    latestRun: snapshot.latestRun ? cloneRecord(snapshot.latestRun) : undefined,
    pendingActionCount: snapshot.pendingActionCount,
    persistenceVersion: snapshot.persistenceVersion,
    planStatusCounts: { ...snapshot.planStatusCounts },
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    rfqIds: [...snapshot.rfqIds],
    statusCounts: { ...snapshot.statusCounts },
    taskIds: [...snapshot.taskIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(record: CalendarFollowUpRescheduleExecutionRecord): CalendarFollowUpRescheduleExecutionRecord {
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
    compareLex(left.mode, right.mode) ||
    compareLex(left.planStatus, right.planStatus) ||
    compareLex(left.actor, right.actor) ||
    compareLex(left.executionVersion, right.executionVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareLex(left.rfqIds.join("\u0000"), right.rfqIds.join("\u0000")) ||
    compareLex(left.taskIds.join("\u0000"), right.taskIds.join("\u0000")) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.createdCommandCount, right.createdCommandCount) ||
    compareNumber(left.failedCommandCount, right.failedCommandCount) ||
    compareNumber(left.pendingCommandCount, right.pendingCommandCount) ||
    compareNumber(left.preparedCommandCount, right.preparedCommandCount) ||
    compareNumber(left.pendingActionCount, right.pendingActionCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function commandStatusCounts(
  statuses: CalendarFollowUpRescheduleCommandExecutionStatus[],
): Partial<Record<CalendarFollowUpRescheduleCommandExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<CalendarFollowUpRescheduleCommandExecutionStatus, number>>>((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

function countStatuses(
  records: CalendarFollowUpRescheduleExecutionRecord[],
): Partial<Record<CalendarFollowUpRescheduleExecutionStatus, number>> {
  return records.reduce<Partial<Record<CalendarFollowUpRescheduleExecutionStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function countPlanStatuses(
  records: CalendarFollowUpRescheduleExecutionRecord[],
): Partial<Record<CalendarFollowUpReschedulePlanStatus, number>> {
  return records.reduce<Partial<Record<CalendarFollowUpReschedulePlanStatus, number>>>((counts, record) => {
    counts[record.planStatus] = (counts[record.planStatus] ?? 0) + 1
    return counts
  }, {})
}

function normalizeTextList(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`)
  }
  return uniqueSorted(value.map((item, index) => nonBlank(item, `${fieldName}[${index}]`)))
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareLex)
}

function nonNegativeInteger(value: unknown, fieldName: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer`)
  }
  return Number(value)
}

function compareNumber(left: number, right: number): number {
  return left - right
}

function normalizePersistenceVersion(
  version: unknown,
): typeof CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION {
  if (version !== CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported calendar reschedule execution persistence version")
  }
  return version
}

function normalizeExecutionVersion(
  version: unknown,
): typeof CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_VERSION {
  if (version !== CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_VERSION) {
    throw new Error("executionVersion is not a supported calendar reschedule execution version")
  }
  return version
}

function normalizeMode(mode: unknown): CalendarFollowUpRescheduleExecutionRun["mode"] {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(status: unknown): CalendarFollowUpRescheduleExecutionStatus {
  if (
    status !== "blocked" &&
    status !== "failed" &&
    status !== "partial" &&
    status !== "pending" &&
    status !== "prepared" &&
    status !== "succeeded"
  ) {
    throw new Error("status is not a supported calendar reschedule execution status")
  }
  return status
}

function normalizePlanStatus(status: unknown): CalendarFollowUpReschedulePlanStatus {
  if (status !== "blocked" && status !== "empty" && status !== "mixed" && status !== "ready") {
    throw new Error("planStatus is not a supported calendar reschedule plan status")
  }
  return status
}
