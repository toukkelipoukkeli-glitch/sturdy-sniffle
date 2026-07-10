import { describe, expect, it } from "vitest"

import {
  buildProviderRunReadHistoryRecord,
  PROVIDER_RUN_READ_HISTORY_VERSION,
  summarizeProviderRunReadHistory,
  type ProviderRunReadHistoryRecord,
} from "./providerRunReadHistory"
import { buildProviderRunReadSyncState } from "./providerRunReadSync"

describe("provider run read history", () => {
  it("summarizes provider read records with deterministic latest and current lookup", () => {
    const convex = record({
      localRunKeys: ["local-2", "local-1"],
      persistedRunKeys: ["persisted-1"],
      recordedAt: "2026-07-10T10:00:00+03:00",
      recordKey: "convex-read",
      sync: buildProviderRunReadSyncState("convex", 2, 1),
    })
    const fallback = record({
      errorMessages: ["Convex read timed out."],
      localRunKeys: ["local-1", "local-2"],
      recordedAt: "2026-07-10T11:00:00+03:00",
      recordKey: "fallback-read",
      sync: buildProviderRunReadSyncState("fallback", 2, 0),
    })
    const local = record({
      localRunKeys: ["local-1"],
      recordedAt: "2026-07-10T09:00:00+03:00",
      recordKey: "local-read",
      sync: buildProviderRunReadSyncState("local", 1, 0),
    })

    expect(summarizeProviderRunReadHistory([convex, fallback, local], "convex-read")).toEqual({
      convexRecordCount: 1,
      currentRecord: {
        errorCount: 0,
        fallbackCount: 0,
        historyVersion: PROVIDER_RUN_READ_HISTORY_VERSION,
        localRunCount: 2,
        persistedRunCount: 1,
        recordedAt: "2026-07-10T07:00:00.000Z",
        recordKey: "convex-read",
        rfqId: "rfq-204",
        status: "convex",
      },
      errorTotal: 1,
      fallbackRecordCount: 1,
      latestRecord: {
        errorCount: 1,
        fallbackCount: 1,
        historyVersion: PROVIDER_RUN_READ_HISTORY_VERSION,
        localRunCount: 2,
        persistedRunCount: 0,
        recordedAt: "2026-07-10T08:00:00.000Z",
        recordKey: "fallback-read",
        rfqId: "rfq-204",
        status: "fallback",
      },
      latestRecordedAt: "2026-07-10T08:00:00.000Z",
      localRecordCount: 1,
      localRunTotal: 5,
      pendingRecordCount: 0,
      persistedRunTotal: 1,
      statusCounts: {
        convex: 1,
        fallback: 1,
        local: 1,
      },
      totalReadRecords: 3,
    })
  })

  it("deduplicates seeded records by key using the newest normalized record", () => {
    const older = record({
      localRunKeys: ["local-1"],
      recordedAt: "2026-07-10T09:00:00.000Z",
      recordKey: "same-read",
      sync: buildProviderRunReadSyncState("local", 1, 0),
    })
    const newer = record({
      localRunKeys: ["local-1", "local-2"],
      recordedAt: "2026-07-10T10:00:00.000Z",
      recordKey: "same-read",
      sync: buildProviderRunReadSyncState("local", 2, 0),
    })

    expect(summarizeProviderRunReadHistory([newer, older, older]).latestRecord).toMatchObject({
      localRunCount: 2,
      recordedAt: "2026-07-10T10:00:00.000Z",
      recordKey: "same-read",
    })
    expect(summarizeProviderRunReadHistory([newer, older, older]).totalReadRecords).toBe(1)
  })

  it("summarizes pending records without persisted counts", () => {
    const pending = record({
      localRunKeys: ["local-1", "local-2"],
      recordedAt: "2026-07-10T09:00:00.000Z",
      recordKey: "pending-read",
      sync: buildProviderRunReadSyncState("pending", 2, 1),
    })

    expect(summarizeProviderRunReadHistory([pending])).toMatchObject({
      latestRecord: {
        persistedRunCount: 0,
        status: "pending",
      },
      pendingRecordCount: 1,
      persistedRunTotal: 0,
      totalReadRecords: 1,
    })
  })

  it("rejects malformed seeded read history records", () => {
    const valid = record({
      localRunKeys: ["local-1"],
      recordedAt: "2026-07-10T09:00:00.000Z",
      recordKey: "valid-read",
      sync: buildProviderRunReadSyncState("local", 1, 0),
    })

    expect(() =>
      summarizeProviderRunReadHistory([
        {
          ...valid,
          historyVersion: "provider-run-read-history.v0" as never,
        },
      ]),
    ).toThrow("provider run read history version is not supported")
    expect(() =>
      summarizeProviderRunReadHistory([
        {
          ...valid,
          recordedAt: "tomorrow",
        },
      ]),
    ).toThrow("record.recordedAt must be a valid ISO timestamp")
    expect(() =>
      summarizeProviderRunReadHistory([
        {
          ...valid,
          localRunKeys: [],
        },
      ]),
    ).toThrow("record.localRunKeys length must match its read sync count")
    expect(() =>
      summarizeProviderRunReadHistory([
        {
          ...valid,
          errorMessages: [1] as never,
        },
      ]),
    ).toThrow("record.errorMessages[0] must be a string")
    expect(() =>
      summarizeProviderRunReadHistory([
        record({
          localRunKeys: ["local-1"],
          recordedAt: "2026-07-10T09:00:00.000Z",
          recordKey: "fallback-read",
          sync: buildProviderRunReadSyncState("fallback", 1, 0),
        }),
      ]),
    ).toThrow("fallback provider run read records must include an error message")
  })
})

function record(overrides: Partial<ProviderRunReadHistoryRecord>): ProviderRunReadHistoryRecord {
  return buildProviderRunReadHistoryRecord({
    errorMessages: overrides.errorMessages,
    localRunKeys: overrides.localRunKeys,
    persistedRunKeys: overrides.persistedRunKeys,
    recordedAt: overrides.recordedAt ?? "2026-07-10T09:00:00.000Z",
    recordKey: overrides.recordKey,
    rfqId: overrides.rfqId ?? "rfq-204",
    sync: overrides.sync ?? buildProviderRunReadSyncState("local", overrides.localRunKeys?.length ?? 0, 0),
  })
}
