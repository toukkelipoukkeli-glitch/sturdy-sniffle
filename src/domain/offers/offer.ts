import type { CncQuoteResult } from "../quoting/cnc"
import type { QuoteEngineAssumption, QuoteEngineCurrencyCode, QuoteEngineResult, QuoteProcessKey } from "../quoting/registry"

export const OFFER_BUILDER_VERSION = "offer.v1"

export type OfferStatus = "draft" | "sent" | "accepted" | "declined" | "superseded"

export interface OfferCustomer {
  name: string
  contactName?: string
  email?: string
}

export interface OfferTerm {
  key: string
  label: string
  value: string
}

export interface OfferRevision {
  revision: number
  createdAt: string
  createdBy: string
  reason: string
}

export interface OfferLineItem {
  key: string
  partNumber: string
  description: string
  processLabel: string
  quantity: number
  unitPriceCents: number
  unitRemainderCents: number
  totalCents: number
  leadTimeDays: number
  calculatorVersion: QuoteEngineResult["calculatorVersion"]
  assumptions: QuoteEngineAssumption[]
  warnings: string[]
}

export interface OfferDraft {
  builderVersion: typeof OFFER_BUILDER_VERSION
  offerNumber: string
  status: "draft"
  customer: OfferCustomer
  rfqReference?: string
  subject?: string
  issuedAt: string
  validUntil: string
  currency: QuoteEngineCurrencyCode
  items: OfferLineItem[]
  terms: OfferTerm[]
  revisionHistory: OfferRevision[]
  notes: string[]
  subtotalCents: number
  totalCents: number
}

export interface BuildCncOfferDraftInput {
  offerNumber: string
  customer: OfferCustomer
  issuedAt: string
  validUntil: string
  quote: CncQuoteResult
  lineDescription?: string
  notes?: string[]
  revision?: Omit<OfferRevision, "revision">
  rfqReference?: string
  subject?: string
  terms?: OfferTerm[]
}

export interface BuildOfferDraftInput {
  offerNumber: string
  customer: OfferCustomer
  issuedAt: string
  validUntil: string
  quote: QuoteEngineResult
  lineDescription?: string
  notes?: string[]
  revision?: Omit<OfferRevision, "revision">
  rfqReference?: string
  subject?: string
  terms?: OfferTerm[]
}

export const DEFAULT_OFFER_TERMS: OfferTerm[] = [
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
]

export function buildCncOfferDraft(input: BuildCncOfferDraftInput): OfferDraft {
  return buildOfferDraft(input)
}

export function buildOfferDraft(input: BuildOfferDraftInput): OfferDraft {
  const offerNumber = nonBlank(input.offerNumber, "offerNumber")
  const customer = normalizeCustomer(input.customer)
  const issuedAt = normalizeIsoDate(input.issuedAt, "issuedAt")
  const validUntil = normalizeIsoDate(input.validUntil, "validUntil")
  if (dateValue(validUntil) < dateValue(issuedAt)) {
    throw new Error("validUntil must be on or after issuedAt")
  }

  validateQuote(input.quote)
  const item: OfferLineItem = {
    key: `${input.quote.process}:${input.quote.partNumber}`,
    partNumber: input.quote.partNumber,
    description: input.lineDescription?.trim() || processLabel(input.quote.process),
    processLabel: processLabel(input.quote.process),
    quantity: input.quote.quantity,
    unitPriceCents: input.quote.unitPriceCents,
    unitRemainderCents: input.quote.unitRemainderCents,
    totalCents: input.quote.totalCents,
    leadTimeDays: input.quote.leadTimeDays,
    calculatorVersion: input.quote.calculatorVersion,
    assumptions: input.quote.assumptions,
    warnings: input.quote.warnings,
  }

  const terms = normalizeTerms(input.terms ?? DEFAULT_OFFER_TERMS)
  const notes = (input.notes ?? []).map((note) => note.trim()).filter(Boolean)
  const revisionHistory = [
    normalizeRevision(
      input.revision ?? {
        createdAt: issuedAt,
        createdBy: "FactoryBid OS",
        reason: "Initial draft",
      },
      1,
    ),
  ]

  return {
    builderVersion: OFFER_BUILDER_VERSION,
    offerNumber,
    status: "draft",
    customer,
    rfqReference: optionalTrim(input.rfqReference),
    subject: optionalTrim(input.subject),
    issuedAt,
    validUntil,
    currency: input.quote.currency,
    items: [item],
    terms,
    revisionHistory,
    notes,
    subtotalCents: item.totalCents,
    totalCents: item.totalCents,
  }
}

export function appendOfferRevision(
  offer: OfferDraft,
  revision: Omit<OfferRevision, "revision">,
): OfferDraft {
  validateOfferDraft(offer)
  const nextRevision = Math.max(...offer.revisionHistory.map((entry) => entry.revision), 0) + 1
  return {
    ...offer,
    revisionHistory: [...offer.revisionHistory, normalizeRevision(revision, nextRevision)],
  }
}

export function renderOfferText(offer: OfferDraft): string {
  validateOfferDraft(offer)

  const lines: string[] = [
    `Offer ${offer.offerNumber}`,
    `Customer: ${offer.customer.name}`,
    ...optionalLines([
      ["Contact", offer.customer.contactName],
      ["Email", offer.customer.email],
      ["RFQ", offer.rfqReference],
      ["Subject", offer.subject],
    ]),
    `Issued: ${offer.issuedAt}`,
    `Valid until: ${offer.validUntil}`,
    `Revision: ${latestRevision(offer).revision}`,
    `Currency: ${offer.currency}`,
    "",
    "Pricing",
  ]

  offer.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.partNumber} - ${item.description}`,
      `   Process: ${item.processLabel}`,
      `   Quantity: ${item.quantity}`,
      `   Unit price: ${formatOfferMoney(item.unitPriceCents, offer.currency)}`,
      `   Line total: ${formatOfferMoney(item.totalCents, offer.currency)}`,
      `   Lead time: ${item.leadTimeDays} working days`,
      `   Calculator: ${item.calculatorVersion}`,
    )

    if (item.unitRemainderCents > 0) {
      lines.push(`   Rounding allocation: ${formatOfferMoney(item.unitRemainderCents, offer.currency)} included in line total`)
    }

    if (item.assumptions.length > 0) {
      lines.push(`   Assumptions: ${formatAssumptions(item.assumptions)}`)
    }

    if (item.warnings.length > 0) {
      lines.push(`   Review flags: ${item.warnings.join("; ")}`)
    }
  })

  lines.push("", `Total excluding VAT: ${formatOfferMoney(offer.totalCents, offer.currency)}`)

  if (offer.notes.length > 0) {
    lines.push("", "Notes", ...offer.notes.map((note) => `- ${note}`))
  }

  lines.push("", "Terms", ...offer.terms.map((term) => `- ${term.label}: ${term.value}`))

  return lines.join("\n")
}

export function formatOfferRevisionSummary(revisions: OfferRevision[]): string {
  assertHasRevisions(revisions)
  const latest = revisions.reduce((currentLatest, revision) => (revision.revision >= currentLatest.revision ? revision : currentLatest))
  return `Revision ${latest.revision} (${latest.createdAt}) by ${latest.createdBy}: ${latest.reason}`
}

export function formatOfferRevisionTimeline(revisions: OfferRevision[]): string[] {
  assertHasRevisions(revisions)
  return [...revisions]
    .sort((left, right) => left.revision - right.revision)
    .map((revision) => `Revision ${revision.revision}: ${revision.reason} (${revision.createdAt}, ${revision.createdBy})`)
}

export function formatOfferTermsSummary(terms: OfferTerm[]): string {
  if (terms.length === 0) {
    throw new Error("offer must include at least one term")
  }
  return terms.map((term, index) => `${nonBlank(term.label, `terms[${index}].label`)}: ${nonBlank(term.value, `terms[${index}].value`)}`).join("; ")
}

function assertHasRevisions(revisions: OfferRevision[]): void {
  if (revisions.length === 0) {
    throw new Error("offer must include at least one revision")
  }
}

export function formatOfferMoney(cents: number, currency: QuoteEngineCurrencyCode): string {
  assertCents(cents, "cents")

  const sign = cents < 0 ? "-" : ""
  const absoluteCents = Math.abs(cents)
  const major = Math.floor(absoluteCents / 100)
  const minor = String(absoluteCents % 100).padStart(2, "0")
  return `${sign}${currency} ${major}.${minor}`
}

function validateOfferDraft(offer: OfferDraft) {
  nonBlank(offer.offerNumber, "offerNumber")
  normalizeCustomer(offer.customer)
  normalizeIsoDate(offer.issuedAt, "issuedAt")
  normalizeIsoDate(offer.validUntil, "validUntil")
  if (offer.status !== "draft") {
    throw new Error("renderOfferText currently supports draft offers only")
  }
  if (offer.items.length === 0) {
    throw new Error("offer must include at least one line item")
  }
  assertCents(offer.subtotalCents, "subtotalCents")
  assertCents(offer.totalCents, "totalCents")
  assertCents(
    offer.items.reduce((sum, item) => sum + item.totalCents, 0),
    "items.totalCents",
  )
  if (offer.items.reduce((sum, item) => sum + item.totalCents, 0) !== offer.subtotalCents) {
    throw new Error("subtotalCents must equal line item totals")
  }

  offer.items.forEach(validateOfferLineItem)
  normalizeTerms(offer.terms)
  normalizeRevisionHistory(offer.revisionHistory)
}

function validateQuote(quote: QuoteEngineResult) {
  nonBlank(quote.partNumber, "quote.partNumber")
  assertPositiveInteger(quote.quantity, "quote.quantity")
  assertPositiveInteger(quote.leadTimeDays, "quote.leadTimeDays")
  assertCents(quote.unitPriceCents, "quote.unitPriceCents")
  assertCents(quote.unitRemainderCents, "quote.unitRemainderCents")
  assertPositiveCents(quote.totalCents, "quote.totalCents")
}

function validateOfferLineItem(item: OfferLineItem) {
  nonBlank(item.key, "item.key")
  nonBlank(item.partNumber, "item.partNumber")
  nonBlank(item.description, "item.description")
  nonBlank(item.processLabel, "item.processLabel")
  assertPositiveInteger(item.quantity, "item.quantity")
  assertPositiveInteger(item.leadTimeDays, "item.leadTimeDays")
  assertCents(item.unitPriceCents, "item.unitPriceCents")
  assertCents(item.unitRemainderCents, "item.unitRemainderCents")
  assertPositiveCents(item.totalCents, "item.totalCents")
}

function normalizeCustomer(customer: OfferCustomer): OfferCustomer {
  const normalized: OfferCustomer = {
    name: nonBlank(customer.name, "customer.name"),
  }
  const contactName = optionalTrim(customer.contactName)
  const email = optionalTrim(customer.email)
  if (contactName) {
    normalized.contactName = contactName
  }
  if (email) {
    normalized.email = email
  }
  return normalized
}

function normalizeTerms(terms: OfferTerm[]): OfferTerm[] {
  if (terms.length === 0) {
    throw new Error("offer must include at least one term")
  }

  return terms.map((term, index) => ({
    key: nonBlank(term.key, `terms[${index}].key`),
    label: nonBlank(term.label, `terms[${index}].label`),
    value: nonBlank(term.value, `terms[${index}].value`),
  }))
}

function normalizeRevision(input: Omit<OfferRevision, "revision"> | undefined, revision: number): OfferRevision {
  return {
    revision,
    createdAt: normalizeIsoDate(input?.createdAt ?? "1970-01-01", "revision.createdAt"),
    createdBy: nonBlank(input?.createdBy ?? "FactoryBid OS", "revision.createdBy"),
    reason: nonBlank(input?.reason ?? "Initial draft", "revision.reason"),
  }
}

function normalizeRevisionHistory(history: OfferRevision[]): OfferRevision[] {
  if (history.length === 0) {
    throw new Error("offer must include at least one revision")
  }
  return history.map((entry, index) => {
    if (entry.revision !== index + 1) {
      throw new Error("offer revisions must be contiguous")
    }
    return normalizeRevision(entry, entry.revision)
  })
}

function latestRevision(offer: OfferDraft): OfferRevision {
  return normalizeRevisionHistory(offer.revisionHistory).at(-1) ?? normalizeRevision(undefined, 1)
}

function normalizeIsoDate(value: string, key: string): string {
  const trimmed = nonBlank(value, key)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`${key} must be an ISO date in YYYY-MM-DD format`)
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== trimmed) {
    throw new Error(`${key} must be a valid ISO date`)
  }
  return trimmed
}

function optionalLines(values: Array<[string, string | undefined]>): string[] {
  return values.flatMap(([label, value]) => (value ? [`${label}: ${value}`] : []))
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}

function dateValue(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`)
}

function processLabel(process: QuoteProcessKey): string {
  switch (process) {
    case "cnc_milling":
      return "CNC milling"
    case "cnc_turning":
      return "CNC turning"
    case "sheet_metal":
      return "Sheet metal"
    case "plastic":
      return "Plastic machining"
    case "wire_edm":
      return "Wire EDM"
    case "fabrication":
      return "Fabrication"
  }
}

function formatAssumptions(assumptions: QuoteEngineAssumption[]): string {
  return assumptions.map((assumption) => `${humanizeKey(assumption.key)} ${assumption.value}`).join("; ")
}

function humanizeKey(key: string): string {
  return key.replaceAll("_", " ")
}

function assertPositiveInteger(value: number, key: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
}

function assertPositiveCents(value: number, key: string) {
  assertCents(value, key)
  if (value <= 0) {
    throw new Error(`${key} must be greater than zero`)
  }
}

function assertCents(value: number, key: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${key} must be an integer cent amount`)
  }
}
