import type { CalendarRfqPlan } from "../integrations/calendarRfq"
import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { OfferFollowUpTask, OfferLifecycleTimeline } from "./offerLifecycle"

export interface ConvexOfferFollowUpActivityPayload {
  offerId: string
  message: string
  actorName?: string
  quoteId?: string
  rfqId?: string
}

export interface BuildConvexOfferFollowUpActivityPayloadsOptions {
  offerId: string
  actorName?: string
  calendarPlan?: CalendarRfqPlan
  quoteId?: string
  recordedFollowUpTaskIds?: string[]
  rfqId?: string
}

export function buildConvexOfferFollowUpActivityPayloads(
  timeline: OfferLifecycleTimeline,
  options: BuildConvexOfferFollowUpActivityPayloadsOptions,
): ConvexOfferFollowUpActivityPayload[] {
  const offerId = nonBlank(options.offerId, "offerId")
  const actorName = optionalTrim(options.actorName)
  const quoteId = optionalTrim(options.quoteId)
  const recordedTaskIds = normalizeRecordedTaskIds(options.recordedFollowUpTaskIds ?? [])
  const rfqId = optionalTrim(options.rfqId)
  const offerNumber = nonBlank(timeline.offerNumber, "timeline.offerNumber")
  const calendarEventsByTaskId = calendarFollowUpEventsByTaskId(options.calendarPlan, offerNumber)

  return timeline.followUpTasks
    .filter((task) => task.status === "open")
    .sort((left, right) => compareLex(left.dueAt, right.dueAt) || compareLex(left.id, right.id))
    .filter((task) => !recordedTaskIds.has(nonBlank(task.id, "followUpTask.id")))
    .map((task) => buildPayloadForTask({
      actorName,
      calendarTitle: calendarEventsByTaskId.get(task.id)?.title,
      offerId,
      offerNumber,
      quoteId,
      rfqId,
      task,
    }))
}

function buildPayloadForTask(input: {
  actorName?: string
  calendarTitle?: string
  offerId: string
  offerNumber: string
  quoteId?: string
  rfqId?: string
  task: OfferFollowUpTask
}): ConvexOfferFollowUpActivityPayload {
  const taskId = nonBlank(input.task.id, "followUpTask.id")
  if (input.task.offerNumber !== input.offerNumber) {
    throw new Error(`follow-up task ${taskId} offerNumber ${input.task.offerNumber} does not match ${input.offerNumber}`)
  }

  const dueAt = normalizeIsoTimestamp(input.task.dueAt, `followUpTask.${taskId}.dueAt`)
  const calendarDetail = input.calendarTitle ? ` Calendar: ${input.calendarTitle}.` : ""
  return {
    ...(input.actorName ? { actorName: input.actorName } : {}),
    message: `Scheduled offer follow-up ${taskId} for ${input.offerNumber} at ${dueAt}.${calendarDetail}`,
    offerId: input.offerId,
    ...(input.quoteId ? { quoteId: input.quoteId } : {}),
    ...(input.rfqId ? { rfqId: input.rfqId } : {}),
  }
}

function calendarFollowUpEventsByTaskId(calendarPlan: CalendarRfqPlan | undefined, offerNumber: string) {
  const eventsByTaskId = new Map<string, { title: string }>()
  for (const [index, event] of (calendarPlan?.events ?? []).entries()) {
    if (event.kind !== "offer_follow_up") {
      continue
    }

    const eventOfferNumber = optionalTrim(event.metadata.offerNumber)
    if (eventOfferNumber && eventOfferNumber !== offerNumber) {
      throw new Error(`calendar event ${index} offerNumber ${eventOfferNumber} does not match ${offerNumber}`)
    }

    const followUpTaskId = optionalTrim(event.metadata.followUpTaskId)
    if (!followUpTaskId) {
      throw new Error(`calendarPlan.events[${index}].metadata.followUpTaskId is required`)
    }
    if (eventsByTaskId.has(followUpTaskId)) {
      throw new Error(`duplicate calendar event for follow-up task ${followUpTaskId}`)
    }
    eventsByTaskId.set(followUpTaskId, {
      title: nonBlank(event.title, `calendarPlan.events[${index}].title`),
    })
  }
  return eventsByTaskId
}

function normalizeRecordedTaskIds(values: string[]): Set<string> {
  return new Set(values.map((value, index) => nonBlank(value, `recordedFollowUpTaskIds[${index}]`)))
}
