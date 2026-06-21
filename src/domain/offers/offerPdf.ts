import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

import type { OfferDocumentSection } from "./offerDocument"
import type { OfferExportPackage } from "./offerExportPackage"

/**
 * Deterministic, dependency-light PDF rendering for customer-ready offers.
 *
 * The offer math and plain-text rendering remain the deterministic source of truth
 * (see {@link OfferExportPackage}); this module only lays the same structured content
 * onto PDF pages. It never calls AI and never needs network or secrets. Metadata dates
 * are pinned to the epoch so identical offer content always produces identical bytes,
 * which keeps the output reproducible and unit-testable.
 */

export const OFFER_PDF_RENDERER_VERSION = "offer-pdf-1"

export interface OfferPdfRenderOptions {
  /** Pixels of usable text width are derived from page size minus margins. */
  pageWidth?: number
  pageHeight?: number
  margin?: number
}

export interface OfferPdfResult {
  bytes: Uint8Array
  pageCount: number
  byteLength: number
  fileName: string
  rendererVersion: typeof OFFER_PDF_RENDERER_VERSION
}

const DEFAULT_PAGE_WIDTH = 595.28 // A4 portrait, points
const DEFAULT_PAGE_HEIGHT = 841.89
const DEFAULT_MARGIN = 48

const TITLE_SIZE = 15
const META_SIZE = 9
const SECTION_SIZE = 11
const BODY_SIZE = 9
const TABLE_SIZE = 8
const FOOTER_SIZE = 8
const LINE_GAP = 1.35

interface Fonts {
  body: PDFFont
  bold: PDFFont
  mono: PDFFont
}

interface Cursor {
  page: PDFPage
  y: number
}

/** Build the offer PDF bytes from an already-computed export package. */
export async function buildOfferPdfBytes(
  exportPackage: OfferExportPackage,
  options: OfferPdfRenderOptions = {},
): Promise<OfferPdfResult> {
  const pageWidth = options.pageWidth ?? DEFAULT_PAGE_WIDTH
  const pageHeight = options.pageHeight ?? DEFAULT_PAGE_HEIGHT
  const margin = options.margin ?? DEFAULT_MARGIN
  const usableWidth = pageWidth - margin * 2

  const doc = await PDFDocument.create()
  // Pin metadata so identical content yields identical bytes (no wall-clock leakage).
  const epoch = new Date(0)
  doc.setProducer("FactoryBid OS")
  doc.setCreator("FactoryBid OS")
  doc.setTitle(exportPackage.document.title)
  doc.setCreationDate(epoch)
  doc.setModificationDate(epoch)

  const fonts: Fonts = {
    body: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    mono: await doc.embedFont(StandardFonts.Courier),
  }

  const cursor: Cursor = { page: doc.addPage([pageWidth, pageHeight]), y: pageHeight - margin }

  const ensureSpace = (needed: number) => {
    if (cursor.y - needed < margin) {
      cursor.page = doc.addPage([pageWidth, pageHeight])
      cursor.y = pageHeight - margin
    }
  }

  const drawLine = (text: string, font: PDFFont, size: number, color = rgb(0.1, 0.12, 0.16)) => {
    const lineHeight = size * LINE_GAP
    for (const wrapped of wrapText(text, font, size, usableWidth)) {
      ensureSpace(lineHeight)
      cursor.page.drawText(wrapped, { x: margin, y: cursor.y - size, size, font, color })
      cursor.y -= lineHeight
    }
  }

  const spacer = (amount: number) => {
    cursor.y -= amount
  }

  const document = exportPackage.document

  // Title + header metadata.
  drawLine(document.title, fonts.bold, TITLE_SIZE, rgb(0.05, 0.07, 0.1))
  spacer(4)
  drawLine(`Customer: ${document.customerName}`, fonts.body, META_SIZE)
  drawLine(`Issued: ${document.issuedAt}    Valid until: ${document.validUntil}`, fonts.body, META_SIZE)
  drawLine(`Total excluding VAT: ${document.totalLabel}`, fonts.bold, META_SIZE)

  for (const section of document.sections) {
    spacer(10)
    drawLine(section.title, fonts.bold, SECTION_SIZE, rgb(0.07, 0.09, 0.13))
    spacer(2)
    renderSection(section, drawLine, fonts, usableWidth)
  }

  if (document.footerLines.length > 0) {
    spacer(12)
    for (const footer of document.footerLines) {
      drawLine(footer, fonts.body, FOOTER_SIZE, rgb(0.4, 0.43, 0.48))
    }
  }

  const bytes = await doc.save()
  return {
    bytes,
    pageCount: doc.getPageCount(),
    byteLength: bytes.byteLength,
    fileName: exportPackage.pdf.targetFileName,
    rendererVersion: OFFER_PDF_RENDERER_VERSION,
  }
}

function renderSection(
  section: OfferDocumentSection,
  drawLine: (text: string, font: PDFFont, size: number, color?: ReturnType<typeof rgb>) => void,
  fonts: Fonts,
  usableWidth: number,
) {
  for (const field of section.fields ?? []) {
    drawLine(`${field.label}: ${field.value}`, fonts.body, BODY_SIZE)
  }
  if (section.table) {
    for (const row of padTable([section.table.columns, ...section.table.rows])) {
      drawLine(row, fonts.mono, TABLE_SIZE)
    }
  }
  for (const body of section.body ?? []) {
    drawLine(body, fonts.body, BODY_SIZE)
  }
  void usableWidth
}

/** Pad table cells to aligned column widths and join with a separator. */
function padTable(rows: string[][]): string[] {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const widths = new Array<number>(columnCount).fill(0)
  for (const row of rows) {
    row.forEach((cell, index) => {
      widths[index] = Math.max(widths[index], sanitize(cell).length)
    })
  }
  return rows.map((row) =>
    row
      .map((cell, index) => sanitize(cell).padEnd(widths[index]))
      .join("  |  ")
      .trimEnd(),
  )
}

/** Wrap a single logical line to the usable width, splitting on spaces then hard-breaking. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const clean = sanitize(text)
  if (clean === "") {
    return [""]
  }
  const widthOf = (value: string) => font.widthOfTextAtSize(value, size)
  const lines: string[] = []
  for (const segment of clean.split("\n")) {
    if (widthOf(segment) <= maxWidth) {
      lines.push(segment)
      continue
    }
    let current = ""
    for (const word of segment.split(" ")) {
      const candidate = current ? `${current} ${word}` : word
      if (widthOf(candidate) <= maxWidth) {
        current = candidate
        continue
      }
      if (current) {
        lines.push(current)
      }
      if (widthOf(word) <= maxWidth) {
        current = word
      } else {
        // Hard-break an over-long token (e.g. a long URL) at the width boundary.
        let chunk = ""
        for (const char of word) {
          if (widthOf(chunk + char) > maxWidth && chunk) {
            lines.push(chunk)
            chunk = char
          } else {
            chunk += char
          }
        }
        current = chunk
      }
    }
    if (current) {
      lines.push(current)
    }
  }
  return lines.length > 0 ? lines : [""]
}

const UNICODE_REPLACEMENTS: Record<string, string> = {
  "–": "-",
  "—": "-",
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "•": "*",
  "·": "-",
  "×": "x",
  "≈": "~",
  "…": "...",
}

/** Replace characters the StandardFonts (WinAnsi) cannot encode so drawText never throws. */
function sanitize(text: string): string {
  let result = ""
  for (const char of text) {
    if (char in UNICODE_REPLACEMENTS) {
      result += UNICODE_REPLACEMENTS[char]
      continue
    }
    const code = char.codePointAt(0) ?? 0
    if (code === 0x09) {
      result += "    "
    } else if (code >= 0x20 && code <= 0x7e) {
      result += char
    } else if (code >= 0xa0 && code <= 0xff) {
      result += char
    } else if (code === 0x0a) {
      result += "\n"
    } else {
      result += "?"
    }
  }
  return result
}
