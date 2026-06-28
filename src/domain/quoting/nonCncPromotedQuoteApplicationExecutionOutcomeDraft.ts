import type { NonCncPromotedQuoteApplicationCommandOutcomeInput } from "./nonCncPromotedQuoteApplicationExecution"
import type {
  NonCncPromotedQuoteApplicationCommandRecord,
  NonCncPromotedQuoteApplicationRecord,
} from "./nonCncPromotedQuoteApplicationPersistence"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_OUTCOME_DRAFT_VERSION =
  "non-cnc-promoted-quote-application-execution-outcome-draft.v1"

export type NonCncPromotedQuoteApplicationExecutionOutcomeDraftStatus = "blocked" | "ready"
export type NonCncPromotedQuoteApplicationCommandOutcomeDraftStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteApplicationCommandOutcomeDraft {
  key: NonCncPromotedQuoteApplicationCommandRecord["key"]
  label: string
  status: NonCncPromotedQuoteApplicationCommandOutcomeDraftStatus
  idempotencyKey: string
  blockerLabels: string[]
  externalId?: string
  suggestedOutcome?: NonCncPromotedQuoteApplicationCommandOutcomeInput
}

export interface NonCncPromotedQuoteApplicationExecutionOutcomeDraft {
  draftVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_OUTCOME_DRAFT_VERSION
  applicationId: string
  applicationRecordId: string
  packageId: string
  selectedPlanId: string
  targetRfqId: string
  status: NonCncPromotedQuoteApplicationExecutionOutcomeDraftStatus
  readyOutcomeCount: number
  blockedOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteApplicationCommandOutcomeDraft[]
  nextOperatorMessage: string
  reviewWarnings: string[]
  mutationBoundary: string
}

export function buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(
  applicationRecord: NonCncPromotedQuoteApplicationRecord,
): NonCncPromotedQuoteApplicationExecutionOutcomeDraft {
  const commandOutcomes = applicationRecord.commands.map((command) => buildCommandOutcomeDraft(applicationRecord, command))
  const readyOutcomeCount = commandOutcomes.filter((outcome) => outcome.status === "ready").length
  const blockedOutcomeCount = commandOutcomes.length - readyOutcomeCount
  const status = applicationRecord.status === "ready" && blockedOutcomeCount === 0 ? "ready" : "blocked"
  const blockerLabels = dedupeLabels(
    applicationRecord.blockerLabels.length > 0
      ? applicationRecord.blockerLabels
      : commandOutcomes.flatMap((outcome) => outcome.blockerLabels),
  )

  return {
    applicationId: applicationRecord.applicationId,
    applicationRecordId: applicationRecord.applicationRecordId,
    blockedOutcomeCount,
    commandOutcomes,
    draftVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_OUTCOME_DRAFT_VERSION,
    mutationBoundary:
      "Application outcome drafts are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until an operator commits them.",
    nextOperatorMessage:
      status === "ready"
        ? `Review and commit ${readyOutcomeCount} non-CNC application outcome${readyOutcomeCount === 1 ? "" : "s"}.`
        : blockerLabels.join(" ") || "Application record is review-only and cannot mutate active RFQ quote state.",
    packageId: applicationRecord.packageId,
    readyOutcomeCount,
    reviewWarnings: [...applicationRecord.reviewWarnings],
    selectedPlanId: applicationRecord.selectedPlanId,
    status,
    targetRfqId: applicationRecord.targetRfqId,
  }
}

function buildCommandOutcomeDraft(
  applicationRecord: NonCncPromotedQuoteApplicationRecord,
  command: NonCncPromotedQuoteApplicationCommandRecord,
): NonCncPromotedQuoteApplicationCommandOutcomeDraft {
  const idempotencyKey = applicationCommandOutcomeIdempotencyKey(applicationRecord.applicationId, command.key)
  const blockerLabels = commandOutcomeBlockerLabels(applicationRecord, command)
  if (blockerLabels) {
    return {
      blockerLabels,
      idempotencyKey,
      key: command.key,
      label: command.label,
      status: "blocked",
    }
  }

  return {
    blockerLabels: [],
    externalId: command.externalId,
    idempotencyKey,
    key: command.key,
    label: command.label,
    status: "ready",
    suggestedOutcome: {
      externalId: command.externalId,
      key: command.key,
      message: outcomeMessage(command),
      status: "applied",
      warnings: [...applicationRecord.reviewWarnings],
    },
  }
}

function commandOutcomeBlockerLabels(
  applicationRecord: NonCncPromotedQuoteApplicationRecord,
  command: NonCncPromotedQuoteApplicationCommandRecord,
): string[] | null {
  if (applicationRecord.status !== "ready") {
    return [...applicationRecord.blockerLabels]
  }

  if (command.status !== "ready") {
    return [`${command.label} is not ready.`]
  }

  if (!command.externalId) {
    return [`${command.label} is missing its external id.`]
  }

  return null
}

function outcomeMessage(command: NonCncPromotedQuoteApplicationCommandRecord): string {
  switch (command.key) {
    case "replace_active_quote":
      return "Prepared active RFQ quote replacement from promoted non-CNC quote."
    case "refresh_offer_workspace":
      return "Prepared offer workspace refresh from promoted non-CNC quote."
    case "open_offer_builder":
      return "Prepared offer builder handoff from promoted non-CNC quote."
    default:
      return assertNever(command.key)
  }
}

function dedupeLabels(labels: string[]): string[] {
  return [...new Set(labels)]
}

function applicationCommandOutcomeIdempotencyKey(applicationId: string, commandKey: string): string {
  return ["non-cnc-application-outcome", applicationId, commandKey].map(sanitizeKeyPart).join(":")
}

function sanitizeKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function assertNever(value: never): never {
  throw new Error(`Unsupported non-CNC application outcome command: ${JSON.stringify(value)}`)
}
