import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type {
  NonCncQuotePromotionCommandPackage,
  NonCncQuotePromotionCommandPackageCommand,
  NonCncQuotePromotionCommandPackagePayload,
} from "./nonCncQuotePromotionCommandPackage"

export const NON_CNC_QUOTE_PROMOTION_EXECUTION_VERSION = "non-cnc-quote-promotion-execution.v1"

export type NonCncQuotePromotionExecutionMode = "commit" | "dry_run"
export type NonCncQuotePromotionExecutionStatus = "blocked" | "failed" | "partial" | "pending" | "prepared" | "succeeded"
export type NonCncQuotePromotionCommandExecutionStatus = "applied" | "blocked" | "failed" | "pending" | "prepared"

export interface NonCncQuotePromotionCommandOutcomeInput {
  key: string
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface NonCncQuotePromotionCommandExecution {
  key: NonCncQuotePromotionCommandPackageCommand["key"]
  label: string
  status: NonCncQuotePromotionCommandExecutionStatus
  idempotencyKey: string
  blockerLabels: string[]
  reviewWarnings: string[]
  externalId?: string
  message?: string
  payload?: NonCncQuotePromotionCommandPackagePayload
  warnings: string[]
}

export interface NonCncQuotePromotionExecutionRun {
  executionVersion: typeof NON_CNC_QUOTE_PROMOTION_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  executedAt: string
  mode: NonCncQuotePromotionExecutionMode
  status: NonCncQuotePromotionExecutionStatus
  packageId: string
  packageVersion: NonCncQuotePromotionCommandPackage["packageVersion"]
  selectedPlanId: string
  targetRfqId?: string
  commands: NonCncQuotePromotionCommandExecution[]
  nextActions: string[]
  warnings: string[]
}

export interface BuildNonCncQuotePromotionExecutionRunInput {
  actor: string
  executedAt: string
  mode: NonCncQuotePromotionExecutionMode
  commandPackage: NonCncQuotePromotionCommandPackage
  commandOutcomes?: NonCncQuotePromotionCommandOutcomeInput[]
}

export function buildNonCncQuotePromotionExecutionRun(
  input: BuildNonCncQuotePromotionExecutionRunInput,
): NonCncQuotePromotionExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const outcomesByKey = normalizeCommandOutcomes(input.commandPackage.commands, input.commandOutcomes ?? [])
  const commands = input.commandPackage.commands.map((command) =>
    buildCommandExecution({
      command,
      mode,
      outcome: outcomesByKey.get(command.key),
      packageId: input.commandPackage.packageId,
    }),
  )
  const status = executionStatus(input.commandPackage, mode, commands)

  const run: Omit<NonCncQuotePromotionExecutionRun, "executionFingerprint"> = {
    actor,
    commands,
    executedAt,
    executionVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_VERSION,
    mode,
    nextActions: executionNextActions(input.commandPackage, mode, commands, status),
    packageId: input.commandPackage.packageId,
    packageVersion: input.commandPackage.packageVersion,
    selectedPlanId: input.commandPackage.selectedPlanId,
    status,
    targetRfqId: input.commandPackage.targetRfqId,
    warnings: executionWarnings(input.commandPackage, commands),
  }

  return {
    ...run,
    executionFingerprint: fingerprintNonCncQuotePromotionExecutionRun(run),
  }
}

export function fingerprintNonCncQuotePromotionExecutionRun(
  run: Omit<NonCncQuotePromotionExecutionRun, "executionFingerprint"> | NonCncQuotePromotionExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    commands: run.commands,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    mode: run.mode,
    nextActions: run.nextActions,
    packageId: run.packageId,
    packageVersion: run.packageVersion,
    selectedPlanId: run.selectedPlanId,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
  })
  return `non-cnc-quote-promotion-execution-${fingerprint(stablePayload)}`
}

function buildCommandExecution(input: {
  command: NonCncQuotePromotionCommandPackageCommand
  mode: NonCncQuotePromotionExecutionMode
  outcome?: NormalizedCommandOutcome
  packageId: string
}): NonCncQuotePromotionCommandExecution {
  const status = commandExecutionStatus(input.command, input.mode, input.outcome)
  const externalId = optionalTrim(input.outcome?.externalId)
  const message = optionalTrim(input.outcome?.message)
  return {
    blockerLabels: [...input.command.blockerLabels],
    externalId,
    idempotencyKey: promotionCommandIdempotencyKey(input.packageId, input.command.key),
    key: input.command.key,
    label: input.command.label,
    message,
    payload: input.command.payload ? clonePayload(input.command.payload) : undefined,
    reviewWarnings: [...input.command.reviewWarnings],
    status,
    warnings: input.outcome?.warnings ?? [],
  }
}

function commandExecutionStatus(
  command: NonCncQuotePromotionCommandPackageCommand,
  mode: NonCncQuotePromotionExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
): NonCncQuotePromotionCommandExecutionStatus {
  if (command.status === "blocked" || !command.payload) {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  commandPackage: NonCncQuotePromotionCommandPackage,
  mode: NonCncQuotePromotionExecutionMode,
  commands: NonCncQuotePromotionCommandExecution[],
): NonCncQuotePromotionExecutionStatus {
  if (commandPackage.status === "blocked" || commands.some((command) => command.status === "blocked")) {
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
  commandPackage: NonCncQuotePromotionCommandPackage,
  mode: NonCncQuotePromotionExecutionMode,
  commands: NonCncQuotePromotionCommandExecution[],
  status: NonCncQuotePromotionExecutionStatus,
): string[] {
  if (status === "blocked") {
    return commandPackage.blockerLabels.length > 0 ? commandPackage.blockerLabels : [commandPackage.nextOperatorMessage]
  }
  if (mode === "dry_run") {
    return [`Review ${commands.length} prepared non-CNC promotion command${commands.length === 1 ? "" : "s"} before committing.`]
  }
  if (status === "succeeded") {
    return ["Non-CNC quote promotion execution completed."]
  }
  if (status === "pending") {
    return [`Record execution outcomes for ${commands.length} non-CNC promotion command${commands.length === 1 ? "" : "s"}.`]
  }
  return [
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed non-CNC promotion command: ${command.label}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record execution outcome for non-CNC promotion command: ${command.label}.`),
  ]
}

function executionWarnings(
  commandPackage: NonCncQuotePromotionCommandPackage,
  commands: NonCncQuotePromotionCommandExecution[],
): string[] {
  return [
    ...commandPackage.reviewWarnings,
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.label} failed: ${command.message ?? "No failure detail provided."}`),
  ]
}

interface NormalizedCommandOutcome {
  key: NonCncQuotePromotionCommandPackageCommand["key"]
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings: string[]
}

function normalizeCommandOutcomes(
  commands: NonCncQuotePromotionCommandPackageCommand[],
  outcomes: NonCncQuotePromotionCommandOutcomeInput[],
): Map<NonCncQuotePromotionCommandPackageCommand["key"], NormalizedCommandOutcome> {
  const commandKeys = new Set(commands.map((command) => command.key))
  const normalized = new Map<NonCncQuotePromotionCommandPackageCommand["key"], NormalizedCommandOutcome>()

  for (const outcome of outcomes) {
    const key = nonBlank(outcome.key, "commandOutcomes.key") as NonCncQuotePromotionCommandPackageCommand["key"]
    if (!commandKeys.has(key)) {
      throw new Error(`command outcome ${key} does not match a non-CNC promotion command`)
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

function normalizeMode(mode: NonCncQuotePromotionExecutionMode): NonCncQuotePromotionExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(status: NonCncQuotePromotionCommandOutcomeInput["status"], key: string): "applied" | "failed" {
  if (status !== "applied" && status !== "failed") {
    throw new Error(`command outcome ${key} status must be applied or failed`)
  }
  return status
}

function normalizeWarnings(warnings: string[]): string[] {
  return warnings.map((warning) => optionalTrim(warning)).filter((warning): warning is string => Boolean(warning))
}

function clonePayload(payload: NonCncQuotePromotionCommandPackagePayload): NonCncQuotePromotionCommandPackagePayload {
  if (payload.kind === "quote_snapshot") {
    return {
      kind: payload.kind,
      quoteSnapshot: { ...payload.quoteSnapshot },
      targetRfqId: payload.targetRfqId,
    }
  }
  return { ...payload }
}

function promotionCommandIdempotencyKey(packageId: string, commandKey: string): string {
  return ["non-cnc-promotion-execution", packageId, commandKey].map(sanitizeKeyPart).join(":")
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
