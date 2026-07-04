import {
  buildOfferReleaseExecutionHistoryFromConvex,
  type BuildOfferReleaseExecutionHistoryFromConvexOptions,
  type ConvexOfferReleaseExecutionHistoryRecord,
} from "./convexOfferReleaseExecution"
import type { OfferReleaseExecutionHistorySummary } from "./offerReleaseExecutionHistory"

export interface OfferReleaseExecutionReadOptions extends BuildOfferReleaseExecutionHistoryFromConvexOptions {
  limit?: number
  offerId: unknown
}

export interface OfferReleaseExecutionReadAdapter {
  listExecutions(options: OfferReleaseExecutionReadOptions): Promise<OfferReleaseExecutionHistorySummary>
}

export interface LocalOfferReleaseExecutionReadOptions {
  records?: ConvexOfferReleaseExecutionHistoryRecord[]
}

export interface ConvexOfferReleaseExecutionReadOptions {
  fallback?: OfferReleaseExecutionReadAdapter
  onQueryError?: (error: unknown, args: Record<string, unknown>) => void
  queryRef: unknown
  runQuery: (queryRef: unknown, args: Record<string, unknown>) => Promise<unknown>
}

export function createLocalOfferReleaseExecutionReader({
  records = [],
}: LocalOfferReleaseExecutionReadOptions = {}): OfferReleaseExecutionReadAdapter {
  const localRecords = records.map(cloneRecord)

  return {
    async listExecutions(options) {
      return buildOfferReleaseExecutionHistoryFromConvex(
        localRecords.filter((record) => record.offerId === nonBlankUnknown(options.offerId, "offerId")),
        options,
      )
    },
  }
}

export function createConvexOfferReleaseExecutionReader({
  fallback = createLocalOfferReleaseExecutionReader(),
  onQueryError,
  queryRef,
  runQuery,
}: ConvexOfferReleaseExecutionReadOptions): OfferReleaseExecutionReadAdapter {
  return {
    async listExecutions(options) {
      const args = compactListArgs(options)
      try {
        return buildOfferReleaseExecutionHistoryFromConvex(normalizeQueryRecords(await runQuery(queryRef, args)), options)
      } catch (error) {
        try {
          onQueryError?.(error, args)
        } catch {
          // Local fallback must remain available even if observers fail.
        }
        return await fallback.listExecutions(options)
      }
    },
  }
}

function compactListArgs(options: OfferReleaseExecutionReadOptions): Record<string, unknown> {
  return {
    ...(options.limit === undefined ? {} : { limit: nonNegativeInteger(options.limit, "limit") }),
    offerId: nonBlankUnknown(options.offerId, "offerId"),
  }
}

function normalizeQueryRecords(records: unknown): ConvexOfferReleaseExecutionHistoryRecord[] {
  if (!Array.isArray(records)) {
    throw new Error("offer release execution query must return an array")
  }
  return records.map(normalizeQueryRecord)
}

function normalizeQueryRecord(record: unknown): ConvexOfferReleaseExecutionHistoryRecord {
  if (!record || typeof record !== "object") {
    throw new Error("offer release execution query record must be an object")
  }
  const value = record as Record<string, unknown>
  return {
    executedAt: nonBlankUnknown(value.executedAt, "record.executedAt"),
    executionFingerprint: optionalUnknownText(value.executionFingerprint),
    executionKey: nonBlankUnknown(value.executionKey, "record.executionKey"),
    mode: normalizeMode(value.mode),
    nextActions: normalizeUnknownTextList(value.nextActions, "record.nextActions"),
    offerId: nonBlankUnknown(value.offerId, "record.offerId"),
    offerNumber: optionalUnknownText(value.offerNumber),
    status: normalizeStatus(value.status),
    warningCount: value.warningCount === undefined ? undefined : nonNegativeInteger(value.warningCount, "record.warningCount"),
    warnings: value.warnings === undefined ? undefined : normalizeUnknownTextList(value.warnings, "record.warnings"),
  }
}

function cloneRecord(record: ConvexOfferReleaseExecutionHistoryRecord): ConvexOfferReleaseExecutionHistoryRecord {
  return {
    executedAt: record.executedAt,
    ...(record.executionFingerprint ? { executionFingerprint: record.executionFingerprint } : {}),
    executionKey: record.executionKey,
    mode: record.mode,
    nextActions: [...record.nextActions],
    offerId: record.offerId,
    ...(record.offerNumber ? { offerNumber: record.offerNumber } : {}),
    status: record.status,
    ...(record.warningCount === undefined ? {} : { warningCount: record.warningCount }),
    ...(record.warnings ? { warnings: [...record.warnings] } : {}),
  }
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
  if (typeof value !== "string") {
    throw new Error("optional text must be a string")
  }
  return value.trim() || undefined
}

function normalizeUnknownTextList(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`)
  }
  return value.map((item) => nonBlankUnknown(item, fieldName))
}

function nonNegativeInteger(value: unknown, fieldName: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`)
  }
  return Number(value)
}

function normalizeMode(value: unknown): ConvexOfferReleaseExecutionHistoryRecord["mode"] {
  if (value !== "commit" && value !== "dry_run") {
    throw new Error("record.mode must be commit or dry_run")
  }
  return value
}

function normalizeStatus(value: unknown): ConvexOfferReleaseExecutionHistoryRecord["status"] {
  if (
    value !== "blocked" &&
    value !== "failed" &&
    value !== "needs_review" &&
    value !== "partial" &&
    value !== "pending" &&
    value !== "prepared" &&
    value !== "succeeded"
  ) {
    throw new Error("record.status is not a supported release execution status")
  }
  return value
}
