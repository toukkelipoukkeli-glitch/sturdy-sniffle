import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildCalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import {
  buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
  CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
  createLocalCalendarFollowUpRescheduleProviderOutcomePersistence,
  fingerprintCalendarFollowUpRescheduleProviderOutcomes,
  type CalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
} from "./calendarFollowUpRescheduleProviderOutcomePersistence"
import { buildCalendarFollowUpRescheduleProviderCommandOutcomes } from "./calendarFollowUpRescheduleProviderOutcomes"
import { buildCalendarFollowUpReschedulePlan, type CalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule provider outcome persistence", () => {
  it("records normalized local provider outcome batches with deterministic status counts", async () => {
    const plan = readyPlan()
    const commandOutcomes = readyCommandOutcomes(plan)

    const record = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes,
      plan,
      recordedAt: "2026-06-24T09:35:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })

    expect(record).toMatchObject({
      blockedCommandCount: 0,
      commandOutcomeCount: 1,
      createdOutcomeCount: 1,
      expectedOutcomeCount: 1,
      failedOutcomeCount: 0,
      missingOutcomeCount: 0,
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
      planStatus: "ready",
      readModelStatus: "ready",
      recordedAt: "2026-06-24T06:35:00.000Z",
      recordedBy: "sales",
      rfqId: "rfq-019",
      taskIds: ["follow-up-rfq-019"],
      unexpectedOutcomeCount: 0,
      warningCount: 1,
    })
    expect(record.readModel).toMatchObject({
      status: "ready",
      title: "Calendar provider outcomes ready",
    })
    expect(record.outcomeFingerprint).toBe(
      fingerprintCalendarFollowUpRescheduleProviderOutcomes({
        commandOutcomes,
        plan,
        rfqId: "rfq-019",
      }),
    )
    expect(record.outcomeFingerprint).toMatch(/^calendar-follow-up-reschedule-provider-outcomes-[0-9a-f]{32}$/)

    const adapter = createLocalCalendarFollowUpRescheduleProviderOutcomePersistence()
    const snapshot = await adapter.recordOutcomes({
      commandOutcomes,
      plan,
      recordedAt: "2026-06-24T09:35:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })

    expect(snapshot).toMatchObject({
      commandOutcomeCount: 1,
      createdOutcomeCount: 1,
      expectedOutcomeCount: 1,
      failedOutcomeCount: 0,
      missingOutcomeCount: 0,
      outcomeStatusCounts: { created: 1 },
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
      planStatusCounts: { ready: 1 },
      readyOutcomeFingerprints: [record.outcomeFingerprint],
      readModelStatusCounts: { ready: 1 },
      recordCount: 1,
      reviewOutcomeFingerprints: [],
      rfqIds: ["rfq-019"],
      taskIds: ["follow-up-rfq-019"],
      warningCount: 1,
    })
    expect(snapshot.latestRecord?.outcomeFingerprint).toBe(record.outcomeFingerprint)
    expect(snapshot.records[0]?.commandOutcomes.map((outcome) => outcome.commandId)).toEqual([
      plan.commands[0]?.commandId,
    ])
  })

  it("isolates snapshots from later plan, outcome, and snapshot mutations", async () => {
    const plan = readyPlan()
    const commandOutcomes = readyCommandOutcomes(plan)
    const adapter = createLocalCalendarFollowUpRescheduleProviderOutcomePersistence()

    await adapter.recordOutcomes({
      commandOutcomes,
      plan,
      recordedAt: "2026-06-24T09:35:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })

    plan.commands[0]!.title = "Mutated reschedule"
    commandOutcomes[0]!.warnings?.push("Mutated warning")
    const firstSnapshot = adapter.snapshot()
    firstSnapshot.records[0]!.commandOutcomes[0]!.warnings?.push("Snapshot mutation")
    firstSnapshot.records[0]!.readModel.nextActions.push("Snapshot action")

    const secondSnapshot = adapter.snapshot()

    expect(secondSnapshot.records[0]?.plan.commands[0]?.title).toBe("Reschedule ready")
    expect(secondSnapshot.records[0]?.commandOutcomes[0]?.warnings).toEqual([
      "Local adapter recorded the reschedule command; no external Calendar connector call was made.",
    ])
    expect(secondSnapshot.records[0]?.readModel.nextActions).toEqual([
      "Record the local provider outcomes in the calendar reschedule execution audit.",
    ])
  })

  it("dedupes seeded outcome records by fingerprint using the newest record", () => {
    const plan = readyPlan()
    const commandOutcomes = readyCommandOutcomes(plan)
    const readyRecord = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes,
      plan,
      recordedAt: "2026-06-24T09:35:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })
    const newerReadyRecord = {
      ...readyRecord,
      recordedAt: "2026-06-24T06:40:00.000Z",
      recordedBy: "ops",
    } satisfies CalendarFollowUpRescheduleProviderOutcomePersistenceRecord
    const failedRecord = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes: [
        {
          commandId: commandIdFor(plan),
          message: "Provider rejected the replacement hold.",
          status: "failed",
          warnings: ["Retry after calendar conflict review."],
        },
      ],
      plan,
      recordedAt: "2026-06-24T09:45:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })

    const adapter = createLocalCalendarFollowUpRescheduleProviderOutcomePersistence({
      initialSnapshot: {
        records: [readyRecord, newerReadyRecord, failedRecord],
      },
    })

    expect(adapter.snapshot()).toMatchObject({
      commandOutcomeCount: 2,
      createdOutcomeCount: 1,
      failedOutcomeCount: 1,
      latestRecord: {
        outcomeFingerprint: failedRecord.outcomeFingerprint,
        readModelStatus: "needs_review",
      },
      outcomeStatusCounts: { created: 1, failed: 1 },
      readModelStatusCounts: { needs_review: 1, ready: 1 },
      recordCount: 2,
      reviewOutcomeFingerprints: [failedRecord.outcomeFingerprint],
      warningCount: 2,
    })
    expect(adapter.snapshot().records.map((record) => record.outcomeFingerprint)).toEqual([
      failedRecord.outcomeFingerprint,
      newerReadyRecord.outcomeFingerprint,
    ])
    expect(adapter.snapshot().records[1]?.recordedBy).toBe("ops")
  })

  it("rejects malformed command outcomes and restored records", () => {
    const plan = readyPlan()
    const commandOutcomes = readyCommandOutcomes(plan)
    const firstOutcome = commandOutcomes[0]
    if (!firstOutcome) {
      throw new Error("Expected a calendar provider command outcome")
    }

    expect(() =>
      buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
        commandOutcomes: [firstOutcome, firstOutcome],
        plan,
        recordedAt: "2026-06-24T09:35:00+03:00",
        recordedBy: "sales",
        rfqId: "rfq-019",
      }),
    ).toThrow("duplicate calendar reschedule provider command outcome")

    expect(() =>
      buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
        commandOutcomes,
        plan: {
          ...plan,
          summary: {
            blockedCount: 0,
            commandCount: 2,
            readyCount: 1,
          },
        },
        recordedAt: "2026-06-24T09:35:00+03:00",
        recordedBy: "sales",
        rfqId: "rfq-019",
      }),
    ).toThrow("plan.summary.commandCount must match normalized command count")

    expect(() =>
      buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
        commandOutcomes,
        plan,
        recordedAt: "2026-06-24T09:35:00+03:00",
        recordedBy: "sales",
        rfqId: "rfq-other",
      }),
    ).toThrow("plan.commands[0].rfqId must match rfqId")

    expect(() =>
      createLocalCalendarFollowUpRescheduleProviderOutcomePersistence({
        initialSnapshot: {
          records: [
            ({
              ...buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
                commandOutcomes,
                plan,
                recordedAt: "2026-06-24T09:35:00+03:00",
                recordedBy: "sales",
                rfqId: "rfq-019",
              }),
              persistenceVersion: "unsupported",
            } as unknown as CalendarFollowUpRescheduleProviderOutcomePersistenceRecord),
          ],
        },
      }),
    ).toThrow("calendar reschedule provider outcome persistence version is not supported")
  })
})

function readyCommandOutcomes(plan: CalendarFollowUpReschedulePlan) {
  const reviewedExecution = buildCalendarFollowUpRescheduleExecutionRun({
    actor: "Sari",
    executedAt: "2026-06-24T09:30:00+03:00",
    mode: "dry_run",
    plan,
  })
  return buildCalendarFollowUpRescheduleProviderCommandOutcomes({ plan, reviewedExecution })
}

function readyPlan(): CalendarFollowUpReschedulePlan {
  return buildCalendarFollowUpReschedulePlan({
    rfqId: "rfq-019",
    tasks: followUpStatus().tasks,
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

function commandIdFor(plan: CalendarFollowUpReschedulePlan): string {
  const commandId = plan.commands[0]?.commandId
  if (!commandId) {
    throw new Error("Expected ready calendar reschedule command")
  }
  return commandId
}
