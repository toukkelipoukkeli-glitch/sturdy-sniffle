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
        fromStatus: "new",
        kind: "status_change",
        occurredAt: "2026-06-20T09:55:00+03:00",
        rfqId: "rfq-a",
        toStatus: "triage",
      },
    ])

    expect(actions.map((action) => action.rfqId)).toEqual(["rfq-a", "rfq-b"])
  })

  it("rejects invalid operator actions", () => {
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

    expect(() =>
      buildWorkspaceAction({
        actor: "Sari",
        kind: "follow_up_created",
        occurredAt: "2026-06-20T10:00:00+03:00",
        offerId: "offer-019",
        rfqId: "rfq-019",
      }),
    ).toThrow("followUpDueAt is required")

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
