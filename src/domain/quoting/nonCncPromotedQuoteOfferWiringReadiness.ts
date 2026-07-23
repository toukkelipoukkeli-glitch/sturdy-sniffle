import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type { NonCncQuotePromotionReadModel } from "./nonCncQuotePromotionReadModel"
import type { NonCncPromotedQuoteReleaseReadiness } from "./nonCncPromotedQuoteReleaseReadiness"

export const NON_CNC_PROMOTED_QUOTE_OFFER_WIRING_READINESS_VERSION = "non-cnc-promoted-quote-offer-wiring-readiness.v1"

export type NonCncPromotedQuoteOfferWiringReadinessStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteOfferWiringCandidate {
  partNumber: string
  processLabel: string
  quantity: number
  currency: string
  totalCents: number
  unitPriceCents: number
  leadTimeDays: number
  quoteExternalId: string
  offerReadinessExternalId: string
  offerBuilderExternalId: string
}

export interface NonCncPromotedQuoteOfferWiringReadiness {
  readinessVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_WIRING_READINESS_VERSION
  status: NonCncPromotedQuoteOfferWiringReadinessStatus
  targetRfqId: string
  packageId: string
  selectedPlanId: string
  requestedAt: string
  requestedBy: string
  releaseStatus: NonCncPromotedQuoteReleaseReadiness["status"]
  releaseExecutionFingerprint?: string
  candidate?: NonCncPromotedQuoteOfferWiringCandidate
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  offerWiringBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferWiringReadinessInput {
  readModel: NonCncQuotePromotionReadModel
  releaseReadiness: NonCncPromotedQuoteReleaseReadiness
  requestedAt: string
  requestedBy: string
  targetRfqId: string
}

export function buildNonCncPromotedQuoteOfferWiringReadiness({
  readModel,
  releaseReadiness,
  requestedAt,
  requestedBy,
  targetRfqId,
}: BuildNonCncPromotedQuoteOfferWiringReadinessInput): NonCncPromotedQuoteOfferWiringReadiness {
  const normalizedTargetRfqId = nonBlank(targetRfqId, "targetRfqId")
  const blockerLabels = offerWiringBlockers({ readModel, releaseReadiness, targetRfqId: normalizedTargetRfqId })
  const ready = blockerLabels.length === 0
  const candidate = ready ? buildCandidate(readModel) : undefined

  return {
    blockerLabels,
    candidate,
    nextOperatorMessage: ready
      ? "Non-CNC promoted quote has persisted apply evidence for a future customer-offer wiring adapter."
      : "Keep non-CNC offer wiring blocked until promoted quote and release-readiness evidence are both ready.",
    offerWiringBoundary:
      "Offer wiring readiness is deterministic review data only; this helper does not create customer offers, mutate release state, or call connectors.",
    packageId: readModel.packageId,
    readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_WIRING_READINESS_VERSION,
    releaseExecutionFingerprint: ready ? releaseReadiness.latestExecutionFingerprint : undefined,
    releaseStatus: releaseReadiness.status,
    requestedAt: normalizeIsoTimestamp(requestedAt, "requestedAt"),
    requestedBy: nonBlank(requestedBy, "requestedBy"),
    reviewWarnings: uniqueLabels([...readModel.reviewWarnings, ...releaseReadiness.reviewWarnings]),
    selectedPlanId: readModel.selectedPlanId,
    status: ready ? "ready" : "blocked",
    targetRfqId: normalizedTargetRfqId,
  }
}

function offerWiringBlockers({
  readModel,
  releaseReadiness,
  targetRfqId,
}: {
  readModel: NonCncQuotePromotionReadModel
  releaseReadiness: NonCncPromotedQuoteReleaseReadiness
  targetRfqId: string
}): string[] {
  return uniqueLabels([
    ...(readModel.status === "promoted" ? [] : ["Promoted quote read model is not ready."]),
    ...(readModel.quoteSnapshot ? [] : ["Promoted quote snapshot is missing."]),
    ...(readModel.quoteExternalId ? [] : ["Promoted quote external id is missing."]),
    ...(readModel.offerReadinessExternalId ? [] : ["Offer readiness external id is missing."]),
    ...(readModel.offerBuilderExternalId ? [] : ["Offer builder external id is missing."]),
    ...(readModel.targetRfqId === targetRfqId
      ? []
      : [`Promoted quote target RFQ does not match active RFQ: ${readModel.targetRfqId ?? "missing"}.`]),
    ...(releaseReadiness.targetRfqId === targetRfqId
      ? []
      : [`Release readiness target RFQ does not match active RFQ: ${releaseReadiness.targetRfqId}.`]),
    ...(releaseReadiness.status === "ready" ? [] : ["Persisted non-CNC release readiness is not ready."]),
    ...(releaseReadiness.latestExecutionFingerprint ? [] : ["Release-ready apply execution fingerprint is missing."]),
    ...readModel.blockerLabels,
    ...releaseReadiness.blockerLabels,
  ])
}

function buildCandidate(readModel: NonCncQuotePromotionReadModel): NonCncPromotedQuoteOfferWiringCandidate {
  const quoteSnapshot = readModel.quoteSnapshot
  if (!quoteSnapshot || !readModel.quoteExternalId || !readModel.offerReadinessExternalId || !readModel.offerBuilderExternalId) {
    throw new Error("ready non-CNC offer wiring requires promoted quote identifiers and a quote snapshot")
  }

  return {
    currency: quoteSnapshot.currency,
    leadTimeDays: quoteSnapshot.leadTimeDays,
    offerBuilderExternalId: readModel.offerBuilderExternalId,
    offerReadinessExternalId: readModel.offerReadinessExternalId,
    partNumber: quoteSnapshot.partNumber,
    processLabel: quoteSnapshot.processLabel,
    quantity: quoteSnapshot.quantity,
    quoteExternalId: readModel.quoteExternalId,
    totalCents: quoteSnapshot.totalCents,
    unitPriceCents: quoteSnapshot.unitPriceCents,
  }
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
