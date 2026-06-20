import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { OfferStatus } from "./offer"
import type { OfferLifecycleEvent, OfferLifecycleEventKind, OfferLifecycleTimeline } from "./offerLifecycle"

export interface ConvexOfferStatusTransitionPayload {
  offerId: string
  status: OfferStatus
  message?: string
}

export interface BuildConvexOfferStatusTransitionOptions {
  offerId: string
  currentStatus?: OfferStatus
}

const statusChangingLifecycleEvents: Record<OfferLifecycleEventKind, OfferStatus | undefined> = {
  accepted: "accepted",
  declined: "declined",
  follow_up_completed: undefined,
  follow_up_scheduled: undefined,
  note_added: undefined,
  sent: "sent",
}

export function buildConvexOfferStatusTransitionPayload(
  event: OfferLifecycleEvent,
  options: BuildConvexOfferStatusTransitionOptions,
): ConvexOfferStatusTransitionPayload | undefined {
  const status = statusChangingLifecycleEvents[event.kind]
  if (!status) {
    return undefined
  }
  if (event.statusAfter !== status) {
    throw new Error(`lifecycle event ${event.key} statusAfter must be ${status}`)
  }

  const message = optionalTrim(event.note)
  return {
    offerId: nonBlank(options.offerId, "offerId"),
    ...(message ? { message } : {}),
    status,
  }
}

export function buildConvexOfferStatusTransitionPayloads(
  timeline: OfferLifecycleTimeline,
  options: BuildConvexOfferStatusTransitionOptions,
): ConvexOfferStatusTransitionPayload[] {
  const offerId = nonBlank(options.offerId, "offerId")
  const transitionEvents = timeline.events.filter((event) => Boolean(statusChangingLifecycleEvents[event.kind]))
  const statusPath: OfferStatus[] = ["draft", ...transitionEvents.map(targetStatusForLifecycleEvent)]
  const currentStatus = normalizeOfferStatus(options.currentStatus ?? "draft", "currentStatus")
  const currentPathIndex = statusPath.lastIndexOf(currentStatus)

  if (currentPathIndex === -1) {
    throw new Error(`current status ${currentStatus} is not represented in lifecycle ${timeline.offerNumber}`)
  }

  return transitionEvents.slice(currentPathIndex).map((event) => {
    const payload = buildConvexOfferStatusTransitionPayload(event, { ...options, offerId })
    if (!payload) {
      throw new Error(`lifecycle event ${event.key} does not change offer status`)
    }
    return payload
  })
}

function targetStatusForLifecycleEvent(event: OfferLifecycleEvent): OfferStatus {
  const status = statusChangingLifecycleEvents[event.kind]
  if (!status) {
    throw new Error(`lifecycle event ${event.key} does not change offer status`)
  }
  return status
}

function normalizeOfferStatus(status: OfferStatus, key: string): OfferStatus {
  if (
    status !== "accepted" &&
    status !== "declined" &&
    status !== "draft" &&
    status !== "sent" &&
    status !== "superseded"
  ) {
    throw new Error(`${key} is not a supported offer status`)
  }
  return status
}
