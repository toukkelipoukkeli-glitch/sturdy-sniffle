import { describe, expect, it } from "vitest"

import { aluminumBracketFixture, rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { calculateCncQuote } from "../quoting/cnc"
import { weldedFrameFixture } from "../quoting/fabrication.fixtures"
import { pomGuideFixture } from "../quoting/plastics.fixtures"
import { calculateQuote, type QuoteEngineResult } from "../quoting/registry"
import { laserBentBracketFixture } from "../quoting/sheetMetal.fixtures"
import { toolSteelKeywayFixture } from "../quoting/wireEdm.fixtures"
import { appendOfferRevision, buildCncOfferDraft, buildOfferDraft, formatOfferMoney, formatOfferRevisionSummary, renderOfferText } from "./offer"

const quoteEngineOfferCases: Array<{ quote: QuoteEngineResult; processLabel: string }> = [
  {
    quote: calculateQuote({ process: "sheet_metal", input: laserBentBracketFixture }),
    processLabel: "Sheet metal",
  },
  {
    quote: calculateQuote({ process: "plastic", input: pomGuideFixture }),
    processLabel: "Plastic machining",
  },
  {
    quote: calculateQuote({ process: "wire_edm", input: toolSteelKeywayFixture }),
    processLabel: "Wire EDM",
  },
  {
    quote: calculateQuote({ process: "fabrication", input: weldedFrameFixture }),
    processLabel: "Fabrication",
  },
]

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
      revisionHistory: [
        {
          revision: 1,
          createdAt: "2026-06-19",
          createdBy: "FactoryBid OS",
          reason: "Initial draft",
        },
      ],
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
    expect(text).toContain("Revision: 1")
    expect(text).toContain("Line total: EUR 500.00")
    expect(text).toContain("Total excluding VAT: EUR 500.00")
    expect(text).toContain("Review flags: Minimum order adjustment applied.")
    expect(text).toContain("- VAT: Prices exclude VAT.")
  })

  it("appends deterministic offer revision history", () => {
    const offer = buildCncOfferDraft({
      offerNumber: "OFFER-204",
      customer: { name: "North Forge" },
      issuedAt: "2026-06-19",
      validUntil: "2026-07-03",
      quote: calculateCncQuote(aluminumBracketFixture),
    })

    const revised = appendOfferRevision(offer, {
      createdAt: "2026-06-20",
      createdBy: "Sari",
      reason: "Added expedite alternate requested by buyer.",
    })

    expect(revised.revisionHistory).toEqual([
      {
        revision: 1,
        createdAt: "2026-06-19",
        createdBy: "FactoryBid OS",
        reason: "Initial draft",
      },
      {
        revision: 2,
        createdAt: "2026-06-20",
        createdBy: "Sari",
        reason: "Added expedite alternate requested by buyer.",
      },
    ])
    expect(renderOfferText(revised)).toContain("Revision: 2")
    expect(formatOfferRevisionSummary(revised.revisionHistory)).toBe(
      "Revision 2 (2026-06-20) by Sari: Added expedite alternate requested by buyer.",
    )
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

  it.each(quoteEngineOfferCases)("builds offer line for $processLabel quotes", ({ quote, processLabel }) => {
    const offer = buildOfferDraft({
      offerNumber: `OFFER-${quote.process.toUpperCase()}`,
      customer: { name: "Process Buyer" },
      issuedAt: "2026-06-19",
      validUntil: "2026-07-03",
      quote,
    })

    expect(offer.items[0]).toMatchObject({
      key: `${quote.process}:${quote.partNumber}`,
      partNumber: quote.partNumber,
      description: processLabel,
      processLabel,
      totalCents: quote.totalCents,
    })
    expect(renderOfferText(offer)).toContain(`Process: ${processLabel}`)
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
