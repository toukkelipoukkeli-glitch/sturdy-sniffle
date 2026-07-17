import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildCalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import { buildCalendarFollowUpRescheduleProviderCommandOutcomes } from "./calendarFollowUpRescheduleProviderOutcomes"
import { buildCalendarFollowUpReschedulePlan, type CalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import type { CalendarFollowUpRescheduleCommand } from "./calendarFollowUpReschedulePlan"
import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule provider outcomes", () => {
  it("turns reviewed dry-run commands into local calendar provider outcomes", () => {
    const plan = readyPlan()
    const reviewedExecution = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "dry_run",
      plan,
    })

    const outcomes = buildCalendarFollowUpRescheduleProviderCommandOutcomes({ plan, reviewedExecution })
    const commitRun = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      commandOutcomes: outcomes,
      executedAt: "2026-06-24T09:35:00+03:00",
      mode: "commit",
      plan,
    })

    expect(outcomes).toEqual([
      {
        commandId: plan.commands[0]?.commandId,
        externalId: `local-calendar-reschedule:${plan.commands[0]?.commandId}`,
        message: "Reschedule ready recorded in the local calendar reschedule adapter.",
        status: "created",
        warnings: ["Local adapter recorded the reschedule command; no external Calendar connector call was made."],
      },
    ])
    expect(commitRun).toMatchObject({
      status: "succeeded",
      warnings: ["Reschedule ready: Local adapter recorded the reschedule command; no external Calendar connector call was made."],
    })
    expect(commitRun.commands[0]).toMatchObject({
      externalId: `local-calendar-reschedule:${plan.commands[0]?.commandId}`,
      status: "created",
    })
  })

  it("fails ready commands until a matching dry-run execution is reviewed", () => {
    const plan = readyPlan()

    const outcomes = buildCalendarFollowUpRescheduleProviderCommandOutcomes({ plan })
    const commitRun = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      commandOutcomes: outcomes,
      executedAt: "2026-06-24T09:35:00+03:00",
      mode: "commit",
      plan,
    })

    expect(outcomes).toEqual([
      {
        commandId: plan.commands[0]?.commandId,
        message: "Reviewed dry-run execution is required before calendar provider outcomes are recorded.",
        status: "failed",
        warnings: [],
      },
    ])
    expect(commitRun).toMatchObject({
      status: "failed",
      warnings: [
        "Reschedule ready failed: Reviewed dry-run execution is required before calendar provider outcomes are recorded.",
      ],
    })
  })

  it("keeps mixed plans scoped to reviewed ready commands without emitting blocked outcomes", () => {
    const ready = readyPlan()
    const blocked = blockedPlan()
    const mixedPlan: CalendarFollowUpReschedulePlan = {
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
      plan: mixedPlan,
    })

    const outcomes = buildCalendarFollowUpRescheduleProviderCommandOutcomes({ plan: mixedPlan, reviewedExecution })
    const commitRun = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      commandOutcomes: outcomes,
      executedAt: "2026-06-24T09:35:00+03:00",
      mode: "commit",
      plan: mixedPlan,
    })

    expect(outcomes).toHaveLength(1)
    expect(outcomes[0]).toMatchObject({
      commandId: ready.commands[0]?.commandId,
      status: "created",
    })
    expect(commitRun.status).toBe("partial")
    expect(commitRun.commands.map((command) => [command.title, command.status])).toEqual([
      ["Reschedule blocked", "blocked"],
      ["Reschedule ready", "created"],
    ])
  })

  it("returns no provider outcomes for blocked or empty plans", () => {
    expect(buildCalendarFollowUpRescheduleProviderCommandOutcomes({ plan: blockedPlan() })).toEqual([])
    expect(
      buildCalendarFollowUpRescheduleProviderCommandOutcomes({
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
    ).toEqual([])
  })

  it("rejects blank local external id prefixes", () => {
    expect(() =>
      buildCalendarFollowUpRescheduleProviderCommandOutcomes({
        localExternalIdPrefix: " ",
        plan: readyPlan(),
      }),
    ).toThrow("localExternalIdPrefix is required")
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
