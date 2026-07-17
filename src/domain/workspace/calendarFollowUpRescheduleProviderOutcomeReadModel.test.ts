import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildCalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import { buildCalendarFollowUpRescheduleProviderOutcomeReadModel } from "./calendarFollowUpRescheduleProviderOutcomeReadModel"
import { buildCalendarFollowUpRescheduleProviderCommandOutcomes } from "./calendarFollowUpRescheduleProviderOutcomes"
import { buildCalendarFollowUpReschedulePlan, type CalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import type { CalendarFollowUpRescheduleCommand } from "./calendarFollowUpReschedulePlan"
import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule provider outcome read model", () => {
  it("marks reviewed local provider outcomes ready for execution audit", () => {
    const plan = readyPlan()
    const reviewedExecution = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "dry_run",
      plan,
    })
    const outcomes = buildCalendarFollowUpRescheduleProviderCommandOutcomes({ plan, reviewedExecution })

    expect(buildCalendarFollowUpRescheduleProviderOutcomeReadModel({ outcomes, plan })).toEqual({
      blockedCommandCount: 0,
      createdOutcomeCount: 1,
      detail: "1 local provider outcome(s) are ready for the calendar reschedule execution audit.",
      expectedOutcomeCount: 1,
      failedOutcomeCount: 0,
      missingOutcomeCount: 0,
      nextActions: ["Record the local provider outcomes in the calendar reschedule execution audit."],
      outcomeVersion: "calendar-follow-up-reschedule-provider-outcomes.v1",
      readModelVersion: "calendar-follow-up-reschedule-provider-outcome-read-model.v1",
      status: "ready",
      title: "Calendar provider outcomes ready",
      unexpectedOutcomeCount: 0,
      warningCount: 1,
    })
  })

  it("keeps missing reviewed dry-runs actionable before provider outcomes are accepted", () => {
    const plan = readyPlan()
    const outcomes = buildCalendarFollowUpRescheduleProviderCommandOutcomes({ plan })

    expect(buildCalendarFollowUpRescheduleProviderOutcomeReadModel({ outcomes, plan })).toMatchObject({
      createdOutcomeCount: 0,
      detail: "1 calendar provider outcome(s) need a reviewed dry-run before commit execution.",
      expectedOutcomeCount: 1,
      failedOutcomeCount: 1,
      missingOutcomeCount: 0,
      nextActions: ["Review a dry-run execution before recording local calendar provider outcomes."],
      status: "needs_review",
      title: "Calendar provider outcomes need review",
      warningCount: 0,
    })

    expect(buildCalendarFollowUpRescheduleProviderOutcomeReadModel({ outcomes: [], plan })).toMatchObject({
      detail: "1 calendar provider outcome(s) need a reviewed dry-run before commit execution.",
      failedOutcomeCount: 0,
      missingOutcomeCount: 1,
      status: "needs_review",
    })
  })

  it("marks mixed ready and blocked commands partial even when the ready outcome is local-created", () => {
    const ready = readyPlan()
    const blocked = blockedPlan()
    const plan: CalendarFollowUpReschedulePlan = {
      commands: [blocked.commands[0], ready.commands[0]].filter(
        (command): command is CalendarFollowUpRescheduleCommand => Boolean(command),
      ),
      status: "mixed",
      summary: {
        blockedCount: 1,
        commandCount: 2,
        readyCount: 1,
      },
    }
    const reviewedExecution = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "dry_run",
      plan,
    })
    const outcomes = buildCalendarFollowUpRescheduleProviderCommandOutcomes({ plan, reviewedExecution })

    expect(buildCalendarFollowUpRescheduleProviderOutcomeReadModel({ outcomes, plan })).toMatchObject({
      blockedCommandCount: 1,
      createdOutcomeCount: 1,
      detail: "1 local provider outcome(s) are ready while 1 item(s) still need operator attention.",
      expectedOutcomeCount: 1,
      status: "partial",
      title: "Calendar provider outcomes partial",
    })
  })

  it("keeps blocked and empty provider outcome states explicit", () => {
    expect(
      buildCalendarFollowUpRescheduleProviderOutcomeReadModel({
        outcomes: [],
        plan: blockedPlan(),
      }),
    ).toMatchObject({
      blockedCommandCount: 1,
      detail: "1 calendar reschedule command(s) are blocked before local/provider outcomes.",
      expectedOutcomeCount: 0,
      nextActions: ["Resolve blocked reschedule commands before recording calendar provider outcomes."],
      status: "blocked",
      title: "Calendar provider outcomes blocked",
    })

    expect(
      buildCalendarFollowUpRescheduleProviderOutcomeReadModel({
        outcomes: [],
        plan: {
          commands: [],
          status: "empty",
          summary: {
            blockedCount: 0,
            commandCount: 0,
            readyCount: 0,
          },
        },
      }),
    ).toMatchObject({
      detail: "No calendar reschedule provider outcomes are expected yet.",
      nextActions: ["Create a reviewed calendar reschedule plan before recording provider outcomes."],
      status: "empty",
      title: "No calendar provider outcomes",
    })
  })

  it("counts unexpected and duplicate outcomes deterministically", () => {
    const plan = readyPlan()
    const commandId = plan.commands[0]?.commandId ?? ""

    expect(
      buildCalendarFollowUpRescheduleProviderOutcomeReadModel({
        outcomes: [
          {
            commandId: "calendar-reschedule:unexpected:command",
            status: "created",
            warnings: [" external connector replayed an unknown command ", "external connector replayed an unknown command"],
          },
        ],
        plan,
      }),
    ).toMatchObject({
      detail: "2 calendar provider outcome(s) need a reviewed dry-run before commit execution.",
      missingOutcomeCount: 1,
      status: "needs_review",
      unexpectedOutcomeCount: 1,
      warningCount: 0,
    })

    expect(() =>
      buildCalendarFollowUpRescheduleProviderOutcomeReadModel({
        outcomes: [
          { commandId, status: "created" },
          { commandId, status: "failed" },
        ],
        plan,
      }),
    ).toThrow(`duplicate calendar reschedule provider outcome ${commandId}`)
  })
})

function readyPlan(): CalendarFollowUpReschedulePlan {
  return buildCalendarFollowUpReschedulePlan({
    rfqId: "rfq-019",
    tasks: followUpStatus().tasks,
  })
}

function blockedPlan(): CalendarFollowUpReschedulePlan {
  return buildCalendarFollowUpReschedulePlan({
    rfqId: "rfq-019",
    tasks: followUpStatus(replySync("accepted")).tasks,
  })
}

function followUpStatus(replySync?: GmailOfferReplySyncResult) {
  return buildCalendarFollowUpStatus({
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
    replySync,
    rfqId: "rfq-019",
  })
}

function replySync(kind: "accepted"): GmailOfferReplySyncResult {
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
          subject: "Offer reply",
        },
        parsed: {
          adapterVersion: "gmail-offer-reply.v1",
          event: {
            actor: "buyer@example.test",
            kind,
            occurredAt: "2026-06-24T09:30:00+03:00",
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
