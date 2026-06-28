import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type { NonCncQuotePromotionQuoteSnapshot } from "./nonCncQuotePromotionPlan"
import type { NonCncQuotePromotionReadModel } from "./nonCncQuotePromotionReadModel"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION = "non-cnc-promoted-quote-application-plan.v1"

export type NonCncPromotedQuoteApplicationPlanStatus = "blocked" | "ready"
export type NonCncPromotedQuoteApplicationCommandStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteApplicationCommand {
  key: "replace_active_quote" | "refresh_offer_workspace" | "open_offer_builder"
  label: string
  status: NonCncPromotedQuoteApplicationCommandStatus
  detail: string
  externalId?: string
}

export interface NonCncPromotedQuoteApplicationPlan {
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION
  applicationId: string
  packageId: string
  selectedPlanId: string
  targetRfqId: string
  requestedAt: string
  requestedBy: string
  status: NonCncPromotedQuoteApplicationPlanStatus
  quoteSnapshot?: NonCncQuotePromotionQuoteSnapshot
  blockerLabels: string[]
  reviewWarnings: string[]
  commands: NonCncPromotedQuoteApplicationCommand[]
  nextOperatorMessage: string
  mutationBoundary: string
  sourceExecutionFingerprint?: string
}

export interface BuildNonCncPromotedQuoteApplicationPlanInput {
  readModel: NonCncQuotePromotionReadModel
  targetRfqId: string
  requestedAt: string
  requestedBy: string
}

export function buildNonCncPromotedQuoteApplicationPlan({
  readModel,
  requestedAt,
  requestedBy,
  targetRfqId,
}: BuildNonCncPromotedQuoteApplicationPlanInput): NonCncPromotedQuoteApplicationPlan {
  const normalizedTargetRfqId = nonBlank(targetRfqId, "targetRfqId")
  const blockerLabels = applicationBlockers(readModel, normalizedTargetRfqId)
  const status: NonCncPromotedQuoteApplicationPlanStatus = blockerLabels.length === 0 ? "ready" : "blocked"
  const quoteSnapshot = status === "ready" && readModel.quoteSnapshot ? { ...readModel.quoteSnapshot } : undefined

  return {
    applicationId: buildApplicationId(readModel.packageId, normalizedTargetRfqId),
    blockerLabels,
    commands: buildApplicationCommands(readModel, status),
    mutationBoundary:
      "Application plan is deterministic review data only; it must not mutate active RFQ quote, offer, or release state until an operator commits it.",
    nextOperatorMessage:
      status === "ready"
        ? "Promoted non-CNC quote is ready for an operator-reviewed active RFQ quote application."
        : "Resolve promoted quote blockers before applying a non-CNC quote to the active RFQ.",
    packageId: readModel.packageId,
    planVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION,
    quoteSnapshot,
    requestedAt: normalizeIsoTimestamp(requestedAt, "requestedAt"),
    requestedBy: nonBlank(requestedBy, "requestedBy"),
    reviewWarnings: [...readModel.reviewWarnings],
    selectedPlanId: readModel.selectedPlanId,
    sourceExecutionFingerprint: readModel.executionFingerprint,
    status,
    targetRfqId: normalizedTargetRfqId,
  }
}

function applicationBlockers(readModel: NonCncQuotePromotionReadModel, targetRfqId: string): string[] {
  return uniqueLabels([
    ...(readModel.status === "promoted" ? [] : ["Promoted quote read model is not ready."]),
    ...(readModel.quoteSnapshot ? [] : ["Promoted quote snapshot is missing."]),
    ...(readModel.quoteExternalId ? [] : ["Promoted quote external id is missing."]),
    ...(readModel.offerReadinessExternalId ? [] : ["Offer readiness external id is missing."]),
    ...(readModel.offerBuilderExternalId ? [] : ["Offer builder external id is missing."]),
    ...(readModel.targetRfqId ? [] : ["Promoted quote target RFQ is missing."]),
    ...(readModel.targetRfqId && readModel.targetRfqId !== targetRfqId
      ? [`Promoted quote target RFQ does not match active RFQ: ${readModel.targetRfqId}.`]
      : []),
    ...readModel.blockerLabels,
  ])
}

function buildApplicationCommands(
  readModel: NonCncQuotePromotionReadModel,
  status: NonCncPromotedQuoteApplicationPlanStatus,
): NonCncPromotedQuoteApplicationCommand[] {
  const commandStatus: NonCncPromotedQuoteApplicationCommandStatus = status === "ready" ? "ready" : "blocked"
  return [
    {
      detail:
        commandStatus === "ready"
          ? "Replace the active RFQ quote with the promoted non-CNC quote snapshot."
          : "Keep active RFQ quote unchanged until the promoted quote is ready.",
      externalId: commandStatus === "ready" ? readModel.quoteExternalId : undefined,
      key: "replace_active_quote",
      label: "Apply promoted quote",
      status: commandStatus,
    },
    {
      detail:
        commandStatus === "ready"
          ? "Refresh offer readiness from the promoted non-CNC quote."
          : "Offer readiness continues to follow the active workspace quote.",
      externalId: commandStatus === "ready" ? readModel.offerReadinessExternalId : undefined,
      key: "refresh_offer_workspace",
      label: "Refresh offer workspace",
      status: commandStatus,
    },
    {
      detail:
        commandStatus === "ready"
          ? "Open the offer builder with the promoted non-CNC quote candidate."
          : "Offer builder stays guarded until the active quote application is reviewed.",
      externalId: commandStatus === "ready" ? readModel.offerBuilderExternalId : undefined,
      key: "open_offer_builder",
      label: "Open offer builder",
      status: commandStatus,
    },
  ]
}

function buildApplicationId(packageId: string, targetRfqId: string): string {
  return `non-cnc-promoted-quote-application:${toStableIdToken(targetRfqId, "targetRfqId")}:${toStableIdToken(packageId, "readModel.packageId")}`
}

function toStableIdToken(value: string, key: string): string {
  const token = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  if (!token) {
    throw new Error(`${key} must contain at least one alphanumeric character`)
  }
  return token
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
