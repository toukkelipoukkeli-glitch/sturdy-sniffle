import type { NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import type { NonCncQuotePromotionExecutionRun } from "./nonCncQuotePromotionExecution"
import type { NonCncQuotePromotionQuoteSnapshot } from "./nonCncQuotePromotionPlan"

export const NON_CNC_QUOTE_PROMOTION_READ_MODEL_VERSION = "non-cnc-quote-promotion-read-model.v1"

export type NonCncQuotePromotionReadiness = "blocked" | "promoted"

export interface NonCncQuotePromotionReadModel {
  readModelVersion: typeof NON_CNC_QUOTE_PROMOTION_READ_MODEL_VERSION
  packageId: string
  selectedPlanId: string
  executionFingerprint?: string
  targetRfqId?: string
  status: NonCncQuotePromotionReadiness
  quoteSnapshot?: NonCncQuotePromotionQuoteSnapshot
  quoteExternalId?: string
  offerReadinessExternalId?: string
  offerBuilderExternalId?: string
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
}

export interface BuildNonCncQuotePromotionReadModelInput {
  commandPackage: NonCncQuotePromotionCommandPackage
  executionRun?: NonCncQuotePromotionExecutionRun
}

export function buildNonCncQuotePromotionReadModel({
  commandPackage,
  executionRun,
}: BuildNonCncQuotePromotionReadModelInput): NonCncQuotePromotionReadModel {
  const executionBlockers = executionRun ? executionRunBlockers(commandPackage, executionRun) : ["No committed promotion execution run recorded."]
  const quoteCommand = executionRun?.commands.find((command) => command.key === "persist_quote_snapshot")
  const offerReadinessCommand = executionRun?.commands.find((command) => command.key === "refresh_offer_readiness")
  const offerBuilderCommand = executionRun?.commands.find((command) => command.key === "enable_offer_builder")
  const quoteSnapshot =
    quoteCommand?.status === "applied" && quoteCommand.payload?.kind === "quote_snapshot"
      ? { ...quoteCommand.payload.quoteSnapshot }
      : undefined
  const blockerLabels = uniqueLabels([
    ...commandPackage.blockerLabels,
    ...executionBlockers,
    ...(quoteSnapshot ? [] : ["Promoted quote snapshot has not been applied."]),
  ])
  const promoted =
    commandPackage.status === "ready" &&
    executionRun?.mode === "commit" &&
    executionRun.status === "succeeded" &&
    executionBlockers.length === 0 &&
    Boolean(quoteSnapshot)

  return {
    blockerLabels: promoted ? [] : blockerLabels,
    executionFingerprint: executionRun?.executionFingerprint,
    nextOperatorMessage: promoted
      ? "Non-CNC quote promotion is available as a read-only promoted quote candidate."
      : "Complete a successful reviewed non-CNC promotion commit before using the promoted quote.",
    offerBuilderExternalId: promoted && offerBuilderCommand?.status === "applied" ? offerBuilderCommand.externalId : undefined,
    offerReadinessExternalId:
      promoted && offerReadinessCommand?.status === "applied" ? offerReadinessCommand.externalId : undefined,
    packageId: commandPackage.packageId,
    quoteExternalId: promoted && quoteCommand?.status === "applied" ? quoteCommand.externalId : undefined,
    quoteSnapshot: promoted ? quoteSnapshot : undefined,
    readModelVersion: NON_CNC_QUOTE_PROMOTION_READ_MODEL_VERSION,
    reviewWarnings: uniqueLabels([...(executionRun?.warnings ?? []), ...commandPackage.reviewWarnings]),
    selectedPlanId: commandPackage.selectedPlanId,
    status: promoted ? "promoted" : "blocked",
    targetRfqId: commandPackage.targetRfqId,
  }
}

function executionRunBlockers(
  commandPackage: NonCncQuotePromotionCommandPackage,
  executionRun: NonCncQuotePromotionExecutionRun,
): string[] {
  const mismatches = [
    executionRun.packageId === commandPackage.packageId ? undefined : "packageId",
    executionRun.packageVersion === commandPackage.packageVersion ? undefined : "packageVersion",
    executionRun.selectedPlanId === commandPackage.selectedPlanId ? undefined : "selectedPlanId",
    executionRun.targetRfqId === commandPackage.targetRfqId ? undefined : "targetRfqId",
  ].filter((field): field is string => Boolean(field))
  return [
    ...(mismatches.length > 0 ? [`Promotion execution does not match command package: ${mismatches.join(", ")}.`] : []),
    ...(executionRun.mode === "commit" ? [] : ["Promotion execution must be committed, not dry-run only."]),
    ...(executionRun.status === "succeeded" ? [] : [`Promotion execution status is ${executionRun.status}.`]),
    ...executionRun.commands
      .filter((command) => command.status !== "applied")
      .map((command) => `${command.label} is ${command.status}.`),
  ]
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
