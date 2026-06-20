import { buildOfferFollowUpCalendarPlan } from "../integrations/calendarRfq"
import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture, rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import { parseRfqIntake } from "../rfq/intake"
import { cncBracketEmail, rushSheetMetalEmail } from "../rfq/intake.fixtures"
import { buildCncOfferDraft, formatOfferMoney } from "../offers/offer"
import { buildOfferLifecycleTimeline } from "../offers/offerLifecycle"

export const DEMO_WORKSPACE_SEED_VERSION = "demo-workspace-seed.v1"

export interface DemoWorkspaceSeed {
  seedVersion: typeof DEMO_WORKSPACE_SEED_VERSION
  generatedAt: string
  tenantId: string
  customers: DemoCustomerSeed[]
  rfqs: DemoRfqSeed[]
  quotes: DemoQuoteSeed[]
  offers: DemoOfferSeed[]
  activities: DemoActivitySeed[]
}

export interface SerializedDemoWorkspaceSeed {
  seedVersion: typeof DEMO_WORKSPACE_SEED_VERSION
  manifestText: string
  seedJson: string
}

export interface DemoCustomerSeed {
  id: string
  name: string
  defaultCurrency: "EUR" | "USD" | "GBP"
}

export interface DemoRfqSeed {
  id: string
  customerId: string
  dueAt?: string
  priority: "normal" | "rush"
  source: "gmail" | "manual" | "import"
  status: "new" | "triage" | "estimating" | "quoted"
  subject: string
}

export interface DemoQuoteSeed {
  id: string
  currency: "EUR" | "USD" | "GBP"
  leadTimeDays: number
  partNumber: string
  rfqId: string
  totalCents: number
}

export interface DemoOfferSeed {
  id: string
  currency: "EUR" | "USD" | "GBP"
  customerId: string
  offerNumber: string
  quoteId: string
  rfqId: string
  status: "draft" | "sent"
  totalCents: number
  validUntil: string
}

export interface DemoActivitySeed {
  id: string
  kind: "note" | "status_change" | "calendar_event" | "calculation"
  message: string
  occurredAt: string
  offerId?: string
  quoteId?: string
  rfqId?: string
}

export function buildDemoWorkspaceSeed(input: { generatedAt?: string; tenantId?: string } = {}): DemoWorkspaceSeed {
  const tenantId = input.tenantId ?? "factorybid-single-tenant"
  const generatedAt = input.generatedAt ?? "2026-06-20T07:00:00.000Z"
  const northForgeRfq = parseRfqIntake(cncBracketEmail)
  const rushSheetRfq = parseRfqIntake(rushSheetMetalEmail)
  const northForgeQuote = calculateCncQuote(aluminumBracketFixture)
  const balticQuote = calculateCncQuote(rushTurnedSpacerFixture)
  const balticOffer = buildCncOfferDraft({
    customer: {
      contactName: "Mikael Laine",
      email: "mikael.laine@baltic.example",
      name: "Baltic Hydraulics",
    },
    issuedAt: "2026-06-19",
    lineDescription: "Turned spacer FB-TURN-019",
    notes: ["Rush lead time included.", "Passivation included as outside service."],
    offerNumber: "OFFER-019",
    quote: balticQuote,
    rfqReference: "rfq-019",
    subject: "Turned spacer RFQ",
    validUntil: "2026-07-03",
  })
  const balticTimeline = buildOfferLifecycleTimeline(balticOffer, [
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
  const followUpPlan = buildOfferFollowUpCalendarPlan({
    customerName: balticOffer.customer.name,
    offerId: "offer-019",
    timeline: balticTimeline,
    timezone: "Europe/Helsinki",
  })

  return {
    seedVersion: DEMO_WORKSPACE_SEED_VERSION,
    generatedAt,
    tenantId,
    customers: [
      { id: "customer-baltic", name: "Baltic Hydraulics", defaultCurrency: "EUR" },
      { id: "customer-north-forge", name: northForgeRfq.customerName ?? "North Forge", defaultCurrency: northForgeRfq.currency },
      { id: "customer-arctic", name: "Arctic Instruments", defaultCurrency: rushSheetRfq.currency },
    ],
    rfqs: [
      {
        id: "rfq-019",
        customerId: "customer-baltic",
        dueAt: "2026-06-24T15:00:00.000Z",
        priority: "rush",
        source: "gmail",
        status: "triage",
        subject: "Turned spacer FB-TURN-019",
      },
      {
        id: "rfq-204",
        customerId: "customer-north-forge",
        dueAt: northForgeRfq.dueAt ? new Date(northForgeRfq.dueAt).toISOString() : undefined,
        priority: "normal",
        source: "gmail",
        status: "estimating",
        subject: northForgeRfq.subject,
      },
      {
        id: "rfq-sheet-urgent",
        customerId: "customer-arctic",
        dueAt: rushSheetRfq.dueAt ? new Date(rushSheetRfq.dueAt).toISOString() : undefined,
        priority: "rush",
        source: "gmail",
        status: "new",
        subject: rushSheetRfq.subject,
      },
    ],
    quotes: [
      {
        id: "quote-019",
        currency: balticQuote.currency,
        leadTimeDays: balticQuote.leadTimeDays,
        partNumber: balticQuote.partNumber,
        rfqId: "rfq-019",
        totalCents: balticQuote.totalCents,
      },
      {
        id: "quote-204",
        currency: northForgeQuote.currency,
        leadTimeDays: northForgeQuote.leadTimeDays,
        partNumber: northForgeQuote.partNumber,
        rfqId: "rfq-204",
        totalCents: northForgeQuote.totalCents,
      },
    ],
    offers: [
      {
        id: "offer-019",
        currency: balticOffer.currency,
        customerId: "customer-baltic",
        offerNumber: balticOffer.offerNumber,
        quoteId: "quote-019",
        rfqId: "rfq-019",
        status: "sent",
        totalCents: balticOffer.totalCents,
        validUntil: balticOffer.validUntil,
      },
    ],
    activities: [
      {
        id: "activity-rfq-019-triage",
        kind: "status_change",
        message: "Moved RFQ from new to triage.",
        occurredAt: "2026-06-20T06:45:00.000Z",
        rfqId: "rfq-019",
      },
      {
        id: "activity-offer-019-follow-up",
        kind: "calendar_event",
        message: followUpPlan.events[0]?.description ?? "Follow up with Baltic Hydraulics about offer OFFER-019.",
        occurredAt: followUpPlan.events[0]?.startAt ?? "2026-06-24T06:00:00.000Z",
        offerId: "offer-019",
        quoteId: "quote-019",
        rfqId: "rfq-019",
      },
    ],
  }
}

export function serializeDemoWorkspaceSeed(seed: DemoWorkspaceSeed = buildDemoWorkspaceSeed()): SerializedDemoWorkspaceSeed {
  return {
    seedVersion: seed.seedVersion,
    manifestText: renderDemoWorkspaceSeedManifest(seed),
    seedJson: stableJson(seed),
  }
}

export function renderDemoWorkspaceSeedManifest(seed: DemoWorkspaceSeed): string {
  const lines = [
    `FactoryBid demo workspace seed ${seed.seedVersion}`,
    `Tenant: ${seed.tenantId}`,
    `Generated: ${seed.generatedAt}`,
    "",
    `Customers (${seed.customers.length})`,
    ...seed.customers.map((customer) => `- ${customer.id}: ${customer.name} [${customer.defaultCurrency}]`),
    "",
    `RFQs (${seed.rfqs.length})`,
    ...seed.rfqs.map((rfq) => {
      const dueAt = rfq.dueAt ? ` due ${rfq.dueAt}` : ""
      return `- ${rfq.id}: ${rfq.subject} [${rfq.status}, ${rfq.priority}]${dueAt}`
    }),
    "",
    `Quotes (${seed.quotes.length})`,
    ...seed.quotes.map(
      (quote) =>
        `- ${quote.id}: ${quote.partNumber} ${formatOfferMoney(quote.totalCents, quote.currency)} ${quote.leadTimeDays}d`,
    ),
    "",
    `Offers (${seed.offers.length})`,
    ...seed.offers.map(
      (offer) =>
        `- ${offer.id}: ${offer.offerNumber} [${offer.status}] ${formatOfferMoney(offer.totalCents, offer.currency)} valid ${offer.validUntil}`,
    ),
    "",
    `Activities (${seed.activities.length})`,
    ...seed.activities.map((activity) => {
      const target = activity.offerId ?? activity.quoteId ?? activity.rfqId ?? "workspace"
      return `- ${activity.id}: ${activity.kind} for ${target} at ${activity.occurredAt}`
    }),
  ]

  return `${lines.join("\n")}\n`
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
