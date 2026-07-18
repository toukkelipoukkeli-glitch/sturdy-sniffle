import { describe, expect, it } from "vitest"

import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import { buildCalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import {
  buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
  CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
  createConvexCalendarFollowUpRescheduleProviderOutcomeReader,
  createLocalCalendarFollowUpRescheduleProviderOutcomePersistence,
  createLocalCalendarFollowUpRescheduleProviderOutcomeReader,
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

  it("lists restored local outcome records with RFQ filters, limits, and cloned snapshots", async () => {
    const rfq019Plan = readyPlan()
    const rfq020Plan = readyPlanFor({ offerId: "offer-020", rfqId: "rfq-020" })
    const rfq019Record = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes: readyCommandOutcomes(rfq019Plan),
      plan: rfq019Plan,
      recordedAt: "2026-06-24T09:35:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })
    const rfq020Record = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes: readyCommandOutcomes(rfq020Plan),
      plan: rfq020Plan,
      recordedAt: "2026-06-24T09:45:00+03:00",
      recordedBy: "ops",
      rfqId: "rfq-020",
    })

    const reader = createLocalCalendarFollowUpRescheduleProviderOutcomeReader({
      initialSnapshot: {
        records: [rfq019Record, rfq020Record],
      },
    })

    const filtered = await reader.listOutcomes({ limit: 1, rfqId: " rfq-019 " })

    expect(filtered).toMatchObject({
      commandOutcomeCount: 1,
      recordCount: 1,
      rfqIds: ["rfq-019"],
      taskIds: ["follow-up-rfq-019"],
    })
    expect(filtered.records[0]?.outcomeFingerprint).toBe(rfq019Record.outcomeFingerprint)

    filtered.records[0]?.taskIds.push("mutated-task")
    expect(reader.snapshot().records[0]?.taskIds).toEqual(["follow-up-rfq-019"])

    await expect(reader.listOutcomes({ limit: 0 })).resolves.toMatchObject({
      recordCount: 0,
      records: [],
    })
  })

  it("rejects invalid local outcome read filters", async () => {
    const reader = createLocalCalendarFollowUpRescheduleProviderOutcomeReader()

    await expect(reader.listOutcomes({ rfqId: " " })).rejects.toThrow("rfqId must be a non-empty string")
    await expect(reader.listOutcomes({ limit: -1 })).rejects.toThrow("limit must be a non-negative safe integer")
  })

  it("reads Convex provider outcome records with deterministic args and local filtering", async () => {
    const rfq019Plan = readyPlan()
    const rfq020Plan = readyPlanFor({ offerId: "offer-020", rfqId: "rfq-020" })
    const rfq019Record = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes: readyCommandOutcomes(rfq019Plan),
      plan: rfq019Plan,
      recordedAt: "2026-06-24T09:35:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })
    const rfq020Record = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes: readyCommandOutcomes(rfq020Plan),
      plan: rfq020Plan,
      recordedAt: "2026-06-24T09:45:00+03:00",
      recordedBy: "ops",
      rfqId: "rfq-020",
    })
    const queryArgs: Record<string, unknown>[] = []

    const reader = createConvexCalendarFollowUpRescheduleProviderOutcomeReader({
      queryRef: "calendarProviderOutcomeHistory",
      runQuery: async (queryRef, args) => {
        expect(queryRef).toBe("calendarProviderOutcomeHistory")
        queryArgs.push(args)
        return [rfq020Record, rfq019Record]
      },
    })

    const snapshot = await reader.listOutcomes({ limit: 1, rfqId: "rfq-019" })

    expect(queryArgs).toEqual([{ limit: 1, rfqId: "rfq-019" }])
    expect(snapshot).toMatchObject({
      recordCount: 1,
      rfqIds: ["rfq-019"],
    })
    expect(snapshot.records[0]?.outcomeFingerprint).toBe(rfq019Record.outcomeFingerprint)

    snapshot.records[0]?.taskIds.push("mutated-task")
    expect(reader.snapshot().records[0]?.taskIds).toEqual(["follow-up-rfq-019"])
  })

  it("falls back to local provider outcome records when Convex read records are malformed", async () => {
    const fallbackPlan = readyPlan()
    const fallbackRecord = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes: readyCommandOutcomes(fallbackPlan),
      plan: fallbackPlan,
      recordedAt: "2026-06-24T09:35:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })
    const queryErrors: { args: Record<string, unknown>; message: string }[] = []

    const reader = createConvexCalendarFollowUpRescheduleProviderOutcomeReader({
      fallback: createLocalCalendarFollowUpRescheduleProviderOutcomeReader({
        initialSnapshot: {
          records: [fallbackRecord],
        },
      }),
      onQueryError: (error, args) => {
        queryErrors.push({ args, message: error instanceof Error ? error.message : String(error) })
        throw new Error("observer failure should not block fallback")
      },
      queryRef: "calendarProviderOutcomeHistory",
      runQuery: async () => ({ records: [fallbackRecord] }),
    })

    const snapshot = await reader.listOutcomes({ rfqId: "rfq-019" })

    expect(queryErrors).toEqual([
      {
        args: { rfqId: "rfq-019" },
        message: "calendar provider outcome query must return an array",
      },
    ])
    expect(snapshot).toMatchObject({
      recordCount: 1,
      rfqIds: ["rfq-019"],
    })
    expect(snapshot.records[0]?.outcomeFingerprint).toBe(fallbackRecord.outcomeFingerprint)
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
  return readyPlanFor({ offerId: "offer-019", rfqId: "rfq-019" })
}

function readyPlanFor({ offerId, rfqId }: { offerId: string; rfqId: string }): CalendarFollowUpReschedulePlan {
  return buildCalendarFollowUpReschedulePlan({
    rfqId,
    tasks: followUpStatus({ offerId, rfqId }).tasks,
  })
}

function followUpStatus({
  offerId = "offer-019",
  replySync,
  rfqId = "rfq-019",
}: {
  offerId?: string
  replySync?: GmailOfferReplySyncResult
  rfqId?: string
} = {}) {
  return buildCalendarFollowUpStatus({
    actions: [
      buildWorkspaceAction({
        actor: "Sari",
        followUpDueAt: "2026-06-20T09:00:00+03:00",
        kind: "follow_up_created",
        occurredAt: "2026-06-20T10:10:00+03:00",
        offerId,
        rfqId,
      }),
    ],
    now: "2026-06-24T09:00:00+03:00",
    offerId,
    replySync,
    rfqId,
  })
}

function commandIdFor(plan: CalendarFollowUpReschedulePlan): string {
  const commandId = plan.commands[0]?.commandId
  if (!commandId) {
    throw new Error("Expected ready calendar reschedule command")
  }
  return commandId
}
