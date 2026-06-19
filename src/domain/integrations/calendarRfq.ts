import type { ParsedRfqIntake } from "../rfq/intake"

export const CALENDAR_RFQ_ADAPTER_VERSION = "calendar-rfq.v1"

export type CalendarRfqProviderKey = "calendar" | "mock"
export type CalendarRfqScheduleStatus = "succeeded" | "fallback" | "failed" | "skipped"
export type CalendarRfqEventKind = "quote_due" | "quote_work_hold" | "offer_follow_up"

export interface CalendarRfqEventDraft {
  kind: CalendarRfqEventKind
  title: string
  startAt: string
  endAt: string
  timezone: string
  description?: string
  metadata: Record<string, string>
}

export interface CalendarRfqPlan {
  events: CalendarRfqEventDraft[]
  warnings: string[]
}

export interface BuildRfqCalendarPlanRequest {
  rfqId: string
  parsedRfq: ParsedRfqIntake
  timezone: string
  quoteWorkMinutes?: number
  dueReminderMinutes?: number
}

export interface BuildOfferFollowUpEventRequest {
  offerId: string
  offerNumber: string
  customerName: string
  followUpAt: string
  timezone: string
  durationMinutes?: number
}

export interface CalendarRfqProviderEventResult {
  status: "created" | "skipped"
  externalId?: string
  event: CalendarRfqEventDraft
  warnings: string[]
}

export interface CalendarRfqProviderAdapter {
  provider: CalendarRfqProviderKey
  adapterVersion: string
  createEvents(events: CalendarRfqEventDraft[]): Promise<CalendarRfqProviderEventResult[]>
}

export interface CalendarRfqScheduleResult {
  provider: CalendarRfqProviderKey
  adapterVersion: string
  status: CalendarRfqScheduleStatus
  plan: CalendarRfqPlan
  results: CalendarRfqProviderEventResult[]
  warnings: string[]
}

export interface CalendarRfqScheduler {
  adapterVersion: string
  scheduleRfqPlan(request: BuildRfqCalendarPlanRequest): Promise<CalendarRfqScheduleResult>
}

export interface CalendarRfqSchedulerOptions {
  provider?: CalendarRfqProviderAdapter
  fallbackProvider?: CalendarRfqProviderAdapter
}

export interface MockCalendarRfqProviderOptions {
  adapterVersion?: string
  shouldFail?: boolean
  skipKinds?: CalendarRfqEventKind[]
}

const defaultQuoteWorkMinutes = 120
const defaultDueReminderMinutes = 30
const defaultFollowUpDurationMinutes = 30

export function createCalendarRfqScheduler(options: CalendarRfqSchedulerOptions = {}): CalendarRfqScheduler {
  const fallbackProvider = options.fallbackProvider ?? createMockCalendarRfqProvider()
  const provider = options.provider ?? fallbackProvider

  return {
    adapterVersion: CALENDAR_RFQ_ADAPTER_VERSION,
    async scheduleRfqPlan(request) {
      const plan = buildRfqCalendarPlan(request)
      if (plan.events.length === 0) {
        return {
          provider: provider.provider,
          adapterVersion: provider.adapterVersion,
          status: "skipped",
          plan,
          results: [],
          warnings: plan.warnings,
        }
      }

      try {
        const results = await provider.createEvents(plan.events)
        return {
          provider: provider.provider,
          adapterVersion: provider.adapterVersion,
          status: "succeeded",
          plan,
          results,
          warnings: plan.warnings,
        }
      } catch (error) {
        const primaryWarning = `Calendar provider ${provider.provider} failed: ${errorToMessage(error)}.`
        try {
          const fallbackResults = await fallbackProvider.createEvents(plan.events)
          return {
            provider: fallbackProvider.provider,
            adapterVersion: fallbackProvider.adapterVersion,
            status: "fallback",
            plan,
            results: fallbackResults,
            warnings: [...plan.warnings, primaryWarning, `Used ${fallbackProvider.provider} calendar fallback.`],
          }
        } catch (fallbackError) {
          return {
            provider: fallbackProvider.provider,
            adapterVersion: fallbackProvider.adapterVersion,
            status: "failed",
            plan,
            results: [],
            warnings: [
              ...plan.warnings,
              primaryWarning,
              `Fallback calendar provider ${fallbackProvider.provider} failed: ${errorToMessage(fallbackError)}.`,
            ],
          }
        }
      }
    },
  }
}

export function createMockCalendarRfqProvider(options: MockCalendarRfqProviderOptions = {}): CalendarRfqProviderAdapter {
  const adapterVersion = options.adapterVersion ?? `${CALENDAR_RFQ_ADAPTER_VERSION}.mock`
  const skipKinds = new Set(options.skipKinds ?? [])

  return {
    provider: "mock",
    adapterVersion,
    async createEvents(events) {
      if (options.shouldFail) {
        throw new Error("Mock calendar provider failure")
      }

      return events.map((event, index) => {
        if (skipKinds.has(event.kind)) {
          return {
            status: "skipped",
            event,
            warnings: [`Mock calendar skipped ${event.kind}.`],
          }
        }

        return {
          status: "created",
          externalId: `mock-calendar-${String(index + 1).padStart(3, "0")}`,
          event,
          warnings: [],
        }
      })
    },
  }
}

export function buildRfqCalendarPlan(request: BuildRfqCalendarPlanRequest): CalendarRfqPlan {
  const rfqId = nonBlank(request.rfqId, "rfqId")
  const timezone = nonBlank(request.timezone, "timezone")
  const dueAt = request.parsedRfq.dueAt
  if (dueAt === undefined) {
    return {
      events: [],
      warnings: ["RFQ has no due date; calendar quote due events were not created."],
    }
  }

  const quoteWorkMinutes = positiveInteger(request.quoteWorkMinutes ?? defaultQuoteWorkMinutes, "quoteWorkMinutes")
  const dueReminderMinutes = positiveInteger(request.dueReminderMinutes ?? defaultDueReminderMinutes, "dueReminderMinutes")
  const dueDate = new Date(dueAt)
  const dueReminderStart = addMinutes(dueDate, -dueReminderMinutes)
  const workHoldEnd = addMinutes(dueDate, -60)
  const workHoldStart = addMinutes(workHoldEnd, -quoteWorkMinutes)
  const partSummary = summarizeParts(request.parsedRfq)

  return {
    events: [
      {
        kind: "quote_work_hold",
        title: `Quote work: ${request.parsedRfq.subject}`,
        startAt: workHoldStart.toISOString(),
        endAt: workHoldEnd.toISOString(),
        timezone,
        description: partSummary,
        metadata: {
          rfqId,
          priority: request.parsedRfq.priority,
          source: "rfq_due_date",
        },
      },
      {
        kind: "quote_due",
        title: `Quote due: ${request.parsedRfq.subject}`,
        startAt: dueReminderStart.toISOString(),
        endAt: dueDate.toISOString(),
        timezone,
        description: partSummary,
        metadata: {
          rfqId,
          priority: request.parsedRfq.priority,
          source: "rfq_due_date",
        },
      },
    ],
    warnings: [],
  }
}

export function buildOfferFollowUpEvent(request: BuildOfferFollowUpEventRequest): CalendarRfqEventDraft {
  const offerId = nonBlank(request.offerId, "offerId")
  const offerNumber = nonBlank(request.offerNumber, "offerNumber")
  const customerName = nonBlank(request.customerName, "customerName")
  const timezone = nonBlank(request.timezone, "timezone")
  const followUpAt = parseRequiredDate(request.followUpAt, "followUpAt")
  const durationMinutes = positiveInteger(request.durationMinutes ?? defaultFollowUpDurationMinutes, "durationMinutes")

  return {
    kind: "offer_follow_up",
    title: `Follow up: ${offerNumber}`,
    startAt: followUpAt.toISOString(),
    endAt: addMinutes(followUpAt, durationMinutes).toISOString(),
    timezone,
    description: `Follow up with ${customerName} about offer ${offerNumber}.`,
    metadata: {
      offerId,
      offerNumber,
      customerName,
      source: "offer_follow_up",
    },
  }
}

function summarizeParts(parsedRfq: ParsedRfqIntake): string {
  if (parsedRfq.parts.length === 0) {
    return parsedRfq.summary ?? parsedRfq.subject
  }

  return parsedRfq.parts
    .map((part) => {
      const quantity = part.quantity === undefined ? "" : ` qty ${part.quantity}`
      const process = part.process === undefined ? "" : ` ${part.process}`
      return `${part.partNumber}${quantity}${process}`.trim()
    })
    .join("; ")
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

function parseRequiredDate(value: string, fieldName: string): Date {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid ${fieldName}: ${value}`)
  }
  return new Date(timestamp)
}

function positiveInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
  return value
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
