export type OfferWorkflowStatus = "draft" | "sent" | "accepted" | "declined" | "superseded";

export const allowedOfferStatusTransitions: Record<OfferWorkflowStatus, OfferWorkflowStatus[]> = {
  draft: ["sent", "superseded"],
  sent: ["accepted", "declined", "superseded"],
  accepted: [],
  declined: [],
  superseded: [],
};

export interface OfferStatusTransitionPatchInput {
  currentStatus: OfferWorkflowStatus;
  nextStatus: OfferWorkflowStatus;
  now: number;
  sentAt?: number;
}

export interface OfferStatusTransitionPatch {
  status: OfferWorkflowStatus;
  updatedAt: number;
  sentAt?: number;
}

export type OfferReplyActivityKind = "email_received" | "note";
export type OfferReplyStatusTransition = "accepted" | "declined";
export type OfferReplySyncActivityKind = OfferReplyActivityKind | "status_change";

export interface OfferReplySyncActivityInput {
  actorName?: string;
  kind: OfferReplyActivityKind;
  message: string;
}

export interface OfferReplySyncTransitionInput {
  message?: string;
  status: OfferReplyStatusTransition;
}

export interface OfferReplySyncWritePlanInput {
  activities: OfferReplySyncActivityInput[];
  currentStatus: OfferWorkflowStatus;
  offerId: string;
  offerNumber: string;
  quoteId?: string;
  rfqId?: string;
  sentAt?: number;
  statusTransitions: OfferReplySyncTransitionInput[];
  tenantId: string;
  now: number;
}

export interface OfferReplySyncActivityWrite {
  actorName: string;
  actorType: "system";
  createdAt: number;
  kind: OfferReplySyncActivityKind;
  message: string;
  offerId: string;
  quoteId?: string;
  rfqId?: string;
  tenantId: string;
}

export interface OfferReplySyncOfferPatch {
  offerId: string;
  patch: OfferStatusTransitionPatch;
}

export interface OfferReplySyncWritePlan {
  activities: OfferReplySyncActivityWrite[];
  appliedTransitionCount: number;
  offerPatches: OfferReplySyncOfferPatch[];
  skippedTransitionCount: number;
  status: OfferReplyStatusTransition | OfferWorkflowStatus;
}

export interface ActivityReferenceInput {
  offer?: {
    quoteId?: string;
    rfqId?: string;
  };
  quote?: {
    rfqId?: string;
  };
  quoteId?: string;
  rfqId?: string;
}

export function buildOfferStatusTransitionPatch(input: OfferStatusTransitionPatchInput): OfferStatusTransitionPatch {
  assertOfferStatusTransition(input.currentStatus, input.nextStatus);
  const patch: OfferStatusTransitionPatch = {
    status: input.nextStatus,
    updatedAt: input.now,
  };
  if (input.nextStatus === "sent" && input.sentAt === undefined) {
    patch.sentAt = input.now;
  }
  return patch;
}

export function buildOfferReplySyncWritePlan(input: OfferReplySyncWritePlanInput): OfferReplySyncWritePlan {
  let currentStatus = input.currentStatus;
  let sentAt = input.sentAt;
  let appliedTransitionCount = 0;
  let skippedTransitionCount = 0;
  const offerPatches: OfferReplySyncOfferPatch[] = [];
  const activities: OfferReplySyncActivityWrite[] = [];

  for (const transition of input.statusTransitions) {
    if (currentStatus === transition.status) {
      skippedTransitionCount += 1;
      continue;
    }

    const patch = buildOfferStatusTransitionPatch({
      currentStatus,
      nextStatus: transition.status,
      now: input.now,
      sentAt,
    });
    offerPatches.push({
      offerId: input.offerId,
      patch,
    });
    const transitionMessage = `Moved offer ${input.offerNumber} from ${currentStatus} to ${transition.status}.`;
    const note = optionalNonBlank(transition.message);
    activities.push({
      actorName: "Offer reply sync",
      actorType: "system",
      createdAt: input.now,
      kind: "status_change",
      message: note ? `${transitionMessage} ${note}` : transitionMessage,
      offerId: input.offerId,
      quoteId: input.quoteId,
      rfqId: input.rfqId,
      tenantId: input.tenantId,
    });
    currentStatus = transition.status;
    sentAt = patch.sentAt ?? sentAt;
    appliedTransitionCount += 1;
  }

  for (const activity of input.activities) {
    activities.push({
      actorName: optionalNonBlank(activity.actorName) ?? "Offer reply sync",
      actorType: "system",
      createdAt: input.now,
      kind: activity.kind,
      message: nonBlank(activity.message, "activity.message"),
      offerId: input.offerId,
      quoteId: input.quoteId,
      rfqId: input.rfqId,
      tenantId: input.tenantId,
    });
  }

  return {
    activities,
    appliedTransitionCount,
    offerPatches,
    skippedTransitionCount,
    status: currentStatus,
  };
}

export function assertOfferStatusTransition(fromStatus: OfferWorkflowStatus, toStatus: OfferWorkflowStatus) {
  if (fromStatus === toStatus) {
    throw new Error("status must change");
  }
  if (!allowedOfferStatusTransitions[fromStatus].includes(toStatus)) {
    throw new Error(`cannot transition offer from ${fromStatus} to ${toStatus}`);
  }
}

export function assertMatchingActivityReferences(input: ActivityReferenceInput) {
  if (input.offer && input.quoteId && input.offer.quoteId !== input.quoteId) {
    throw new Error("activity references do not match");
  }
  if (input.offer && input.rfqId && input.offer.rfqId !== input.rfqId) {
    throw new Error("activity references do not match");
  }
  if (input.quote && input.rfqId && input.quote.rfqId !== input.rfqId) {
    throw new Error("activity references do not match");
  }
  if (input.offer && input.quote && input.offer.rfqId && input.quote.rfqId && input.offer.rfqId !== input.quote.rfqId) {
    throw new Error("activity references do not match");
  }
}

function optionalNonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function nonBlank(value: string | undefined, key: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${key} is required`);
  }
  return trimmed;
}
