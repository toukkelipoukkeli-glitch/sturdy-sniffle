import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-execution.v1"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_MODES = [
  "commit",
  "dry_run",
] as const
export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_STATUSES = [
  "blocked",
  "failed",
  "partial",
  "pending",
  "prepared",
  "succeeded",
] as const
export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_COMMAND_EXECUTION_STATUSES = [
  "applied",
  "blocked",
  "failed",
  "pending",
  "prepared",
] as const

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_MODES)[number]
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionStatus =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_STATUSES)[number]
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecutionStatus =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_COMMAND_EXECUTION_STATUSES)[number]

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput {
  key: string
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand["target"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecutionStatus
  blockerLabels: string[]
  evidenceFingerprints: string[]
  warnings: string[]
  detail: string
  externalId?: string
  idempotencyKey?: string
  message?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun {
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  executedAt: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionStatus
  followThroughId: string
  followThroughVersion: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan["followThroughVersion"]
  followThroughFingerprint: string
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  appliedCommandCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution[]
  historyRecordCount: number
  readyRecordCount: number
  blockedRecordCount: number
  nextActions: string[]
  warnings: string[]
  adapterFinalGateFollowThroughExecutionBoundary: string
  readinessRecordId?: string
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  targetRfqId?: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRunInput {
  actor: string
  commandOutcomes?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput[]
  executedAt: string
  followThrough: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode
}

interface NormalizedCommandOutcome {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings: string[]
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun(
  input: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRunInput,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const outcomesByKey = normalizeCommandOutcomes(input.followThrough.commands, input.commandOutcomes ?? [], mode)
  const commands = input.followThrough.commands.map((command) =>
    buildCommandExecution({
      command,
      mode,
      outcome: outcomesByKey.get(command.key),
    }),
  )
  const status = executionStatus(input.followThrough, mode, commands)
  const exposesLiveEvidence = status !== "blocked"

  const run: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
    "executionFingerprint"
  > = {
    actor,
    adapterFinalGateFollowThroughExecutionBoundary:
      "Final-gate follow-through execution runs are deterministic audit records only; this adapter does not create customer offers, files, release reviews, exports, connector records, final-gate follow-through writes, or external side effects.",
    appliedCommandCount: commands.filter((command) => command.status === "applied").length,
    blockedCommandCount: commands.filter((command) => command.status === "blocked").length,
    blockedRecordCount: input.followThrough.blockedRecordCount,
    commandCount: commands.length,
    commands,
    executedAt,
    executionVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_VERSION,
    followThroughFingerprint: input.followThrough.followThroughFingerprint,
    followThroughId: input.followThrough.followThroughId,
    followThroughVersion: input.followThrough.followThroughVersion,
    historyRecordCount: input.followThrough.historyRecordCount,
    latestApplyPlanId: exposesLiveEvidence ? input.followThrough.latestApplyPlanId : undefined,
    latestCommitRecordId: exposesLiveEvidence ? input.followThrough.latestCommitRecordId : undefined,
    latestCommittedExecutionFingerprint: exposesLiveEvidence
      ? input.followThrough.latestCommittedExecutionFingerprint
      : undefined,
    latestExecutionFingerprint: exposesLiveEvidence ? input.followThrough.latestExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: exposesLiveEvidence ? input.followThrough.latestSourceExecutionFingerprint : undefined,
    mode,
    nextActions: executionNextActions(input.followThrough, mode, commands, status),
    plannedCommandCount: commands.filter((command) =>
      command.status === "applied" || command.status === "failed" || command.status === "pending" || command.status === "prepared"
    ).length,
    readinessRecordId: exposesLiveEvidence ? input.followThrough.readinessRecordId : undefined,
    readyRecordCount: input.followThrough.readyRecordCount,
    status,
    targetRfqId: exposesLiveEvidence ? input.followThrough.targetRfqId : undefined,
    warnings: executionWarnings(input.followThrough, commands),
  }

  return {
    ...run,
    executionFingerprint:
      fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun(run),
  }
}

export function fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun(
  run:
    | Omit<
        NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
        "executionFingerprint"
      >
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    adapterFinalGateFollowThroughExecutionBoundary: run.adapterFinalGateFollowThroughExecutionBoundary,
    appliedCommandCount: run.appliedCommandCount,
    blockedCommandCount: run.blockedCommandCount,
    blockedRecordCount: run.blockedRecordCount,
    commandCount: run.commandCount,
    commands: run.commands,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    followThroughFingerprint: run.followThroughFingerprint,
    followThroughId: run.followThroughId,
    followThroughVersion: run.followThroughVersion,
    historyRecordCount: run.historyRecordCount,
    latestApplyPlanId: run.latestApplyPlanId,
    latestCommitRecordId: run.latestCommitRecordId,
    latestCommittedExecutionFingerprint: run.latestCommittedExecutionFingerprint,
    latestExecutionFingerprint: run.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: run.latestSourceExecutionFingerprint,
    mode: run.mode,
    nextActions: run.nextActions,
    plannedCommandCount: run.plannedCommandCount,
    readinessRecordId: run.readinessRecordId,
    readyRecordCount: run.readyRecordCount,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
  })
  return `non-cnc-promoted-quote-offer-export-live-adapter-final-gate-follow-through-execution-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stablePayload)}`
}

function buildCommandExecution({
  command,
  mode,
  outcome,
}: {
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode
  outcome?: NormalizedCommandOutcome
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution {
  const status = commandExecutionStatus(command, mode, outcome)
  const recordsOutcome = status === "applied" || status === "failed"
  const exposesEvidence = status !== "blocked"

  return {
    blockerLabels: status === "blocked" ? [...command.blockerLabels] : [],
    detail: command.detail,
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
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecutionStatus {
  if (command.status === "blocked") {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  followThrough: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution[],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionStatus {
  if (followThrough.status === "blocked" || commands.some((command) => command.status === "blocked")) {
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
  followThrough: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution[],
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionStatus,
): string[] {
  if (status === "blocked") {
    return uniqueLabels([
      ...followThrough.blockerLabels,
      ...commands.flatMap((command) => command.blockerLabels),
      "Resolve final-gate follow-through blockers before recording execution outcomes.",
    ])
  }
  if (mode === "dry_run") {
    return [`Review ${formatCount(commands.length, "prepared final-gate follow-through command")} before committing.`]
  }
  if (status === "succeeded") {
    return ["Review the recorded final-gate follow-through execution audit before enabling live write adapters."]
  }
  if (status === "pending") {
    return [`Record final-gate follow-through outcomes for ${formatCount(commands.length, "command")}.`]
  }
  return [
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed final-gate follow-through command: ${command.label}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record final-gate follow-through outcome for command: ${command.label}.`),
  ]
}

function executionWarnings(
  followThrough: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution[],
): string[] {
  return uniqueLabels([
    ...followThrough.reviewWarnings,
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.label} failed: ${command.message ?? "No failure detail provided."}`),
  ])
}

function normalizeCommandOutcomes(
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand[],
  outcomes: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput[],
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode,
): Map<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind, NormalizedCommandOutcome> {
  const commandsByKey = new Map(commands.map((command) => [command.key, command]))
  const normalized =
    new Map<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind, NormalizedCommandOutcome>()

  for (const [index, outcome] of outcomes.entries()) {
    const key = normalizeCommandKey(outcome.key, `commandOutcomes[${index}].key`)
    const command = commandsByKey.get(key)
    if (!command) {
      throw new Error(`command outcome ${key} does not match a final-gate follow-through command`)
    }
    if (mode === "dry_run") {
      throw new Error(`command outcome ${key} cannot be recorded for a dry-run final-gate follow-through execution`)
    }
    if (command.status !== "planned" || !command.idempotencyKey) {
      throw new Error(`command outcome ${key} cannot be recorded for a ${command.status} final-gate follow-through command`)
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
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind {
  const normalized = nonBlank(value, key)
  return normalized as NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput["status"],
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
