import { describe, expect, it } from "vitest"

import { buildCalendarFollowUpStatus } from "./calendarFollowUpStatus"
import { buildCalendarFollowUpRescheduleExecutionRun } from "./calendarFollowUpRescheduleExecution"
import {
  buildCalendarFollowUpRescheduleExecutionHistoryExportSummary,
  CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_HISTORY_SUMMARY_VERSION,
  summarizeCalendarFollowUpRescheduleExecutionHistory,
} from "./calendarFollowUpRescheduleExecutionHistorySummary"
import { createLocalCalendarFollowUpRescheduleExecutionPersistence } from "./calendarFollowUpRescheduleExecutionPersistence"
import { buildCalendarFollowUpReschedulePlan, type CalendarFollowUpReschedulePlan } from "./calendarFollowUpReschedulePlan"
import type { CalendarFollowUpRescheduleCommand } from "./calendarFollowUpReschedulePlan"
import { buildWorkspaceAction } from "./workspaceActions"

describe("calendar follow-up reschedule execution history summary", () => {
  it("keeps empty execution history actionable", () => {
    const snapshot = createLocalCalendarFollowUpRescheduleExecutionPersistence().snapshot()

    expect(summarizeCalendarFollowUpRescheduleExecutionHistory(snapshot)).toEqual({
      actionItems: [
        {
          detail: "Create a reviewed dry-run execution after a calendar reschedule plan is ready.",
          key: "prepare-calendar-reschedule-dry-run",
          label: "Prepare dry-run",
          severity: "info",
        },
      ],
      commandCount: 0,
      latestRun: undefined,
      operatorSummary: "No calendar reschedule execution history has been recorded yet.",
      pendingActionCount: 0,
      recentRuns: [],
      rfqIds: [],
      severity: "info",
      status: "empty",
      summaryVersion: CALENDAR_FOLLOW_UP_RESCHEDULE_EXECUTION_HISTORY_SUMMARY_VERSION,
      taskIds: [],
      totalRuns: 0,
      warningCount: 0,
    })
  })

  it("summarizes prepared dry-run executions for operator review", async () => {
    const snapshot = await createLocalCalendarFollowUpRescheduleExecutionPersistence().recordRun(
      buildCalendarFollowUpRescheduleExecutionRun({
        actor: "Sari",
        executedAt: "2026-06-24T09:30:00+03:00",
        mode: "dry_run",
        plan: readyPlan(),
      }),
    )

    expect(summarizeCalendarFollowUpRescheduleExecutionHistory(snapshot)).toMatchObject({
      actionItems: [
        expect.objectContaining({ key: "review-calendar-reschedule-dry-run", severity: "info" }),
        expect.objectContaining({ key: "keep-calendar-writes-disabled", severity: "info" }),
      ],
      commandCount: 1,
      operatorSummary:
        "Calendar reschedule execution history has 1 execution run; latest dry-run prepared 1 command(s) for review.",
      pendingActionCount: 1,
      rfqIds: ["rfq-019"],
      severity: "info",
      status: "ready_for_review",
      taskIds: ["follow-up-rfq-019"],
      totalRuns: 1,
    })
  })

  it("distinguishes pending, attention, and completed execution outcomes", async () => {
    const ready = readyPlan()
    const readyCommand = ready.commands[0]
    if (!readyCommand) {
      throw new Error("Expected ready calendar reschedule command")
    }
    const blockedCommand: CalendarFollowUpRescheduleCommand = {
      ...readyCommand,
      blockerLabels: ["Terminal customer reply"],
      commandId: `${readyCommand.commandId}:blocked`,
      mode: "blocked",
      status: "blocked",
      title: "Reschedule blocked",
    }
    const mixedPlan: CalendarFollowUpReschedulePlan = {
      commands: [blockedCommand, readyCommand],
      status: "mixed",
      summary: {
        blockedCount: 1,
        commandCount: 2,
        readyCount: 1,
      },
    }

    expect(
      summarizeCalendarFollowUpRescheduleExecutionHistory(
        await createLocalCalendarFollowUpRescheduleExecutionPersistence().recordRun(
          buildCalendarFollowUpRescheduleExecutionRun({
            actor: "Sari",
            executedAt: "2026-06-24T09:30:00+03:00",
            mode: "commit",
            plan: ready,
          }),
        ),
      ),
    ).toMatchObject({
      actionItems: [expect.objectContaining({ key: "record-calendar-provider-outcomes" })],
      operatorSummary:
        "Calendar reschedule execution history has 1 execution run; latest run is waiting for 1 provider outcome(s).",
      severity: "info",
      status: "pending_provider",
    })

    expect(
      summarizeCalendarFollowUpRescheduleExecutionHistory(
        await createLocalCalendarFollowUpRescheduleExecutionPersistence().recordRun(
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
      ),
    ).toMatchObject({
      actionItems: [
        expect.objectContaining({ key: "review-calendar-reschedule-blockers", severity: "warning" }),
        expect.objectContaining({ key: "retain-calendar-reschedule-history", severity: "info" }),
      ],
      operatorSummary:
        "Calendar reschedule execution history has 1 execution run; latest run needs operator attention before retry or commit.",
      severity: "warning",
      status: "needs_attention",
    })

    expect(
      summarizeCalendarFollowUpRescheduleExecutionHistory(
        await createLocalCalendarFollowUpRescheduleExecutionPersistence().recordRun(
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
            executedAt: "2026-06-24T09:40:00+03:00",
            mode: "commit",
            plan: ready,
          }),
        ),
      ),
    ).toMatchObject({
      actionItems: [expect.objectContaining({ key: "retain-successful-calendar-execution", severity: "healthy" })],
      operatorSummary:
        "Calendar reschedule execution history has 1 execution run; latest run completed 1 provider command(s).",
      severity: "healthy",
      status: "completed",
    })
  })

  it("sorts and clones recent runs while exporting deterministic operator copy", async () => {
    const adapter = createLocalCalendarFollowUpRescheduleExecutionPersistence()
    const olderRun = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:30:00+03:00",
      mode: "dry_run",
      plan: readyPlan(),
    })
    const newerRun = buildCalendarFollowUpRescheduleExecutionRun({
      actor: "Sari",
      executedAt: "2026-06-24T09:45:00+03:00",
      mode: "commit",
      plan: readyPlan(),
    })
    await adapter.recordRun(olderRun)
    await adapter.recordRun(newerRun)

    const snapshot = adapter.snapshot()
    const summary = summarizeCalendarFollowUpRescheduleExecutionHistory(snapshot)
    summary.recentRuns[0]!.rfqIds.push("mutated-rfq")
    const staleSnapshot = {
      ...snapshot,
      latestRun: snapshot.records[1],
      records: [...snapshot.records].reverse(),
    }
    const staleSummary = summarizeCalendarFollowUpRescheduleExecutionHistory(staleSnapshot)

    expect(summary.latestRun?.executionFingerprint).toBe(newerRun.executionFingerprint)
    expect(summary.recentRuns.map((run) => run.executionFingerprint)).toEqual([
      newerRun.executionFingerprint,
      olderRun.executionFingerprint,
    ])
    expect(summarizeCalendarFollowUpRescheduleExecutionHistory(snapshot).recentRuns[0]?.rfqIds).toEqual(["rfq-019"])
    expect(staleSummary.latestRun?.executionFingerprint).toBe(newerRun.executionFingerprint)
    expect(staleSummary.status).toBe("pending_provider")
    expect(staleSummary.actionItems[0]?.detail).toBe("Record provider outcomes for 1 pending calendar command(s).")
    expect(buildCalendarFollowUpRescheduleExecutionHistoryExportSummary(snapshot)).toContain(
      "Calendar reschedule execution history: pending_provider",
    )
    expect(buildCalendarFollowUpRescheduleExecutionHistoryExportSummary(snapshot)).toContain(
      "Latest execution: pending 2026-06-24T06:45:00.000Z",
    )
  })

  it("rejects unsupported persistence snapshots", () => {
    const snapshot = createLocalCalendarFollowUpRescheduleExecutionPersistence().snapshot()

    expect(() =>
      summarizeCalendarFollowUpRescheduleExecutionHistory({
        ...snapshot,
        persistenceVersion: "future-version",
      } as unknown as typeof snapshot),
    ).toThrow("calendar reschedule execution persistence version is not supported")
  })
})

function readyPlan(): CalendarFollowUpReschedulePlan {
  return buildCalendarFollowUpReschedulePlan({
    rfqId: "rfq-019",
    tasks: followUpStatus().tasks,
  })
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
