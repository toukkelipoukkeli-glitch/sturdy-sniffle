import {
  createConvexWorkspacePersistence,
  type ConvexWorkspaceMutationRefs,
  type ConvexWorkspacePersistenceOptions,
} from "./convexWorkspacePersistence"
import {
  createLocalWorkspacePersistence,
  type WorkspacePersistenceAdapter,
  type WorkspacePersistenceSnapshot,
} from "./workspacePersistence"
import type { WorkspaceActionRecord } from "./workspaceActions"

export type WorkspacePersistenceMode = "convex" | "local"

export interface WorkspacePersistenceBridge {
  mutationRefs: ConvexWorkspaceMutationRefs
  runMutation: ConvexWorkspacePersistenceOptions["runMutation"]
  resolveOfferId?: ConvexWorkspacePersistenceOptions["resolveOfferId"]
  resolveQuoteId?: ConvexWorkspacePersistenceOptions["resolveQuoteId"]
  resolveRfqId: ConvexWorkspacePersistenceOptions["resolveRfqId"]
}

export interface WorkspacePersistenceRuntime {
  adapter: WorkspacePersistenceAdapter
  label: string
  mode: WorkspacePersistenceMode
}

export interface WorkspacePersistenceRuntimeOptions {
  convex?: WorkspacePersistenceBridge
  fallback?: WorkspacePersistenceAdapter
  initialSnapshot?: Partial<WorkspacePersistenceSnapshot>
  onSyncError?: (error: unknown, action: WorkspaceActionRecord) => void
}

export function createWorkspacePersistenceRuntime({
  convex,
  fallback,
  initialSnapshot,
  onSyncError,
}: WorkspacePersistenceRuntimeOptions = {}): WorkspacePersistenceRuntime {
  const localFallback = fallback ?? createLocalWorkspacePersistence(initialSnapshot)

  if (!convex) {
    return {
      adapter: localFallback,
      label: "Local fallback",
      mode: "local",
    }
  }

  return {
    adapter: createConvexWorkspacePersistence({
      fallback: localFallback,
      mutationRefs: convex.mutationRefs,
      onSyncError,
      resolveOfferId: convex.resolveOfferId,
      resolveQuoteId: convex.resolveQuoteId,
      resolveRfqId: convex.resolveRfqId,
      runMutation: convex.runMutation,
    }),
    label: "Convex sync",
    mode: "convex",
  }
}
