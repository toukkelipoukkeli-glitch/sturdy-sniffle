import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteApplicationCommandRecord,
  NonCncPromotedQuoteApplicationRecord,
} from "./nonCncPromotedQuoteApplicationPersistence"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_VERSION = "non-cnc-promoted-quote-application-execution.v1"

export type NonCncPromotedQuoteApplicationExecutionMode = "commit" | "dry_run"
export type NonCncPromotedQuoteApplicationExecutionStatus = "blocked" | "failed" | "partial" | "pending" | "prepared" | "succeeded"
export type NonCncPromotedQuoteApplicationCommandExecutionStatus = "applied" | "blocked" | "failed" | "pending" | "prepared"

export interface NonCncPromotedQuoteApplicationCommandOutcomeInput {
  key: string
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface NonCncPromotedQuoteApplicationCommandExecution {
  key: NonCncPromotedQuoteApplicationCommandRecord["key"]
  label: string
  detail: string
  status: NonCncPromotedQuoteApplicationCommandExecutionStatus
  idempotencyKey: string
  externalId?: string
  message?: string
  warnings: string[]
}

export interface NonCncPromotedQuoteApplicationExecutionRun {
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  applicationId: string
  applicationRecordId: string
  executedAt: string
  mode: NonCncPromotedQuoteApplicationExecutionMode
  status: NonCncPromotedQuoteApplicationExecutionStatus
  packageId: string
  selectedPlanId: string
  targetRfqId: string
  commands: NonCncPromotedQuoteApplicationCommandExecution[]
  nextActions: string[]
  warnings: string[]
}

export interface BuildNonCncPromotedQuoteApplicationExecutionRunInput {
  actor: string
  applicationRecord: NonCncPromotedQuoteApplicationRecord
  commandOutcomes?: NonCncPromotedQuoteApplicationCommandOutcomeInput[]
  executedAt: string
  mode: NonCncPromotedQuoteApplicationExecutionMode
}

interface NormalizedCommandOutcome {
  key: NonCncPromotedQuoteApplicationCommandRecord["key"]
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings: string[]
}

export function buildNonCncPromotedQuoteApplicationExecutionRun(
  input: BuildNonCncPromotedQuoteApplicationExecutionRunInput,
): NonCncPromotedQuoteApplicationExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const outcomesByKey = normalizeCommandOutcomes(input.applicationRecord.commands, input.commandOutcomes ?? [], mode)
  const commands = input.applicationRecord.commands.map((command) =>
    buildCommandExecution({
      applicationId: input.applicationRecord.applicationId,
      command,
      mode,
      outcome: outcomesByKey.get(command.key),
      recordStatus: input.applicationRecord.status,
    }),
  )
  const status = executionStatus(input.applicationRecord, mode, commands)

  const run: Omit<NonCncPromotedQuoteApplicationExecutionRun, "executionFingerprint"> = {
    actor,
    applicationId: input.applicationRecord.applicationId,
    applicationRecordId: input.applicationRecord.applicationRecordId,
    commands,
    executedAt,
    executionVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_VERSION,
    mode,
    nextActions: executionNextActions(input.applicationRecord, mode, commands, status),
    packageId: input.applicationRecord.packageId,
    selectedPlanId: input.applicationRecord.selectedPlanId,
    status,
    targetRfqId: input.applicationRecord.targetRfqId,
    warnings: executionWarnings(input.applicationRecord, commands),
  }

  return {
    ...run,
    executionFingerprint: fingerprintNonCncPromotedQuoteApplicationExecutionRun(run),
  }
}

export function fingerprintNonCncPromotedQuoteApplicationExecutionRun(
  run: Omit<NonCncPromotedQuoteApplicationExecutionRun, "executionFingerprint"> | NonCncPromotedQuoteApplicationExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    applicationId: run.applicationId,
    applicationRecordId: run.applicationRecordId,
    commands: run.commands,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    mode: run.mode,
    nextActions: run.nextActions,
    packageId: run.packageId,
    selectedPlanId: run.selectedPlanId,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
  })
  return `non-cnc-promoted-quote-application-execution-${fingerprint(stablePayload)}`
}

function buildCommandExecution(input: {
  applicationId: string
  command: NonCncPromotedQuoteApplicationCommandRecord
  mode: NonCncPromotedQuoteApplicationExecutionMode
  outcome?: NormalizedCommandOutcome
  recordStatus: NonCncPromotedQuoteApplicationRecord["status"]
}): NonCncPromotedQuoteApplicationCommandExecution {
  const status = commandExecutionStatus(input.command, input.mode, input.outcome, input.recordStatus)
  const canExposeExternalId = status !== "blocked" && input.command.externalId !== undefined
  return {
    detail: input.command.detail,
    externalId: canExposeExternalId ? input.command.externalId : undefined,
    idempotencyKey: applicationCommandIdempotencyKey(input.applicationId, input.command.key),
    key: input.command.key,
    label: input.command.label,
    message: status === "applied" || status === "failed" ? input.outcome?.message : undefined,
    status,
    warnings: status === "applied" || status === "failed" ? input.outcome?.warnings ?? [] : [],
  }
}

function commandExecutionStatus(
  command: NonCncPromotedQuoteApplicationCommandRecord,
  mode: NonCncPromotedQuoteApplicationExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
  recordStatus: NonCncPromotedQuoteApplicationRecord["status"],
): NonCncPromotedQuoteApplicationCommandExecutionStatus {
  if (recordStatus === "blocked" || command.status === "blocked" || !command.externalId) {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  applicationRecord: NonCncPromotedQuoteApplicationRecord,
  mode: NonCncPromotedQuoteApplicationExecutionMode,
  commands: NonCncPromotedQuoteApplicationCommandExecution[],
): NonCncPromotedQuoteApplicationExecutionStatus {
  if (applicationRecord.status === "blocked" || commands.some((command) => command.status === "blocked")) {
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
  applicationRecord: NonCncPromotedQuoteApplicationRecord,
  mode: NonCncPromotedQuoteApplicationExecutionMode,
  commands: NonCncPromotedQuoteApplicationCommandExecution[],
  status: NonCncPromotedQuoteApplicationExecutionStatus,
): string[] {
  if (status === "blocked") {
    return applicationRecord.blockerLabels.length > 0
      ? [...applicationRecord.blockerLabels]
      : ["Application record is review-only and cannot mutate the active RFQ quote."]
  }
  if (mode === "dry_run") {
    return [`Review ${commands.length} prepared non-CNC application command${commands.length === 1 ? "" : "s"} before committing.`]
  }
  if (status === "succeeded") {
    return ["Non-CNC promoted quote application completed."]
  }
  if (status === "pending") {
    return [`Record application outcomes for ${commands.length} non-CNC application command${commands.length === 1 ? "" : "s"}.`]
  }
  return [
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed non-CNC application command: ${command.label}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record application outcome for non-CNC application command: ${command.label}.`),
  ]
}

function executionWarnings(
  applicationRecord: NonCncPromotedQuoteApplicationRecord,
  commands: NonCncPromotedQuoteApplicationCommandExecution[],
): string[] {
  return [
    ...applicationRecord.reviewWarnings,
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.label} failed: ${command.message ?? "No failure detail provided."}`),
  ]
}

function normalizeCommandOutcomes(
  commands: NonCncPromotedQuoteApplicationCommandRecord[],
  outcomes: NonCncPromotedQuoteApplicationCommandOutcomeInput[],
  mode: NonCncPromotedQuoteApplicationExecutionMode,
): Map<NonCncPromotedQuoteApplicationCommandRecord["key"], NormalizedCommandOutcome> {
  const commandKeys = new Set(commands.map((command) => command.key))
  const commandsByKey = new Map(commands.map((command) => [command.key, command]))
  const normalized = new Map<NonCncPromotedQuoteApplicationCommandRecord["key"], NormalizedCommandOutcome>()

  for (const outcome of outcomes) {
    const key = nonBlank(outcome.key, "commandOutcomes.key") as NonCncPromotedQuoteApplicationCommandRecord["key"]
    if (!commandKeys.has(key)) {
      throw new Error(`command outcome ${key} does not match a non-CNC application command`)
    }
    if (mode === "dry_run") {
      throw new Error(`command outcome ${key} cannot be recorded for a dry-run non-CNC application execution`)
    }
    const command = commandsByKey.get(key)
    if (!command || command.status === "blocked" || !command.externalId) {
      throw new Error(`command outcome ${key} cannot be recorded for a blocked non-CNC application command`)
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

function normalizeMode(mode: NonCncPromotedQuoteApplicationExecutionMode): NonCncPromotedQuoteApplicationExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(status: NonCncPromotedQuoteApplicationCommandOutcomeInput["status"], key: string): "applied" | "failed" {
  if (status !== "applied" && status !== "failed") {
    throw new Error(`command outcome ${key} status must be applied or failed`)
  }
  return status
}

function normalizeWarnings(warnings: string[]): string[] {
  return warnings.map((warning) => optionalTrim(warning)).filter((warning): warning is string => Boolean(warning))
}

function applicationCommandIdempotencyKey(applicationId: string, commandKey: string): string {
  return ["non-cnc-application-execution", applicationId, commandKey].map(sanitizeKeyPart).join(":")
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
