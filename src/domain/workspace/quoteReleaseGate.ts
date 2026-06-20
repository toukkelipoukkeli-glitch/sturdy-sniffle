import type { OfferSendReadinessResult } from "../offers/offerSendReadiness"
import type { RfqIntakeReadinessResult } from "../rfq/intakeReadiness"
import { normalizeIsoTimestamp } from "../shared/deterministic"
import type { CapacityItemCommitment } from "./capacityCommitment"
import type { MaterialAvailabilityCommitment } from "./materialAvailability"
import type { OutsideServiceCommitment } from "./outsideServicePlanner"
import type { QuoteApprovalDecision } from "./quoteApproval"

export const QUOTE_RELEASE_GATE_VERSION = "quote-release-gate.v1"

export type QuoteReleaseGateStatus = "ready" | "needs_review" | "blocked"
export type QuoteReleaseGateCheckStatus = "passed" | "warning" | "blocked"
export type QuoteReleaseGateIssueSeverity = "warning" | "blocker"
export type QuoteReleaseGateIssueCode =
  | "invalid_checked_at"
  | "intake_blocked"
  | "intake_needs_review"
  | "approval_blocked"
  | "approval_needs_review"
  | "send_readiness_blocked"
  | "send_readiness_needs_review"
  | "capacity_missing"
  | "capacity_late"
  | "capacity_unplanned"
  | "material_missing"
  | "material_needs_purchase"
  | "material_at_risk"
  | "material_blocked"
  | "outside_service_needs_action"
  | "outside_service_at_risk"
  | "outside_service_blocked"

export type QuoteReleaseGateCheckKey =
  | "checked_at"
  | "intake"
  | "approval"
  | "send_readiness"
  | "capacity"
  | "material"
  | "outside_services"

export interface QuoteReleaseGateIssue {
  code: QuoteReleaseGateIssueCode
  severity: QuoteReleaseGateIssueSeverity
  message: string
}

export interface QuoteReleaseGateCheck {
  key: QuoteReleaseGateCheckKey
  label: string
  status: QuoteReleaseGateCheckStatus
  detail: string
}

export interface QuoteReleaseGateInput {
  approval: QuoteApprovalDecision
  checkedAt: string
  intakeReadiness: RfqIntakeReadinessResult
  offerNumber: string
  offerSendReadiness: OfferSendReadinessResult
  rfqId: string
  capacityCommitment?: CapacityItemCommitment
  materialCommitment?: MaterialAvailabilityCommitment
  outsideServiceCommitments?: OutsideServiceCommitment[]
}

export interface QuoteReleaseGateDecision {
  releaseGateVersion: typeof QUOTE_RELEASE_GATE_VERSION
  checkedAt: string
  rfqId: string
  offerNumber: string
  status: QuoteReleaseGateStatus
  blockerCount: number
  warningCount: number
  issues: QuoteReleaseGateIssue[]
  checks: QuoteReleaseGateCheck[]
  nextActions: string[]
}

interface CheckedAtValidation {
  checkedAt: string
  issues: QuoteReleaseGateIssue[]
}

export function evaluateQuoteReleaseGate(input: QuoteReleaseGateInput): QuoteReleaseGateDecision {
  const rfqId = nonBlank(input.rfqId, "rfqId")
  const offerNumber = nonBlank(input.offerNumber, "offerNumber")
  const checkedAtValidation = validateCheckedAt(input.checkedAt)
  const issues = [
    ...checkedAtValidation.issues,
    ...intakeIssues(input.intakeReadiness),
    ...approvalIssues(input.approval),
    ...sendReadinessIssues(input.offerSendReadiness),
    ...capacityIssues(input.capacityCommitment),
    ...materialIssues(input.materialCommitment),
    ...outsideServiceIssues(input.outsideServiceCommitments ?? []),
  ]
  const checks = buildChecks({
    approval: input.approval,
    capacityCommitment: input.capacityCommitment,
    checkedAt: checkedAtValidation.checkedAt,
    intakeReadiness: input.intakeReadiness,
    issues,
    materialCommitment: input.materialCommitment,
    offerSendReadiness: input.offerSendReadiness,
    outsideServiceCommitments: input.outsideServiceCommitments ?? [],
  })
  const blockerCount = issues.filter((issue) => issue.severity === "blocker").length
  const warningCount = issues.filter((issue) => issue.severity === "warning").length

  return {
    releaseGateVersion: QUOTE_RELEASE_GATE_VERSION,
    checkedAt: checkedAtValidation.checkedAt,
    rfqId,
    offerNumber,
    status: blockerCount > 0 ? "blocked" : warningCount > 0 ? "needs_review" : "ready",
    blockerCount,
    warningCount,
    issues,
    checks,
    nextActions: issues.map((issue) => issue.message),
  }
}

function validateCheckedAt(value: string): CheckedAtValidation {
  const trimmed = value.trim()
  if (!trimmed) {
    return {
      checkedAt: "",
      issues: [issue("invalid_checked_at", "blocker", "Release gate check time is required.")],
    }
  }

  try {
    return { checkedAt: normalizeIsoTimestamp(trimmed, "checkedAt"), issues: [] }
  } catch {
    return {
      checkedAt: trimmed,
      issues: [issue("invalid_checked_at", "blocker", "Release gate check time must be a valid ISO timestamp.")],
    }
  }
}

function intakeIssues(readiness: RfqIntakeReadinessResult): QuoteReleaseGateIssue[] {
  switch (readiness.status) {
    case "ready":
      return []
    case "blocked":
      return [
        issue(
          "intake_blocked",
          "blocker",
          `RFQ intake has ${readiness.blockerCount} blocker${readiness.blockerCount === 1 ? "" : "s"} before release.`,
        ),
      ]
    case "needs_review":
      return [
        issue(
          "intake_needs_review",
          "warning",
          `RFQ intake has ${readiness.warningCount} warning${readiness.warningCount === 1 ? "" : "s"} to review.`,
        ),
      ]
  }
}

function approvalIssues(approval: QuoteApprovalDecision): QuoteReleaseGateIssue[] {
  switch (approval.status) {
    case "approved":
      return []
    case "blocked":
      return [issue("approval_blocked", "blocker", "Quote approval policy is blocked.")]
    case "needs_review":
      return [issue("approval_needs_review", "warning", "Quote approval policy needs manager review.")]
  }
}

function sendReadinessIssues(readiness: OfferSendReadinessResult): QuoteReleaseGateIssue[] {
  switch (readiness.status) {
    case "ready":
      return []
    case "blocked":
      return [issue("send_readiness_blocked", "blocker", "Offer send readiness is blocked.")]
    case "needs_review":
      return [issue("send_readiness_needs_review", "warning", "Offer send readiness needs review.")]
  }
}

function capacityIssues(commitment: CapacityItemCommitment | undefined): QuoteReleaseGateIssue[] {
  if (!commitment) {
    return [issue("capacity_missing", "blocker", "Capacity commitment must be evaluated before offer release.")]
  }

  switch (commitment.status) {
    case "committed":
      return []
    case "late":
      return [
        issue(
          "capacity_late",
          "warning",
          `Capacity commitment completes ${commitment.latenessDays} day${commitment.latenessDays === 1 ? "" : "s"} after due date.`,
        ),
      ]
    case "unplanned":
      return [
        issue(
          "capacity_unplanned",
          "blocker",
          `${commitment.unplannedMinutes} capacity minutes are unplanned before offer release.`,
        ),
      ]
  }
}

function materialIssues(commitment: MaterialAvailabilityCommitment | undefined): QuoteReleaseGateIssue[] {
  if (!commitment) {
    return [issue("material_missing", "blocker", "Material availability must be evaluated before offer release.")]
  }

  switch (commitment.status) {
    case "covered":
      return []
    case "needs_purchase":
      return [
        issue(
          "material_needs_purchase",
          "warning",
          `${formatKg(commitment.purchaseKg)} kg of ${commitment.materialName} must be purchased before production.`,
        ),
      ]
    case "at_risk":
      return [issue("material_at_risk", "warning", materialIssueSummary(commitment))]
    case "blocked":
      return [issue("material_blocked", "blocker", materialIssueSummary(commitment))]
  }
}

function outsideServiceIssues(commitments: OutsideServiceCommitment[]): QuoteReleaseGateIssue[] {
  const blocked = commitments.filter((commitment) => commitment.risk === "blocked")
  if (blocked.length > 0) {
    return [
      issue(
        "outside_service_blocked",
        "blocker",
        `${blocked.length} outside service${blocked.length === 1 ? "" : "s"} blocked before offer release.`,
      ),
    ]
  }

  const atRisk = commitments.filter((commitment) => commitment.risk === "at_risk")
  if (atRisk.length > 0) {
    return [
      issue(
        "outside_service_at_risk",
        "warning",
        `${atRisk.length} outside service${atRisk.length === 1 ? "" : "s"} at risk before offer release.`,
      ),
    ]
  }

  const needsAction = commitments.filter((commitment) => commitment.risk === "needs_action")
  if (needsAction.length > 0) {
    return [
      issue(
        "outside_service_needs_action",
        "warning",
        `${needsAction.length} outside service${needsAction.length === 1 ? "" : "s"} need action before offer release.`,
      ),
    ]
  }

  return []
}

function buildChecks(input: {
  approval: QuoteApprovalDecision
  capacityCommitment?: CapacityItemCommitment
  checkedAt: string
  intakeReadiness: RfqIntakeReadinessResult
  issues: QuoteReleaseGateIssue[]
  materialCommitment?: MaterialAvailabilityCommitment
  offerSendReadiness: OfferSendReadinessResult
  outsideServiceCommitments: OutsideServiceCommitment[]
}): QuoteReleaseGateCheck[] {
  return [
    check("checked_at", "Gate timestamp", input.issues, ["invalid_checked_at"], `Checked ${input.checkedAt}.`),
    check("intake", "RFQ intake", input.issues, ["intake_"], `Intake ${input.intakeReadiness.status}.`),
    check("approval", "Quote approval", input.issues, ["approval_"], `Approval ${input.approval.status}.`),
    check("send_readiness", "Send readiness", input.issues, ["send_readiness_"], `Send readiness ${input.offerSendReadiness.status}.`),
    check("capacity", "Capacity", input.issues, ["capacity_"], capacityDetail(input.capacityCommitment)),
    check("material", "Material", input.issues, ["material_"], materialDetail(input.materialCommitment)),
    check("outside_services", "Outside services", input.issues, ["outside_service_"], outsideServiceDetail(input.outsideServiceCommitments)),
  ]
}

function check(
  key: QuoteReleaseGateCheckKey,
  label: string,
  issues: QuoteReleaseGateIssue[],
  codePrefixes: string[],
  passedDetail: string,
): QuoteReleaseGateCheck {
  const matchingIssues = issues.filter((candidate) => codePrefixes.some((prefix) => candidate.code.startsWith(prefix)))
  const blocker = matchingIssues.find((candidate) => candidate.severity === "blocker")
  const warning = matchingIssues.find((candidate) => candidate.severity === "warning")
  const matchedIssue = blocker ?? warning

  return {
    key,
    label,
    status: blocker ? "blocked" : warning ? "warning" : "passed",
    detail: matchedIssue?.message ?? nonBlank(passedDetail, `${key}.detail`),
  }
}

function capacityDetail(commitment: CapacityItemCommitment | undefined): string {
  if (!commitment) {
    return "No capacity commitment."
  }
  return `${commitment.requiredMinutes} min ${commitment.status}.`
}

function materialDetail(commitment: MaterialAvailabilityCommitment | undefined): string {
  if (!commitment) {
    return "No material commitment."
  }
  return `${commitment.materialName} ${commitment.status}.`
}

function outsideServiceDetail(commitments: OutsideServiceCommitment[]): string {
  if (commitments.length === 0) {
    return "No outside services required."
  }
  return `${commitments.length} outside service${commitments.length === 1 ? "" : "s"} evaluated.`
}

function materialIssueSummary(commitment: MaterialAvailabilityCommitment): string {
  return commitment.issues.map((candidate) => candidate.message).join(" ") || `${commitment.materialName} requires material review.`
}

function issue(
  code: QuoteReleaseGateIssueCode,
  severity: QuoteReleaseGateIssueSeverity,
  message: string,
): QuoteReleaseGateIssue {
  return { code, severity, message }
}

function formatKg(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
