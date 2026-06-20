import type { ParsedRfqIntake, RfqExtractedField } from "./intake"
import { normalizeIsoTimestamp } from "../shared/deterministic"

export type RfqIntakeReadinessStatus = "ready" | "needs_review" | "blocked"
export type RfqIntakeReadinessCheckStatus = "passed" | "warning" | "blocked"
export type RfqIntakeReadinessIssueSeverity = "warning" | "blocker"

export interface RfqIntakeReadinessIssue {
  key: string
  severity: RfqIntakeReadinessIssueSeverity
  detail: string
  partNumber?: string
}

export interface RfqIntakeReadinessCheck {
  key: string
  label: string
  status: RfqIntakeReadinessCheckStatus
  detail: string
}

export interface RfqIntakeReadinessResult {
  status: RfqIntakeReadinessStatus
  blockerCount: number
  warningCount: number
  partCount: number
  checks: RfqIntakeReadinessCheck[]
  issues: RfqIntakeReadinessIssue[]
}

export interface EvaluateRfqIntakeReadinessOptions {
  minimumCoreFieldConfidence?: number
  nowDate?: string
}

const defaultMinimumCoreFieldConfidence = 0.75
const coreConfidenceFieldKeys = new Set(["part_number", "process", "material", "quantity", "dimensions_mm", "tolerance"])

export function evaluateRfqIntakeReadiness(
  parsed: ParsedRfqIntake,
  options: EvaluateRfqIntakeReadinessOptions = {},
): RfqIntakeReadinessResult {
  const minimumConfidence = options.minimumCoreFieldConfidence ?? defaultMinimumCoreFieldConfidence
  const issues: RfqIntakeReadinessIssue[] = [
    ...contactIssues(parsed),
    ...scheduleIssues(parsed, options.nowDate),
    ...partIssues(parsed),
    ...engineeringPackageIssues(parsed),
    ...confidenceIssues(parsed.extractedFields, minimumConfidence),
  ]
  const checks: RfqIntakeReadinessCheck[] = [
    check("contact", "Contact", issues, ["contact_email_missing", "customer_name_missing"], "Buyer contact is ready."),
    check("schedule", "Schedule", issues, ["due_date_missing", "due_date_past"], "Quote timing is ready."),
    check(
      "part_fields",
      "Part fields",
      issues,
      ["part_missing", "part_number_missing", "process_missing", "material_missing", "quantity_missing"],
      "Part identity, process, material, and quantity are ready.",
    ),
    check("engineering_package", "Engineering package", issues, ["engineering_package_missing"], "CAD or drawing package is attached."),
    check("confidence", "Extraction confidence", issues, ["low_confidence"], "Core extraction confidence is acceptable."),
  ]
  const blockerCount = issues.filter((issue) => issue.severity === "blocker").length
  const warningCount = issues.filter((issue) => issue.severity === "warning").length

  return {
    status: blockerCount > 0 ? "blocked" : warningCount > 0 ? "needs_review" : "ready",
    blockerCount,
    warningCount,
    partCount: parsed.parts.length,
    checks,
    issues: issues.map((issue) => ({ ...issue })),
  }
}

function contactIssues(parsed: ParsedRfqIntake): RfqIntakeReadinessIssue[] {
  const issues: RfqIntakeReadinessIssue[] = []

  if (!parsed.contactEmail) {
    issues.push({
      key: "contact_email_missing",
      severity: "blocker",
      detail: "Contact email is required before automated quoting.",
    })
  }

  if (!parsed.customerName) {
    issues.push({
      key: "customer_name_missing",
      severity: "warning",
      detail: "Customer name is missing and should be confirmed before handoff.",
    })
  }

  return issues
}

function scheduleIssues(parsed: ParsedRfqIntake, nowDate?: string): RfqIntakeReadinessIssue[] {
  if (parsed.dueAt === undefined) {
    return [
      {
        key: "due_date_missing",
        severity: "warning",
        detail: "Buyer due date is missing.",
      },
    ]
  }

  if (nowDate && parsed.dueAt < parseUtcDayStart(nowDate)) {
    return [
      {
        key: "due_date_past",
        severity: "warning",
        detail: "Buyer due date is already in the past.",
      },
    ]
  }

  return []
}

function partIssues(parsed: ParsedRfqIntake): RfqIntakeReadinessIssue[] {
  if (parsed.parts.length === 0) {
    return [
      {
        key: "part_missing",
        severity: "blocker",
        detail: "At least one part is required before costing.",
      },
    ]
  }

  return parsed.parts.flatMap((part) => {
    const partNumber = part.partNumber || "Unknown part"
    const issues: RfqIntakeReadinessIssue[] = []

    if (!part.partNumber) {
      issues.push({
        key: "part_number_missing",
        partNumber,
        severity: "blocker",
        detail: "Part number is required before costing.",
      })
    }

    if (!part.process) {
      issues.push({
        key: "process_missing",
        partNumber,
        severity: "blocker",
        detail: "Manufacturing process is required before costing.",
      })
    }

    if (!part.materialText) {
      issues.push({
        key: "material_missing",
        partNumber,
        severity: "blocker",
        detail: "Material is required before costing.",
      })
    }

    if (!part.quantity) {
      issues.push({
        key: "quantity_missing",
        partNumber,
        severity: "blocker",
        detail: "Quantity is required before costing.",
      })
    }

    return issues
  })
}

function engineeringPackageIssues(parsed: ParsedRfqIntake): RfqIntakeReadinessIssue[] {
  const hasEngineeringAttachment = parsed.attachments.some((attachment) => attachment.kind === "cad" || attachment.kind === "drawing")
  if (hasEngineeringAttachment) {
    return []
  }

  return [
    {
      key: "engineering_package_missing",
      severity: "warning",
      detail: "No CAD model or drawing is attached.",
    },
  ]
}

function confidenceIssues(fields: RfqExtractedField[], minimumConfidence: number): RfqIntakeReadinessIssue[] {
  return fields
    .filter((field) => coreConfidenceFieldKeys.has(field.key) && field.confidence < minimumConfidence)
    .map((field) => ({
      key: `low_confidence_${field.key}`,
      severity: "warning" as const,
      detail: `${field.key.replace(/_/g, " ")} confidence ${formatConfidence(field.confidence)} is below ${formatConfidence(
        minimumConfidence,
      )}.`,
    }))
}

function check(
  key: string,
  label: string,
  issues: RfqIntakeReadinessIssue[],
  issueKeyPrefixes: string[],
  passedDetail: string,
): RfqIntakeReadinessCheck {
  const matchingIssues = issues.filter((issue) => issueKeyPrefixes.some((prefix) => issue.key.startsWith(prefix)))
  const blocker = matchingIssues.find((issue) => issue.severity === "blocker")
  const warning = matchingIssues.find((issue) => issue.severity === "warning")

  if (blocker) {
    return { key, label, status: "blocked", detail: blocker.detail }
  }

  if (warning) {
    return { key, label, status: "warning", detail: warning.detail }
  }

  return { key, label, status: "passed", detail: passedDetail }
}

function parseUtcDayStart(value: string): number {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (dateOnly) {
    const year = Number(dateOnly[1])
    const month = Number(dateOnly[2])
    const day = Number(dateOnly[3])
    const timestamp = Date.UTC(year, month - 1, day)
    const check = new Date(timestamp)
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
      throw new Error("nowDate must be a valid ISO date or timestamp")
    }

    return timestamp
  }

  const timestamp = parseIsoTimestamp(value)
  const date = new Date(timestamp)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function parseIsoTimestamp(value: string): number {
  try {
    return Date.parse(normalizeIsoTimestamp(value, "nowDate"))
  } catch {
    throw new Error("nowDate must be a valid ISO date or timestamp")
  }
}

function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`
}
