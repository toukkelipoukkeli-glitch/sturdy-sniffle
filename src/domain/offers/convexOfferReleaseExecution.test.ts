import { describe, expect, it } from "vitest"

import { buildWorkspaceAction } from "../workspace/workspaceActions"
import {
  buildConvexOfferReleaseExecutionPayload,
  type ConvexOfferReleaseExecutionPayload,
} from "./convexOfferReleaseExecution"
import {
  OFFER_RELEASE_EXECUTION_VERSION,
  type OfferReleaseExecutionRun,
} from "./offerReleaseExecution"
import { OFFER_RELEASE_PLAN_VERSION } from "./offerReleasePlan"

describe("convex offer release execution persistence payload", () => {
  it("maps a release execution run to a deterministic Convex mutation payload", () => {
    const payload = buildConvexOfferReleaseExecutionPayload(releaseExecutionRun(), {
      offerId: "convex-offer-204",
    })

    expect(payload).toEqual<ConvexOfferReleaseExecutionPayload>({
      actorName: "Sari",
      calendarEventCount: 1,
      commands: [
        {
          detail: "Create Gmail draft.",
          externalId: "gmail-draft-001",
          idempotencyKey: "offer-release:offer-204:email-draft",
          key: "email-draft",
          kind: "email_draft",
          label: "Draft offer email",
          message: "Draft created.",
          status: "applied",
          warnings: ["Confirm sender alias."],
        },
        {
          detail: "Create follow-up hold.",
          idempotencyKey: "offer-release:offer-204:calendar-follow-up",
          key: "calendar-follow-up",
          kind: "calendar_follow_up",
          label: "Create follow-up calendar event",
          status: "failed",
          warnings: [],
        },
      ],
      executedAt: "2026-06-20T06:05:00.000Z",
      executionVersion: OFFER_RELEASE_EXECUTION_VERSION,
      lifecycleEventCount: 1,
      mode: "commit",
      nextActions: ["Resolve calendar follow-up."],
      offerId: "convex-offer-204",
      planVersion: OFFER_RELEASE_PLAN_VERSION,
      releaseAt: "2026-06-20T06:00:00.000Z",
      status: "partial",
      warnings: ["Calendar quota warning."],
      workspaceActionCount: 1,
    })
  })

  it("rejects release runs that cannot be persisted safely", () => {
    expect(() =>
      buildConvexOfferReleaseExecutionPayload({
        ...releaseExecutionRun(),
        commands: [],
      }),
    ).toThrow("run.commands must include at least one release command")

    expect(() =>
      buildConvexOfferReleaseExecutionPayload({
        ...releaseExecutionRun(),
        commands: [
          releaseExecutionRun().commands[0],
          {
            ...releaseExecutionRun().commands[0],
            key: " email-draft ",
          },
        ],
      }),
    ).toThrow("duplicate release command email-draft")

    expect(() =>
      buildConvexOfferReleaseExecutionPayload({
        ...releaseExecutionRun(),
        mode: "send_now" as never,
      }),
    ).toThrow("run.mode must be commit or dry_run")
  })
})

function releaseExecutionRun(): OfferReleaseExecutionRun {
  return {
    actor: " Sari ",
    calendarEvents: [
      {
        description: "Follow up offer OFFER-204.",
        endAt: "2026-06-27T09:30:00.000Z",
        kind: "offer_follow_up",
        metadata: { offerId: "offer-204" },
        startAt: "2026-06-27T09:00:00.000Z",
        timezone: "Europe/Helsinki",
        title: "Follow up OFFER-204",
      },
    ],
    commands: [
      {
        detail: "Create Gmail draft.",
        externalId: " gmail-draft-001 ",
        idempotencyKey: " offer-release:offer-204:email-draft ",
        key: " email-draft ",
        kind: "email_draft",
        label: "Draft offer email",
        message: " Draft created. ",
        status: "applied",
        warnings: [" Confirm sender alias. ", " "],
      },
      {
        detail: "Create follow-up hold.",
        idempotencyKey: "offer-release:offer-204:calendar-follow-up",
        key: "calendar-follow-up",
        kind: "calendar_follow_up",
        label: "Create follow-up calendar event",
        status: "failed",
        warnings: [],
      },
    ],
    executedAt: "2026-06-20T09:05:00+03:00",
    executionVersion: OFFER_RELEASE_EXECUTION_VERSION,
    lifecycleEvents: [
      {
        actor: "Sari",
        kind: "sent",
        occurredAt: "2026-06-20T09:05:00+03:00",
      },
    ],
    mode: "commit",
    nextActions: [" Resolve calendar follow-up. ", " "],
    offerId: "offer-204",
    offerNumber: "OFFER-204",
    planVersion: OFFER_RELEASE_PLAN_VERSION,
    releaseAt: "2026-06-20T09:00:00+03:00",
    rfqId: "rfq-204",
    status: "partial",
    warnings: [" Calendar quota warning. ", " "],
    workspaceActions: [
      buildWorkspaceAction({
        actor: "Sari",
        fromStatus: "ready",
        kind: "status_change",
        occurredAt: "2026-06-20T09:05:00+03:00",
        rfqId: "rfq-204",
        toStatus: "sent",
      }),
    ],
  }
}
