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

export function assertOfferStatusTransition(fromStatus: OfferWorkflowStatus, toStatus: OfferWorkflowStatus) {
  if (fromStatus === toStatus) {
    throw new Error("status must change");
  }
  if (!allowedOfferStatusTransitions[fromStatus].includes(toStatus)) {
    throw new Error(`cannot transition offer from ${fromStatus} to ${toStatus}`);
  }
}
