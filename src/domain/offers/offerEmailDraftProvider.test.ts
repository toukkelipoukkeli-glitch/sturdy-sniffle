import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import type { QuoteReleaseGateDecision } from "../workspace/quoteReleaseGate"
import { QUOTE_RELEASE_GATE_VERSION } from "../workspace/quoteReleaseGate"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import { buildOfferEmailDraftPackage, type OfferEmailDraftPackage } from "./offerEmailDraftPackage"
import { createLocalOfferEmailDraftProvider } from "./offerEmailDraftProvider"
import { fingerprintOfferEmailDraftPackage } from "./offerEmailDraftPackagePersistence"
import { buildOfferReleasePlan, type OfferReleasePlan } from "./offerReleasePlan"

describe("offer email draft provider", () => {
  it("turns a ready email draft package into a deterministic release command outcome", async () => {
    const emailPackage = readyEmailPackage()
    const provider = createLocalOfferEmailDraftProvider()

    const result = await provider.draftEmail(emailPackage)

    expect(result).toEqual({
      blockerLabels: [],
      commandOutcome: {
        externalId: `local-email-draft:${fingerprintOfferEmailDraftPackage(emailPackage)}`,
        key: "email-draft",
        message: "Email draft prepared locally for nora@example.test.",
        status: "applied",
        warnings: ["Local email draft provider recorded the package; no external Gmail call was made."],
      },
      externalId: `local-email-draft:${fingerprintOfferEmailDraftPackage(emailPackage)}`,
      message: "Email draft prepared locally for nora@example.test.",
      mode: "local",
      packageFingerprint: fingerprintOfferEmailDraftPackage(emailPackage),
      providerVersion: "offer-email-draft-provider.v1",
      status: "applied",
      warnings: ["Local email draft provider recorded the package; no external Gmail call was made."],
    })
  })

  it("supports mock mode and custom external id prefixes without changing package identity", async () => {
    const emailPackage = readyEmailPackage()
    const provider = createLocalOfferEmailDraftProvider({
      externalIdPrefix: "mock-gmail-draft",
      mode: "mock",
    })

    await expect(provider.draftEmail(emailPackage)).resolves.toMatchObject({
      commandOutcome: {
        externalId: `mock-gmail-draft:${fingerprintOfferEmailDraftPackage(emailPackage)}`,
        warnings: ["Mock email draft provider recorded the package; no external Gmail call was made."],
      },
      mode: "mock",
      packageFingerprint: fingerprintOfferEmailDraftPackage(emailPackage),
      status: "applied",
    })
  })

  it("blocks non-ready packages without producing a release command outcome", async () => {
    const emailPackage = blockedEmailPackage()
    const provider = createLocalOfferEmailDraftProvider()

    const result = await provider.draftEmail(emailPackage)

    expect(result).toMatchObject({
      blockerLabels: [
        "Customer email is required before offer release.",
        "RFQ status must be ready before offer release; current status is estimating.",
        "Offer release plan is blocked; email draft package is not provider-ready.",
        "Email draft package is blocked; provider draft is blocked.",
        "Email draft package is missing a release command key.",
        "Email draft package is missing a recipient.",
        "Email draft package is missing a subject.",
        "Email draft package is missing body copy.",
        "Email draft package must include at least one attachment.",
      ],
      status: "blocked",
      warnings: [],
    })
    expect(result).not.toHaveProperty("commandOutcome")
  })

  it("blocks malformed ready packages at the provider boundary", async () => {
    const emailPackage: OfferEmailDraftPackage = {
      ...readyEmailPackage(),
      attachmentFileNames: [],
      body: " ",
      commandKey: " ",
      recipient: " ",
    }
    const provider = createLocalOfferEmailDraftProvider()

    const result = await provider.draftEmail(emailPackage)

    expect(result).toMatchObject({
      blockerLabels: [
        "Email draft package is missing a release command key.",
        "Email draft package is missing a recipient.",
        "Email draft package is missing body copy.",
        "Email draft package must include at least one attachment.",
      ],
      status: "blocked",
    })
    expect(result).not.toHaveProperty("commandOutcome")
  })

  it("rejects invalid provider configuration", () => {
    expect(() => createLocalOfferEmailDraftProvider({ externalIdPrefix: " " })).toThrow("externalIdPrefix is required")
    expect(() => createLocalOfferEmailDraftProvider({ mode: "remote" as never })).toThrow(
      "email draft provider mode must be local or mock",
    )
  })
})

function readyEmailPackage(): OfferEmailDraftPackage {
  return buildOfferEmailDraftPackage(readyReleasePlan())
}

function blockedEmailPackage(): OfferEmailDraftPackage {
  const offerWithoutEmail = {
    ...offerDraft(),
    customer: {
      contactName: "Nora Buyer",
      name: "North Forge",
    },
  }
  return buildOfferEmailDraftPackage(
    buildOfferReleasePlan({
      actor: "sales",
      currentRfqStatus: "estimating",
      exportPackage: offerExportPackage(offerWithoutEmail),
      offer: offerWithoutEmail,
      offerId: "offer-204",
      releaseGate: releaseGate(),
      rfqId: "rfq-204",
      timezone: "Europe/Helsinki",
    }),
  )
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
