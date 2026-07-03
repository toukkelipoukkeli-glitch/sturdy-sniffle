import { describe, expect, it } from "vitest"

import { aluminumBracketFixture, rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { calculateCncQuote } from "../quoting/cnc"
import { buildCncOfferDraft } from "./offer"
import { buildOfferDocument } from "./offerDocument"

describe("offer document", () => {
  it("builds PDF-ready sections and tables from an offer draft", () => {
    const quote = calculateCncQuote(rushTurnedSpacerFixture)
    const offer = buildCncOfferDraft({
      customer: {
        contactName: "Mikael Laine",
        email: "mikael@example.test",
        name: "Baltic Hydraulics",
      },
      issuedAt: "2026-06-19",
      lineDescription: "Turned spacer FB-TURN-019",
      notes: ["Rush lead time included.", "Passivation included as outside service."],
      offerNumber: "OFFER-019",
      quote,
      rfqReference: "rfq-019",
      subject: "Turned spacer RFQ",
      validUntil: "2026-07-03",
    })

    const document = buildOfferDocument(offer)

    expect(document).toMatchObject({
      customerName: "Baltic Hydraulics",
      documentVersion: "offer-document.v1",
      offerNumber: "OFFER-019",
      title: "Offer OFFER-019",
      totalLabel: "EUR 500.00",
    })
    expect(document.sections.map((section) => section.key)).toEqual([
      "summary",
      "pricing",
      "assumptions",
      "review_flags",
      "revision_history",
      "notes",
      "terms",
    ])
    expect(document.sections.find((section) => section.key === "summary")?.fields).toEqual([
      { label: "Customer", value: "Baltic Hydraulics" },
      { label: "Contact", value: "Mikael Laine" },
      { label: "Email", value: "mikael@example.test" },
      { label: "RFQ", value: "rfq-019" },
      { label: "Subject", value: "Turned spacer RFQ" },
      { label: "Issued", value: "2026-06-19" },
      { label: "Valid until", value: "2026-07-03" },
      { label: "Revision", value: "1" },
      { label: "Total excluding VAT", value: "EUR 500.00" },
    ])
    expect(document.sections.find((section) => section.key === "pricing")?.table).toEqual({
      columns: ["Part", "Process", "Qty", "Unit price", "Line total", "Lead time"],
      rows: [["FB-TURN-019", "CNC turning", "1", "EUR 500.00", "EUR 500.00", "3 working days"]],
    })
    expect(document.sections.find((section) => section.key === "review_flags")?.table?.rows).toEqual([
      ["FB-TURN-019", "Minimum order adjustment applied."],
    ])
    expect(document.sections.find((section) => section.key === "notes")?.body).toEqual([
      "Rush lead time included.",
      "Passivation included as outside service.",
    ])
    expect(document.sections.find((section) => section.key === "revision_history")?.table).toEqual({
      columns: ["Rev", "Date", "By", "Reason"],
      rows: [["1", "2026-06-19", "FactoryBid OS", "Initial draft"]],
    })
    expect(document.sections.find((section) => section.key === "revision_history")?.fields).toEqual([
      {
        label: "Current revision",
        value: "Revision 1 (2026-06-19) by FactoryBid OS: Initial draft",
      },
    ])
    expect(document.sections.find((section) => section.key === "revision_history")?.body).toEqual([
      "- Revision 1: Initial draft (2026-06-19, FactoryBid OS)",
    ])
    expect(document.sections.find((section) => section.key === "terms")?.fields?.[0]).toEqual({
      label: "Key terms",
      value:
        "VAT: Prices exclude VAT.; Calculation basis: Material and machining assumptions follow the attached calculation.; Delivery start: Lead time starts after written approval and final drawing release.",
    })
    expect(document.footerLines).toEqual([
      "Prices exclude VAT unless otherwise stated.",
      "Lead times start after written approval and final drawing release.",
    ])
  })

  it("omits optional notes and review flag sections when they are empty", () => {
    const quote = calculateCncQuote(aluminumBracketFixture)
    const offer = buildCncOfferDraft({
      customer: { name: "North Forge" },
      issuedAt: "2026-06-19",
      offerNumber: "OFFER-204",
      quote,
      validUntil: "2026-07-03",
    })

    const document = buildOfferDocument(offer)

    expect(document.sections.map((section) => section.key)).toEqual(["summary", "pricing", "assumptions", "revision_history", "terms"])
    expect(document.sections.find((section) => section.key === "summary")?.fields).toEqual([
      { label: "Customer", value: "North Forge" },
      { label: "Issued", value: "2026-06-19" },
      { label: "Valid until", value: "2026-07-03" },
      { label: "Revision", value: "1" },
      { label: "Total excluding VAT", value: "EUR 1154.18" },
    ])
    expect(document.sections.find((section) => section.key === "assumptions")?.table?.rows[0]).toEqual([
      "FB-CNC-204-A",
      "material yield factor",
      "1.12",
    ])
  })
})
