import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type {
  OfferReleaseCommandExecution,
  OfferReleaseCommandExecutionStatus,
  OfferReleaseExecutionMode,
  OfferReleaseExecutionRun,
  OfferReleaseExecutionStatus,
} from "./offerReleaseExecution"
import type { OfferReleaseCommandKind } from "./offerReleasePlan"

export interface ConvexOfferReleaseExecutionPayload {
  offerId: string
  executionKey: string
  executionFingerprint: string
  executionVersion: string
  planVersion: string
  mode: OfferReleaseExecutionMode
  status: OfferReleaseExecutionStatus
  releaseAt: string
  executedAt: string
  commands: ConvexOfferReleaseExecutionCommandPayload[]
  lifecycleEventCount: number
  workspaceActionCount: number
  calendarEventCount: number
  nextActions: string[]
  warnings: string[]
}

export interface ConvexOfferReleaseExecutionCommandPayload {
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

export interface BuildConvexOfferReleaseExecutionPayloadOptions {
  executionKey?: string
  offerId?: string
}

export function buildConvexOfferReleaseExecutionPayload(
  run: OfferReleaseExecutionRun,
  options: BuildConvexOfferReleaseExecutionPayloadOptions = {},
): ConvexOfferReleaseExecutionPayload {
  const executedAt = normalizeIsoTimestamp(run.executedAt, "run.executedAt")
  const executionVersion = nonBlank(run.executionVersion, "run.executionVersion")
  const mode = normalizeMode(run.mode)
  const offerId = nonBlank(options.offerId ?? run.offerId, "offerId")
  const planVersion = nonBlank(run.planVersion, "run.planVersion")
  const releaseAt = normalizeIsoTimestamp(run.releaseAt, "run.releaseAt")

  return {
    calendarEventCount: run.calendarEvents.length,
    commands: normalizeCommands(run.commands),
    executedAt,
    executionFingerprint: nonBlank(run.executionFingerprint, "run.executionFingerprint"),
    executionKey: options.executionKey
      ? nonBlank(options.executionKey, "executionKey")
      : buildExecutionKey({
          executedAt,
          executionVersion,
          mode,
          offerId,
          planVersion,
          releaseAt,
        }),
    executionVersion,
    lifecycleEventCount: run.lifecycleEvents.length,
    mode,
    nextActions: normalizeTextList(run.nextActions),
    offerId,
    planVersion,
    releaseAt,
    status: normalizeStatus(run.status),
    warnings: normalizeTextList(run.warnings),
    workspaceActionCount: run.workspaceActions.length,
  }
}

function normalizeCommands(commands: OfferReleaseCommandExecution[]): ConvexOfferReleaseExecutionCommandPayload[] {
  if (commands.length === 0) {
    throw new Error("run.commands must include at least one release command")
  }

  const seenKeys = new Set<string>()
  return commands.map((command, index) => {
    const key = nonBlank(command.key, `run.commands[${index}].key`)
    if (seenKeys.has(key)) {
      throw new Error(`duplicate release command ${key}`)
    }
    seenKeys.add(key)

    const externalId = optionalTrim(command.externalId)
    const message = optionalTrim(command.message)
    return {
      detail: nonBlank(command.detail, `run.commands[${index}].detail`),
      ...(externalId ? { externalId } : {}),
      idempotencyKey: nonBlank(command.idempotencyKey, `run.commands[${index}].idempotencyKey`),
      key,
      kind: normalizeCommandKind(command.kind),
      label: nonBlank(command.label, `run.commands[${index}].label`),
      ...(message ? { message } : {}),
      status: normalizeCommandStatus(command.status),
      warnings: normalizeTextList(command.warnings),
    }
  })
}

function normalizeMode(mode: OfferReleaseExecutionMode): OfferReleaseExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("run.mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(status: OfferReleaseExecutionStatus): OfferReleaseExecutionStatus {
  if (
    status !== "blocked" &&
    status !== "failed" &&
    status !== "needs_review" &&
    status !== "partial" &&
    status !== "pending" &&
    status !== "prepared" &&
    status !== "succeeded"
  ) {
    throw new Error("run.status is not a supported release execution status")
  }
  return status
}

function normalizeCommandKind(kind: OfferReleaseCommandKind): OfferReleaseCommandKind {
  if (
    kind !== "calendar_follow_up" &&
    kind !== "email_draft" &&
    kind !== "lifecycle_follow_up" &&
    kind !== "lifecycle_sent" &&
    kind !== "manager_review" &&
    kind !== "workspace_follow_up" &&
    kind !== "workspace_status"
  ) {
    throw new Error("release command kind is not supported")
  }
  return kind
}

function normalizeCommandStatus(status: OfferReleaseCommandExecutionStatus): OfferReleaseCommandExecutionStatus {
  if (
    status !== "applied" &&
    status !== "blocked" &&
    status !== "failed" &&
    status !== "pending" &&
    status !== "prepared" &&
    status !== "requires_review"
  ) {
    throw new Error("release command status is not supported")
  }
  return status
}

function normalizeTextList(values: string[]): string[] {
  return values.map((value) => optionalTrim(value)).filter((value): value is string => Boolean(value))
}

function buildExecutionKey(input: {
  executedAt: string
  executionVersion: string
  mode: OfferReleaseExecutionMode
  offerId: string
  planVersion: string
  releaseAt: string
}): string {
  return [
    "offer-release-execution",
    input.offerId,
    input.executionVersion,
    input.planVersion,
    input.mode,
    input.releaseAt,
    input.executedAt,
  ]
    .map(sanitizeKeyPart)
    .join(":")
}

function sanitizeKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
