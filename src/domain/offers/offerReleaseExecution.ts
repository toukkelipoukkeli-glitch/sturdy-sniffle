import type { CalendarRfqEventDraft } from "../integrations/calendarRfq"
import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { WorkspaceActionRecord } from "../workspace/workspaceActions"
import type { OfferLifecycleEventInput } from "./offerLifecycle"
import type {
  OfferReleaseCommand,
  OfferReleaseCommandKind,
  OfferReleasePlan,
} from "./offerReleasePlan"

export const OFFER_RELEASE_EXECUTION_VERSION = "offer-release-execution.v1"

export type OfferReleaseExecutionMode = "commit" | "dry_run"
export type OfferReleaseExecutionStatus =
  | "blocked"
  | "failed"
  | "needs_review"
  | "partial"
  | "pending"
  | "prepared"
  | "succeeded"
export type OfferReleaseCommandExecutionStatus =
  | "applied"
  | "blocked"
  | "failed"
  | "pending"
  | "prepared"
  | "requires_review"

export interface OfferReleaseCommandOutcomeInput {
  key: string
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface OfferReleaseCommandExecution {
  key: string
  kind: OfferReleaseCommandKind
  label: string
  detail: string
  status: OfferReleaseCommandExecutionStatus
  idempotencyKey: string
  externalId?: string
  message?: string
  warnings: string[]
}

export interface OfferReleaseExecutionRun {
  executionVersion: typeof OFFER_RELEASE_EXECUTION_VERSION
  actor: string
  executedAt: string
  releaseAt: string
  mode: OfferReleaseExecutionMode
  status: OfferReleaseExecutionStatus
  offerId: string
  offerNumber: string
  rfqId: string
  planVersion: OfferReleasePlan["planVersion"]
  commands: OfferReleaseCommandExecution[]
  lifecycleEvents: OfferLifecycleEventInput[]
  workspaceActions: WorkspaceActionRecord[]
  calendarEvents: CalendarRfqEventDraft[]
  nextActions: string[]
  warnings: string[]
}

export interface BuildOfferReleaseExecutionRunInput {
  actor: string
  mode: OfferReleaseExecutionMode
  plan: OfferReleasePlan
  executedAt?: string
  commandOutcomes?: OfferReleaseCommandOutcomeInput[]
}

export function buildOfferReleaseExecutionRun(input: BuildOfferReleaseExecutionRunInput): OfferReleaseExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const mode = normalizeMode(input.mode)
  const offerId = nonBlank(input.plan.offerId, "plan.offerId")
  const offerNumber = nonBlank(input.plan.offerNumber, "plan.offerNumber")
  const releaseAt = normalizeIsoTimestamp(input.plan.releaseAt, "plan.releaseAt")
  const rfqId = nonBlank(input.plan.rfqId, "plan.rfqId")
  const executedAt = normalizeIsoTimestamp(input.executedAt ?? releaseAt, "executedAt")
  const outcomesByKey = normalizeCommandOutcomes(input.plan.commands, input.commandOutcomes ?? [])
  const commands = input.plan.commands.map((command) =>
    buildCommandExecution({
      command,
      mode,
      outcome: outcomesByKey.get(command.key),
      releaseAt,
      offerId,
    }),
  )
  const status = executionStatus(input.plan, mode, commands)

  return {
    executionVersion: OFFER_RELEASE_EXECUTION_VERSION,
    actor,
    calendarEvents: releasablePlan(input.plan) ? (input.plan.calendarPlan?.events ?? []) : [],
    commands,
    executedAt,
    lifecycleEvents: releasablePlan(input.plan) ? input.plan.lifecycleEvents : [],
    mode,
    nextActions: executionNextActions(input.plan, mode, commands, status),
    offerId,
    offerNumber,
    planVersion: input.plan.planVersion,
    releaseAt,
    rfqId,
    status,
    warnings: executionWarnings(input.plan, commands),
    workspaceActions: releasablePlan(input.plan) ? input.plan.workspaceActions : [],
  }
}

function buildCommandExecution(input: {
  command: OfferReleaseCommand
  mode: OfferReleaseExecutionMode
  outcome?: NormalizedCommandOutcome
  offerId: string
  releaseAt: string
}): OfferReleaseCommandExecution {
  const status = commandExecutionStatus(input.command, input.mode, input.outcome)
  const warnings = input.outcome?.warnings ?? []
  const externalId = optionalTrim(input.outcome?.externalId)
  const message = optionalTrim(input.outcome?.message)

  return {
    detail: input.command.detail,
    externalId,
    idempotencyKey: releaseCommandIdempotencyKey(input.offerId, input.releaseAt, input.command),
    key: input.command.key,
    kind: input.command.kind,
    label: input.command.label,
    message,
    status,
    warnings,
  }
}

function commandExecutionStatus(
  command: OfferReleaseCommand,
  mode: OfferReleaseExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
): OfferReleaseCommandExecutionStatus {
  if (command.status === "blocked") {
    return "blocked"
  }
  if (command.status === "requires_review") {
    return "requires_review"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  plan: OfferReleasePlan,
  mode: OfferReleaseExecutionMode,
  commands: OfferReleaseCommandExecution[],
): OfferReleaseExecutionStatus {
  if (plan.status === "blocked") {
    return "blocked"
  }
  if (plan.status === "needs_review") {
    return "needs_review"
  }
  if (mode === "dry_run") {
    return "prepared"
  }

  const appliedCount = commands.filter((command) => command.status === "applied").length
  const failedCount = commands.filter((command) => command.status === "failed").length
  const pendingCount = commands.filter((command) => command.status === "pending").length
  if (appliedCount === commands.length) {
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
  plan: OfferReleasePlan,
  mode: OfferReleaseExecutionMode,
  commands: OfferReleaseCommandExecution[],
  status: OfferReleaseExecutionStatus,
): string[] {
  if (status === "blocked" || status === "needs_review") {
    return plan.nextActions
  }
  if (mode === "dry_run") {
    return [`Review ${commands.length} prepared release command${commands.length === 1 ? "" : "s"} before committing.`]
  }
  if (status === "succeeded") {
    return ["Release execution completed."]
  }
  if (status === "pending") {
    return [`Record execution outcomes for ${commands.length} release command${commands.length === 1 ? "" : "s"}.`]
  }
  return [
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed release command: ${command.label}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record execution outcome for release command: ${command.label}.`),
  ]
}

function executionWarnings(plan: OfferReleasePlan, commands: OfferReleaseCommandExecution[]): string[] {
  return [
    ...plan.warnings,
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.label} failed: ${command.message ?? command.detail}`),
  ]
}

function releasablePlan(plan: OfferReleasePlan): boolean {
  return plan.status === "ready"
}

function releaseCommandIdempotencyKey(offerId: string, releaseAt: string, command: OfferReleaseCommand): string {
  return ["offer-release", offerId, releaseAt, command.key].map(sanitizeKeyPart).join(":")
}

interface NormalizedCommandOutcome {
  key: string
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings: string[]
}

function normalizeCommandOutcomes(
  commands: OfferReleaseCommand[],
  outcomes: OfferReleaseCommandOutcomeInput[],
): Map<string, NormalizedCommandOutcome> {
  const commandKeys = new Set(commands.map((command) => command.key))
  const normalized = new Map<string, NormalizedCommandOutcome>()

  for (const outcome of outcomes) {
    const key = nonBlank(outcome.key, "commandOutcomes.key")
    if (!commandKeys.has(key)) {
      throw new Error(`command outcome ${key} does not match a release command`)
    }
    if (normalized.has(key)) {
      throw new Error(`duplicate command outcome ${key}`)
    }
    normalized.set(key, {
      externalId: optionalTrim(outcome.externalId),
      key,
      message: optionalTrim(outcome.message),
      status: normalizeOutcomeStatus(outcome.status, key),
      warnings: normalizeWarnings(outcome.warnings ?? []),
    })
  }

  return new Map([...normalized.entries()].sort(([left], [right]) => compareLex(left, right)))
}

function normalizeMode(mode: OfferReleaseExecutionMode): OfferReleaseExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(status: OfferReleaseCommandOutcomeInput["status"], key: string): "applied" | "failed" {
  if (status !== "applied" && status !== "failed") {
    throw new Error(`command outcome ${key} status must be applied or failed`)
  }
  return status
}

function normalizeWarnings(warnings: string[]): string[] {
  return warnings.map((warning) => optionalTrim(warning)).filter((warning): warning is string => Boolean(warning))
}

function sanitizeKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
