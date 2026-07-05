import { describe, expect, it } from "vitest"

import { buildWorkspaceAction } from "./workspaceActions"
import { createWorkspacePersistenceRuntime } from "./workspacePersistenceRuntime"

describe("workspace persistence runtime", () => {
  it("defaults to local fallback persistence when no Convex bridge is configured", async () => {
    const runtime = createWorkspacePersistenceRuntime({
      initialSnapshot: {
        statusById: { "rfq-019": "triage" },
      },
    })

    const snapshot = await runtime.adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        fromStatus: "triage",
        kind: "status_change",
        occurredAt: "2026-06-20T10:00:00+03:00",
        rfqId: "rfq-019",
        toStatus: "estimating",
      }),
    )

    expect(runtime.mode).toBe("local")
    expect(runtime.label).toBe("Local fallback")
    expect(snapshot.statusById["rfq-019"]).toBe("estimating")
  })

  it("uses the Convex adapter when a bridge is configured", async () => {
    const calls: Array<{ mutationRef: unknown; args: Record<string, unknown> }> = []
    const runtime = createWorkspacePersistenceRuntime({
      convex: {
        mutationRefs: {
          recordWorkspaceActivity: "recordWorkspaceActivity",
          transitionRfqStatus: "transitionRfqStatus",
        },
        resolveRfqId: (rfqId) => `convex-${rfqId}`,
        runMutation: async (mutationRef, args) => {
          calls.push({ args, mutationRef })
        },
      },
    })

    const snapshot = await runtime.adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        fromStatus: "triage",
        kind: "status_change",
        occurredAt: "2026-06-20T10:00:00+03:00",
        rfqId: "rfq-019",
        toStatus: "estimating",
      }),
    )

    expect(runtime.mode).toBe("convex")
    expect(runtime.label).toBe("Convex sync")
    expect(calls).toEqual([
      {
        args: {
          rfqId: "convex-rfq-019",
          status: "estimating",
        },
        mutationRef: "transitionRfqStatus",
      },
    ])
    expect(snapshot.statusById["rfq-019"]).toBe("estimating")
  })

  it("passes Convex write predicates through while keeping local fallback state", async () => {
    const calls: Array<{ mutationRef: unknown; args: Record<string, unknown> }> = []
    const runtime = createWorkspacePersistenceRuntime({
      convex: {
        mutationRefs: {
          recordWorkspaceActivity: "recordWorkspaceActivity",
          transitionRfqStatus: "transitionRfqStatus",
        },
        resolveRfqId: (rfqId) => `convex-${rfqId}`,
        runMutation: async (mutationRef, args) => {
          calls.push({ args, mutationRef })
        },
        shouldPersistAction: (action) => action.kind !== "follow_up_created",
      },
    })

    const snapshot = await runtime.adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        followUpDueAt: "2026-06-27T09:00:00+03:00",
        followUpTaskId: "follow-up-rfq-019",
        kind: "follow_up_created",
        occurredAt: "2026-06-20T10:10:00+03:00",
        offerId: "offer-019",
        rfqId: "rfq-019",
      }),
    )

    expect(calls).toEqual([])
    expect(snapshot.actionsById["rfq-019"]?.[0]?.followUpTaskId).toBe("follow-up-rfq-019")
  })

  it("keeps the local snapshot hot when Convex sync fails", async () => {
    const errors: unknown[] = []
    const runtime = createWorkspacePersistenceRuntime({
      convex: {
        mutationRefs: {
          recordWorkspaceActivity: "recordWorkspaceActivity",
          transitionRfqStatus: "transitionRfqStatus",
        },
        resolveRfqId: (rfqId) => `convex-${rfqId}`,
        runMutation: async () => {
          throw new Error("Convex unavailable")
        },
      },
      onSyncError: (error) => errors.push(error),
    })

    const snapshot = await runtime.adapter.recordAction(
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
