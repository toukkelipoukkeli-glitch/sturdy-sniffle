import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { CalendarFollowUpRescheduleCommandOutcomeInput } from "./calendarFollowUpRescheduleExecution"
import {
  buildCalendarFollowUpRescheduleProviderOutcomeReadModel,
  type CalendarFollowUpRescheduleProviderOutcomeReadModel,
  type CalendarFollowUpRescheduleProviderOutcomeReadModelStatus,
} from "./calendarFollowUpRescheduleProviderOutcomeReadModel"
import type {
  CalendarFollowUpRescheduleCommand,
  CalendarFollowUpReschedulePlan,
  CalendarFollowUpReschedulePlanStatus,
} from "./calendarFollowUpReschedulePlan"

export const CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION =
  "calendar-follow-up-reschedule-provider-outcome-persistence.v1"

export interface CalendarFollowUpRescheduleProviderOutcomePersistenceRecord {
  blockedCommandCount: number
  commandOutcomeCount: number
  commandOutcomes: CalendarFollowUpRescheduleCommandOutcomeInput[]
  createdOutcomeCount: number
  expectedOutcomeCount: number
  failedOutcomeCount: number
  missingOutcomeCount: number
  outcomeFingerprint: string
  persistenceVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION
  plan: CalendarFollowUpReschedulePlan
  planStatus: CalendarFollowUpReschedulePlanStatus
  readModel: CalendarFollowUpRescheduleProviderOutcomeReadModel
  readModelStatus: CalendarFollowUpRescheduleProviderOutcomeReadModelStatus
  recordedAt: string
  recordedBy: string
  rfqId: string
  taskIds: string[]
  unexpectedOutcomeCount: number
  warningCount: number
}

export interface CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot {
  commandOutcomeCount: number
  createdOutcomeCount: number
  expectedOutcomeCount: number
  failedOutcomeCount: number
  latestRecord?: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord
  missingOutcomeCount: number
  outcomeStatusCounts: Partial<Record<CalendarFollowUpRescheduleCommandOutcomeInput["status"], number>>
  persistenceVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION
  planStatusCounts: Partial<Record<CalendarFollowUpReschedulePlanStatus, number>>
  readyOutcomeFingerprints: string[]
  readModelStatusCounts: Partial<Record<CalendarFollowUpRescheduleProviderOutcomeReadModelStatus, number>>
  recordCount: number
  records: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord[]
  reviewOutcomeFingerprints: string[]
  rfqIds: string[]
  taskIds: string[]
  unexpectedOutcomeCount: number
  warningCount: number
}

export interface CalendarFollowUpRescheduleProviderOutcomePersistenceAdapter {
  recordOutcomes(input: CalendarFollowUpRescheduleProviderOutcomePersistenceRecordInput): Promise<CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot>
  snapshot(): CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot
}

export interface CalendarFollowUpRescheduleProviderOutcomePersistenceRecordInput {
  commandOutcomes: CalendarFollowUpRescheduleCommandOutcomeInput[]
  plan: CalendarFollowUpReschedulePlan
  recordedAt: string
  recordedBy: string
  rfqId: string
}

export interface LocalCalendarFollowUpRescheduleProviderOutcomePersistenceOptions {
  initialSnapshot?: Partial<CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot>
}

export function createLocalCalendarFollowUpRescheduleProviderOutcomePersistence({
  initialSnapshot,
}: LocalCalendarFollowUpRescheduleProviderOutcomePersistenceOptions = {}): CalendarFollowUpRescheduleProviderOutcomePersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordOutcomes(input) {
      const record = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord(input)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records.filter((candidate) => candidate.outcomeFingerprint !== record.outcomeFingerprint),
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function fingerprintCalendarFollowUpRescheduleProviderOutcomes(input: {
  commandOutcomes: CalendarFollowUpRescheduleCommandOutcomeInput[]
  plan: CalendarFollowUpReschedulePlan
  rfqId: string
}): string {
  const rfqId = nonBlank(input.rfqId, "rfqId")
  const plan = normalizePlan(input.plan, rfqId)
  const commandOutcomes = normalizeCommandOutcomes(input.commandOutcomes)
  return `calendar-follow-up-reschedule-provider-outcomes-${fingerprint(
    stableJson({
      commandOutcomes,
      plan,
      rfqId,
    }),
  )}`
}

export function buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord(
  input: CalendarFollowUpRescheduleProviderOutcomePersistenceRecordInput,
): CalendarFollowUpRescheduleProviderOutcomePersistenceRecord {
  const rfqId = nonBlank(input.rfqId, "rfqId")
  const plan = normalizePlan(input.plan, rfqId)
  const commandOutcomes = normalizeCommandOutcomes(input.commandOutcomes)
  const readModel = buildCalendarFollowUpRescheduleProviderOutcomeReadModel({
    outcomes: commandOutcomes,
    plan,
  })

  return {
    blockedCommandCount: readModel.blockedCommandCount,
    commandOutcomeCount: commandOutcomes.length,
    commandOutcomes,
    createdOutcomeCount: readModel.createdOutcomeCount,
    expectedOutcomeCount: readModel.expectedOutcomeCount,
    failedOutcomeCount: readModel.failedOutcomeCount,
    missingOutcomeCount: readModel.missingOutcomeCount,
    outcomeFingerprint: fingerprintCalendarFollowUpRescheduleProviderOutcomes({ commandOutcomes, plan, rfqId }),
    persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
    plan,
    planStatus: plan.status,
    readModel: cloneReadModel(readModel),
    readModelStatus: readModel.status,
    recordedAt: normalizeIsoTimestamp(input.recordedAt, "recordedAt"),
    recordedBy: nonBlank(input.recordedBy, "recordedBy"),
    rfqId,
    taskIds: uniqueSorted(plan.commands.map((command) => command.taskId)),
    unexpectedOutcomeCount: readModel.unexpectedOutcomeCount,
    warningCount: commandOutcomes.reduce((total, outcome) => total + (outcome.warnings?.length ?? 0), 0),
  }
}

function normalizeSnapshot(
  snapshot: Partial<CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot> | undefined,
): CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot {
  const recordsByFingerprint = new Map<string, CalendarFollowUpRescheduleProviderOutcomePersistenceRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.outcomeFingerprint)
    if (!existing || sortRecords(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.outcomeFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortRecords)

  return {
    commandOutcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    createdOutcomeCount: records.reduce((total, record) => total + record.createdOutcomeCount, 0),
    expectedOutcomeCount: records.reduce((total, record) => total + record.expectedOutcomeCount, 0),
    failedOutcomeCount: records.reduce((total, record) => total + record.failedOutcomeCount, 0),
    latestRecord: records[0] ? cloneRecord(records[0]) : undefined,
    missingOutcomeCount: records.reduce((total, record) => total + record.missingOutcomeCount, 0),
    outcomeStatusCounts: countOutcomeStatuses(records),
    persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
    planStatusCounts: countPlanStatuses(records),
    readyOutcomeFingerprints: records
      .filter((record) => record.readModelStatus === "ready")
      .map((record) => record.outcomeFingerprint),
    readModelStatusCounts: countReadModelStatuses(records),
    recordCount: records.length,
    records,
    reviewOutcomeFingerprints: records
      .filter((record) => record.readModelStatus === "needs_review" || record.readModelStatus === "partial")
      .map((record) => record.outcomeFingerprint),
    rfqIds: uniqueSorted(records.map((record) => record.rfqId)),
    taskIds: uniqueSorted(records.flatMap((record) => record.taskIds)),
    unexpectedOutcomeCount: records.reduce((total, record) => total + record.unexpectedOutcomeCount, 0),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
): CalendarFollowUpRescheduleProviderOutcomePersistenceRecord {
  normalizePersistenceVersion(record.persistenceVersion)
  return buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
    commandOutcomes: record.commandOutcomes,
    plan: record.plan,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    rfqId: record.rfqId,
  })
}

function cloneSnapshot(
  snapshot: CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot,
): CalendarFollowUpRescheduleProviderOutcomePersistenceSnapshot {
  return {
    commandOutcomeCount: snapshot.commandOutcomeCount,
    createdOutcomeCount: snapshot.createdOutcomeCount,
    expectedOutcomeCount: snapshot.expectedOutcomeCount,
    failedOutcomeCount: snapshot.failedOutcomeCount,
    ...(snapshot.latestRecord ? { latestRecord: cloneRecord(snapshot.latestRecord) } : {}),
    missingOutcomeCount: snapshot.missingOutcomeCount,
    outcomeStatusCounts: { ...snapshot.outcomeStatusCounts },
    persistenceVersion: snapshot.persistenceVersion,
    planStatusCounts: { ...snapshot.planStatusCounts },
    readyOutcomeFingerprints: [...snapshot.readyOutcomeFingerprints],
    readModelStatusCounts: { ...snapshot.readModelStatusCounts },
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    reviewOutcomeFingerprints: [...snapshot.reviewOutcomeFingerprints],
    rfqIds: [...snapshot.rfqIds],
    taskIds: [...snapshot.taskIds],
    unexpectedOutcomeCount: snapshot.unexpectedOutcomeCount,
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
): CalendarFollowUpRescheduleProviderOutcomePersistenceRecord {
  normalizePersistenceVersion(record.persistenceVersion)
  return buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
    commandOutcomes: record.commandOutcomes,
    plan: record.plan,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    rfqId: record.rfqId,
  })
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
    throw new Error(`plan.commands[${index}].rfqId must match rfqId`)
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

function normalizeCommandOutcomes(
  commandOutcomes: CalendarFollowUpRescheduleCommandOutcomeInput[],
): CalendarFollowUpRescheduleCommandOutcomeInput[] {
  const seenCommandIds = new Set<string>()
  return commandOutcomes
    .map((outcome) => {
      const commandId = nonBlank(outcome.commandId, "commandOutcomes.commandId")
      if (seenCommandIds.has(commandId)) {
        throw new Error(`duplicate calendar reschedule provider command outcome ${commandId}`)
      }
      seenCommandIds.add(commandId)
      return {
        commandId,
        ...(optionalTrim(outcome.externalId) ? { externalId: optionalTrim(outcome.externalId) } : {}),
        ...(optionalTrim(outcome.message) ? { message: optionalTrim(outcome.message) } : {}),
        status: normalizeOutcomeStatus(outcome.status, commandId),
        warnings: normalizeWarnings(outcome.warnings ?? []),
      }
    })
    .sort(sortOutcomes)
}

function cloneReadModel(
  readModel: CalendarFollowUpRescheduleProviderOutcomeReadModel,
): CalendarFollowUpRescheduleProviderOutcomeReadModel {
  return {
    ...readModel,
    nextActions: [...readModel.nextActions],
  }
}

function sortRecords(
  left: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
  right: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.outcomeFingerprint, right.outcomeFingerprint) ||
    compareLex(left.rfqId, right.rfqId) ||
    compareLex(left.recordedBy, right.recordedBy)
  )
}

function sortCommands(left: CalendarFollowUpRescheduleCommand, right: CalendarFollowUpRescheduleCommand): number {
  return (
    compareLex(left.previousDueAt, right.previousDueAt) ||
    compareLex(left.taskId, right.taskId) ||
    compareLex(left.commandId, right.commandId)
  )
}

function sortOutcomes(
  left: CalendarFollowUpRescheduleCommandOutcomeInput,
  right: CalendarFollowUpRescheduleCommandOutcomeInput,
): number {
  return (
    compareLex(left.commandId, right.commandId) ||
    compareLex(left.status, right.status) ||
    compareLex(left.externalId ?? "", right.externalId ?? "") ||
    compareLex(left.message ?? "", right.message ?? "")
  )
}

function countOutcomeStatuses(
  records: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord[],
): Partial<Record<CalendarFollowUpRescheduleCommandOutcomeInput["status"], number>> {
  return records.reduce<Partial<Record<CalendarFollowUpRescheduleCommandOutcomeInput["status"], number>>>((counts, record) => {
    for (const outcome of record.commandOutcomes) {
      counts[outcome.status] = (counts[outcome.status] ?? 0) + 1
    }
    return counts
  }, {})
}

function countReadModelStatuses(
  records: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord[],
): Partial<Record<CalendarFollowUpRescheduleProviderOutcomeReadModelStatus, number>> {
  return records.reduce<Partial<Record<CalendarFollowUpRescheduleProviderOutcomeReadModelStatus, number>>>((counts, record) => {
    counts[record.readModelStatus] = (counts[record.readModelStatus] ?? 0) + 1
    return counts
  }, {})
}

function countPlanStatuses(
  records: CalendarFollowUpRescheduleProviderOutcomePersistenceRecord[],
): Partial<Record<CalendarFollowUpReschedulePlanStatus, number>> {
  return records.reduce<Partial<Record<CalendarFollowUpReschedulePlanStatus, number>>>((counts, record) => {
    counts[record.planStatus] = (counts[record.planStatus] ?? 0) + 1
    return counts
  }, {})
}

function normalizeWarnings(warnings: string[]): string[] {
  return [...new Set(warnings.map((warning) => optionalTrim(warning)).filter((warning): warning is string => Boolean(warning)))].sort(compareLex)
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareLex)
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

function normalizeOutcomeStatus(
  status: CalendarFollowUpRescheduleCommandOutcomeInput["status"],
  commandId: string,
): CalendarFollowUpRescheduleCommandOutcomeInput["status"] {
  if (status !== "created" && status !== "failed") {
    throw new Error(`calendar reschedule provider command outcome ${commandId} status must be created or failed`)
  }
  return status
}

function normalizePersistenceVersion(
  version: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
): typeof CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION {
  if (version !== CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION) {
    throw new Error("calendar reschedule provider outcome persistence version is not supported")
  }
  return version
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => compareLex(left, right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function fingerprint(value: string): string {
  let hashA = 0x811c9dc5
  let hashB = 0x01000193
  let hashC = 0x9e3779b9
  let hashD = 0x85ebca6b
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    hashA ^= code
    hashA = Math.imul(hashA, 0x01000193) >>> 0
    hashB ^= code + index
    hashB = Math.imul(hashB, 0x85ebca6b) >>> 0
    hashC ^= code + value.length
    hashC = Math.imul(hashC, 0xc2b2ae35) >>> 0
    hashD ^= code + hashA
    hashD = Math.imul(hashD, 0x27d4eb2f) >>> 0
  }
  return [hashA, hashB, hashC, hashD].map((hash) => hash.toString(16).padStart(8, "0")).join("")
}
