import { compareLex } from "../shared/deterministic"

export const OFFER_FOLLOW_UP_ACTIVITY_READ_VERSION = "offer-follow-up-activity-read.v1"

export interface ConvexOfferFollowUpActivityRecord {
  _id?: string
  actorName?: string
  createdAt: number
  kind: "calendar_event"
  message: string
  offerId: string
  quoteId?: string
  rfqId?: string
}

export interface OfferFollowUpActivityReadOptions {
  limit?: number
  offerId: unknown
}

export interface OfferFollowUpActivityReadSummary {
  readVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READ_VERSION
  totalActivities: number
  latestActivity?: OfferFollowUpActivityReadItem
  recordedFollowUpTaskIds: string[]
  messages: string[]
}

export interface OfferFollowUpActivityReadItem {
  activityId?: string
  actorName?: string
  createdAt: number
  followUpTaskId?: string
  message: string
  offerId: string
  quoteId?: string
  rfqId?: string
}

export interface OfferFollowUpActivityReadAdapter {
  listActivities(options: OfferFollowUpActivityReadOptions): Promise<OfferFollowUpActivityReadSummary>
}

export interface LocalOfferFollowUpActivityReadOptions {
  records?: ConvexOfferFollowUpActivityRecord[]
}

export interface ConvexOfferFollowUpActivityReadOptions {
  fallback?: OfferFollowUpActivityReadAdapter
  onQueryError?: (error: unknown, args: Record<string, unknown>) => void
  queryRef: unknown
  runQuery: (queryRef: unknown, args: Record<string, unknown>) => Promise<unknown>
}

export function summarizeOfferFollowUpActivities(
  records: ConvexOfferFollowUpActivityRecord[],
  options: OfferFollowUpActivityReadOptions,
): OfferFollowUpActivityReadSummary {
  const offerId = nonBlankUnknown(options.offerId, "offerId")
  const normalizedRecords = records
    .map(normalizeActivityRecord)
    .filter((record) => record.offerId === offerId)
    .sort(sortNewestFirst)
  const limit = options.limit === undefined ? normalizedRecords.length : nonNegativeInteger(options.limit, "limit")
  const limitedRecords = normalizedRecords.slice(0, limit)
  const items = limitedRecords.map(toReadItem)

  return {
    readVersion: OFFER_FOLLOW_UP_ACTIVITY_READ_VERSION,
    totalActivities: items.length,
    latestActivity: items[0],
    recordedFollowUpTaskIds: uniqueSorted(items.flatMap((item) => (item.followUpTaskId ? [item.followUpTaskId] : []))),
    messages: items.map((item) => item.message),
  }
}

export function createLocalOfferFollowUpActivityReader({
  records = [],
}: LocalOfferFollowUpActivityReadOptions = {}): OfferFollowUpActivityReadAdapter {
  const localRecords = records.map(cloneRecord)

  return {
    async listActivities(options) {
      return summarizeOfferFollowUpActivities(localRecords, options)
    },
  }
}

export function createConvexOfferFollowUpActivityReader({
  fallback = createLocalOfferFollowUpActivityReader(),
  onQueryError,
  queryRef,
  runQuery,
}: ConvexOfferFollowUpActivityReadOptions): OfferFollowUpActivityReadAdapter {
  return {
    async listActivities(options) {
      const args = compactListArgs(options)
      try {
        return summarizeOfferFollowUpActivities(normalizeQueryRecords(await runQuery(queryRef, args)), options)
      } catch (error) {
        try {
          onQueryError?.(error, args)
        } catch {
          // Local fallback must remain available even if observers fail.
        }
        return await fallback.listActivities(options)
      }
    },
  }
}

function compactListArgs(options: OfferFollowUpActivityReadOptions): Record<string, unknown> {
  return {
    ...(options.limit === undefined ? {} : { limit: nonNegativeInteger(options.limit, "limit") }),
    offerId: nonBlankUnknown(options.offerId, "offerId"),
  }
}

function normalizeQueryRecords(records: unknown): ConvexOfferFollowUpActivityRecord[] {
  if (!Array.isArray(records)) {
    throw new Error("offer follow-up activity query must return an array")
  }
  return records.map(normalizeQueryRecord)
}

function normalizeQueryRecord(record: unknown): ConvexOfferFollowUpActivityRecord {
  if (!record || typeof record !== "object") {
    throw new Error("offer follow-up activity query record must be an object")
  }
  const value = record as Record<string, unknown>
  return {
    ...(value._id === undefined ? {} : { _id: nonBlankUnknown(value._id, "record._id") }),
    ...(value.actorName === undefined ? {} : { actorName: optionalUnknownText(value.actorName, "record.actorName") }),
    createdAt: nonNegativeInteger(value.createdAt, "record.createdAt"),
    kind: normalizeKind(value.kind),
    message: nonBlankUnknown(value.message, "record.message"),
    offerId: nonBlankUnknown(value.offerId, "record.offerId"),
    ...(value.quoteId === undefined ? {} : { quoteId: optionalUnknownText(value.quoteId, "record.quoteId") }),
    ...(value.rfqId === undefined ? {} : { rfqId: optionalUnknownText(value.rfqId, "record.rfqId") }),
  }
}

function normalizeActivityRecord(record: ConvexOfferFollowUpActivityRecord): ConvexOfferFollowUpActivityRecord {
  return {
    ...(record._id ? { _id: nonBlankUnknown(record._id, "record._id") } : {}),
    ...(record.actorName ? { actorName: optionalUnknownText(record.actorName, "record.actorName") } : {}),
    createdAt: nonNegativeInteger(record.createdAt, "record.createdAt"),
    kind: normalizeKind(record.kind),
    message: nonBlankUnknown(record.message, "record.message"),
    offerId: nonBlankUnknown(record.offerId, "record.offerId"),
    ...(record.quoteId ? { quoteId: optionalUnknownText(record.quoteId, "record.quoteId") } : {}),
    ...(record.rfqId ? { rfqId: optionalUnknownText(record.rfqId, "record.rfqId") } : {}),
  }
}

function toReadItem(record: ConvexOfferFollowUpActivityRecord): OfferFollowUpActivityReadItem {
  return {
    ...(record._id ? { activityId: record._id } : {}),
    ...(record.actorName ? { actorName: record.actorName } : {}),
    createdAt: record.createdAt,
    followUpTaskId: extractFollowUpTaskId(record.message),
    message: record.message,
    offerId: record.offerId,
    ...(record.quoteId ? { quoteId: record.quoteId } : {}),
    ...(record.rfqId ? { rfqId: record.rfqId } : {}),
  }
}

function sortNewestFirst(left: ConvexOfferFollowUpActivityRecord, right: ConvexOfferFollowUpActivityRecord) {
  return (
    right.createdAt - left.createdAt ||
    compareLex(left._id ?? "", right._id ?? "") ||
    compareLex(left.message, right.message)
  )
}

function extractFollowUpTaskId(message: string): string | undefined {
  const match = /^Scheduled offer follow-up ([^\s]+) for /.exec(message)
  return match?.[1]
}

function cloneRecord(record: ConvexOfferFollowUpActivityRecord): ConvexOfferFollowUpActivityRecord {
  return {
    ...(record._id ? { _id: record._id } : {}),
    ...(record.actorName ? { actorName: record.actorName } : {}),
    createdAt: record.createdAt,
    kind: record.kind,
    message: record.message,
    offerId: record.offerId,
    ...(record.quoteId ? { quoteId: record.quoteId } : {}),
    ...(record.rfqId ? { rfqId: record.rfqId } : {}),
  }
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort(compareLex)
}

function nonBlankUnknown(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be a non-empty string`)
  }
  return value.trim()
}

function optionalUnknownText(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`)
  }
  return value.trim() || undefined
}

function nonNegativeInteger(value: unknown, fieldName: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`)
  }
  return Number(value)
}

function normalizeKind(value: unknown): "calendar_event" {
  if (value !== "calendar_event") {
    throw new Error("record.kind must be calendar_event")
  }
  return value
}
