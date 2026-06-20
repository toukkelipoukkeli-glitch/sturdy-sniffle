import { describe, expect, it } from "vitest";

import {
  allowedOfferStatusTransitions,
  assertMatchingActivityReferences,
  assertOfferStatusTransition,
  buildOfferReplySyncWritePlan,
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
        currentStatus: "draft",
        nextStatus: "sent",
        now: 1_775_000_060_000,
        sentAt: 0,
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

  it("builds deterministic offer reply sync writes for applied and skipped transitions", () => {
    expect(
      buildOfferReplySyncWritePlan({
        activities: [
          {
            actorName: "  ",
            kind: "email_received",
            message: "Customer accepted by email.",
          },
        ],
        currentStatus: "sent",
        offerId: "offer-1",
        offerNumber: "FB-2026-001",
        quoteId: "quote-1",
        rfqId: "rfq-1",
        sentAt: 1_771_329_000_000,
        statusTransitions: [
          {
            status: "accepted",
            message: "Message id gmail-1.",
          },
          {
            status: "accepted",
            message: "Duplicate accepted signal.",
          },
        ],
        tenantId: "tenant-a",
        now: 1_781_956_800_000,
      }),
    ).toEqual({
      activities: [
        {
          actorName: "Offer reply sync",
          actorType: "system",
          createdAt: 1_781_956_800_000,
          kind: "status_change",
          message: "Moved offer FB-2026-001 from sent to accepted. Message id gmail-1.",
          offerId: "offer-1",
          quoteId: "quote-1",
          rfqId: "rfq-1",
          tenantId: "tenant-a",
        },
        {
          actorName: "Offer reply sync",
          actorType: "system",
          createdAt: 1_781_956_800_000,
          kind: "email_received",
          message: "Customer accepted by email.",
          offerId: "offer-1",
          quoteId: "quote-1",
          rfqId: "rfq-1",
          tenantId: "tenant-a",
        },
      ],
      appliedTransitionCount: 1,
      offerPatches: [
        {
          offerId: "offer-1",
          patch: {
            status: "accepted",
            updatedAt: 1_781_956_800_000,
          },
        },
      ],
      skippedTransitionCount: 1,
      status: "accepted",
    });
  });

  it("rejects blank custom offer reply sync activity messages", () => {
    expect(() =>
      buildOfferReplySyncWritePlan({
        activities: [
          {
            kind: "note",
            message: " ",
          },
        ],
        currentStatus: "sent",
        offerId: "offer-1",
        offerNumber: "FB-2026-001",
        statusTransitions: [],
        tenantId: "tenant-a",
        now: 1_781_956_800_000,
      }),
    ).toThrow("activity.message is required");
  });

  it("rejects mismatched activity references before writing reply sync activity", () => {
    expect(() =>
      assertMatchingActivityReferences({
        offer: {
          quoteId: "quote-1",
          rfqId: "rfq-1",
        },
        quoteId: "quote-2",
      }),
    ).toThrow("activity references do not match");

    expect(() =>
      assertMatchingActivityReferences({
        offer: {
          quoteId: "quote-1",
          rfqId: "rfq-1",
        },
        rfqId: "rfq-2",
      }),
    ).toThrow("activity references do not match");

    expect(() =>
      assertMatchingActivityReferences({
        quote: {
          rfqId: "rfq-1",
        },
        rfqId: "rfq-2",
      }),
    ).toThrow("activity references do not match");

    expect(() =>
      assertMatchingActivityReferences({
        offer: {
          quoteId: "quote-1",
          rfqId: "rfq-1",
        },
        quote: {
          rfqId: "rfq-2",
        },
        quoteId: "quote-1",
      }),
    ).toThrow("activity references do not match");
  });
});
