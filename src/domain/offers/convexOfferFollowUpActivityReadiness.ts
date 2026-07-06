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

  return {
    expectedFollowUpTaskIds: normalizeTextList(readiness.expectedFollowUpTaskIds, "readiness.expectedFollowUpTaskIds"),
    expectedTaskCount: nonNegativeInteger(readiness.expectedTaskCount, "readiness.expectedTaskCount"),
    ...(optionalTrim(readiness.latestActivityMessage) ? { latestActivityMessage: optionalTrim(readiness.latestActivityMessage) } : {}),
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
  const readiness: OfferFollowUpActivityReadiness = {
    expectedFollowUpTaskIds: normalizeTextList(record.expectedFollowUpTaskIds, "record.expectedFollowUpTaskIds"),
    expectedTaskCount: nonNegativeInteger(record.expectedTaskCount, "record.expectedTaskCount"),
    ...(optionalTrim(record.latestActivityMessage) ? { latestActivityMessage: optionalTrim(record.latestActivityMessage) } : {}),
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
  if (!current) {
    throw new Error("follow-up activity readiness record could not be normalized")
  }

  return {
    offerId: current.offerId,
    readiness: {
      ...record.readiness,
      expectedFollowUpTaskIds: normalizeTextList(record.readiness.expectedFollowUpTaskIds, "readiness.expectedFollowUpTaskIds"),
      expectedTaskCount: current.expectedTaskCount,
      ...(optionalTrim(record.readiness.latestActivityMessage) ? { latestActivityMessage: optionalTrim(record.readiness.latestActivityMessage) } : {}),
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
    recordedAt: current.recordedAt,
    rfqId: current.rfqId,
  }
}

function normalizeStatus(status: OfferFollowUpActivityReadinessStatus): OfferFollowUpActivityReadinessStatus {
  if (status !== "partial" && status !== "pending" && status !== "recorded" && status !== "review") {
    throw new Error("follow-up activity readiness status is not supported")
  }
  return status
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
  if (!Number.isFinite(Date.parse(recordedAt))) {
    throw new Error("record.recordedAt must be a valid date string")
  }
  return recordedAt
}

function normalizeTextList(values: string[], fieldName: string): string[] {
  return values.map((value, index) => nonBlank(value, `${fieldName}[${index}]`))
}
