import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecution"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_DRAFT_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-execution-outcome-draft.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraftStatus =
  | "blocked"
  | "ready"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeDraftStatus =
  | "blocked"
  | "ready"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeDraft {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution["key"]
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution["target"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeDraftStatus
  blockerLabels: string[]
  evidenceFingerprints: string[]
  idempotencyKey?: string
  externalId?: string
  suggestedOutcome?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft {
  draftVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_DRAFT_VERSION
  executionFingerprint: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun["mode"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraftStatus
  followThroughId: string
  followThroughFingerprint: string
  targetRfqId?: string
  readinessRecordId?: string
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  readyOutcomeCount: number
  blockedOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeDraft[]
  nextOperatorMessage: string
  reviewWarnings: string[]
  adapterFinalGateFollowThroughOutcomeBoundary: string
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft(
  run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft {
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
    adapterFinalGateFollowThroughOutcomeBoundary:
      "Final-gate follow-through execution outcome drafts are deterministic review data only; customer-offer, file, release-review, export, connector, final-gate follow-through, RFQ quote, offer, and release state stay unchanged until an operator commits them.",
    blockedOutcomeCount,
    commandOutcomes,
    draftVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_DRAFT_VERSION,
    executionFingerprint: run.executionFingerprint,
    followThroughFingerprint: run.followThroughFingerprint,
    followThroughId: run.followThroughId,
    latestApplyPlanId: status === "ready" ? run.latestApplyPlanId : undefined,
    latestCommitRecordId: status === "ready" ? run.latestCommitRecordId : undefined,
    latestCommittedExecutionFingerprint: status === "ready" ? run.latestCommittedExecutionFingerprint : undefined,
    latestExecutionFingerprint: status === "ready" ? run.latestExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: status === "ready" ? run.latestSourceExecutionFingerprint : undefined,
    mode: run.mode,
    nextOperatorMessage:
      status === "ready"
        ? `Review and commit ${formatCount(readyOutcomeCount, "final-gate follow-through command outcome")}.`
        : blockerLabels.join(" ") || "Final-gate follow-through execution is not ready for committed outcomes.",
    readinessRecordId: status === "ready" ? run.readinessRecordId : undefined,
    readyOutcomeCount,
    reviewWarnings: [...run.warnings],
    status,
    targetRfqId: status === "ready" ? run.targetRfqId : undefined,
  }
}

function blockCommandOutcomeDraft(
  outcome: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeDraft,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeDraft {
  return {
    blockerLabels: uniqueLabels([
      ...outcome.blockerLabels,
      "Final-gate follow-through execution is not ready for outcome suggestions.",
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
  run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeDraft {
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
  run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution,
): string[] {
  if (run.mode !== "dry_run") {
    return ["Final-gate follow-through outcome drafts must be based on a dry-run execution."]
  }
  if (run.status !== "prepared") {
    return run.nextActions.length > 0 ? [...run.nextActions] : ["Final-gate follow-through execution is not prepared."]
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
  if (!run.readinessRecordId) {
    return [`${command.label} is missing readiness record evidence.`]
  }
  if (command.evidenceFingerprints.length === 0) {
    return [`${command.label} is missing final-gate follow-through evidence fingerprints.`]
  }
  return []
}

function outcomeExternalId(
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution["key"],
  targetRfqId: string | undefined,
  executionFingerprint: string,
): string {
  return stableOutcomeId(outcomePrefix(key), targetRfqId ?? "unassigned-rfq", executionFingerprint)
}

function outcomePrefix(
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution["key"],
): string {
  return key.replaceAll("_", "-")
}

function outcomeMessage(
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandExecution,
): string {
  switch (command.key) {
    case "connector_reference_final_gate":
      return "Prepared connector reference final-gate outcome from reviewed follow-through execution evidence."
    case "customer_offer_final_gate":
      return "Prepared customer-offer final-gate outcome from reviewed follow-through execution evidence."
    case "file_export_final_gate":
      return "Prepared file export final-gate outcome from reviewed follow-through execution evidence."
    case "release_review_final_gate":
      return "Prepared release-review final-gate outcome from reviewed follow-through execution evidence."
    case "rollback_evidence_final_gate":
      return "Prepared rollback evidence final-gate outcome from reviewed follow-through execution evidence."
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
      "Non-CNC live-adapter final-gate follow-through outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
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
  throw new Error(`Unhandled final-gate follow-through command kind: ${String(value)}`)
}
