import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { OfferDraft } from "./offer"
import type { OfferExportPackage } from "./offerExportPackage"

export const OFFER_SEND_READINESS_VERSION = "offer-send-readiness.v1"

export type OfferSendReadinessStatus = "ready" | "needs_review" | "blocked"
export type OfferSendReadinessCheckStatus = "passed" | "warning" | "blocked"
export type OfferSendReadinessIssueSeverity = "warning" | "blocker"
export type OfferSendReadinessIssueCode =
  | "missing_customer_email"
  | "expired_validity"
  | "pdf_not_ready"
  | "calculator_review_flags"
  | "missing_alternate"
  | "missing_follow_up"

export interface OfferSendReadinessIssue {
  code: OfferSendReadinessIssueCode
  severity: OfferSendReadinessIssueSeverity
  message: string
}

export interface OfferSendReadinessCheck {
  key: OfferSendReadinessIssueCode
  label: string
  status: OfferSendReadinessCheckStatus
  detail: string
}

export interface EvaluateOfferSendReadinessInput {
  exportPackage: OfferExportPackage
  followUpScheduledAt?: string
  nowDate: string
  offer: OfferDraft
  requireAlternate?: boolean
  requireCleanCalculator?: boolean
}

export interface OfferSendReadinessResult {
  readinessVersion: typeof OFFER_SEND_READINESS_VERSION
  offerNumber: string
  status: OfferSendReadinessStatus
  checkedAt: string
  issues: OfferSendReadinessIssue[]
  checks: OfferSendReadinessCheck[]
}

export function evaluateOfferSendReadiness(input: EvaluateOfferSendReadinessInput): OfferSendReadinessResult {
  const checkedAt = normalizeIsoDate(input.nowDate, "nowDate")
  const requireAlternate = input.requireAlternate ?? true
  const requireCleanCalculator = input.requireCleanCalculator ?? false
  const issues = [
    ...customerEmailIssues(input.offer),
    ...validityIssues(input.offer, checkedAt),
    ...pdfIssues(input.exportPackage),
    ...calculatorIssues(input.offer, requireCleanCalculator),
    ...alternateIssues(input.exportPackage, requireAlternate),
    ...followUpIssues(input.followUpScheduledAt),
  ]
  const checks = buildChecks({ checkedAt, exportPackage: input.exportPackage, followUpScheduledAt: input.followUpScheduledAt, issues, offer: input.offer })
  const hasBlocker = issues.some((issue) => issue.severity === "blocker")

  return {
    readinessVersion: OFFER_SEND_READINESS_VERSION,
    offerNumber: input.offer.offerNumber,
    status: hasBlocker ? "blocked" : issues.length > 0 ? "needs_review" : "ready",
    checkedAt,
    issues,
    checks,
  }
}

function customerEmailIssues(offer: OfferDraft): OfferSendReadinessIssue[] {
  return optionalTrim(offer.customer.email)
    ? []
    : [
        {
          code: "missing_customer_email",
          severity: "blocker",
          message: "Customer email is required before sending the offer.",
        },
      ]
}

function validityIssues(offer: OfferDraft, checkedAt: string): OfferSendReadinessIssue[] {
  return dateValue(offer.validUntil) >= dateValue(checkedAt)
    ? []
    : [
        {
          code: "expired_validity",
          severity: "blocker",
          message: `Offer validity expired on ${offer.validUntil}.`,
        },
      ]
}

function pdfIssues(exportPackage: OfferExportPackage): OfferSendReadinessIssue[] {
  return exportPackage.pdf.status === "ready"
    ? []
    : [
        {
          code: "pdf_not_ready",
          severity: "blocker",
          message: `PDF export is not ready: ${exportPackage.pdf.warnings.join(" ") || "review required"}`,
        },
      ]
}

function calculatorIssues(offer: OfferDraft, requireCleanCalculator: boolean): OfferSendReadinessIssue[] {
  const warningCount = offer.items.reduce((sum, item) => sum + item.warnings.length, 0)
  if (warningCount === 0) {
    return []
  }

  return [
    {
      code: "calculator_review_flags",
      severity: requireCleanCalculator ? "blocker" : "warning",
      message: `${warningCount} calculator review flag${warningCount === 1 ? "" : "s"} should be acknowledged before sending.`,
    },
  ]
}

function alternateIssues(exportPackage: OfferExportPackage, requireAlternate: boolean): OfferSendReadinessIssue[] {
  if (!requireAlternate || exportPackage.alternates.length > 0) {
    return []
  }

  return [
    {
      code: "missing_alternate",
      severity: "warning",
      message: "No customer-facing alternate is included in the offer package.",
    },
  ]
}

function followUpIssues(followUpScheduledAt: string | undefined): OfferSendReadinessIssue[] {
  return optionalTrim(followUpScheduledAt)
    ? []
    : [
        {
          code: "missing_follow_up",
          severity: "warning",
          message: "No post-send follow-up is scheduled.",
        },
      ]
}

function buildChecks(input: {
  checkedAt: string
  exportPackage: OfferExportPackage
  followUpScheduledAt?: string
  issues: OfferSendReadinessIssue[]
  offer: OfferDraft
}): OfferSendReadinessCheck[] {
  const issueByCode = new Map(input.issues.map((issue) => [issue.code, issue]))

  return [
    check("missing_customer_email", "Customer email", input.offer.customer.email ?? "Missing", issueByCode),
    check("expired_validity", "Validity", `Valid until ${input.offer.validUntil}; checked ${input.checkedAt}`, issueByCode),
    check("pdf_not_ready", "PDF export", input.exportPackage.pdf.targetFileName, issueByCode),
    check("calculator_review_flags", "Calculator review", calculatorDetail(input.offer), issueByCode),
    check("missing_alternate", "Customer alternate", alternateDetail(input.exportPackage), issueByCode),
    check("missing_follow_up", "Follow-up", optionalTrim(input.followUpScheduledAt) ?? "Not scheduled", issueByCode),
  ]
}

function check(
  key: OfferSendReadinessIssueCode,
  label: string,
  passedDetail: string,
  issueByCode: Map<OfferSendReadinessIssueCode, OfferSendReadinessIssue>,
): OfferSendReadinessCheck {
  const issue = issueByCode.get(key)
  return {
    key,
    label,
    status: issue ? (issue.severity === "blocker" ? "blocked" : "warning") : "passed",
    detail: issue?.message ?? nonBlank(passedDetail, `${key}.detail`),
  }
}

function calculatorDetail(offer: OfferDraft): string {
  const warningCount = offer.items.reduce((sum, item) => sum + item.warnings.length, 0)
  return warningCount === 0 ? "No calculator review flags." : `${warningCount} calculator review flag${warningCount === 1 ? "" : "s"}.`
}

function alternateDetail(exportPackage: OfferExportPackage): string {
  return exportPackage.alternates.length === 0
    ? "No alternates."
    : `${exportPackage.alternates.length} alternate${exportPackage.alternates.length === 1 ? "" : "s"} included.`
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

function dateValue(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`)
}
