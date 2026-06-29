import type {
  NonCncPromotedQuoteApplicationMutationCommandExecution,
  NonCncPromotedQuoteApplicationMutationCommandOutcomeInput,
  NonCncPromotedQuoteApplicationMutationExecutionRun,
} from "./nonCncPromotedQuoteApplicationMutationExecution"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_OUTCOME_DRAFT_VERSION =
  "non-cnc-promoted-quote-application-mutation-execution-outcome-draft.v1"

export type NonCncPromotedQuoteApplicationMutationExecutionOutcomeDraftStatus = "blocked" | "ready"
export type NonCncPromotedQuoteApplicationMutationCommandOutcomeDraftStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteApplicationMutationCommandOutcomeDraft {
  key: NonCncPromotedQuoteApplicationMutationCommandExecution["key"]
  label: string
  mutationTarget: NonCncPromotedQuoteApplicationMutationCommandExecution["mutationTarget"]
  status: NonCncPromotedQuoteApplicationMutationCommandOutcomeDraftStatus
  idempotencyKey: string
  blockerLabels: string[]
  externalId?: string
  suggestedOutcome?: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput
}

export interface NonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft {
  draftVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_OUTCOME_DRAFT_VERSION
  mutationPackageId: string
  executionFingerprint: string
  mode: NonCncPromotedQuoteApplicationMutationExecutionRun["mode"]
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  status: NonCncPromotedQuoteApplicationMutationExecutionOutcomeDraftStatus
  readyOutcomeCount: number
  blockedOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteApplicationMutationCommandOutcomeDraft[]
  nextOperatorMessage: string
  reviewWarnings: string[]
  mutationBoundary: string
}

export function buildNonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft(
  run: NonCncPromotedQuoteApplicationMutationExecutionRun,
): NonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft {
  const commandOutcomes = run.commands.map((command) => buildCommandOutcomeDraft(run, command))
  const readyOutcomeCount = commandOutcomes.filter((outcome) => outcome.status === "ready").length
  const blockedOutcomeCount = commandOutcomes.length - readyOutcomeCount
  const status = run.mode === "dry_run" && run.status === "prepared" && blockedOutcomeCount === 0 ? "ready" : "blocked"
  const blockerLabels = dedupeLabels(
    status === "ready" ? [] : commandOutcomes.flatMap((outcome) => outcome.blockerLabels).concat(run.nextActions),
  )

  return {
    applicationId: run.applicationId,
    applicationRecordId: run.applicationRecordId,
    blockedOutcomeCount,
    commandOutcomes,
    draftVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_OUTCOME_DRAFT_VERSION,
    executionFingerprint: run.executionFingerprint,
    mode: run.mode,
    mutationBoundary:
      "Application mutation execution outcome drafts are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until an operator commits them.",
    mutationPackageId: run.mutationPackageId,
    nextOperatorMessage:
      status === "ready"
        ? `Review and commit ${readyOutcomeCount} non-CNC application mutation outcome${readyOutcomeCount === 1 ? "" : "s"}.`
        : blockerLabels.join(" ") || "Application mutation execution is not ready for committed outcomes.",
    packageId: run.packageId,
    readyOutcomeCount,
    reviewWarnings: [...run.warnings],
    selectedPlanId: run.selectedPlanId,
    status,
    targetRfqId: run.targetRfqId,
  }
}

function buildCommandOutcomeDraft(
  run: NonCncPromotedQuoteApplicationMutationExecutionRun,
  command: NonCncPromotedQuoteApplicationMutationCommandExecution,
): NonCncPromotedQuoteApplicationMutationCommandOutcomeDraft {
  const blockerLabels = commandOutcomeBlockerLabels(run, command)
  if (blockerLabels.length > 0) {
    return {
      blockerLabels,
      idempotencyKey: command.idempotencyKey,
      key: command.key,
      label: command.label,
      mutationTarget: command.mutationTarget,
      status: "blocked",
    }
  }

  const externalId = outcomeExternalId(command)
  return {
    blockerLabels: [],
    externalId,
    idempotencyKey: command.idempotencyKey,
    key: command.key,
    label: command.label,
    mutationTarget: command.mutationTarget,
    status: "ready",
    suggestedOutcome: {
      externalId,
      key: command.key,
      message: outcomeMessage(command),
      status: "applied",
      warnings: [...command.reviewWarnings],
    },
  }
}

function commandOutcomeBlockerLabels(
  run: NonCncPromotedQuoteApplicationMutationExecutionRun,
  command: NonCncPromotedQuoteApplicationMutationCommandExecution,
): string[] {
  if (run.mode !== "dry_run") {
    return ["Application mutation outcome drafts must be based on a dry-run execution."]
  }
  if (run.status !== "prepared") {
    return run.nextActions.length > 0 ? [...run.nextActions] : ["Application mutation execution is not prepared."]
  }
  if (command.status !== "prepared") {
    return command.blockerLabels.length > 0 ? [...command.blockerLabels] : [`${command.label} is not prepared.`]
  }
  if (!command.targetRfqId) {
    return [`${command.label} is missing its target RFQ id.`]
  }
  if (!command.sourceExecutionFingerprint) {
    return [`${command.label} is missing its source execution fingerprint.`]
  }
  return []
}

function outcomeExternalId(command: NonCncPromotedQuoteApplicationMutationCommandExecution): string {
  return stableOutcomeId(command.mutationTarget, command.targetRfqId ?? "unassigned-rfq", command.sourceExecutionFingerprint ?? "unassigned-source")
}

function outcomeMessage(command: NonCncPromotedQuoteApplicationMutationCommandExecution): string {
  switch (command.key) {
    case "replace_active_quote":
      return "Prepared active RFQ quote mutation from reviewed non-CNC application package."
    case "refresh_offer_workspace":
      return "Prepared offer workspace mutation from reviewed non-CNC application package."
    case "open_offer_builder":
      return "Prepared release-state mutation from reviewed non-CNC application package."
    default:
      return assertNever(command.key)
  }
}

function stableOutcomeId(...parts: string[]): string {
  return parts.map(sanitizeKeyPart).join(":")
}

function sanitizeKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function dedupeLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function assertNever(value: never): never {
  throw new Error(`Unsupported non-CNC application mutation execution outcome command: ${JSON.stringify(value)}`)
}
