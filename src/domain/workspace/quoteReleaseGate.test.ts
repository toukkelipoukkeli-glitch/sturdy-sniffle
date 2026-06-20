import { describe, expect, it } from "vitest"

import { OFFER_SEND_READINESS_VERSION, type OfferSendReadinessResult } from "../offers/offerSendReadiness"
import type { RfqIntakeReadinessResult } from "../rfq/intakeReadiness"
import type { CapacityItemCommitment } from "./capacityCommitment"
import type { MaterialAvailabilityCommitment } from "./materialAvailability"
import type { OutsideServiceCommitment } from "./outsideServicePlanner"
import { QUOTE_APPROVAL_POLICY_VERSION, type QuoteApprovalDecision } from "./quoteApproval"
import { evaluateQuoteReleaseGate } from "./quoteReleaseGate"

describe("quote release gate", () => {
  it("releases a quote when all operational gates pass", () => {
    const decision = evaluateQuoteReleaseGate(baseReleaseGateInput())

    expect(decision).toMatchObject({
      releaseGateVersion: "quote-release-gate.v1",
      checkedAt: "2026-06-20T06:00:00.000Z",
      rfqId: "rfq-204",
      offerNumber: "OFFER-204",
      status: "ready",
      blockerCount: 0,
      warningCount: 0,
      issues: [],
      nextActions: [],
    })
    expect(decision.checks.map((check) => [check.key, check.status])).toEqual([
      ["checked_at", "passed"],
      ["intake", "passed"],
      ["approval", "passed"],
      ["send_readiness", "passed"],
      ["capacity", "passed"],
      ["material", "passed"],
      ["outside_services", "passed"],
    ])
  })

  it("requires release review when operational gates have warnings", () => {
    const decision = evaluateQuoteReleaseGate(
      baseReleaseGateInput({
        approval: approvalDecision({ status: "needs_review" }),
        capacityCommitment: capacityCommitment({ latenessDays: 2, status: "late" }),
        intakeReadiness: intakeReadiness({ status: "needs_review", warningCount: 2 }),
        materialCommitment: materialCommitment({
          materialName: "Stainless steel 316L",
          purchaseKg: 3,
          status: "needs_purchase",
        }),
        offerSendReadiness: offerSendReadiness({ status: "needs_review" }),
        outsideServiceCommitments: [outsideServiceCommitment({ risk: "at_risk" })],
      }),
    )

    expect(decision.status).toBe("needs_review")
    expect(decision.blockerCount).toBe(0)
    expect(decision.warningCount).toBe(6)
    expect(decision.issues.map((issue) => [issue.code, issue.severity])).toEqual([
      ["intake_needs_review", "warning"],
      ["approval_needs_review", "warning"],
      ["send_readiness_needs_review", "warning"],
      ["capacity_late", "warning"],
      ["material_needs_purchase", "warning"],
      ["outside_service_at_risk", "warning"],
    ])
    expect(decision.checks.find((check) => check.key === "material")).toMatchObject({
      detail: "3 kg of Stainless steel 316L must be purchased before production.",
      status: "warning",
    })
    expect(decision.nextActions).toContain("Quote approval policy needs manager review.")
  })

  it("blocks release when mandatory gates are blocked or missing", () => {
    const decision = evaluateQuoteReleaseGate(
      baseReleaseGateInput({
        approval: approvalDecision({ status: "blocked" }),
        capacityCommitment: undefined,
        intakeReadiness: intakeReadiness({ blockerCount: 1, status: "blocked" }),
        materialCommitment: materialCommitment({
          issues: [{ code: "certificate_expired", message: "Allocated material has an expired certificate." }],
          status: "blocked",
        }),
        offerSendReadiness: offerSendReadiness({ status: "blocked" }),
        outsideServiceCommitments: [outsideServiceCommitment({ risk: "blocked" })],
      }),
    )

    expect(decision.status).toBe("blocked")
    expect(decision.blockerCount).toBe(6)
    expect(decision.warningCount).toBe(0)
    expect(decision.issues.map((issue) => issue.code)).toEqual([
      "intake_blocked",
      "approval_blocked",
      "send_readiness_blocked",
      "capacity_missing",
      "material_blocked",
      "outside_service_blocked",
    ])
    expect(decision.checks.find((check) => check.key === "capacity")).toMatchObject({
      detail: "Capacity commitment must be evaluated before offer release.",
      status: "blocked",
    })
  })

  it("blocks invalid gate timestamps without throwing", () => {
    const decision = evaluateQuoteReleaseGate(baseReleaseGateInput({ checkedAt: "2026-02-31T09:00:00Z" }))

    expect(decision.status).toBe("blocked")
    expect(decision.checkedAt).toBe("2026-02-31T09:00:00Z")
    expect(decision.issues).toContainEqual({
      code: "invalid_checked_at",
      severity: "blocker",
      message: "Release gate check time must be a valid ISO timestamp.",
    })
    expect(decision.checks.find((check) => check.key === "checked_at")).toMatchObject({
      status: "blocked",
    })
  })

  it("rejects blank release identifiers", () => {
    expect(() => evaluateQuoteReleaseGate(baseReleaseGateInput({ rfqId: " " }))).toThrow("rfqId is required")
    expect(() => evaluateQuoteReleaseGate(baseReleaseGateInput({ offerNumber: " " }))).toThrow("offerNumber is required")
  })
})

function baseReleaseGateInput(overrides: Partial<Parameters<typeof evaluateQuoteReleaseGate>[0]> = {}) {
  return {
    approval: approvalDecision(),
    capacityCommitment: capacityCommitment(),
    checkedAt: "2026-06-20T09:00:00+03:00",
    intakeReadiness: intakeReadiness(),
    materialCommitment: materialCommitment(),
    offerNumber: "OFFER-204",
    offerSendReadiness: offerSendReadiness(),
    outsideServiceCommitments: [],
    rfqId: "rfq-204",
    ...overrides,
  }
}

function intakeReadiness(overrides: Partial<RfqIntakeReadinessResult> = {}): RfqIntakeReadinessResult {
  return {
    blockerCount: 0,
    checks: [],
    issues: [],
    partCount: 1,
    status: "ready",
    warningCount: 0,
    ...overrides,
  }
}

function approvalDecision(overrides: Partial<QuoteApprovalDecision> = {}): QuoteApprovalDecision {
  return {
    checks: [],
    currency: "EUR",
    customerName: "North Forge",
    issues: [],
    marginPercent: 28,
    partNumber: "FB-204-A",
    policyVersion: QUOTE_APPROVAL_POLICY_VERSION,
    reviewedAt: "2026-06-20",
    status: "approved",
    totalCents: 115_418,
    ...overrides,
  }
}

function offerSendReadiness(overrides: Partial<OfferSendReadinessResult> = {}): OfferSendReadinessResult {
  return {
    checkedAt: "2026-06-20",
    checks: [],
    issues: [],
    offerNumber: "OFFER-204",
    readinessVersion: OFFER_SEND_READINESS_VERSION,
    status: "ready",
    ...overrides,
  }
}

function capacityCommitment(overrides: Partial<CapacityItemCommitment> = {}): CapacityItemCommitment {
  return {
    allocatedMinutes: 180,
    allocations: [{ date: "2026-06-20", minutes: 180 }],
    completionDate: "2026-06-20",
    dueDate: "2026-06-24",
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

function materialCommitment(overrides: Partial<MaterialAvailabilityCommitment> = {}): MaterialAvailabilityCommitment {
  return {
    allocatedKg: 7.258,
    allocations: [
      {
        allocatedKg: 7.258,
        certificateStatus: "ready",
        lotId: "lot-al-6082",
        materialName: "Aluminum 6082",
      },
    ],
    customerName: "North Forge",
    dueDate: "2026-06-30",
    issues: [],
    itemId: "rfq-204",
    materialName: "Aluminum 6082",
    purchaseKg: 0,
    requiredKg: 7.258,
    status: "covered",
    subject: "CNC bracket FB-204-A",
    ...overrides,
  }
}

function outsideServiceCommitment(overrides: Partial<OutsideServiceCommitment> = {}): OutsideServiceCommitment {
  return {
    amountCents: 4_500,
    bufferDays: 1,
    customerName: "Baltic Hydraulics",
    daysUntilRequestBy: 0,
    issues: [],
    itemId: "rfq-019",
    label: "Passivation",
    leadTimeDays: 3,
    requestBy: "2026-06-20",
    requiredBy: "2026-06-23",
    risk: "covered",
    serviceKey: "rfq-019:passivation:1",
    status: "ordered",
    subject: "Turned spacer FB-TURN-019",
    supplierName: "Nordic Surface Works",
    ...overrides,
  }
}
