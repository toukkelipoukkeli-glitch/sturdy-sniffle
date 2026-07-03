import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import type { QuoteReleaseGateDecision, QuoteReleaseGateIssue } from "../workspace/quoteReleaseGate"
import { QUOTE_RELEASE_GATE_VERSION } from "../workspace/quoteReleaseGate"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import { buildOfferEmailDraftPackage } from "./offerEmailDraftPackage"
import { buildOfferReleasePlan, type OfferReleasePlan } from "./offerReleasePlan"

describe("offer email draft package", () => {
  it("packages a ready release email command for future provider drafting", () => {
    const draftPackage = buildOfferEmailDraftPackage(readyReleasePlan())

    expect(draftPackage).toMatchObject({
      attachmentFileNames: ["OFFER-204-rev1.pdf"],
      blockerLabels: [],
      commandKey: "email-draft",
      offerId: "offer-204",
      offerNumber: "OFFER-204",
      packageVersion: "offer-email-draft-package.v1",
      recipient: "nora@example.test",
      releaseAt: "2026-06-20T06:00:00.000Z",
      rfqId: "rfq-204",
      status: "ready",
      subject: "Offer OFFER-204: Aluminum bracket production batch",
      summaryHeadline:
        "Offer OFFER-204 is ready to send to nora@example.test with OFFER-204-rev1.pdf. Follow-up is scheduled for 2026-06-24T06:00:00.000Z.",
      warningLabels: [],
    })
    expect(draftPackage.body).toContain("Offer OFFER-204")
    expect(draftPackage.bodyPreview).toContain("Offer OFFER-204")
    expect(draftPackage.nextActions).toEqual([
      "Draft offer email",
      "Mark offer sent",
      "Move RFQ to sent",
      "Track offer follow-up",
      "Create follow-up calendar event",
      "Record workspace follow-up",
    ])
  })

  it("preserves every attachment filename from the ready email command", () => {
    const plan = readyReleasePlan()
    const emailCommand = plan.commands.find((command) => command.kind === "email_draft")
    if (!emailCommand?.payload) {
      throw new Error("test fixture expected an email command")
    }
    emailCommand.payload.attachments = ["OFFER-204-rev1.pdf", "terms-appendix.pdf"]

    expect(buildOfferEmailDraftPackage(plan).attachmentFileNames).toEqual(["OFFER-204-rev1.pdf", "terms-appendix.pdf"])
  })

  it("blocks manager-review plans without exposing provider draft payload fields", () => {
    const draftPackage = buildOfferEmailDraftPackage(reviewedReleasePlanRequired())

    expect(draftPackage).toMatchObject({
      attachmentFileNames: [],
      blockerLabels: ["Offer release plan is needs_review; email draft package is not provider-ready."],
      nextActions: ["Quote approval policy needs manager review."],
      status: "blocked",
      warningLabels: ["Quote approval policy needs manager review."],
    })
    expect(draftPackage).not.toHaveProperty("recipient")
    expect(draftPackage).not.toHaveProperty("subject")
    expect(draftPackage).not.toHaveProperty("body")
  })

  it("blocks stale release plans with their operator-visible release blockers", () => {
    const offerWithoutEmail = {
      ...offerDraft(),
      customer: {
        contactName: "Nora Buyer",
        name: "North Forge",
      },
    }
    const blockedPlan = buildOfferReleasePlan({
      actor: "sales",
      currentRfqStatus: "estimating",
      exportPackage: offerExportPackage(offerWithoutEmail),
      offer: offerWithoutEmail,
      offerId: "offer-204",
      releaseGate: releaseGate(),
      rfqId: "rfq-204",
      timezone: "Europe/Helsinki",
    })

    expect(buildOfferEmailDraftPackage(blockedPlan)).toMatchObject({
      blockerLabels: [
        "Customer email is required before offer release.",
        "RFQ status must be ready before offer release; current status is estimating.",
        "Offer release plan is blocked; email draft package is not provider-ready.",
      ],
      status: "blocked",
    })
    const draftPackage = buildOfferEmailDraftPackage(blockedPlan)
    expect(draftPackage).not.toHaveProperty("recipient")
    expect(draftPackage).not.toHaveProperty("subject")
    expect(draftPackage).not.toHaveProperty("body")
  })

  it("blocks malformed email commands with explicit payload blockers", () => {
    const plan = readyReleasePlan()
    const emailCommand = plan.commands.find((command) => command.kind === "email_draft")
    if (!emailCommand?.payload) {
      throw new Error("test fixture expected an email command")
    }
    emailCommand.payload.to = " "
    emailCommand.payload.subject = 123
    emailCommand.payload.body = ""
    emailCommand.payload.attachments = []

    expect(buildOfferEmailDraftPackage(plan)).toMatchObject({
      attachmentFileNames: [],
      blockerLabels: [
        "Email draft command is missing a recipient.",
        "Email draft command is missing a subject.",
        "Email draft command is missing body copy.",
        "Email draft command must include at least one attachment.",
      ],
      commandKey: "email-draft",
      status: "blocked",
    })
    const draftPackage = buildOfferEmailDraftPackage(plan)
    expect(draftPackage).not.toHaveProperty("recipient")
    expect(draftPackage).not.toHaveProperty("subject")
    expect(draftPackage).not.toHaveProperty("body")
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

function reviewedReleasePlanRequired(): OfferReleasePlan {
  const offer = offerDraft()
  return buildOfferReleasePlan({
    actor: "sales",
    currentRfqStatus: "ready",
    exportPackage: offerExportPackage(offer),
    offer,
    offerId: "offer-204",
    releaseGate: releaseGate({
      issues: [releaseIssue("approval_needs_review", "Quote approval policy needs manager review.")],
      nextActions: ["Quote approval policy needs manager review."],
      status: "needs_review",
      warningCount: 1,
    }),
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

function releaseIssue(code: QuoteReleaseGateIssue["code"], message: string): QuoteReleaseGateIssue {
  return {
    code,
    message,
    severity: "warning",
  }
}
