import { describe, expect, it } from "vitest"

import { buildCapacityCommitmentPlan, type CapacityQueueItem } from "./capacityCommitment"

const items: CapacityQueueItem[] = [
  {
    customerName: "North Forge",
    dueAt: "2026-06-22T15:00:00+03:00",
    estimatedValueCents: 200000,
    estimatedWorkMinutes: 180,
    id: "rfq-mill-a",
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-20T08:30:00+03:00",
    status: "estimating",
    subject: "CNC bracket A",
  },
  {
    customerName: "Arctic Instruments",
    dueAt: "2026-06-23T12:00:00+03:00",
    estimatedValueCents: 150000,
    estimatedWorkMinutes: 240,
    id: "rfq-mill-b",
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-20T09:30:00+03:00",
    status: "new",
    subject: "CNC housing B",
  },
  {
    customerName: "Baltic Hydraulics",
    dueAt: "2026-06-20T16:00:00+03:00",
    estimatedValueCents: 50000,
    estimatedWorkMinutes: 60,
    id: "rfq-turn-a",
    priority: "rush",
    process: "cnc_turning",
    receivedAt: "2026-06-19T15:44:00+03:00",
    status: "triage",
    subject: "Turned spacer",
  },
]

describe("capacity commitment plan", () => {
  it("allocates ranked open RFQs across process capacity", () => {
    const plan = buildCapacityCommitmentPlan({
      dailyCapacityMinutesByProcess: {
        cnc_milling: 240,
        cnc_turning: 120,
      },
      items,
      now: "2026-06-20T12:00:00+03:00",
      planningDays: 3,
    })

    expect(plan).toMatchObject({
      capacityVersion: "capacity-commitment.v1",
      generatedAt: "2026-06-20T09:00:00.000Z",
      planningEndDate: "2026-06-22",
      planningStartDate: "2026-06-20",
      status: "on_track",
      totalAvailableMinutes: 1080,
      totalDemandMinutes: 480,
      totalOverloadMinutes: 0,
    })
    expect(plan.processPlans.map((processPlan) => [processPlan.process, processPlan.status, processPlan.remainingCapacityMinutes])).toEqual([
      ["cnc_milling", "on_track", 300],
      ["cnc_turning", "on_track", 300],
    ])
    expect(plan.processPlans[0]?.commitments).toMatchObject([
      {
        allocatedMinutes: 240,
        allocations: [{ date: "2026-06-20", minutes: 240 }],
        completionDate: "2026-06-20",
        itemId: "rfq-mill-b",
        latenessDays: 0,
        status: "committed",
      },
      {
        allocatedMinutes: 180,
        allocations: [{ date: "2026-06-21", minutes: 180 }],
        completionDate: "2026-06-21",
        itemId: "rfq-mill-a",
        status: "committed",
      },
    ])
  })

  it("marks commitments late when capacity exists but due dates cannot be met", () => {
    const plan = buildCapacityCommitmentPlan({
      dailyCapacityMinutesByProcess: { cnc_milling: 120 },
      items: [
        {
          ...items[0],
          dueAt: "2026-06-20T10:00:00+03:00",
          estimatedWorkMinutes: 300,
          id: "rfq-late",
        },
      ],
      now: "2026-06-20T08:00:00+03:00",
      planningDays: 3,
    })

    expect(plan.status).toBe("at_risk")
    expect(plan.processPlans[0]).toMatchObject({
      lateItemCount: 1,
      overloadMinutes: 0,
      status: "at_risk",
      unplannedItemCount: 0,
    })
    expect(plan.processPlans[0]?.commitments[0]).toMatchObject({
      allocatedMinutes: 300,
      completionDate: "2026-06-22",
      latenessDays: 2,
      status: "late",
      unplannedMinutes: 0,
    })
  })

  it("marks work unplanned when the planning window is overbooked", () => {
    const plan = buildCapacityCommitmentPlan({
      dailyCapacityMinutesByProcess: { cnc_milling: 100 },
      items: [{ ...items[0], estimatedWorkMinutes: 500, id: "rfq-overbooked" }],
      now: "2026-06-20T08:00:00+03:00",
      planningDays: 2,
    })

    expect(plan.status).toBe("overbooked")
    expect(plan.totalOverloadMinutes).toBe(300)
    expect(plan.processPlans[0]).toMatchObject({
      availableMinutes: 200,
      demandMinutes: 500,
      overloadMinutes: 300,
      remainingCapacityMinutes: 0,
      status: "overbooked",
      unplannedItemCount: 1,
    })
    expect(plan.processPlans[0]?.commitments[0]).toMatchObject({
      allocatedMinutes: 200,
      completionDate: "2026-06-21",
      status: "unplanned",
      unplannedMinutes: 300,
    })
  })

  it("excludes sent and closed work from capacity demand", () => {
    const plan = buildCapacityCommitmentPlan({
      dailyCapacityMinutesByProcess: { cnc_milling: 100 },
      items: items.map((item, index) => ({
        ...item,
        estimatedWorkMinutes: index === 0 ? 0 : -1,
        status: item.id === "rfq-mill-a" ? "sent" : "won",
      })),
      now: "2026-06-20T08:00:00+03:00",
      planningDays: 2,
    })

    expect(plan.processPlans).toEqual([])
    expect(plan.totalAvailableMinutes).toBe(0)
    expect(plan.totalDemandMinutes).toBe(0)
    expect(plan.status).toBe("on_track")
  })

  it("rejects invalid capacity inputs", () => {
    expect(() =>
      buildCapacityCommitmentPlan({
        dailyCapacityMinutesByProcess: { cnc_milling: 100 },
        items,
        now: "06/20/2026 08:00:00",
        planningDays: 2,
      }),
    ).toThrow("now must be a valid ISO timestamp")

    expect(() =>
      buildCapacityCommitmentPlan({
        dailyCapacityMinutesByProcess: { cnc_milling: 100 },
        items,
        now: "2026-06-20T08:00:00+03:00",
        planningDays: 0,
      }),
    ).toThrow("planningDays must be a positive integer")

    expect(() =>
      buildCapacityCommitmentPlan({
        dailyCapacityMinutesByProcess: { cnc_milling: -1 },
        items,
        now: "2026-06-20T08:00:00+03:00",
        planningDays: 2,
      }),
    ).toThrow("cnc_milling capacity must be a non-negative integer")

    expect(() =>
      buildCapacityCommitmentPlan({
        dailyCapacityMinutesByProcess: { cnc_milling: 100 },
        items: [{ ...items[0], estimatedWorkMinutes: 0 }],
        now: "2026-06-20T08:00:00+03:00",
        planningDays: 2,
      }),
    ).toThrow("estimatedWorkMinutes must be a positive integer")
  })
})
