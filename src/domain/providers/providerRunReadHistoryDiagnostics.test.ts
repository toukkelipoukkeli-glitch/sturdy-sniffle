import { describe, expect, it } from "vitest"

import {
  buildProviderRunReadHistoryDiagnosticExportSummary,
  PROVIDER_RUN_READ_HISTORY_DIAGNOSTICS_VERSION,
  providerRunReadHistoryFallbackRecoveryAction,
  providerRunReadHistoryPendingRecoveryAction,
  summarizeProviderRunReadHistoryDiagnostics,
} from "./providerRunReadHistoryDiagnostics"
import {
  createLocalProviderRunReadHistoryPersistence,
  PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION,
  type ProviderRunReadHistoryPersistenceSnapshot,
} from "./providerRunReadHistoryPersistence"
import { buildProviderRunReadHistoryRecord, type ProviderRunReadHistoryRecord } from "./providerRunReadHistory"
import { buildProviderRunReadSyncState } from "./providerRunReadSync"

describe("provider run read history diagnostics", () => {
  it("summarizes an empty persisted read-history snapshot", () => {
    expect(summarizeProviderRunReadHistoryDiagnostics(emptySnapshot())).toEqual({
      diagnosticVersion: PROVIDER_RUN_READ_HISTORY_DIAGNOSTICS_VERSION,
      latestRecord: undefined,
      operatorSummary: "Provider-run read history has no persisted read records yet.",
      recentRecords: [],
      recoveryActionLabels: [],
      severity: "healthy",
      status: "healthy",
      totalRecordCount: 0,
    })
  })

  it("flags fallback-only read histories with recovery copy", async () => {
    const snapshot = await recordReadHistories([
      readHistory({
        errorMessages: ["Convex read failed."],
        localRunKeys: ["local-1", "local-2"],
        recordedAt: "2026-07-10T09:00:00.000Z",
        recordKey: "fallback-read",
        sync: buildProviderRunReadSyncState("fallback", 2, 0),
      }),
    ])

    expect(summarizeProviderRunReadHistoryDiagnostics(snapshot)).toMatchObject({
      latestRecord: {
        recordKey: "fallback-read",
        status: "fallback",
      },
      operatorSummary: "Provider-run read history has 1 read record (0 Convex, 1 fallback, 0 local, 0 pending); latest read used local fallback.",
      recoveryActionLabels: [providerRunReadHistoryFallbackRecoveryAction],
      severity: "warning",
      status: "fallback",
      totalRecordCount: 1,
    })
  })

  it("distinguishes mixed fallback and healthy Convex/local read histories", async () => {
    const mixedSnapshot = await recordReadHistories([
      readHistory({
        localRunKeys: ["local-1"],
        persistedRunKeys: ["persisted-1"],
        recordedAt: "2026-07-10T09:00:00.000Z",
        recordKey: "convex-read",
        sync: buildProviderRunReadSyncState("convex", 1, 1),
      }),
      readHistory({
        errorMessages: ["Convex read failed."],
        localRunKeys: ["local-1"],
        recordedAt: "2026-07-10T10:00:00.000Z",
        recordKey: "fallback-read",
        sync: buildProviderRunReadSyncState("fallback", 1, 0),
      }),
    ])
    const healthySnapshot = await recordReadHistories([
      readHistory({
        localRunKeys: ["local-1"],
        persistedRunKeys: ["persisted-1"],
        recordedAt: "2026-07-10T09:00:00.000Z",
        recordKey: "convex-read",
        sync: buildProviderRunReadSyncState("convex", 1, 1),
      }),
      readHistory({
        localRunKeys: ["local-2"],
        recordedAt: "2026-07-10T10:00:00.000Z",
        recordKey: "local-read",
        sync: buildProviderRunReadSyncState("local", 1, 0),
      }),
    ])

    expect(summarizeProviderRunReadHistoryDiagnostics(mixedSnapshot)).toMatchObject({
      operatorSummary:
        "Provider-run read history has 2 read records (1 Convex, 1 fallback, 0 local, 0 pending); review fallback records before trusting merged provider audits.",
      recoveryActionLabels: [providerRunReadHistoryFallbackRecoveryAction],
      severity: "warning",
      status: "mixed",
    })
    expect(summarizeProviderRunReadHistoryDiagnostics(healthySnapshot)).toMatchObject({
      operatorSummary: "Provider-run read history has 2 read records (1 Convex, 0 fallback, 1 local, 0 pending); no fallback reads recorded.",
      recoveryActionLabels: [],
      severity: "healthy",
      status: "healthy",
    })
  })

  it("surfaces pending read histories as informational", async () => {
    const snapshot = await recordReadHistories([
      readHistory({
        localRunKeys: ["local-1"],
        recordedAt: "2026-07-10T09:00:00.000Z",
        recordKey: "pending-read",
        sync: buildProviderRunReadSyncState("pending", 1, 0),
      }),
    ])

    expect(summarizeProviderRunReadHistoryDiagnostics(snapshot)).toMatchObject({
      operatorSummary: "Provider-run read history has 1 read record (0 Convex, 0 fallback, 0 local, 1 pending); Convex reads are still pending.",
      recoveryActionLabels: [providerRunReadHistoryPendingRecoveryAction],
      severity: "info",
      status: "pending",
    })
  })

  it("builds a deterministic operator export summary", async () => {
    const snapshot = await recordReadHistories([
      readHistory({
        localRunKeys: ["local-1"],
        persistedRunKeys: ["persisted-1"],
        recordedAt: "2026-07-10T09:00:00.000Z",
        recordKey: "convex-read",
        sync: buildProviderRunReadSyncState("convex", 1, 1),
      }),
      readHistory({
        errorMessages: ["Convex read failed."],
        localRunKeys: ["local-1", "local-2"],
        recordedAt: "2026-07-10T10:00:00.000Z",
        recordKey: "fallback-read",
        sync: buildProviderRunReadSyncState("fallback", 2, 0),
      }),
    ])

    expect(buildProviderRunReadHistoryDiagnosticExportSummary(snapshot)).toBe(
      [
        "Provider run read history: mixed",
        "Severity: warning",
        "Records: total 2, convex 1, fallback 1, local 0, pending 0",
        "Runs: persisted 1, local 3, errors 1",
        "Summary: Provider-run read history has 2 read records (1 Convex, 1 fallback, 0 local, 0 pending); review fallback records before trusting merged provider audits.",
        "Latest read: fallback 2026-07-10T10:00:00.000Z fallback-read",
        `Recovery actions: ${providerRunReadHistoryFallbackRecoveryAction}`,
        "Recent provider reads:",
        "- fallback 2026-07-10T10:00:00.000Z fallback-read rfq-204",
        "- convex 2026-07-10T09:00:00.000Z convex-read rfq-204",
      ].join("\n"),
    )
  })

  it("returns cloned recent records", async () => {
    const snapshot = await recordReadHistories([
      readHistory({
        localRunKeys: ["local-1"],
        recordedAt: "2026-07-10T09:00:00.000Z",
        recordKey: "local-read",
        sync: buildProviderRunReadSyncState("local", 1, 0),
      }),
    ])

    const diagnostic = summarizeProviderRunReadHistoryDiagnostics(snapshot)
    diagnostic.recentRecords[0]!.readHistory.localRunKeys.push("mutated-local")

    expect(summarizeProviderRunReadHistoryDiagnostics(snapshot).recentRecords[0]?.readHistory.localRunKeys).toEqual(["local-1"])
  })

  it("rejects unsupported persistence snapshot versions", () => {
    expect(() =>
      summarizeProviderRunReadHistoryDiagnostics({
        ...emptySnapshot(),
        persistenceVersion: "provider-run-read-history-persistence.v0" as never,
      }),
    ).toThrow("provider run read history persistence version is not supported")
  })
})

function emptySnapshot(): ProviderRunReadHistoryPersistenceSnapshot {
  return {
    convexRecordKeys: [],
    errorCount: 0,
    fallbackRecordKeys: [],
    latestRecord: undefined,
    localRecordKeys: [],
    localRunCount: 0,
    pendingRecordKeys: [],
    persistedRunCount: 0,
    persistenceVersion: PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    statusCounts: {},
  }
}

async function recordReadHistories(readHistories: ProviderRunReadHistoryRecord[]): Promise<ProviderRunReadHistoryPersistenceSnapshot> {
  const adapter = createLocalProviderRunReadHistoryPersistence()
  let snapshot = adapter.snapshot()
  for (const readHistory of readHistories) {
    snapshot = await adapter.recordReadHistory({
      persistedBy: "FactoryBid Operator",
      readHistory,
    })
  }
  return snapshot
}

function readHistory(overrides: Partial<ProviderRunReadHistoryRecord>): ProviderRunReadHistoryRecord {
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
