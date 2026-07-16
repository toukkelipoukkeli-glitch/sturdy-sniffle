import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildCalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import { buildCalendarFollowUpRescheduleExecutionReadModel } from "./calendarFollowUpRescheduleExecutionReadModel"
import { createLocalCalendarFollowUpRescheduleExecutionPersistence } from "./calendarFollowUpRescheduleExecutionPersistence"
import { buildCalendarFollowUpReschedulePlan, type CalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import type { CalendarFollowUpRescheduleCommand } from "./calendarFollowUpReschedulePlan"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule execution read model", () => {
  it("surfaces prepared dry-run execution audits with operator next actions", async () => {
    const run = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "dry_run",
      plan: readyPlan(),
    })
    const adapter = createLocalCalendarFollowUpRescheduleExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(buildCalendarFollowUpRescheduleExecutionReadModel({ snapshot })).toEqual({
      blockedCommandCount: 0,
      commandCount: 1,
      createdCommandCount: 0,
      detail: "1 calendar reschedule command(s) are prepared in dry-run mode.",
      executionFingerprint: run.executionFingerprint,
      failedCommandCount: 0,
      latestExecutedAt: "2026-06-24T06:30:00.000Z",
      mode: "dry_run",
      nextActions: [
        "Review the dry-run execution audit before committing provider calendar changes.",
        "Keep live calendar writes disabled until the operator approves the prepared commands.",
      ],
      pendingActionCount: 1,
      pendingCommandCount: 0,
      planStatus: "ready",
      preparedCommandCount: 1,
      recordCount: 1,
      rfqIds: ["rfq-019"],
      status: "prepared",
      taskIds: ["follow-up-rfq-019"],
      title: "Reschedule execution prepared",
      warningCount: 0,
    })
  })

  it("summarizes pending, partial, failed, and succeeded execution histories", async () => {
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

    expect(
      buildCalendarFollowUpRescheduleExecutionReadModel({
        snapshot: await createLocalCalendarFollowUpRescheduleExecutionPersistence().recordRun(
          buildCalendarFollowUpRescheduleExecutionRun({
            actor: "Sari",
            executedAt: "2026-06-24T09:30:00+03:00",
            mode: "commit",
            plan: ready,
          }),
        ),
      }),
    ).toMatchObject({
      detail: "1 calendar reschedule command(s) are waiting for provider outcomes.",
      nextActions: ["Record provider outcomes for 1 calendar reschedule command(s)."],
      pendingCommandCount: 1,
      status: "pending",
      title: "Reschedule execution pending",
    })

    expect(
      buildCalendarFollowUpRescheduleExecutionReadModel({
        snapshot: await createLocalCalendarFollowUpRescheduleExecutionPersistence().recordRun(
          buildCalendarFollowUpRescheduleExecutionRun({
            actor: "Sari",
            commandOutcomes: [
              {
                commandId: ready.commands[0]?.commandId ?? "",
                externalId: "calendar-event-019",
                message: "Replacement hold created.",
                status: "created",
              },
            ],
            executedAt: "2026-06-24T09:35:00+03:00",
            mode: "commit",
            plan: mixedPlan,
          }),
        ),
      }),
    ).toMatchObject({
      blockedCommandCount: 1,
      createdCommandCount: 1,
      detail: "1 command(s) completed while 1 still need operator attention.",
      nextActions: [
        "Review blocked, failed, or pending commands before retrying the remaining calendar work.",
        "Do not recreate already completed replacement holds without checking provider IDs.",
      ],
      status: "partial",
      title: "Reschedule execution partial",
    })

    expect(
      buildCalendarFollowUpRescheduleExecutionReadModel({
        snapshot: await createLocalCalendarFollowUpRescheduleExecutionPersistence().recordRun(
          buildCalendarFollowUpRescheduleExecutionRun({
            actor: "Sari",
            commandOutcomes: [
              {
                commandId: ready.commands[0]?.commandId ?? "",
                message: "Provider rejected the replacement hold.",
                status: "failed",
              },
            ],
            executedAt: "2026-06-24T09:40:00+03:00",
            mode: "commit",
            plan: ready,
          }),
        ),
      }),
    ).toMatchObject({
      detail: "1 calendar reschedule command(s) failed during provider execution.",
      failedCommandCount: 1,
      nextActions: [
        "Review failed provider outcomes before retrying calendar reschedule execution.",
        "Keep the failed audit fingerprint linked to the retry decision.",
      ],
      status: "failed",
      title: "Reschedule execution failed",
      warningCount: 1,
    })

    expect(
      buildCalendarFollowUpRescheduleExecutionReadModel({
        snapshot: await createLocalCalendarFollowUpRescheduleExecutionPersistence().recordRun(
          buildCalendarFollowUpRescheduleExecutionRun({
            actor: "Sari",
            commandOutcomes: [
              {
                commandId: ready.commands[0]?.commandId ?? "",
                externalId: "calendar-event-019",
                message: "Replacement hold created.",
                status: "created",
              },
            ],
            executedAt: "2026-06-24T09:45:00+03:00",
            mode: "commit",
            plan: ready,
          }),
        ),
      }),
    ).toMatchObject({
      createdCommandCount: 1,
      detail: "1 calendar reschedule command(s) completed successfully.",
      nextActions: ["Keep the execution fingerprint with the customer follow-up timeline for audit review."],
      status: "succeeded",
      title: "Reschedule execution succeeded",
    })
  })

  it("keeps empty, stale, and blocked execution history states explicit", async () => {
    const emptySnapshot = createLocalCalendarFollowUpRescheduleExecutionPersistence().snapshot()

    expect(buildCalendarFollowUpRescheduleExecutionReadModel({ snapshot: emptySnapshot })).toMatchObject({
      detail: "No calendar follow-up reschedule execution audit records have been recorded.",
      nextActions: ["Run a reviewed dry-run execution after a reschedule plan is approved."],
      status: "empty",
      title: "No reschedule execution",
    })

    expect(
      buildCalendarFollowUpRescheduleExecutionReadModel({
        snapshot: {
          ...emptySnapshot,
          pendingActionCount: 2,
          recordCount: 1,
          warningCount: 1,
        },
      }),
    ).toMatchObject({
      detail: "Execution history exists, but no latest execution record is selected.",
      nextActions: ["Rebuild the latest reschedule execution summary from 1 stored record(s)."],
      pendingActionCount: 2,
      status: "stale",
      title: "Reschedule execution history needs refresh",
      warningCount: 1,
    })

    const blockedSnapshot = await createLocalCalendarFollowUpRescheduleExecutionPersistence().recordRun(
      buildCalendarFollowUpRescheduleExecutionRun({
        actor: "Sari",
        executedAt: "2026-06-24T09:30:00+03:00",
        mode: "commit",
        plan: blockedPlan(),
      }),
    )

    expect(buildCalendarFollowUpRescheduleExecutionReadModel({ snapshot: blockedSnapshot })).toMatchObject({
      blockedCommandCount: 1,
      detail: "1 calendar reschedule command(s) are blocked before provider execution.",
      nextActions: [
        "Resolve blocked reschedule commands before any calendar provider side effects.",
        "Keep the execution audit as review evidence for the blocked plan.",
      ],
      status: "blocked",
      title: "Reschedule execution blocked",
    })
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
