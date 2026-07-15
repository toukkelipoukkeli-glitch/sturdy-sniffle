import { describe, expect, it } from "vitest"

import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildCalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import { buildCalendarFollowUpReschedulePlanReadModel } from "./calendarFollowUpReschedulePlanReadModel"
import { createLocalCalendarFollowUpReschedulePlanPersistence } from "./calendarFollowUpReschedulePlanPersistence"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule plan read model", () => {
  it("surfaces ready persisted reschedule plans with operator next actions", async () => {
    const adapter = createLocalCalendarFollowUpReschedulePlanPersistence()
    const snapshot = await adapter.recordPlan({
      plan: readyPlan(),
      recordedAt: "2026-06-24T09:00:00+03:00",
      recordKey: "record-ready",
      rfqId: "rfq-019",
    })

    expect(buildCalendarFollowUpReschedulePlanReadModel({ summary: snapshot.summary })).toEqual({
      blockedCommandCount: 0,
      commandCount: 1,
      currentPlanStatus: "ready",
      currentRecordKey: "record-ready",
      detail: "1 reviewed reschedule command(s) are ready for operator approval before provider execution.",
      latestRecordedAt: "2026-06-24T06:00:00.000Z",
      nextActions: [
        "Review the replacement due dates with the operator.",
        "Keep the local persistence snapshot until the calendar provider execution adapter is configured.",
      ],
      readyCommandCount: 1,
      recordCount: 1,
      status: "ready",
      title: "Reschedule ready",
    })
  })

  it("reports blocked and mixed histories deterministically", () => {
    expect(
      buildCalendarFollowUpReschedulePlanReadModel({
        summary: {
          blockedCommandCount: 2,
          commandCount: 2,
          currentRecord: {
            plan: {
              commands: [],
              status: "blocked",
              summary: {
                blockedCount: 2,
                commandCount: 2,
                readyCount: 0,
              },
            },
            recordedAt: "2026-06-24T06:00:00.000Z",
            recordKey: "record-blocked",
            rfqId: "rfq-019",
          },
          latestRecordedAt: "2026-06-24T06:00:00.000Z",
          readyCommandCount: 0,
          recordCount: 1,
          statusCounts: {
            blocked: 1,
            empty: 0,
            mixed: 0,
            ready: 0,
          },
        },
      }),
    ).toMatchObject({
      detail: "2 reschedule command(s) are blocked before calendar provider execution.",
      nextActions: [
        "Review the blocker labels before creating any replacement calendar hold.",
        "Keep live calendar execution disabled until a provider adapter can reject the same blockers.",
      ],
      status: "blocked",
      title: "Reschedule blocked",
    })

    expect(
      buildCalendarFollowUpReschedulePlanReadModel({
        summary: {
          blockedCommandCount: 1,
          commandCount: 3,
          currentRecord: {
            plan: {
              commands: [],
              status: "mixed",
              summary: {
                blockedCount: 1,
                commandCount: 3,
                readyCount: 2,
              },
            },
            recordedAt: "2026-06-24T06:00:00.000Z",
            recordKey: "record-mixed",
            rfqId: "rfq-019",
          },
          latestRecordedAt: "2026-06-24T06:00:00.000Z",
          readyCommandCount: 2,
          recordCount: 1,
          statusCounts: {
            blocked: 0,
            empty: 0,
            mixed: 1,
            ready: 0,
          },
        },
      }),
    ).toMatchObject({
      detail: "2 ready and 1 blocked reschedule command(s) need operator review.",
      nextActions: [
        "Resolve blocked commands before provider execution.",
        "Review ready commands individually before creating replacement calendar holds.",
      ],
      status: "mixed",
      title: "Reschedule review mixed",
    })
  })

  it("keeps empty and stale history states explicit", () => {
    expect(
      buildCalendarFollowUpReschedulePlanReadModel({
        summary: {
          blockedCommandCount: 0,
          commandCount: 0,
          readyCommandCount: 0,
          recordCount: 0,
          statusCounts: {
            blocked: 0,
            empty: 0,
            mixed: 0,
            ready: 0,
          },
        },
      }),
    ).toMatchObject({
      detail: "No reviewed calendar follow-up reschedule commands have been recorded for this RFQ.",
      nextActions: ["Create or review an overdue follow-up status before planning a replacement calendar hold."],
      status: "empty",
      title: "No reschedule plan",
    })

    expect(
      buildCalendarFollowUpReschedulePlanReadModel({
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
      }),
    ).toMatchObject({
      detail: "Reschedule plan history exists, but no current plan record is selected for this RFQ.",
      nextActions: ["Rebuild the current reschedule plan from the latest follow-up status history (1 stored record(s))."],
      status: "stale",
      title: "Reschedule history needs refresh",
    })
  })
})

function readyPlan() {
  const status = buildCalendarFollowUpStatus({
    actions: [
      buildWorkspaceAction({
        actor: "Sari",
        followUpDueAt: "2026-06-20T09:00:00+03:00",
        kind: "follow_up_created",
        occurredAt: "2026-06-20T10:10:00+03:00",
        offerId: "offer-019",
        rfqId: "rfq-019",
      }),
    ],
    now: "2026-06-24T09:00:00+03:00",
    offerId: "offer-019",
    rfqId: "rfq-019",
  })
  return buildCalendarFollowUpReschedulePlan({
    rfqId: "rfq-019",
    tasks: status.tasks,
  })
}
