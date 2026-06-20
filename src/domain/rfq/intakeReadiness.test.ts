import { describe, expect, it } from "vitest"

import { cncBracketEmail } from "./intake.fixtures"
import { parseRfqIntake, type ParsedRfqIntake } from "./intake"
import { evaluateRfqIntakeReadiness } from "./intakeReadiness"

describe("evaluateRfqIntakeReadiness", () => {
  it("marks a complete CNC RFQ as ready for automated costing", () => {
    const readiness = evaluateRfqIntakeReadiness(parseRfqIntake(cncBracketEmail), { nowDate: "2026-06-20" })

    expect(readiness).toMatchObject({
      blockerCount: 0,
      partCount: 1,
      status: "ready",
      warningCount: 0,
    })
    expect(readiness.checks.map((check) => [check.key, check.status])).toEqual([
      ["contact", "passed"],
      ["schedule", "passed"],
      ["part_fields", "passed"],
      ["engineering_package", "passed"],
      ["confidence", "passed"],
    ])
  })

  it("blocks RFQs that cannot be costed without operator input", () => {
    const parsed = parseRfqIntake({
      subject: "RFQ: mystery part",
      bodyText: "Please quote part: MYSTERY-1 as soon as possible.",
      receivedAt: "2026-06-20T08:00:00.000Z",
      senderEmail: "buyer@gmail.com",
      source: { provider: "gmail" },
    })
    const readiness = evaluateRfqIntakeReadiness(parsed, { nowDate: "2026-06-20" })

    expect(readiness.status).toBe("blocked")
    expect(readiness.blockerCount).toBe(3)
    expect(readiness.warningCount).toBe(3)
    expect(readiness.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "process_missing", partNumber: "MYSTERY-1", severity: "blocker" }),
        expect.objectContaining({ key: "material_missing", partNumber: "MYSTERY-1", severity: "blocker" }),
        expect.objectContaining({ key: "quantity_missing", partNumber: "MYSTERY-1", severity: "blocker" }),
        expect.objectContaining({ key: "customer_name_missing", severity: "warning" }),
        expect.objectContaining({ key: "due_date_missing", severity: "warning" }),
        expect.objectContaining({ key: "engineering_package_missing", severity: "warning" }),
      ]),
    )
    expect(readiness.checks.find((check) => check.key === "part_fields")).toMatchObject({ status: "blocked" })
  })

  it("keeps review-only issues separate from blockers", () => {
    const parsed = parseRfqIntake({
      subject: "RFQ: simple bracket",
      bodyText: "Please quote part: SIMPLE-1. CNC milling, aluminum 6082, qty 12 pcs.",
      receivedAt: "2026-06-20T08:00:00.000Z",
      senderEmail: "buyer@smallshop.example",
      senderName: "Small Shop",
      source: { provider: "manual" },
    })
    const readiness = evaluateRfqIntakeReadiness(parsed, { nowDate: "2026-06-20" })

    expect(readiness.status).toBe("needs_review")
    expect(readiness.blockerCount).toBe(0)
    expect(readiness.issues.map((issue) => issue.key)).toEqual(["due_date_missing", "engineering_package_missing"])
    expect(readiness.checks.find((check) => check.key === "schedule")).toMatchObject({ status: "warning" })
  })

  it("warns when core extraction confidence drops below the configured threshold", () => {
    const parsed = withFieldConfidence(parseRfqIntake(cncBracketEmail), "process", 0.62)
    const readiness = evaluateRfqIntakeReadiness(parsed, { minimumCoreFieldConfidence: 0.7, nowDate: "2026-06-20" })

    expect(readiness.status).toBe("needs_review")
    expect(readiness.issues).toContainEqual(
      expect.objectContaining({
        detail: "process confidence 62% is below 70%.",
        key: "low_confidence_process",
        severity: "warning",
      }),
    )
    expect(readiness.checks.find((check) => check.key === "confidence")).toMatchObject({ status: "warning" })
  })

  it("warns when the buyer due date is already past", () => {
    const readiness = evaluateRfqIntakeReadiness(parseRfqIntake(cncBracketEmail), { nowDate: "2026-07-01" })

    expect(readiness.status).toBe("needs_review")
    expect(readiness.issues).toContainEqual(expect.objectContaining({ key: "due_date_past", severity: "warning" }))
  })

  it("rejects invalid readiness clock input", () => {
    expect(() => evaluateRfqIntakeReadiness(parseRfqIntake(cncBracketEmail), { nowDate: "not-a-date" })).toThrow(
      "nowDate must be a valid ISO date or timestamp",
    )
    expect(() => evaluateRfqIntakeReadiness(parseRfqIntake(cncBracketEmail), { nowDate: "2026-02-31" })).toThrow(
      "nowDate must be a valid ISO date or timestamp",
    )
  })

  it("returns defensive issue arrays", () => {
    const readiness = evaluateRfqIntakeReadiness(parseRfqIntake(cncBracketEmail), { nowDate: "2026-07-01" })
    readiness.issues.push({ detail: "mutated", key: "mutated", severity: "warning" })

    expect(evaluateRfqIntakeReadiness(parseRfqIntake(cncBracketEmail), { nowDate: "2026-07-01" }).issues).not.toContainEqual(
      expect.objectContaining({ key: "mutated" }),
    )
  })
})

function withFieldConfidence(parsed: ParsedRfqIntake, key: string, confidence: number): ParsedRfqIntake {
  return {
    ...parsed,
    extractedFields: parsed.extractedFields.map((field) => (field.key === key ? { ...field, confidence } : field)),
  }
}
