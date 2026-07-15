import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type {
  CalendarFollowUpRescheduleCommand,
  CalendarFollowUpReschedulePlan,
} from "./calendarFollowUpReschedulePlan"

export const CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_VERSION = "calendar-follow-up-reschedule-execution.v1"

export type CalendarFollowUpRescheduleExecutionMode = "commit" | "dry_run"
export type CalendarFollowUpRescheduleExecutionStatus = "blocked" | "failed" | "partial" | "pending" | "prepared" | "succeeded"
export type CalendarFollowUpRescheduleCommandExecutionStatus = "blocked" | "created" | "failed" | "pending" | "prepared"

export interface CalendarFollowUpRescheduleCommandOutcomeInput {
  commandId: string
  status: "created" | "failed"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface CalendarFollowUpRescheduleCommandExecution {
  blockerLabels: string[]
  commandId: string
  externalId?: string
  idempotencyKey: string
  message?: string
  nextOperatorMessage: string
  previousDueAt: string
  provider: "calendar"
  rfqId: string
  status: CalendarFollowUpRescheduleCommandExecutionStatus
  suggestedDueAt?: string
  taskId: string
  title: string
  warnings: string[]
}

export interface CalendarFollowUpRescheduleExecutionRun {
  actor: string
  commands: CalendarFollowUpRescheduleCommandExecution[]
  executedAt: string
  executionFingerprint: string
  executionVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_VERSION
  mode: CalendarFollowUpRescheduleExecutionMode
  nextActions: string[]
  planStatus: CalendarFollowUpReschedulePlan["status"]
  status: CalendarFollowUpRescheduleExecutionStatus
  warnings: string[]
}

export interface BuildCalendarFollowUpRescheduleExecutionRunInput {
  actor: string
  commandOutcomes?: CalendarFollowUpRescheduleCommandOutcomeInput[]
  executedAt: string
  mode: CalendarFollowUpRescheduleExecutionMode
  plan: CalendarFollowUpReschedulePlan
}

export function buildCalendarFollowUpRescheduleExecutionRun({
  actor,
  commandOutcomes = [],
  executedAt,
  mode,
  plan,
}: BuildCalendarFollowUpRescheduleExecutionRunInput): CalendarFollowUpRescheduleExecutionRun {
  const normalizedActor = nonBlank(actor, "actor")
  const normalizedExecutedAt = normalizeIsoTimestamp(executedAt, "executedAt")
  const normalizedMode = normalizeMode(mode)
  const outcomesByCommandId = normalizeOutcomes(plan.commands, commandOutcomes, normalizedMode)
  const commands = plan.commands.map((command) =>
    buildCommandExecution(command, normalizedMode, outcomesByCommandId.get(command.commandId)),
  )
  const status = executionStatus(plan, normalizedMode, commands)

  const run: Omit<CalendarFollowUpRescheduleExecutionRun, "executionFingerprint"> = {
    actor: normalizedActor,
    commands,
    executedAt: normalizedExecutedAt,
    executionVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_VERSION,
    mode: normalizedMode,
    nextActions: executionNextActions(plan, normalizedMode, commands, status),
    planStatus: plan.status,
    status,
    warnings: executionWarnings(commands),
  }

  return {
    ...run,
    executionFingerprint: fingerprintCalendarFollowUpRescheduleExecutionRun(run),
  }
}

export function fingerprintCalendarFollowUpRescheduleExecutionRun(
  run: Omit<CalendarFollowUpRescheduleExecutionRun, "executionFingerprint"> | CalendarFollowUpRescheduleExecutionRun,
): string {
  return `calendar-follow-up-reschedule-execution-${fingerprint(
    stableJson({
      actor: run.actor,
      commands: run.commands,
      executedAt: run.executedAt,
      executionVersion: run.executionVersion,
      mode: run.mode,
      nextActions: run.nextActions,
      planStatus: run.planStatus,
      status: run.status,
      warnings: run.warnings,
    }),
  )}`
}

function buildCommandExecution(
  command: CalendarFollowUpRescheduleCommand,
  mode: CalendarFollowUpRescheduleExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
): CalendarFollowUpRescheduleCommandExecution {
  const status = commandExecutionStatus(command, mode, outcome)
  const shouldSurfaceOutcome = status === "created" || status === "failed"

  return {
    blockerLabels: [...command.blockerLabels],
    commandId: command.commandId,
    ...(shouldSurfaceOutcome && outcome?.externalId ? { externalId: outcome.externalId } : {}),
    idempotencyKey: calendarRescheduleCommandIdempotencyKey(command.commandId),
    ...(shouldSurfaceOutcome && outcome?.message ? { message: outcome.message } : {}),
    nextOperatorMessage: command.nextOperatorMessage,
    previousDueAt: command.previousDueAt,
    provider: "calendar",
    rfqId: command.rfqId,
    status,
    ...(command.suggestedDueAt ? { suggestedDueAt: command.suggestedDueAt } : {}),
    taskId: command.taskId,
    title: command.title,
    warnings: shouldSurfaceOutcome ? (outcome?.warnings ?? []) : [],
  }
}

function commandExecutionStatus(
  command: CalendarFollowUpRescheduleCommand,
  mode: CalendarFollowUpRescheduleExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
): CalendarFollowUpRescheduleCommandExecutionStatus {
  if (command.status === "blocked" || command.mode === "blocked") {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  plan: CalendarFollowUpReschedulePlan,
  mode: CalendarFollowUpRescheduleExecutionMode,
  commands: CalendarFollowUpRescheduleCommandExecution[],
): CalendarFollowUpRescheduleExecutionStatus {
  if (plan.status === "empty" || plan.status === "blocked" || commands.some((command) => command.status === "blocked")) {
    return commands.some((command) => command.status !== "blocked") ? "partial" : "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }

  const createdCount = commands.filter((command) => command.status === "created").length
  const failedCount = commands.filter((command) => command.status === "failed").length
  const pendingCount = commands.filter((command) => command.status === "pending").length
  if (createdCount === commands.length) {
    return "succeeded"
  }
  if (failedCount === commands.length) {
    return "failed"
  }
  if (pendingCount === commands.length) {
    return "pending"
  }
  return "partial"
}

function executionNextActions(
  plan: CalendarFollowUpReschedulePlan,
  mode: CalendarFollowUpRescheduleExecutionMode,
  commands: CalendarFollowUpRescheduleCommandExecution[],
  status: CalendarFollowUpRescheduleExecutionStatus,
): string[] {
  if (status === "blocked") {
    const blockerLabels = commands.flatMap((command) => command.blockerLabels)
    return blockerLabels.length > 0
      ? [...new Set(blockerLabels)]
      : ["Create a reviewed calendar reschedule plan before provider execution."]
  }
  if (mode === "dry_run") {
    return [`Review ${plan.summary.readyCount} replacement calendar hold command(s) before committing.`]
  }
  if (status === "succeeded") {
    return ["Calendar follow-up reschedule execution completed."]
  }
  if (status === "pending") {
    return [`Record provider outcomes for ${commands.length} calendar reschedule command(s).`]
  }
  return [
    ...commands
      .filter((command) => command.status === "blocked")
      .flatMap((command) => command.blockerLabels),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed calendar reschedule command: ${command.title}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record provider outcome for calendar reschedule command: ${command.title}.`),
  ]
}

function executionWarnings(commands: CalendarFollowUpRescheduleCommandExecution[]): string[] {
  return [
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.title}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.title} failed: ${command.message ?? "No failure detail provided."}`),
  ]
}

interface NormalizedCommandOutcome {
  commandId: string
  externalId?: string
  message?: string
  status: "created" | "failed"
  warnings: string[]
}

function normalizeOutcomes(
  commands: CalendarFollowUpRescheduleCommand[],
  outcomes: CalendarFollowUpRescheduleCommandOutcomeInput[],
  mode: CalendarFollowUpRescheduleExecutionMode,
): Map<string, NormalizedCommandOutcome> {
  const commandsById = new Map(commands.map((command) => [command.commandId, command]))
  const normalized = new Map<string, NormalizedCommandOutcome>()

  for (const outcome of outcomes) {
    const commandId = nonBlank(outcome.commandId, "commandOutcomes.commandId")
    const command = commandsById.get(commandId)
    if (!command) {
      throw new Error(`command outcome ${commandId} does not match a calendar reschedule command`)
    }
    if (mode === "dry_run") {
      throw new Error(`command outcome ${commandId} cannot be recorded for a dry-run calendar reschedule execution`)
    }
    if (command.status === "blocked" || command.mode === "blocked") {
      throw new Error(`command outcome ${commandId} cannot be recorded for a blocked calendar reschedule command`)
    }
    if (normalized.has(commandId)) {
      throw new Error(`duplicate command outcome ${commandId}`)
    }
    normalized.set(commandId, {
      commandId,
      externalId: optionalTrim(outcome.externalId),
      message: optionalTrim(outcome.message),
      status: normalizeOutcomeStatus(outcome.status, commandId),
      warnings: normalizeWarnings(outcome.warnings ?? []),
    })
  }

  return new Map([...normalized.entries()].sort(([left], [right]) => compareLex(left, right)))
}

function normalizeMode(mode: CalendarFollowUpRescheduleExecutionMode): CalendarFollowUpRescheduleExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(
  status: CalendarFollowUpRescheduleCommandOutcomeInput["status"],
  commandId: string,
): "created" | "failed" {
  if (status !== "created" && status !== "failed") {
    throw new Error(`command outcome ${commandId} status must be created or failed`)
  }
  return status
}

function normalizeWarnings(warnings: string[]): string[] {
  return warnings.map((warning) => optionalTrim(warning)).filter((warning): warning is string => Boolean(warning))
}

function calendarRescheduleCommandIdempotencyKey(commandId: string): string {
  return `calendar-reschedule-execution:${commandId}`
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, Object.keys(flattenKeys(value)).sort())
}

function flattenKeys(value: unknown, keys: Record<string, true> = {}): Record<string, true> {
  if (Array.isArray(value)) {
    value.forEach((item) => flattenKeys(item, keys))
    return keys
  }
  if (!value || typeof value !== "object") {
    return keys
  }
  Object.entries(value).forEach(([key, nested]) => {
    keys[key] = true
    flattenKeys(nested, keys)
  })
  return keys
}

function fingerprint(value: string): string {
  let hash = 0x811c9dc5
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}
