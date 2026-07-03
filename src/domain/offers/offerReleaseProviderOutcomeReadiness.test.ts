import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import type { QuoteReleaseGateDecision } from "../workspace/quoteReleaseGate"
import { QUOTE_RELEASE_GATE_VERSION } from "../workspace/quoteReleaseGate"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferEmailDraftPackage, type OfferEmailDraftPackage } from "./offerEmailDraftPackage"
import { createLocalOfferEmailDraftProvider } from "./offerEmailDraftProvider"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import { buildOfferReleasePlan, type OfferReleasePlan } from "./offerReleasePlan"
import { summarizeOfferReleaseProviderOutcomeHistory } from "./offerReleaseProviderOutcomeHistory"
import { createLocalOfferReleaseProviderOutcomePersistence } from "./offerReleaseProviderOutcomePersistence"
import {
  buildOfferReleaseProviderOutcomeReadiness,
  OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
} from "./offerReleaseProviderOutcomeReadiness"
import { buildOfferReleaseProviderCommandOutcomes } from "./offerReleaseProviderOutcomes"

describe("offer release provider outcome readiness", () => {
  it("marks complete applied provider outcomes ready for release execution", async () => {
    const releasePlan = readyReleasePlan()
    const history = await historyFor(releasePlan, await readyCommandOutcomes(releasePlan))

    expect(buildOfferReleaseProviderOutcomeReadiness({ history, releasePlan })).toEqual({
      appliedCommandCount: 6,
      blockerLabels: [],
      expectedCommandCount: 6,
      failedCommandCount: 0,
      latestCommandCount: 6,
      latestOutcomeFingerprint: expect.stringMatching(/^offer-release-provider-outcomes-/),
      missingCommandCount: 0,
      nextActions: ["Provider outcomes are ready for release execution."],
      offerId: "offer-204",
      offerNumber: "OFFER-204",
      readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
      rfqId: "rfq-204",
      status: "ready",
    })
  })

  it("blocks when provider outcomes are missing for a ready release plan", () => {
    const releasePlan = readyReleasePlan()
    const history = summarizeOfferReleaseProviderOutcomeHistory({ records: [] })

    expect(buildOfferReleaseProviderOutcomeReadiness({ history, releasePlan })).toMatchObject({
      blockerLabels: [
        "Provider outcome batch is missing for the ready release plan.",
        "6 provider outcome commands missing.",
      ],
      expectedCommandCount: 6,
      latestCommandCount: 0,
      missingCommandCount: 6,
      status: "blocked",
    })
  })

  it("blocks failed and incomplete provider outcome batches", async () => {
    const releasePlan = readyReleasePlan()
    const commandOutcomes = await blockedEmailCommandOutcomes(releasePlan)
    const history = await historyFor(releasePlan, commandOutcomes.slice(0, -1))

    expect(buildOfferReleaseProviderOutcomeReadiness({ history, releasePlan })).toMatchObject({
      appliedCommandCount: 4,
      blockerLabels: ["1 provider outcome command missing.", "1 provider outcome command failed."],
      failedCommandCount: 1,
      latestCommandCount: 5,
      missingCommandCount: 1,
      nextActions: [
        "Resolve provider outcome readiness: 1 provider outcome command missing.",
        "Resolve provider outcome readiness: 1 provider outcome command failed.",
      ],
      status: "blocked",
    })
  })

  it("does not require provider outcomes before the release plan is ready", () => {
    const releasePlan = blockedReleasePlan()
    const history = summarizeOfferReleaseProviderOutcomeHistory({ records: [] })

    expect(buildOfferReleaseProviderOutcomeReadiness({ history, releasePlan })).toMatchObject({
      blockerLabels: ["Release plan is blocked; provider outcomes are not required yet."],
      expectedCommandCount: 0,
      nextActions: ["Resolve release plan blockers before requesting provider outcomes."],
      status: "blocked",
    })
  })
})

async function historyFor(releasePlan: OfferReleasePlan, commandOutcomes: Awaited<ReturnType<typeof readyCommandOutcomes>>) {
  const adapter = createLocalOfferReleaseProviderOutcomePersistence()
  await adapter.recordOutcomes({
    commandOutcomes,
    recordedAt: "2026-06-20T09:05:00+03:00",
    recordedBy: "Sari",
    releasePlan,
  })
  return summarizeOfferReleaseProviderOutcomeHistory(adapter.snapshot())
}

async function readyCommandOutcomes(releasePlan: OfferReleasePlan) {
  const emailPackage = buildOfferEmailDraftPackage(releasePlan)
  const emailDraftResult = await createLocalOfferEmailDraftProvider().draftEmail(emailPackage)
  return buildOfferReleaseProviderCommandOutcomes({ emailDraftResult, releasePlan })
}

async function blockedEmailCommandOutcomes(releasePlan: OfferReleasePlan) {
  const blockedPackage: OfferEmailDraftPackage = {
    ...buildOfferEmailDraftPackage(releasePlan),
    attachmentFileNames: [],
    body: " ",
    commandKey: "email-draft",
    recipient: " ",
    status: "ready",
  }
  const emailDraftResult = await createLocalOfferEmailDraftProvider().draftEmail(blockedPackage)
  return buildOfferReleaseProviderCommandOutcomes({ emailDraftResult, releasePlan })
}

function readyReleasePlan(): OfferReleasePlan {
  const offer = offerDraft()
  return buildOfferReleasePlan({
    actor: "sales",
    currentRfqStatus: "ready",
    exportPackage: offerExportPackage(offer),
    followUpDueAt: "2026-06-24T09:00:00+03:00",
    followUpTaskId: "fu-204",
    offer,
    offerId: "offer-204",
    releaseGate: releaseGate(),
    rfqId: "rfq-204",
    timezone: "Europe/Helsinki",
  })
}

function blockedReleasePlan(): OfferReleasePlan {
  const offerWithoutEmail = {
    ...offerDraft(),
    customer: {
      contactName: "Nora Buyer",
      name: "North Forge",
    },
  }
  return buildOfferReleasePlan({
    actor: "sales",
    currentRfqStatus: "estimating",
    exportPackage: offerExportPackage(offerWithoutEmail),
    offer: offerWithoutEmail,
    offerId: "offer-204",
    releaseGate: releaseGate(),
    rfqId: "rfq-204",
    timezone: "Europe/Helsinki",
  })
}

function offerDraft(): OfferDraft {
  return buildCncOfferDraft({
    customer: {
      contactName: "Nora Buyer",
      email: "nora@example.test",
      name: "North Forge",
    },
    issuedAt: "2026-06-20",
    offerNumber: "OFFER-204",
    quote: calculateCncQuote(aluminumBracketFixture),
    rfqReference: "rfq-204",
    subject: "Aluminum bracket production batch",
    validUntil: "2026-07-04",
  })
}

function offerExportPackage(offer: OfferDraft): OfferExportPackage {
  return buildOfferExportPackage({ offer })
}

function releaseGate(overrides: Partial<QuoteReleaseGateDecision> = {}): QuoteReleaseGateDecision {
  return {
    blockerCount: 0,
    checkedAt: "2026-06-20T09:00:00+03:00",
    checks: [],
    issues: [],
    nextActions: [],
    offerNumber: "OFFER-204",
    releaseGateVersion: QUOTE_RELEASE_GATE_VERSION,
    rfqId: "rfq-204",
    status: "ready",
    warningCount: 0,
    ...overrides,
  }
}
