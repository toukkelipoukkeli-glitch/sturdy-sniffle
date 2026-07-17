import { compareLex } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type { CalendarFollowUpRescheduleCommandOutcomeInput } from "./calendarFollowUpRescheduleExecution"
import {
  CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_VERSION,
} from "./calendarFollowUpRescheduleProviderOutcomes"
import type { CalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"

export const CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_READ_MODEL_VERSION =
  "calendar-follow-up-reschedule-provider-outcome-read-model.v1"

export type CalendarFollowUpRescheduleProviderOutcomeReadModelStatus =
  | "blocked"
  | "empty"
  | "needs_review"
  | "partial"
  | "ready"

export interface CalendarFollowUpRescheduleProviderOutcomeReadModelInput {
  outcomes: CalendarFollowUpRescheduleCommandOutcomeInput[]
  plan: CalendarFollowUpReschedulePlan
}

export interface CalendarFollowUpRescheduleProviderOutcomeReadModel {
  blockedCommandCount: number
  createdOutcomeCount: number
  detail: string
  expectedOutcomeCount: number
  failedOutcomeCount: number
  missingOutcomeCount: number
  nextActions: string[]
  outcomeVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_VERSION
  readModelVersion: typeof CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_READ_MODEL_VERSION
  status: CalendarFollowUpRescheduleProviderOutcomeReadModelStatus
  title: string
  unexpectedOutcomeCount: number
  warningCount: number
}

export function buildCalendarFollowUpRescheduleProviderOutcomeReadModel({
  outcomes,
  plan,
}: CalendarFollowUpRescheduleProviderOutcomeReadModelInput): CalendarFollowUpRescheduleProviderOutcomeReadModel {
  const normalized = normalizeOutcomes(outcomes)
  const readyCommands = plan.commands.filter((command) => command.status === "ready")
  const readyCommandIds = new Set(readyCommands.map((command) => command.commandId))
  const expectedOutcomeCount = readyCommands.length
  const matchedOutcomes = normalized.filter((outcome) => readyCommandIds.has(outcome.commandId))
  const unexpectedOutcomeCount = normalized.length - matchedOutcomes.length
  const createdOutcomeCount = matchedOutcomes.filter((outcome) => outcome.status === "created").length
  const failedOutcomeCount = matchedOutcomes.filter((outcome) => outcome.status === "failed").length
  const missingOutcomeCount = Math.max(0, expectedOutcomeCount - matchedOutcomes.length)
  const blockedCommandCount = plan.commands.filter((command) => command.status === "blocked").length
  const warningCount = matchedOutcomes.reduce((total, outcome) => total + outcome.warnings.length, 0)
  const status = readModelStatus({
    blockedCommandCount,
    createdOutcomeCount,
    expectedOutcomeCount,
    failedOutcomeCount,
    missingOutcomeCount,
    plan,
    unexpectedOutcomeCount,
  })

  return {
    blockedCommandCount,
    createdOutcomeCount,
    detail: detailForStatus(status, {
      blockedCommandCount,
      createdOutcomeCount,
      failedOutcomeCount,
      missingOutcomeCount,
      unexpectedOutcomeCount,
    }),
    expectedOutcomeCount,
    failedOutcomeCount,
    missingOutcomeCount,
    nextActions: nextActionsForStatus(status),
    outcomeVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_VERSION,
    readModelVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_READ_MODEL_VERSION,
    status,
    title: titleForStatus(status),
    unexpectedOutcomeCount,
    warningCount,
  }
}

interface NormalizedOutcome {
  commandId: string
  status: CalendarFollowUpRescheduleCommandOutcomeInput["status"]
  warnings: string[]
}

function normalizeOutcomes(outcomes: CalendarFollowUpRescheduleCommandOutcomeInput[]): NormalizedOutcome[] {
  const byCommandId = new Map<string, NormalizedOutcome>()
  for (const outcome of outcomes) {
    const commandId = nonBlank(outcome.commandId, "outcomes.commandId")
    if (byCommandId.has(commandId)) {
      throw new Error(`duplicate calendar reschedule provider outcome ${commandId}`)
    }
    byCommandId.set(commandId, {
      commandId,
      status: normalizeStatus(outcome.status, commandId),
      warnings: normalizeWarnings(outcome.warnings ?? []),
    })
  }
  return [...byCommandId.values()].sort((left, right) => compareLex(left.commandId, right.commandId))
}

function readModelStatus({
  blockedCommandCount,
  createdOutcomeCount,
  expectedOutcomeCount,
  failedOutcomeCount,
  missingOutcomeCount,
  plan,
  unexpectedOutcomeCount,
}: {
  blockedCommandCount: number
  createdOutcomeCount: number
  expectedOutcomeCount: number
  failedOutcomeCount: number
  missingOutcomeCount: number
  plan: CalendarFollowUpReschedulePlan
  unexpectedOutcomeCount: number
}): CalendarFollowUpRescheduleProviderOutcomeReadModelStatus {
  if (plan.summary.commandCount === 0) {
    return "empty"
  }
  if (expectedOutcomeCount === 0) {
    return "blocked"
  }
  if (failedOutcomeCount > 0 || missingOutcomeCount > 0 || unexpectedOutcomeCount > 0 || blockedCommandCount > 0) {
    return createdOutcomeCount > 0 ? "partial" : "needs_review"
  }
  return "ready"
}

function titleForStatus(status: CalendarFollowUpRescheduleProviderOutcomeReadModelStatus): string {
  switch (status) {
    case "blocked":
      return "Calendar provider outcomes blocked"
    case "empty":
      return "No calendar provider outcomes"
    case "needs_review":
      return "Calendar provider outcomes need review"
    case "partial":
      return "Calendar provider outcomes partial"
    case "ready":
      return "Calendar provider outcomes ready"
  }
}

function detailForStatus(
  status: CalendarFollowUpRescheduleProviderOutcomeReadModelStatus,
  counts: {
    blockedCommandCount: number
    createdOutcomeCount: number
    failedOutcomeCount: number
    missingOutcomeCount: number
    unexpectedOutcomeCount: number
  },
): string {
  switch (status) {
    case "blocked":
      return `${counts.blockedCommandCount} calendar reschedule command(s) are blocked before local/provider outcomes.`
    case "empty":
      return "No calendar reschedule provider outcomes are expected yet."
    case "needs_review":
      return `${counts.failedOutcomeCount + counts.missingOutcomeCount + counts.unexpectedOutcomeCount} calendar provider outcome(s) need a reviewed dry-run before commit execution.`
    case "partial":
      return `${counts.createdOutcomeCount} local provider outcome(s) are ready while ${counts.blockedCommandCount + counts.failedOutcomeCount + counts.missingOutcomeCount + counts.unexpectedOutcomeCount} item(s) still need operator attention.`
    case "ready":
      return `${counts.createdOutcomeCount} local provider outcome(s) are ready for the calendar reschedule execution audit.`
  }
}

function nextActionsForStatus(status: CalendarFollowUpRescheduleProviderOutcomeReadModelStatus): string[] {
  switch (status) {
    case "blocked":
      return ["Resolve blocked reschedule commands before recording calendar provider outcomes."]
    case "empty":
      return ["Create a reviewed calendar reschedule plan before recording provider outcomes."]
    case "needs_review":
      return ["Review a dry-run execution before recording local calendar provider outcomes."]
    case "partial":
      return ["Resolve blocked, failed, missing, or unexpected calendar provider outcomes before commit execution."]
    case "ready":
      return ["Record the local provider outcomes in the calendar reschedule execution audit."]
  }
}

function normalizeStatus(
  status: CalendarFollowUpRescheduleCommandOutcomeInput["status"],
  commandId: string,
): CalendarFollowUpRescheduleCommandOutcomeInput["status"] {
  if (status !== "created" && status !== "failed") {
    throw new Error(`calendar reschedule provider outcome ${commandId} status must be created or failed`)
  }
  return status
}

function normalizeWarnings(warnings: string[]): string[] {
  return [...new Set(warnings.map((warning) => warning.trim()).filter(Boolean))].sort(compareLex)
}
