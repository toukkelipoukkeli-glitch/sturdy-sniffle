import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteOfferCreationCommand,
  NonCncPromotedQuoteOfferCreationPlan,
} from "./nonCncPromotedQuoteOfferCreationPlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_VERSION = "non-cnc-promoted-quote-offer-creation-execution.v1"

export type NonCncPromotedQuoteOfferCreationExecutionMode = "commit" | "dry_run"
export type NonCncPromotedQuoteOfferCreationExecutionStatus = "blocked" | "failed" | "partial" | "pending" | "prepared" | "succeeded"
export type NonCncPromotedQuoteOfferCreationCommandExecutionStatus = "blocked" | "failed" | "pending" | "prepared" | "succeeded"

export interface NonCncPromotedQuoteOfferCreationCommandOutcomeInput {
  key: string
  status: "failed" | "succeeded"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface NonCncPromotedQuoteOfferCreationCommandExecution {
  key: NonCncPromotedQuoteOfferCreationCommand["key"]
  label: string
  status: NonCncPromotedQuoteOfferCreationCommandExecutionStatus
  idempotencyKey: string
  blockerLabels: string[]
  reviewWarnings: string[]
  targetRfqId?: string
  quoteExternalId?: string
  offerReadinessExternalId?: string
  offerBuilderExternalId?: string
  releaseExecutionFingerprint?: string
  externalId?: string
  message?: string
  warnings: string[]
}

export interface NonCncPromotedQuoteOfferCreationExecutionRun {
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  executedAt: string
  mode: NonCncPromotedQuoteOfferCreationExecutionMode
  status: NonCncPromotedQuoteOfferCreationExecutionStatus
  creationPlanId: string
  planVersion: NonCncPromotedQuoteOfferCreationPlan["planVersion"]
  packageId: string
  selectedPlanId: string
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  commandCount: number
  commands: NonCncPromotedQuoteOfferCreationCommandExecution[]
  nextActions: string[]
  warnings: string[]
  offerCreationBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferCreationExecutionRunInput {
  actor: string
  commandOutcomes?: NonCncPromotedQuoteOfferCreationCommandOutcomeInput[]
  executedAt: string
  mode: NonCncPromotedQuoteOfferCreationExecutionMode
  plan: NonCncPromotedQuoteOfferCreationPlan
}

interface NormalizedCommandOutcome {
  key: NonCncPromotedQuoteOfferCreationCommand["key"]
  status: "failed" | "succeeded"
  externalId?: string
  message?: string
  warnings: string[]
}

export function buildNonCncPromotedQuoteOfferCreationExecutionRun(
  input: BuildNonCncPromotedQuoteOfferCreationExecutionRunInput,
): NonCncPromotedQuoteOfferCreationExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const outcomesByKey = normalizeCommandOutcomes(input.plan.commands, input.commandOutcomes ?? [], mode)
  const commands = input.plan.commands.map((command) =>
    buildCommandExecution({
      command,
      mode,
      outcome: outcomesByKey.get(command.key),
      planStatus: input.plan.status,
    }),
  )
  const status = executionStatus(input.plan, mode, commands)

  const run: Omit<NonCncPromotedQuoteOfferCreationExecutionRun, "executionFingerprint"> = {
    actor,
    commandCount: commands.length,
    commands,
    creationPlanId: input.plan.creationPlanId,
    executedAt,
    executionVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_VERSION,
    mode,
    nextActions: executionNextActions(input.plan, mode, commands, status),
    offerCreationBoundary:
      "Offer creation execution runs are deterministic audit records only; this adapter does not create customer offers, export packages, release plans, or connector side effects.",
    packageId: input.plan.packageId,
    planVersion: input.plan.planVersion,
    releaseExecutionFingerprint: status === "blocked" ? undefined : input.plan.releaseExecutionFingerprint,
    selectedPlanId: input.plan.selectedPlanId,
    status,
    targetRfqId: status === "blocked" ? undefined : input.plan.targetRfqId,
    warnings: executionWarnings(input.plan, commands),
  }

  return {
    ...run,
    executionFingerprint: fingerprintNonCncPromotedQuoteOfferCreationExecutionRun(run),
  }
}

export function fingerprintNonCncPromotedQuoteOfferCreationExecutionRun(
  run:
    | Omit<NonCncPromotedQuoteOfferCreationExecutionRun, "executionFingerprint">
    | NonCncPromotedQuoteOfferCreationExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    commandCount: run.commandCount,
    commands: run.commands,
    creationPlanId: run.creationPlanId,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    mode: run.mode,
    nextActions: run.nextActions,
    offerCreationBoundary: run.offerCreationBoundary,
    packageId: run.packageId,
    planVersion: run.planVersion,
    releaseExecutionFingerprint: run.releaseExecutionFingerprint,
    selectedPlanId: run.selectedPlanId,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
  })
  return `non-cnc-promoted-quote-offer-creation-execution-${fingerprint(stablePayload)}`
}

function buildCommandExecution({
  command,
  mode,
  outcome,
  planStatus,
}: {
  command: NonCncPromotedQuoteOfferCreationCommand
  mode: NonCncPromotedQuoteOfferCreationExecutionMode
  outcome?: NormalizedCommandOutcome
  planStatus: NonCncPromotedQuoteOfferCreationPlan["status"]
}): NonCncPromotedQuoteOfferCreationCommandExecution {
  const status = commandExecutionStatus(command, mode, outcome, planStatus)
  const executable = status === "failed" || status === "succeeded"
  return {
    blockerLabels: [...command.blockerLabels],
    externalId: executable ? outcome?.externalId : undefined,
    idempotencyKey: command.idempotencyKey,
    key: command.key,
    label: command.label,
    message: executable ? outcome?.message : undefined,
    offerBuilderExternalId: status === "blocked" ? undefined : command.offerBuilderExternalId,
    offerReadinessExternalId: status === "blocked" ? undefined : command.offerReadinessExternalId,
    quoteExternalId: status === "blocked" ? undefined : command.quoteExternalId,
    releaseExecutionFingerprint: status === "blocked" ? undefined : command.releaseExecutionFingerprint,
    reviewWarnings: [...command.reviewWarnings],
    status,
    targetRfqId: status === "blocked" ? undefined : command.targetRfqId,
    warnings: executable ? outcome?.warnings ?? [] : [],
  }
}

function commandExecutionStatus(
  command: NonCncPromotedQuoteOfferCreationCommand,
  mode: NonCncPromotedQuoteOfferCreationExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
  planStatus: NonCncPromotedQuoteOfferCreationPlan["status"],
): NonCncPromotedQuoteOfferCreationCommandExecutionStatus {
  if (planStatus === "blocked" || command.status === "blocked") {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  plan: NonCncPromotedQuoteOfferCreationPlan,
  mode: NonCncPromotedQuoteOfferCreationExecutionMode,
  commands: NonCncPromotedQuoteOfferCreationCommandExecution[],
): NonCncPromotedQuoteOfferCreationExecutionStatus {
  if (plan.status === "blocked" || commands.some((command) => command.status === "blocked")) {
    return "blocked"
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
  if (succeededCount > 0 || failedCount > 0) {
    return "partial"
  }
  if (pendingCount > 0) {
    return "pending"
  }
  return "prepared"
}

function executionNextActions(
  plan: NonCncPromotedQuoteOfferCreationPlan,
  mode: NonCncPromotedQuoteOfferCreationExecutionMode,
  commands: NonCncPromotedQuoteOfferCreationCommandExecution[],
  status: NonCncPromotedQuoteOfferCreationExecutionStatus,
): string[] {
  if (status === "blocked") {
    return uniqueLabels([
      "Resolve non-CNC customer-offer creation blockers before running the adapter.",
      ...plan.blockerLabels,
      ...commands.flatMap((command) => command.blockerLabels),
    ])
  }
  if (mode === "dry_run") {
    return ["Review prepared customer-offer creation commands before committing them."]
  }
  if (status === "succeeded") {
    return ["Review the recorded customer-offer creation audit before wiring active offer state."]
  }
  if (status === "pending") {
    return ["Wait for customer-offer creation command outcomes before marking the run complete."]
  }
  return ["Review failed or partial customer-offer creation command outcomes before retrying."]
}

function executionWarnings(
  plan: NonCncPromotedQuoteOfferCreationPlan,
  commands: NonCncPromotedQuoteOfferCreationCommandExecution[],
): string[] {
  return uniqueLabels([...plan.reviewWarnings, ...commands.flatMap((command) => command.reviewWarnings), ...commands.flatMap((command) => command.warnings)])
}

function normalizeCommandOutcomes(
  commands: NonCncPromotedQuoteOfferCreationCommand[],
  outcomes: NonCncPromotedQuoteOfferCreationCommandOutcomeInput[],
  mode: NonCncPromotedQuoteOfferCreationExecutionMode,
): Map<NonCncPromotedQuoteOfferCreationCommand["key"], NormalizedCommandOutcome> {
  const allowedKeys = new Set(commands.map((command) => command.key))
  const normalized = new Map<NonCncPromotedQuoteOfferCreationCommand["key"], NormalizedCommandOutcome>()
  if (mode === "dry_run") {
    return normalized
  }

  for (const [index, outcome] of outcomes.entries()) {
    const key = normalizeCommandKey(outcome.key, `commandOutcomes[${index}].key`)
    if (!allowedKeys.has(key)) {
      throw new Error(`commandOutcomes[${index}].key does not match an offer creation command`)
    }
    if (normalized.has(key)) {
      throw new Error(`commandOutcomes[${index}].key is duplicated`)
    }
    normalized.set(key, {
      externalId: optionalTrim(outcome.externalId),
      key,
      message: optionalTrim(outcome.message),
      status: normalizeOutcomeStatus(outcome.status, `commandOutcomes[${index}].status`),
      warnings: uniqueLabels((outcome.warnings ?? []).map((warning) => warning.trim()).filter(Boolean)),
    })
  }
  return normalized
}

function normalizeCommandKey(value: string, key: string): NonCncPromotedQuoteOfferCreationCommand["key"] {
  const normalized = nonBlank(value, key)
  if (normalized !== "draft_customer_offer" && normalized !== "prepare_export_package" && normalized !== "open_release_review") {
    throw new Error(`${key} must be a valid offer creation command key`)
  }
  return normalized
}

function normalizeMode(value: NonCncPromotedQuoteOfferCreationExecutionMode): NonCncPromotedQuoteOfferCreationExecutionMode {
  if (value !== "commit" && value !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return value
}

function normalizeOutcomeStatus(value: string, key: string): NormalizedCommandOutcome["status"] {
  if (value !== "failed" && value !== "succeeded") {
    throw new Error(`${key} must be failed or succeeded`)
  }
  return value
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

function fingerprint(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}
