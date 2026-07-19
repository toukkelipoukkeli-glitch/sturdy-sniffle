import { compareLex } from "../shared/deterministic"
import { nonNegativeInteger } from "../shared/numberValidation"
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

export type OfferFollowUpActivityReadinessSyncMode = "convex" | "local" | "mixed" | "none" | "other"

export interface OfferFollowUpActivityReadinessSyncSummary {
  convexRecordCount: number
  currentSource: OfferFollowUpActivityReadinessSyncMode
  localRecordCount: number
  mode: OfferFollowUpActivityReadinessSyncMode
  otherRecordCount: number
  totalReadinessRecords: number
}

export interface OfferFollowUpActivityReadinessSyncSummaryInput {
  convexOfferId?: string
  convexRfqId?: string
  currentReadinessKey?: string
  localOfferId: string
  localRfqId: string
  records?: OfferFollowUpActivityReadinessHistoryRecord[]
}

export interface OfferFollowUpActivityReadinessRecordSummary {
  expectedTaskCount: number
  missingTaskCount: number
  nextActionCount: number
  offerId: string
  readinessKey: string
  readinessVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION
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
  const newest = newestRecord(normalizedRecords)
  const currentReadiness = currentKey
    ? normalizedRecords.find((record) => record.readinessKey === currentKey)
    : newest

  return {
    currentReadiness,
    historyVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
    latestRecordedAt: newest?.recordedAt,
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

export function buildOfferFollowUpActivityReadinessHistoryExportSummary(
  history: OfferFollowUpActivityReadinessHistorySummary,
): string {
  const lines = [
    `Follow-up readiness history: ${history.historyVersion}`,
    `Records: total ${history.totalReadinessRecords}, recorded ${history.recordedRecordCount}, partial ${history.partialRecordCount}, pending ${history.pendingRecordCount}, review ${history.reviewRecordCount}`,
    `Task gaps: missing ${history.missingTaskTotal}, unexpected ${history.unexpectedTaskTotal}, unmatched activity ${history.unmatchedActivityTotal}`,
    `Latest recorded at: ${history.latestRecordedAt ?? "none"}`,
  ]

  if (history.currentReadiness) {
    lines.push(
      `Current readiness: ${history.currentReadiness.status} ${history.currentReadiness.recordedTaskCount}/${history.currentReadiness.expectedTaskCount} tasks ${history.currentReadiness.readinessKey}`,
    )
  } else {
    lines.push("Current readiness: none")
  }

  return lines.join("\n")
}

export function summarizeOfferFollowUpActivityReadinessSync({
  convexOfferId,
  convexRfqId,
  currentReadinessKey,
  localOfferId,
  localRfqId,
  records,
}: OfferFollowUpActivityReadinessSyncSummaryInput): OfferFollowUpActivityReadinessSyncSummary {
  const localIds = normalizeIdPair(localOfferId, localRfqId, "local")
  const convexIds = convexOfferId && convexRfqId ? normalizeIdPair(convexOfferId, convexRfqId, "convex") : undefined
  const normalizedRecords = normalizeRecords(records ?? [])
  const currentKey = currentReadinessKey?.trim()
  const currentReadiness = currentKey
    ? normalizedRecords.find((record) => record.readinessKey === currentKey)
    : newestRecord(normalizedRecords)
  let convexRecordCount = 0
  let localRecordCount = 0
  let otherRecordCount = 0

  for (const record of normalizedRecords) {
    const source = recordSyncSource(record, localIds, convexIds)
    if (source === "convex") {
      convexRecordCount += 1
    } else if (source === "local") {
      localRecordCount += 1
    } else {
      otherRecordCount += 1
    }
  }

  return {
    convexRecordCount,
    currentSource: currentReadiness ? recordSyncSource(currentReadiness, localIds, convexIds) : "none",
    localRecordCount,
    mode: syncMode(convexRecordCount, localRecordCount, otherRecordCount),
    otherRecordCount,
    totalReadinessRecords: normalizedRecords.length,
  }
}

function normalizeRecords(records: OfferFollowUpActivityReadinessHistoryRecord[]): OfferFollowUpActivityReadinessRecordSummary[] {
  const recordsByKey = new Map<string, OfferFollowUpActivityReadinessRecordSummary>()
  for (const record of records) {
    const normalized = normalizeRecord(record)
    recordsByKey.set(normalized.readinessKey, normalized)
  }
  return [...recordsByKey.values()]
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
  return records.reduce<OfferFollowUpActivityReadinessRecordSummary | undefined>((newest, record) => {
    if (!newest) {
      return record
    }
    return compareLex(record.recordedAt, newest.recordedAt) > 0 ||
      (record.recordedAt === newest.recordedAt && compareLex(record.readinessKey, newest.readinessKey) < 0)
      ? record
      : newest
  }, undefined)
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

function sumRecords(
  records: OfferFollowUpActivityReadinessRecordSummary[],
  select: (record: OfferFollowUpActivityReadinessRecordSummary) => number,
): number {
  return records.reduce((total, record) => total + select(record), 0)
}

function normalizeIdPair(offerId: string, rfqId: string, source: string): { offerId: string; rfqId: string } {
  return {
    offerId: nonBlank(offerId, `${source}.offerId`),
    rfqId: nonBlank(rfqId, `${source}.rfqId`),
  }
}

function recordSyncSource(
  record: OfferFollowUpActivityReadinessRecordSummary,
  localIds: { offerId: string; rfqId: string },
  convexIds: { offerId: string; rfqId: string } | undefined,
): OfferFollowUpActivityReadinessSyncMode {
  if (convexIds && record.offerId === convexIds.offerId && record.rfqId === convexIds.rfqId) {
    return "convex"
  }
  if (record.offerId === localIds.offerId && record.rfqId === localIds.rfqId) {
    return "local"
  }
  return "other"
}

function syncMode(
  convexRecordCount: number,
  localRecordCount: number,
  otherRecordCount: number,
): OfferFollowUpActivityReadinessSyncMode {
  const sourceCount = Number(convexRecordCount > 0) + Number(localRecordCount > 0) + Number(otherRecordCount > 0)
  if (sourceCount === 0) {
    return "none"
  }
  if (sourceCount > 1) {
    return "mixed"
  }
  if (convexRecordCount > 0) {
    return "convex"
  }
  if (localRecordCount > 0) {
    return "local"
  }
  return "other"
}
