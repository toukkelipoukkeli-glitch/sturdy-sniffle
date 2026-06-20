import { describe, expect, it } from "vitest"

import type { QuoteQueueItem } from "./quoteQueue"
import { summarizeProcessWorkload } from "./processWorkload"

const items: QuoteQueueItem[] = [
  {
    customerName: "Arctic Instruments",
    dueAt: "2026-06-19T12:00:00+03:00",
    id: "rfq-overdue-mill",
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-17T10:12:00+03:00",
    status: "new",
    subject: "Prototype sensor housing",
  },
  {
    customerName: "North Forge",
    dueAt: "2026-06-24T15:00:00+03:00",
    estimatedValueCents: 200000,
    id: "rfq-estimate-mill",
    priority: "normal",
    process: "cnc_milling",
    receivedAt: "2026-06-20T08:30:00+03:00",
    status: "estimating",
    subject: "CNC bracket FB-204-A",
  },
  {
    customerName: "Baltic Hydraulics",
    dueAt: "2026-06-20T16:00:00+03:00",
    estimatedValueCents: 50000,
    id: "rfq-rush-turn",
    priority: "rush",
    process: "cnc_turning",
    receivedAt: "2026-06-19T15:44:00+03:00",
    status: "triage",
    subject: "Turned spacer FB-TURN-019",
  },
  {
    customerName: "Ruka Robotics",
    dueAt: "2026-06-22T12:00:00+03:00",
    estimatedValueCents: 90000,
    id: "rfq-ready-sheet",
    priority: "normal",
    process: "sheet_metal",
    receivedAt: "2026-06-20T09:00:00+03:00",
    status: "ready",
    subject: "Laser-cut mounting plate",
  },
  {
    customerName: "Kemi Works",
    dueAt: "2026-06-21T12:00:00+03:00",
    estimatedValueCents: 800000,
    id: "rfq-sent-fab",
    priority: "rush",
    process: "fabrication",
    receivedAt: "2026-06-20T09:00:00+03:00",
    status: "sent",
    subject: "Welded guard frame",
  },
]

describe("process workload summary", () => {
  it("groups active RFQs by process and ranks workload pressure", () => {
    const summary = summarizeProcessWorkload({
      items,
      now: "2026-06-20T12:00:00+03:00",
    })

    expect(summary).toMatchObject({
      generatedAt: "2026-06-20T09:00:00.000Z",
      totalEstimatedValueCents: 340000,
      totalOpenItems: 4,
      workloadVersion: "process-workload.v1",
    })
    expect(summary.buckets.map((bucket) => [bucket.process, bucket.rank, bucket.riskScore])).toEqual([
      ["cnc_milling", 1, 1617],
      ["cnc_turning", 2, 1120],
      ["sheet_metal", 3, 670],
    ])
    expect(summary.buckets[0]).toMatchObject({
      badges: ["overdue"],
      earliestDueAt: "2026-06-19T09:00:00.000Z",
      estimatedValueCents: 200000,
      highestRiskQueueItemId: "rfq-overdue-mill",
      openItemCount: 2,
      overdueItemCount: 1,
      topQueueItemIds: ["rfq-overdue-mill", "rfq-estimate-mill"],
    })
    expect(summary.buckets[1]).toMatchObject({
      badges: ["due_today", "rush"],
      dueTodayItemCount: 1,
      rushItemCount: 1,
    })
    expect(summary.buckets[2]).toMatchObject({
      badges: ["due_soon", "ready_to_send"],
      dueSoonItemCount: 1,
      readyItemCount: 1,
    })
  })

  it("limits top queue item ids while keeping bucket pressure totals", () => {
    const summary = summarizeProcessWorkload({
      items,
      now: "2026-06-20T12:00:00+03:00",
      topItemLimit: 1,
    })

    expect(summary.buckets[0]).toMatchObject({
      openItemCount: 2,
      riskScore: 1617,
      topQueueItemIds: ["rfq-overdue-mill"],
    })
  })

  it("excludes sent and closed work from open process load", () => {
    const summary = summarizeProcessWorkload({
      items: items.map((item) => ({
        ...item,
        status: item.id === "rfq-overdue-mill" ? "lost" : item.id === "rfq-ready-sheet" ? "won" : "sent",
      })),
      now: "2026-06-20T12:00:00+03:00",
    })

    expect(summary.buckets).toEqual([])
    expect(summary.totalEstimatedValueCents).toBe(0)
    expect(summary.totalOpenItems).toBe(0)
  })

  it("rejects invalid summary inputs", () => {
    expect(() =>
      summarizeProcessWorkload({
        items,
        now: "06/20/2026 12:00:00",
      }),
    ).toThrow("now must be a valid ISO timestamp")

    expect(() =>
      summarizeProcessWorkload({
        items,
        now: "2026-06-20T12:00:00+03:00",
        topItemLimit: 0,
      }),
    ).toThrow("topItemLimit must be a positive integer")
  })
})
