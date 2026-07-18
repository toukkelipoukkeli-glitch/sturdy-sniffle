import { describe, expect, it } from "vitest"

import { buildCalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import {
  buildCalendarFollowUpRescheduleProviderOutcomeHistoryExportSummary,
  summarizeCalendarFollowUpRescheduleProviderOutcomeHistory,
} from "./calendarFollowUpRescheduleProviderOutcomeHistorySummary"
import {
  buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
  CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
  type CalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
} from "./calendarFollowUpRescheduleProviderOutcomePersistence"
import { buildCalendarFollowUpRescheduleProviderCommandOutcomes } from "./calendarFollowUpRescheduleProviderOutcomes"
import { buildCalendarFollowUpReschedulePlan, type CalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule provider outcome history summary", () => {
  it("summarizes empty provider outcome history with deterministic export copy", () => {
    const summary = summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
      records: [],
    })

    expect(summary).toMatchObject({
      commandOutcomeCount: 0,
      createdOutcomeCount: 0,
      expectedOutcomeCount: 0,
      failedOutcomeCount: 0,
      historyVersion: "calendar-follow-up-reschedule-provider-outcome-history-summary.v1",
      missingOutcomeCount: 0,
      nextActions: ["Record reviewed local calendar provider outcomes before commit execution."],
      outcomeStatusCounts: {},
      planStatusCounts: {},
      readModelStatusCounts: {},
      recentOutcomeBatches: [],
      rfqIds: [],
      severity: "neutral",
      status: "empty",
      taskIds: [],
      title: "No calendar provider outcome history",
      totalOutcomeBatches: 0,
      unexpectedOutcomeCount: 0,
      warningCount: 0,
    })
    expect(summary.latestOutcomeBatch).toBeUndefined()
    expect(summary.exportText).toContain("Calendar provider outcome history: empty")
    expect(summary.exportText).toContain("RFQs: none")
    expect(
      buildCalendarFollowUpRescheduleProviderOutcomeHistoryExportSummary({
        persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
        records: [],
      }),
    ).toBe(summary.exportText)
  })

  it("distinguishes existing empty provider outcome batches from absent history", () => {
    const record = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes: [],
      plan: emptyPlan(),
      recordedAt: "2026-06-24T09:10:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })
    const summary = summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
      records: [record],
    })

    expect(summary).toMatchObject({
      commandOutcomeCount: 0,
      detail: "Latest provider outcome batch for rfq-019 has no expected provider outcomes.",
      nextActions: ["Create a reviewed calendar reschedule plan before recording provider outcomes."],
      severity: "neutral",
      status: "empty",
      title: "Calendar provider outcome history empty",
      totalOutcomeBatches: 1,
    })
    expect(summary.latestOutcomeBatch).toMatchObject({
      outcomeFingerprint: record.outcomeFingerprint,
      readModelStatus: "empty",
      recordedAt: "2026-06-24T06:10:00.000Z",
    })
    expect(summary.exportText).toContain(
      `Latest provider outcome batch: empty 2026-06-24T06:10:00.000Z ${record.outcomeFingerprint}`,
    )
    expect(summary.exportText).not.toContain("No calendar provider outcome batches have been recorded yet.")
  })

  it("summarizes ready local provider outcome batches for execution audits", () => {
    const plan = readyPlan()
    const record = readyRecord(plan, "2026-06-24T09:35:00+03:00")
    const summary = summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
      records: [record],
    })

    expect(summary).toMatchObject({
      commandOutcomeCount: 1,
      createdOutcomeCount: 1,
      expectedOutcomeCount: 1,
      failedOutcomeCount: 0,
      missingOutcomeCount: 0,
      nextActions: ["Use the latest local provider outcomes when recording the calendar reschedule execution audit."],
      outcomeStatusCounts: { created: 1 },
      planStatusCounts: { ready: 1 },
      readModelStatusCounts: { ready: 1 },
      rfqIds: ["rfq-019"],
      severity: "healthy",
      status: "ready",
      taskIds: ["follow-up-rfq-019"],
      totalOutcomeBatches: 1,
      unexpectedOutcomeCount: 0,
      warningCount: 1,
    })
    expect(summary.latestOutcomeBatch).toMatchObject({
      commandOutcomeCount: 1,
      createdOutcomeCount: 1,
      failedCommandIds: [],
      outcomeFingerprint: record.outcomeFingerprint,
      planStatus: "ready",
      readModelStatus: "ready",
      recordedAt: "2026-06-24T06:35:00.000Z",
      recordedBy: "sales",
      rfqId: "rfq-019",
      taskIds: ["follow-up-rfq-019"],
    })
    expect(summary.commandSummaries).toEqual([
      {
        commandId: commandIdFor(plan),
        latestRecordedAt: "2026-06-24T06:35:00.000Z",
        outcomeCount: 1,
        statuses: ["created"],
        warningCount: 1,
      },
    ])
    expect(summary.exportText).toContain(`Latest provider outcome batch: ready 2026-06-24T06:35:00.000Z ${record.outcomeFingerprint}`)
    expect(summary.exportText).toContain(`- ${commandIdFor(plan)} statuses created latest 2026-06-24T06:35:00.000Z batches 1 warnings 1`)
  })

  it("sorts newest outcome batches first and surfaces failed batches for review", () => {
    const plan = readyPlan()
    const ready = readyRecord(plan, "2026-06-24T09:35:00+03:00")
    const failed = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
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

    const summary = summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
      records: [ready, failed],
    })

    expect(summary).toMatchObject({
      commandOutcomeCount: 2,
      createdOutcomeCount: 1,
      expectedOutcomeCount: 2,
      failedOutcomeCount: 1,
      missingOutcomeCount: 0,
      outcomeStatusCounts: { created: 1, failed: 1 },
      planStatusCounts: { ready: 2 },
      readModelStatusCounts: { needs_review: 1, ready: 1 },
      severity: "critical",
      status: "needs_review",
      totalOutcomeBatches: 2,
      unexpectedOutcomeCount: 0,
      warningCount: 2,
    })
    expect(summary.latestOutcomeBatch?.outcomeFingerprint).toBe(failed.outcomeFingerprint)
    expect(summary.latestOutcomeBatch?.failedCommandIds).toEqual([commandIdFor(plan)])
    expect(summary.recentOutcomeBatches.map((batch) => batch.outcomeFingerprint)).toEqual([
      failed.outcomeFingerprint,
      ready.outcomeFingerprint,
    ])
    expect(summary.commandSummaries).toEqual([
      {
        commandId: commandIdFor(plan),
        latestRecordedAt: "2026-06-24T06:45:00.000Z",
        outcomeCount: 2,
        statuses: ["created", "failed"],
        warningCount: 2,
      },
    ])
    expect(summary.exportText).toContain("Calendar provider outcome history: needs_review")
    expect(summary.exportText).toContain("Review failed, missing, or unexpected calendar provider outcomes before commit execution.")
  })

  it("keeps partial mixed-command batches distinct from fully blocked history", () => {
    const plan = mixedPlan()
    const record = buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
      commandOutcomes: readyCommandOutcomes(plan),
      plan,
      recordedAt: "2026-06-24T09:50:00+03:00",
      recordedBy: "sales",
      rfqId: "rfq-019",
    })

    const summary = summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
      records: [record],
    })

    expect(summary).toMatchObject({
      createdOutcomeCount: 1,
      expectedOutcomeCount: 1,
      planStatusCounts: { mixed: 1 },
      readModelStatusCounts: { partial: 1 },
      severity: "warning",
      status: "partial",
    })
    expect(summary.latestOutcomeBatch).toMatchObject({
      blockedCommandCount: 1,
      planStatus: "mixed",
      readModelStatus: "partial",
      taskIds: ["follow-up-rfq-019", "follow-up-rfq-019-blocked"],
    })
    expect(summary.nextActions).toEqual([
      "Resolve partial calendar provider outcomes before committing the reschedule execution.",
    ])
  })

  it("returns cloned public summaries", () => {
    const plan = readyPlan()
    const record = readyRecord(plan, "2026-06-24T09:35:00+03:00")
    const snapshot: Parameters<typeof summarizeCalendarFollowUpRescheduleProviderOutcomeHistory>[0] = {
      persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
      records: [record],
    }
    const firstSummary = summarizeCalendarFollowUpRescheduleProviderOutcomeHistory(snapshot)

    firstSummary.nextActions.push("Mutated action")
    firstSummary.latestOutcomeBatch?.taskIds.push("mutated-task")
    firstSummary.recentOutcomeBatches[0]?.failedCommandIds.push("mutated-command")
    firstSummary.commandSummaries[0]?.statuses.push("failed")

    const secondSummary = summarizeCalendarFollowUpRescheduleProviderOutcomeHistory(snapshot)

    expect(secondSummary.nextActions).toEqual([
      "Use the latest local provider outcomes when recording the calendar reschedule execution audit.",
    ])
    expect(secondSummary.latestOutcomeBatch?.taskIds).toEqual(["follow-up-rfq-019"])
    expect(secondSummary.recentOutcomeBatches[0]?.failedCommandIds).toEqual([])
    expect(secondSummary.commandSummaries[0]?.statuses).toEqual(["created"])
  })

  it("rejects unsupported restored persistence versions and malformed records", () => {
    const plan = readyPlan()
    const record = readyRecord(plan, "2026-06-24T09:35:00+03:00")

    expect(() =>
      summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
        persistenceVersion: "unsupported",
        records: [],
      } as unknown as Parameters<typeof summarizeCalendarFollowUpRescheduleProviderOutcomeHistory>[0]),
    ).toThrow("calendar reschedule provider outcome persistence version is not supported")

    expect(() =>
      summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
        persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
        records: [
          {
            ...record,
            persistenceVersion: "unsupported",
          } as unknown as CalendarFollowUpRescheduleProviderOutcomePersistenceRecord,
        ],
      }),
    ).toThrow("calendar reschedule provider outcome persistence version is not supported")

    expect(() =>
      summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
        persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
        records: [
          {
            ...record,
            commandOutcomeCount: 2,
          },
        ],
      }),
    ).toThrow("record.commandOutcomeCount must match normalized provider outcome count")

    expect(() =>
      summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
        persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
        records: [
          {
            ...record,
            createdOutcomeCount: 0,
          },
        ],
      }),
    ).toThrow("record outcome counts must match normalized provider outcome statuses")

    expect(() =>
      summarizeCalendarFollowUpRescheduleProviderOutcomeHistory({
        persistenceVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
        records: [
          {
            ...record,
            failedOutcomeCount: 1,
          },
        ],
      }),
    ).toThrow("record outcome counts must match normalized provider outcome statuses")
  })
})

function readyRecord(plan: CalendarFollowUpReschedulePlan, recordedAt: string) {
  return buildCalendarFollowUpRescheduleProviderOutcomePersistenceRecord({
    commandOutcomes: readyCommandOutcomes(plan),
    plan,
    recordedAt,
    recordedBy: "sales",
    rfqId: "rfq-019",
  })
}

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

function emptyPlan(): CalendarFollowUpReschedulePlan {
  return buildCalendarFollowUpReschedulePlan({
    rfqId: "rfq-019",
    tasks: [],
  })
}

function mixedPlan(): CalendarFollowUpReschedulePlan {
  const plan = readyPlan()
  const readyCommand = plan.commands[0]
  if (!readyCommand) {
    throw new Error("Expected ready calendar reschedule command")
  }
  const blockedCommand = {
    actionKey: "offer-offer-019-blocked-follow-up",
    blockerLabels: ["Terminal customer reply"],
    commandId: "calendar-reschedule:rfq-019:follow-up-rfq-019-blocked:terminal",
    detail: readyCommand.detail,
    mode: "blocked" as const,
    nextOperatorMessage: "Keep the existing hold closed; the customer has already reached a terminal offer state.",
    offerId: readyCommand.offerId,
    previousDueAt: readyCommand.previousDueAt,
    provider: "calendar" as const,
    rfqId: readyCommand.rfqId,
    status: "blocked" as const,
    taskId: "follow-up-rfq-019-blocked",
    title: "Reschedule blocked",
  }

  return {
    commands: [readyCommand, blockedCommand],
    status: "mixed",
    summary: {
      blockedCount: 1,
      commandCount: 2,
      readyCount: 1,
    },
  }
}

function followUpStatus() {
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
