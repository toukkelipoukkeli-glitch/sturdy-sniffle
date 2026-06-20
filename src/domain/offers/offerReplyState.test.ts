import { describe, expect, it } from "vitest"

import type { OfferReplySyncPersistenceSnapshot } from "./offerReplySyncPersistence"
import { buildOfferReplyStateSummary } from "./offerReplyState"

describe("offer reply state summary", () => {
  it("summarizes persisted reply sync payloads into stable state events", () => {
    const summary = buildOfferReplyStateSummary(snapshot())

    expect(summary).toEqual({
      appliedMessageCount: 2,
      duplicateSyncCount: 1,
      events: [
        {
          key: "sync-0:applied:reply-accepted",
          kind: "applied",
          label: "Applied reply",
          message: "reply-accepted",
          offerId: "offer-019",
          syncIndex: 0,
        },
        {
          key: "sync-0:applied:reply-follow-up",
          kind: "applied",
          label: "Applied reply",
          message: "reply-follow-up",
          offerId: "offer-019",
          syncIndex: 0,
        },
        {
          key: "sync-0:ignored:reply-note",
          kind: "ignored",
          label: "Ignored reply",
          message: "reply-note",
          offerId: "offer-019",
          syncIndex: 0,
        },
        {
          key: "sync-0:transition:accepted",
          kind: "transition",
          label: "Status transition",
          message: "accepted: Customer accepted.",
          offerId: "offer-019",
          syncIndex: 0,
        },
        {
          key: "sync-0:warning:0",
          kind: "warning",
          label: "Warning",
          message: "reply-note did not match a lifecycle signal.",
          offerId: "offer-019",
          syncIndex: 0,
        },
        {
          key: "sync-1:duplicate",
          kind: "duplicate",
          label: "Duplicate sync",
          message: "Reply sync recorded no new messages.",
          offerId: "offer-019",
          syncIndex: 1,
        },
      ],
      filter: "all",
      ignoredMessageCount: 1,
      recordedMessageCount: 3,
      syncCount: 2,
      transitionCount: 1,
      warningCount: 1,
    })
  })

  it("filters events without changing aggregate counts", () => {
    expect(buildOfferReplyStateSummary(snapshot(), { filter: "warnings" })).toMatchObject({
      appliedMessageCount: 2,
      events: [
        {
          key: "sync-0:warning:0",
          kind: "warning",
          message: "reply-note did not match a lifecycle signal.",
        },
      ],
      filter: "warnings",
      warningCount: 1,
    })

    expect(buildOfferReplyStateSummary(snapshot(), { filter: "duplicates" }).events).toEqual([
      {
        key: "sync-1:duplicate",
        kind: "duplicate",
        label: "Duplicate sync",
        message: "Reply sync recorded no new messages.",
        offerId: "offer-019",
        syncIndex: 1,
      },
    ])
  })
})

function snapshot(): OfferReplySyncPersistenceSnapshot {
  return {
    payloads: [
      {
        activities: [
          {
            actorName: "Reply sync",
            kind: "email_received",
            message: "Synced Gmail offer reply thread:reply-accepted for OFFER-019: accepted.",
          },
          {
            actorName: "Reply sync",
            kind: "note",
            message: "Ignored Gmail offer reply thread:reply-note for OFFER-019: no lifecycle signal matched.",
          },
        ],
        appliedMessageIds: ["reply-accepted", "reply-follow-up"],
        ignoredMessageIds: ["reply-note"],
        offerId: "offer-019",
        statusTransitions: [
          {
            message: "Customer accepted.",
            status: "accepted",
          },
        ],
        warnings: ["reply-note did not match a lifecycle signal."],
      },
      {
        activities: [
          {
            actorName: "Reply sync",
            kind: "note",
            message: "Offer reply sync succeeded for OFFER-019 recorded no new messages.",
          },
        ],
        appliedMessageIds: [],
        ignoredMessageIds: [],
        offerId: "offer-019",
        statusTransitions: [],
        warnings: [],
      },
    ],
    recordedMessageIds: ["reply-accepted", "reply-follow-up", "reply-note"],
    syncCount: 2,
  }
}
