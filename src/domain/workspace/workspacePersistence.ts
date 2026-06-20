import type { QuoteQueueStatus } from "./quoteQueue"
import type { WorkspaceActionRecord } from "./workspaceActions"

export interface WorkspacePersistenceSnapshot {
  actionsById: Record<string, WorkspaceActionRecord[]>
  statusById: Record<string, QuoteQueueStatus>
}

export interface WorkspacePersistenceAdapter {
  recordAction(action: WorkspaceActionRecord): Promise<WorkspacePersistenceSnapshot>
  snapshot(): WorkspacePersistenceSnapshot
}

export function createLocalWorkspacePersistence(
  initialSnapshot: Partial<WorkspacePersistenceSnapshot> = {},
): WorkspacePersistenceAdapter {
  let snapshot = cloneSnapshot({
    actionsById: initialSnapshot.actionsById ?? {},
    statusById: initialSnapshot.statusById ?? {},
  })

  return {
    async recordAction(action) {
      const nextActions = [...(snapshot.actionsById[action.rfqId] ?? []), action].sort(sortNewestFirst)
      const nextStatusById =
        action.kind === "status_change" && action.toStatus
          ? { ...snapshot.statusById, [action.rfqId]: action.toStatus }
          : snapshot.statusById

      snapshot = cloneSnapshot({
        actionsById: {
          ...snapshot.actionsById,
          [action.rfqId]: nextActions,
        },
        statusById: nextStatusById,
      })

      return cloneSnapshot(snapshot)
    },
    snapshot() {
      return cloneSnapshot(snapshot)
    },
  }
}

function sortNewestFirst(left: WorkspaceActionRecord, right: WorkspaceActionRecord) {
  return right.occurredAt.localeCompare(left.occurredAt) || right.key.localeCompare(left.key)
}

function cloneSnapshot(snapshot: WorkspacePersistenceSnapshot): WorkspacePersistenceSnapshot {
  return {
    actionsById: Object.fromEntries(Object.entries(snapshot.actionsById).map(([rfqId, actions]) => [rfqId, [...actions]])),
    statusById: { ...snapshot.statusById },
  }
}
