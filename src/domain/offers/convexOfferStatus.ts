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
  return timeline.events.flatMap((event) => {
    const payload = buildConvexOfferStatusTransitionPayload(event, options)
    return payload ? [payload] : []
  })
}
