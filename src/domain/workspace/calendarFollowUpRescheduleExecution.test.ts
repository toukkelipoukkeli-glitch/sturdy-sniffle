import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildCalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import { buildCalendarFollowUpReschedulePlan, type CalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule execution", () => {
  it("prepares reviewed reschedule commands without provider side effects in dry-run mode", () => {
    const plan = readyPlan()
    const run = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "dry_run",
      plan,
    })

    expect(run).toMatchObject({
      actor: "Sari",
      executedAt: "2026-06-24T06:30:00.000Z",
      executionVersion: "calendar-follow-up-reschedule-execution.v1",
      mode: "dry_run",
      nextActions: ["Review 1 replacement calendar hold command(s) before committing."],
      planStatus: "ready",
      status: "prepared",
    })
    expect(run.executionFingerprint).toMatch(/^calendar-follow-up-reschedule-execution-[a-f0-9]{8}$/)
    expect(run.commands).toHaveLength(1)
    expect(run.commands[0]).toMatchObject({
      blockerLabels: [],
      idempotencyKey: `calendar-reschedule-execution:${plan.commands[0]?.commandId}`,
      provider: "calendar",
      status: "prepared",
      suggestedDueAt: "2026-06-26T06:00:00.000Z",
      title: "Reschedule ready",
    })
    expect(run.commands[0]?.externalId).toBeUndefined()
  })

  it("records committed provider outcomes and keeps fingerprints deterministic", () => {
    const plan = readyPlan()
    const firstRun = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      commandOutcomes: [
        {
          commandId: plan.commands[0]?.commandId ?? "",
          externalId: "calendar-event-019",
          message: "Replacement hold created.",
          status: "created",
          warnings: ["Provider normalized reminder minutes."],
        },
      ],
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "commit",
      plan,
    })
    const secondRun = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      commandOutcomes: [
        {
          commandId: plan.commands[0]?.commandId ?? "",
          externalId: "calendar-event-019",
          message: "Replacement hold created.",
          status: "created",
          warnings: ["Provider normalized reminder minutes."],
        },
      ],
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "commit",
      plan,
    })

    expect(firstRun.status).toBe("succeeded")
    expect(firstRun.nextActions).toEqual(["Calendar follow-up reschedule execution completed."])
    expect(firstRun.commands[0]).toMatchObject({
      externalId: "calendar-event-019",
      message: "Replacement hold created.",
      status: "created",
      warnings: ["Provider normalized reminder minutes."],
    })
    expect(firstRun.warnings).toEqual(["Reschedule ready: Provider normalized reminder minutes."])
    expect(secondRun.executionFingerprint).toBe(firstRun.executionFingerprint)
  })

  it("records mixed blocked and completed provider work as a partial audit", () => {
    const ready = readyPlan()
    const blocked = blockedPlan()
    const plan: CalendarFollowUpReschedulePlan = {
      commands: [blocked.commands[0], ready.commands[0]].filter((command) => Boolean(command)),
      status: "mixed",
      summary: {
        blockedCount: 1,
        commandCount: 2,
        readyCount: 1,
      },
    }

    const run = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      commandOutcomes: [
        {
          commandId: ready.commands[0]?.commandId ?? "",
          externalId: "calendar-event-019",
          message: "Replacement hold created.",
          status: "created",
        },
      ],
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "commit",
      plan,
    })

    expect(run.status).toBe("partial")
    expect(run.commands.map((command) => command.status)).toEqual(["blocked", "created"])
    expect(run.nextActions).toContain("Terminal customer reply")
    expect(run.commands.find((command) => command.status === "created")).toMatchObject({
      externalId: "calendar-event-019",
      message: "Replacement hold created.",
      title: "Reschedule ready",
    })
  })

  it("keeps blocked reschedule commands non-executable without leaking provider outcomes", () => {
    const plan = blockedPlan()
    const run = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "commit",
      plan,
    })

    expect(run.status).toBe("blocked")
    expect(run.nextActions).toEqual(["Terminal customer reply"])
    expect(run.commands[0]).toMatchObject({
      blockerLabels: ["Terminal customer reply"],
      status: "blocked",
      title: "Reschedule blocked",
    })
    expect(run.commands[0]?.externalId).toBeUndefined()
    expect(run.commands[0]?.message).toBeUndefined()
    expect(run.commands[0]?.warnings).toEqual([])
  })

  it("rejects impossible provider outcomes before audit rows are built", () => {
    const ready = readyPlan()
    const blocked = blockedPlan()
    const commandId = ready.commands[0]?.commandId ?? ""

    expect(() =>
      buildCalendarFollowUpRescheduleExecutionRun({
        actor: "Sari",
        commandOutcomes: [{ commandId, status: "created" }],
        executedAt: "2026-06-24T09:30:00+03:00",
        mode: "dry_run",
        plan: ready,
      }),
    ).toThrow(`command outcome ${commandId} cannot be recorded for a dry-run calendar reschedule execution`)

    expect(() =>
      buildCalendarFollowUpRescheduleExecutionRun({
        actor: "Sari",
        commandOutcomes: [{ commandId: blocked.commands[0]?.commandId ?? "", status: "created" }],
        executedAt: "2026-06-24T09:30:00+03:00",
        mode: "commit",
        plan: blocked,
      }),
    ).toThrow("cannot be recorded for a blocked calendar reschedule command")

    expect(() =>
      buildCalendarFollowUpRescheduleExecutionRun({
        actor: "Sari",
        commandOutcomes: [
          { commandId, status: "created" },
          { commandId, status: "failed" },
        ],
        executedAt: "2026-06-24T09:30:00+03:00",
        mode: "commit",
        plan: ready,
      }),
    ).toThrow(`duplicate command outcome ${commandId}`)
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
