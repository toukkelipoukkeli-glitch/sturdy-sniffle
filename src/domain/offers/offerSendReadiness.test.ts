import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture, rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { buildCncOfferDraft } from "./offer"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import { evaluateOfferSendReadiness } from "./offerSendReadiness"

describe("offer send readiness", () => {
  it("marks an offer ready when required send gates pass", () => {
    const quote = calculateCncQuote(aluminumBracketFixture)
    const offer = buildCncOfferDraft({
      customer: {
        contactName: "Nora Buyer",
        email: "nora@example.test",
        name: "North Forge",
      },
      issuedAt: "2026-06-20",
      offerNumber: "OFFER-204",
      quote,
      validUntil: "2026-07-04",
    })
    const exportPackage = buildOfferExportPackage({
      offer,
      alternates: [
        {
          id: "rush",
          label: "Rush expedite option",
          quote: calculateCncQuote({ ...aluminumBracketFixture, priority: "rush" }),
        },
      ],
    })

    const readiness = evaluateOfferSendReadiness({
      exportPackage,
      followUpScheduledAt: "2026-06-24T06:00:00.000Z",
      nowDate: "2026-06-20",
      offer,
      requireCleanCalculator: true,
    })

    expect(readiness).toMatchObject({
      checkedAt: "2026-06-20",
      offerNumber: "OFFER-204",
      readinessVersion: "offer-send-readiness.v1",
      status: "ready",
      issues: [],
    })
    expect(readiness.checks.map((check) => [check.key, check.status])).toEqual([
      ["missing_customer_email", "passed"],
      ["expired_validity", "passed"],
      ["pdf_not_ready", "passed"],
      ["calculator_review_flags", "passed"],
      ["missing_alternate", "passed"],
      ["missing_follow_up", "passed"],
    ])
  })

  it("keeps send available for review when non-blocking gates need attention", () => {
    const quote = calculateCncQuote(rushTurnedSpacerFixture)
    const offer = buildCncOfferDraft({
      customer: {
        email: "mikael@example.test",
        name: "Baltic Hydraulics",
      },
      issuedAt: "2026-06-20",
      offerNumber: "OFFER-019",
      quote,
      validUntil: "2026-07-04",
    })
    const exportPackage = buildOfferExportPackage({
      offer,
      alternates: [
        {
          id: "standard",
          label: "Standard lead time option",
          quote: calculateCncQuote({ ...rushTurnedSpacerFixture, priority: "normal" }),
        },
      ],
    })

    const readiness = evaluateOfferSendReadiness({
      exportPackage,
      nowDate: "2026-06-20",
      offer,
    })

    expect(readiness.status).toBe("needs_review")
    expect(readiness.issues).toEqual([
      {
        code: "calculator_review_flags",
        severity: "warning",
        message: "1 calculator review flag should be acknowledged before sending.",
      },
      {
        code: "missing_follow_up",
        severity: "warning",
        message: "No post-send follow-up is scheduled.",
      },
    ])
    expect(readiness.checks.find((check) => check.key === "calculator_review_flags")).toMatchObject({
      status: "warning",
    })
  })

  it("blocks sends with missing customer email, expired validity, or PDF export issues", () => {
    const quote = calculateCncQuote(rushTurnedSpacerFixture)
    const offer = buildCncOfferDraft({
      customer: { name: "Baltic Hydraulics" },
      issuedAt: "2026-06-20",
      offerNumber: "OFFER-019",
      quote,
      validUntil: "2026-06-21",
    })
    const exportPackage = withPdfReviewRequired(buildOfferExportPackage({ offer }))

    const readiness = evaluateOfferSendReadiness({
      exportPackage,
      nowDate: "2026-06-22",
      offer,
      requireCleanCalculator: true,
    })

    expect(readiness.status).toBe("blocked")
    expect(readiness.issues.map((issue) => [issue.code, issue.severity])).toEqual([
      ["missing_customer_email", "blocker"],
      ["expired_validity", "blocker"],
      ["pdf_not_ready", "blocker"],
      ["calculator_review_flags", "blocker"],
      ["missing_alternate", "warning"],
      ["missing_follow_up", "warning"],
    ])
    expect(readiness.checks.find((check) => check.key === "pdf_not_ready")).toMatchObject({
      detail: "PDF export is not ready: Missing required pricing section.",
      status: "blocked",
    })
  })

  it("rejects invalid readiness dates", () => {
    const quote = calculateCncQuote(aluminumBracketFixture)
    const offer = buildCncOfferDraft({
      customer: { email: "nora@example.test", name: "North Forge" },
      issuedAt: "2026-06-20",
      offerNumber: "OFFER-204",
      quote,
      validUntil: "2026-07-04",
    })

    expect(() =>
      evaluateOfferSendReadiness({
        exportPackage: buildOfferExportPackage({ offer }),
        nowDate: "2026-02-31",
        offer,
      }),
    ).toThrow("nowDate must be a valid ISO date")
  })
})

function withPdfReviewRequired(exportPackage: OfferExportPackage): OfferExportPackage {
  return {
    ...exportPackage,
    pdf: {
      ...exportPackage.pdf,
      missingRequiredSections: ["pricing"],
      status: "review_required",
      warnings: ["Missing required pricing section."],
    },
    status: "review_required",
  }
}
