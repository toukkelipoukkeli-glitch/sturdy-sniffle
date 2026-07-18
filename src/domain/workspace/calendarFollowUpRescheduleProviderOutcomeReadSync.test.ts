import { describe, expect, it } from "vitest"

import {
  buildCalendarFollowUpRescheduleProviderOutcomeReadSyncState,
  calendarFollowUpRescheduleProviderOutcomeReadSyncLabel,
  calendarFollowUpRescheduleProviderOutcomeReadSyncPanelSummary,
} from "./calendarFollowUpRescheduleProviderOutcomeReadSync"

describe("calendar follow-up reschedule provider outcome read sync", () => {
  it("summarizes local-only calendar provider outcome reads", () => {
    const sync = buildCalendarFollowUpRescheduleProviderOutcomeReadSyncState({
      localBatchCount: 1,
      status: "local",
    })

    expect(sync).toEqual({
      fallbackCount: 0,
      localBatchCount: 1,
      persistedBatchCount: 0,
      status: "local",
    })
    expect(calendarFollowUpRescheduleProviderOutcomeReadSyncLabel(sync.status)).toBe("Local")
    expect(calendarFollowUpRescheduleProviderOutcomeReadSyncPanelSummary(sync)).toBe(
      "1 local calendar provider outcome batch available; Convex outcome reads are not configured.",
    )
  })

  it("keeps persisted batch counts only for successful Convex reads", () => {
    const convexSync = buildCalendarFollowUpRescheduleProviderOutcomeReadSyncState({
      localBatchCount: 2,
      persistedBatchCount: 3,
      status: "convex",
    })
    const fallbackSync = buildCalendarFollowUpRescheduleProviderOutcomeReadSyncState({
      localBatchCount: 2,
      persistedBatchCount: 3,
      status: "fallback",
    })

    expect(convexSync).toMatchObject({
      fallbackCount: 0,
      localBatchCount: 2,
      persistedBatchCount: 3,
      status: "convex",
    })
    expect(calendarFollowUpRescheduleProviderOutcomeReadSyncLabel(convexSync.status)).toBe("Convex")
    expect(calendarFollowUpRescheduleProviderOutcomeReadSyncPanelSummary(convexSync)).toBe(
      "3 persisted calendar provider outcome batches merged with 2 local fallback batches.",
    )
    expect(fallbackSync).toMatchObject({
      fallbackCount: 1,
      persistedBatchCount: 0,
      status: "fallback",
    })
    expect(calendarFollowUpRescheduleProviderOutcomeReadSyncLabel(fallbackSync.status)).toBe("Local fallback")
    expect(calendarFollowUpRescheduleProviderOutcomeReadSyncPanelSummary(fallbackSync)).toBe(
      "Convex calendar provider outcome read failed; showing 2 local provider outcome batches.",
    )
  })

  it("summarizes pending reads without trusting persisted counts", () => {
    const sync = buildCalendarFollowUpRescheduleProviderOutcomeReadSyncState({
      localBatchCount: 1,
      persistedBatchCount: 4,
      status: "pending",
    })

    expect(sync).toEqual({
      fallbackCount: 0,
      localBatchCount: 1,
      persistedBatchCount: 0,
      status: "pending",
    })
    expect(calendarFollowUpRescheduleProviderOutcomeReadSyncLabel(sync.status)).toBe("Checking Convex")
    expect(calendarFollowUpRescheduleProviderOutcomeReadSyncPanelSummary(sync)).toBe(
      "Checking Convex for calendar provider outcome batches; 1 local fallback batch remains visible.",
    )
  })

  it("rejects non-finite or negative counts", () => {
    expect(() =>
      buildCalendarFollowUpRescheduleProviderOutcomeReadSyncState({
        localBatchCount: -1,
        status: "local",
      }),
    ).toThrow("localBatchCount must be a non-negative integer")
    expect(() =>
      buildCalendarFollowUpRescheduleProviderOutcomeReadSyncState({
        localBatchCount: 1,
        persistedBatchCount: Number.NaN,
        status: "convex",
      }),
    ).toThrow("persistedBatchCount must be a non-negative integer")
  })
})
