import { describe, expect, it } from "vitest"

import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildCalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import {
  createLocalCalendarFollowUpReschedulePlanPersistence,
  type CalendarFollowUpReschedulePlanRecord,
} from "./calendarFollowUpReschedulePlanPersistence"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule plan persistence", () => {
  it("records current reschedule plans and returns cloned snapshots", async () => {
    const adapter = createLocalCalendarFollowUpReschedulePlanPersistence()
    const snapshot = await adapter.recordPlan(record("record-ready", "2026-06-24T09:00:00+03:00", readyPlan()))

    expect(snapshot).toMatchObject({
      currentRecordKey: "record-ready",
      recordCount: 1,
      summary: {
        blockedCommandCount: 0,
        commandCount: 1,
        latestRecordedAt: "2026-06-24T06:00:00.000Z",
        readyCommandCount: 1,
        recordCount: 1,
        statusCounts: {
          blocked: 0,
          empty: 0,
          mixed: 0,
          ready: 1,
        },
      },
    })

    snapshot.records[0]!.plan.commands[0]!.title = "mutated"
    expect(adapter.snapshot().records[0]?.plan.commands[0]?.title).toBe("Reschedule ready")
  })

  it("normalizes seeded snapshots and dedupes by record key", () => {
    const adapter = createLocalCalendarFollowUpReschedulePlanPersistence({
      initialSnapshot: {
        currentRecordKey: "record-ready",
        records: [
          record("record-ready", "2026-06-23T09:00:00+03:00", blockedPlan()),
          record("record-ready", "2026-06-24T09:00:00+03:00", readyPlan()),
          record("record-empty", "2026-06-22T09:00:00+03:00", emptyPlan()),
        ],
      },
    })

    expect(adapter.snapshot()).toMatchObject({
      currentRecordKey: "record-ready",
      recordCount: 2,
      summary: {
        blockedCommandCount: 0,
        commandCount: 1,
        latestRecordedAt: "2026-06-24T06:00:00.000Z",
        readyCommandCount: 1,
        recordCount: 2,
        statusCounts: {
          blocked: 0,
          empty: 1,
          mixed: 0,
          ready: 1,
        },
      },
    })
    expect(adapter.snapshot().records.map((stored) => stored.recordKey)).toEqual(["record-empty", "record-ready"])
  })

  it("falls back when the requested current key is not present", () => {
    const adapter = createLocalCalendarFollowUpReschedulePlanPersistence({
      initialSnapshot: {
        currentRecordKey: "missing",
        records: [record("record-ready", "2026-06-24T09:00:00+03:00", readyPlan())],
      },
    })

    expect(adapter.snapshot().currentRecordKey).toBeUndefined()
    expect(adapter.snapshot().summary.currentRecord).toBeUndefined()
  })

  it("rejects inconsistent plan summaries before storing records", async () => {
    const adapter = createLocalCalendarFollowUpReschedulePlanPersistence()
    const invalid = record("record-invalid", "2026-06-24T09:00:00+03:00", {
      ...readyPlan(),
      summary: {
        blockedCount: 0,
        commandCount: 2,
        readyCount: 1,
      },
    })

    await expect(adapter.recordPlan(invalid)).rejects.toThrow("plan.summary.commandCount must match normalized command count")
    expect(adapter.snapshot().recordCount).toBe(0)
  })

  it("rejects commands that target another RFQ", async () => {
    const adapter = createLocalCalendarFollowUpReschedulePlanPersistence()
    const invalid = record("record-invalid", "2026-06-24T09:00:00+03:00", {
      ...readyPlan(),
      commands: [
        {
          ...readyPlan().commands[0]!,
          rfqId: "rfq-other",
        },
      ],
    })

    await expect(adapter.recordPlan(invalid)).rejects.toThrow("plan.commands[0].rfqId must match record.rfqId")
  })

  it("rejects malformed restored command shapes", async () => {
    const adapter = createLocalCalendarFollowUpReschedulePlanPersistence()
    const invalid = record("record-invalid", "2026-06-24T09:00:00+03:00", {
      ...readyPlan(),
      commands: [
        {
          ...readyPlan().commands[0]!,
          blockerLabels: "needs review",
        } as never,
      ],
    })

    await expect(adapter.recordPlan(invalid)).rejects.toThrow("plan.commands[0].blockerLabels must be an array")
  })
})

function readyPlan() {
  const status = buildCalendarFollowUpStatus({
    actions: [followUpAction("2026-06-20T09:00:00+03:00")],
    now: "2026-06-24T09:00:00+03:00",
    offerId: "offer-019",
    rfqId: "rfq-019",
  })
  return buildCalendarFollowUpReschedulePlan({
    rfqId: "rfq-019",
    tasks: status.tasks,
  })
}

function blockedPlan() {
  const plan = readyPlan()
  return {
    ...plan,
    commands: [
      {
        ...plan.commands[0]!,
        blockerLabels: ["Terminal customer reply"],
        mode: "blocked" as const,
        status: "blocked" as const,
        suggestedDueAt: undefined,
        title: "Reschedule blocked",
      },
    ],
    status: "blocked" as const,
    summary: {
      blockedCount: 1,
      commandCount: 1,
      readyCount: 0,
    },
  }
}

function emptyPlan() {
  return {
    commands: [],
    status: "empty" as const,
    summary: {
      blockedCount: 0,
      commandCount: 0,
      readyCount: 0,
    },
  }
}

function record(
  recordKey: string,
  recordedAt: string,
  plan: ReturnType<typeof readyPlan>,
): CalendarFollowUpReschedulePlanRecord {
  return {
    plan,
    recordedAt,
    recordKey,
    rfqId: "rfq-019",
  }
}

function followUpAction(followUpDueAt: string) {
  return buildWorkspaceAction({
    actor: "Sari",
    followUpDueAt,
    kind: "follow_up_created",
    occurredAt: "2026-06-20T10:10:00+03:00",
    offerId: "offer-019",
    rfqId: "rfq-019",
  })
}
