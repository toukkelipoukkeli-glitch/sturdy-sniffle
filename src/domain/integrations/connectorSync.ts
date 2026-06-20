import {
  createCalendarRfqScheduler,
  type CalendarRfqScheduleResult,
  type CalendarRfqScheduler,
} from "./calendarRfq"
import {
  createGmailRfqIntakeAdapter,
  type GmailRfqIngestResult,
  type GmailRfqIntakeAdapter,
  type GmailRfqIntakeRecord,
  type GmailRfqSearchRequest,
} from "./gmailRfq"

export const CONNECTOR_RFQ_SYNC_VERSION = "connector-rfq-sync.v1"

export type ConnectorRfqSyncStatus = "succeeded" | "fallback" | "partial" | "failed" | "skipped"

export interface ConnectorRfqSyncRequest {
  gmail: GmailRfqSearchRequest
  timezone: string
  quoteWorkMinutes?: number
  dueReminderMinutes?: number
}

export interface ConnectorRfqSyncRecord {
  calendar: CalendarRfqScheduleResult
  messageId: string
  parsedSubject: string
  rfqId: string
  status: "scheduled" | "calendar_fallback" | "calendar_failed" | "calendar_skipped"
  threadId?: string
  warnings: string[]
}

export interface ConnectorRfqSyncResult {
  adapterVersion: typeof CONNECTOR_RFQ_SYNC_VERSION
  gmail: GmailRfqIngestResult
  records: ConnectorRfqSyncRecord[]
  status: ConnectorRfqSyncStatus
  warnings: string[]
}

export interface ConnectorRfqSyncOrchestrator {
  adapterVersion: typeof CONNECTOR_RFQ_SYNC_VERSION
  syncRfqInbox(request: ConnectorRfqSyncRequest): Promise<ConnectorRfqSyncResult>
}

export interface ConnectorRfqSyncOrchestratorOptions {
  calendarScheduler?: CalendarRfqScheduler
  gmailAdapter?: GmailRfqIntakeAdapter
  resolveRfqId?: (record: GmailRfqIntakeRecord, index: number) => string
}

export function createConnectorRfqSyncOrchestrator(
  options: ConnectorRfqSyncOrchestratorOptions = {},
): ConnectorRfqSyncOrchestrator {
  const gmailAdapter = options.gmailAdapter ?? createGmailRfqIntakeAdapter()
  const calendarScheduler = options.calendarScheduler ?? createCalendarRfqScheduler()
  const resolveRfqId = options.resolveRfqId ?? defaultRfqId

  return {
    adapterVersion: CONNECTOR_RFQ_SYNC_VERSION,
    async syncRfqInbox(request) {
      const timezone = nonBlank(request.timezone, "timezone")
      const gmail = await gmailAdapter.ingest(request.gmail)
      const records: ConnectorRfqSyncRecord[] = []

      for (const [index, record] of gmail.records.entries()) {
        const rfqId = nonBlank(resolveRfqId(record, index), "rfqId")
        const calendar = await calendarScheduler.scheduleRfqPlan({
          dueReminderMinutes: request.dueReminderMinutes,
          parsedRfq: record.parsed,
          quoteWorkMinutes: request.quoteWorkMinutes,
          rfqId,
          timezone,
        })
        records.push({
          calendar,
          messageId: record.messageId,
          parsedSubject: record.parsed.subject,
          rfqId,
          status: calendarStatus(calendar),
          threadId: record.threadId,
          warnings: calendar.warnings,
        })
      }

      return {
        adapterVersion: CONNECTOR_RFQ_SYNC_VERSION,
        gmail,
        records,
        status: syncStatus(gmail, records),
        warnings: collectWarnings(gmail, records),
      }
    },
  }
}

function syncStatus(gmail: GmailRfqIngestResult, records: ConnectorRfqSyncRecord[]): ConnectorRfqSyncStatus {
  if (gmail.status === "failed") {
    return "failed"
  }
  if (records.length === 0) {
    return "skipped"
  }
  if (records.some((record) => record.status === "calendar_failed")) {
    return "partial"
  }
  if (gmail.status === "fallback" || records.some((record) => record.status === "calendar_fallback")) {
    return "fallback"
  }
  return "succeeded"
}

function calendarStatus(result: CalendarRfqScheduleResult): ConnectorRfqSyncRecord["status"] {
  if (result.status === "failed") {
    return "calendar_failed"
  }
  if (result.status === "fallback") {
    return "calendar_fallback"
  }
  if (result.status === "skipped") {
    return "calendar_skipped"
  }
  return "scheduled"
}

function collectWarnings(gmail: GmailRfqIngestResult, records: ConnectorRfqSyncRecord[]): string[] {
  return [
    ...gmail.warnings,
    ...records.flatMap((record) => record.warnings.map((warning) => `${record.rfqId}: ${warning}`)),
  ]
}

function defaultRfqId(record: GmailRfqIntakeRecord, index: number): string {
  const externalId = record.threadId ?? record.messageId
  return `rfq-${sanitizeId(externalId)}-${String(index + 1).padStart(3, "0")}`
}

function sanitizeId(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return normalized || "gmail-message"
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
