import { describe, expect, it } from "vitest"

import {
  createLocalProviderRunReadHistoryPersistence,
  PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION,
  type ProviderRunReadHistoryPersistenceRecord,
} from "./providerRunReadHistoryPersistence"
import {
  buildProviderRunReadHistoryRecord,
  PROVIDER_RUN_READ_HISTORY_VERSION,
  type ProviderRunReadHistoryRecord,
} from "./providerRunReadHistory"
import { buildProviderRunReadSyncState } from "./providerRunReadSync"

describe("provider run read history persistence", () => {
  it("records provider read histories as compact persistence records", async () => {
    const convexRead = readHistory({
      localRunKeys: ["local-2", "local-1"],
      persistedRunKeys: ["persisted-1"],
      recordedAt: "2026-07-10T10:00:00+03:00",
      recordKey: "convex-read",
      sync: buildProviderRunReadSyncState("convex", 2, 1),
    })
    const adapter = createLocalProviderRunReadHistoryPersistence()

    const snapshot = await adapter.recordReadHistory({
      persistedAt: "2026-07-10T10:01:00+03:00",
      persistedBy: "FactoryBid Operator",
      readHistory: convexRead,
    })

    expect(snapshot).toMatchObject({
      convexRecordKeys: ["convex-read"],
      errorCount: 0,
      fallbackRecordKeys: [],
      localRecordKeys: [],
      localRunCount: 2,
      pendingRecordKeys: [],
      persistedRunCount: 1,
      persistenceVersion: PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION,
      recordCount: 1,
      statusCounts: { convex: 1 },
    })
    expect(snapshot.latestRecord).toMatchObject({
      errorCount: 0,
      fallbackCount: 0,
      historyVersion: PROVIDER_RUN_READ_HISTORY_VERSION,
      localRunCount: 2,
      persistedAt: "2026-07-10T07:01:00.000Z",
      persistedBy: "FactoryBid Operator",
      persistedRunCount: 1,
      persistenceVersion: PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION,
      recordKey: "convex-read",
      rfqId: "rfq-204",
      status: "convex",
    })
    expect(snapshot.latestRecord?.readHistory.localRunKeys).toEqual(["local-1", "local-2"])
  })

  it("sorts newest first and counts mixed provider read sources", async () => {
    const adapter = createLocalProviderRunReadHistoryPersistence()

    await adapter.recordReadHistory({
      persistedBy: "FactoryBid Operator",
      readHistory: readHistory({
        localRunKeys: ["local-1"],
        recordedAt: "2026-07-10T09:00:00.000Z",
        recordKey: "local-read",
        sync: buildProviderRunReadSyncState("local", 1, 0),
      }),
    })
    await adapter.recordReadHistory({
      persistedBy: "FactoryBid Operator",
      readHistory: readHistory({
        errorMessages: ["Convex read failed."],
        localRunKeys: ["local-1", "local-2"],
        recordedAt: "2026-07-10T10:00:00.000Z",
        recordKey: "fallback-read",
        sync: buildProviderRunReadSyncState("fallback", 2, 0),
      }),
    })
    const snapshot = await adapter.recordReadHistory({
      persistedBy: "FactoryBid Operator",
      readHistory: readHistory({
        localRunKeys: ["local-1", "local-2"],
        recordedAt: "2026-07-10T11:00:00.000Z",
        recordKey: "pending-read",
        sync: buildProviderRunReadSyncState("pending", 2, 0),
      }),
    })

    expect(snapshot.records.map((record) => record.recordKey)).toEqual(["pending-read", "fallback-read", "local-read"])
    expect(snapshot).toMatchObject({
      errorCount: 1,
      fallbackRecordKeys: ["fallback-read"],
      localRecordKeys: ["local-read"],
      localRunCount: 5,
      pendingRecordKeys: ["pending-read"],
      persistedRunCount: 0,
      recordCount: 3,
      statusCounts: {
        fallback: 1,
        local: 1,
        pending: 1,
      },
    })
  })

  it("deduplicates seeded persistence records by record key using the newest record", async () => {
    const adapter = createLocalProviderRunReadHistoryPersistence()
    const seededRecord = (
      await adapter.recordReadHistory({
        persistedAt: "2026-07-10T09:00:00.000Z",
        persistedBy: "FactoryBid Operator",
        readHistory: readHistory({
          localRunKeys: ["local-1"],
          recordedAt: "2026-07-10T09:00:00.000Z",
          recordKey: "same-read",
          sync: buildProviderRunReadSyncState("local", 1, 0),
        }),
      })
    ).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded provider read persistence record")
    }

    const seededAdapter = createLocalProviderRunReadHistoryPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            persistedAt: "2026-07-10T10:00:00.000Z",
            persistedBy: "Replacement Operator",
          },
        ],
      },
    })

    expect(seededAdapter.snapshot()).toMatchObject({
      latestRecord: {
        persistedAt: "2026-07-10T10:00:00.000Z",
        persistedBy: "Replacement Operator",
        recordKey: "same-read",
      },
      recordCount: 1,
    })
  })

  it("keeps newer seeded records when older duplicates are recorded", async () => {
    const read = readHistory({
      localRunKeys: ["local-1"],
      recordedAt: "2026-07-10T09:00:00.000Z",
      recordKey: "same-read",
      sync: buildProviderRunReadSyncState("local", 1, 0),
    })
    const newerRecord = persistenceRecord({
      persistedAt: "2026-07-10T10:00:00.000Z",
      persistedBy: "Replacement Operator",
      readHistory: read,
    })
    const adapter = createLocalProviderRunReadHistoryPersistence({
      initialSnapshot: {
        records: [newerRecord],
      },
    })

    const snapshot = await adapter.recordReadHistory({
      persistedAt: "2026-07-10T09:00:00.000Z",
      persistedBy: "FactoryBid Operator",
      readHistory: read,
    })

    expect(snapshot.records).toHaveLength(1)
    expect(snapshot.records[0]).toMatchObject({
      persistedAt: "2026-07-10T10:00:00.000Z",
      persistedBy: "Replacement Operator",
    })
  })

  it("returns cloned snapshots and records", async () => {
    const adapter = createLocalProviderRunReadHistoryPersistence()
    const snapshot = await adapter.recordReadHistory({
      persistedBy: "FactoryBid Operator",
      readHistory: readHistory({
        localRunKeys: ["local-1"],
        recordedAt: "2026-07-10T09:00:00.000Z",
        recordKey: "local-read",
        sync: buildProviderRunReadSyncState("local", 1, 0),
      }),
    })

    snapshot.localRecordKeys.push("mutated-read")
    snapshot.records[0]!.persistedBy = "Mutated Operator"
    snapshot.records[0]!.readHistory.localRunKeys.push("mutated-local")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.localRecordKeys).toEqual(["local-read"])
    expect(clonedSnapshot.records[0]?.persistedBy).toBe("FactoryBid Operator")
    expect(clonedSnapshot.records[0]?.readHistory.localRunKeys).toEqual(["local-1"])
  })

  it("rejects malformed seeded persistence records", () => {
    const valid = persistenceRecord({
      readHistory: readHistory({
        localRunKeys: ["local-1"],
        recordedAt: "2026-07-10T09:00:00.000Z",
        recordKey: "local-read",
        sync: buildProviderRunReadSyncState("local", 1, 0),
      }),
    })

    expect(() =>
      createLocalProviderRunReadHistoryPersistence({
        initialSnapshot: {
          records: [
            {
              ...valid,
              persistenceVersion: "provider-run-read-history-persistence.v0" as never,
            },
          ],
        },
      }),
    ).toThrow("provider run read history persistence version is not supported")
    expect(() =>
      createLocalProviderRunReadHistoryPersistence({
        initialSnapshot: {
          records: [
            {
              ...valid,
              persistedAt: "tomorrow",
            },
          ],
        },
      }),
    ).toThrow("persistedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalProviderRunReadHistoryPersistence({
        initialSnapshot: {
          records: [
            {
              ...valid,
              localRunCount: 2,
            },
          ],
        },
      }),
    ).toThrow("record.localRunCount must match the embedded read history")
    expect(() =>
      createLocalProviderRunReadHistoryPersistence({
        initialSnapshot: {
          records: [
            {
              ...valid,
              readHistory: {
                ...valid.readHistory,
                localRunKeys: [],
              },
            },
          ],
        },
      }),
    ).toThrow("record.localRunKeys length must match its read sync count")
  })
})

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

function persistenceRecord(
  overrides: Partial<ProviderRunReadHistoryPersistenceRecord> & {
    readHistory: ProviderRunReadHistoryRecord
  },
): ProviderRunReadHistoryPersistenceRecord {
  const readSummary = overrides.readHistory.sync
  return {
    errorCount: overrides.readHistory.errorMessages.length,
    fallbackCount: readSummary.fallbackCount,
    historyVersion: PROVIDER_RUN_READ_HISTORY_VERSION,
    localRunCount: readSummary.localRunCount,
    persistedAt: overrides.persistedAt ?? overrides.readHistory.recordedAt,
    persistedBy: overrides.persistedBy ?? "FactoryBid Operator",
    persistedRunCount: readSummary.persistedRunCount,
    persistenceVersion: PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION,
    readHistory: overrides.readHistory,
    recordKey: overrides.readHistory.recordKey,
    rfqId: overrides.readHistory.rfqId,
    status: readSummary.status,
  }
}
