import { describe, expect, it } from "vitest"

import { parseRfqIntake } from "../rfq/intake"
import { cncBracketEmail } from "../rfq/intake.fixtures"
import {
  buildOfferFollowUpCalendarPlan,
  buildOfferFollowUpEvent,
  buildRfqCalendarPlan,
  createCalendarRfqScheduler,
  createMockCalendarRfqProvider,
  type CalendarRfqProviderAdapter,
} from "./calendarRfq"

const parsedCncRfq = parseRfqIntake(cncBracketEmail)

describe("calendar RFQ planning", () => {
  it("builds deterministic quote work and due reminder events from an RFQ due date", () => {
    const plan = buildRfqCalendarPlan({
      rfqId: "rfq-001",
      parsedRfq: parsedCncRfq,
      timezone: "Europe/Helsinki",
      quoteWorkMinutes: 120,
      dueReminderMinutes: 30,
    })

    expect(plan.warnings).toEqual([])
    expect(plan.events).toEqual([
      {
        kind: "quote_work_hold",
        title: "Quote work: RFQ: CNC bracket PN FB-204-A",
        startAt: "2026-06-30T09:00:00.000Z",
        endAt: "2026-06-30T11:00:00.000Z",
        timezone: "Europe/Helsinki",
        description: "FB-204-A qty 25 cnc_milling",
        metadata: {
          rfqId: "rfq-001",
          priority: "normal",
          source: "rfq_due_date",
        },
      },
      {
        kind: "quote_due",
        title: "Quote due: RFQ: CNC bracket PN FB-204-A",
        startAt: "2026-06-30T11:30:00.000Z",
        endAt: "2026-06-30T12:00:00.000Z",
        timezone: "Europe/Helsinki",
        description: "FB-204-A qty 25 cnc_milling",
        metadata: {
          rfqId: "rfq-001",
          priority: "normal",
          source: "rfq_due_date",
        },
      },
    ])
  })

  it("builds customer offer follow-up event drafts", () => {
    const event = buildOfferFollowUpEvent({
      offerId: "offer-001",
      offerNumber: "OFFER-204",
      customerName: "North Forge",
      followUpAt: "2026-07-02T07:00:00.000Z",
      timezone: "Europe/Helsinki",
    })

    expect(event).toEqual({
      kind: "offer_follow_up",
      title: "Follow up: OFFER-204",
      startAt: "2026-07-02T07:00:00.000Z",
      endAt: "2026-07-02T07:30:00.000Z",
      timezone: "Europe/Helsinki",
      description: "Follow up with North Forge about offer OFFER-204.",
      metadata: {
        offerId: "offer-001",
        offerNumber: "OFFER-204",
        customerName: "North Forge",
        source: "offer_follow_up",
      },
    })
  })

  it("builds offer follow-up calendar plans from open lifecycle tasks", () => {
    const plan = buildOfferFollowUpCalendarPlan({
      offerId: "offer-001",
      customerName: "North Forge",
      timezone: "Europe/Helsinki",
      timeline: {
        lifecycleVersion: "offer-lifecycle.v1",
        offerNumber: "OFFER-204",
        status: "sent",
        events: [],
        followUpTasks: [
          {
            createdAt: "2026-06-25T09:00:00.000Z",
            dueAt: "2026-07-03T07:00:00.000Z",
            id: "follow-later",
            offerNumber: "OFFER-204",
            status: "open",
            title: "Follow up OFFER-204",
          },
          {
            createdAt: "2026-06-25T09:00:00.000Z",
            dueAt: "2026-07-02T07:00:00.000Z",
            id: "follow-first",
            offerNumber: "OFFER-204",
            status: "open",
            title: "Follow up OFFER-204",
          },
          {
            completedAt: "2026-06-27T08:00:00.000Z",
            createdAt: "2026-06-25T09:00:00.000Z",
            dueAt: "2026-06-27T07:00:00.000Z",
            id: "follow-done",
            offerNumber: "OFFER-204",
            status: "completed",
            title: "Follow up OFFER-204",
          },
        ],
      },
    })

    expect(plan.warnings).toEqual(["Skipped 1 non-open follow-up task."])
    expect(plan.events.map((event) => [event.startAt, event.metadata.followUpTaskId])).toEqual([
      ["2026-07-02T07:00:00.000Z", "follow-first"],
      ["2026-07-03T07:00:00.000Z", "follow-later"],
    ])
    expect(plan.events[0]).toMatchObject({
      kind: "offer_follow_up",
      title: "Follow up: OFFER-204",
      metadata: {
        customerName: "North Forge",
        followUpTaskId: "follow-first",
        offerId: "offer-001",
        offerNumber: "OFFER-204",
        source: "offer_follow_up",
      },
    })
  })

  it("warns when an offer has no open follow-up tasks to schedule", () => {
    const plan = buildOfferFollowUpCalendarPlan({
      offerId: "offer-001",
      customerName: "North Forge",
      timezone: "Europe/Helsinki",
      timeline: {
        lifecycleVersion: "offer-lifecycle.v1",
        offerNumber: "OFFER-204",
        status: "accepted",
        events: [],
        followUpTasks: [
          {
            cancelledAt: "2026-06-27T08:00:00.000Z",
            createdAt: "2026-06-25T09:00:00.000Z",
            dueAt: "2026-06-28T07:00:00.000Z",
            id: "follow-cancelled",
            offerNumber: "OFFER-204",
            status: "cancelled",
            title: "Follow up OFFER-204",
          },
        ],
      },
    })

    expect(plan.events).toEqual([])
    expect(plan.warnings).toEqual([
      "Skipped 1 non-open follow-up task.",
      "Offer OFFER-204 has no open follow-up tasks.",
    ])
  })

  it("rejects invalid calendar timestamps", () => {
    expect(() =>
      buildRfqCalendarPlan({
        rfqId: "rfq-001",
        parsedRfq: {
          ...parsedCncRfq,
          dueAt: Number.NaN,
        },
        timezone: "Europe/Helsinki",
      }),
    ).toThrow("parsedRfq.dueAt must be a finite timestamp")

    expect(() =>
      buildOfferFollowUpEvent({
        offerId: "offer-001",
        offerNumber: "OFFER-204",
        customerName: "North Forge",
        followUpAt: "07/02/2026 07:00:00",
        timezone: "Europe/Helsinki",
      }),
    ).toThrow("followUpAt must be a valid ISO timestamp")

    expect(() =>
      buildRfqCalendarPlan({
        rfqId: "rfq-001",
        parsedRfq: {
          ...parsedCncRfq,
          dueAt: 1e100,
        },
        timezone: "Europe/Helsinki",
      }),
    ).toThrow("parsedRfq.dueAt must be a valid timestamp")
  })

  it("schedules RFQ plans through the configured provider", async () => {
    const scheduler = createCalendarRfqScheduler({
      provider: createMockCalendarRfqProvider(),
    })

    const result = await scheduler.scheduleRfqPlan({
      rfqId: "rfq-001",
      parsedRfq: parsedCncRfq,
      timezone: "Europe/Helsinki",
    })

    expect(result).toMatchObject({
      provider: "mock",
      status: "succeeded",
      warnings: [],
      results: [
        {
          status: "created",
          externalId: "mock-calendar-001",
        },
        {
          status: "created",
          externalId: "mock-calendar-002",
        },
      ],
    })
  })

  it("schedules offer follow-up plans through the configured provider", async () => {
    const scheduler = createCalendarRfqScheduler({
      provider: createMockCalendarRfqProvider(),
    })

    const result = await scheduler.scheduleOfferFollowUpPlan({
      offerId: "offer-001",
      customerName: "North Forge",
      timezone: "Europe/Helsinki",
      timeline: {
        lifecycleVersion: "offer-lifecycle.v1",
        offerNumber: "OFFER-204",
        status: "sent",
        events: [],
        followUpTasks: [
          {
            createdAt: "2026-06-25T09:00:00.000Z",
            dueAt: "2026-07-02T07:00:00.000Z",
            id: "follow-first",
            offerNumber: "OFFER-204",
            status: "open",
            title: "Follow up OFFER-204",
          },
        ],
      },
    })

    expect(result).toMatchObject({
      provider: "mock",
      status: "succeeded",
      warnings: [],
      results: [
        {
          externalId: "mock-calendar-001",
          event: {
            kind: "offer_follow_up",
            metadata: {
              followUpTaskId: "follow-first",
              offerId: "offer-001",
            },
          },
          status: "created",
        },
      ],
    })
  })

  it("falls back to the mock provider when the primary calendar provider fails", async () => {
    const failingProvider: CalendarRfqProviderAdapter = {
      provider: "calendar",
      adapterVersion: "calendar.live.test",
      async createEvents() {
        throw new Error("Calendar auth revoked")
      },
    }
    const scheduler = createCalendarRfqScheduler({
      provider: failingProvider,
      fallbackProvider: createMockCalendarRfqProvider(),
    })

    const result = await scheduler.scheduleRfqPlan({
      rfqId: "rfq-001",
      parsedRfq: parsedCncRfq,
      timezone: "Europe/Helsinki",
    })

    expect(result.status).toBe("fallback")
    expect(result.provider).toBe("mock")
    expect(result.results).toHaveLength(2)
    expect(result.warnings).toEqual([
      "Calendar provider calendar failed: Calendar auth revoked.",
      "Used mock calendar fallback.",
    ])
  })

  it("skips scheduling when an RFQ has no due date", async () => {
    const parsedWithoutDueDate = parseRfqIntake({
      ...cncBracketEmail,
      bodyText: "Please quote part: FB-204-A. CNC milling, aluminum 6082, qty 25 pcs.",
    })
    const scheduler = createCalendarRfqScheduler()

    const result = await scheduler.scheduleRfqPlan({
      rfqId: "rfq-001",
      parsedRfq: parsedWithoutDueDate,
      timezone: "Europe/Helsinki",
    })

    expect(result.status).toBe("skipped")
    expect(result.results).toEqual([])
    expect(result.warnings).toEqual(["RFQ has no due date; calendar quote due events were not created."])
  })
})
