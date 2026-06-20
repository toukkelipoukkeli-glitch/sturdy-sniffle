import { formatOfferMoney, type OfferDraft, type OfferLineItem } from "./offer"

export const OFFER_DOCUMENT_VERSION = "offer-document.v1"

export type OfferDocumentSectionKind = "summary" | "pricing" | "assumptions" | "review_flags" | "revision_history" | "notes" | "terms"

export interface OfferDocumentField {
  label: string
  value: string
}

export interface OfferDocumentTable {
  columns: string[]
  rows: string[][]
}

export interface OfferDocumentSection {
  key: string
  title: string
  kind: OfferDocumentSectionKind
  body?: string[]
  fields?: OfferDocumentField[]
  table?: OfferDocumentTable
}

export interface OfferDocument {
  documentVersion: typeof OFFER_DOCUMENT_VERSION
  offerNumber: string
  title: string
  customerName: string
  issuedAt: string
  validUntil: string
  currency: OfferDraft["currency"]
  totalLabel: string
  sections: OfferDocumentSection[]
  footerLines: string[]
}

export function buildOfferDocument(offer: OfferDraft): OfferDocument {
  const sections: OfferDocumentSection[] = [
    buildSummarySection(offer),
    buildPricingSection(offer),
    buildAssumptionsSection(offer.items),
    ...buildReviewFlagSection(offer.items),
    buildRevisionHistorySection(offer),
    ...buildNotesSection(offer.notes),
    buildTermsSection(offer),
  ]

  return {
    documentVersion: OFFER_DOCUMENT_VERSION,
    offerNumber: offer.offerNumber,
    title: `Offer ${offer.offerNumber}`,
    customerName: offer.customer.name,
    issuedAt: offer.issuedAt,
    validUntil: offer.validUntil,
    currency: offer.currency,
    totalLabel: formatOfferMoney(offer.totalCents, offer.currency),
    sections,
    footerLines: [
      "Prices exclude VAT unless otherwise stated.",
      "Lead times start after written approval and final drawing release.",
    ],
  }
}

function buildSummarySection(offer: OfferDraft): OfferDocumentSection {
  return {
    key: "summary",
    title: "Offer summary",
    kind: "summary",
    fields: compactFields([
      ["Customer", offer.customer.name],
      ["Contact", offer.customer.contactName],
      ["Email", offer.customer.email],
      ["RFQ", offer.rfqReference],
      ["Subject", offer.subject],
      ["Issued", offer.issuedAt],
      ["Valid until", offer.validUntil],
      ["Revision", String(offer.revisionHistory.at(-1)?.revision ?? 1)],
      ["Total excluding VAT", formatOfferMoney(offer.totalCents, offer.currency)],
    ]),
  }
}

function buildPricingSection(offer: OfferDraft): OfferDocumentSection {
  return {
    key: "pricing",
    title: "Pricing",
    kind: "pricing",
    table: {
      columns: ["Part", "Process", "Qty", "Unit price", "Line total", "Lead time"],
      rows: offer.items.map((item) => [
        item.partNumber,
        item.processLabel,
        String(item.quantity),
        formatOfferMoney(item.unitPriceCents, offer.currency),
        formatOfferMoney(item.totalCents, offer.currency),
        `${item.leadTimeDays} working days`,
      ]),
    },
  }
}

function buildAssumptionsSection(items: OfferLineItem[]): OfferDocumentSection {
  return {
    key: "assumptions",
    title: "Assumptions",
    kind: "assumptions",
    table: {
      columns: ["Part", "Assumption", "Value"],
      rows: items.flatMap((item) =>
        item.assumptions.map((assumption) => [
          item.partNumber,
          humanizeKey(assumption.key),
          assumption.value,
        ]),
      ),
    },
  }
}

function buildReviewFlagSection(items: OfferLineItem[]): OfferDocumentSection[] {
  const rows = items.flatMap((item) => item.warnings.map((warning) => [item.partNumber, warning]))
  if (rows.length === 0) {
    return []
  }

  return [
    {
      key: "review_flags",
      title: "Review flags",
      kind: "review_flags",
      table: {
        columns: ["Part", "Flag"],
        rows,
      },
    },
  ]
}

function buildRevisionHistorySection(offer: OfferDraft): OfferDocumentSection {
  return {
    key: "revision_history",
    title: "Revision history",
    kind: "revision_history",
    table: {
      columns: ["Rev", "Date", "By", "Reason"],
      rows: offer.revisionHistory.map((revision) => [
        String(revision.revision),
        revision.createdAt,
        revision.createdBy,
        revision.reason,
      ]),
    },
  }
}

function buildNotesSection(notes: string[]): OfferDocumentSection[] {
  const body = notes.map((note) => note.trim()).filter(Boolean)
  if (body.length === 0) {
    return []
  }

  return [
    {
      key: "notes",
      title: "Notes",
      kind: "notes",
      body,
    },
  ]
}

function buildTermsSection(offer: OfferDraft): OfferDocumentSection {
  return {
    key: "terms",
    title: "Terms",
    kind: "terms",
    fields: offer.terms.map((term) => ({
      label: term.label,
      value: term.value,
    })),
  }
}

function compactFields(fields: Array<[string, string | undefined]>): OfferDocumentField[] {
  return fields.flatMap(([label, value]) => {
    const trimmed = value?.trim()
    return trimmed ? [{ label, value: trimmed }] : []
  })
}

function humanizeKey(key: string): string {
  return key.replaceAll("_", " ")
}
