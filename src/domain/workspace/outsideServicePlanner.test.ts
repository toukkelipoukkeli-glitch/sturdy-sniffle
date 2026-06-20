import { describe, expect, it } from "vitest"

import {
  buildOutsideServicePlan,
  type OutsideServiceSupplierRule,
  type OutsideServiceWorkItem,
} from "./outsideServicePlanner"

const supplierRules: OutsideServiceSupplierRule[] = [
  {
    bufferDays: 1,
    leadTimeDays: 3,
    match: "passivation",
    supplierName: "Nordic Surface Works",
  },
  {
    bufferDays: 2,
    leadTimeDays: 5,
    match: "anodizing",
    minimumCostCents: 9000,
    supplierName: "Arctic Anodize",
  },
]

const items: OutsideServiceWorkItem[] = [
  {
    customerName: "Baltic Hydraulics",
    dueAt: "2026-06-24T09:00:00+03:00",
    estimatedValueCents: 50000,
    id: "rfq-019",
    outsideServices: [{ amountCents: 4500, label: "Passivation", status: "not_requested" }],
    priority: "rush",
    process: "cnc_turning",
    receivedAt: "2026-06-19T15:44:00+03:00",
    status: "triage",
    subject: "Turned spacer FB-TURN-019",
  },
  {
    customerName: "North Forge",
    dueAt: "2026-07-03T15:00:00+03:00",
    estimatedValueCents: 215814,
    id: "rfq-204",
    outsideServices: [{ amountCents: 6500, label: "Black anodizing", status: "quoted" }],
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-20T08:30:00+03:00",
    status: "estimating",
    subject: "CNC bracket FB-204-A",
  },
  {
    customerName: "Arctic Instruments",
    dueAt: "2026-07-06T14:00:00+03:00",
    estimatedValueCents: 97036,
    id: "rfq-772",
    outsideServices: [
      {
        amountCents: 12000,
        label: "Heat treatment",
        leadTimeDays: 4,
        status: "ordered",
        supplierName: "HeatPro Tampere",
      },
    ],
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-18T10:00:00+03:00",
    status: "ready",
    subject: "Prototype sensor housing",
  },
]

describe("outside service planner", () => {
  it("builds supplier commitments with lead-time risk and minimum supplier pricing", () => {
    const plan = buildOutsideServicePlan({
      items,
      now: "2026-06-20T12:00:00+03:00",
      supplierRules,
    })

    expect(plan).toMatchObject({
      atRiskCount: 1,
      blockedCount: 0,
      coveredCount: 1,
      generatedAt: "2026-06-20T09:00:00.000Z",
      itemCount: 3,
      needsActionCount: 1,
      outsideServicePlanVersion: "outside-service-plan.v1",
      serviceCount: 3,
      status: "at_risk",
      totalCostCents: 25500,
    })
    expect(plan.commitments.map((commitment) => [commitment.itemId, commitment.label, commitment.risk, commitment.supplierName])).toEqual([
      ["rfq-019", "Passivation", "at_risk", "Nordic Surface Works"],
      ["rfq-204", "Black anodizing", "needs_action", "Arctic Anodize"],
      ["rfq-772", "Heat treatment", "covered", "HeatPro Tampere"],
    ])
    expect(plan.commitments[0]).toMatchObject({
      amountCents: 4500,
      bufferDays: 1,
      daysUntilRequestBy: 0,
      issues: [{ code: "request_due_soon", message: "Supplier order is due by 2026-06-20." }],
      leadTimeDays: 3,
      requestBy: "2026-06-20",
      requiredBy: "2026-06-23",
      serviceKey: "rfq-019:passivation:1",
    })
    expect(plan.commitments[1]).toMatchObject({
      amountCents: 9000,
      issues: [{ code: "not_ordered", message: "Outside service is not ordered yet." }],
      requestBy: "2026-06-26",
      requiredBy: "2026-07-01",
    })
  })

  it("blocks services without an explicit or rule-matched supplier", () => {
    const plan = buildOutsideServicePlan({
      items: [
        {
          ...items[0],
          outsideServices: [{ amountCents: 7000, label: "Laser marking", status: "quoted" }],
        },
      ],
      now: "2026-06-20T12:00:00+03:00",
      supplierRules,
    })

    expect(plan.status).toBe("blocked")
    expect(plan.blockedCount).toBe(1)
    expect(plan.commitments[0]).toMatchObject({
      issues: [{ code: "missing_supplier", message: "No approved supplier is matched to this outside service." }],
      risk: "blocked",
      supplierName: undefined,
    })
  })

  it("excludes sent and closed RFQs before validating stale service data", () => {
    const plan = buildOutsideServicePlan({
      items: [
        { ...items[0], outsideServices: [{ amountCents: 0, label: "", status: "not_requested" }], status: "sent" },
        { ...items[1], outsideServices: [{ amountCents: -50, label: "", status: "quoted" }], status: "won" },
      ],
      now: "2026-06-20T12:00:00+03:00",
      supplierRules,
    })

    expect(plan.status).toBe("covered")
    expect(plan.commitments).toEqual([])
    expect(plan.serviceCount).toBe(0)
    expect(plan.totalCostCents).toBe(0)
  })

  it("rejects invalid active planner inputs", () => {
    expect(() =>
      buildOutsideServicePlan({
        items,
        now: "June 20 2026",
        supplierRules,
      }),
    ).toThrow("now must be a valid ISO timestamp")

    expect(() =>
      buildOutsideServicePlan({
        items: [{ ...items[0], outsideServices: [{ amountCents: -50, label: "Black anodizing" }] }],
        now: "2026-06-20T12:00:00+03:00",
        supplierRules,
      }),
    ).toThrow("outsideService.amountCents must be a positive integer cent amount")

    expect(() =>
      buildOutsideServicePlan({
        items,
        now: "2026-06-20T12:00:00+03:00",
        supplierRules: [{ leadTimeDays: 0, match: "passivation", supplierName: "Nordic Surface Works" }],
      }),
    ).toThrow("supplierRule.leadTimeDays must be a positive integer")
  })
})
