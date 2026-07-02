import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteApplicationMutationApplyCommand,
  NonCncPromotedQuoteApplicationMutationApplyPlan,
} from "./nonCncPromotedQuoteApplicationMutationApplyPlan"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION =
  "non-cnc-promoted-quote-application-mutation-apply-execution.v1"

export type NonCncPromotedQuoteApplicationMutationApplyExecutionMode = "commit" | "dry_run"
export type NonCncPromotedQuoteApplicationMutationApplyExecutionStatus =
  | "blocked"
  | "failed"
  | "partial"
  | "pending"
  | "prepared"
  | "succeeded"
export type NonCncPromotedQuoteApplicationMutationApplyCommandExecutionStatus =
  | "applied"
  | "blocked"
  | "failed"
  | "pending"
  | "prepared"

export interface NonCncPromotedQuoteApplicationMutationApplyCommandOutcomeInput {
  key: string
  mutationTarget: string
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface NonCncPromotedQuoteApplicationMutationApplyCommandExecution {
  key: NonCncPromotedQuoteApplicationMutationApplyCommand["key"]
  mutationTarget: NonCncPromotedQuoteApplicationMutationApplyCommand["mutationTarget"]
  label: string
  status: NonCncPromotedQuoteApplicationMutationApplyCommandExecutionStatus
  idempotencyKey: string
  blockerLabels: string[]
  reviewWarnings: string[]
  applicationTargetId?: string
  sourceExecutionFingerprint?: string
  targetRfqId?: string
  externalId?: string
  message?: string
  warnings: string[]
}

export interface NonCncPromotedQuoteApplicationMutationApplyExecutionRun {
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  executedAt: string
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionMode
  status: NonCncPromotedQuoteApplicationMutationApplyExecutionStatus
  applyPlanId: string
  planVersion: NonCncPromotedQuoteApplicationMutationApplyPlan["planVersion"]
  mutationPackageId?: string
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  sourceExecutionFingerprint?: string
  commands: NonCncPromotedQuoteApplicationMutationApplyCommandExecution[]
  nextActions: string[]
  warnings: string[]
  mutationBoundary: string
}

export interface BuildNonCncPromotedQuoteApplicationMutationApplyExecutionRunInput {
  actor: string
  applyPlan: NonCncPromotedQuoteApplicationMutationApplyPlan
  commandOutcomes?: NonCncPromotedQuoteApplicationMutationApplyCommandOutcomeInput[]
  executedAt: string
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionMode
}

interface NormalizedCommandOutcome {
  key: NonCncPromotedQuoteApplicationMutationApplyCommand["key"]
  mutationTarget: NonCncPromotedQuoteApplicationMutationApplyCommand["mutationTarget"]
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings: string[]
}

export function buildNonCncPromotedQuoteApplicationMutationApplyExecutionRun(
  input: BuildNonCncPromotedQuoteApplicationMutationApplyExecutionRunInput,
): NonCncPromotedQuoteApplicationMutationApplyExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const outcomesByCommand = normalizeCommandOutcomes(input.applyPlan.commands, input.commandOutcomes ?? [], mode)
  const commands = input.applyPlan.commands.map((command) =>
    buildCommandExecution({
      applyPlanId: input.applyPlan.applyPlanId,
      command,
      mode,
      outcome: outcomesByCommand.get(commandIdentity(command)),
      planStatus: input.applyPlan.status,
    }),
  )
  const status = executionStatus(input.applyPlan, mode, commands)

  const run: Omit<NonCncPromotedQuoteApplicationMutationApplyExecutionRun, "executionFingerprint"> = {
    actor,
    applicationId: input.applyPlan.applicationId,
    applicationRecordId: input.applyPlan.applicationRecordId,
    applyPlanId: input.applyPlan.applyPlanId,
    commands,
    executedAt,
    executionVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION,
    mode,
    mutationBoundary:
      "Application mutation apply execution runs are deterministic audit records only; this adapter does not mutate active RFQ quote, offer, or release state.",
    mutationPackageId: input.applyPlan.mutationPackageId,
    nextActions: executionNextActions(input.applyPlan, mode, commands, status),
    packageId: input.applyPlan.packageId,
    planVersion: input.applyPlan.planVersion,
    selectedPlanId: input.applyPlan.selectedPlanId,
    sourceExecutionFingerprint: status === "blocked" ? undefined : input.applyPlan.sourceExecutionFingerprint,
    status,
    targetRfqId: status === "blocked" ? undefined : input.applyPlan.targetRfqId,
    warnings: executionWarnings(input.applyPlan, commands),
  }

  return {
    ...run,
    executionFingerprint: fingerprintNonCncPromotedQuoteApplicationMutationApplyExecutionRun(run),
  }
}

export function fingerprintNonCncPromotedQuoteApplicationMutationApplyExecutionRun(
  run:
    | Omit<NonCncPromotedQuoteApplicationMutationApplyExecutionRun, "executionFingerprint">
    | NonCncPromotedQuoteApplicationMutationApplyExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    applicationId: run.applicationId,
    applicationRecordId: run.applicationRecordId,
    applyPlanId: run.applyPlanId,
    commands: run.commands,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    mode: run.mode,
    mutationBoundary: run.mutationBoundary,
    mutationPackageId: run.mutationPackageId,
    nextActions: run.nextActions,
    packageId: run.packageId,
    planVersion: run.planVersion,
    selectedPlanId: run.selectedPlanId,
    sourceExecutionFingerprint: run.sourceExecutionFingerprint,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
  })
  return `non-cnc-promoted-quote-application-mutation-apply-execution-${fingerprint(stablePayload)}`
}

function buildCommandExecution(input: {
  applyPlanId: string
  command: NonCncPromotedQuoteApplicationMutationApplyCommand
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionMode
  outcome?: NormalizedCommandOutcome
  planStatus: NonCncPromotedQuoteApplicationMutationApplyPlan["status"]
}): NonCncPromotedQuoteApplicationMutationApplyCommandExecution {
  const status = commandExecutionStatus(input.command, input.mode, input.outcome, input.planStatus)
  const executable = status === "applied" || status === "failed"
  return {
    applicationTargetId: status === "blocked" ? undefined : input.command.applicationTargetId,
    blockerLabels: [...input.command.blockerLabels],
    externalId: executable ? input.outcome?.externalId : undefined,
    idempotencyKey: applyCommandIdempotencyKey(input.applyPlanId, input.command.key, input.command.mutationTarget),
    key: input.command.key,
    label: input.command.label,
    message: executable ? input.outcome?.message : undefined,
    mutationTarget: input.command.mutationTarget,
    reviewWarnings: [...input.command.reviewWarnings],
    sourceExecutionFingerprint: status === "blocked" ? undefined : input.command.sourceExecutionFingerprint,
    status,
    targetRfqId: status === "blocked" ? undefined : input.command.targetRfqId,
    warnings: executable ? input.outcome?.warnings ?? [] : [],
  }
}

function commandExecutionStatus(
  command: NonCncPromotedQuoteApplicationMutationApplyCommand,
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
  planStatus: NonCncPromotedQuoteApplicationMutationApplyPlan["status"],
): NonCncPromotedQuoteApplicationMutationApplyCommandExecutionStatus {
  if (planStatus === "blocked" || command.status === "blocked" || !command.applicationTargetId) {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  applyPlan: NonCncPromotedQuoteApplicationMutationApplyPlan,
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionMode,
  commands: NonCncPromotedQuoteApplicationMutationApplyCommandExecution[],
): NonCncPromotedQuoteApplicationMutationApplyExecutionStatus {
  if (applyPlan.status === "blocked" || commands.some((command) => command.status === "blocked")) {
    return "blocked"
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
  applyPlan: NonCncPromotedQuoteApplicationMutationApplyPlan,
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionMode,
  commands: NonCncPromotedQuoteApplicationMutationApplyCommandExecution[],
  status: NonCncPromotedQuoteApplicationMutationApplyExecutionStatus,
): string[] {
  if (status === "blocked") {
    const commandBlockers = commands.flatMap((command) =>
      command.status === "blocked" ? command.blockerLabels.map((label) => `${command.label}: ${label}`) : [],
    )
    if (applyPlan.blockerLabels.length > 0 || commandBlockers.length > 0) {
      return [...applyPlan.blockerLabels, ...commandBlockers]
    }
    return [applyPlan.nextOperatorMessage]
  }
  if (mode === "dry_run") {
    return [`Review ${commands.length} prepared non-CNC application mutation apply command${commands.length === 1 ? "" : "s"} before committing.`]
  }
  if (status === "succeeded") {
    return ["Non-CNC application mutation apply execution completed."]
  }
  if (status === "pending") {
    return [`Record apply outcomes for ${commands.length} non-CNC application mutation command${commands.length === 1 ? "" : "s"}.`]
  }
  return [
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed non-CNC application mutation apply command: ${command.label}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record apply outcome for non-CNC application mutation command: ${command.label}.`),
  ]
}

function executionWarnings(
  applyPlan: NonCncPromotedQuoteApplicationMutationApplyPlan,
  commands: NonCncPromotedQuoteApplicationMutationApplyCommandExecution[],
): string[] {
  return [
    ...applyPlan.reviewWarnings,
    ...commands.flatMap((command) => command.reviewWarnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.label} failed: ${command.message ?? "No failure detail provided."}`),
  ]
}

function normalizeCommandOutcomes(
  commands: NonCncPromotedQuoteApplicationMutationApplyCommand[],
  outcomes: NonCncPromotedQuoteApplicationMutationApplyCommandOutcomeInput[],
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionMode,
): Map<string, NormalizedCommandOutcome> {
  const commandsByIdentity = new Map(commands.map((command) => [commandIdentity(command), command]))
  const normalized = new Map<string, NormalizedCommandOutcome>()

  for (const outcome of outcomes) {
    const key = nonBlank(outcome.key, "commandOutcomes.key") as NonCncPromotedQuoteApplicationMutationApplyCommand["key"]
    const mutationTarget = nonBlank(outcome.mutationTarget, "commandOutcomes.mutationTarget") as
      NonCncPromotedQuoteApplicationMutationApplyCommand["mutationTarget"]
    const identity = commandIdentity({ key, mutationTarget })
    if (!commandsByIdentity.has(identity)) {
      throw new Error(`command outcome ${key}:${mutationTarget} does not match a non-CNC application mutation apply command`)
    }
    if (mode === "dry_run") {
      throw new Error(`command outcome ${key}:${mutationTarget} cannot be recorded for a dry-run non-CNC application mutation apply execution`)
    }
    const command = commandsByIdentity.get(identity)
    if (!command || command.status === "blocked" || !command.applicationTargetId) {
      throw new Error(`command outcome ${key}:${mutationTarget} cannot be recorded for a blocked non-CNC application mutation apply command`)
    }
    if (normalized.has(identity)) {
      throw new Error(`duplicate command outcome ${key}:${mutationTarget}`)
    }
    normalized.set(identity, {
      externalId: optionalTrim(outcome.externalId),
      key,
      message: optionalTrim(outcome.message),
      mutationTarget,
      status: normalizeOutcomeStatus(outcome.status, identity),
      warnings: normalizeWarnings(outcome.warnings ?? []),
    })
  }

  return new Map([...normalized.entries()].sort(([left], [right]) => compareLex(left, right)))
}

function commandIdentity({
  key,
  mutationTarget,
}: Pick<NonCncPromotedQuoteApplicationMutationApplyCommand, "key" | "mutationTarget">): string {
  return `${key}\u0000${mutationTarget}`
}

function normalizeMode(
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionMode,
): NonCncPromotedQuoteApplicationMutationApplyExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(
  status: NonCncPromotedQuoteApplicationMutationApplyCommandOutcomeInput["status"],
  identity: string,
): "applied" | "failed" {
  if (status !== "applied" && status !== "failed") {
    throw new Error(`command outcome ${identity} status must be applied or failed`)
  }
  return status
}

function normalizeWarnings(warnings: string[]): string[] {
  return warnings.map((warning) => optionalTrim(warning)).filter((warning): warning is string => Boolean(warning))
}

function applyCommandIdempotencyKey(applyPlanId: string, commandKey: string, mutationTarget: string): string {
  return ["non-cnc-application-mutation-apply-execution", applyPlanId, commandKey, mutationTarget].map(sanitizeKeyPart).join(":")
}

function sanitizeKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
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
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}
