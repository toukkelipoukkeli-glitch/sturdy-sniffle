import { describe, expect, it } from "vitest"

import { buildWorkspaceAction } from "./workspaceActions"
import { createConvexWorkspacePersistence } from "./convexWorkspacePersistence"

describe("convex workspace persistence", () => {
  it("routes RFQ status changes through the Convex transition mutation and updates the fallback snapshot", async () => {
    const calls: Array<{ mutationRef: unknown; args: Record<string, unknown> }> = []
    const adapter = createConvexWorkspacePersistence({
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      resolveRfqId: (rfqId) => `convex-${rfqId}`,
      runMutation: async (mutationRef, args) => {
        calls.push({ args, mutationRef })
      },
    })

    const snapshot = await adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        fromStatus: "estimating",
        kind: "status_change",
        occurredAt: "2026-06-20T10:00:00+03:00",
        rfqId: "rfq-019",
        toStatus: "ready",
      }),
    )

    expect(calls).toEqual([
      {
        args: {
          rfqId: "convex-rfq-019",
          status: "quoted",
        },
        mutationRef: "transitionRfqStatus",
      },
    ])
    expect(snapshot.statusById["rfq-019"]).toBe("ready")
  })

  it("records non-status workspace actions as Convex activities", async () => {
    const calls: Array<{ mutationRef: unknown; args: Record<string, unknown> }> = []
    const adapter = createConvexWorkspacePersistence({
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      resolveOfferId: (offerId) => `convex-${offerId}`,
      resolveQuoteId: (quoteId) => `convex-${quoteId}`,
      resolveRfqId: (rfqId) => `convex-${rfqId}`,
      runMutation: async (mutationRef, args) => {
        calls.push({ args, mutationRef })
      },
    })

    await adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        kind: "scenario_saved",
        occurredAt: "2026-06-20T10:05:00+03:00",
        quoteId: "quote-019",
        rfqId: "rfq-019",
        scenarioId: "scenario-rush",
      }),
    )
    await adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        followUpDueAt: "2026-06-27T09:00:00+03:00",
        kind: "follow_up_created",
        occurredAt: "2026-06-20T10:10:00+03:00",
        offerId: "offer-019",
        quoteId: "quote-019",
        rfqId: "rfq-019",
      }),
    )

    expect(calls).toEqual([
      {
        args: {
          actorName: "Sari",
          kind: "calculation",
          message: "Saved quote scenario scenario-rush.",
          quoteId: "convex-quote-019",
          rfqId: "convex-rfq-019",
        },
        mutationRef: "recordWorkspaceActivity",
      },
      {
        args: {
          actorName: "Sari",
          kind: "calendar_event",
          message: "Created offer follow-up for offer-019.",
          offerId: "convex-offer-019",
          quoteId: "convex-quote-019",
          rfqId: "convex-rfq-019",
        },
        mutationRef: "recordWorkspaceActivity",
      },
    ])
  })

  it("routes offer follow-up actions through the dedicated Convex mutation when configured", async () => {
    const calls: Array<{ mutationRef: unknown; args: Record<string, unknown> }> = []
    const adapter = createConvexWorkspacePersistence({
      mutationRefs: {
        createOfferFollowUpActivity: "createOfferFollowUpActivity",
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      resolveOfferId: (offerId) => `convex-${offerId}`,
      resolveQuoteId: (quoteId) => `convex-${quoteId}`,
      resolveRfqId: (rfqId) => `convex-${rfqId}`,
      runMutation: async (mutationRef, args) => {
        calls.push({ args, mutationRef })
      },
    })

    await adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        followUpDueAt: "2026-06-27T09:00:00+03:00",
        kind: "follow_up_created",
        occurredAt: "2026-06-20T10:10:00+03:00",
        offerId: "offer-019",
        quoteId: "quote-019",
        rfqId: "rfq-019",
      }),
    )

    expect(calls).toEqual([
      {
        args: {
          actorName: "Sari",
          message: "Created offer follow-up for offer-019.",
          offerId: "convex-offer-019",
          quoteId: "convex-quote-019",
          rfqId: "convex-rfq-019",
        },
        mutationRef: "createOfferFollowUpActivity",
      },
    ])
  })

  it("keeps the local fallback usable when Convex persistence fails", async () => {
    const errors: unknown[] = []
    const adapter = createConvexWorkspacePersistence({
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      onSyncError: (error) => errors.push(error),
      resolveRfqId: (rfqId) => `convex-${rfqId}`,
      runMutation: async () => {
        throw new Error("Convex unavailable")
      },
    })

    const snapshot = await adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        kind: "handoff_note",
        note: "Confirm passivation certs before sending.",
        occurredAt: "2026-06-20T10:15:00+03:00",
        rfqId: "rfq-019",
      }),
    )

    expect(errors).toHaveLength(1)
    expect(snapshot.actionsById["rfq-019"]?.[0]?.activityMessage).toBe("Confirm passivation certs before sending.")
  })
})
