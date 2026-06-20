import { describe, expect, it } from "vitest";

import {
  allowedOfferStatusTransitions,
  assertOfferStatusTransition,
  buildOfferStatusTransitionPatch,
  type OfferWorkflowStatus,
} from "./workflowRules";

describe("offer workflow rules", () => {
  it("allows every configured offer status transition", () => {
    const transitions: Array<[OfferWorkflowStatus, OfferWorkflowStatus]> = [
      ["draft", "sent"],
      ["draft", "superseded"],
      ["sent", "accepted"],
      ["sent", "declined"],
      ["sent", "superseded"],
    ];

    expect(Object.entries(allowedOfferStatusTransitions).flatMap(([from, next]) => next.map((to) => [from, to]))).toEqual(transitions);
    transitions.forEach(([fromStatus, toStatus]) => {
      expect(() => assertOfferStatusTransition(fromStatus, toStatus)).not.toThrow();
    });
  });

  it("rejects no-op and disallowed offer status transitions", () => {
    expect(() => assertOfferStatusTransition("draft", "draft")).toThrow("status must change");
    expect(() => assertOfferStatusTransition("accepted", "sent")).toThrow("cannot transition offer from accepted to sent");
    expect(() => assertOfferStatusTransition("declined", "accepted")).toThrow("cannot transition offer from declined to accepted");
  });

  it("sets sentAt only when first transitioning to sent", () => {
    expect(
      buildOfferStatusTransitionPatch({
        currentStatus: "draft",
        nextStatus: "sent",
        now: 1_775_000_000_000,
      }),
    ).toEqual({
      status: "sent",
      updatedAt: 1_775_000_000_000,
      sentAt: 1_775_000_000_000,
    });

    expect(
      buildOfferStatusTransitionPatch({
        currentStatus: "draft",
        nextStatus: "sent",
        now: 1_775_000_060_000,
        sentAt: 1_775_000_000_000,
      }),
    ).toEqual({
      status: "sent",
      updatedAt: 1_775_000_060_000,
    });

    expect(
      buildOfferStatusTransitionPatch({
        currentStatus: "sent",
        nextStatus: "accepted",
        now: 1_775_000_120_000,
        sentAt: 1_775_000_000_000,
      }),
    ).toEqual({
      status: "accepted",
      updatedAt: 1_775_000_120_000,
    });
  });
});
