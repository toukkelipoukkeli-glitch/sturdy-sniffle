import {
  buildConvexOfferFollowUpActivityReadinessPayload,
  buildOfferFollowUpActivityReadinessHistoryRecordFromConvex,
  type ConvexOfferFollowUpActivityReadinessPayload,
} from "./convexOfferFollowUpActivityReadiness"
import type { OfferFollowUpActivityReadinessStatus } from "./offerFollowUpActivityReadiness"
import type { OfferFollowUpActivityReadinessHistoryRecord } from "./offerFollowUpActivityReadinessHistory"

export interface OfferFollowUpActivityReadinessPersistenceSnapshot {
  partialReadinessKeys: string[]
  pendingReadinessKeys: string[]
  recordedReadinessKeys: string[]
  recordCount: number
  records: ConvexOfferFollowUpActivityReadinessPayload[]
  reviewReadinessKeys: string[]
  statusCounts: Partial<Record<OfferFollowUpActivityReadinessStatus, number>>
}

export interface OfferFollowUpActivityReadinessPersistenceAdapter {
  recordReadiness(record: OfferFollowUpActivityReadinessHistoryRecord): Promise<OfferFollowUpActivityReadinessPersistenceSnapshot>
  snapshot(): OfferFollowUpActivityReadinessPersistenceSnapshot
}

export interface OfferFollowUpActivityReadinessReadAdapter {
  listReadiness(options: OfferFollowUpActivityReadinessListOptions): Promise<OfferFollowUpActivityReadinessPersistenceSnapshot>
  snapshot(): OfferFollowUpActivityReadinessPersistenceSnapshot
}

export interface OfferFollowUpActivityReadinessListOptions {
  limit?: number
  offerId: unknown
}

export interface LocalOfferFollowUpActivityReadinessPersistenceOptions {
  initialSnapshot?: Partial<OfferFollowUpActivityReadinessPersistenceSnapshot>
}

export interface ConvexOfferFollowUpActivityReadinessPersistenceOptions {
  fallback?: OfferFollowUpActivityReadinessPersistenceAdapter
  mutationRef: unknown
  onPersistError?: (error: unknown, payload: ConvexOfferFollowUpActivityReadinessPayload) => void
  runMutation: (mutationRef: unknown, args: Record<string, unknown>) => Promise<unknown>
}

export interface ConvexOfferFollowUpActivityReadinessReadOptions {
  fallback?: OfferFollowUpActivityReadinessReadAdapter
  onQueryError?: (error: unknown, args: Record<string, unknown>) => void
  queryRef: unknown
  runQuery: (queryRef: unknown, args: Record<string, unknown>) => Promise<unknown>
}

export function createLocalOfferFollowUpActivityReadinessPersistence({
  initialSnapshot,
}: LocalOfferFollowUpActivityReadinessPersistenceOptions = {}): OfferFollowUpActivityReadinessPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordReadiness(record) {
      const payload = buildConvexOfferFollowUpActivityReadinessPayload(record)
      validatePayloadConsistency(payload)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records.filter((current) => current.readinessKey !== payload.readinessKey),
          payload,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): OfferFollowUpActivityReadinessPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function createLocalOfferFollowUpActivityReadinessReader({
  initialSnapshot,
}: LocalOfferFollowUpActivityReadinessPersistenceOptions = {}): OfferFollowUpActivityReadinessReadAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async listReadiness({ offerId }) {
      snapshotState = normalizeSnapshot({
        records: snapshotState.records.filter((record) => record.offerId === nonBlankUnknown(offerId, "offerId")),
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): OfferFollowUpActivityReadinessPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function createConvexOfferFollowUpActivityReadinessPersistence({
  fallback,
  mutationRef,
  onPersistError,
  runMutation,
}: ConvexOfferFollowUpActivityReadinessPersistenceOptions): OfferFollowUpActivityReadinessPersistenceAdapter {
  const localFallback = fallback ?? createLocalOfferFollowUpActivityReadinessPersistence()

  return {
    async recordReadiness(record) {
      const payload = buildConvexOfferFollowUpActivityReadinessPayload(record)
      validatePayloadConsistency(payload)

      try {
        await runMutation(mutationRef, compactArgs(payload))
      } catch (error) {
        try {
          onPersistError?.(error, payload)
        } catch {
          // Local fallback must remain available even if observers fail.
        }
      }

      return await localFallback.recordReadiness(record)
    },
    snapshot() {
      return localFallback.snapshot()
    },
  }
}

export function createConvexOfferFollowUpActivityReadinessReader({
  fallback,
  onQueryError,
  queryRef,
  runQuery,
}: ConvexOfferFollowUpActivityReadinessReadOptions): OfferFollowUpActivityReadinessReadAdapter {
  const localFallback = fallback ?? createLocalOfferFollowUpActivityReadinessReader()
  let snapshotState = localFallback.snapshot()

  return {
    async listReadiness(options) {
      const args = compactListArgs(options)
      try {
        const records = await runQuery(queryRef, args)
        snapshotState = normalizeSnapshot({ records: normalizeQueryRecords(records) })
        return snapshot()
      } catch (error) {
        try {
          onQueryError?.(error, args)
        } catch {
          // Local fallback must remain available even if observers fail.
        }
        snapshotState = await localFallback.listReadiness(options)
        return snapshot()
      }
    },
    snapshot,
  }

  function snapshot(): OfferFollowUpActivityReadinessPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function normalizeSnapshot(
  snapshot: Partial<OfferFollowUpActivityReadinessPersistenceSnapshot> | undefined,
): OfferFollowUpActivityReadinessPersistenceSnapshot {
  const recordsByKey = new Map<string, ConvexOfferFollowUpActivityReadinessPayload>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    recordsByKey.set(normalized.readinessKey, normalized)
  }
  const records = [...recordsByKey.values()].sort(sortRecords)

  return {
    partialReadinessKeys: records.filter((record) => record.status === "partial").map((record) => record.readinessKey),
    pendingReadinessKeys: records.filter((record) => record.status === "pending").map((record) => record.readinessKey),
    recordedReadinessKeys: records.filter((record) => record.status === "recorded").map((record) => record.readinessKey),
    recordCount: records.length,
    records,
    reviewReadinessKeys: records.filter((record) => record.status === "review").map((record) => record.readinessKey),
    statusCounts: countStatuses(records),
  }
}

function normalizeRecord(
  record: ConvexOfferFollowUpActivityReadinessPayload,
): ConvexOfferFollowUpActivityReadinessPayload {
  const normalized = buildConvexOfferFollowUpActivityReadinessPayload(
    buildOfferFollowUpActivityReadinessHistoryRecordFromConvex(record),
  )
  validatePayloadConsistency(normalized)
  return normalized
}

function validatePayloadConsistency(payload: ConvexOfferFollowUpActivityReadinessPayload) {
  if (payload.expectedFollowUpTaskIds.length !== payload.expectedTaskCount) {
    throw new Error("expected follow-up task ids length must equal expectedTaskCount")
  }
  if (payload.recordedFollowUpTaskIds.length !== payload.recordedTaskCount) {
    throw new Error("recorded follow-up task ids length must equal recordedTaskCount")
  }
  if (payload.missingFollowUpTaskIds.length !== payload.missingTaskCount) {
    throw new Error("missing follow-up task ids length must equal missingTaskCount")
  }
  if (payload.unexpectedFollowUpTaskIds.length !== payload.unexpectedTaskCount) {
    throw new Error("unexpected follow-up task ids length must equal unexpectedTaskCount")
  }
  if (payload.totalActivities < payload.recordedTaskCount) {
    throw new Error("follow-up readiness totalActivities cannot be less than recordedTaskCount")
  }
  if (payload.status === "recorded" && (payload.missingTaskCount > 0 || payload.unexpectedTaskCount > 0 || payload.unmatchedActivityCount > 0)) {
    throw new Error("follow-up activity readiness cannot be recorded while review work remains")
  }
}

function cloneSnapshot(
  snapshot: OfferFollowUpActivityReadinessPersistenceSnapshot,
): OfferFollowUpActivityReadinessPersistenceSnapshot {
  return {
    partialReadinessKeys: [...snapshot.partialReadinessKeys],
    pendingReadinessKeys: [...snapshot.pendingReadinessKeys],
    recordedReadinessKeys: [...snapshot.recordedReadinessKeys],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(clonePayload),
    reviewReadinessKeys: [...snapshot.reviewReadinessKeys],
    statusCounts: { ...snapshot.statusCounts },
  }
}

function clonePayload(
  payload: ConvexOfferFollowUpActivityReadinessPayload,
): ConvexOfferFollowUpActivityReadinessPayload {
  return {
    expectedFollowUpTaskIds: [...payload.expectedFollowUpTaskIds],
    expectedTaskCount: payload.expectedTaskCount,
    ...(payload.latestActivityMessage ? { latestActivityMessage: payload.latestActivityMessage } : {}),
    missingFollowUpTaskIds: [...payload.missingFollowUpTaskIds],
    missingTaskCount: payload.missingTaskCount,
    nextActions: [...payload.nextActions],
    offerId: payload.offerId,
    readinessHistoryVersion: payload.readinessHistoryVersion,
    readinessKey: payload.readinessKey,
    readinessVersion: payload.readinessVersion,
    recordedAt: payload.recordedAt,
    recordedFollowUpTaskIds: [...payload.recordedFollowUpTaskIds],
    recordedTaskCount: payload.recordedTaskCount,
    rfqId: payload.rfqId,
    status: payload.status,
    totalActivities: payload.totalActivities,
    unexpectedFollowUpTaskIds: [...payload.unexpectedFollowUpTaskIds],
    unexpectedTaskCount: payload.unexpectedTaskCount,
    unmatchedActivityCount: payload.unmatchedActivityCount,
  }
}

function compactArgs(payload: ConvexOfferFollowUpActivityReadinessPayload): Record<string, unknown> {
  return {
    expectedFollowUpTaskIds: [...payload.expectedFollowUpTaskIds],
    expectedTaskCount: payload.expectedTaskCount,
    ...(payload.latestActivityMessage ? { latestActivityMessage: payload.latestActivityMessage } : {}),
    missingFollowUpTaskIds: [...payload.missingFollowUpTaskIds],
    missingTaskCount: payload.missingTaskCount,
    nextActions: [...payload.nextActions],
    offerId: payload.offerId,
    readinessHistoryVersion: payload.readinessHistoryVersion,
    readinessKey: payload.readinessKey,
    readinessVersion: payload.readinessVersion,
    recordedAt: isoTimestampMs(payload.recordedAt, "recordedAt"),
    recordedFollowUpTaskIds: [...payload.recordedFollowUpTaskIds],
    recordedTaskCount: payload.recordedTaskCount,
    status: payload.status,
    totalActivities: payload.totalActivities,
    unexpectedFollowUpTaskIds: [...payload.unexpectedFollowUpTaskIds],
    unexpectedTaskCount: payload.unexpectedTaskCount,
    unmatchedActivityCount: payload.unmatchedActivityCount,
  }
}

function compactListArgs(options: OfferFollowUpActivityReadinessListOptions): Record<string, unknown> {
  return {
    ...(options.limit === undefined ? {} : { limit: nonNegativeInteger(options.limit, "limit") }),
    offerId: nonBlankUnknown(options.offerId, "offerId"),
  }
}

function normalizeQueryRecords(records: unknown): ConvexOfferFollowUpActivityReadinessPayload[] {
  if (!Array.isArray(records)) {
    throw new Error("follow-up activity readiness query must return an array")
  }
  return records.map(normalizeQueryRecord)
}

function normalizeQueryRecord(record: unknown): ConvexOfferFollowUpActivityReadinessPayload {
  if (!record || typeof record !== "object") {
    throw new Error("follow-up activity readiness query record must be an object")
  }
  const value = record as Record<string, unknown>
  const latestActivityMessage = optionalUnknownText(value.latestActivityMessage)
  return {
    expectedFollowUpTaskIds: normalizeUnknownTextList(value.expectedFollowUpTaskIds, "record.expectedFollowUpTaskIds"),
    expectedTaskCount: nonNegativeInteger(value.expectedTaskCount, "record.expectedTaskCount"),
    ...(latestActivityMessage ? { latestActivityMessage } : {}),
    missingFollowUpTaskIds: normalizeUnknownTextList(value.missingFollowUpTaskIds, "record.missingFollowUpTaskIds"),
    missingTaskCount: nonNegativeInteger(value.missingTaskCount, "record.missingTaskCount"),
    nextActions: normalizeUnknownTextList(value.nextActions, "record.nextActions"),
    offerId: nonBlankUnknown(value.offerId, "record.offerId"),
    readinessHistoryVersion: nonBlankUnknown(value.readinessHistoryVersion, "record.readinessHistoryVersion") as ConvexOfferFollowUpActivityReadinessPayload["readinessHistoryVersion"],
    readinessKey: nonBlankUnknown(value.readinessKey, "record.readinessKey"),
    readinessVersion: nonBlankUnknown(value.readinessVersion, "record.readinessVersion") as ConvexOfferFollowUpActivityReadinessPayload["readinessVersion"],
    recordedAt: normalizeQueryRecordedAt(value.recordedAt),
    recordedFollowUpTaskIds: normalizeUnknownTextList(value.recordedFollowUpTaskIds, "record.recordedFollowUpTaskIds"),
    recordedTaskCount: nonNegativeInteger(value.recordedTaskCount, "record.recordedTaskCount"),
    rfqId: nonBlankUnknown(value.rfqId, "record.rfqId"),
    status: normalizeQueryStatus(value.status),
    totalActivities: nonNegativeInteger(value.totalActivities, "record.totalActivities"),
    unexpectedFollowUpTaskIds: normalizeUnknownTextList(value.unexpectedFollowUpTaskIds, "record.unexpectedFollowUpTaskIds"),
    unexpectedTaskCount: nonNegativeInteger(value.unexpectedTaskCount, "record.unexpectedTaskCount"),
    unmatchedActivityCount: nonNegativeInteger(value.unmatchedActivityCount, "record.unmatchedActivityCount"),
  }
}

function countStatuses(
  records: ConvexOfferFollowUpActivityReadinessPayload[],
): Partial<Record<OfferFollowUpActivityReadinessStatus, number>> {
  return records.reduce<Partial<Record<OfferFollowUpActivityReadinessStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function sortRecords(
  left: ConvexOfferFollowUpActivityReadinessPayload,
  right: ConvexOfferFollowUpActivityReadinessPayload,
): number {
  return right.recordedAt.localeCompare(left.recordedAt) || left.readinessKey.localeCompare(right.readinessKey)
}

function normalizeQueryRecordedAt(value: unknown): string {
  if (typeof value === "number") {
    const timestamp = nonNegativeInteger(value, "record.recordedAt")
    const date = new Date(timestamp)
    if (!Number.isFinite(date.getTime())) {
      throw new Error("record.recordedAt must be a valid timestamp")
    }
    return date.toISOString()
  }
  return strictIsoTimestamp(nonBlankUnknown(value, "record.recordedAt"), "record.recordedAt")
}

function isoTimestampMs(value: string, fieldName: string): number {
  return Date.parse(strictIsoTimestamp(value, fieldName))
}

function strictIsoTimestamp(value: string, fieldName: string): string {
  const timestamp = Date.parse(value)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    throw new Error(`${fieldName} must be a strict ISO timestamp`)
  }
  return value
}

function nonBlankUnknown(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be a non-empty string`)
  }
  return value.trim()
}

function optionalUnknownText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  return nonBlankUnknown(value, "optional text")
}

function normalizeUnknownTextList(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`)
  }
  return value.map((item, index) => nonBlankUnknown(item, `${fieldName}[${index}]`))
}

function nonNegativeInteger(value: unknown, fieldName: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`)
  }
  return Number(value)
}

function normalizeQueryStatus(value: unknown): ConvexOfferFollowUpActivityReadinessPayload["status"] {
  if (value !== "partial" && value !== "pending" && value !== "recorded" && value !== "review") {
    throw new Error("follow-up activity readiness query status must be partial pending recorded or review")
  }
  return value
}
