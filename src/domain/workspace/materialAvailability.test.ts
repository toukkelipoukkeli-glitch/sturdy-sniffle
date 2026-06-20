import { describe, expect, it } from "vitest"

import {
  buildMaterialAvailabilityPlan,
  type MaterialAvailabilityInput,
  type MaterialRequirementItem,
} from "./materialAvailability"

const items: MaterialRequirementItem[] = [
  {
    customerName: "North Forge",
    dueAt: "2026-06-30T15:00:00+03:00",
    id: "rfq-204",
    materialName: "Aluminum 6082",
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-20T08:30:00+03:00",
    requiredKg: 5.2,
    status: "estimating",
    subject: "CNC bracket FB-204-A",
  },
  {
    customerName: "Baltic Hydraulics",
    dueAt: "2026-06-24T09:00:00+03:00",
    id: "rfq-019",
    materialName: "Stainless steel 316L",
    priority: "rush",
    process: "cnc_turning",
    receivedAt: "2026-06-19T15:44:00+03:00",
    requiredKg: 2.4,
    status: "triage",
    subject: "Turned spacer FB-TURN-019",
  },
  {
    customerName: "Arctic Instruments",
    dueAt: "2026-07-02T12:00:00+03:00",
    id: "rfq-772",
    materialName: "Aluminum 6082",
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-20T10:00:00+03:00",
    requiredKg: 9,
    status: "ready",
    subject: "Prototype housing",
  },
]

const baseInput: MaterialAvailabilityInput = {
  inventoryLots: [
    {
      availableKg: 8,
      certificateStatus: "ready",
      id: "lot-al-1",
      location: "Rack A2",
      materialName: "Aluminum 6082",
      reservedKg: 1,
    },
    {
      availableKg: 10,
      certificateStatus: "missing",
      id: "lot-al-2",
      location: "Rack A3",
      materialName: "Aluminum 6082",
    },
    {
      availableKg: 1,
      certificateStatus: "ready",
      id: "lot-ss-1",
      materialName: "Stainless steel 316L",
    },
  ],
  items,
  now: "2026-06-20T12:00:00+03:00",
  supplierOptions: [
    {
      leadTimeDays: 5,
      match: "aluminum_6082",
      minimumOrderKg: 5,
      supplierName: "MetalHub Helsinki",
    },
    {
      leadTimeDays: 4,
      match: "stainless_steel_316l",
      minimumOrderKg: 3,
      supplierName: "Stainless Stock Oy",
    },
  ],
}

describe("material availability plan", () => {
  it("allocates inventory and highlights material purchase timing risk", () => {
    const plan = buildMaterialAvailabilityPlan(baseInput)

    expect(plan).toMatchObject({
      atRiskCount: 2,
      blockedCount: 0,
      coveredCount: 1,
      generatedAt: "2026-06-20T09:00:00.000Z",
      itemCount: 3,
      materialAvailabilityVersion: "material-availability.v1",
      materialCount: 2,
      needsPurchaseCount: 0,
      status: "at_risk",
      totalAllocatedKg: 15.2,
      totalPurchaseKg: 3,
      totalRequiredKg: 16.6,
    })
    expect(plan.commitments.map((commitment) => [commitment.itemId, commitment.status, commitment.purchaseKg, commitment.supplierName])).toEqual([
      ["rfq-019", "at_risk", 3, "Stainless Stock Oy"],
      ["rfq-772", "at_risk", 0, undefined],
      ["rfq-204", "covered", 0, undefined],
    ])
    expect(plan.commitments[0]).toMatchObject({
      allocatedKg: 1,
      issues: [{ code: "purchase_overdue", message: "Material purchase was due by 2026-06-19." }],
      purchaseKg: 3,
      requestBy: "2026-06-19",
    })
    expect(plan.commitments[1]).toMatchObject({
      allocatedKg: 9,
      issues: [{ code: "certificate_missing", message: "Allocated material is missing certificate paperwork." }],
    })
  })

  it("blocks material gaps without an approved supplier", () => {
    const plan = buildMaterialAvailabilityPlan({
      ...baseInput,
      inventoryLots: [],
      items: [{ ...items[0], requiredKg: 4 }],
      supplierOptions: [],
    })

    expect(plan.status).toBe("blocked")
    expect(plan.blockedCount).toBe(1)
    expect(plan.commitments[0]).toMatchObject({
      allocatedKg: 0,
      issues: [{ code: "missing_supplier", message: "No approved supplier is matched to the material purchase gap." }],
      purchaseKg: 4,
      supplierName: undefined,
    })
  })

  it("excludes sent and closed RFQs before validating stale material demand", () => {
    const plan = buildMaterialAvailabilityPlan({
      ...baseInput,
      items: [
        { ...items[0], requiredKg: 0, status: "sent" },
        { ...items[1], requiredKg: -1, status: "won" },
      ],
    })

    expect(plan.status).toBe("covered")
    expect(plan.commitments).toEqual([])
    expect(plan.totalRequiredKg).toBe(0)
  })

  it("rejects invalid active material inputs", () => {
    expect(() =>
      buildMaterialAvailabilityPlan({
        ...baseInput,
        now: "2026/06/20",
      }),
    ).toThrow("now must be a valid ISO timestamp")

    expect(() =>
      buildMaterialAvailabilityPlan({
        ...baseInput,
        items: [{ ...items[0], requiredKg: 0 }],
      }),
    ).toThrow("requiredKg must be a positive number")

    expect(() =>
      buildMaterialAvailabilityPlan({
        ...baseInput,
        inventoryLots: [{ ...baseInput.inventoryLots[0], reservedKg: -1 }],
      }),
    ).toThrow("inventoryLot.reservedKg must be a non-negative number")

    expect(() =>
      buildMaterialAvailabilityPlan({
        ...baseInput,
        supplierOptions: [{ leadTimeDays: 0, match: "aluminum", supplierName: "MetalHub Helsinki" }],
      }),
    ).toThrow("supplierOption.leadTimeDays must be a positive integer")
  })
})
