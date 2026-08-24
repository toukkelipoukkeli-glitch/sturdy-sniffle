import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-adapter-execution-outcome-draft.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraftStatus =
  | "blocked"
  | "ready"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraftStatus =
  | "blocked"
  | "ready"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution["key"]
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution["target"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraftStatus
  blockerLabels: string[]
  evidenceFingerprints: string[]
  idempotencyKey?: string
  externalId?: string
  suggestedOutcome?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft {
  draftVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION
  executionFingerprint: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun["mode"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraftStatus
  providerAdapterBoundaryId?: string
  providerAdapterBoundaryFingerprint?: string
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
  readyOutcomeCount: number
  blockedOutcomeCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft[]
  nextOperatorMessage: string
  reviewWarnings: string[]
  providerAdapterExecutionOutcomeBoundary: string
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
  run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft {
  const candidateCommandOutcomes = run.commands.map((command) => buildCommandOutcomeDraft(run, command))
  const isReady =
    run.mode === "dry_run" &&
    run.status === "prepared" &&
    candidateCommandOutcomes.every((outcome) => outcome.status === "ready")
  const commandOutcomes = isReady
    ? candidateCommandOutcomes
    : candidateCommandOutcomes.map((outcome) => blockCommandOutcomeDraft(outcome))
  const readyOutcomeCount = commandOutcomes.filter((outcome) => outcome.status === "ready").length
  const blockedOutcomeCount = commandOutcomes.length - readyOutcomeCount
  const status = isReady ? "ready" : "blocked"
  const blockerLabels = uniqueLabels(
    status === "ready" ? [] : commandOutcomes.flatMap((outcome) => outcome.blockerLabels).concat(run.nextActions),
  )

  return {
    adapterBoundaryFingerprint: status === "ready" ? run.adapterBoundaryFingerprint : undefined,
    adapterBoundaryId: status === "ready" ? run.adapterBoundaryId : undefined,
    blockedOutcomeCount,
    commandOutcomes,
    committedExecutionFingerprint: status === "ready" ? run.committedExecutionFingerprint : undefined,
    commitRecordId: status === "ready" ? run.commitRecordId : undefined,
    draftVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION,
    executionFingerprint: run.executionFingerprint,
    followThroughId: status === "ready" ? run.followThroughId : undefined,
    liveWriteBoundaryFingerprint: status === "ready" ? run.liveWriteBoundaryFingerprint : undefined,
    liveWriteBoundaryId: status === "ready" ? run.liveWriteBoundaryId : undefined,
    mode: run.mode,
    nextOperatorMessage:
      status === "ready"
        ? `Review and commit ${formatCount(readyOutcomeCount, "final-gate provider-adapter command outcome")}.`
        : blockerLabels.join(" ") || "Final-gate provider-adapter execution is not ready for committed outcomes.",
    pendingWriteIntentCount: status === "ready" ? run.pendingWriteIntentCount : 0,
    providerAdapterBoundaryFingerprint: status === "ready" ? run.providerAdapterBoundaryFingerprint : undefined,
    providerAdapterBoundaryId: status === "ready" ? run.providerAdapterBoundaryId : undefined,
    providerAdapterExecutionOutcomeBoundary:
      "Final-gate provider-adapter execution outcome drafts are deterministic review data only; customer-offer, file, release-review, export, connector, final-gate follow-through, RFQ quote, offer, and release state stay unchanged until an operator commits them.",
    providerReadModelRecordId: status === "ready" ? run.providerReadModelRecordId : undefined,
    readinessRecordId: status === "ready" ? run.readinessRecordId : undefined,
    readyOutcomeCount,
    reviewedOutcomeCount: status === "ready" ? run.reviewedOutcomeCount : 0,
    reviewWarnings: [...run.warnings],
    status,
    targetRfqId: status === "ready" ? run.targetRfqId : undefined,
  }
}

function blockCommandOutcomeDraft(
  outcome: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft {
  return {
    blockerLabels: uniqueLabels([
      ...outcome.blockerLabels,
      "Final-gate provider-adapter execution is not ready for outcome suggestions.",
    ]),
    evidenceFingerprints: [],
    idempotencyKey: outcome.idempotencyKey,
    key: outcome.key,
    label: outcome.label,
    status: "blocked",
    target: outcome.target,
  }
}

function buildCommandOutcomeDraft(
  run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft {
  const blockerLabels = commandOutcomeBlockerLabels(run, command)
  if (blockerLabels.length > 0) {
    return {
      blockerLabels,
      evidenceFingerprints: [],
      idempotencyKey: command.idempotencyKey,
      key: command.key,
      label: command.label,
      status: "blocked",
      target: command.target,
    }
  }

  const externalId = outcomeExternalId(command.key, run.targetRfqId, run.executionFingerprint)
  return {
    blockerLabels: [],
    evidenceFingerprints: [...command.evidenceFingerprints],
    externalId,
    idempotencyKey: command.idempotencyKey,
    key: command.key,
    label: command.label,
    status: "ready",
    suggestedOutcome: {
      externalId,
      key: command.key,
      message: outcomeMessage(command),
      status: "applied",
      warnings: [...command.warnings],
    },
    target: command.target,
  }
}

function commandOutcomeBlockerLabels(
  run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution,
): string[] {
  if (run.mode !== "dry_run") {
    return ["Final-gate provider-adapter outcome drafts must be based on a dry-run execution."]
  }
  if (run.status !== "prepared") {
    return run.nextActions.length > 0 ? [...run.nextActions] : ["Final-gate provider-adapter execution is not prepared."]
  }
  if (command.status !== "prepared") {
    return command.blockerLabels.length > 0 ? [...command.blockerLabels] : [`${command.label} is not prepared.`]
  }
  if (!command.idempotencyKey) {
    return [`${command.label} is missing its idempotency key.`]
  }
  if (!run.targetRfqId) {
    return [`${command.label} is missing the target RFQ id.`]
  }
  if (!run.providerAdapterBoundaryId) {
    return [`${command.label} is missing provider-adapter boundary evidence.`]
  }
  if (!run.providerReadModelRecordId) {
    return [`${command.label} is missing provider read-model evidence.`]
  }
  if (!run.liveWriteBoundaryId) {
    return [`${command.label} is missing live-write boundary evidence.`]
  }
  if (command.evidenceFingerprints.length === 0) {
    return [`${command.label} is missing final-gate provider-adapter evidence fingerprints.`]
  }
  return []
}

function outcomeExternalId(
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution["key"],
  targetRfqId: string | undefined,
  executionFingerprint: string,
): string {
  return stableOutcomeId(outcomePrefix(key), targetRfqId ?? "unassigned-rfq", executionFingerprint)
}

function outcomePrefix(
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution["key"],
): string {
  return key.replaceAll("_", "-")
}

function outcomeMessage(
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandExecution,
): string {
  switch (command.key) {
    case "connector_reference_provider_prepare":
      return "Prepared connector provider outcome from reviewed final-gate provider-adapter execution evidence."
    case "customer_offer_provider_prepare":
      return "Prepared customer-offer provider outcome from reviewed final-gate provider-adapter execution evidence."
    case "file_export_provider_prepare":
      return "Prepared file export provider outcome from reviewed final-gate provider-adapter execution evidence."
    case "final_gate_follow_through_provider_prepare":
      return "Prepared final-gate follow-through provider outcome from reviewed provider-adapter execution evidence."
    case "release_review_provider_prepare":
      return "Prepared release-review provider outcome from reviewed final-gate provider-adapter execution evidence."
    case "rollback_evidence_provider_prepare":
      return "Prepared rollback provider evidence outcome from reviewed final-gate provider-adapter execution evidence."
    default:
      return assertNever(command.key)
  }
}

function stableOutcomeId(...parts: string[]): string {
  return parts.map((part) => canonicalKeyPart(part)).join(":")
}

function canonicalKeyPart(value: string): string {
  const token = value.trim()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(token)) {
    throw new Error(
      "Non-CNC final-gate provider-adapter execution outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
    )
  }
  return token
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

function assertNever(value: never): never {
  throw new Error(`Unsupported non-CNC final-gate provider-adapter execution outcome command: ${JSON.stringify(value)}`)
}
