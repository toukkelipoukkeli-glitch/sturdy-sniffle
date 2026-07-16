import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildCalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import {
  createLocalCalendarFollowUpRescheduleExecutionPersistence,
  CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION,
} from "./calendarFollowUpRescheduleExecutionPersistence"
import { buildCalendarFollowUpReschedulePlan, type CalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import type { CalendarFollowUpRescheduleCommand } from "./calendarFollowUpReschedulePlan"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule execution persistence", () => {
  it("records dry-run calendar reschedule execution summaries without command payloads", async () => {
    const plan = readyPlan()
    const run = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "dry_run",
      plan,
    })
    const adapter = createLocalCalendarFollowUpRescheduleExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      pendingActionCount: 1,
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION,
      planStatusCounts: { ready: 1 },
      recordCount: 1,
      rfqIds: ["rfq-019"],
      statusCounts: { prepared: 1 },
      taskIds: ["follow-up-rfq-019"],
      warningCount: 0,
    })
    expect(snapshot.latestRun).toMatchObject({
      actor: "Sari",
      commandCount: 1,
      executedAt: "2026-06-24T06:30:00.000Z",
      executionFingerprint: run.executionFingerprint,
      executionVersion: run.executionVersion,
      mode: "dry_run",
      pendingActionCount: 1,
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_PERSISTENCE_VERSION,
      planStatus: "ready",
      preparedCommandCount: 1,
      rfqIds: ["rfq-019"],
      status: "prepared",
      taskIds: ["follow-up-rfq-019"],
      warningCount: 0,
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
  })

  it("records committed and partial execution counts sorted newest first", async () => {
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
    const adapter = createLocalCalendarFollowUpRescheduleExecutionPersistence()
    const pendingRun = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "commit",
      plan: ready,
    })
    const partialRun = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      commandOutcomes: [
        {
          commandId: ready.commands[0]?.commandId ?? "",
          externalId: "calendar-event-019",
          message: "Replacement hold created.",
          status: "created",
          warnings: ["Provider normalized reminder minutes."],
        },
      ],
      executedAt: "2026-06-24T09:35:00+03:00",
      mode: "commit",
      plan: mixedPlan,
    })

    await adapter.recordRun(pendingRun)
    const snapshot = await adapter.recordRun(partialRun)

    expect(snapshot.recordCount).toBe(2)
    expect(snapshot.records.map((record) => record.executionFingerprint)).toEqual([
      partialRun.executionFingerprint,
      pendingRun.executionFingerprint,
    ])
    expect(snapshot.statusCounts).toEqual({ partial: 1, pending: 1 })
    expect(snapshot.planStatusCounts).toEqual({ mixed: 1, ready: 1 })
    expect(snapshot.latestRun).toMatchObject({
      blockedCommandCount: 1,
      commandCount: 2,
      createdCommandCount: 1,
      status: "partial",
      warningCount: 1,
    })
    expect(snapshot.pendingActionCount).toBe(2)
    expect(snapshot.warningCount).toBe(1)
  })

  it("deduplicates seeded execution records by fingerprint using the newest record", async () => {
    const adapter = createLocalCalendarFollowUpRescheduleExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded calendar reschedule execution record")
    }

    const seededAdapter = createLocalCalendarFollowUpRescheduleExecutionPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-06-24T06:35:00.000Z",
            pendingActionCount: 0,
            warningCount: 2,
          },
        ],
      },
    })

    const snapshot = seededAdapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.pendingActionCount).toBe(0)
    expect(snapshot.warningCount).toBe(2)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-06-24T06:35:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      warningCount: 2,
    })
  })

  it("returns cloned execution snapshots", async () => {
    const run = buildReadyDryRun()
    const adapter = createLocalCalendarFollowUpRescheduleExecutionPersistence()

    const snapshot = await adapter.recordRun(run)
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.rfqIds.push("mutated-rfq")
    snapshot.taskIds.push("mutated-task")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.actor).toBe("Sari")
    expect(clonedSnapshot.rfqIds).toEqual(["rfq-019"])
    expect(clonedSnapshot.taskIds).toEqual(["follow-up-rfq-019"])
  })

  it("rejects invalid seeded execution records", async () => {
    const adapter = createLocalCalendarFollowUpRescheduleExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded calendar reschedule execution record")
    }

    expect(() =>
      createLocalCalendarFollowUpRescheduleExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executedAt: "tomorrow" }],
        },
      }),
    ).toThrow("executedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalCalendarFollowUpRescheduleExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: -1 }],
        },
      }),
    ).toThrow("warningCount must be a non-negative safe integer")
    expect(() =>
      createLocalCalendarFollowUpRescheduleExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 2 }],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status command counts")
    expect(() =>
      createLocalCalendarFollowUpRescheduleExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, rfqIds: [" "] }],
        },
      }),
    ).toThrow("rfqIds[0] is required")
    expect(() =>
      createLocalCalendarFollowUpRescheduleExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, status: "needs_review" as never }],
        },
      }),
    ).toThrow("status is not a supported calendar reschedule execution status")
  })
})

function buildReadyDryRun() {
  return buildCalendarFollowUpRescheduleExecutionRun({
    actor: "Sari",
    executedAt: "2026-06-24T09:30:00+03:00",
    mode: "dry_run",
    plan: readyPlan(),
  })
}

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
