import { compareLex } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
  type OfferFollowUpActivityReadiness,
  type OfferFollowUpActivityReadinessStatus,
} from "./offerFollowUpActivityReadiness"

export const OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION = "offer-follow-up-activity-readiness-history.v1"

export interface OfferFollowUpActivityReadinessHistoryRecord {
  offerId: string
  readiness: OfferFollowUpActivityReadiness
  readinessKey: string
  recordedAt: string
  rfqId: string
}

export interface OfferFollowUpActivityReadinessHistorySummary {
  historyVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION
  totalReadinessRecords: number
  currentReadiness?: OfferFollowUpActivityReadinessRecordSummary
  latestRecordedAt?: string
  missingTaskTotal: number
  pendingRecordCount: number
  partialRecordCount: number
  recordedRecordCount: number
  reviewRecordCount: number
  statusCounts: Partial<Record<OfferFollowUpActivityReadinessStatus, number>>
  unexpectedTaskTotal: number
  unmatchedActivityTotal: number
}

export interface OfferFollowUpActivityReadinessRecordSummary {
  expectedTaskCount: number
  missingTaskCount: number
  nextActionCount: number
  offerId: string
  readinessKey: string
  readinessVersion: string
  recordedAt: string
  recordedTaskCount: number
  rfqId: string
  status: OfferFollowUpActivityReadinessStatus
  totalActivities: number
  unexpectedTaskCount: number
  unmatchedActivityCount: number
}

export function summarizeOfferFollowUpActivityReadinessHistory(
  records: OfferFollowUpActivityReadinessHistoryRecord[] | undefined,
  currentReadinessKey?: string,
): OfferFollowUpActivityReadinessHistorySummary {
  const normalizedRecords = normalizeRecords(records ?? [])
  const statusCounts = countStatuses(normalizedRecords)
  const currentKey = currentReadinessKey?.trim()
  const currentReadiness = currentKey
    ? normalizedRecords.find((record) => record.readinessKey === currentKey)
    : newestRecord(normalizedRecords)

  return {
    currentReadiness,
    historyVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
    latestRecordedAt: newestRecord(normalizedRecords)?.recordedAt,
    missingTaskTotal: sumRecords(normalizedRecords, (record) => record.missingTaskCount),
    partialRecordCount: statusCounts.partial ?? 0,
    pendingRecordCount: statusCounts.pending ?? 0,
    recordedRecordCount: statusCounts.recorded ?? 0,
    reviewRecordCount: statusCounts.review ?? 0,
    statusCounts,
    totalReadinessRecords: normalizedRecords.length,
    unexpectedTaskTotal: sumRecords(normalizedRecords, (record) => record.unexpectedTaskCount),
    unmatchedActivityTotal: sumRecords(normalizedRecords, (record) => record.unmatchedActivityCount),
  }
}

function normalizeRecords(records: OfferFollowUpActivityReadinessHistoryRecord[]): OfferFollowUpActivityReadinessRecordSummary[] {
  const recordsByKey = new Map<string, OfferFollowUpActivityReadinessRecordSummary>()
  for (const record of records) {
    const normalized = normalizeRecord(record)
    recordsByKey.set(normalized.readinessKey, normalized)
  }
  return [...recordsByKey.values()].sort(sortRecords)
}

function normalizeRecord(record: OfferFollowUpActivityReadinessHistoryRecord): OfferFollowUpActivityReadinessRecordSummary {
  const readiness = normalizeReadiness(record.readiness)
  return {
    expectedTaskCount: readiness.expectedTaskCount,
    missingTaskCount: readiness.missingTaskCount,
    nextActionCount: readiness.nextActions.length,
    offerId: nonBlank(record.offerId, "record.offerId"),
    readinessKey: nonBlank(record.readinessKey, "record.readinessKey"),
    readinessVersion: readiness.readinessVersion,
    recordedAt: normalizeRecordedAt(record.recordedAt),
    recordedTaskCount: readiness.recordedTaskCount,
    rfqId: nonBlank(record.rfqId, "record.rfqId"),
    status: readiness.status,
    totalActivities: readiness.totalActivities,
    unexpectedTaskCount: readiness.unexpectedTaskCount,
    unmatchedActivityCount: readiness.unmatchedActivityCount,
  }
}

function normalizeReadiness(readiness: OfferFollowUpActivityReadiness): OfferFollowUpActivityReadiness {
  if (readiness.readinessVersion !== OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION) {
    throw new Error("follow-up activity readiness history version is not supported")
  }
  const status = normalizeStatus(readiness.status)
  const expectedTaskCount = nonNegativeInteger(readiness.expectedTaskCount, "readiness.expectedTaskCount")
  const recordedTaskCount = nonNegativeInteger(readiness.recordedTaskCount, "readiness.recordedTaskCount")
  const missingTaskCount = nonNegativeInteger(readiness.missingTaskCount, "readiness.missingTaskCount")
  const unexpectedTaskCount = nonNegativeInteger(readiness.unexpectedTaskCount, "readiness.unexpectedTaskCount")
  const unmatchedActivityCount = nonNegativeInteger(readiness.unmatchedActivityCount, "readiness.unmatchedActivityCount")
  const totalActivities = nonNegativeInteger(readiness.totalActivities, "readiness.totalActivities")

  assertListCount(readiness.expectedFollowUpTaskIds, expectedTaskCount, "readiness.expectedFollowUpTaskIds")
  assertListCount(readiness.recordedFollowUpTaskIds, recordedTaskCount, "readiness.recordedFollowUpTaskIds")
  assertListCount(readiness.missingFollowUpTaskIds, missingTaskCount, "readiness.missingFollowUpTaskIds")
  assertListCount(readiness.unexpectedFollowUpTaskIds, unexpectedTaskCount, "readiness.unexpectedFollowUpTaskIds")
  if (totalActivities < recordedTaskCount) {
    throw new Error("readiness.totalActivities cannot be less than readiness.recordedTaskCount")
  }
  if (status === "recorded" && (missingTaskCount > 0 || unexpectedTaskCount > 0 || unmatchedActivityCount > 0)) {
    throw new Error("recorded follow-up readiness cannot include missing, unexpected, or unmatched activity")
  }

  return {
    ...readiness,
    expectedTaskCount,
    missingTaskCount,
    recordedTaskCount,
    status,
    totalActivities,
    unexpectedTaskCount,
    unmatchedActivityCount,
  }
}

function countStatuses(
  records: OfferFollowUpActivityReadinessRecordSummary[],
): Partial<Record<OfferFollowUpActivityReadinessStatus, number>> {
  return records.reduce<Partial<Record<OfferFollowUpActivityReadinessStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function newestRecord(records: OfferFollowUpActivityReadinessRecordSummary[]): OfferFollowUpActivityReadinessRecordSummary | undefined {
  return [...records].sort((left, right) => compareLex(right.recordedAt, left.recordedAt) || compareLex(left.readinessKey, right.readinessKey))[0]
}

function normalizeRecordedAt(value: string): string {
  const recordedAt = nonBlank(value, "record.recordedAt")
  if (!Number.isFinite(Date.parse(recordedAt))) {
    throw new Error("record.recordedAt must be a valid date string")
  }
  return recordedAt
}

function normalizeStatus(status: OfferFollowUpActivityReadinessStatus): OfferFollowUpActivityReadinessStatus {
  if (status !== "partial" && status !== "pending" && status !== "recorded" && status !== "review") {
    throw new Error("follow-up activity readiness history status is not supported")
  }
  return status
}

function assertListCount(values: string[], expectedCount: number, fieldName: string): void {
  if (values.length !== expectedCount) {
    throw new Error(`${fieldName} length must match its count`)
  }
}

function nonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`)
  }
  return value
}

function sumRecords(
  records: OfferFollowUpActivityReadinessRecordSummary[],
  select: (record: OfferFollowUpActivityReadinessRecordSummary) => number,
): number {
  return records.reduce((total, record) => total + select(record), 0)
}

function sortRecords(
  left: OfferFollowUpActivityReadinessRecordSummary,
  right: OfferFollowUpActivityReadinessRecordSummary,
): number {
  return (
    compareLex(left.offerId, right.offerId) ||
    compareLex(left.rfqId, right.rfqId) ||
    compareLex(left.recordedAt, right.recordedAt) ||
    compareLex(left.readinessKey, right.readinessKey)
  )
}
