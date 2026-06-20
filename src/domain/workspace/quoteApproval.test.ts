import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture, rushTurnedSpacerFixture } from "../quoting/cnc.fixtures"
import type { QuoteEngineResult } from "../quoting/registry"
import type { CapacityItemCommitment } from "./capacityCommitment"
import { evaluateQuoteApproval } from "./quoteApproval"

describe("quote approval policy", () => {
  it("approves a clean quote with margin, customer, and capacity inside policy", () => {
    const quote = calculateCncQuote(aluminumBracketFixture)
    const decision = evaluateQuoteApproval({
      capacityCommitment: capacityCommitment({ itemId: "rfq-204" }),
      customer: {
        creditLimitCents: 500_000,
        customerName: "North Forge",
        openBalanceCents: 100_000,
        paymentTerm: "standard",
      },
      quote,
      reviewedAt: "2026-06-20",
    })

    expect(decision).toMatchObject({
      currency: "EUR",
      customerName: "North Forge",
      marginPercent: 28,
      partNumber: "FB-CNC-204-A",
      policyVersion: "quote-approval-policy.v1",
      reviewedAt: "2026-06-20",
      status: "approved",
    })
    expect(decision.issues).toEqual([])
    expect(decision.checks.every((check) => check.status === "passed")).toBe(true)
  })

  it("requires manager review for thin margin, high value, terms, lead time, calculator, credit, and late capacity warnings", () => {
    const quote = quoteWithReorderedBreakdown(calculateCncQuote(rushTurnedSpacerFixture))
    const decision = evaluateQuoteApproval({
      capacityCommitment: capacityCommitment({ itemId: "rfq-019", latenessDays: 2, status: "late" }),
      customer: {
        creditLimitCents: 60_000,
        customerName: "Baltic Hydraulics",
        openBalanceCents: 20_000,
        paymentTerm: "prepay_required",
      },
      quote,
      reviewedAt: "2026-06-20",
      thresholds: {
        managerApprovalCents: 40_000,
        maxLeadTimeDays: 2,
        reviewMarginPercent: 30,
      },
    })

    expect(decision.status).toBe("needs_review")
    expect(decision.marginPercent).toBe(25)
    expect(decision.issues.map((issue) => [issue.code, issue.severity])).toEqual([
      ["thin_margin", "warning"],
      ["high_value", "warning"],
      ["long_lead_time", "warning"],
      ["calculator_warnings", "warning"],
      ["capacity_late", "warning"],
      ["prepayment_required", "warning"],
      ["customer_credit_limit", "warning"],
    ])
    expect(decision.checks.find((check) => check.key === "capacity_late")).toMatchObject({
      status: "warning",
    })
  })

  it("blocks quotes below the margin floor, on credit hold, with unplanned capacity, or dirty calculators when required", () => {
    const quote = quoteWithMargin(calculateCncQuote(aluminumBracketFixture), 100, ["Manual calculator warning."])
    const decision = evaluateQuoteApproval({
      capacityCommitment: capacityCommitment({ itemId: "rfq-204", status: "unplanned", unplannedMinutes: 90 }),
      customer: {
        customerName: "North Forge",
        paymentTerm: "credit_hold",
      },
      quote,
      reviewedAt: "2026-06-20",
      thresholds: {
        requireCleanCalculator: true,
      },
    })

    expect(decision.status).toBe("blocked")
    expect(decision.issues.map((issue) => [issue.code, issue.severity])).toEqual([
      ["low_margin", "blocker"],
      ["calculator_warnings", "blocker"],
      ["capacity_unplanned", "blocker"],
      ["customer_credit_hold", "blocker"],
    ])
    expect(decision.checks.find((check) => check.key === "low_margin")).toMatchObject({
      status: "blocked",
    })
  })

  it("keeps invalid review dates as blocking issues without throwing", () => {
    const decision = evaluateQuoteApproval({
      capacityCommitment: capacityCommitment({ itemId: "rfq-204" }),
      customer: { customerName: "North Forge" },
      quote: calculateCncQuote(aluminumBracketFixture),
      reviewedAt: "2026-02-31",
    })

    expect(decision.status).toBe("blocked")
    expect(decision.issues).toContainEqual({
      code: "invalid_review_date",
      message: "reviewedAt must be a valid ISO date.",
      severity: "blocker",
    })
  })

  it("rejects invalid policy inputs", () => {
    const quote = calculateCncQuote(aluminumBracketFixture)

    expect(() =>
      evaluateQuoteApproval({
        customer: { customerName: "" },
        quote,
        reviewedAt: "2026-06-20",
      }),
    ).toThrow("customer.customerName is required")

    expect(() =>
      evaluateQuoteApproval({
        customer: { customerName: "North Forge" },
        quote,
        reviewedAt: "2026-06-20",
        thresholds: { minimumMarginPercent: 30, reviewMarginPercent: 20 },
      }),
    ).toThrow("thresholds.reviewMarginPercent must be greater than or equal to thresholds.minimumMarginPercent")

    expect(() =>
      evaluateQuoteApproval({
        customer: { creditLimitCents: -1, customerName: "North Forge" },
        quote,
        reviewedAt: "2026-06-20",
      }),
    ).toThrow("customer.creditLimitCents must be a non-negative integer cent amount")
  })
})

function capacityCommitment(overrides: Partial<CapacityItemCommitment>): CapacityItemCommitment {
  return {
    allocatedMinutes: 180,
    allocations: [{ date: "2026-06-20", minutes: 180 }],
    completionDate: "2026-06-20",
    dueDate: "2026-06-22",
    itemId: "rfq-204",
    latenessDays: 0,
    process: "cnc_milling",
    requiredMinutes: 180,
    startDate: "2026-06-20",
    status: "committed",
    unplannedMinutes: 0,
    ...overrides,
  }
}

function quoteWithMargin(quote: QuoteEngineResult, marginCents: number, warnings: string[]): QuoteEngineResult {
  const breakdown = quote.breakdown.map((line) => (line.key === "margin" ? { ...line, amountCents: marginCents } : { ...line }))
  const previousMarginCents = quote.breakdown.find((line) => line.key === "margin")?.amountCents ?? 0
  const totalCents = quote.totalCents + marginCents - previousMarginCents
  return {
    ...quote,
    breakdown,
    totalCents,
    unitPriceCents: Math.floor(totalCents / quote.quantity),
    unitRemainderCents: totalCents % quote.quantity,
    warnings,
  }
}

function quoteWithReorderedBreakdown(quote: QuoteEngineResult): QuoteEngineResult {
  return {
    ...quote,
    breakdown: [...quote.breakdown].reverse(),
  }
}
