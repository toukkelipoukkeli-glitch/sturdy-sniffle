import type {
  NonCncPromotedQuoteOfferCreationCommandExecution,
  NonCncPromotedQuoteOfferCreationCommandOutcomeInput,
  NonCncPromotedQuoteOfferCreationExecutionRun,
} from "./nonCncPromotedQuoteOfferCreationExecution"

export const NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_OUTCOME_DRAFT_VERSION =
  "non-cnc-promoted-quote-offer-creation-execution-outcome-draft.v1"

export type NonCncPromotedQuoteOfferCreationExecutionOutcomeDraftStatus = "blocked" | "ready"
export type NonCncPromotedQuoteOfferCreationCommandOutcomeDraftStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteOfferCreationCommandOutcomeDraft {
  key: NonCncPromotedQuoteOfferCreationCommandExecution["key"]
  label: string
  status: NonCncPromotedQuoteOfferCreationCommandOutcomeDraftStatus
  idempotencyKey: string
  blockerLabels: string[]
  externalId?: string
  suggestedOutcome?: NonCncPromotedQuoteOfferCreationCommandOutcomeInput
}

export interface NonCncPromotedQuoteOfferCreationExecutionOutcomeDraft {
  draftVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_OUTCOME_DRAFT_VERSION
  executionFingerprint: string
  mode: NonCncPromotedQuoteOfferCreationExecutionRun["mode"]
  creationPlanId: string
  packageId: string
  selectedPlanId: string
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  status: NonCncPromotedQuoteOfferCreationExecutionOutcomeDraftStatus
  readyOutcomeCount: number
  blockedOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteOfferCreationCommandOutcomeDraft[]
  nextOperatorMessage: string
  reviewWarnings: string[]
  offerCreationBoundary: string
}

export function buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft(
  run: NonCncPromotedQuoteOfferCreationExecutionRun,
): NonCncPromotedQuoteOfferCreationExecutionOutcomeDraft {
  const commandOutcomes = run.commands.map((command) => buildCommandOutcomeDraft(run, command))
  const readyOutcomeCount = commandOutcomes.filter((outcome) => outcome.status === "ready").length
  const blockedOutcomeCount = commandOutcomes.length - readyOutcomeCount
  const status = run.mode === "dry_run" && run.status === "prepared" && blockedOutcomeCount === 0 ? "ready" : "blocked"
  const blockerLabels = uniqueLabels(
    status === "ready" ? [] : commandOutcomes.flatMap((outcome) => outcome.blockerLabels).concat(run.nextActions),
  )

  return {
    blockedOutcomeCount,
    commandOutcomes,
    creationPlanId: run.creationPlanId,
    draftVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_OUTCOME_DRAFT_VERSION,
    executionFingerprint: run.executionFingerprint,
    mode: run.mode,
    nextOperatorMessage:
      status === "ready"
        ? `Review and commit ${readyOutcomeCount} non-CNC customer-offer creation outcome${readyOutcomeCount === 1 ? "" : "s"}.`
        : blockerLabels.join(" ") || "Customer-offer creation execution is not ready for committed outcomes.",
    offerCreationBoundary:
      "Offer creation execution outcome drafts are deterministic review data only; active RFQ quote, offer, release, export, and connector state stay unchanged until an operator commits them.",
    packageId: run.packageId,
    readyOutcomeCount,
    releaseExecutionFingerprint: run.releaseExecutionFingerprint,
    reviewWarnings: [...run.warnings],
    selectedPlanId: run.selectedPlanId,
    status,
    targetRfqId: run.targetRfqId,
  }
}

function buildCommandOutcomeDraft(
  run: NonCncPromotedQuoteOfferCreationExecutionRun,
  command: NonCncPromotedQuoteOfferCreationCommandExecution,
): NonCncPromotedQuoteOfferCreationCommandOutcomeDraft {
  const blockerLabels = commandOutcomeBlockerLabels(run, command)
  if (blockerLabels.length > 0) {
    return {
      blockerLabels,
      idempotencyKey: command.idempotencyKey,
      key: command.key,
      label: command.label,
      status: "blocked",
    }
  }

  const externalId = outcomeExternalId(command.key, command.targetRfqId, run.executionFingerprint)
  return {
    blockerLabels: [],
    externalId,
    idempotencyKey: command.idempotencyKey,
    key: command.key,
    label: command.label,
    status: "ready",
    suggestedOutcome: {
      externalId,
      key: command.key,
      message: outcomeMessage(command),
      status: "succeeded",
      warnings: [...command.reviewWarnings],
    },
  }
}

function commandOutcomeBlockerLabels(
  run: NonCncPromotedQuoteOfferCreationExecutionRun,
  command: NonCncPromotedQuoteOfferCreationCommandExecution,
): string[] {
  if (run.mode !== "dry_run") {
    return ["Offer creation outcome drafts must be based on a dry-run execution."]
  }
  if (run.status !== "prepared") {
    return run.nextActions.length > 0 ? [...run.nextActions] : ["Offer creation execution is not prepared."]
  }
  if (command.status !== "prepared") {
    return command.blockerLabels.length > 0 ? [...command.blockerLabels] : [`${command.label} is not prepared.`]
  }
  if (!command.targetRfqId) {
    return [`${command.label} is missing its target RFQ id.`]
  }
  if (!command.releaseExecutionFingerprint) {
    return [`${command.label} is missing its release execution fingerprint.`]
  }
  return []
}

function outcomeExternalId(
  key: NonCncPromotedQuoteOfferCreationCommandExecution["key"],
  targetRfqId: string | undefined,
  executionFingerprint: string,
): string {
  return stableOutcomeId(outcomePrefix(key), targetRfqId ?? "unassigned-rfq", executionFingerprint)
}

function outcomePrefix(key: NonCncPromotedQuoteOfferCreationCommandExecution["key"]): string {
  switch (key) {
    case "draft_customer_offer":
      return "customer-offer-draft"
    case "prepare_export_package":
      return "customer-offer-export"
    case "open_release_review":
      return "customer-offer-release-review"
    default:
      return assertNever(key)
  }
}

function outcomeMessage(command: NonCncPromotedQuoteOfferCreationCommandExecution): string {
  switch (command.key) {
    case "draft_customer_offer":
      return "Prepared customer-offer draft from reviewed non-CNC offer creation package."
    case "prepare_export_package":
      return "Prepared customer-offer export package from reviewed non-CNC offer creation package."
    case "open_release_review":
      return "Prepared customer-offer release review from reviewed non-CNC offer creation package."
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
      "Non-CNC offer creation execution outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
    )
  }
  return token
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function assertNever(value: never): never {
  throw new Error(`Unsupported non-CNC offer creation execution outcome command: ${JSON.stringify(value)}`)
}
