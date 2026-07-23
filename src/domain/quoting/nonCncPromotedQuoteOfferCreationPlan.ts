import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type { NonCncPromotedQuoteOfferWiringReadiness } from "./nonCncPromotedQuoteOfferWiringReadiness"

export const NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION = "non-cnc-promoted-quote-offer-creation-plan.v1"

export type NonCncPromotedQuoteOfferCreationPlanStatus = "blocked" | "ready"
export type NonCncPromotedQuoteOfferCreationCommandStatus = "blocked" | "ready"
export type NonCncPromotedQuoteOfferCreationCommandKey =
  | "draft_customer_offer"
  | "prepare_export_package"
  | "open_release_review"

export interface NonCncPromotedQuoteOfferCreationCommand {
  key: NonCncPromotedQuoteOfferCreationCommandKey
  label: string
  status: NonCncPromotedQuoteOfferCreationCommandStatus
  idempotencyKey: string
  blockerLabels: string[]
  reviewWarnings: string[]
  targetRfqId?: string
  quoteExternalId?: string
  offerReadinessExternalId?: string
  offerBuilderExternalId?: string
  releaseExecutionFingerprint?: string
}

export interface NonCncPromotedQuoteOfferCreationPlan {
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION
  creationPlanId: string
  status: NonCncPromotedQuoteOfferCreationPlanStatus
  targetRfqId: string
  packageId: string
  selectedPlanId: string
  requestedAt: string
  requestedBy: string
  commandCount: number
  commands: NonCncPromotedQuoteOfferCreationCommand[]
  quoteSummary?: {
    partNumber: string
    processLabel: string
    quantity: number
    currency: string
    totalCents: number
    unitPriceCents: number
    leadTimeDays: number
  }
  releaseExecutionFingerprint?: string
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  offerCreationBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferCreationPlanInput {
  readiness: NonCncPromotedQuoteOfferWiringReadiness
  requestedAt: string
  requestedBy: string
}

const commandMeta = [
  { key: "draft_customer_offer", label: "Draft customer offer" },
  { key: "prepare_export_package", label: "Prepare export package" },
  { key: "open_release_review", label: "Open release review" },
] satisfies Array<{ key: NonCncPromotedQuoteOfferCreationCommandKey; label: string }>

export function buildNonCncPromotedQuoteOfferCreationPlan({
  readiness,
  requestedAt,
  requestedBy,
}: BuildNonCncPromotedQuoteOfferCreationPlanInput): NonCncPromotedQuoteOfferCreationPlan {
  const blockerLabels = creationBlockers(readiness)
  const ready = blockerLabels.length === 0
  const normalizedRequestedAt = normalizeIsoTimestamp(requestedAt, "requestedAt")
  const normalizedRequestedBy = nonBlank(requestedBy, "requestedBy")
  const creationPlanId = buildCreationPlanId(readiness)
  const commands = commandMeta.map(({ key, label }) =>
    buildCommand({
      blockerLabels,
      creationPlanId,
      key,
      label,
      readiness,
      ready,
    }),
  )

  return {
    blockerLabels,
    commandCount: commands.length,
    commands,
    creationPlanId,
    nextOperatorMessage: ready
      ? "Non-CNC promoted quote is ready for a future customer-offer creation adapter."
      : "Keep non-CNC customer-offer creation blocked until offer-wiring readiness is ready.",
    offerCreationBoundary:
      "Offer creation plans are deterministic adapter descriptors only; building the plan does not create customer offers, export packages, release plans, or connector side effects.",
    packageId: readiness.packageId,
    planVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
    quoteSummary: ready && readiness.candidate ? quoteSummary(readiness.candidate) : undefined,
    releaseExecutionFingerprint: ready ? readiness.releaseExecutionFingerprint : undefined,
    requestedAt: normalizedRequestedAt,
    requestedBy: normalizedRequestedBy,
    reviewWarnings: [...readiness.reviewWarnings],
    selectedPlanId: readiness.selectedPlanId,
    status: ready ? "ready" : "blocked",
    targetRfqId: readiness.targetRfqId,
  }
}

function buildCommand({
  blockerLabels,
  creationPlanId,
  key,
  label,
  readiness,
  ready,
}: {
  blockerLabels: string[]
  creationPlanId: string
  key: NonCncPromotedQuoteOfferCreationCommandKey
  label: string
  readiness: NonCncPromotedQuoteOfferWiringReadiness
  ready: boolean
}): NonCncPromotedQuoteOfferCreationCommand {
  return {
    blockerLabels: ready ? [] : [...blockerLabels],
    idempotencyKey: [creationPlanId, key].join(":"),
    key,
    label,
    offerBuilderExternalId: ready ? readiness.candidate?.offerBuilderExternalId : undefined,
    offerReadinessExternalId: ready ? readiness.candidate?.offerReadinessExternalId : undefined,
    quoteExternalId: ready ? readiness.candidate?.quoteExternalId : undefined,
    releaseExecutionFingerprint: ready ? readiness.releaseExecutionFingerprint : undefined,
    reviewWarnings: [...readiness.reviewWarnings],
    status: ready ? "ready" : "blocked",
    targetRfqId: ready ? readiness.targetRfqId : undefined,
  }
}

function creationBlockers(readiness: NonCncPromotedQuoteOfferWiringReadiness): string[] {
  return uniqueLabels([
    ...(readiness.status === "ready" ? [] : ["Offer-wiring readiness is not ready."]),
    ...(readiness.candidate ? [] : ["Offer-wiring candidate is missing."]),
    ...(readiness.releaseExecutionFingerprint ? [] : ["Release execution fingerprint is missing."]),
    ...readiness.blockerLabels,
  ])
}

function buildCreationPlanId(readiness: NonCncPromotedQuoteOfferWiringReadiness): string {
  return [
    "non-cnc-promoted-quote-offer-creation-plan",
    toStableIdToken(readiness.targetRfqId, "readiness.targetRfqId"),
    toStableIdToken(readiness.packageId, "readiness.packageId"),
    toStableIdToken(readiness.selectedPlanId, "readiness.selectedPlanId"),
  ].join(":")
}

function quoteSummary(candidate: NonNullable<NonCncPromotedQuoteOfferWiringReadiness["candidate"]>) {
  return {
    currency: candidate.currency,
    leadTimeDays: candidate.leadTimeDays,
    partNumber: candidate.partNumber,
    processLabel: candidate.processLabel,
    quantity: candidate.quantity,
    totalCents: candidate.totalCents,
    unitPriceCents: candidate.unitPriceCents,
  }
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
