import { describe, expect, it } from "vitest"

import { aluminumBracketFixture, rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { calculateCncQuote } from "../quoting/cnc"
import { buildCncOfferDraft, formatOfferMoney, renderOfferText } from "./offer"

describe("offer builder", () => {
  it("builds a deterministic CNC offer draft from calculator output", () => {
    const quote = calculateCncQuote(rushTurnedSpacerFixture)
    const offer = buildCncOfferDraft({
      offerNumber: "OFFER-019",
      customer: {
        name: "Baltic Hydraulics",
        contactName: "Mikael Laine",
        email: "mikael@example.test",
      },
      issuedAt: "2026-06-19",
      validUntil: "2026-07-03",
      quote,
      lineDescription: "Turned spacer FB-TURN-019",
      notes: ["Rush lead time included.", "Passivation included as outside service."],
      rfqReference: "rfq-019",
      subject: "Turned spacer RFQ",
    })

    expect(offer).toMatchObject({
      builderVersion: "offer.v1",
      offerNumber: "OFFER-019",
      status: "draft",
      currency: "EUR",
      subtotalCents: 50000,
      totalCents: 50000,
      items: [
        {
          partNumber: "FB-TURN-019",
          description: "Turned spacer FB-TURN-019",
          processLabel: "CNC turning",
          quantity: 1,
          leadTimeDays: 3,
          totalCents: 50000,
        },
      ],
    })

    const text = renderOfferText(offer)

    expect(text).toContain("Offer OFFER-019")
    expect(text).toContain("Customer: Baltic Hydraulics")
    expect(text).toContain("Line total: EUR 500.00")
    expect(text).toContain("Total excluding VAT: EUR 500.00")
    expect(text).toContain("Review flags: Minimum order adjustment applied.")
    expect(text).toContain("- VAT: Prices exclude VAT.")
  })

  it("preserves unit price remainder in the plain-text export", () => {
    const quote = calculateCncQuote(aluminumBracketFixture)
    const offer = buildCncOfferDraft({
      offerNumber: "OFFER-204",
      customer: { name: "North Forge" },
      issuedAt: "2026-06-19",
      validUntil: "2026-07-03",
      quote,
    })

    expect(quote.unitRemainderCents).toBe(18)
    expect(renderOfferText(offer)).toContain("Rounding allocation: EUR 0.18 included in line total")
  })

  it("formats integer-cent amounts without locale drift", () => {
    expect(formatOfferMoney(115418, "EUR")).toBe("EUR 1154.18")
    expect(formatOfferMoney(-75, "USD")).toBe("-USD 0.75")
  })

  it("rejects impossible validity windows", () => {
    const quote = calculateCncQuote(rushTurnedSpacerFixture)

    expect(() =>
      buildCncOfferDraft({
        offerNumber: "OFFER-019",
        customer: { name: "Baltic Hydraulics" },
        issuedAt: "2026-07-03",
        validUntil: "2026-06-19",
        quote,
      }),
    ).toThrow("validUntil must be on or after issuedAt")
  })

  it("rejects blank customer names", () => {
    const quote = calculateCncQuote(rushTurnedSpacerFixture)

    expect(() =>
      buildCncOfferDraft({
        offerNumber: "OFFER-019",
        customer: { name: " " },
        issuedAt: "2026-06-19",
        validUntil: "2026-07-03",
        quote,
      }),
    ).toThrow("customer.name is required")
  })
})
