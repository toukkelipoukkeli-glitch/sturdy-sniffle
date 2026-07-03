import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture, rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { appendOfferRevision, buildCncOfferDraft } from "./offer"
import { buildOfferDocument, renderOfferDocumentText } from "./offerDocument"
import { buildOfferExportPackage, verifyOfferPdfExport } from "./offerExportPackage"

describe("offer export package", () => {
  it("builds deterministic customer-ready alternates and PDF verification metadata", () => {
    const standardQuote = calculateCncQuote(aluminumBracketFixture)
    const rushQuote = calculateCncQuote({ ...aluminumBracketFixture, priority: "rush" })
    const offer = appendOfferRevision(
      buildCncOfferDraft({
        customer: {
          contactName: "Nora Buyer",
          email: "nora@example.test",
          name: "North Forge",
        },
        issuedAt: "2026-06-20",
        offerNumber: "OFFER-204",
        quote: standardQuote,
        rfqReference: "rfq-204",
        subject: "Aluminum bracket production batch",
        validUntil: "2026-07-04",
      }),
      {
        createdAt: "2026-06-21",
        createdBy: "Sari",
        reason: "Added expedited delivery alternate requested by buyer.",
      },
    )

    const exportPackage = buildOfferExportPackage({
      offer,
      alternates: [
        {
          id: "rush-4-day",
          label: "Expedite 4-day build",
          note: "Operator confirmed material availability.",
          quote: rushQuote,
        },
      ],
    })

    expect(exportPackage).toMatchObject({
      packageVersion: "offer-export-package.v1",
      offerNumber: "OFFER-204",
      status: "ready",
      pdf: {
        documentVersion: "offer-document.v1",
        missingRequiredSections: [],
        requiredSectionsPresent: ["summary", "pricing", "assumptions", "revision_history", "terms"],
        status: "ready",
        tableIssues: [],
        targetFileName: "OFFER-204-rev2.pdf",
        warnings: [],
      },
      revisionSummary: {
        customerSummary: "Revision 2 (2026-06-21) by Sari: Added expedited delivery alternate requested by buyer.",
        customerTimeline: [
          "Revision 1: Initial draft (2026-06-20, FactoryBid OS)",
          "Revision 2: Added expedited delivery alternate requested by buyer. (2026-06-21, Sari)",
        ],
        latestReason: "Added expedited delivery alternate requested by buyer.",
        latestRevision: 2,
      },
      termsSummary: {
        customerSummary: "Key terms covered: VAT, Calculation basis, Delivery start.",
        items: [
          {
            key: "vat",
            label: "VAT",
            value: "Prices exclude VAT.",
          },
          {
            key: "calculation_basis",
            label: "Calculation basis",
            value: "Material and machining assumptions follow the attached calculation.",
          },
          {
            key: "delivery_start",
            label: "Delivery start",
            value: "Lead time starts after written approval and final drawing release.",
          },
        ],
      },
    })
    expect(exportPackage.alternates).toEqual([
      {
        customerSummary:
          "Expedite 4-day build: EUR 1615.86 (+EUR 461.68 vs base), 4 working days (-5 days vs base). Expedite premium for faster lead time; no calculator review flags.",
        id: "rush-4-day",
        label: "Expedite 4-day build",
        currency: "EUR",
        leadTimeDays: 4,
        leadTimeDeltaDays: -5,
        leadTimeDeltaLabel: "-5 days",
        leadTimeLabel: "4 working days",
        note: "Operator confirmed material availability.",
        partNumber: "FB-CNC-204-A",
        priceDeltaCents: 46168,
        priceDeltaLabel: "+EUR 461.68",
        quantity: 25,
        recommendation: "Expedite premium for faster lead time; no calculator review flags.",
        totalCents: 161586,
        totalLabel: "EUR 1615.86",
        unitPriceCents: 6463,
        warningCount: 0,
      },
    ])
    expect(exportPackage.document.sections.map((section) => section.key)).toEqual([
      "summary",
      "pricing",
      "alternates",
      "assumptions",
      "revision_history",
      "terms",
    ])
    expect(exportPackage.document.sections.find((section) => section.key === "alternates")?.table).toEqual({
      columns: ["Option", "Total", "Price delta", "Lead time", "Lead delta", "Positioning", "Notes"],
      rows: [
        [
          "Expedite 4-day build",
          "EUR 1615.86",
          "+EUR 461.68",
          "4 working days",
          "-5 days",
          "Expedite premium for faster lead time; no calculator review flags.",
          "Operator confirmed material availability.",
        ],
      ],
    })
    expect(exportPackage.document.sections.find((section) => section.key === "alternates")?.body).toEqual([
      "- Expedite 4-day build: EUR 1615.86 (+EUR 461.68 vs base), 4 working days (-5 days vs base). Expedite premium for faster lead time; no calculator review flags.",
    ])
    expect(exportPackage.plainText).toContain("Alternates")
    expect(exportPackage.plainText).toContain("Expedite 4-day build | EUR 1615.86 | +EUR 461.68 | 4 working days | -5 days")
    expect(exportPackage.plainText).toContain(
      "- Expedite 4-day build: EUR 1615.86 (+EUR 461.68 vs base), 4 working days (-5 days vs base). Expedite premium for faster lead time; no calculator review flags.",
    )
    expect(exportPackage.plainText).toContain(
      "Current revision: Revision 2 (2026-06-21) by Sari: Added expedited delivery alternate requested by buyer.",
    )
    expect(exportPackage.plainText).toContain("- Revision 1: Initial draft (2026-06-20, FactoryBid OS)")
    expect(exportPackage.plainText).toContain("- Revision 2: Added expedited delivery alternate requested by buyer. (2026-06-21, Sari)")
    expect(exportPackage.plainText).toContain(
      "Key terms: Key terms covered: VAT, Calculation basis, Delivery start.",
    )
    expect(exportPackage.pdf.contentFingerprint).toMatch(/^[a-f0-9]{8}$/)
  })

  it("marks malformed PDF-ready documents for review", () => {
    const document = buildOfferDocument(
      buildCncOfferDraft({
        customer: { name: "Baltic Hydraulics" },
        issuedAt: "2026-06-20",
        offerNumber: "OFFER-019",
        quote: calculateCncQuote(rushTurnedSpacerFixture),
        validUntil: "2026-07-04",
      }),
    )
    const malformedDocument = {
      ...document,
      sections: document.sections
        .filter((section) => section.key !== "pricing")
        .map((section) =>
          section.key === "assumptions" && section.table
            ? {
                ...section,
                table: {
                  ...section.table,
                  rows: [["FB-TURN-019", "material yield factor"]],
                },
              }
            : section,
        ),
    }

    const verification = verifyOfferPdfExport(malformedDocument, renderOfferDocumentText(malformedDocument))

    expect(verification).toMatchObject({
      missingRequiredSections: ["pricing"],
      status: "review_required",
      tableIssues: ["assumptions row 1 has 2 cells for 3 columns."],
      warnings: [
        "Missing required pricing section.",
        "assumptions row 1 has 2 cells for 3 columns.",
      ],
    })
  })

  it("rejects alternates that cannot be compared with the base offer line", () => {
    const offer = buildCncOfferDraft({
      customer: { name: "North Forge" },
      issuedAt: "2026-06-20",
      offerNumber: "OFFER-204",
      quote: calculateCncQuote(aluminumBracketFixture),
      validUntil: "2026-07-04",
    })
    const mismatchedQuote = calculateCncQuote(rushTurnedSpacerFixture)

    expect(() =>
      buildOfferExportPackage({
        offer,
        alternates: [{ id: "spacer", label: "Spacer alternate", quote: mismatchedQuote }],
      }),
    ).toThrow("alternates[0].quote.partNumber must match the base offer line")
    expect(() =>
      buildOfferExportPackage({
        offer,
        alternates: [
          { id: "rush", label: "Rush", quote: calculateCncQuote({ ...aluminumBracketFixture, priority: "rush" }) },
          { id: "rush", label: "Rush duplicate", quote: calculateCncQuote({ ...aluminumBracketFixture, priority: "rush" }) },
        ],
      }),
    ).toThrow("alternate rush is duplicated")
  })
})
