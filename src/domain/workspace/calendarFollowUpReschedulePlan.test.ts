import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildCalendarFollowUpStatus, type CalendarFollowUpStatusTask } from "./calendarFollowUpStatus"
import { buildCalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule plan", () => {
  it("builds reviewed calendar reschedule commands for overdue follow-ups", () => {
    const status = buildCalendarFollowUpStatus({
      actions: [followUpAction("2026-06-20T09:00:00+03:00")],
      now: "2026-06-24T09:00:00+03:00",
      offerId: "offer-019",
      rfqId: "rfq-019",
    })

    const plan = buildCalendarFollowUpReschedulePlan({
      rfqId: "rfq-019",
      tasks: status.tasks,
    })

    expect(plan.summary).toEqual({
      blockedCount: 0,
      commandCount: 1,
      readyCount: 1,
    })
    expect(plan).toMatchObject({
      status: "ready",
      commands: [
        {
          actionKey: "rfq-019:follow_up_created:offer-019:2026-06-20T06:00:00.000Z:2026-06-20T07:10:00.000Z",
          blockerLabels: [],
          commandId: "calendar-reschedule:rfq-019:follow-up-rfq-019:rfq-019-follow-up-created-offer-019-2026-06-20t06-00-00-000z-2026-06-20t07-10-00-000z",
          mode: "review_required",
          offerId: "offer-019",
          previousDueAt: "2026-06-20T06:00:00.000Z",
          provider: "calendar",
          rfqId: "rfq-019",
          status: "ready",
          suggestedDueAt: "2026-06-26T06:00:00.000Z",
          taskId: "follow-up-rfq-019",
          title: "Reschedule ready",
        },
      ],
    })
  })

  it("keeps terminal customer replies blocked for reschedule execution", () => {
    const status = buildCalendarFollowUpStatus({
      actions: [followUpAction("2026-06-27T09:00:00+03:00")],
      now: "2026-06-24T09:00:00+03:00",
      offerId: "offer-019",
      replySync: replySync("declined"),
      rfqId: "rfq-019",
    })

    const plan = buildCalendarFollowUpReschedulePlan({
      rfqId: "rfq-019",
      tasks: status.tasks,
    })

    expect(plan.status).toBe("blocked")
    expect(plan.commands[0]).toMatchObject({
      blockerLabels: ["Terminal customer reply"],
      mode: "blocked",
      nextOperatorMessage: "Keep the existing hold closed; the customer has already reached a terminal offer state.",
      status: "blocked",
      title: "Reschedule blocked",
    })
    expect(plan.commands[0]?.suggestedDueAt).toBeUndefined()
  })

  it("omits open and completed follow-ups from the reschedule plan", () => {
    const open = buildCalendarFollowUpStatus({
      actions: [followUpAction("2026-06-27T09:00:00+03:00")],
      now: "2026-06-24T09:00:00+03:00",
      offerId: "offer-019",
      rfqId: "rfq-019",
    })
    const completed = buildCalendarFollowUpStatus({
      actions: [followUpAction("2026-06-27T09:00:00+03:00")],
      now: "2026-06-24T09:00:00+03:00",
      offerId: "offer-019",
      replySync: replySync("follow_up_completed"),
      rfqId: "rfq-019",
    })

    expect(buildCalendarFollowUpReschedulePlan({ rfqId: "rfq-019", tasks: open.tasks }).status).toBe("empty")
    expect(buildCalendarFollowUpReschedulePlan({ rfqId: "rfq-019", tasks: completed.tasks })).toEqual({
      commands: [],
      status: "empty",
      summary: {
        blockedCount: 0,
        commandCount: 0,
        readyCount: 0,
      },
    })
  })

  it("blocks malformed ready previews before provider execution", () => {
    const task: CalendarFollowUpStatusTask = {
      detail: "Due 2026-06-20T06:00:00.000Z; needs operator review.",
      dueAt: "2026-06-20T06:00:00.000Z",
      id: "follow-up-rfq-019",
      key: "manual-follow-up",
      offerId: "offer-019",
      reschedulePreview: {
        detail: "Previous follow-up hold is overdue; create a reviewed replacement hold before contacting the customer.",
        label: "Reschedule ready",
        tone: "ready",
      },
      scheduledAt: "2026-06-20T07:10:00.000Z",
      status: "review",
    }

    const plan = buildCalendarFollowUpReschedulePlan({
      rfqId: "rfq-019",
      tasks: [task],
    })

    expect(plan.status).toBe("blocked")
    expect(plan.commands[0]).toMatchObject({
      blockerLabels: ["Missing suggested due date"],
      mode: "blocked",
      status: "blocked",
      title: "Reschedule blocked",
    })
  })

  it("rejects unsluggable command identity inputs", () => {
    const task: CalendarFollowUpStatusTask = {
      detail: "Due 2026-06-20T06:00:00.000Z; needs operator review.",
      dueAt: "2026-06-20T06:00:00.000Z",
      id: "!!!",
      key: "manual-follow-up",
      offerId: "offer-019",
      reschedulePreview: {
        detail: "Previous follow-up hold is overdue; create a reviewed replacement hold before contacting the customer.",
        label: "Reschedule ready",
        suggestedDueAt: "2026-06-26T06:00:00.000Z",
        tone: "ready",
      },
      scheduledAt: "2026-06-20T07:10:00.000Z",
      status: "review",
    }

    expect(() =>
      buildCalendarFollowUpReschedulePlan({
        rfqId: "rfq-019",
        tasks: [task],
      }),
    ).toThrow("tasks[0].id must contain at least one letter or number")
  })
})

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

function replySync(kind: "declined" | "follow_up_completed"): GmailOfferReplySyncResult {
  return {
    adapterVersion: "gmail-offer-reply.v1",
    offerNumber: "OFFER-019",
    provider: "mock",
    query: "offer OFFER-019",
    records: [
      {
        message: {
          fromHeader: "Buyer <buyer@example.test>",
          id: `reply-${kind}`,
          plainText: "Reply",
          receivedAt: "2026-06-24T09:30:00+03:00",
          senderEmail: "buyer@example.test",
          subject: "Re: OFFER-019",
        },
        parsed: {
          adapterVersion: "gmail-offer-reply.v1",
          event: {
            actor: "buyer@example.test",
            kind,
            occurredAt: "2026-06-24T09:30:00+03:00",
            ...(kind === "follow_up_completed" ? { followUpTaskId: "follow-up-rfq-019" } : {}),
          },
          matched: true,
          messageId: `reply-${kind}`,
          offerNumber: "OFFER-019",
          signal: kind,
          warnings: [],
        },
      },
    ],
    status: "succeeded",
    warnings: [],
  }
}
