import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyCommand,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution.v1"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_MODES = [
  "commit",
  "dry_run",
] as const
export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_STATUSES = [
  "blocked",
  "failed",
  "partial",
  "pending",
  "prepared",
  "succeeded",
] as const
export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_COMMAND_EXECUTION_STATUSES = [
  "applied",
  "blocked",
  "failed",
  "pending",
  "prepared",
] as const

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_MODES)[number]
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_STATUSES)[number]
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_COMMAND_EXECUTION_STATUSES)[number]

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandOutcomeInput {
  key: string
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecution {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommand["target"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus
  blockerLabels: string[]
  evidenceFingerprints: string[]
  warnings: string[]
  externalId?: string
  idempotencyKey?: string
  message?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun {
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  executedAt: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus
  applyPlanId: string
  applyPlanVersion: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan["applyPlanVersion"]
  applyPlanFingerprint: string
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecution[]
  committedOutcomeCount: number
  historyRecordCount: number
  nextActions: string[]
  warnings: string[]
  adapterApplyExecutionBoundary: string
  latestCommitPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  targetRfqId?: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRunInput {
  actor: string
  applyPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan
  commandOutcomes?: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandOutcomeInput[]
  executedAt: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode
}

interface NormalizedCommandOutcome {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings: string[]
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun(
  input: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRunInput,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const outcomesByKey = normalizeCommandOutcomes(input.applyPlan.commands, input.commandOutcomes ?? [], mode)
  const commands = input.applyPlan.commands.map((command) =>
    buildCommandExecution({
      command,
      mode,
      outcome: outcomesByKey.get(command.key),
    }),
  )
  const status = executionStatus(input.applyPlan, mode, commands)
  const exposesLiveEvidence = status !== "blocked"

  const run: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun, "executionFingerprint"> = {
    actor,
    adapterApplyExecutionBoundary:
      "Live-adapter apply execution runs are deterministic audit records only; this adapter does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
    applyPlanFingerprint: input.applyPlan.applyPlanFingerprint,
    applyPlanId: input.applyPlan.applyPlanId,
    applyPlanVersion: input.applyPlan.applyPlanVersion,
    blockedCommandCount: commands.filter((command) => command.status === "blocked").length,
    commandCount: commands.length,
    commands,
    committedOutcomeCount: input.applyPlan.committedOutcomeCount,
    executedAt,
    executionVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_VERSION,
    historyRecordCount: input.applyPlan.historyRecordCount,
    latestCommitPlanId: exposesLiveEvidence ? input.applyPlan.latestCommitPlanId : undefined,
    latestCommitRecordId: exposesLiveEvidence ? input.applyPlan.latestCommitRecordId : undefined,
    latestCommittedExecutionFingerprint: exposesLiveEvidence
      ? input.applyPlan.latestCommittedExecutionFingerprint
      : undefined,
    latestSourceExecutionFingerprint: exposesLiveEvidence ? input.applyPlan.latestSourceExecutionFingerprint : undefined,
    mode,
    nextActions: executionNextActions(input.applyPlan, mode, commands, status),
    plannedCommandCount: commands.filter((command) =>
      command.status === "applied" || command.status === "failed" || command.status === "pending" || command.status === "prepared"
    ).length,
    status,
    targetRfqId: exposesLiveEvidence ? input.applyPlan.targetRfqId : undefined,
    warnings: executionWarnings(input.applyPlan, commands),
  }

  return {
    ...run,
    executionFingerprint: fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun(run),
  }
}

export function fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun(
  run:
    | Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun, "executionFingerprint">
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    adapterApplyExecutionBoundary: run.adapterApplyExecutionBoundary,
    applyPlanFingerprint: run.applyPlanFingerprint,
    applyPlanId: run.applyPlanId,
    applyPlanVersion: run.applyPlanVersion,
    blockedCommandCount: run.blockedCommandCount,
    commandCount: run.commandCount,
    commands: run.commands,
    committedOutcomeCount: run.committedOutcomeCount,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    historyRecordCount: run.historyRecordCount,
    latestCommitPlanId: run.latestCommitPlanId,
    latestCommitRecordId: run.latestCommitRecordId,
    latestCommittedExecutionFingerprint: run.latestCommittedExecutionFingerprint,
    latestSourceExecutionFingerprint: run.latestSourceExecutionFingerprint,
    mode: run.mode,
    nextActions: run.nextActions,
    plannedCommandCount: run.plannedCommandCount,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
  })
  return `non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stablePayload)}`
}

function buildCommandExecution({
  command,
  mode,
  outcome,
}: {
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommand
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode
  outcome?: NormalizedCommandOutcome
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecution {
  const status = commandExecutionStatus(command, mode, outcome)
  const recordsOutcome = status === "applied" || status === "failed"
  const exposesEvidence = status !== "blocked"

  return {
    blockerLabels: status === "blocked" ? [...command.blockerLabels] : [],
    evidenceFingerprints: exposesEvidence ? [...command.evidenceFingerprints] : [],
    externalId: recordsOutcome ? outcome?.externalId : undefined,
    idempotencyKey: exposesEvidence ? command.idempotencyKey : undefined,
    key: command.key,
    label: command.label,
    message: recordsOutcome ? outcome?.message : undefined,
    status,
    target: command.target,
    warnings: recordsOutcome ? outcome?.warnings ?? [] : [],
  }
}

function commandExecutionStatus(
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommand,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecutionStatus {
  if (command.status === "blocked") {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  applyPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecution[],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus {
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
  applyPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecution[],
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionStatus,
): string[] {
  if (status === "blocked") {
    return uniqueLabels([
      ...applyPlan.blockerLabels,
      ...commands.flatMap((command) => command.blockerLabels),
      "Resolve live-adapter apply blockers before recording apply outcomes.",
    ])
  }
  if (mode === "dry_run") {
    return [`Review ${formatCount(commands.length, "prepared live-adapter apply command")} before committing.`]
  }
  if (status === "succeeded") {
    return ["Review the recorded live-adapter apply audit before wiring live customer-offer export state."]
  }
  if (status === "pending") {
    return [`Record live-adapter apply outcomes for ${formatCount(commands.length, "command")}.`]
  }
  return [
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed live-adapter apply command: ${command.label}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record live-adapter apply outcome for command: ${command.label}.`),
  ]
}

function executionWarnings(
  applyPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandExecution[],
): string[] {
  return uniqueLabels([
    ...applyPlan.reviewWarnings,
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.label} failed: ${command.message ?? "No failure detail provided."}`),
  ])
}

function normalizeCommandOutcomes(
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommand[],
  outcomes: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandOutcomeInput[],
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode,
): Map<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind, NormalizedCommandOutcome> {
  const commandsByKey = new Map(commands.map((command) => [command.key, command]))
  const normalized = new Map<NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind, NormalizedCommandOutcome>()

  for (const [index, outcome] of outcomes.entries()) {
    const key = normalizeCommandKey(outcome.key, `commandOutcomes[${index}].key`)
    const command = commandsByKey.get(key)
    if (!command) {
      throw new Error(`command outcome ${key} does not match a live-adapter apply command`)
    }
    if (mode === "dry_run") {
      throw new Error(`command outcome ${key} cannot be recorded for a dry-run live-adapter apply execution`)
    }
    if (command.status !== "planned" || !command.idempotencyKey) {
      throw new Error(`command outcome ${key} cannot be recorded for a ${command.status} live-adapter apply command`)
    }
    if (normalized.has(key)) {
      throw new Error(`duplicate command outcome ${key}`)
    }
    normalized.set(key, {
      externalId: optionalTrim(outcome.externalId),
      key,
      message: optionalTrim(outcome.message),
      status: normalizeOutcomeStatus(outcome.status, key),
      warnings: uniqueLabels((outcome.warnings ?? []).map((warning) => optionalTrim(warning)).filter(isString)),
    })
  }

  return new Map([...normalized.entries()].sort(([left], [right]) => compareLex(left, right)))
}

function normalizeCommandKey(
  value: string,
  key: string,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind {
  const normalized = nonBlank(value, key)
  return normalized as NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandOutcomeInput["status"],
  key: string,
): "applied" | "failed" {
  if (status !== "applied" && status !== "failed") {
    throw new Error(`command outcome ${key} status must be applied or failed`)
  }
  return status
}

function isString(value: string | undefined): value is string {
  return typeof value === "string"
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}
