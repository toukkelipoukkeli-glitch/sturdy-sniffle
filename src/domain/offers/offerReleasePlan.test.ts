import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import type { QuoteReleaseGateDecision, QuoteReleaseGateIssue } from "../workspace/quoteReleaseGate"
import { QUOTE_RELEASE_GATE_VERSION } from "../workspace/quoteReleaseGate"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import { buildOfferReleasePlan } from "./offerReleasePlan"

describe("offer release command plan", () => {
  it("plans deterministic email, lifecycle, calendar, and workspace commands for a clean release gate", () => {
    const offer = offerDraft()
    const exportPackage = offerExportPackage(offer)
    const plan = buildOfferReleasePlan({
      actor: "sales",
      currentRfqStatus: "ready",
      exportPackage,
      followUpDueAt: "2026-06-24T09:00:00+03:00",
      followUpTaskId: "fu-204",
      offer,
      offerId: "offer-204",
      releaseGate: releaseGate(),
      rfqId: "rfq-204",
      timezone: "Europe/Helsinki",
    })

    expect(plan).toMatchObject({
      mode: "automatic",
      offerId: "offer-204",
      offerNumber: "OFFER-204",
      planVersion: "offer-release-plan.v1",
      releaseAt: "2026-06-20T06:00:00.000Z",
      rfqId: "rfq-204",
      status: "ready",
    })
    expect(plan.commands.map((command) => command.kind)).toEqual([
      "email_draft",
      "lifecycle_sent",
      "workspace_status",
      "lifecycle_follow_up",
      "calendar_follow_up",
      "workspace_follow_up",
    ])
    expect(plan.commands[0]).toMatchObject({
      detail: "Draft customer email to nora@example.test.",
      payload: {
        attachments: ["OFFER-204-rev1.pdf"],
        subject: "Offer OFFER-204: Aluminum bracket production batch",
        to: "nora@example.test",
      },
      status: "ready",
    })
    expect(plan.sendSummary).toEqual({
      attachmentFileName: "OFFER-204-rev1.pdf",
      blockerLabels: [],
      commandLabels: [
        "Draft offer email",
        "Mark offer sent",
        "Move RFQ to sent",
        "Track offer follow-up",
        "Create follow-up calendar event",
        "Record workspace follow-up",
      ],
      followUpDueAt: "2026-06-24T06:00:00.000Z",
      headline:
        "Offer OFFER-204 is ready to send to nora@example.test with OFFER-204-rev1.pdf. Follow-up is scheduled for 2026-06-24T06:00:00.000Z.",
      recipient: "nora@example.test",
      status: "ready",
      summaryVersion: "offer-release-send-summary.v1",
      warningLabels: [],
    })
    expect(plan.lifecyclePreview).toMatchObject({
      offerNumber: "OFFER-204",
      status: "sent",
    })
    expect(plan.lifecyclePreview?.events.map((event) => event.kind)).toEqual(["sent", "follow_up_scheduled"])
    expect(plan.lifecyclePreview?.followUpTasks).toEqual([
      {
        createdAt: "2026-06-20T06:00:00.000Z",
        dueAt: "2026-06-24T06:00:00.000Z",
        id: "fu-204",
        offerNumber: "OFFER-204",
        status: "open",
        title: "Follow up OFFER-204",
      },
    ])
    expect(plan.calendarPlan?.events).toEqual([
      expect.objectContaining({
        kind: "offer_follow_up",
        metadata: expect.objectContaining({
          followUpTaskId: "fu-204",
          offerId: "offer-204",
          offerNumber: "OFFER-204",
        }),
        startAt: "2026-06-24T06:00:00.000Z",
        timezone: "Europe/Helsinki",
      }),
    ])
    expect(plan.workspaceActions.map((action) => [action.kind, action.activityKind])).toEqual([
      ["status_change", "status_change"],
      ["follow_up_created", "calendar_event"],
    ])
  })

  it("requires manager review for warning gates before drafting release commands", () => {
    const plan = buildOfferReleasePlan({
      actor: "sales",
      currentRfqStatus: "ready",
      exportPackage: offerExportPackage(offerDraft()),
      offer: offerDraft(),
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

    expect(plan).toMatchObject({
      mode: "manager_review_required",
      nextActions: ["Quote approval policy needs manager review."],
      status: "needs_review",
      warnings: ["Quote approval policy needs manager review."],
    })
    expect(plan.commands).toEqual([
      {
        detail: "Quote approval policy needs manager review.",
        key: "manager-review:warnings",
        kind: "manager_review",
        label: "Manager release review",
        status: "requires_review",
      },
    ])
    expect(plan.lifecycleEvents).toEqual([])
    expect(plan.workspaceActions).toEqual([])
  })

  it("allows reviewed warning gates while preserving release warnings", () => {
    const offer = offerDraft()
    const plan = buildOfferReleasePlan({
      actor: "sales",
      currentRfqStatus: "ready",
      exportPackage: offerExportPackage(offer),
      offer,
      offerId: "offer-204",
      releaseGate: releaseGate({
        issues: [releaseIssue("material_at_risk", "Allocated material is missing certificate paperwork.")],
        nextActions: ["Allocated material is missing certificate paperwork."],
        status: "needs_review",
        warningCount: 1,
      }),
      reviewedBy: "Sari",
      reviewNote: "Certificate accepted with supplier email.",
      rfqId: "rfq-204",
      timezone: "Europe/Helsinki",
    })

    expect(plan.status).toBe("ready")
    expect(plan.mode).toBe("manager_reviewed")
    expect(plan.warnings).toEqual(["Allocated material is missing certificate paperwork."])
    expect(plan.lifecycleEvents[0]).toMatchObject({
      kind: "sent",
      note: "Release gate warnings reviewed by Sari. Certificate accepted with supplier email.",
    })
    expect(plan.commands.map((command) => command.kind)).toEqual(["email_draft", "lifecycle_sent", "workspace_status"])
  })

  it("blocks stale ready gates when local release preflight fails", () => {
    const offerWithoutEmail = {
      ...offerDraft(),
      customer: {
        contactName: "Nora Buyer",
        name: "North Forge",
      },
    }
    const plan = buildOfferReleasePlan({
      actor: "sales",
      currentRfqStatus: "estimating",
      exportPackage: offerExportPackage(offerWithoutEmail),
      offer: offerWithoutEmail,
      offerId: "offer-204",
      releaseGate: releaseGate(),
      rfqId: "rfq-204",
      timezone: "Europe/Helsinki",
    })

    expect(plan.status).toBe("blocked")
    expect(plan.commands).toEqual([
      {
        detail:
          "Customer email is required before offer release. RFQ status must be ready before offer release; current status is estimating.",
        key: "manager-review:blockers",
        kind: "manager_review",
        label: "Resolve release blockers",
        status: "blocked",
      },
    ])
    expect(plan.nextActions).toContain("Customer email is required before offer release.")
    expect(plan.nextActions).toContain("RFQ status must be ready before offer release; current status is estimating.")
    expect(plan.sendSummary).toEqual({
      blockerLabels: [
        "Customer email is required before offer release.",
        "RFQ status must be ready before offer release; current status is estimating.",
      ],
      commandLabels: ["Resolve release blockers"],
      headline:
        "Offer OFFER-204 release is blocked: Customer email is required before offer release. RFQ status must be ready before offer release; current status is estimating.",
      status: "blocked",
      summaryVersion: "offer-release-send-summary.v1",
      warningLabels: [],
    })
  })

  it("summarizes manager-review warning copy before release commands are built", () => {
    const plan = buildOfferReleasePlan({
      actor: "sales",
      currentRfqStatus: "ready",
      exportPackage: offerExportPackage(offerDraft()),
      offer: offerDraft(),
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

    expect(plan.sendSummary).toEqual({
      blockerLabels: [],
      commandLabels: ["Manager release review"],
      headline: "Offer OFFER-204 needs manager review before sending: Quote approval policy needs manager review.",
      recipient: "nora@example.test",
      status: "needs_review",
      summaryVersion: "offer-release-send-summary.v1",
      warningLabels: ["Quote approval policy needs manager review."],
    })
  })

  it("rejects release gates for a different offer", () => {
    const offer = offerDraft()

    expect(() =>
      buildOfferReleasePlan({
        actor: "sales",
        currentRfqStatus: "ready",
        exportPackage: offerExportPackage(offer),
        offer,
        offerId: "offer-204",
        releaseGate: releaseGate({ offerNumber: "OFFER-999" }),
        rfqId: "rfq-204",
        timezone: "Europe/Helsinki",
      }),
    ).toThrow("release gate offerNumber OFFER-999 does not match offer OFFER-204")
  })

  it("rejects export packages for a different offer", () => {
    const offer = offerDraft()
    const mismatchedExportOffer: OfferDraft = {
      ...offer,
      offerNumber: "OFFER-999",
    }

    expect(() =>
      buildOfferReleasePlan({
        actor: "sales",
        currentRfqStatus: "ready",
        exportPackage: offerExportPackage(mismatchedExportOffer),
        offer,
        offerId: "offer-204",
        releaseGate: releaseGate(),
        rfqId: "rfq-204",
        timezone: "Europe/Helsinki",
      }),
    ).toThrow("export package offerNumber OFFER-999 does not match offer OFFER-204")
  })
})

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
