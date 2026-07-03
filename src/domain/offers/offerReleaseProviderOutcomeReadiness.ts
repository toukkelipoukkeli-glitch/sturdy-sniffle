import { nonBlank } from "../shared/stringValidation"
import type { OfferReleasePlan } from "./offerReleasePlan"
import type { OfferReleaseProviderOutcomeHistorySummary } from "./offerReleaseProviderOutcomeHistory"

export const OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION = "offer-release-provider-outcome-readiness.v1"

export type OfferReleaseProviderOutcomeReadinessStatus = "blocked" | "ready"

export interface BuildOfferReleaseProviderOutcomeReadinessInput {
  history: OfferReleaseProviderOutcomeHistorySummary
  releasePlan: OfferReleasePlan
}

export interface OfferReleaseProviderOutcomeReadiness {
  readinessVersion: typeof OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION
  status: OfferReleaseProviderOutcomeReadinessStatus
  offerId: string
  offerNumber: string
  rfqId: string
  expectedCommandCount: number
  latestCommandCount: number
  appliedCommandCount: number
  failedCommandCount: number
  missingCommandCount: number
  blockerLabels: string[]
  nextActions: string[]
  latestOutcomeFingerprint?: string
}

export function buildOfferReleaseProviderOutcomeReadiness({
  history,
  releasePlan,
}: BuildOfferReleaseProviderOutcomeReadinessInput): OfferReleaseProviderOutcomeReadiness {
  const offerId = nonBlank(releasePlan.offerId, "releasePlan.offerId")
  const offerNumber = nonBlank(releasePlan.offerNumber, "releasePlan.offerNumber")
  const rfqId = nonBlank(releasePlan.rfqId, "releasePlan.rfqId")
  const expectedCommandCount = releasePlan.status === "ready" ? releasePlan.commands.filter((command) => command.status === "ready").length : 0
  const latest = history.latestOutcomeBatch
  const latestCommandCount = latest?.commandCount ?? 0
  const appliedCommandCount = latest?.appliedCommandCount ?? 0
  const failedCommandCount = latest?.failedCommandCount ?? 0
  const missingCommandCount = Math.max(0, expectedCommandCount - latestCommandCount)
  const blockerLabels = providerOutcomeBlockers({
    expectedCommandCount,
    failedCommandCount,
    history,
    latestCommandCount,
    missingCommandCount,
    releasePlan,
  })

  return {
    appliedCommandCount,
    blockerLabels,
    expectedCommandCount,
    failedCommandCount,
    latestCommandCount,
    missingCommandCount,
    nextActions: providerOutcomeNextActions(blockerLabels, releasePlan),
    offerId,
    offerNumber,
    readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
    rfqId,
    status: blockerLabels.length === 0 ? "ready" : "blocked",
    ...(latest ? { latestOutcomeFingerprint: latest.outcomeFingerprint } : {}),
  }
}

function providerOutcomeBlockers(input: {
  expectedCommandCount: number
  failedCommandCount: number
  history: OfferReleaseProviderOutcomeHistorySummary
  latestCommandCount: number
  missingCommandCount: number
  releasePlan: OfferReleasePlan
}): string[] {
  if (input.releasePlan.status !== "ready") {
    return [`Release plan is ${input.releasePlan.status}; provider outcomes are not required yet.`]
  }
  if (input.expectedCommandCount === 0) {
    return ["Release plan has no ready commands to satisfy."]
  }

  const blockers: string[] = []
  if (input.history.totalOutcomeBatches === 0) {
    blockers.push("Provider outcome batch is missing for the ready release plan.")
  }
  if (input.missingCommandCount > 0) {
    blockers.push(`${input.missingCommandCount} provider outcome command${input.missingCommandCount === 1 ? "" : "s"} missing.`)
  }
  if (input.latestCommandCount > input.expectedCommandCount) {
    blockers.push("Provider outcome batch contains more commands than the ready release plan.")
  }
  if (input.failedCommandCount > 0) {
    blockers.push(`${input.failedCommandCount} provider outcome command${input.failedCommandCount === 1 ? "" : "s"} failed.`)
  }
  return blockers
}

function providerOutcomeNextActions(blockerLabels: string[], releasePlan: OfferReleasePlan): string[] {
  if (blockerLabels.length === 0) {
    return ["Provider outcomes are ready for release execution."]
  }
  if (releasePlan.status !== "ready") {
    return ["Resolve release plan blockers before requesting provider outcomes."]
  }
  return blockerLabels.map((blocker) => `Resolve provider outcome readiness: ${blocker}`)
}
