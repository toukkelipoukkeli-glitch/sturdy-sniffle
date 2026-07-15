import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { optionalTrim } from "../shared/stringValidation"
import type {
  CalendarFollowUpRescheduleCommand,
  CalendarFollowUpReschedulePlan,
  CalendarFollowUpReschedulePlanStatus,
} from "./calendarFollowUpReschedulePlan"

export interface CalendarFollowUpReschedulePlanRecord {
  plan: CalendarFollowUpReschedulePlan
  recordedAt: string
  recordKey: string
  rfqId: string
}

export interface CalendarFollowUpReschedulePlanHistorySummary {
  blockedCommandCount: number
  commandCount: number
  currentRecord?: CalendarFollowUpReschedulePlanRecord
  latestRecordedAt?: string
  readyCommandCount: number
  recordCount: number
  statusCounts: Record<CalendarFollowUpReschedulePlanStatus, number>
}

export interface CalendarFollowUpReschedulePlanPersistenceSnapshot {
  currentRecordKey?: string
  recordCount: number
  records: CalendarFollowUpReschedulePlanRecord[]
  summary: CalendarFollowUpReschedulePlanHistorySummary
}

export interface CalendarFollowUpReschedulePlanPersistenceAdapter {
  recordPlan(record: CalendarFollowUpReschedulePlanRecord): Promise<CalendarFollowUpReschedulePlanPersistenceSnapshot>
  snapshot(): CalendarFollowUpReschedulePlanPersistenceSnapshot
}

export interface LocalCalendarFollowUpReschedulePlanPersistenceOptions {
  initialSnapshot?: Partial<CalendarFollowUpReschedulePlanPersistenceSnapshot>
}

export function createLocalCalendarFollowUpReschedulePlanPersistence({
  initialSnapshot,
}: LocalCalendarFollowUpReschedulePlanPersistenceOptions = {}): CalendarFollowUpReschedulePlanPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordPlan(record) {
      const normalized = normalizeRecord(record)
      snapshotState = normalizeSnapshot({
        currentRecordKey: normalized.recordKey,
        records: [
          ...snapshotState.records.filter((existing) => existing.recordKey !== normalized.recordKey),
          normalized,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): CalendarFollowUpReschedulePlanPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function normalizeSnapshot(
  snapshot: Partial<CalendarFollowUpReschedulePlanPersistenceSnapshot> | undefined,
): CalendarFollowUpReschedulePlanPersistenceSnapshot {
  const recordsByKey = new Map<string, CalendarFollowUpReschedulePlanRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    recordsByKey.set(normalized.recordKey, normalized)
  }

  const records = [...recordsByKey.values()].sort(sortRecords)
  const requestedCurrentKey = optionalTrim(snapshot?.currentRecordKey)
  const currentRecordKey = requestedCurrentKey && recordsByKey.has(requestedCurrentKey) ? requestedCurrentKey : undefined
  const summary = summarizeHistory(records, currentRecordKey)

  return {
    ...(summary.currentRecord ? { currentRecordKey: summary.currentRecord.recordKey } : {}),
    recordCount: records.length,
    records,
    summary,
  }
}

function normalizeRecord(record: CalendarFollowUpReschedulePlanRecord): CalendarFollowUpReschedulePlanRecord {
  const rfqId = nonBlank(record.rfqId, "record.rfqId")
  const normalizedPlan = normalizePlan(record.plan, rfqId)
  return {
    plan: normalizedPlan,
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "record.recordedAt"),
    recordKey: nonBlank(record.recordKey, "record.recordKey"),
    rfqId,
  }
}

function normalizePlan(plan: CalendarFollowUpReschedulePlan, rfqId: string): CalendarFollowUpReschedulePlan {
  const commands = plan.commands.map((command, index) => normalizeCommand(command, rfqId, index)).sort(sortCommands)
  const summary = {
    blockedCount: commands.filter((command) => command.status === "blocked").length,
    commandCount: commands.length,
    readyCount: commands.filter((command) => command.status === "ready").length,
  }
  const status = planStatus(summary)

  if (plan.summary.commandCount !== summary.commandCount) {
    throw new Error("plan.summary.commandCount must match normalized command count")
  }
  if (plan.summary.readyCount !== summary.readyCount) {
    throw new Error("plan.summary.readyCount must match normalized ready command count")
  }
  if (plan.summary.blockedCount !== summary.blockedCount) {
    throw new Error("plan.summary.blockedCount must match normalized blocked command count")
  }
  if (plan.status !== status) {
    throw new Error("plan.status must match normalized command summary")
  }

  return {
    commands,
    status,
    summary,
  }
}

function normalizeCommand(
  command: CalendarFollowUpRescheduleCommand,
  rfqId: string,
  index: number,
): CalendarFollowUpRescheduleCommand {
  const commandRfqId = nonBlank(command.rfqId, `plan.commands[${index}].rfqId`)
  if (commandRfqId !== rfqId) {
    throw new Error(`plan.commands[${index}].rfqId must match record.rfqId`)
  }
  if (command.provider !== "calendar") {
    throw new Error(`plan.commands[${index}].provider must be calendar`)
  }

  const mode = normalizeCommandMode(command.mode, index)
  const status = normalizeCommandStatus(command.status, index)
  if (status === "ready" && mode !== "review_required") {
    throw new Error(`plan.commands[${index}].mode must be review_required for ready commands`)
  }
  if (status === "blocked" && mode !== "blocked") {
    throw new Error(`plan.commands[${index}].mode must be blocked for blocked commands`)
  }
  if (!Array.isArray(command.blockerLabels)) {
    throw new Error(`plan.commands[${index}].blockerLabels must be an array`)
  }
  if (status === "ready" && !command.suggestedDueAt) {
    throw new Error(`plan.commands[${index}].suggestedDueAt is required for ready commands`)
  }
  if (status === "blocked" && command.suggestedDueAt) {
    throw new Error(`plan.commands[${index}].suggestedDueAt must be omitted for blocked commands`)
  }

  return {
    actionKey: nonBlank(command.actionKey, `plan.commands[${index}].actionKey`),
    blockerLabels: command.blockerLabels.map((label, labelIndex) =>
      nonBlank(label, `plan.commands[${index}].blockerLabels[${labelIndex}]`),
    ),
    commandId: nonBlank(command.commandId, `plan.commands[${index}].commandId`),
    detail: nonBlank(command.detail, `plan.commands[${index}].detail`),
    mode,
    nextOperatorMessage: nonBlank(command.nextOperatorMessage, `plan.commands[${index}].nextOperatorMessage`),
    offerId: nonBlank(command.offerId, `plan.commands[${index}].offerId`),
    previousDueAt: normalizeIsoTimestamp(command.previousDueAt, `plan.commands[${index}].previousDueAt`),
    provider: "calendar",
    rfqId,
    status,
    ...(command.suggestedDueAt
      ? { suggestedDueAt: normalizeIsoTimestamp(command.suggestedDueAt, `plan.commands[${index}].suggestedDueAt`) }
      : {}),
    taskId: nonBlank(command.taskId, `plan.commands[${index}].taskId`),
    title: nonBlank(command.title, `plan.commands[${index}].title`),
  }
}

function normalizeCommandMode(
  mode: CalendarFollowUpRescheduleCommand["mode"],
  index: number,
): CalendarFollowUpRescheduleCommand["mode"] {
  if (mode === "blocked" || mode === "review_required") {
    return mode
  }
  throw new Error(`plan.commands[${index}].mode is invalid`)
}

function normalizeCommandStatus(
  status: CalendarFollowUpRescheduleCommand["status"],
  index: number,
): CalendarFollowUpRescheduleCommand["status"] {
  if (status === "blocked" || status === "ready") {
    return status
  }
  throw new Error(`plan.commands[${index}].status is invalid`)
}

function summarizeHistory(
  records: CalendarFollowUpReschedulePlanRecord[],
  currentRecordKey: string | undefined,
): CalendarFollowUpReschedulePlanHistorySummary {
  const currentRecord = currentRecordKey ? records.find((record) => record.recordKey === currentRecordKey) : undefined
  const latestRecordedAt = records.reduce<string | undefined>(
    (latest, record) => (!latest || record.recordedAt > latest ? record.recordedAt : latest),
    undefined,
  )
  const statusCounts: Record<CalendarFollowUpReschedulePlanStatus, number> = {
    blocked: 0,
    empty: 0,
    mixed: 0,
    ready: 0,
  }
  let blockedCommandCount = 0
  let commandCount = 0
  let readyCommandCount = 0

  for (const record of records) {
    statusCounts[record.plan.status] += 1
    blockedCommandCount += record.plan.summary.blockedCount
    commandCount += record.plan.summary.commandCount
    readyCommandCount += record.plan.summary.readyCount
  }

  return {
    blockedCommandCount,
    commandCount,
    ...(currentRecord ? { currentRecord: cloneRecord(currentRecord) } : {}),
    ...(latestRecordedAt ? { latestRecordedAt } : {}),
    readyCommandCount,
    recordCount: records.length,
    statusCounts,
  }
}

function cloneSnapshot(
  snapshot: CalendarFollowUpReschedulePlanPersistenceSnapshot,
): CalendarFollowUpReschedulePlanPersistenceSnapshot {
  return {
    ...(snapshot.currentRecordKey ? { currentRecordKey: snapshot.currentRecordKey } : {}),
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    summary: {
      blockedCommandCount: snapshot.summary.blockedCommandCount,
      commandCount: snapshot.summary.commandCount,
      ...(snapshot.summary.currentRecord ? { currentRecord: cloneRecord(snapshot.summary.currentRecord) } : {}),
      ...(snapshot.summary.latestRecordedAt ? { latestRecordedAt: snapshot.summary.latestRecordedAt } : {}),
      readyCommandCount: snapshot.summary.readyCommandCount,
      recordCount: snapshot.summary.recordCount,
      statusCounts: { ...snapshot.summary.statusCounts },
    },
  }
}

function cloneRecord(record: CalendarFollowUpReschedulePlanRecord): CalendarFollowUpReschedulePlanRecord {
  return {
    plan: clonePlan(record.plan),
    recordedAt: record.recordedAt,
    recordKey: record.recordKey,
    rfqId: record.rfqId,
  }
}

function clonePlan(plan: CalendarFollowUpReschedulePlan): CalendarFollowUpReschedulePlan {
  return {
    commands: plan.commands.map(cloneCommand),
    status: plan.status,
    summary: { ...plan.summary },
  }
}

function cloneCommand(command: CalendarFollowUpRescheduleCommand): CalendarFollowUpRescheduleCommand {
  return {
    actionKey: command.actionKey,
    blockerLabels: [...command.blockerLabels],
    commandId: command.commandId,
    detail: command.detail,
    mode: command.mode,
    nextOperatorMessage: command.nextOperatorMessage,
    offerId: command.offerId,
    previousDueAt: command.previousDueAt,
    provider: "calendar",
    rfqId: command.rfqId,
    status: command.status,
    ...(command.suggestedDueAt ? { suggestedDueAt: command.suggestedDueAt } : {}),
    taskId: command.taskId,
    title: command.title,
  }
}

function planStatus(summary: CalendarFollowUpReschedulePlan["summary"]): CalendarFollowUpReschedulePlanStatus {
  if (summary.commandCount === 0) {
    return "empty"
  }
  if (summary.readyCount > 0 && summary.blockedCount > 0) {
    return "mixed"
  }
  return summary.readyCount > 0 ? "ready" : "blocked"
}

function sortRecords(
  left: CalendarFollowUpReschedulePlanRecord,
  right: CalendarFollowUpReschedulePlanRecord,
): number {
  return compareLex(left.recordKey, right.recordKey)
}

function sortCommands(left: CalendarFollowUpRescheduleCommand, right: CalendarFollowUpRescheduleCommand): number {
  return (
    compareLex(left.previousDueAt, right.previousDueAt) ||
    compareLex(left.taskId, right.taskId) ||
    compareLex(left.commandId, right.commandId)
  )
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
