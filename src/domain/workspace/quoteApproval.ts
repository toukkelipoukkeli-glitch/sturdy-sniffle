import type { QuoteEngineResult } from "../quoting/registry"
import { nonBlank } from "../shared/stringValidation"
import type { CapacityItemCommitment } from "./capacityCommitment"

export const QUOTE_APPROVAL_POLICY_VERSION = "quote-approval-policy.v1"

export type QuoteApprovalStatus = "approved" | "needs_review" | "blocked"
export type QuoteApprovalIssueSeverity = "warning" | "blocker"
export type QuoteApprovalCheckStatus = "passed" | "warning" | "blocked"
export type QuoteApprovalPaymentTerm = "standard" | "prepay_required" | "credit_hold"
export type QuoteApprovalIssueCode =
  | "invalid_review_date"
  | "low_margin"
  | "thin_margin"
  | "high_value"
  | "long_lead_time"
  | "calculator_warnings"
  | "capacity_late"
  | "capacity_unplanned"
  | "prepayment_required"
  | "customer_credit_hold"
  | "customer_credit_limit"

export interface QuoteApprovalCustomerPolicy {
  customerName: string
  paymentTerm?: QuoteApprovalPaymentTerm
  creditLimitCents?: number
  openBalanceCents?: number
}

export interface QuoteApprovalThresholds {
  minimumMarginPercent?: number
  reviewMarginPercent?: number
  managerApprovalCents?: number
  maxLeadTimeDays?: number
  requireCleanCalculator?: boolean
}

export interface QuoteApprovalInput {
  quote: QuoteEngineResult
  customer: QuoteApprovalCustomerPolicy
  reviewedAt: string
  capacityCommitment?: CapacityItemCommitment
  thresholds?: QuoteApprovalThresholds
}

export interface QuoteApprovalIssue {
  code: QuoteApprovalIssueCode
  severity: QuoteApprovalIssueSeverity
  message: string
}

export interface QuoteApprovalCheck {
  key: QuoteApprovalIssueCode
  label: string
  status: QuoteApprovalCheckStatus
  detail: string
}

export interface QuoteApprovalDecision {
  policyVersion: typeof QUOTE_APPROVAL_POLICY_VERSION
  status: QuoteApprovalStatus
  reviewedAt: string
  customerName: string
  partNumber: string
  totalCents: number
  currency: QuoteEngineResult["currency"]
  marginPercent: number
  issues: QuoteApprovalIssue[]
  checks: QuoteApprovalCheck[]
}

interface ApprovalThresholdsRequired {
  minimumMarginPercent: number
  reviewMarginPercent: number
  managerApprovalCents: number
  maxLeadTimeDays: number
  requireCleanCalculator: boolean
}

const defaultThresholds: ApprovalThresholdsRequired = {
  managerApprovalCents: 250_000,
  maxLeadTimeDays: 30,
  minimumMarginPercent: 12,
  requireCleanCalculator: false,
  reviewMarginPercent: 20,
}

export function evaluateQuoteApproval(input: QuoteApprovalInput): QuoteApprovalDecision {
  const customerName = nonBlank(input.customer.customerName, "customer.customerName")
  const reviewedAt = parseIsoDate(input.reviewedAt, "reviewedAt")
  const thresholds = normalizeThresholds(input.thresholds)
  const marginPercent = calculateMarginPercent(input.quote)
  const issues = [
    ...dateIssues(reviewedAt),
    ...marginIssues(marginPercent, thresholds),
    ...valueIssues(input.quote, thresholds),
    ...leadTimeIssues(input.quote, thresholds),
    ...calculatorIssues(input.quote, thresholds.requireCleanCalculator),
    ...capacityIssues(input.capacityCommitment),
    ...customerIssues(input.quote, input.customer),
  ]
  const checks = buildChecks({
    capacityCommitment: input.capacityCommitment,
    customer: input.customer,
    issues,
    marginPercent,
    quote: input.quote,
    reviewedAt,
    thresholds,
  })

  return {
    policyVersion: QUOTE_APPROVAL_POLICY_VERSION,
    status: approvalStatus(issues),
    reviewedAt: reviewedAt.value,
    customerName,
    partNumber: nonBlank(input.quote.partNumber, "quote.partNumber"),
    totalCents: positiveCents(input.quote.totalCents, "quote.totalCents"),
    currency: input.quote.currency,
    marginPercent,
    issues,
    checks,
  }
}

function marginIssues(marginPercent: number, thresholds: ApprovalThresholdsRequired): QuoteApprovalIssue[] {
  if (marginPercent < thresholds.minimumMarginPercent) {
    return [
      {
        code: "low_margin",
        severity: "blocker",
        message: `Margin ${formatPercent(marginPercent)} is below the ${formatPercent(thresholds.minimumMarginPercent)} floor.`,
      },
    ]
  }
  if (marginPercent < thresholds.reviewMarginPercent) {
    return [
      {
        code: "thin_margin",
        severity: "warning",
        message: `Margin ${formatPercent(marginPercent)} needs manager review below ${formatPercent(thresholds.reviewMarginPercent)}.`,
      },
    ]
  }
  return []
}

function valueIssues(quote: QuoteEngineResult, thresholds: ApprovalThresholdsRequired): QuoteApprovalIssue[] {
  return quote.totalCents >= thresholds.managerApprovalCents
    ? [
        {
          code: "high_value",
          severity: "warning",
          message: `Quote total ${quote.totalCents} cents requires manager review at or above ${thresholds.managerApprovalCents} cents.`,
        },
      ]
    : []
}

function leadTimeIssues(quote: QuoteEngineResult, thresholds: ApprovalThresholdsRequired): QuoteApprovalIssue[] {
  return quote.leadTimeDays > thresholds.maxLeadTimeDays
    ? [
        {
          code: "long_lead_time",
          severity: "warning",
          message: `Lead time ${quote.leadTimeDays} days exceeds the ${thresholds.maxLeadTimeDays} day approval threshold.`,
        },
      ]
    : []
}

function calculatorIssues(quote: QuoteEngineResult, requireCleanCalculator: boolean): QuoteApprovalIssue[] {
  return quote.warnings.length > 0
    ? [
        {
          code: "calculator_warnings",
          severity: requireCleanCalculator ? "blocker" : "warning",
          message: `${quote.warnings.length} calculator warning${quote.warnings.length === 1 ? "" : "s"} must be acknowledged.`,
        },
      ]
    : []
}

function capacityIssues(commitment: CapacityItemCommitment | undefined): QuoteApprovalIssue[] {
  if (!commitment) {
    return []
  }
  switch (commitment.status) {
    case "committed":
      return []
    case "late":
      return [
        {
          code: "capacity_late",
          severity: "warning",
          message: `Capacity plan completes ${commitment.latenessDays} day${commitment.latenessDays === 1 ? "" : "s"} after due date.`,
        },
      ]
    case "unplanned":
      return [
        {
          code: "capacity_unplanned",
          severity: "blocker",
          message: `${commitment.unplannedMinutes} minutes are not planned in the capacity window.`,
        },
      ]
  }
}

function customerIssues(quote: QuoteEngineResult, customer: QuoteApprovalCustomerPolicy): QuoteApprovalIssue[] {
  const issues: QuoteApprovalIssue[] = []
  const paymentTerm = customer.paymentTerm ?? "standard"
  if (paymentTerm === "credit_hold") {
    issues.push({
      code: "customer_credit_hold",
      severity: "blocker",
      message: `${nonBlank(customer.customerName, "customer.customerName")} is on credit hold.`,
    })
  } else if (paymentTerm === "prepay_required") {
    issues.push({
      code: "prepayment_required",
      severity: "warning",
      message: `${nonBlank(customer.customerName, "customer.customerName")} requires prepayment terms on the offer.`,
    })
  }

  if (customer.creditLimitCents !== undefined || customer.openBalanceCents !== undefined) {
    const creditLimitCents = nonNegativeCents(customer.creditLimitCents ?? 0, "customer.creditLimitCents")
    const openBalanceCents = nonNegativeCents(customer.openBalanceCents ?? 0, "customer.openBalanceCents")
    if (creditLimitCents > 0 && openBalanceCents + quote.totalCents > creditLimitCents) {
      issues.push({
        code: "customer_credit_limit",
        severity: "warning",
        message: `Quote plus open balance exceeds the ${creditLimitCents} cent credit limit.`,
      })
    }
  }

  return issues
}

function dateIssues(reviewedAt: DateValidation): QuoteApprovalIssue[] {
  return reviewedAt.issue
    ? [
        {
          code: "invalid_review_date",
          severity: "blocker",
          message: reviewedAt.issue,
        },
      ]
    : []
}

function buildChecks(input: {
  capacityCommitment?: CapacityItemCommitment
  customer: QuoteApprovalCustomerPolicy
  issues: QuoteApprovalIssue[]
  marginPercent: number
  quote: QuoteEngineResult
  reviewedAt: DateValidation
  thresholds: ApprovalThresholdsRequired
}): QuoteApprovalCheck[] {
  const issueByCode = new Map(input.issues.map((issue) => [issue.code, issue]))
  return [
    check("invalid_review_date", "Review date", input.reviewedAt.value, issueByCode),
    check("low_margin", "Margin floor", `Margin ${formatPercent(input.marginPercent)} clears the floor.`, issueByCode),
    check("thin_margin", "Margin review", `Review threshold ${formatPercent(input.thresholds.reviewMarginPercent)}.`, issueByCode),
    check("high_value", "Order value", `Total ${input.quote.totalCents} cents.`, issueByCode),
    check("long_lead_time", "Lead time", `${input.quote.leadTimeDays} days.`, issueByCode),
    check("calculator_warnings", "Calculator warnings", calculatorDetail(input.quote), issueByCode),
    check("capacity_late", "Capacity due date", capacityDueDateDetail(input.capacityCommitment), issueByCode),
    check("capacity_unplanned", "Capacity window", capacityWindowDetail(input.capacityCommitment), issueByCode),
    check("prepayment_required", "Payment terms", paymentTermDetail(input.customer), issueByCode),
    check("customer_credit_hold", "Credit hold", paymentTermDetail(input.customer), issueByCode),
    check("customer_credit_limit", "Credit limit", creditLimitDetail(input.customer, input.quote), issueByCode),
  ]
}

function check(
  key: QuoteApprovalIssueCode,
  label: string,
  passedDetail: string,
  issueByCode: Map<QuoteApprovalIssueCode, QuoteApprovalIssue>,
): QuoteApprovalCheck {
  const issue = issueByCode.get(key)
  return {
    key,
    label,
    status: issue ? (issue.severity === "blocker" ? "blocked" : "warning") : "passed",
    detail: issue?.message ?? nonBlank(passedDetail, `${key}.detail`),
  }
}

function approvalStatus(issues: QuoteApprovalIssue[]): QuoteApprovalStatus {
  if (issues.some((issue) => issue.severity === "blocker")) {
    return "blocked"
  }
  return issues.length > 0 ? "needs_review" : "approved"
}

function normalizeThresholds(thresholds: QuoteApprovalThresholds | undefined): ApprovalThresholdsRequired {
  const normalized = { ...defaultThresholds, ...thresholds }
  percentage(normalized.minimumMarginPercent, "thresholds.minimumMarginPercent")
  percentage(normalized.reviewMarginPercent, "thresholds.reviewMarginPercent")
  if (normalized.reviewMarginPercent < normalized.minimumMarginPercent) {
    throw new Error("thresholds.reviewMarginPercent must be greater than or equal to thresholds.minimumMarginPercent")
  }
  positiveCents(normalized.managerApprovalCents, "thresholds.managerApprovalCents")
  positiveInteger(normalized.maxLeadTimeDays, "thresholds.maxLeadTimeDays")
  return normalized
}

function calculateMarginPercent(quote: QuoteEngineResult): number {
  const marginLine = quote.breakdown.find((line) => line.key === "margin")
  if (!marginLine) {
    return 0
  }
  const marginCents = marginLine.amountCents
  const fallbackBaseCents = quote.breakdown
    .filter((line) => line.key !== "margin" && line.key !== "rush_surcharge" && line.key !== "minimum_order_adjustment")
    .reduce((total, line) => total + line.amountCents, 0)
  const baseCents = marginSubtotalFromFormula(marginLine.formula) ?? fallbackBaseCents
  if (baseCents <= 0) {
    return 0
  }
  return roundPercent((marginCents / baseCents) * 100)
}

function marginSubtotalFromFormula(formula: string): number | undefined {
  const match = /^(\d+) cents subtotal x /.exec(formula)
  if (!match) {
    return undefined
  }
  return Number(match[1])
}

function calculatorDetail(quote: QuoteEngineResult): string {
  return quote.warnings.length === 0 ? "No calculator warnings." : `${quote.warnings.length} calculator warning${quote.warnings.length === 1 ? "" : "s"}.`
}

function capacityDueDateDetail(commitment: CapacityItemCommitment | undefined): string {
  if (!commitment) {
    return "No capacity due-date blocker."
  }
  if (commitment.status === "committed") {
    return `Committed by ${commitment.completionDate ?? "the planning window"}.`
  }
  if (commitment.status === "late") {
    return `Completes ${commitment.latenessDays} days late.`
  }
  return "No completion date in the capacity window."
}

function capacityWindowDetail(commitment: CapacityItemCommitment | undefined): string {
  if (!commitment) {
    return "No capacity window blocker."
  }
  if (commitment.status === "unplanned") {
    return `${commitment.unplannedMinutes} minutes unplanned.`
  }
  return "All required minutes are planned."
}

function paymentTermDetail(customer: QuoteApprovalCustomerPolicy): string {
  return `Payment term ${customer.paymentTerm ?? "standard"}.`
}

function creditLimitDetail(customer: QuoteApprovalCustomerPolicy, quote: QuoteEngineResult): string {
  const creditLimitCents = customer.creditLimitCents ?? 0
  const openBalanceCents = customer.openBalanceCents ?? 0
  return creditLimitCents > 0
    ? `${openBalanceCents + quote.totalCents}/${creditLimitCents} cents exposure.`
    : "No credit limit configured."
}

interface DateValidation {
  issue?: string
  value: string
}

function parseIsoDate(value: string, key: string): DateValidation {
  const trimmed = value.trim()
  if (!trimmed) {
    return { issue: `${key} is required.`, value: "" }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { issue: `${key} must be an ISO date in YYYY-MM-DD format.`, value: trimmed }
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== trimmed) {
    return { issue: `${key} must be a valid ISO date.`, value: trimmed }
  }
  return { value: trimmed }
}

function percentage(value: number, key: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${key} must be a number from 0 to 100`)
  }
  return value
}

function positiveInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
  return value
}

function positiveCents(value: number, key: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer cent amount`)
  }
  return value
}

function nonNegativeCents(value: number, key: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer cent amount`)
  }
  return value
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
