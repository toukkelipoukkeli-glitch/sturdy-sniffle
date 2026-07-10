import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonNegativeInteger } from "../shared/numberValidation"
import { nonBlank } from "../shared/stringValidation"
import type { ProviderRunReadSyncState, ProviderRunReadSyncStatus } from "./providerRunReadSync"

export const PROVIDER_RUN_READ_HISTORY_VERSION = "provider-run-read-history.v1"

export interface ProviderRunReadHistoryRecord {
  errorMessages: string[]
  historyVersion: typeof PROVIDER_RUN_READ_HISTORY_VERSION
  localRunKeys: string[]
  persistedRunKeys: string[]
  recordedAt: string
  recordKey: string
  rfqId: string
  sync: ProviderRunReadSyncState
}

export interface BuildProviderRunReadHistoryRecordInput {
  errorMessages?: string[]
  localRunKeys?: string[]
  persistedRunKeys?: string[]
  recordedAt: string
  recordKey?: string
  rfqId: string
  sync: ProviderRunReadSyncState
}

export interface ProviderRunReadHistoryRecordSummary {
  errorCount: number
  fallbackCount: number
  historyVersion: typeof PROVIDER_RUN_READ_HISTORY_VERSION
  localRunCount: number
  persistedRunCount: number
  recordedAt: string
  recordKey: string
  rfqId: string
  status: ProviderRunReadSyncStatus
}

export interface ProviderRunReadHistorySummary {
  convexRecordCount: number
  currentRecord?: ProviderRunReadHistoryRecordSummary
  errorTotal: number
  fallbackRecordCount: number
  latestRecord?: ProviderRunReadHistoryRecordSummary
  latestRecordedAt?: string
  localRecordCount: number
  localRunTotal: number
  pendingRecordCount: number
  persistedRunTotal: number
  statusCounts: Partial<Record<ProviderRunReadSyncStatus, number>>
  totalReadRecords: number
}

export function buildProviderRunReadHistoryRecord({
  errorMessages = [],
  localRunKeys = [],
  persistedRunKeys = [],
  recordedAt,
  recordKey,
  rfqId,
  sync,
}: BuildProviderRunReadHistoryRecordInput): ProviderRunReadHistoryRecord {
  const normalizedRfqId = nonBlank(rfqId, "record.rfqId")
  const normalizedRecordedAt = normalizeIsoTimestamp(recordedAt, "record.recordedAt")
  const normalizedSync = normalizeSync(sync)
  return normalizeRecord({
    errorMessages,
    historyVersion: PROVIDER_RUN_READ_HISTORY_VERSION,
    localRunKeys,
    persistedRunKeys,
    recordedAt: normalizedRecordedAt,
    recordKey: recordKey ?? providerRunReadHistoryRecordKey(normalizedRfqId, normalizedRecordedAt, normalizedSync),
    rfqId: normalizedRfqId,
    sync: normalizedSync,
  })
}

export function summarizeProviderRunReadHistory(
  records: ProviderRunReadHistoryRecord[] | undefined,
  currentRecordKey?: string,
): ProviderRunReadHistorySummary {
  const normalizedRecords = normalizeRecords(records ?? [])
  const statusCounts = countStatuses(normalizedRecords)
  const latestRecord = newestRecord(normalizedRecords)
  const currentKey = currentRecordKey?.trim()
  const currentRecord = currentKey ? normalizedRecords.find((record) => record.recordKey === currentKey) : latestRecord

  return {
    convexRecordCount: statusCounts.convex ?? 0,
    currentRecord,
    errorTotal: sumRecords(normalizedRecords, (record) => record.errorCount),
    fallbackRecordCount: statusCounts.fallback ?? 0,
    latestRecord,
    latestRecordedAt: latestRecord?.recordedAt,
    localRecordCount: statusCounts.local ?? 0,
    localRunTotal: sumRecords(normalizedRecords, (record) => record.localRunCount),
    pendingRecordCount: statusCounts.pending ?? 0,
    persistedRunTotal: sumRecords(normalizedRecords, (record) => record.persistedRunCount),
    statusCounts,
    totalReadRecords: normalizedRecords.length,
  }
}

function providerRunReadHistoryRecordKey(
  rfqId: string,
  recordedAt: string,
  sync: ProviderRunReadSyncState,
): string {
  return `${rfqId}:${recordedAt}:${sync.status}:${sync.persistedRunCount}:${sync.localRunCount}`
}

function normalizeRecords(records: ProviderRunReadHistoryRecord[]): ProviderRunReadHistoryRecordSummary[] {
  const recordsByKey = new Map<string, ProviderRunReadHistoryRecordSummary>()
  for (const record of records) {
    const normalized = summarizeRecord(normalizeRecord(record))
    const existing = recordsByKey.get(normalized.recordKey)
    if (!existing || compareLex(normalized.recordedAt, existing.recordedAt) > 0) {
      recordsByKey.set(normalized.recordKey, normalized)
    }
  }
  return [...recordsByKey.values()]
}

function normalizeRecord(record: ProviderRunReadHistoryRecord): ProviderRunReadHistoryRecord {
  if (record.historyVersion !== PROVIDER_RUN_READ_HISTORY_VERSION) {
    throw new Error("provider run read history version is not supported")
  }
  const sync = normalizeSync(record.sync)
  const localRunKeys = normalizeTextList(record.localRunKeys, "record.localRunKeys")
  const persistedRunKeys = normalizeTextList(record.persistedRunKeys, "record.persistedRunKeys")
  const errorMessages = normalizeTextList(record.errorMessages, "record.errorMessages")

  assertCount(localRunKeys, sync.localRunCount, "record.localRunKeys")
  assertCount(persistedRunKeys, sync.persistedRunCount, "record.persistedRunKeys")
  if (sync.status === "fallback" && errorMessages.length === 0) {
    throw new Error("fallback provider run read records must include an error message")
  }

  return {
    errorMessages,
    historyVersion: PROVIDER_RUN_READ_HISTORY_VERSION,
    localRunKeys,
    persistedRunKeys,
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "record.recordedAt"),
    recordKey: nonBlank(record.recordKey, "record.recordKey"),
    rfqId: nonBlank(record.rfqId, "record.rfqId"),
    sync,
  }
}

function normalizeSync(sync: ProviderRunReadSyncState): ProviderRunReadSyncState {
  const status = normalizeStatus(sync.status)
  return {
    fallbackCount: status === "fallback" ? nonNegativeInteger(sync.fallbackCount, "sync.fallbackCount") : 0,
    localRunCount: nonNegativeInteger(sync.localRunCount, "sync.localRunCount"),
    persistedRunCount: status === "convex" ? nonNegativeInteger(sync.persistedRunCount, "sync.persistedRunCount") : 0,
    status,
  }
}

function normalizeStatus(status: ProviderRunReadSyncStatus): ProviderRunReadSyncStatus {
  if (status !== "convex" && status !== "fallback" && status !== "local" && status !== "pending") {
    throw new Error("provider run read history status is not supported")
  }
  return status
}

function normalizeTextList(values: string[], fieldName: string): string[] {
  if (!Array.isArray(values)) {
    throw new Error(`${fieldName} must be an array`)
  }
  return [
    ...new Set(
      values.map((value, index) => {
        if (typeof value !== "string") {
          throw new Error(`${fieldName}[${index}] must be a string`)
        }
        return nonBlank(value, `${fieldName}[${index}]`)
      }),
    ),
  ].sort(compareLex)
}

function assertCount(values: string[], expectedCount: number, fieldName: string): void {
  if (values.length !== expectedCount) {
    throw new Error(`${fieldName} length must match its read sync count`)
  }
}

function summarizeRecord(record: ProviderRunReadHistoryRecord): ProviderRunReadHistoryRecordSummary {
  return {
    errorCount: record.errorMessages.length,
    fallbackCount: record.sync.fallbackCount,
    historyVersion: record.historyVersion,
    localRunCount: record.sync.localRunCount,
    persistedRunCount: record.sync.persistedRunCount,
    recordedAt: record.recordedAt,
    recordKey: record.recordKey,
    rfqId: record.rfqId,
    status: record.sync.status,
  }
}

function countStatuses(
  records: ProviderRunReadHistoryRecordSummary[],
): Partial<Record<ProviderRunReadSyncStatus, number>> {
  return records.reduce<Partial<Record<ProviderRunReadSyncStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function newestRecord(records: ProviderRunReadHistoryRecordSummary[]): ProviderRunReadHistoryRecordSummary | undefined {
  return records.reduce<ProviderRunReadHistoryRecordSummary | undefined>((newest, record) => {
    if (!newest) {
      return record
    }
    return compareLex(record.recordedAt, newest.recordedAt) > 0 ||
      (record.recordedAt === newest.recordedAt && compareLex(record.recordKey, newest.recordKey) < 0)
      ? record
      : newest
  }, undefined)
}

function sumRecords(
  records: ProviderRunReadHistoryRecordSummary[],
  select: (record: ProviderRunReadHistoryRecordSummary) => number,
): number {
  return records.reduce((total, record) => total + select(record), 0)
}
