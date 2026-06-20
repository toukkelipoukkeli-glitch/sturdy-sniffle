import { buildOfferFollowUpCalendarPlan, type CalendarRfqPlan } from "../integrations/calendarRfq"
import { calculateCncQuote } from "../quoting/cnc"
import { rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferDocument, type OfferDocument } from "./offerDocument"
import { buildOfferLifecycleTimeline } from "./offerLifecycle"

export const OFFER_EXPORT_FIXTURE_VERSION = "offer-export-fixtures.v1"

export interface OfferExportFixture {
  fixtureVersion: typeof OFFER_EXPORT_FIXTURE_VERSION
  offer: OfferDraft
  document: OfferDocument
  followUpPlan: CalendarRfqPlan
}

export interface SerializedOfferExportFixture {
  fixtureVersion: typeof OFFER_EXPORT_FIXTURE_VERSION
  offerDocumentJson: string
  offerDocumentText: string
  followUpPlanJson: string
}

export function buildOfferExportFixture(): OfferExportFixture {
  const quote = calculateCncQuote(rushTurnedSpacerFixture)
  const offer = buildCncOfferDraft({
    customer: {
      contactName: "Mikael Laine",
      email: "mikael.laine@baltic.example",
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
  const timeline = buildOfferLifecycleTimeline(offer, [
    {
      actor: "sales",
      kind: "sent",
      note: "Sent by email.",
      occurredAt: "2026-06-20T09:00:00+03:00",
    },
    {
      actor: "sales",
      followUpDueAt: "2026-06-24T09:00:00+03:00",
      followUpTaskId: "fu-019",
      kind: "follow_up_scheduled",
      occurredAt: "2026-06-20T09:05:00+03:00",
    },
  ])

  return {
    fixtureVersion: OFFER_EXPORT_FIXTURE_VERSION,
    offer,
    document,
    followUpPlan: buildOfferFollowUpCalendarPlan({
      customerName: offer.customer.name,
      offerId: "offer-019",
      timeline,
      timezone: "Europe/Helsinki",
    }),
  }
}

export function serializeOfferExportFixture(fixture: OfferExportFixture = buildOfferExportFixture()): SerializedOfferExportFixture {
  return {
    fixtureVersion: fixture.fixtureVersion,
    offerDocumentJson: stableJson(fixture.document),
    offerDocumentText: renderOfferDocumentText(fixture.document),
    followUpPlanJson: stableJson(fixture.followUpPlan),
  }
}

export function renderOfferDocumentText(document: OfferDocument): string {
  const lines = [
    document.title,
    `Customer: ${document.customerName}`,
    `Issued: ${document.issuedAt}`,
    `Valid until: ${document.validUntil}`,
    `Total: ${document.totalLabel}`,
  ]

  for (const section of document.sections) {
    lines.push("", section.title)
    for (const field of section.fields ?? []) {
      lines.push(`${field.label}: ${field.value}`)
    }
    if (section.table) {
      lines.push(section.table.columns.join(" | "))
      lines.push(...section.table.rows.map((row) => row.join(" | ")))
    }
    lines.push(...(section.body ?? []))
  }

  lines.push("", ...document.footerLines)
  return lines.join("\n")
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, Object.keys(flattenKeys(value)).sort(), 2)}\n`
}

function flattenKeys(value: unknown, keys: Record<string, true> = {}): Record<string, true> {
  if (Array.isArray(value)) {
    value.forEach((item) => flattenKeys(item, keys))
    return keys
  }
  if (!value || typeof value !== "object") {
    return keys
  }
  Object.entries(value).forEach(([key, nested]) => {
    keys[key] = true
    flattenKeys(nested, keys)
  })
  return keys
}
