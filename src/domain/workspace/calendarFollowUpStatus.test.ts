import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildWorkspaceAction } from "./workspaceActions"
import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"

describe("calendar follow-up status", () => {
  it("summarizes open workspace follow-up holds", () => {
    const status = buildCalendarFollowUpStatus({
      actions: [followUpAction("2026-06-27T09:00:00+03:00")],
      now: "2026-06-24T09:00:00+03:00",
      offerId: "offer-019",
      rfqId: "rfq-019",
    })

    expect(status.summary).toEqual({
      cancelledCount: 0,
      completedCount: 0,
      openCount: 1,
      reviewCount: 0,
      taskCount: 1,
      warningCount: 0,
    })
    expect(status.tasks[0]).toMatchObject({
      detail: "Calendar hold due 2026-06-27T06:00:00.000Z.",
      dueAt: "2026-06-27T06:00:00.000Z",
      id: "follow-up-rfq-019",
      status: "open",
    })
  })

  it("marks matching reply sync follow-ups completed", () => {
    const status = buildCalendarFollowUpStatus({
      actions: [followUpAction("2026-06-27T09:00:00+03:00")],
      now: "2026-06-24T09:00:00+03:00",
      offerId: "offer-019",
      replySync: replySync("follow_up_completed"),
      rfqId: "rfq-019",
    })

    expect(status.summary.completedCount).toBe(1)
    expect(status.tasks[0]).toMatchObject({
      completedAt: "2026-06-24T06:30:00.000Z",
      status: "completed",
    })
  })

  it("keeps overdue and terminal-reply follow-ups in the review filter", () => {
    const overdue = buildCalendarFollowUpStatus({
      actions: [followUpAction("2026-06-20T09:00:00+03:00")],
      filter: "review",
      now: "2026-06-24T09:00:00+03:00",
      offerId: "offer-019",
      rfqId: "rfq-019",
    })
    const cancelled = buildCalendarFollowUpStatus({
      actions: [followUpAction("2026-06-27T09:00:00+03:00")],
      filter: "review",
      now: "2026-06-24T09:00:00+03:00",
      offerId: "offer-019",
      replySync: replySync("accepted"),
      rfqId: "rfq-019",
    })

    expect(overdue.tasks.map((task) => task.status)).toEqual(["review"])
    expect(cancelled.tasks.map((task) => task.status)).toEqual(["cancelled"])
    expect(cancelled.summary.cancelledCount).toBe(1)
  })

  it("filters by RFQ and validates required inputs", () => {
    const status = buildCalendarFollowUpStatus({
      actions: [followUpAction("2026-06-27T09:00:00+03:00"), followUpAction("2026-06-27T09:00:00+03:00", "rfq-999")],
      filter: "completed",
      now: "2026-06-24T09:00:00+03:00",
      offerId: "offer-019",
      replySync: replySync("follow_up_completed"),
      rfqId: "rfq-019",
    })

    expect(status.tasks).toHaveLength(1)
    expect(() =>
      buildCalendarFollowUpStatus({
        actions: [],
        now: "not-a-date",
        offerId: "offer-019",
        rfqId: "rfq-019",
      }),
    ).toThrow("now must be a valid ISO timestamp")
    expect(() =>
      buildCalendarFollowUpStatus({
        actions: [],
        now: "2026-06-24T09:00:00+03:00",
        offerId: " ",
        rfqId: "rfq-019",
      }),
    ).toThrow("offerId is required")
  })
})

function followUpAction(followUpDueAt: string, rfqId = "rfq-019") {
  return buildWorkspaceAction({
    actor: "Sari",
    followUpDueAt,
    kind: "follow_up_created",
    occurredAt: "2026-06-20T10:10:00+03:00",
    offerId: "offer-019",
    rfqId,
  })
}

function replySync(kind: "accepted" | "follow_up_completed"): GmailOfferReplySyncResult {
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
          signal: kind === "accepted" ? "accepted" : "follow_up_completed",
          warnings: [],
        },
      },
    ],
    status: "succeeded",
    warnings: [],
  }
}
