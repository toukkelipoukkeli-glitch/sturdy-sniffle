import type { OfferDraft, OfferStatus } from "./offer"

export const OFFER_LIFECYCLE_VERSION = "offer-lifecycle.v1"

export type OfferLifecycleEventKind =
  | "sent"
  | "accepted"
  | "declined"
  | "follow_up_scheduled"
  | "follow_up_completed"
  | "note_added"
export type OfferFollowUpTaskStatus = "open" | "completed" | "cancelled"

export interface OfferLifecycleEventInput {
  kind: OfferLifecycleEventKind
  actor: string
  occurredAt: string
  followUpDueAt?: string
  followUpTaskId?: string
  note?: string
}

export interface OfferLifecycleEvent {
  key: string
  kind: OfferLifecycleEventKind
  actor: string
  occurredAt: string
  statusAfter: OfferStatus
  followUpTaskId?: string
  note?: string
}

export interface OfferFollowUpTask {
  id: string
  offerNumber: string
  title: string
  dueAt: string
  createdAt: string
  status: OfferFollowUpTaskStatus
  cancelledAt?: string
  completedAt?: string
}

export interface OfferLifecycleTimeline {
  lifecycleVersion: typeof OFFER_LIFECYCLE_VERSION
  offerNumber: string
  status: OfferStatus
  events: OfferLifecycleEvent[]
  followUpTasks: OfferFollowUpTask[]
}

interface NormalizedEventInput extends OfferLifecycleEventInput {
  inputIndex: number
  occurredAt: string
}

export function buildOfferLifecycleTimeline(offer: OfferDraft, eventInputs: OfferLifecycleEventInput[]): OfferLifecycleTimeline {
  const normalizedInputs = normalizeEventInputs(eventInputs)
  let status: OfferStatus = offer.status
  const events: OfferLifecycleEvent[] = []
  const tasks = new Map<string, OfferFollowUpTask>()

  normalizedInputs.forEach((eventInput, index) => {
    status = applyEvent({
      eventInput,
      eventKey: `${offer.offerNumber}:event-${index + 1}`,
      offer,
      status,
      tasks,
      timeline: events,
    })
  })

  return {
    lifecycleVersion: OFFER_LIFECYCLE_VERSION,
    offerNumber: offer.offerNumber,
    status,
    events,
    followUpTasks: [...tasks.values()].sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id)),
  }
}

function applyEvent(input: {
  eventInput: NormalizedEventInput
  eventKey: string
  offer: OfferDraft
  status: OfferStatus
  tasks: Map<string, OfferFollowUpTask>
  timeline: OfferLifecycleEvent[]
}): OfferStatus {
  const { eventInput, eventKey, offer, tasks, timeline } = input
  let status = input.status
  const actor = nonBlank(eventInput.actor, `events[${eventInput.inputIndex}].actor`)
  const note = optionalTrim(eventInput.note)
  const followUpTaskId = optionalTrim(eventInput.followUpTaskId)

  switch (eventInput.kind) {
    case "sent":
      assertStatus(status, ["draft"], "sent")
      status = "sent"
      break
    case "accepted":
      assertStatus(status, ["sent"], "accepted")
      status = "accepted"
      cancelOpenTasks(tasks, eventInput.occurredAt)
      break
    case "declined":
      assertStatus(status, ["sent"], "declined")
      status = "declined"
      cancelOpenTasks(tasks, eventInput.occurredAt)
      break
    case "follow_up_scheduled":
      assertStatus(status, ["sent"], "follow_up_scheduled")
      scheduleFollowUpTask({ eventInput, followUpTaskId, offer, tasks })
      break
    case "follow_up_completed":
      assertStatus(status, ["sent"], "follow_up_completed")
      completeFollowUpTask(tasks, followUpTaskId, eventInput.occurredAt)
      break
    case "note_added":
      break
  }

  timeline.push({
    key: eventKey,
    kind: eventInput.kind,
    actor,
    occurredAt: eventInput.occurredAt,
    statusAfter: status,
    followUpTaskId,
    note,
  })
  return status
}

function scheduleFollowUpTask(input: {
  eventInput: NormalizedEventInput
  followUpTaskId?: string
  offer: OfferDraft
  tasks: Map<string, OfferFollowUpTask>
}) {
  const taskId = nonBlank(input.followUpTaskId ?? "", `events[${input.eventInput.inputIndex}].followUpTaskId`)
  if (input.tasks.has(taskId)) {
    throw new Error(`follow-up task ${taskId} already exists`)
  }
  const dueAt = normalizeIsoTimestamp(input.eventInput.followUpDueAt ?? "", `events[${input.eventInput.inputIndex}].followUpDueAt`)

  input.tasks.set(taskId, {
    id: taskId,
    offerNumber: input.offer.offerNumber,
    title: `Follow up ${input.offer.offerNumber}`,
    dueAt,
    createdAt: input.eventInput.occurredAt,
    status: "open",
  })
}

function completeFollowUpTask(tasks: Map<string, OfferFollowUpTask>, followUpTaskId: string | undefined, completedAt: string) {
  const taskId = nonBlank(followUpTaskId ?? "", "followUpTaskId")
  const task = tasks.get(taskId)
  if (!task) {
    throw new Error(`follow-up task ${taskId} does not exist`)
  }
  if (task.status !== "open") {
    throw new Error(`follow-up task ${taskId} is not open`)
  }

  tasks.set(taskId, {
    ...task,
    completedAt,
    status: "completed",
  })
}

function cancelOpenTasks(tasks: Map<string, OfferFollowUpTask>, cancelledAt: string) {
  for (const task of tasks.values()) {
    if (task.status === "open") {
      tasks.set(task.id, {
        ...task,
        cancelledAt,
        status: "cancelled",
      })
    }
  }
}

function normalizeEventInputs(events: OfferLifecycleEventInput[]): NormalizedEventInput[] {
  return events
    .map((event, index) => ({
      ...event,
      actor: nonBlank(event.actor, `events[${index}].actor`),
      inputIndex: index,
      occurredAt: normalizeIsoTimestamp(event.occurredAt, `events[${index}].occurredAt`),
    }))
    .sort(
      (left, right) =>
        left.occurredAt.localeCompare(right.occurredAt) ||
        left.inputIndex - right.inputIndex ||
        left.kind.localeCompare(right.kind),
    )
}

function assertStatus(status: OfferStatus, allowed: OfferStatus[], eventKind: OfferLifecycleEventKind) {
  if (!allowed.includes(status)) {
    throw new Error(`${eventKind} cannot be applied when offer status is ${status}`)
  }
}

function normalizeIsoTimestamp(value: string, key: string): string {
  const trimmed = nonBlank(value, key)
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${key} must be a valid ISO timestamp`)
  }
  return parsed.toISOString()
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
