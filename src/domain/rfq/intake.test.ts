import { describe, expect, it } from "vitest"

import { cncBracketEmail, rushSheetMetalEmail } from "./intake.fixtures"
import { classifyAttachment, parseRfqIntake } from "./intake"

describe("parseRfqIntake", () => {
  it("extracts deterministic RFQ fields from a CNC email", () => {
    const parsed = parseRfqIntake(cncBracketEmail)

    expect(parsed.priority).toBe("normal")
    expect(parsed.currency).toBe("EUR")
    expect(parsed.contactEmail).toBe("sari.virtanen@northforge.fi")
    expect(parsed.customerName).toBe("North Forge")
    expect(parsed.dueAt).toBe(Date.parse("2026-06-30T12:00:00.000Z"))
    expect(parsed.attachments.map((attachment) => attachment.kind)).toEqual(["cad", "drawing"])
    expect(parsed.parts).toEqual([
      {
        partNumber: "FB-204-A",
        process: "cnc_milling",
        materialText: "Aluminum 6082",
        quantity: 25,
        dimensions: {
          lengthMm: 120,
          widthMm: 80,
          heightMm: 6,
        },
        attachmentNames: ["FB-204-A.step", "FB-204-A.pdf"],
      },
    ])
    expect(fieldValue(parsed, "process")).toBe("cnc_milling")
    expect(fieldValue(parsed, "material")).toBe("Aluminum 6082")
    expect(fieldValue(parsed, "quantity")).toBe("25")
    expect(fieldValue(parsed, "dimensions_mm")).toBe("120 x 80 x 6 mm")
    expect(fieldValue(parsed, "tolerance")).toBe("ISO 2768-M")
  })

  it("detects rush sheet-metal work and European numeric dates", () => {
    const parsed = parseRfqIntake(rushSheetMetalEmail)

    expect(parsed.priority).toBe("rush")
    expect(parsed.currency).toBe("USD")
    expect(parsed.customerName).toBe("Example Fab")
    expect(parsed.dueAt).toBe(Date.parse("2026-06-20T12:00:00.000Z"))
    expect(parsed.attachments.map((attachment) => attachment.kind)).toEqual(["cad", "spreadsheet"])
    expect(fieldValue(parsed, "process")).toBe("sheet_metal")
    expect(fieldValue(parsed, "material")).toBe("Stainless steel 316L")
    expect(fieldValue(parsed, "quantity")).toBe("100")
    expect(fieldValue(parsed, "tolerance")).toBe("+/- 0.20 mm")
  })

  it("treats explicit no-rush phrasing as low priority", () => {
    const parsed = parseRfqIntake({
      subject: "RFQ: spacer blocks",
      senderEmail: "buyer@example.com",
      receivedAt: "2026-06-18T09:00:00.000Z",
      source: { provider: "gmail" },
      bodyText: "Please quote these spacer blocks when possible. No rush on this one.",
    })

    expect(parsed.priority).toBe("low")
    expect(fieldValue(parsed, "priority")).toBe("low")
  })

  it("ignores impossible numeric due dates instead of rolling them forward", () => {
    const parsed = parseRfqIntake({
      subject: "RFQ: impossible target date",
      senderEmail: "buyer@example.com",
      receivedAt: "2026-06-18T09:00:00.000Z",
      source: { provider: "gmail" },
      bodyText: "Please quote part: BAD-DATE-1. Deadline 31.02.2026.",
    })

    expect(parsed.dueAt).toBeUndefined()
    expect(fieldValue(parsed, "due_at")).toBeUndefined()
  })

  it("maps per-part quantities only when part and quantity counts match", () => {
    const parsed = parseRfqIntake({
      subject: "RFQ: matched quantities",
      senderEmail: "buyer@example.com",
      receivedAt: "2026-06-18T09:00:00.000Z",
      source: { provider: "gmail" },
      bodyText: "Part: BRK-A qty 5. Part: BRK-B qty 10. CNC milling, aluminum 6082.",
    })

    expect(parsed.parts).toMatchObject([
      { partNumber: "BRK-A", quantity: 5 },
      { partNumber: "BRK-B", quantity: 10 },
    ])
  })

  it("preserves repeated equal per-part quantity occurrences", () => {
    const parsed = parseRfqIntake({
      subject: "RFQ: repeated quantities",
      senderEmail: "buyer@example.com",
      receivedAt: "2026-06-18T09:00:00.000Z",
      source: { provider: "gmail" },
      bodyText: "Part: BRK-A qty 5. Part: BRK-B qty 10. Part: BRK-C qty 5.",
    })

    expect(parsed.parts).toMatchObject([
      { partNumber: "BRK-A", quantity: 5 },
      { partNumber: "BRK-B", quantity: 10 },
      { partNumber: "BRK-C", quantity: 5 },
    ])
  })

  it("infers customer names from organizational labels in subdomain email senders", () => {
    const parsed = parseRfqIntake({
      subject: "RFQ from subdomain",
      senderEmail: "buyer@mail.acme-industries.com",
      receivedAt: "2026-06-18T09:00:00.000Z",
      source: { provider: "gmail" },
      bodyText: "Please quote part: ACME-42, quantity 12.",
    })

    expect(parsed.customerName).toBe("Acme Industries")
  })

  it("infers customer names from multi-part TLD email senders", () => {
    const parsed = parseRfqIntake({
      subject: "RFQ from UK domain",
      senderEmail: "buyer@mail.acme-fabrication.co.uk",
      receivedAt: "2026-06-18T09:00:00.000Z",
      source: { provider: "gmail" },
      bodyText: "Please quote part: UK-42, quantity 12.",
    })

    expect(parsed.customerName).toBe("Acme Fabrication")
  })
})

describe("classifyAttachment", () => {
  it("classifies common RFQ attachment formats", () => {
    expect(classifyAttachment({ fileName: "layout.pdf" }).kind).toBe("drawing")
    expect(classifyAttachment({ fileName: "part.stp" }).kind).toBe("cad")
    expect(classifyAttachment({ fileName: "part.bin", contentType: "model/step" }).kind).toBe("cad")
    expect(classifyAttachment({ fileName: "bom.csv" }).kind).toBe("spreadsheet")
    expect(classifyAttachment({ fileName: "sample.jpg" }).kind).toBe("photo")
    expect(classifyAttachment({ fileName: "notes.txt" }).kind).toBe("other")
  })
})

function fieldValue(parsed: ReturnType<typeof parseRfqIntake>, key: string) {
  return parsed.extractedFields.find((field) => field.key === key)?.value
}
