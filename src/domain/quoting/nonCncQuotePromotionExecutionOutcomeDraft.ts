import type {
  NonCncQuotePromotionCommandPackage,
  NonCncQuotePromotionCommandPackageCommand,
  NonCncQuotePromotionCommandPackagePayload,
} from "./nonCncQuotePromotionCommandPackage"
import type { NonCncQuotePromotionCommandOutcomeInput } from "./nonCncQuotePromotionExecution"

export const NON_CNC_QUOTE_PROMOTION_EXECUTION_OUTCOME_DRAFT_VERSION =
  "non-cnc-quote-promotion-execution-outcome-draft.v1"

export type NonCncQuotePromotionExecutionOutcomeDraftStatus = "blocked" | "ready"
export type NonCncQuotePromotionCommandOutcomeDraftStatus = "blocked" | "ready"

export interface NonCncQuotePromotionCommandOutcomeDraft {
  key: NonCncQuotePromotionCommandPackageCommand["key"]
  label: string
  status: NonCncQuotePromotionCommandOutcomeDraftStatus
  idempotencyKey: string
  blockerLabels: string[]
  payloadKind?: NonCncQuotePromotionCommandPackagePayload["kind"]
  suggestedOutcome?: NonCncQuotePromotionCommandOutcomeInput
}

export interface NonCncQuotePromotionExecutionOutcomeDraft {
  draftVersion: typeof NON_CNC_QUOTE_PROMOTION_EXECUTION_OUTCOME_DRAFT_VERSION
  packageId: string
  packageVersion: NonCncQuotePromotionCommandPackage["packageVersion"]
  selectedPlanId: string
  targetRfqId?: string
  status: NonCncQuotePromotionExecutionOutcomeDraftStatus
  readyOutcomeCount: number
  blockedOutcomeCount: number
  commandOutcomes: NonCncQuotePromotionCommandOutcomeDraft[]
  nextOperatorMessage: string
  reviewWarnings: string[]
}

export function buildNonCncQuotePromotionExecutionOutcomeDraft(
  commandPackage: NonCncQuotePromotionCommandPackage,
): NonCncQuotePromotionExecutionOutcomeDraft {
  const commandOutcomes = commandPackage.commands.map((command) => buildCommandOutcomeDraft(commandPackage, command))
  const readyOutcomeCount = commandOutcomes.filter((outcome) => outcome.status === "ready").length
  const blockedOutcomeCount = commandOutcomes.length - readyOutcomeCount
  const status = commandPackage.status === "ready" && blockedOutcomeCount === 0 ? "ready" : "blocked"

  return {
    blockedOutcomeCount,
    commandOutcomes,
    draftVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_OUTCOME_DRAFT_VERSION,
    nextOperatorMessage:
      status === "ready"
        ? `Review and commit ${readyOutcomeCount} non-CNC promotion outcome${readyOutcomeCount === 1 ? "" : "s"}.`
        : commandPackage.nextOperatorMessage,
    packageId: commandPackage.packageId,
    packageVersion: commandPackage.packageVersion,
    readyOutcomeCount,
    reviewWarnings: [...commandPackage.reviewWarnings],
    selectedPlanId: commandPackage.selectedPlanId,
    status,
    targetRfqId: commandPackage.targetRfqId,
  }
}

function buildCommandOutcomeDraft(
  commandPackage: NonCncQuotePromotionCommandPackage,
  command: NonCncQuotePromotionCommandPackageCommand,
): NonCncQuotePromotionCommandOutcomeDraft {
  const idempotencyKey = promotionCommandIdempotencyKey(commandPackage.packageId, command.key)
  if (command.status !== "ready" || !command.payload) {
    return {
      blockerLabels: [...command.blockerLabels],
      idempotencyKey,
      key: command.key,
      label: command.label,
      status: "blocked",
    }
  }

  return {
    blockerLabels: [],
    idempotencyKey,
    key: command.key,
    label: command.label,
    payloadKind: command.payload.kind,
    status: "ready",
    suggestedOutcome: {
      externalId: outcomeExternalId(commandPackage, command.payload),
      key: command.key,
      message: outcomeMessage(command.payload),
      status: "applied",
      warnings: [...command.reviewWarnings],
    },
  }
}

function outcomeExternalId(
  commandPackage: NonCncQuotePromotionCommandPackage,
  payload: NonCncQuotePromotionCommandPackagePayload,
): string {
  switch (payload.kind) {
    case "quote_snapshot":
      return stableOutcomeId("quote", payload.targetRfqId, payload.quoteSnapshot.partNumber, payload.quoteSnapshot.calculatorVersion)
    case "offer_readiness_refresh":
      return stableOutcomeId("offer-readiness", payload.targetRfqId, payload.promotedProcess, String(payload.totalCents))
    case "offer_builder_enablement":
      return stableOutcomeId("offer-builder", payload.targetRfqId, payload.sourcePlanId, commandPackage.packageVersion)
    default:
      return assertNever(payload)
  }
}

function outcomeMessage(payload: NonCncQuotePromotionCommandPackagePayload): string {
  switch (payload.kind) {
    case "quote_snapshot":
      return `Prepared quote snapshot for ${payload.quoteSnapshot.partNumber}.`
    case "offer_readiness_refresh":
      return `Prepared offer readiness refresh for ${payload.promotedProcess}.`
    case "offer_builder_enablement":
      return `Prepared offer builder enablement for ${payload.sourcePlanId}.`
    default:
      return assertNever(payload)
  }
}

function promotionCommandIdempotencyKey(packageId: string, commandKey: string): string {
  return ["non-cnc-promotion-execution", packageId, commandKey].map(sanitizeKeyPart).join(":")
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

function assertNever(value: never): never {
  throw new Error(`Unsupported non-CNC promotion execution outcome payload: ${JSON.stringify(value)}`)
}
