import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonNegativeInteger } from "../shared/numberValidation"
import { nonBlank } from "../shared/stringValidation"
import {
  buildProviderRunReadHistoryRecord,
  PROVIDER_RUN_READ_HISTORY_VERSION,
  summarizeProviderRunReadHistory,
  type ProviderRunReadHistoryRecord,
} from "./providerRunReadHistory"
import type { ProviderRunReadSyncStatus } from "./providerRunReadSync"

export const PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION = "provider-run-read-history-persistence.v1"

export interface ProviderRunReadHistoryPersistenceRecord {
  errorCount: number
  fallbackCount: number
  historyVersion: typeof PROVIDER_RUN_READ_HISTORY_VERSION
  localRunCount: number
  persistedAt: string
  persistedBy: string
  persistedRunCount: number
  persistenceVersion: typeof PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION
  readHistory: ProviderRunReadHistoryRecord
  recordKey: string
  rfqId: string
  status: ProviderRunReadSyncStatus
}

export interface ProviderRunReadHistoryPersistenceSnapshot {
  convexRecordKeys: string[]
  errorCount: number
  fallbackRecordKeys: string[]
  latestRecord?: ProviderRunReadHistoryPersistenceRecord
  localRecordKeys: string[]
  localRunCount: number
  pendingRecordKeys: string[]
  persistedRunCount: number
  persistenceVersion: typeof PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION
  recordCount: number
  records: ProviderRunReadHistoryPersistenceRecord[]
  statusCounts: Partial<Record<ProviderRunReadSyncStatus, number>>
}

export interface RecordProviderRunReadHistoryInput {
  persistedAt?: string
  persistedBy: string
  readHistory: ProviderRunReadHistoryRecord
}

export interface ProviderRunReadHistoryPersistenceAdapter {
  recordReadHistory(input: RecordProviderRunReadHistoryInput): Promise<ProviderRunReadHistoryPersistenceSnapshot>
  snapshot(): ProviderRunReadHistoryPersistenceSnapshot
}

export interface LocalProviderRunReadHistoryPersistenceOptions {
  initialSnapshot?: Partial<ProviderRunReadHistoryPersistenceSnapshot>
}

export function createLocalProviderRunReadHistoryPersistence({
  initialSnapshot,
}: LocalProviderRunReadHistoryPersistenceOptions = {}): ProviderRunReadHistoryPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordReadHistory(input) {
      const record = buildProviderRunReadHistoryPersistenceRecord(input)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records,
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): ProviderRunReadHistoryPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function buildProviderRunReadHistoryPersistenceRecord({
  persistedAt,
  persistedBy,
  readHistory,
}: RecordProviderRunReadHistoryInput): ProviderRunReadHistoryPersistenceRecord {
  const normalizedReadHistory = cloneReadHistory(readHistory)
  const summary = summarizeProviderRunReadHistory([normalizedReadHistory]).latestRecord
  if (!summary) {
    throw new Error("provider run read history persistence requires one read history record")
  }

  return {
    errorCount: summary.errorCount,
    fallbackCount: summary.fallbackCount,
    historyVersion: summary.historyVersion,
    localRunCount: summary.localRunCount,
    persistedAt: normalizeIsoTimestamp(persistedAt ?? summary.recordedAt, "persistedAt"),
    persistedBy: nonBlank(persistedBy, "persistedBy"),
    persistedRunCount: summary.persistedRunCount,
    persistenceVersion: PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION,
    readHistory: normalizedReadHistory,
    recordKey: summary.recordKey,
    rfqId: summary.rfqId,
    status: summary.status,
  }
}

function normalizeSnapshot(
  snapshot: Partial<ProviderRunReadHistoryPersistenceSnapshot> | undefined,
): ProviderRunReadHistoryPersistenceSnapshot {
  const recordsByKey = new Map<string, ProviderRunReadHistoryPersistenceRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByKey.get(normalized.recordKey)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByKey.set(normalized.recordKey, normalized)
    }
  }
  const records = [...recordsByKey.values()].sort(sortNewestFirst)

  return {
    convexRecordKeys: recordKeysForStatus(records, "convex"),
    errorCount: records.reduce((total, record) => total + record.errorCount, 0),
    fallbackRecordKeys: recordKeysForStatus(records, "fallback"),
    latestRecord: records[0],
    localRecordKeys: recordKeysForStatus(records, "local"),
    localRunCount: records.reduce((total, record) => total + record.localRunCount, 0),
    pendingRecordKeys: recordKeysForStatus(records, "pending"),
    persistedRunCount: records.reduce((total, record) => total + record.persistedRunCount, 0),
    persistenceVersion: PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
  }
}

function normalizeRecord(record: ProviderRunReadHistoryPersistenceRecord): ProviderRunReadHistoryPersistenceRecord {
  const rebuilt = buildProviderRunReadHistoryPersistenceRecord({
    persistedAt: record.persistedAt,
    persistedBy: record.persistedBy,
    readHistory: record.readHistory,
  })
  if (record.persistenceVersion !== PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION) {
    throw new Error("provider run read history persistence version is not supported")
  }
  if (record.historyVersion !== PROVIDER_RUN_READ_HISTORY_VERSION) {
    throw new Error("provider run read history version is not supported")
  }
  assertEqual(nonBlank(record.recordKey, "record.recordKey"), rebuilt.recordKey, "record.recordKey")
  assertEqual(nonBlank(record.rfqId, "record.rfqId"), rebuilt.rfqId, "record.rfqId")
  assertEqual(normalizeStatus(record.status), rebuilt.status, "record.status")
  assertEqual(nonNegativeInteger(record.localRunCount, "record.localRunCount"), rebuilt.localRunCount, "record.localRunCount")
  assertEqual(
    nonNegativeInteger(record.persistedRunCount, "record.persistedRunCount"),
    rebuilt.persistedRunCount,
    "record.persistedRunCount",
  )
  assertEqual(nonNegativeInteger(record.fallbackCount, "record.fallbackCount"), rebuilt.fallbackCount, "record.fallbackCount")
  assertEqual(nonNegativeInteger(record.errorCount, "record.errorCount"), rebuilt.errorCount, "record.errorCount")
  return rebuilt
}

function cloneSnapshot(snapshot: ProviderRunReadHistoryPersistenceSnapshot): ProviderRunReadHistoryPersistenceSnapshot {
  return {
    convexRecordKeys: [...snapshot.convexRecordKeys],
    errorCount: snapshot.errorCount,
    fallbackRecordKeys: [...snapshot.fallbackRecordKeys],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    localRecordKeys: [...snapshot.localRecordKeys],
    localRunCount: snapshot.localRunCount,
    pendingRecordKeys: [...snapshot.pendingRecordKeys],
    persistedRunCount: snapshot.persistedRunCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
  }
}

function cloneRecord(record: ProviderRunReadHistoryPersistenceRecord): ProviderRunReadHistoryPersistenceRecord {
  return {
    ...record,
    readHistory: cloneReadHistory(record.readHistory),
  }
}

function cloneReadHistory(readHistory: ProviderRunReadHistoryRecord): ProviderRunReadHistoryRecord {
  return buildProviderRunReadHistoryRecord({
    errorMessages: [...readHistory.errorMessages],
    localRunKeys: [...readHistory.localRunKeys],
    persistedRunKeys: [...readHistory.persistedRunKeys],
    recordedAt: readHistory.recordedAt,
    recordKey: readHistory.recordKey,
    rfqId: readHistory.rfqId,
    sync: { ...readHistory.sync },
  })
}

function recordKeysForStatus(
  records: ProviderRunReadHistoryPersistenceRecord[],
  status: ProviderRunReadSyncStatus,
): string[] {
  return records
    .filter((record) => record.status === status)
    .map((record) => record.recordKey)
    .sort(compareLex)
}

function countStatuses(
  records: ProviderRunReadHistoryPersistenceRecord[],
): Partial<Record<ProviderRunReadSyncStatus, number>> {
  return records.reduce<Partial<Record<ProviderRunReadSyncStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function sortNewestFirst(
  left: ProviderRunReadHistoryPersistenceRecord,
  right: ProviderRunReadHistoryPersistenceRecord,
): number {
  return (
    compareLex(right.persistedAt, left.persistedAt) ||
    compareLex(left.recordKey, right.recordKey) ||
    compareLex(left.rfqId, right.rfqId)
  )
}

function normalizeStatus(status: ProviderRunReadSyncStatus): ProviderRunReadSyncStatus {
  if (status !== "convex" && status !== "fallback" && status !== "local" && status !== "pending") {
    throw new Error("provider run read history persistence status is not supported")
  }
  return status
}

function assertEqual<T extends number | string>(actual: T, expected: T, fieldName: string): void {
  if (actual !== expected) {
    throw new Error(`${fieldName} must match the embedded read history`)
  }
}
