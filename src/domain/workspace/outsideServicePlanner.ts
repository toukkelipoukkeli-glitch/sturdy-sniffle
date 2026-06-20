import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import type { QuoteQueueItem, QuoteQueueStatus } from "./quoteQueue"

export const OUTSIDE_SERVICE_PLAN_VERSION = "outside-service-plan.v1"

export type OutsideServiceOrderStatus = "not_requested" | "rfq_sent" | "quoted" | "ordered" | "received"
export type OutsideServicePlanStatus = "covered" | "needs_action" | "at_risk" | "blocked"
export type OutsideServiceIssueCode =
  | "missing_supplier"
  | "not_ordered"
  | "request_due_soon"
  | "request_overdue"
  | "past_required_date"

export interface OutsideServiceRequirementInput {
  label: string
  amountCents: number
  supplierName?: string
  leadTimeDays?: number
  bufferDays?: number
  requiredBy?: string
  status?: OutsideServiceOrderStatus
}

export interface OutsideServiceWorkItem extends QuoteQueueItem {
  outsideServices: OutsideServiceRequirementInput[]
}

export interface OutsideServiceSupplierRule {
  match: string
  supplierName: string
  leadTimeDays: number
  bufferDays?: number
  minimumCostCents?: number
}

export interface OutsideServicePlannerInput {
  items: OutsideServiceWorkItem[]
  now: string
  supplierRules?: OutsideServiceSupplierRule[]
  defaultLeadTimeDays?: number
  defaultBufferDays?: number
}

export interface OutsideServiceIssue {
  code: OutsideServiceIssueCode
  message: string
}

export interface OutsideServiceCommitment {
  itemId: string
  customerName: string
  subject: string
  serviceKey: string
  label: string
  supplierName?: string
  amountCents: number
  leadTimeDays: number
  bufferDays: number
  requiredBy: string
  requestBy: string
  daysUntilRequestBy: number
  status: OutsideServiceOrderStatus
  risk: OutsideServicePlanStatus
  issues: OutsideServiceIssue[]
}

export interface OutsideServicePlan {
  outsideServicePlanVersion: typeof OUTSIDE_SERVICE_PLAN_VERSION
  generatedAt: string
  status: OutsideServicePlanStatus
  itemCount: number
  serviceCount: number
  totalCostCents: number
  coveredCount: number
  needsActionCount: number
  atRiskCount: number
  blockedCount: number
  commitments: OutsideServiceCommitment[]
}

const openStatuses: ReadonlySet<QuoteQueueStatus> = new Set(["new", "triage", "estimating", "ready"])
const millisecondsPerDay = 86_400_000

export function buildOutsideServicePlan(input: OutsideServicePlannerInput): OutsideServicePlan {
  const generatedAt = normalizeIsoTimestamp(input.now, "now")
  const generatedDate = utcDateOnly(generatedAt)
  const supplierRules = normalizeSupplierRules(input.supplierRules ?? [])
  const defaultLeadTimeDays = positiveInteger(input.defaultLeadTimeDays ?? 5, "defaultLeadTimeDays")
  const defaultBufferDays = nonNegativeInteger(input.defaultBufferDays ?? 1, "defaultBufferDays")
  const openItems = input.items.filter((item) => openStatuses.has(item.status))
  const commitments = openItems
    .flatMap((item) =>
      item.outsideServices.map((service, index) =>
        buildCommitment(item, service, index, {
          defaultBufferDays,
          defaultLeadTimeDays,
          generatedDate,
          supplierRules,
        }),
      ),
    )
    .sort(
      (left, right) =>
        statusWeight(right.risk) - statusWeight(left.risk) ||
        compareLex(left.requestBy, right.requestBy) ||
        compareLex(left.requiredBy, right.requiredBy) ||
        compareLex(left.itemId, right.itemId) ||
        compareLex(left.serviceKey, right.serviceKey),
    )

  return {
    outsideServicePlanVersion: OUTSIDE_SERVICE_PLAN_VERSION,
    generatedAt,
    status: summarizeStatus(commitments.map((commitment) => commitment.risk)),
    itemCount: new Set(commitments.map((commitment) => commitment.itemId)).size,
    serviceCount: commitments.length,
    totalCostCents: commitments.reduce((total, commitment) => total + commitment.amountCents, 0),
    coveredCount: commitments.filter((commitment) => commitment.risk === "covered").length,
    needsActionCount: commitments.filter((commitment) => commitment.risk === "needs_action").length,
    atRiskCount: commitments.filter((commitment) => commitment.risk === "at_risk").length,
    blockedCount: commitments.filter((commitment) => commitment.risk === "blocked").length,
    commitments,
  }
}

function buildCommitment(
  item: OutsideServiceWorkItem,
  service: OutsideServiceRequirementInput,
  index: number,
  context: {
    defaultBufferDays: number
    defaultLeadTimeDays: number
    generatedDate: string
    supplierRules: OutsideServiceSupplierRule[]
  },
): OutsideServiceCommitment {
  const label = nonBlank(service.label, "outsideService.label")
  const supplierRule = findSupplierRule(label, context.supplierRules)
  const supplierName = optionalNonBlank(service.supplierName) ?? supplierRule?.supplierName
  const leadTimeDays = positiveInteger(service.leadTimeDays ?? supplierRule?.leadTimeDays ?? context.defaultLeadTimeDays, "leadTimeDays")
  const bufferDays = nonNegativeInteger(service.bufferDays ?? supplierRule?.bufferDays ?? context.defaultBufferDays, "bufferDays")
  const amountCents = positiveCents(service.amountCents, "outsideService.amountCents")
  const requiredBy = service.requiredBy ? utcDateOnly(service.requiredBy) : addUtcDays(utcDateOnly(item.dueAt), -bufferDays)
  const requestBy = addUtcDays(requiredBy, -leadTimeDays)
  const status = service.status ?? "not_requested"
  const issues = buildIssues({
    generatedDate: context.generatedDate,
    requestBy,
    requiredBy,
    status,
    supplierName,
  })

  return {
    itemId: nonBlank(item.id, "item.id"),
    customerName: nonBlank(item.customerName, "item.customerName"),
    subject: nonBlank(item.subject, "item.subject"),
    serviceKey: `${item.id}:${normalizeKey(label)}:${index + 1}`,
    label,
    supplierName,
    amountCents: Math.max(amountCents, supplierRule?.minimumCostCents ?? 0),
    leadTimeDays,
    bufferDays,
    requiredBy,
    requestBy,
    daysUntilRequestBy: daysBetween(context.generatedDate, requestBy),
    status,
    risk: riskFromIssues(issues),
    issues,
  }
}

function buildIssues(input: {
  generatedDate: string
  requestBy: string
  requiredBy: string
  status: OutsideServiceOrderStatus
  supplierName?: string
}): OutsideServiceIssue[] {
  const issues: OutsideServiceIssue[] = []
  if (!input.supplierName) {
    issues.push({
      code: "missing_supplier",
      message: "No approved supplier is matched to this outside service.",
    })
    return issues
  }

  if (input.status === "received") {
    return issues
  }

  if (daysBetween(input.generatedDate, input.requiredBy) < 0) {
    issues.push({
      code: "past_required_date",
      message: `Service was required by ${input.requiredBy}.`,
    })
    return issues
  }

  if (input.status === "ordered") {
    return issues
  }

  const daysUntilRequestBy = daysBetween(input.generatedDate, input.requestBy)
  if (daysUntilRequestBy < 0) {
    issues.push({
      code: "request_overdue",
      message: `Supplier order was due by ${input.requestBy}.`,
    })
  } else if (daysUntilRequestBy <= 1) {
    issues.push({
      code: "request_due_soon",
      message: `Supplier order is due by ${input.requestBy}.`,
    })
  } else {
    issues.push({
      code: "not_ordered",
      message: "Outside service is not ordered yet.",
    })
  }
  return issues
}

function normalizeSupplierRules(rules: OutsideServiceSupplierRule[]): OutsideServiceSupplierRule[] {
  return rules
    .map((rule) => ({
      match: normalizeKey(nonBlank(rule.match, "supplierRule.match")),
      supplierName: nonBlank(rule.supplierName, "supplierRule.supplierName"),
      leadTimeDays: positiveInteger(rule.leadTimeDays, "supplierRule.leadTimeDays"),
      bufferDays: rule.bufferDays === undefined ? undefined : nonNegativeInteger(rule.bufferDays, "supplierRule.bufferDays"),
      minimumCostCents:
        rule.minimumCostCents === undefined ? undefined : positiveCents(rule.minimumCostCents, "supplierRule.minimumCostCents"),
    }))
    .sort((left, right) => compareLex(left.match, right.match) || compareLex(left.supplierName, right.supplierName))
}

function findSupplierRule(label: string, rules: OutsideServiceSupplierRule[]): OutsideServiceSupplierRule | undefined {
  const normalizedLabel = normalizeKey(label)
  return rules.find((rule) => normalizedLabel.includes(rule.match))
}

function riskFromIssues(issues: OutsideServiceIssue[]): OutsideServicePlanStatus {
  if (issues.some((issue) => issue.code === "missing_supplier")) {
    return "blocked"
  }
  if (issues.some((issue) => issue.code === "request_due_soon" || issue.code === "request_overdue" || issue.code === "past_required_date")) {
    return "at_risk"
  }
  if (issues.length > 0) {
    return "needs_action"
  }
  return "covered"
}

function summarizeStatus(statuses: OutsideServicePlanStatus[]): OutsideServicePlanStatus {
  if (statuses.includes("blocked")) {
    return "blocked"
  }
  if (statuses.includes("at_risk")) {
    return "at_risk"
  }
  if (statuses.includes("needs_action")) {
    return "needs_action"
  }
  return "covered"
}

function statusWeight(status: OutsideServicePlanStatus) {
  switch (status) {
    case "blocked":
      return 3
    case "at_risk":
      return 2
    case "needs_action":
      return 1
    case "covered":
      return 0
  }
}

function utcDateOnly(value: string) {
  const date = new Date(normalizeIsoTimestamp(value.includes("T") ? value : `${value}T00:00:00Z`, "date"))
  return date.toISOString().slice(0, 10)
}

function addUtcDays(date: string, days: number) {
  const timestamp = Date.parse(`${date}T00:00:00.000Z`) + days * millisecondsPerDay
  return new Date(timestamp).toISOString().slice(0, 10)
}

function daysBetween(leftDate: string, rightDate: string) {
  return Math.round((Date.parse(`${rightDate}T00:00:00.000Z`) - Date.parse(`${leftDate}T00:00:00.000Z`)) / millisecondsPerDay)
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function optionalNonBlank(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }
  return nonBlank(value, "outsideService.supplierName")
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}

function positiveInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
  return value
}

function nonNegativeInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer`)
  }
  return value
}

function positiveCents(value: number, key: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer cent amount`)
  }
  return value
}
