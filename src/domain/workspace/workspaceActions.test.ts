import { describe, expect, it } from "vitest"

import { buildWorkspaceAction, buildWorkspaceActionTimeline } from "./workspaceActions"

describe("workspace actions", () => {
  it("builds deterministic status change, scenario save, follow-up, and handoff records", () => {
    const statusChange = buildWorkspaceAction({
      actor: "Sari",
      fromStatus: "triage",
      kind: "status_change",
      occurredAt: "2026-06-20T10:00:00+03:00",
      rfqId: "rfq-019",
      toStatus: "estimating",
    })
    const scenarioSave = buildWorkspaceAction({
      actor: "Sari",
      kind: "scenario_saved",
      occurredAt: "2026-06-20T10:05:00+03:00",
      quoteId: "quote-019",
      rfqId: "rfq-019",
      scenarioId: "scenario-rush",
    })
    const followUp = buildWorkspaceAction({
      actor: "Sari",
      followUpDueAt: "2026-06-27T09:00:00+03:00",
      kind: "follow_up_created",
      occurredAt: "2026-06-20T10:10:00+03:00",
      offerId: "offer-019",
      rfqId: "rfq-019",
    })
    const handoff = buildWorkspaceAction({
      actor: "Sari",
      kind: "handoff_note",
      note: "Confirm passivation certs before sending. ",
      occurredAt: "2026-06-20T10:15:00+03:00",
      rfqId: "rfq-019",
    })

    expect(statusChange).toMatchObject({
      actionVersion: "workspace-action.v1",
      activityKind: "status_change",
      activityMessage: "Moved RFQ from triage to estimating.",
      fromStatus: "triage",
      key: "rfq-019:status_change:estimating:2026-06-20T07:00:00.000Z",
      occurredAt: "2026-06-20T07:00:00.000Z",
      toStatus: "estimating",
    })
    expect(scenarioSave).toMatchObject({
      activityKind: "quote_update",
      activityMessage: "Saved quote scenario scenario-rush.",
      key: "rfq-019:scenario_saved:quote-019:scenario-rush:2026-06-20T07:05:00.000Z",
    })
    expect(followUp).toMatchObject({
      activityKind: "calendar_event",
      activityMessage: "Created offer follow-up for offer-019.",
      followUpDueAt: "2026-06-27T06:00:00.000Z",
      key: "rfq-019:follow_up_created:offer-019:2026-06-27T06:00:00.000Z:2026-06-20T07:10:00.000Z",
    })
    expect(handoff).toMatchObject({
      activityKind: "note",
      activityMessage: "Confirm passivation certs before sending.",
      note: "Confirm passivation certs before sending.",
    })
  })

  it("sorts action timelines by normalized timestamp and stable key", () => {
    const actions = buildWorkspaceActionTimeline([
      {
        actor: "Mikael",
        kind: "handoff_note",
        note: "Second note",
        occurredAt: "2026-06-20T10:00:00+03:00",
        rfqId: "rfq-b",
      },
      {
        actor: "Mikael",
        kind: "handoff_note",
        note: "Tie A",
        occurredAt: "2026-06-20T10:00:00+03:00",
        rfqId: "rfq-a",
      },
      {
        actor: "Mikael",
        fromStatus: "new",
        kind: "status_change",
        occurredAt: "2026-06-20T09:55:00+03:00",
        rfqId: "rfq-a",
        toStatus: "triage",
      },
    ])

    expect(actions.map((action) => action.key)).toEqual([
      "rfq-a:status_change:triage:2026-06-20T06:55:00.000Z",
      "rfq-a:handoff_note:2026-06-20T07:00:00.000Z",
      "rfq-b:handoff_note:2026-06-20T07:00:00.000Z",
    ])
  })

  it("ignores irrelevant identifiers when building action keys", () => {
    const base = buildWorkspaceAction({
      actor: "Sari",
      fromStatus: "new",
      kind: "status_change",
      occurredAt: "2026-06-20T10:00:00+03:00",
      rfqId: "rfq-019",
      toStatus: "triage",
    })
    const withIrrelevantIds = buildWorkspaceAction({
      actor: "Sari",
      fromStatus: "new",
      kind: "status_change",
      occurredAt: "2026-06-20T10:00:00+03:00",
      offerId: "offer-ignored",
      quoteId: "quote-ignored",
      rfqId: "rfq-019",
      toStatus: "triage",
    })

    expect(withIrrelevantIds.key).toBe(base.key)
  })

  it("rejects invalid status transitions", () => {
    expect(() =>
      buildWorkspaceAction({
        actor: "Sari",
        fromStatus: "new",
        kind: "status_change",
        occurredAt: "2026-06-20T10:00:00+03:00",
        rfqId: "rfq-019",
        toStatus: "sent",
      }),
    ).toThrow("cannot transition RFQ from new to sent")
  })

  it("rejects missing follow-up due dates", () => {
    expect(() =>
      buildWorkspaceAction({
        actor: "Sari",
        kind: "follow_up_created",
        occurredAt: "2026-06-20T10:00:00+03:00",
        offerId: "offer-019",
        rfqId: "rfq-019",
      }),
    ).toThrow("followUpDueAt is required")
  })

  it("includes explicit follow-up task ids in scheduled follow-up activity records", () => {
    expect(
      buildWorkspaceAction({
        actor: "Sari",
        followUpDueAt: "2026-06-27T09:00:00+03:00",
        followUpTaskId: "follow-up-rfq-019",
        kind: "follow_up_created",
        occurredAt: "2026-06-20T10:10:00+03:00",
        offerId: "offer-019",
        rfqId: "rfq-019",
      }),
    ).toMatchObject({
      activityMessage: "Scheduled offer follow-up follow-up-rfq-019 for offer-019 at 2026-06-27T06:00:00.000Z.",
      followUpTaskId: "follow-up-rfq-019",
      key: "rfq-019:follow_up_created:offer-019:2026-06-27T06:00:00.000Z:follow-up-rfq-019:2026-06-20T07:10:00.000Z",
    })
  })

  it("supports explicit follow-up key suffixes for repeated local audit actions", () => {
    const first = buildWorkspaceAction({
      actor: "Sari",
      followUpDueAt: "2026-06-27T09:00:00+03:00",
      followUpTaskId: "follow-up-rfq-019",
      keySuffix: "manual-001",
      kind: "follow_up_created",
      occurredAt: "2026-06-20T10:10:00+03:00",
      offerId: "offer-019",
      rfqId: "rfq-019",
    })
    const second = buildWorkspaceAction({
      actor: "Sari",
      followUpDueAt: "2026-06-27T09:00:00+03:00",
      followUpTaskId: "follow-up-rfq-019",
      keySuffix: "manual-002",
      kind: "follow_up_created",
      occurredAt: "2026-06-20T10:10:00+03:00",
      offerId: "offer-019",
      rfqId: "rfq-019",
    })

    expect(first.key).toBe(
      "rfq-019:follow_up_created:offer-019:2026-06-27T06:00:00.000Z:follow-up-rfq-019:2026-06-20T07:10:00.000Z:manual-001",
    )
    expect(second.key).toBe(
      "rfq-019:follow_up_created:offer-019:2026-06-27T06:00:00.000Z:follow-up-rfq-019:2026-06-20T07:10:00.000Z:manual-002",
    )
  })

  it("rejects missing scenario quote IDs", () => {
    expect(() =>
      buildWorkspaceAction({
        actor: "Sari",
        kind: "scenario_saved",
        occurredAt: "2026-06-20T10:00:00+03:00",
        rfqId: "rfq-019",
        scenarioId: "scenario-rush",
      }),
    ).toThrow("quoteId is required")
  })

  it("rejects missing actors", () => {
    expect(() =>
      buildWorkspaceAction({
        actor: " ",
        kind: "handoff_note",
        note: "Check revision",
        occurredAt: "2026-06-20T10:00:00+03:00",
        rfqId: "rfq-019",
      }),
    ).toThrow("actor is required")
  })
})
