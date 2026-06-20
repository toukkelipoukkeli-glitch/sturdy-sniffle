import { normalizeIsoTimestamp } from "../shared/deterministic"
import {
  buildDemoWorkspaceSeed,
  DEMO_WORKSPACE_SEED_VERSION,
  type DemoActivitySeed,
  type DemoCustomerSeed,
  type DemoOfferSeed,
  type DemoQuoteSeed,
  type DemoRfqSeed,
  type DemoWorkspaceSeed,
} from "./workspaceSeed"

export const DEMO_WORKSPACE_IMPORT_PLAN_VERSION = "demo-workspace-import-plan.v1"

export type DemoWorkspaceImportOperationKind =
  | "upsert_customer"
  | "upsert_rfq"
  | "upsert_quote"
  | "upsert_offer"
  | "append_activity"

export interface DemoWorkspaceImportPlan {
  importPlanVersion: typeof DEMO_WORKSPACE_IMPORT_PLAN_VERSION
  seedVersion: DemoWorkspaceSeed["seedVersion"]
  generatedAt: string
  tenantId: string
  operations: DemoWorkspaceImportOperation[]
}

export interface DemoWorkspaceSeedValidationIssue {
  path: string
  message: string
}

export class DemoWorkspaceSeedValidationError extends Error {
  readonly issues: DemoWorkspaceSeedValidationIssue[]

  constructor(issues: DemoWorkspaceSeedValidationIssue[]) {
    super(`demo workspace seed is invalid: ${issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`)
    this.name = "DemoWorkspaceSeedValidationError"
    this.issues = issues
  }
}

export type DemoWorkspaceImportOperation =
  | {
      key: string
      kind: "upsert_customer"
      tenantId: string
      customerId: string
      name: string
      defaultCurrency: string
    }
  | {
      key: string
      kind: "upsert_rfq"
      tenantId: string
      rfqId: string
      customerId: string
      dueAt?: string
      priority: string
      source: string
      status: string
      subject: string
    }
  | {
      key: string
      kind: "upsert_quote"
      tenantId: string
      quoteId: string
      rfqId: string
      currency: string
      leadTimeDays: number
      partNumber: string
      totalCents: number
    }
  | {
      key: string
      kind: "upsert_offer"
      tenantId: string
      offerId: string
      currency: string
      customerId: string
      offerNumber: string
      quoteId: string
      rfqId: string
      status: string
      totalCents: number
      validUntil: string
    }
  | {
      key: string
      kind: "append_activity"
      tenantId: string
      activityId: string
      activityKind: string
      message: string
      occurredAt: string
      offerId?: string
      quoteId?: string
      rfqId?: string
    }

const operationOrder: DemoWorkspaceImportOperationKind[] = [
  "upsert_customer",
  "upsert_rfq",
  "upsert_quote",
  "upsert_offer",
  "append_activity",
]

const currencyCodes = ["EUR", "USD", "GBP"] as const
const rfqPriorities = ["normal", "rush"] as const
const rfqSources = ["gmail", "manual", "import"] as const
const rfqStatuses = ["new", "triage", "estimating", "quoted"] as const
const offerStatuses = ["draft", "sent"] as const
const activityKinds = ["note", "status_change", "calendar_event", "calculation"] as const

export function parseDemoWorkspaceSeedJson(seedJson: string): DemoWorkspaceSeed {
  let value: unknown
  try {
    value = JSON.parse(seedJson)
  } catch {
    throw new DemoWorkspaceSeedValidationError([{ path: "$", message: "must be valid JSON" }])
  }

  return assertDemoWorkspaceSeed(value)
}

export function buildDemoWorkspaceImportPlanFromJson(seedJson: string): DemoWorkspaceImportPlan {
  return buildDemoWorkspaceImportPlan(parseDemoWorkspaceSeedJson(seedJson))
}

export function assertDemoWorkspaceSeed(value: unknown): DemoWorkspaceSeed {
  const issues = validateDemoWorkspaceSeed(value)
  if (issues.length > 0) {
    throw new DemoWorkspaceSeedValidationError(issues)
  }
  return value as DemoWorkspaceSeed
}

export function validateDemoWorkspaceSeed(value: unknown): DemoWorkspaceSeedValidationIssue[] {
  const issues: DemoWorkspaceSeedValidationIssue[] = []
  if (!isRecord(value)) {
    return [{ path: "$", message: "must be an object" }]
  }

  requireString(value, "seedVersion", "$.seedVersion", issues)
  if (value.seedVersion !== undefined && value.seedVersion !== DEMO_WORKSPACE_SEED_VERSION) {
    issues.push({ path: "$.seedVersion", message: `must be ${DEMO_WORKSPACE_SEED_VERSION}` })
  }
  requireIsoTimestamp(value, "generatedAt", "$.generatedAt", issues)
  requireString(value, "tenantId", "$.tenantId", issues)

  const customers = arrayRecords(value, "customers", "$.customers", issues)
  const rfqs = arrayRecords(value, "rfqs", "$.rfqs", issues)
  const quotes = arrayRecords(value, "quotes", "$.quotes", issues)
  const offers = arrayRecords(value, "offers", "$.offers", issues)
  const activities = arrayRecords(value, "activities", "$.activities", issues)

  customers.forEach((customer, index) => validateCustomer(customer, `$.customers[${index}]`, issues))
  rfqs.forEach((rfq, index) => validateRfq(rfq, `$.rfqs[${index}]`, issues))
  quotes.forEach((quote, index) => validateQuote(quote, `$.quotes[${index}]`, issues))
  offers.forEach((offer, index) => validateOffer(offer, `$.offers[${index}]`, issues))
  activities.forEach((activity, index) => validateActivity(activity, `$.activities[${index}]`, issues))

  validateDemoWorkspaceSeedReferences(value as Partial<DemoWorkspaceSeed>, issues)
  return issues
}

export function buildDemoWorkspaceImportPlan(seed: DemoWorkspaceSeed = buildDemoWorkspaceSeed()): DemoWorkspaceImportPlan {
  const issues = validateDemoWorkspaceSeed(seed)
  if (issues.length > 0) {
    throw new DemoWorkspaceSeedValidationError(issues)
  }

  return {
    importPlanVersion: DEMO_WORKSPACE_IMPORT_PLAN_VERSION,
    seedVersion: seed.seedVersion,
    generatedAt: seed.generatedAt,
    tenantId: seed.tenantId,
    operations: [
      ...seed.customers.map((customer): DemoWorkspaceImportOperation => ({
        key: operationKey("upsert_customer", customer.id),
        kind: "upsert_customer",
        tenantId: seed.tenantId,
        customerId: customer.id,
        name: customer.name,
        defaultCurrency: customer.defaultCurrency,
      })),
      ...seed.rfqs.map((rfq): DemoWorkspaceImportOperation => ({
        key: operationKey("upsert_rfq", rfq.id),
        kind: "upsert_rfq",
        tenantId: seed.tenantId,
        rfqId: rfq.id,
        customerId: rfq.customerId,
        dueAt: rfq.dueAt,
        priority: rfq.priority,
        source: rfq.source,
        status: rfq.status,
        subject: rfq.subject,
      })),
      ...seed.quotes.map((quote): DemoWorkspaceImportOperation => ({
        key: operationKey("upsert_quote", quote.id),
        kind: "upsert_quote",
        tenantId: seed.tenantId,
        quoteId: quote.id,
        rfqId: quote.rfqId,
        currency: quote.currency,
        leadTimeDays: quote.leadTimeDays,
        partNumber: quote.partNumber,
        totalCents: quote.totalCents,
      })),
      ...seed.offers.map((offer): DemoWorkspaceImportOperation => ({
        key: operationKey("upsert_offer", offer.id),
        kind: "upsert_offer",
        tenantId: seed.tenantId,
        offerId: offer.id,
        currency: offer.currency,
        customerId: offer.customerId,
        offerNumber: offer.offerNumber,
        quoteId: offer.quoteId,
        rfqId: offer.rfqId,
        status: offer.status,
        totalCents: offer.totalCents,
        validUntil: offer.validUntil,
      })),
      ...seed.activities.map((activity): DemoWorkspaceImportOperation => ({
        key: operationKey("append_activity", activity.id),
        kind: "append_activity",
        tenantId: seed.tenantId,
        activityId: activity.id,
        activityKind: activity.kind,
        message: activity.message,
        occurredAt: activity.occurredAt,
        offerId: activity.offerId,
        quoteId: activity.quoteId,
        rfqId: activity.rfqId,
      })),
    ],
  }
}

export function summarizeDemoWorkspaceImportPlan(plan: DemoWorkspaceImportPlan): string {
  const counts = countOperations(plan.operations)
  const lines = [
    `FactoryBid demo workspace import ${plan.importPlanVersion}`,
    `Seed: ${plan.seedVersion}`,
    `Tenant: ${plan.tenantId}`,
    `Generated: ${plan.generatedAt}`,
    `Operations: ${plan.operations.length}`,
    "",
    ...operationOrder.map((kind) => `- ${kind}: ${counts[kind] ?? 0}`),
  ]

  return `${lines.join("\n")}\n`
}

function validateCustomer(customer: Record<string, unknown>, path: string, issues: DemoWorkspaceSeedValidationIssue[]) {
  requireString(customer, "id", `${path}.id`, issues)
  requireString(customer, "name", `${path}.name`, issues)
  requireEnum(customer, "defaultCurrency", currencyCodes, `${path}.defaultCurrency`, issues)
}

function validateRfq(rfq: Record<string, unknown>, path: string, issues: DemoWorkspaceSeedValidationIssue[]) {
  requireString(rfq, "id", `${path}.id`, issues)
  requireString(rfq, "customerId", `${path}.customerId`, issues)
  requireOptionalIsoTimestamp(rfq, "dueAt", `${path}.dueAt`, issues)
  requireEnum(rfq, "priority", rfqPriorities, `${path}.priority`, issues)
  requireEnum(rfq, "source", rfqSources, `${path}.source`, issues)
  requireEnum(rfq, "status", rfqStatuses, `${path}.status`, issues)
  requireString(rfq, "subject", `${path}.subject`, issues)
}

function validateQuote(quote: Record<string, unknown>, path: string, issues: DemoWorkspaceSeedValidationIssue[]) {
  requireString(quote, "id", `${path}.id`, issues)
  requireEnum(quote, "currency", currencyCodes, `${path}.currency`, issues)
  requirePositiveInteger(quote, "leadTimeDays", `${path}.leadTimeDays`, issues)
  requireString(quote, "partNumber", `${path}.partNumber`, issues)
  requireString(quote, "rfqId", `${path}.rfqId`, issues)
  requireNonNegativeInteger(quote, "totalCents", `${path}.totalCents`, issues)
}

function validateOffer(offer: Record<string, unknown>, path: string, issues: DemoWorkspaceSeedValidationIssue[]) {
  requireString(offer, "id", `${path}.id`, issues)
  requireEnum(offer, "currency", currencyCodes, `${path}.currency`, issues)
  requireString(offer, "customerId", `${path}.customerId`, issues)
  requireString(offer, "offerNumber", `${path}.offerNumber`, issues)
  requireString(offer, "quoteId", `${path}.quoteId`, issues)
  requireString(offer, "rfqId", `${path}.rfqId`, issues)
  requireEnum(offer, "status", offerStatuses, `${path}.status`, issues)
  requireNonNegativeInteger(offer, "totalCents", `${path}.totalCents`, issues)
  requireIsoDate(offer, "validUntil", `${path}.validUntil`, issues)
}

function validateActivity(activity: Record<string, unknown>, path: string, issues: DemoWorkspaceSeedValidationIssue[]) {
  requireString(activity, "id", `${path}.id`, issues)
  requireEnum(activity, "kind", activityKinds, `${path}.kind`, issues)
  requireString(activity, "message", `${path}.message`, issues)
  requireIsoTimestamp(activity, "occurredAt", `${path}.occurredAt`, issues)
  requireOptionalString(activity, "offerId", `${path}.offerId`, issues)
  requireOptionalString(activity, "quoteId", `${path}.quoteId`, issues)
  requireOptionalString(activity, "rfqId", `${path}.rfqId`, issues)
}

function validateDemoWorkspaceSeedReferences(
  seed: Partial<DemoWorkspaceSeed>,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  const validCustomers = arrayIfPresent(seed.customers).filter(isCustomerSeed)
  const validRfqs = arrayIfPresent(seed.rfqs).filter(isRfqSeed)
  const validQuotes = arrayIfPresent(seed.quotes).filter(isQuoteSeed)
  const validOffers = arrayIfPresent(seed.offers).filter(isOfferSeed)
  const validActivities = arrayIfPresent(seed.activities).filter(isActivitySeed)

  const customerIds = uniqueIds(
    "customer",
    validCustomers.map((customer) => customer.id),
    "$.customers",
    issues,
  )
  const rfqIds = uniqueIds(
    "rfq",
    validRfqs.map((rfq) => rfq.id),
    "$.rfqs",
    issues,
  )
  const quoteIds = uniqueIds(
    "quote",
    validQuotes.map((quote) => quote.id),
    "$.quotes",
    issues,
  )
  const offerIds = uniqueIds(
    "offer",
    validOffers.map((offer) => offer.id),
    "$.offers",
    issues,
  )
  uniqueIds("activity", validActivities.map((activity) => activity.id), "$.activities", issues)

  validRfqs.forEach((rfq) => requireReference(customerIds, rfq.customerId, `RFQ ${rfq.id} customerId`, issues))
  validQuotes.forEach((quote) => requireReference(rfqIds, quote.rfqId, `quote ${quote.id} rfqId`, issues))
  validOffers.forEach((offer) => {
    requireReference(customerIds, offer.customerId, `offer ${offer.id} customerId`, issues)
    requireReference(rfqIds, offer.rfqId, `offer ${offer.id} rfqId`, issues)
    requireReference(quoteIds, offer.quoteId, `offer ${offer.id} quoteId`, issues)
  })
  validActivities.forEach((activity) => {
    requireOptionalReference(rfqIds, activity.rfqId, `activity ${activity.id} rfqId`, issues)
    requireOptionalReference(quoteIds, activity.quoteId, `activity ${activity.id} quoteId`, issues)
    requireOptionalReference(offerIds, activity.offerId, `activity ${activity.id} offerId`, issues)
  })
}

function uniqueIds(
  label: string,
  ids: string[],
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
): Set<string> {
  const seen = new Set<string>()
  ids.forEach((id) => {
    if (seen.has(id)) {
      issues.push({ path, message: `contains duplicate ${label} id ${id}` })
    }
    seen.add(id)
  })
  return seen
}

function requireReference(
  ids: Set<string>,
  id: string,
  label: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  if (!ids.has(id)) {
    issues.push({ path: label, message: `references missing id ${id}` })
  }
}

function requireOptionalReference(
  ids: Set<string>,
  id: string | undefined,
  label: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  if (id) {
    requireReference(ids, id, label, issues)
  }
}

function countOperations(operations: DemoWorkspaceImportOperation[]): Partial<Record<DemoWorkspaceImportOperationKind, number>> {
  return operations.reduce<Partial<Record<DemoWorkspaceImportOperationKind, number>>>((counts, operation) => {
    counts[operation.kind] = (counts[operation.kind] ?? 0) + 1
    return counts
  }, {})
}

function operationKey(kind: DemoWorkspaceImportOperationKind, id: string) {
  return `${kind}:${id}`
}

function arrayIfPresent(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function isCustomerSeed(value: unknown): value is DemoCustomerSeed {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && isOneOf(value.defaultCurrency, currencyCodes)
}

function isRfqSeed(value: unknown): value is DemoRfqSeed {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.customerId === "string" &&
    isOneOf(value.priority, rfqPriorities) &&
    isOneOf(value.source, rfqSources) &&
    isOneOf(value.status, rfqStatuses) &&
    typeof value.subject === "string"
  )
}

function isQuoteSeed(value: unknown): value is DemoQuoteSeed {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isOneOf(value.currency, currencyCodes) &&
    Number.isInteger(value.leadTimeDays) &&
    typeof value.partNumber === "string" &&
    typeof value.rfqId === "string" &&
    Number.isInteger(value.totalCents)
  )
}

function isOfferSeed(value: unknown): value is DemoOfferSeed {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isOneOf(value.currency, currencyCodes) &&
    typeof value.customerId === "string" &&
    typeof value.offerNumber === "string" &&
    typeof value.quoteId === "string" &&
    typeof value.rfqId === "string" &&
    isOneOf(value.status, offerStatuses) &&
    Number.isInteger(value.totalCents) &&
    typeof value.validUntil === "string"
  )
}

function isActivitySeed(value: unknown): value is DemoActivitySeed {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isOneOf(value.kind, activityKinds) &&
    typeof value.message === "string" &&
    typeof value.occurredAt === "string" &&
    (value.offerId === undefined || typeof value.offerId === "string") &&
    (value.quoteId === undefined || typeof value.quoteId === "string") &&
    (value.rfqId === undefined || typeof value.rfqId === "string")
  )
}

function arrayRecords(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
): Record<string, unknown>[] {
  const value = record[key]
  if (!Array.isArray(value)) {
    issues.push({ path, message: "must be an array" })
    return []
  }
  return value.flatMap((item, index) => {
    if (isRecord(item)) {
      return [item]
    }
    issues.push({ path: `${path}[${index}]`, message: "must be an object" })
    return []
  })
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  const value = record[key]
  if (typeof value !== "string" || value.trim() === "") {
    issues.push({ path, message: "must be a non-empty string" })
  }
}

function requireOptionalString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  const value = record[key]
  if (value !== undefined && (typeof value !== "string" || value.trim() === "")) {
    issues.push({ path, message: "must be a non-empty string when provided" })
  }
}

function requireIsoTimestamp(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  const value = record[key]
  if (typeof value !== "string") {
    issues.push({ path, message: "must be an ISO timestamp" })
    return
  }
  try {
    normalizeIsoTimestamp(value, path)
  } catch {
    issues.push({ path, message: "must be an ISO timestamp" })
  }
}

function requireOptionalIsoTimestamp(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  if (record[key] !== undefined) {
    requireIsoTimestamp(record, key, path, issues)
  }
}

function requireIsoDate(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  const value = record[key]
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    issues.push({ path, message: "must be an ISO date" })
    return
  }
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    issues.push({ path, message: "must be an ISO date" })
  }
}

function requirePositiveInteger(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  const value = record[key]
  if (!Number.isInteger(value) || Number(value) <= 0) {
    issues.push({ path, message: "must be a positive integer" })
  }
}

function requireNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  const value = record[key]
  if (!Number.isInteger(value) || Number(value) < 0) {
    issues.push({ path, message: "must be a non-negative integer" })
  }
}

function requireEnum<T extends readonly string[]>(
  record: Record<string, unknown>,
  key: string,
  allowed: T,
  path: string,
  issues: DemoWorkspaceSeedValidationIssue[],
) {
  if (!isOneOf(record[key], allowed)) {
    issues.push({ path, message: `must be one of ${allowed.join(", ")}` })
  }
}

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}
