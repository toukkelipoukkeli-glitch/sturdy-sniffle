import { PDFDocument } from "pdf-lib"
import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import { appendOfferRevision, buildCncOfferDraft } from "./offer"
import { buildOfferExportPackage } from "./offerExportPackage"
import { OFFER_PDF_RENDERER_VERSION, buildOfferPdfBytes } from "./offerPdf"

function buildPackage() {
  const standardQuote = calculateCncQuote(aluminumBracketFixture)
  const rushQuote = calculateCncQuote({ ...aluminumBracketFixture, priority: "rush" })
  const offer = appendOfferRevision(
    buildCncOfferDraft({
      customer: { contactName: "Nora Buyer", email: "nora@example.test", name: "North Forge" },
      issuedAt: "2026-06-20",
      offerNumber: "OFFER-204",
      quote: standardQuote,
      rfqReference: "rfq-204",
      subject: "Aluminum bracket production batch",
      validUntil: "2026-07-04",
    }),
    { createdAt: "2026-06-21", createdBy: "Operator", reason: "Added expedited delivery alternate." },
  )
  return buildOfferExportPackage({
    offer,
    alternates: [{ id: "rush-4-day", label: "Expedite 4-day build", quote: rushQuote }],
  })
}

describe("offer PDF rendering", () => {
  it("produces a structurally valid, loadable PDF", async () => {
    const result = await buildOfferPdfBytes(buildPackage())

    expect(result.rendererVersion).toBe(OFFER_PDF_RENDERER_VERSION)
    expect(result.byteLength).toBeGreaterThan(800)
    expect(result.fileName).toBe("OFFER-204-rev2.pdf")
    // Valid PDF header + EOF marker.
    const head = new TextDecoder().decode(result.bytes.slice(0, 8))
    expect(head.startsWith("%PDF-1.")).toBe(true)
    const tail = new TextDecoder().decode(result.bytes.slice(-6))
    expect(tail.includes("%%EOF")).toBe(true)

    // Round-trips through a real PDF parser.
    const reloaded = await PDFDocument.load(result.bytes)
    expect(reloaded.getPageCount()).toBe(result.pageCount)
    expect(result.pageCount).toBeGreaterThanOrEqual(1)
    expect(reloaded.getTitle()).toBe(buildPackage().document.title)
  })

  it("is deterministic for identical offer content (no wall-clock leakage)", async () => {
    const a = await buildOfferPdfBytes(buildPackage())
    const b = await buildOfferPdfBytes(buildPackage())
    expect(a.byteLength).toBe(b.byteLength)
    const identical = a.byteLength === b.byteLength && a.bytes.every((value, index) => value === b.bytes[index])
    expect(identical).toBe(true)
  })

  it("paginates long offers across multiple pages", async () => {
    const base = buildPackage()
    // Inflate the document with many body lines to force pagination.
    const padded = {
      ...base,
      document: {
        ...base.document,
        sections: [
          ...base.document.sections,
          {
            key: "filler",
            title: "Extended notes",
            kind: "notes" as const,
            body: Array.from({ length: 220 }, (_, i) => `Manufacturing note line ${i + 1} for pagination coverage.`),
          },
        ],
      },
    }
    const result = await buildOfferPdfBytes(padded)
    expect(result.pageCount).toBeGreaterThan(1)
  })

  it("sanitizes non-WinAnsi characters instead of throwing", async () => {
    const base = buildPackage()
    const withUnicode = {
      ...base,
      document: {
        ...base.document,
        title: "Tarjous — Mäkinen Oy · ±0.05 mm “tight” • 한국어",
        footerLines: ["Kiitos — FactoryBid OS · ✓"],
      },
    }
    await expect(buildOfferPdfBytes(withUnicode)).resolves.toMatchObject({ pageCount: expect.any(Number) })
  })
})
