import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommand,
  NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind,
  NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-execution.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode = "commit" | "dry_run"
export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus =
  | "blocked"
  | "failed"
  | "partial"
  | "pending"
  | "prepared"
  | "succeeded"
  | "withheld"
export type NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus =
  | "blocked"
  | "failed"
  | "pending"
  | "prepared"
  | "succeeded"
  | "withheld"

export interface NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput {
  key: string
  status: "failed" | "succeeded"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution {
  key: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind
  kind: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommand["target"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus
  blockerLabels: string[]
  evidenceFingerprints: string[]
  warnings: string[]
  externalId?: string
  idempotencyKey?: string
  message?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun {
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  executedAt: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus
  planId: string
  planVersion: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan["planVersion"]
  planFingerprint: string
  decisionFingerprint: string
  decisionStatus: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan["decisionStatus"]
  adapterAction: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan["adapterAction"]
  commandCount: number
  plannedCommandCount: number
  withheldCommandCount: number
  blockedCommandCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution[]
  nextActions: string[]
  warnings: string[]
  adapterExecutionBoundary: string
  latestExecutionFingerprint?: string
  latestPackageId?: string
  latestPlanId?: string
  latestReleaseExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  targetRfqId?: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRunInput {
  actor: string
  commandOutcomes?: NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput[]
  executedAt: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode
  plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan
}

interface NormalizedCommandOutcome {
  key: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind
  status: "failed" | "succeeded"
  externalId?: string
  message?: string
  warnings: string[]
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun(
  input: BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRunInput,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const outcomesByKey = normalizeCommandOutcomes(input.plan.commands, input.commandOutcomes ?? [], mode)
  const commands = input.plan.commands.map((command) =>
    buildCommandExecution({
      command,
      mode,
      outcome: outcomesByKey.get(command.key),
    }),
  )
  const status = executionStatus(input.plan, mode, commands)
  const exposesLiveEvidence = !["blocked", "withheld"].includes(status)

  const run: Omit<NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun, "executionFingerprint"> = {
    actor,
    adapterAction: input.plan.adapterAction,
    adapterExecutionBoundary:
      "Live-adapter execution runs are deterministic audit records only; this adapter does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
    blockedCommandCount: commands.filter((command) => command.status === "blocked").length,
    commandCount: commands.length,
    commands,
    decisionFingerprint: input.plan.decisionFingerprint,
    decisionStatus: input.plan.decisionStatus,
    executedAt,
    executionVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_VERSION,
    latestExecutionFingerprint: exposesLiveEvidence ? input.plan.latestExecutionFingerprint : undefined,
    latestPackageId: exposesLiveEvidence ? input.plan.latestPackageId : undefined,
    latestPlanId: exposesLiveEvidence ? input.plan.latestPlanId : undefined,
    latestReleaseExecutionFingerprint: exposesLiveEvidence ? input.plan.latestReleaseExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: exposesLiveEvidence ? input.plan.latestSourceExecutionFingerprint : undefined,
    mode,
    nextActions: executionNextActions(input.plan, mode, commands, status),
    planFingerprint: input.plan.planFingerprint,
    planId: input.plan.planId,
    plannedCommandCount: commands.filter((command) => command.status === "prepared" || command.status === "pending" || command.status === "failed" || command.status === "succeeded").length,
    planVersion: input.plan.planVersion,
    status,
    targetRfqId: exposesLiveEvidence ? input.plan.targetRfqId : undefined,
    warnings: executionWarnings(input.plan, commands),
    withheldCommandCount: commands.filter((command) => command.status === "withheld").length,
  }

  return {
    ...run,
    executionFingerprint: fingerprintNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun(run),
  }
}

export function fingerprintNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun(
  run:
    | Omit<NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun, "executionFingerprint">
    | NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    adapterAction: run.adapterAction,
    adapterExecutionBoundary: run.adapterExecutionBoundary,
    blockedCommandCount: run.blockedCommandCount,
    commandCount: run.commandCount,
    commands: run.commands,
    decisionFingerprint: run.decisionFingerprint,
    decisionStatus: run.decisionStatus,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    latestExecutionFingerprint: run.latestExecutionFingerprint,
    latestPackageId: run.latestPackageId,
    latestPlanId: run.latestPlanId,
    latestReleaseExecutionFingerprint: run.latestReleaseExecutionFingerprint,
    latestSourceExecutionFingerprint: run.latestSourceExecutionFingerprint,
    mode: run.mode,
    nextActions: run.nextActions,
    planFingerprint: run.planFingerprint,
    planId: run.planId,
    plannedCommandCount: run.plannedCommandCount,
    planVersion: run.planVersion,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
    withheldCommandCount: run.withheldCommandCount,
  })
  return `non-cnc-promoted-quote-offer-export-live-adapter-execution-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stablePayload)}`
}

function buildCommandExecution({
  command,
  mode,
  outcome,
}: {
  command: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommand
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode
  outcome?: NormalizedCommandOutcome
}): NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution {
  const status = commandExecutionStatus(command, mode, outcome)
  const exposesLiveEvidence = !["blocked", "withheld"].includes(status)
  const recordsOutcome = status === "failed" || status === "succeeded"

  return {
    blockerLabels: status === "blocked" || status === "withheld" ? [...command.blockerLabels] : [],
    evidenceFingerprints: exposesLiveEvidence ? [...command.evidenceFingerprints] : [],
    externalId: recordsOutcome ? outcome?.externalId : undefined,
    idempotencyKey: exposesLiveEvidence ? command.idempotencyKey : undefined,
    key: command.key,
    kind: command.kind,
    label: command.label,
    message: recordsOutcome ? outcome?.message : undefined,
    status,
    target: command.target,
    warnings: recordsOutcome ? outcome?.warnings ?? [] : [],
  }
}

function commandExecutionStatus(
  command: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommand,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus {
  if (command.status === "blocked") {
    return "blocked"
  }
  if (command.status === "withheld") {
    return "withheld"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution[],
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus {
  if (plan.status === "blocked" || commands.some((command) => command.status === "blocked")) {
    return "blocked"
  }
  if (plan.status === "fallback" || commands.some((command) => command.status === "withheld")) {
    return "withheld"
  }
  if (mode === "dry_run") {
    return "prepared"
  }

  const succeededCount = commands.filter((command) => command.status === "succeeded").length
  const failedCount = commands.filter((command) => command.status === "failed").length
  const pendingCount = commands.filter((command) => command.status === "pending").length
  if (succeededCount === commands.length) {
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
  plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution[],
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus,
): string[] {
  if (status === "blocked") {
    return uniqueLabels([
      ...plan.blockerLabels,
      ...commands.flatMap((command) => command.blockerLabels),
      "Resolve live-adapter execution blockers before recording outcomes.",
    ])
  }
  if (status === "withheld") {
    return uniqueLabels([
      ...plan.nextActionLabels,
      "Keep review-only local/mock fallback active until provider-write opt-in is explicitly enabled.",
    ])
  }
  if (mode === "dry_run") {
    return [`Review ${commands.length} prepared live-adapter command${commands.length === 1 ? "" : "s"} before committing.`]
  }
  if (status === "succeeded") {
    return ["Review the recorded live-adapter execution audit before wiring live customer-offer export state."]
  }
  if (status === "pending") {
    return [`Record live-adapter outcomes for ${commands.length} command${commands.length === 1 ? "" : "s"}.`]
  }
  return [
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed live-adapter command: ${command.label}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record live-adapter outcome for command: ${command.label}.`),
  ]
}

function executionWarnings(
  plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution[],
): string[] {
  return uniqueLabels([
    ...plan.reviewWarnings,
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.label} failed: ${command.message ?? "No failure detail provided."}`),
  ])
}

function normalizeCommandOutcomes(
  commands: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommand[],
  outcomes: NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput[],
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode,
): Map<NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind, NormalizedCommandOutcome> {
  const commandsByKey = new Map(commands.map((command) => [command.key, command]))
  const normalized = new Map<NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind, NormalizedCommandOutcome>()

  for (const [index, outcome] of outcomes.entries()) {
    const key = normalizeCommandKey(outcome.key, `commandOutcomes[${index}].key`)
    const command = commandsByKey.get(key)
    if (!command) {
      throw new Error(`command outcome ${key} does not match a live-adapter execution command`)
    }
    if (mode === "dry_run") {
      throw new Error(`command outcome ${key} cannot be recorded for a dry-run live-adapter execution`)
    }
    if (command.status !== "planned" || !command.idempotencyKey) {
      throw new Error(`command outcome ${key} cannot be recorded for a ${command.status} live-adapter execution command`)
    }
    if (normalized.has(key)) {
      throw new Error(`duplicate command outcome ${key}`)
    }
    normalized.set(key, {
      externalId: optionalTrim(outcome.externalId),
      key,
      message: optionalTrim(outcome.message),
      status: normalizeOutcomeStatus(outcome.status, key),
      warnings: uniqueLabels((outcome.warnings ?? []).map((warning) => warning.trim()).filter(Boolean)),
    })
  }

  return new Map([...normalized.entries()].sort(([left], [right]) => compareLex(left, right)))
}

function normalizeCommandKey(
  value: string,
  key: string,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind {
  const normalized = nonBlank(value, key)
  return normalized as NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput["status"],
  key: string,
): "failed" | "succeeded" {
  if (status !== "failed" && status !== "succeeded") {
    throw new Error(`command outcome ${key} status must be failed or succeeded`)
  }
  return status
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
