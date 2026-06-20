import { describe, expect, it } from "vitest"

import { buildWorkspaceAction } from "./workspaceActions"
import { createLocalWorkspacePersistence } from "./workspacePersistence"

describe("workspace persistence", () => {
  it("records actions by RFQ and projects status changes into the snapshot", async () => {
    const adapter = createLocalWorkspacePersistence()

    await adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        fromStatus: "triage",
        kind: "status_change",
        occurredAt: "2026-06-20T10:00:00+03:00",
        rfqId: "rfq-019",
        toStatus: "estimating",
      }),
    )
    await adapter.recordAction(
      buildWorkspaceAction({
        actor: "Sari",
        kind: "handoff_note",
        note: "Confirm passivation certs before sending.",
        occurredAt: "2026-06-20T10:05:00+03:00",
        rfqId: "rfq-019",
      }),
    )

    expect(adapter.snapshot().statusById).toEqual({ "rfq-019": "estimating" })
    expect(adapter.snapshot().actionsById["rfq-019"]?.map((action) => action.kind)).toEqual(["handoff_note", "status_change"])
  })

  it("returns cloned snapshots so callers cannot mutate stored state", async () => {
    const adapter = createLocalWorkspacePersistence({
      statusById: { "rfq-019": "triage" },
    })
    const action = buildWorkspaceAction({
      actor: "Sari",
      kind: "handoff_note",
      note: "Check revision.",
      occurredAt: "2026-06-20T10:05:00+03:00",
      rfqId: "rfq-019",
    })

    const snapshot = await adapter.recordAction(action)
    snapshot.statusById["rfq-019"] = "lost"
    snapshot.actionsById["rfq-019"]?.pop()

    expect(adapter.snapshot().statusById["rfq-019"]).toBe("triage")
    expect(adapter.snapshot().actionsById["rfq-019"]).toHaveLength(1)
  })
})
