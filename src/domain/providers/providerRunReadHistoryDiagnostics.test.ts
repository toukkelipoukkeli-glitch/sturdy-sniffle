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
      nextActionItems: [
        {
          detail: "No provider-read fallback is recorded for this RFQ; continue monitoring persisted read history.",
          key: "monitor-provider-read-history",
          label: "Monitor provider reads",
          severity: "healthy",
        },
      ],
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
      nextActionItems: [
        {
          detail: "Convex provider-run reads failed; compare local audits before using release decisions.",
          key: "verify-convex-provider-reads",
          label: "Verify Convex provider reads",
          severity: "warning",
        },
        {
          detail: "Keep local provider audit history visible until the persisted read path recovers.",
          key: "keep-local-provider-audits",
          label: "Keep local audits visible",
          severity: "info",
        },
      ],
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
      nextActionItems: [
        {
          detail: "Fallback and persisted reads are both present; reconcile the newest fallback before trusting merged audits.",
          key: "reconcile-provider-read-sources",
          label: "Reconcile read sources",
          severity: "warning",
        },
        {
          detail: "Copy the diagnostic export into the provider incident or handoff before clearing fallback history.",
          key: "attach-provider-diagnostic-export",
          label: "Attach diagnostic export",
          severity: "info",
        },
      ],
      operatorSummary:
        "Provider-run read history has 2 read records (1 Convex, 1 fallback, 0 local, 0 pending); review fallback records before trusting merged provider audits.",
      recoveryActionLabels: [providerRunReadHistoryFallbackRecoveryAction],
      severity: "warning",
      status: "mixed",
    })
    expect(summarizeProviderRunReadHistoryDiagnostics(healthySnapshot)).toMatchObject({
      nextActionItems: [
        {
          detail: "No provider-read fallback is recorded for this RFQ; continue monitoring persisted read history.",
          key: "monitor-provider-read-history",
          label: "Monitor provider reads",
          severity: "healthy",
        },
      ],
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
      nextActionItems: [
        {
          detail: "Convex provider-run reads are still pending; keep local provider audits visible while the read settles.",
          key: "wait-for-convex-provider-read",
          label: "Wait for Convex read",
          severity: "info",
        },
      ],
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
        "Next actions:",
        "- warning Reconcile read sources: Fallback and persisted reads are both present; reconcile the newest fallback before trusting merged audits.",
        "- info Attach diagnostic export: Copy the diagnostic export into the provider incident or handoff before clearing fallback history.",
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
