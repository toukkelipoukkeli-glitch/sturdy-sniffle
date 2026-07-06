import { nonNegativeInteger } from "../shared/numberValidation"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
  type OfferFollowUpActivityReadiness,
  type OfferFollowUpActivityReadinessStatus,
} from "./offerFollowUpActivityReadiness"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
  summarizeOfferFollowUpActivityReadinessHistory,
  type OfferFollowUpActivityReadinessHistoryRecord,
} from "./offerFollowUpActivityReadinessHistory"

export interface ConvexOfferFollowUpActivityReadinessPayload {
  readinessKey: string
  readinessVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION
  readinessHistoryVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION
  status: OfferFollowUpActivityReadinessStatus
  offerId: string
  rfqId: string
  recordedAt: string
  expectedTaskCount: number
  recordedTaskCount: number
  missingTaskCount: number
  unexpectedTaskCount: number
  unmatchedActivityCount: number
  totalActivities: number
  expectedFollowUpTaskIds: string[]
  recordedFollowUpTaskIds: string[]
  missingFollowUpTaskIds: string[]
  unexpectedFollowUpTaskIds: string[]
  nextActions: string[]
  latestActivityMessage?: string
}

export type ConvexOfferFollowUpActivityReadinessRecord = ConvexOfferFollowUpActivityReadinessPayload

export function buildConvexOfferFollowUpActivityReadinessPayload(
  record: OfferFollowUpActivityReadinessHistoryRecord,
): ConvexOfferFollowUpActivityReadinessPayload {
  const normalized = normalizeHistoryRecord(record)
  const readiness = normalized.readiness
  const latestActivityMessage = optionalTrim(readiness.latestActivityMessage)

  return {
    expectedFollowUpTaskIds: normalizeTextList(readiness.expectedFollowUpTaskIds, "readiness.expectedFollowUpTaskIds"),
    expectedTaskCount: nonNegativeInteger(readiness.expectedTaskCount, "readiness.expectedTaskCount"),
    ...(latestActivityMessage ? { latestActivityMessage } : {}),
    missingFollowUpTaskIds: normalizeTextList(readiness.missingFollowUpTaskIds, "readiness.missingFollowUpTaskIds"),
    missingTaskCount: nonNegativeInteger(readiness.missingTaskCount, "readiness.missingTaskCount"),
    nextActions: normalizeTextList(readiness.nextActions, "readiness.nextActions"),
    offerId: normalized.offerId,
    readinessHistoryVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
    readinessKey: normalized.readinessKey,
    readinessVersion: normalizeVersion(readiness.readinessVersion),
    recordedAt: normalized.recordedAt,
    recordedFollowUpTaskIds: normalizeTextList(readiness.recordedFollowUpTaskIds, "readiness.recordedFollowUpTaskIds"),
    recordedTaskCount: nonNegativeInteger(readiness.recordedTaskCount, "readiness.recordedTaskCount"),
    rfqId: normalized.rfqId,
    status: normalizeStatus(readiness.status),
    totalActivities: nonNegativeInteger(readiness.totalActivities, "readiness.totalActivities"),
    unexpectedFollowUpTaskIds: normalizeTextList(readiness.unexpectedFollowUpTaskIds, "readiness.unexpectedFollowUpTaskIds"),
    unexpectedTaskCount: nonNegativeInteger(readiness.unexpectedTaskCount, "readiness.unexpectedTaskCount"),
    unmatchedActivityCount: nonNegativeInteger(readiness.unmatchedActivityCount, "readiness.unmatchedActivityCount"),
  }
}

export function buildOfferFollowUpActivityReadinessHistoryRecordFromConvex(
  record: ConvexOfferFollowUpActivityReadinessRecord,
): OfferFollowUpActivityReadinessHistoryRecord {
  const latestActivityMessage = optionalTrim(record.latestActivityMessage)
  const readiness: OfferFollowUpActivityReadiness = {
    expectedFollowUpTaskIds: normalizeTextList(record.expectedFollowUpTaskIds, "record.expectedFollowUpTaskIds"),
    expectedTaskCount: nonNegativeInteger(record.expectedTaskCount, "record.expectedTaskCount"),
    ...(latestActivityMessage ? { latestActivityMessage } : {}),
    missingFollowUpTaskIds: normalizeTextList(record.missingFollowUpTaskIds, "record.missingFollowUpTaskIds"),
    missingTaskCount: nonNegativeInteger(record.missingTaskCount, "record.missingTaskCount"),
    nextActions: normalizeTextList(record.nextActions, "record.nextActions"),
    readinessVersion: normalizeVersion(record.readinessVersion),
    recordedFollowUpTaskIds: normalizeTextList(record.recordedFollowUpTaskIds, "record.recordedFollowUpTaskIds"),
    recordedTaskCount: nonNegativeInteger(record.recordedTaskCount, "record.recordedTaskCount"),
    status: normalizeStatus(record.status),
    totalActivities: nonNegativeInteger(record.totalActivities, "record.totalActivities"),
    unexpectedFollowUpTaskIds: normalizeTextList(record.unexpectedFollowUpTaskIds, "record.unexpectedFollowUpTaskIds"),
    unexpectedTaskCount: nonNegativeInteger(record.unexpectedTaskCount, "record.unexpectedTaskCount"),
    unmatchedActivityCount: nonNegativeInteger(record.unmatchedActivityCount, "record.unmatchedActivityCount"),
  }

  return normalizeHistoryRecord({
    offerId: nonBlank(record.offerId, "record.offerId"),
    readiness,
    readinessKey: nonBlank(record.readinessKey, "record.readinessKey"),
    recordedAt: normalizeRecordedAt(record.recordedAt),
    rfqId: nonBlank(record.rfqId, "record.rfqId"),
  })
}

function normalizeHistoryRecord(
  record: OfferFollowUpActivityReadinessHistoryRecord,
): OfferFollowUpActivityReadinessHistoryRecord {
  const summary = summarizeOfferFollowUpActivityReadinessHistory([record], record.readinessKey)
  const current = summary.currentReadiness
  const latestActivityMessage = optionalTrim(record.readiness.latestActivityMessage)
  if (!current) {
    throw new Error("follow-up activity readiness record could not be normalized")
  }

  return {
    offerId: current.offerId,
    readiness: {
      ...record.readiness,
      expectedFollowUpTaskIds: normalizeTextList(record.readiness.expectedFollowUpTaskIds, "readiness.expectedFollowUpTaskIds"),
      expectedTaskCount: current.expectedTaskCount,
      ...(latestActivityMessage ? { latestActivityMessage } : {}),
      missingFollowUpTaskIds: normalizeTextList(record.readiness.missingFollowUpTaskIds, "readiness.missingFollowUpTaskIds"),
      missingTaskCount: current.missingTaskCount,
      nextActions: normalizeTextList(record.readiness.nextActions, "readiness.nextActions"),
      readinessVersion: normalizeVersion(record.readiness.readinessVersion),
      recordedFollowUpTaskIds: normalizeTextList(record.readiness.recordedFollowUpTaskIds, "readiness.recordedFollowUpTaskIds"),
      recordedTaskCount: current.recordedTaskCount,
      status: current.status,
      totalActivities: current.totalActivities,
      unexpectedFollowUpTaskIds: normalizeTextList(record.readiness.unexpectedFollowUpTaskIds, "readiness.unexpectedFollowUpTaskIds"),
      unexpectedTaskCount: current.unexpectedTaskCount,
      unmatchedActivityCount: current.unmatchedActivityCount,
    },
    readinessKey: current.readinessKey,
    recordedAt: normalizeRecordedAt(current.recordedAt),
    rfqId: current.rfqId,
  }
}

function normalizeStatus(status: OfferFollowUpActivityReadinessStatus): OfferFollowUpActivityReadinessStatus {
  switch (status) {
    case "partial":
    case "pending":
    case "recorded":
    case "review":
      return status
    default:
      return unsupportedStatus(status)
  }
}

function normalizeVersion(
  version: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
): typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION {
  if (version !== OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION) {
    throw new Error("follow-up activity readiness version is not supported")
  }
  return version
}

function normalizeRecordedAt(value: string): string {
  const recordedAt = nonBlank(value, "record.recordedAt")
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(recordedAt)) {
    throw new Error("record.recordedAt must be a strict ISO timestamp")
  }
  const timestamp = Date.parse(recordedAt)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== recordedAt) {
    throw new Error("record.recordedAt must be a strict ISO timestamp")
  }
  return recordedAt
}

function normalizeTextList(values: unknown, fieldName: string): string[] {
  if (!Array.isArray(values)) {
    throw new Error(`${fieldName} must be an array`)
  }
  return values.map((value, index) => {
    if (typeof value !== "string") {
      throw new Error(`${fieldName}[${index}] must be a string`)
    }
    return nonBlank(value, `${fieldName}[${index}]`)
  })
}

function unsupportedStatus(status: never): never {
  void status
  throw new Error("follow-up activity readiness status is not supported")
}
