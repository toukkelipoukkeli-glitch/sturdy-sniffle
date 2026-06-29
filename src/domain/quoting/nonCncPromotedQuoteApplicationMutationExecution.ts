import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteApplicationMutationCommand,
  NonCncPromotedQuoteApplicationMutationPackage,
} from "./nonCncPromotedQuoteApplicationMutationPackage"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION =
  "non-cnc-promoted-quote-application-mutation-execution.v1"

export type NonCncPromotedQuoteApplicationMutationExecutionMode = "commit" | "dry_run"
export type NonCncPromotedQuoteApplicationMutationExecutionStatus =
  | "blocked"
  | "failed"
  | "partial"
  | "pending"
  | "prepared"
  | "succeeded"
export type NonCncPromotedQuoteApplicationMutationCommandExecutionStatus =
  | "applied"
  | "blocked"
  | "failed"
  | "pending"
  | "prepared"

export interface NonCncPromotedQuoteApplicationMutationCommandOutcomeInput {
  key: string
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface NonCncPromotedQuoteApplicationMutationCommandExecution {
  key: NonCncPromotedQuoteApplicationMutationCommand["key"]
  mutationTarget: NonCncPromotedQuoteApplicationMutationCommand["mutationTarget"]
  label: string
  status: NonCncPromotedQuoteApplicationMutationCommandExecutionStatus
  idempotencyKey: string
  blockerLabels: string[]
  reviewWarnings: string[]
  sourceExecutionFingerprint?: string
  targetRfqId?: string
  externalId?: string
  message?: string
  warnings: string[]
}

export interface NonCncPromotedQuoteApplicationMutationExecutionRun {
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  executedAt: string
  mode: NonCncPromotedQuoteApplicationMutationExecutionMode
  status: NonCncPromotedQuoteApplicationMutationExecutionStatus
  mutationPackageId: string
  packageVersion: NonCncPromotedQuoteApplicationMutationPackage["packageVersion"]
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  commands: NonCncPromotedQuoteApplicationMutationCommandExecution[]
  nextActions: string[]
  warnings: string[]
}

export interface BuildNonCncPromotedQuoteApplicationMutationExecutionRunInput {
  actor: string
  commandOutcomes?: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput[]
  executedAt: string
  mode: NonCncPromotedQuoteApplicationMutationExecutionMode
  mutationPackage: NonCncPromotedQuoteApplicationMutationPackage
}

interface NormalizedCommandOutcome {
  key: NonCncPromotedQuoteApplicationMutationCommand["key"]
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings: string[]
}

export function buildNonCncPromotedQuoteApplicationMutationExecutionRun(
  input: BuildNonCncPromotedQuoteApplicationMutationExecutionRunInput,
): NonCncPromotedQuoteApplicationMutationExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const outcomesByKey = normalizeCommandOutcomes(input.mutationPackage.commands, input.commandOutcomes ?? [], mode)
  const commands = input.mutationPackage.commands.map((command) =>
    buildCommandExecution({
      command,
      mode,
      mutationPackageId: input.mutationPackage.mutationPackageId,
      outcome: outcomesByKey.get(command.key),
      packageStatus: input.mutationPackage.status,
    }),
  )
  const status = executionStatus(input.mutationPackage, mode, commands)

  const run: Omit<NonCncPromotedQuoteApplicationMutationExecutionRun, "executionFingerprint"> = {
    actor,
    applicationId: input.mutationPackage.applicationId,
    applicationRecordId: input.mutationPackage.applicationRecordId,
    commands,
    executedAt,
    executionVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION,
    mode,
    mutationPackageId: input.mutationPackage.mutationPackageId,
    nextActions: executionNextActions(input.mutationPackage, mode, commands, status),
    packageId: input.mutationPackage.packageId,
    packageVersion: input.mutationPackage.packageVersion,
    selectedPlanId: input.mutationPackage.selectedPlanId,
    status,
    targetRfqId: input.mutationPackage.targetRfqId,
    warnings: executionWarnings(input.mutationPackage, commands),
  }

  return {
    ...run,
    executionFingerprint: fingerprintNonCncPromotedQuoteApplicationMutationExecutionRun(run),
  }
}

export function fingerprintNonCncPromotedQuoteApplicationMutationExecutionRun(
  run:
    | Omit<NonCncPromotedQuoteApplicationMutationExecutionRun, "executionFingerprint">
    | NonCncPromotedQuoteApplicationMutationExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    applicationId: run.applicationId,
    applicationRecordId: run.applicationRecordId,
    commands: run.commands,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    mode: run.mode,
    mutationPackageId: run.mutationPackageId,
    nextActions: run.nextActions,
    packageId: run.packageId,
    packageVersion: run.packageVersion,
    selectedPlanId: run.selectedPlanId,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
  })
  return `non-cnc-promoted-quote-application-mutation-execution-${fingerprint(stablePayload)}`
}

function buildCommandExecution(input: {
  command: NonCncPromotedQuoteApplicationMutationCommand
  mode: NonCncPromotedQuoteApplicationMutationExecutionMode
  mutationPackageId: string
  outcome?: NormalizedCommandOutcome
  packageStatus: NonCncPromotedQuoteApplicationMutationPackage["status"]
}): NonCncPromotedQuoteApplicationMutationCommandExecution {
  const status = commandExecutionStatus(input.command, input.mode, input.outcome, input.packageStatus)
  const executable = status === "applied" || status === "failed"
  return {
    blockerLabels: [...input.command.blockerLabels],
    externalId: executable ? input.outcome?.externalId : undefined,
    idempotencyKey: mutationCommandIdempotencyKey(input.mutationPackageId, input.command.key),
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
  command: NonCncPromotedQuoteApplicationMutationCommand,
  mode: NonCncPromotedQuoteApplicationMutationExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
  packageStatus: NonCncPromotedQuoteApplicationMutationPackage["status"],
): NonCncPromotedQuoteApplicationMutationCommandExecutionStatus {
  if (packageStatus === "blocked" || command.status === "blocked" || !command.targetRfqId || !command.sourceExecutionFingerprint) {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  mutationPackage: NonCncPromotedQuoteApplicationMutationPackage,
  mode: NonCncPromotedQuoteApplicationMutationExecutionMode,
  commands: NonCncPromotedQuoteApplicationMutationCommandExecution[],
): NonCncPromotedQuoteApplicationMutationExecutionStatus {
  if (mutationPackage.status === "blocked" || commands.some((command) => command.status === "blocked")) {
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
  mutationPackage: NonCncPromotedQuoteApplicationMutationPackage,
  mode: NonCncPromotedQuoteApplicationMutationExecutionMode,
  commands: NonCncPromotedQuoteApplicationMutationCommandExecution[],
  status: NonCncPromotedQuoteApplicationMutationExecutionStatus,
): string[] {
  if (status === "blocked") {
    const commandBlockers = commands.flatMap((command) =>
      command.status === "blocked" ? command.blockerLabels.map((label) => `${command.label}: ${label}`) : [],
    )
    if (mutationPackage.blockerLabels.length > 0 || commandBlockers.length > 0) {
      return [...mutationPackage.blockerLabels, ...commandBlockers]
    }
    return [mutationPackage.nextOperatorMessage]
  }
  if (mode === "dry_run") {
    return [`Review ${commands.length} prepared non-CNC application mutation command${commands.length === 1 ? "" : "s"} before committing.`]
  }
  if (status === "succeeded") {
    return ["Non-CNC application mutation package execution completed."]
  }
  if (status === "pending") {
    return [`Record mutation outcomes for ${commands.length} non-CNC application command${commands.length === 1 ? "" : "s"}.`]
  }
  return [
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed non-CNC application mutation command: ${command.label}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record mutation outcome for non-CNC application command: ${command.label}.`),
  ]
}

function executionWarnings(
  mutationPackage: NonCncPromotedQuoteApplicationMutationPackage,
  commands: NonCncPromotedQuoteApplicationMutationCommandExecution[],
): string[] {
  return [
    ...mutationPackage.reviewWarnings,
    ...commands.flatMap((command) => command.reviewWarnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.label} failed: ${command.message ?? "No failure detail provided."}`),
  ]
}

function normalizeCommandOutcomes(
  commands: NonCncPromotedQuoteApplicationMutationCommand[],
  outcomes: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput[],
  mode: NonCncPromotedQuoteApplicationMutationExecutionMode,
): Map<NonCncPromotedQuoteApplicationMutationCommand["key"], NormalizedCommandOutcome> {
  const commandKeys = new Set(commands.map((command) => command.key))
  const commandsByKey = new Map(commands.map((command) => [command.key, command]))
  const normalized = new Map<NonCncPromotedQuoteApplicationMutationCommand["key"], NormalizedCommandOutcome>()

  for (const outcome of outcomes) {
    const key = nonBlank(outcome.key, "commandOutcomes.key") as NonCncPromotedQuoteApplicationMutationCommand["key"]
    if (!commandKeys.has(key)) {
      throw new Error(`command outcome ${key} does not match a non-CNC application mutation command`)
    }
    if (mode === "dry_run") {
      throw new Error(`command outcome ${key} cannot be recorded for a dry-run non-CNC application mutation execution`)
    }
    const command = commandsByKey.get(key)
    if (!command || command.status === "blocked" || !command.targetRfqId || !command.sourceExecutionFingerprint) {
      throw new Error(`command outcome ${key} cannot be recorded for a blocked non-CNC application mutation command`)
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

function normalizeMode(
  mode: NonCncPromotedQuoteApplicationMutationExecutionMode,
): NonCncPromotedQuoteApplicationMutationExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(
  status: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput["status"],
  key: string,
): "applied" | "failed" {
  if (status !== "applied" && status !== "failed") {
    throw new Error(`command outcome ${key} status must be applied or failed`)
  }
  return status
}

function normalizeWarnings(warnings: string[]): string[] {
  return warnings.map((warning) => optionalTrim(warning)).filter((warning): warning is string => Boolean(warning))
}

function mutationCommandIdempotencyKey(mutationPackageId: string, commandKey: string): string {
  return ["non-cnc-application-mutation-execution", mutationPackageId, commandKey].map(sanitizeKeyPart).join(":")
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
