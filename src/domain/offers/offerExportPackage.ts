import type { QuoteEngineCurrencyCode, QuoteEngineResult } from "../quoting/registry"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import { formatOfferMoney, formatOfferRevisionSummary, formatOfferRevisionTimeline, type OfferDraft, type OfferLineItem, type OfferRevision } from "./offer"
import {
  buildOfferDocument,
  renderOfferDocumentText,
  type OfferDocument,
  type OfferDocumentAlternate,
  type OfferDocumentSectionKind,
} from "./offerDocument"

export const OFFER_EXPORT_PACKAGE_VERSION = "offer-export-package.v1"

export type OfferExportPackageStatus = "ready" | "review_required"

export interface OfferAlternateQuoteInput {
  id: string
  label: string
  quote: QuoteEngineResult
  note?: string
}

export interface OfferAlternate {
  customerSummary: string
  id: string
  label: string
  partNumber: string
  quantity: number
  currency: QuoteEngineCurrencyCode
  totalCents: number
  totalLabel: string
  unitPriceCents: number
  priceDeltaCents: number
  priceDeltaLabel: string
  leadTimeDays: number
  leadTimeLabel: string
  leadTimeDeltaDays: number
  leadTimeDeltaLabel: string
  warningCount: number
  recommendation: string
  note?: string
}

export interface OfferRevisionSummaryItem {
  revision: number
  createdAt: string
  createdBy: string
  reason: string
  isLatest: boolean
}

export interface OfferRevisionSummary {
  customerSummary: string
  customerTimeline: string[]
  latestRevision: number
  latestReason: string
  items: OfferRevisionSummaryItem[]
}

export interface OfferPdfExportVerification {
  status: OfferExportPackageStatus
  targetFileName: string
  documentVersion: OfferDocument["documentVersion"]
  contentFingerprint: string
  requiredSectionsPresent: OfferDocumentSectionKind[]
  missingRequiredSections: OfferDocumentSectionKind[]
  tableIssues: string[]
  warnings: string[]
}

export interface OfferExportPackageInput {
  offer: OfferDraft
  alternates?: OfferAlternateQuoteInput[]
}

export interface OfferExportPackage {
  packageVersion: typeof OFFER_EXPORT_PACKAGE_VERSION
  offerNumber: string
  status: OfferExportPackageStatus
  document: OfferDocument
  plainText: string
  alternates: OfferAlternate[]
  revisionSummary: OfferRevisionSummary
  pdf: OfferPdfExportVerification
}

type AlternateCustomerSummaryInput = Pick<
  OfferAlternate,
  "label" | "leadTimeDeltaLabel" | "leadTimeLabel" | "priceDeltaLabel" | "recommendation" | "totalLabel"
>

const requiredPdfSections: OfferDocumentSectionKind[] = ["summary", "pricing", "assumptions", "revision_history", "terms"]

export function buildOfferExportPackage(input: OfferExportPackageInput): OfferExportPackage {
  const baseItem = requireSingleOfferItem(input.offer)
  const alternates = buildOfferAlternates(input.offer, baseItem, input.alternates ?? [])
  const document = buildOfferDocument(input.offer, {
    alternates: alternates.map(toDocumentAlternate),
  })
  const plainText = renderOfferDocumentText(document)
  const pdf = verifyOfferPdfExport(document, plainText)
  const status: OfferExportPackageStatus = pdf.status

  return {
    packageVersion: OFFER_EXPORT_PACKAGE_VERSION,
    offerNumber: input.offer.offerNumber,
    status,
    document,
    plainText,
    alternates,
    revisionSummary: buildRevisionSummary(input.offer.revisionHistory),
    pdf,
  }
}

export function verifyOfferPdfExport(document: OfferDocument, plainText: string = renderOfferDocumentText(document)): OfferPdfExportVerification {
  const presentSections = document.sections.map((section) => section.kind)
  const missingRequiredSections = requiredPdfSections.filter((section) => !presentSections.includes(section))
  const tableIssues = document.sections.flatMap((section) => {
    if (!section.table) {
      return []
    }
    return section.table.rows.flatMap((row, rowIndex) =>
      row.length === section.table?.columns.length
        ? []
        : [`${section.key} row ${rowIndex + 1} has ${row.length} cells for ${section.table?.columns.length} columns.`],
    )
  })
  const warnings = [
    ...missingRequiredSections.map((section) => `Missing required ${section} section.`),
    ...tableIssues,
    ...(plainText.trim() ? [] : ["Plain-text export is empty."]),
  ]

  return {
    status: warnings.length === 0 ? "ready" : "review_required",
    targetFileName: `${sanitizeFileComponent(document.offerNumber)}-rev${latestRevisionNumber(document)}.pdf`,
    documentVersion: document.documentVersion,
    contentFingerprint: fingerprint(plainText),
    requiredSectionsPresent: requiredPdfSections.filter((section) => presentSections.includes(section)),
    missingRequiredSections,
    tableIssues,
    warnings,
  }
}

function buildOfferAlternates(
  offer: OfferDraft,
  baseItem: OfferLineItem,
  inputs: OfferAlternateQuoteInput[],
): OfferAlternate[] {
  const seenIds = new Set<string>()
  return inputs.map((input, index) => {
    const id = nonBlank(input.id, `alternates[${index}].id`)
    if (seenIds.has(id)) {
      throw new Error(`alternate ${id} is duplicated`)
    }
    seenIds.add(id)
    const label = nonBlank(input.label, `alternates[${index}].label`)
    validateComparableAlternate(baseItem, offer.currency, input.quote, index)

    const priceDeltaCents = input.quote.totalCents - baseItem.totalCents
    const leadTimeDeltaDays = input.quote.leadTimeDays - baseItem.leadTimeDays
    const totalLabel = formatOfferMoney(input.quote.totalCents, input.quote.currency)
    const priceDeltaLabel = formatMoneyDelta(priceDeltaCents, input.quote.currency)
    const leadTimeLabel = `${input.quote.leadTimeDays} working days`
    const leadTimeDeltaLabel = formatDayDelta(leadTimeDeltaDays)
    const recommendation = buildRecommendation(priceDeltaCents, leadTimeDeltaDays, input.quote.warnings.length)

    return {
      customerSummary: buildAlternateCustomerSummary({
        label,
        totalLabel,
        priceDeltaLabel,
        leadTimeLabel,
        leadTimeDeltaLabel,
        recommendation,
      }),
      id,
      label,
      partNumber: input.quote.partNumber,
      quantity: input.quote.quantity,
      currency: input.quote.currency,
      totalCents: input.quote.totalCents,
      totalLabel,
      unitPriceCents: input.quote.unitPriceCents,
      priceDeltaCents,
      priceDeltaLabel,
      leadTimeDays: input.quote.leadTimeDays,
      leadTimeLabel,
      leadTimeDeltaDays,
      leadTimeDeltaLabel,
      warningCount: input.quote.warnings.length,
      recommendation,
      note: optionalTrim(input.note),
    }
  })
}

function toDocumentAlternate(alternate: OfferAlternate): OfferDocumentAlternate {
  return {
    customerSummary: alternate.customerSummary,
    label: alternate.label,
    totalLabel: alternate.totalLabel,
    priceDeltaLabel: alternate.priceDeltaLabel,
    leadTimeLabel: alternate.leadTimeLabel,
    leadTimeDeltaLabel: alternate.leadTimeDeltaLabel,
    recommendation: alternate.recommendation,
    note: alternate.note,
  }
}

function buildAlternateCustomerSummary({
  label,
  leadTimeDeltaLabel,
  leadTimeLabel,
  priceDeltaLabel,
  recommendation,
  totalLabel,
}: AlternateCustomerSummaryInput): string {
  return `${label}: ${totalLabel} (${priceDeltaLabel} vs base), ${leadTimeLabel} (${leadTimeDeltaLabel} vs base). ${recommendation}`
}

function buildRevisionSummary(revisions: OfferRevision[]): OfferRevisionSummary {
  if (revisions.length === 0) {
    throw new Error("offer must include at least one revision")
  }
  const latestRevision = revisions.at(-1)!

  return {
    customerSummary: formatOfferRevisionSummary(revisions),
    customerTimeline: formatOfferRevisionTimeline(revisions),
    latestRevision: latestRevision.revision,
    latestReason: latestRevision.reason,
    items: revisions.map((revision) => ({
      revision: revision.revision,
      createdAt: revision.createdAt,
      createdBy: revision.createdBy,
      reason: revision.reason,
      isLatest: revision.revision === latestRevision.revision,
    })),
  }
}

function requireSingleOfferItem(offer: OfferDraft): OfferLineItem {
  if (offer.items.length !== 1) {
    throw new Error("offer alternates require exactly one base line item")
  }
  return offer.items[0]
}

function validateComparableAlternate(
  baseItem: OfferLineItem,
  currency: QuoteEngineCurrencyCode,
  quote: QuoteEngineResult,
  index: number,
) {
  if (quote.partNumber !== baseItem.partNumber) {
    throw new Error(`alternates[${index}].quote.partNumber must match the base offer line`)
  }
  if (quote.quantity !== baseItem.quantity) {
    throw new Error(`alternates[${index}].quote.quantity must match the base offer line`)
  }
  if (quote.currency !== currency) {
    throw new Error(`alternates[${index}].quote.currency must match the offer currency`)
  }
}

function buildRecommendation(priceDeltaCents: number, leadTimeDeltaDays: number, warningCount: number): string {
  const reasons: string[] = []
  if (priceDeltaCents < 0) {
    reasons.push("Lower price than base")
  }
  if (leadTimeDeltaDays < 0) {
    reasons.push(priceDeltaCents > 0 ? "Expedite premium for faster lead time" : "Shorter lead time than base")
  }
  if (priceDeltaCents === 0 && leadTimeDeltaDays === 0) {
    reasons.push("Matches base commercial terms")
  }
  if (priceDeltaCents > 0 && leadTimeDeltaDays >= 0) {
    reasons.push("Higher price than base")
  }
  if (leadTimeDeltaDays > 0 && priceDeltaCents >= 0) {
    reasons.push("Longer lead time than base")
  }
  reasons.push(warningCount === 0 ? "no calculator review flags" : `${warningCount} calculator review flag${warningCount === 1 ? "" : "s"}`)
  return `${reasons.join("; ")}.`
}

function formatMoneyDelta(deltaCents: number, currency: QuoteEngineCurrencyCode): string {
  if (deltaCents === 0) {
    return formatOfferMoney(0, currency)
  }
  return `${deltaCents > 0 ? "+" : ""}${formatOfferMoney(deltaCents, currency)}`
}

function formatDayDelta(deltaDays: number): string {
  if (deltaDays === 0) {
    return "0 days"
  }
  return `${deltaDays > 0 ? "+" : ""}${deltaDays} days`
}

function latestRevisionNumber(document: OfferDocument): number {
  const revisionField = document.sections.find((section) => section.key === "summary")?.fields?.find((field) => field.label === "Revision")
  const revision = Number(revisionField?.value ?? 1)
  return Number.isInteger(revision) && revision > 0 ? revision : 1
}

function fingerprint(value: string): string {
  let hash = 0x811c9dc5
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}

function sanitizeFileComponent(value: string): string {
  return nonBlank(value, "fileName").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "offer"
}
