import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistory"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-adapter-execution.v1"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_MODES =
  ["commit", "dry_run"] as const

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_STATUSES =
  ["blocked", "failed", "partial", "pending", "prepared", "succeeded"] as const

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_COMMAND_EXECUTION_STATUSES =
  ["applied", "blocked", "failed", "pending", "prepared"] as const

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_MODES)[number]

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_STATUSES)[number]

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus =
  (typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_COMMAND_EXECUTION_STATUSES)[number]

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionCommandKey =
  | "connector_reference_provider_prepare"
  | "customer_offer_provider_prepare"
  | "file_export_provider_prepare"
  | "final_gate_follow_through_provider_prepare"
  | "release_review_provider_prepare"
  | "rollback_evidence_provider_prepare"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionTarget =
  | "connector"
  | "customer_offer"
  | "diagnostics"
  | "file_export"
  | "final_gate_follow_through"
  | "release_review"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput {
  key: string
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings?: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionCommandKey
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionTarget
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus
  blockerLabels: string[]
  evidenceFingerprints: string[]
  warnings: string[]
  detail: string
  externalId?: string
  idempotencyKey?: string
  message?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun {
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  executedAt: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus
  providerAdapterBoundaryId?: string
  providerAdapterBoundaryFingerprint?: string
  providerAdapterBoundaryVersion?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord["providerAdapterBoundaryVersion"]
  providerReadModelRecordId?: string
  liveWriteBoundaryId?: string
  liveWriteBoundaryFingerprint?: string
  adapterBoundaryId?: string
  adapterBoundaryFingerprint?: string
  commitRecordId?: string
  committedExecutionFingerprint?: string
  followThroughId?: string
  targetRfqId?: string
  readinessRecordId?: string
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  appliedCommandCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution[]
  historyRecordCount: number
  readyRecordCount: number
  blockedRecordCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  nextActions: string[]
  warnings: string[]
  providerAdapterExecutionBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRunInput {
  actor: string
  commandOutcomes?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput[]
  executedAt: string
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode
}

interface NormalizedCommandOutcome {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionCommandKey
  status: "applied" | "failed"
  externalId?: string
  message?: string
  warnings: string[]
}

const commandDefinitions = [
  {
    detail: "Audit customer-offer provider preparation without creating a customer offer.",
    key: "customer_offer_provider_prepare",
    label: "Prepare customer offer provider write",
    sourceIdempotencySuffix: "customer_offer_follow_through",
    target: "customer_offer",
  },
  {
    detail: "Audit file-export provider preparation without creating files or exports.",
    key: "file_export_provider_prepare",
    label: "Prepare file export provider write",
    sourceIdempotencySuffix: "file_export_follow_through",
    target: "file_export",
  },
  {
    detail: "Audit release-review provider preparation without creating release reviews.",
    key: "release_review_provider_prepare",
    label: "Prepare release review provider write",
    sourceIdempotencySuffix: "release_review_follow_through",
    target: "release_review",
  },
  {
    detail: "Audit connector provider preparation without writing connector records.",
    key: "connector_reference_provider_prepare",
    label: "Prepare connector provider write",
    sourceIdempotencySuffix: "connector_reference_follow_through",
    target: "connector",
  },
  {
    detail: "Audit final-gate follow-through provider preparation without enabling live writes.",
    key: "final_gate_follow_through_provider_prepare",
    label: "Prepare final gate provider write",
    sourceIdempotencySuffix: "final_gate_follow_through",
    target: "final_gate_follow_through",
  },
  {
    detail: "Audit rollback evidence for the local/mock fallback path.",
    key: "rollback_evidence_provider_prepare",
    label: "Prepare rollback evidence",
    sourceIdempotencySuffix: "rollback_evidence_follow_through",
    target: "diagnostics",
  },
] as const satisfies ReadonlyArray<{
  detail: string
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionCommandKey
  label: string
  sourceIdempotencySuffix: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionTarget
}>

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
  input: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRunInput,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const latestRecord = input.history.latestRecord
  const blockers = providerAdapterExecutionBlockers(input.history, latestRecord)
  const readyRecord = blockers.length === 0 ? latestRecord : undefined
  const outcomesByKey = normalizeCommandOutcomes(readyRecord, input.commandOutcomes ?? [], mode)
  const commands = commandDefinitions.map((command) =>
    buildCommandExecution({
      command,
      mode,
      outcome: outcomesByKey.get(command.key),
      readyRecord,
      runBlockers: blockers,
    }),
  )
  const status = executionStatus(readyRecord, mode, commands)
  const exposesEvidence = status !== "blocked"
  const run: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
    "executionFingerprint"
  > = {
    actor,
    adapterBoundaryFingerprint: exposesEvidence ? readyRecord?.adapterBoundaryFingerprint : undefined,
    adapterBoundaryId: exposesEvidence ? readyRecord?.adapterBoundaryId : undefined,
    appliedCommandCount: commands.filter((command) => command.status === "applied").length,
    blockedCommandCount: commands.filter((command) => command.status === "blocked").length,
    blockedRecordCount: input.history.blockedCount,
    commandCount: commands.length,
    commands,
    committedExecutionFingerprint: exposesEvidence ? readyRecord?.committedExecutionFingerprint : undefined,
    commitRecordId: exposesEvidence ? readyRecord?.commitRecordId : undefined,
    executedAt,
    executionVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
    followThroughId: exposesEvidence ? readyRecord?.followThroughId : undefined,
    historyRecordCount: input.history.totalRecords,
    liveWriteBoundaryFingerprint: exposesEvidence ? readyRecord?.liveWriteBoundaryFingerprint : undefined,
    liveWriteBoundaryId: exposesEvidence ? readyRecord?.liveWriteBoundaryId : undefined,
    mode,
    nextActions: executionNextActions(input.history, mode, commands, status, blockers),
    pendingWriteIntentCount: exposesEvidence ? readyRecord?.pendingWriteIntentCount ?? 0 : 0,
    plannedCommandCount: commands.filter((command) =>
      command.status === "applied" ||
      command.status === "failed" ||
      command.status === "pending" ||
      command.status === "prepared"
    ).length,
    providerAdapterBoundaryFingerprint: exposesEvidence ? readyRecord?.providerAdapterBoundaryFingerprint : undefined,
    providerAdapterBoundaryId: exposesEvidence ? readyRecord?.providerAdapterBoundaryId : undefined,
    providerAdapterBoundaryVersion: exposesEvidence ? readyRecord?.providerAdapterBoundaryVersion : undefined,
    providerAdapterExecutionBoundary:
      "Final-gate provider-adapter execution runs are deterministic audit records only; this adapter does not create customer offers, files, release reviews, exports, connector records, final-gate follow-through writes, or external side effects.",
    providerReadModelRecordId: exposesEvidence ? readyRecord?.providerReadModelRecordId : undefined,
    readinessRecordId: exposesEvidence ? readyRecord?.readinessRecordId : undefined,
    readyRecordCount: input.history.readyCount,
    reviewedOutcomeCount: exposesEvidence ? readyRecord?.reviewedOutcomeCount ?? 0 : 0,
    status,
    targetRfqId: exposesEvidence ? readyRecord?.targetRfqId : undefined,
    warnings: executionWarnings(readyRecord, commands),
  }

  return {
    ...run,
    executionFingerprint:
      fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
        run,
      ),
  }
}

export function fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
  run:
    | Omit<
        NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
        "executionFingerprint"
      >
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    adapterBoundaryFingerprint: run.adapterBoundaryFingerprint,
    adapterBoundaryId: run.adapterBoundaryId,
    appliedCommandCount: run.appliedCommandCount,
    blockedCommandCount: run.blockedCommandCount,
    blockedRecordCount: run.blockedRecordCount,
    commandCount: run.commandCount,
    commands: run.commands,
    committedExecutionFingerprint: run.committedExecutionFingerprint,
    commitRecordId: run.commitRecordId,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    followThroughId: run.followThroughId,
    historyRecordCount: run.historyRecordCount,
    liveWriteBoundaryFingerprint: run.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: run.liveWriteBoundaryId,
    mode: run.mode,
    nextActions: run.nextActions,
    pendingWriteIntentCount: run.pendingWriteIntentCount,
    plannedCommandCount: run.plannedCommandCount,
    providerAdapterBoundaryFingerprint: run.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: run.providerAdapterBoundaryId,
    providerAdapterBoundaryVersion: run.providerAdapterBoundaryVersion,
    providerAdapterExecutionBoundary: run.providerAdapterExecutionBoundary,
    providerReadModelRecordId: run.providerReadModelRecordId,
    readinessRecordId: run.readinessRecordId,
    readyRecordCount: run.readyRecordCount,
    reviewedOutcomeCount: run.reviewedOutcomeCount,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
  })
  return `non-cnc-promoted-quote-offer-export-live-adapter-final-gate-provider-adapter-execution-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stablePayload)}`
}

function buildCommandExecution({
  command,
  mode,
  outcome,
  readyRecord,
  runBlockers,
}: {
  command: (typeof commandDefinitions)[number]
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode
  outcome?: NormalizedCommandOutcome
  readyRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord
  runBlockers: string[]
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution {
  const idempotencyKey = readyRecord
    ? commandIdempotencyKeyForSuffix(readyRecord.commandIdempotencyKeys, command.sourceIdempotencySuffix)
    : undefined
  const blockerLabels = commandBlockers(readyRecord, idempotencyKey, runBlockers)
  const status = commandExecutionStatus(mode, outcome, blockerLabels)
  const recordsOutcome = status === "applied" || status === "failed"
  const exposesEvidence = status !== "blocked"

  return {
    blockerLabels: status === "blocked" ? blockerLabels : [],
    detail: command.detail,
    evidenceFingerprints: exposesEvidence && readyRecord ? [...readyRecord.evidenceFingerprints] : [],
    externalId: recordsOutcome ? outcome?.externalId : undefined,
    idempotencyKey: exposesEvidence ? idempotencyKey : undefined,
    key: command.key,
    label: command.label,
    message: recordsOutcome ? outcome?.message : undefined,
    status,
    target: command.target,
    warnings: recordsOutcome ? outcome?.warnings ?? [] : [],
  }
}

function commandExecutionStatus(
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode,
  outcome: NormalizedCommandOutcome | undefined,
  blockerLabels: string[],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecutionStatus {
  if (blockerLabels.length > 0) {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  readyRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord | undefined,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution[],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus {
  if (!readyRecord || commands.some((command) => command.status === "blocked")) {
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

function providerAdapterExecutionBlockers(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
  latestRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord
    | undefined,
): string[] {
  if (!latestRecord) {
    return [
      "Persist a final-gate follow-through provider-adapter boundary record before recording provider-adapter execution.",
    ]
  }
  return uniqueLabels([
    history.status === "ready"
      ? ""
      : "Provider-adapter execution requires ready provider-adapter boundary history.",
    latestRecord.status === "ready"
      ? ""
      : "Latest final-gate provider-adapter boundary must be ready before execution auditing.",
    latestRecord.disposition === "provider_adapter_ready"
      ? ""
      : "Latest final-gate provider-adapter boundary must be provider-adapter ready.",
    includesValue(history.readyBoundaryIds, latestRecord.providerAdapterBoundaryId)
      ? ""
      : "Latest provider-adapter boundary must be present in the ready boundary history index.",
    latestRecord.plannedCommandCount > 0
      ? ""
      : "Provider-adapter execution requires at least one planned provider command.",
    latestRecord.commandIdempotencyKeys.length > 0 &&
    latestRecord.commandIdempotencyKeys.every((key) => includesValue(history.commandIdempotencyKeys, key))
      ? ""
      : "Latest provider-adapter command idempotency keys must be present in the history index.",
    latestRecord.evidenceFingerprints.length > 0 &&
    latestRecord.evidenceFingerprints.every((fingerprint) => includesValue(history.evidenceFingerprints, fingerprint))
      ? ""
      : "Latest provider-adapter evidence fingerprints must be present in the history index.",
  ])
}

function commandBlockers(
  readyRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord | undefined,
  idempotencyKey: string | undefined,
  runBlockers: string[],
): string[] {
  if (!readyRecord) {
    return runBlockers
  }
  return uniqueLabels([
    ...runBlockers,
    idempotencyKey ? "" : "Provider-adapter execution command requires an idempotency key from the latest boundary.",
    readyRecord.evidenceFingerprints.length > 0
      ? ""
      : "Provider-adapter execution command requires evidence fingerprints from the latest boundary.",
  ])
}

function executionNextActions(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution[],
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionStatus,
  blockers: string[],
): string[] {
  if (status === "blocked") {
    return uniqueLabels([
      ...blockers,
      ...history.actionItems,
      ...commands.flatMap((command) => command.blockerLabels),
      "Resolve final-gate provider-adapter blockers before recording execution outcomes.",
    ])
  }
  if (mode === "dry_run") {
    return [`Review ${formatCount(commands.length, "prepared provider-adapter command")} before committing.`]
  }
  if (status === "succeeded") {
    return ["Review the recorded provider-adapter execution audit before enabling live provider adapters."]
  }
  if (status === "pending") {
    return [`Record provider-adapter outcomes for ${formatCount(commands.length, "command")}.`]
  }
  return [
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `Resolve failed provider-adapter command: ${command.label}.`),
    ...commands
      .filter((command) => command.status === "pending")
      .map((command) => `Record provider-adapter outcome for command: ${command.label}.`),
  ]
}

function executionWarnings(
  readyRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord | undefined,
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution[],
): string[] {
  return uniqueLabels([
    ...(readyRecord?.reviewWarnings ?? []),
    ...commands.flatMap((command) => command.warnings.map((warning) => `${command.label}: ${warning}`)),
    ...commands
      .filter((command) => command.status === "failed")
      .map((command) => `${command.label} failed: ${command.message ?? "No failure detail provided."}`),
  ])
}

function normalizeCommandOutcomes(
  readyRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord
    | undefined,
  outcomes: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput[],
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode,
): Map<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionCommandKey, NormalizedCommandOutcome> {
  const normalized =
    new Map<
      NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionCommandKey,
      NormalizedCommandOutcome
    >()
  const commandKeys = new Set(commandDefinitions.map((command) => command.key))

  for (const [index, outcome] of outcomes.entries()) {
    const key = normalizeCommandKey(outcome.key, `commandOutcomes[${index}].key`)
    if (!commandKeys.has(key)) {
      throw new Error(`command outcome ${key} does not match a final-gate provider-adapter command`)
    }
    if (mode === "dry_run") {
      throw new Error(`command outcome ${key} cannot be recorded for a dry-run provider-adapter execution`)
    }
    if (!readyRecord) {
      throw new Error(`command outcome ${key} cannot be recorded for a blocked provider-adapter execution`)
    }
    const command = commandDefinitions.find((definition) => definition.key === key)
    const idempotencyKey = command
      ? commandIdempotencyKeyForSuffix(readyRecord.commandIdempotencyKeys, command.sourceIdempotencySuffix)
      : undefined
    if (!idempotencyKey) {
      throw new Error(`command outcome ${key} cannot be recorded without a matching provider-adapter idempotency key`)
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

function commandIdempotencyKeyForSuffix(commandIdempotencyKeys: string[], suffix: string): string | undefined {
  return commandIdempotencyKeys.find((key) => key.endsWith(`:${suffix}`))
}

function normalizeCommandKey(
  value: string,
  key: string,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionCommandKey {
  const normalized = nonBlank(value, key)
  return normalized as NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionCommandKey
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionMode {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeOutcomeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput["status"],
  key: string,
): "applied" | "failed" {
  if (status !== "applied" && status !== "failed") {
    throw new Error(`command outcome ${key} status must be applied or failed`)
  }
  return status
}

function includesValue(values: string[], value: string | undefined): boolean {
  return !!value && values.includes(value)
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
