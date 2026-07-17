import { nonBlank } from "../shared/stringValidation"
import type { CalendarFollowUpRescheduleCommandOutcomeInput } from "./calendarFollowUpRescheduleExecution"
import type {
  CalendarFollowUpRescheduleCommandExecution,
  CalendarFollowUpRescheduleExecutionRun,
} from "./calendarFollowUpRescheduleExecution"
import type {
  CalendarFollowUpRescheduleCommand,
  CalendarFollowUpReschedulePlan,
} from "./calendarFollowUpReschedulePlan"

export const CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_VERSION =
  "calendar-follow-up-reschedule-provider-outcomes.v1"

export interface BuildCalendarFollowUpRescheduleProviderCommandOutcomesInput {
  localExternalIdPrefix?: string
  plan: CalendarFollowUpReschedulePlan
  reviewedExecution?: CalendarFollowUpRescheduleExecutionRun
}

export function buildCalendarFollowUpRescheduleProviderCommandOutcomes({
  localExternalIdPrefix = "local-calendar-reschedule",
  plan,
  reviewedExecution,
}: BuildCalendarFollowUpRescheduleProviderCommandOutcomesInput): CalendarFollowUpRescheduleCommandOutcomeInput[] {
  const externalIdPrefix = nonBlank(localExternalIdPrefix, "localExternalIdPrefix")
  if (plan.status === "blocked" || plan.status === "empty") {
    return []
  }

  return plan.commands.flatMap((command) => {
    if (command.status !== "ready") {
      return []
    }
    if (!hasReviewedDryRunCommand(reviewedExecution, command)) {
      return [missingReviewedDryRunOutcome(command)]
    }
    return [localCalendarRescheduleOutcome(command, externalIdPrefix)]
  })
}

function hasReviewedDryRunCommand(
  reviewedExecution: CalendarFollowUpRescheduleExecutionRun | undefined,
  command: CalendarFollowUpRescheduleCommand,
): boolean {
  if (!reviewedExecution || reviewedExecution.mode !== "dry_run") {
    return false
  }
  return reviewedExecution.commands.some((executionCommand) => isPreparedCommand(executionCommand, command))
}

function isPreparedCommand(
  executionCommand: CalendarFollowUpRescheduleCommandExecution,
  command: CalendarFollowUpRescheduleCommand,
): boolean {
  return executionCommand.commandId === command.commandId && executionCommand.status === "prepared"
}

function localCalendarRescheduleOutcome(
  command: CalendarFollowUpRescheduleCommand,
  externalIdPrefix: string,
): CalendarFollowUpRescheduleCommandOutcomeInput {
  return {
    commandId: command.commandId,
    externalId: `${externalIdPrefix}:${command.commandId}`,
    message: `${command.title} recorded in the local calendar reschedule adapter.`,
    status: "created",
    warnings: ["Local adapter recorded the reschedule command; no external Calendar connector call was made."],
  }
}

function missingReviewedDryRunOutcome(
  command: CalendarFollowUpRescheduleCommand,
): CalendarFollowUpRescheduleCommandOutcomeInput {
  return {
    commandId: command.commandId,
    message: "Reviewed dry-run execution is required before calendar provider outcomes are recorded.",
    status: "failed",
    warnings: [],
  }
}
