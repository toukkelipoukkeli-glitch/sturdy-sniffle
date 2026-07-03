import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import type { QuoteReleaseGateDecision } from "../workspace/quoteReleaseGate"
import { QUOTE_RELEASE_GATE_VERSION } from "../workspace/quoteReleaseGate"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import { buildOfferEmailDraftPackage, type OfferEmailDraftPackage } from "./offerEmailDraftPackage"
import { createLocalOfferEmailDraftProvider } from "./offerEmailDraftProvider"
import { buildOfferReleasePlan, type OfferReleasePlan } from "./offerReleasePlan"
import { buildOfferReleaseProviderCommandOutcomes } from "./offerReleaseProviderOutcomes"

describe("offer release provider command outcomes", () => {
  it("uses the email draft provider outcome and local outcomes for the rest of a ready release plan", async () => {
    const releasePlan = readyReleasePlan()
    const emailPackage = buildOfferEmailDraftPackage(releasePlan)
    const emailDraftResult = await createLocalOfferEmailDraftProvider().draftEmail(emailPackage)

    const outcomes = buildOfferReleaseProviderCommandOutcomes({ emailDraftResult, releasePlan })

    expect(outcomes.map((outcome) => [outcome.key, outcome.status])).toEqual([
      ["email-draft", "applied"],
      ["lifecycle-sent", "applied"],
      ["workspace-status", "applied"],
      ["lifecycle-follow-up", "applied"],
      ["calendar-follow-up", "applied"],
      ["workspace-follow-up", "applied"],
    ])
    expect(outcomes[0]).toMatchObject({
      externalId: expect.stringMatching(/^local-email-draft:offer-email-draft-package-/),
      key: "email-draft",
      message: "Email draft prepared locally for nora@example.test.",
      warnings: ["Local email draft provider recorded the package; no external Gmail call was made."],
    })
    expect(outcomes.find((outcome) => outcome.key === "calendar-follow-up")).toMatchObject({
      externalId: "local-release:offer-204:calendar-follow-up",
      warnings: ["Local adapter recorded the command; no external calendar connector call was made."],
    })
  })

  it("fails only the email draft command when the provider blocks the package", async () => {
    const releasePlan = readyReleasePlan()
    const blockedPackage: OfferEmailDraftPackage = {
      ...buildOfferEmailDraftPackage(releasePlan),
      attachmentFileNames: [],
      body: " ",
      commandKey: "email-draft",
      recipient: " ",
      status: "ready",
    }
    const emailDraftResult = await createLocalOfferEmailDraftProvider().draftEmail(blockedPackage)

    const outcomes = buildOfferReleaseProviderCommandOutcomes({ emailDraftResult, releasePlan })

    expect(outcomes[0]).toEqual({
      key: "email-draft",
      message:
        "Email draft package is missing a recipient. Email draft package is missing body copy. Email draft package must include at least one attachment.",
      status: "failed",
      warnings: [],
    })
    expect(outcomes.slice(1).every((outcome) => outcome.status === "applied")).toBe(true)
  })

  it("requires a matching email draft provider outcome for the email command", () => {
    const releasePlan = readyReleasePlan()

    expect(buildOfferReleaseProviderCommandOutcomes({ releasePlan })[0]).toEqual({
      key: "email-draft",
      message: "Email draft provider result is required before release execution.",
      status: "failed",
      warnings: [],
    })

    expect(
      buildOfferReleaseProviderCommandOutcomes({
        emailDraftResult: {
          blockerLabels: [],
          commandOutcome: {
            key: "other-command",
            status: "applied",
          },
          mode: "local",
          packageFingerprint: "offer-email-draft-package-mismatch",
          providerVersion: "offer-email-draft-provider.v1",
          status: "applied",
          warnings: [],
        },
        releasePlan,
      })[0],
    ).toMatchObject({
      key: "email-draft",
      message: "Email draft provider outcome other-command does not match release command email-draft.",
      status: "failed",
    })
  })

  it("returns no command outcomes for non-ready release plans", () => {
    expect(buildOfferReleaseProviderCommandOutcomes({ releasePlan: blockedReleasePlan() })).toEqual([])
  })

  it("rejects blank local external id prefixes", () => {
    expect(() =>
      buildOfferReleaseProviderCommandOutcomes({
        localExternalIdPrefix: " ",
        releasePlan: readyReleasePlan(),
      }),
    ).toThrow("localExternalIdPrefix is required")
  })
})

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
