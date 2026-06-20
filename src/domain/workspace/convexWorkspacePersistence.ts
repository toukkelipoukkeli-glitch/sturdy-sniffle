import type { QuoteQueueStatus } from "./quoteQueue"
import type { WorkspaceActionRecord } from "./workspaceActions"
import {
  createLocalWorkspacePersistence,
  type WorkspacePersistenceAdapter,
  type WorkspacePersistenceSnapshot,
} from "./workspacePersistence"

type ConvexRfqStatus = "new" | "triage" | "estimating" | "quoted" | "won" | "lost" | "archived"
type ConvexActivityKind = "note" | "status_change" | "calendar_event" | "calculation"

export interface ConvexWorkspaceMutationRefs {
  createOfferFollowUpActivity?: unknown
  recordWorkspaceActivity: unknown
  transitionRfqStatus: unknown
}

export interface ConvexWorkspacePersistenceOptions {
  fallback?: WorkspacePersistenceAdapter
  mutationRefs: ConvexWorkspaceMutationRefs
  runMutation: (mutationRef: unknown, args: Record<string, unknown>) => Promise<unknown>
  resolveOfferId?: (offerId: string) => string | undefined
  resolveQuoteId?: (quoteId: string) => string | undefined
  resolveRfqId: (rfqId: string) => string | undefined
  onSyncError?: (error: unknown, action: WorkspaceActionRecord) => void
}

export function createConvexWorkspacePersistence({
  fallback = createLocalWorkspacePersistence(),
  mutationRefs,
  onSyncError,
  resolveOfferId,
  resolveQuoteId,
  resolveRfqId,
  runMutation,
}: ConvexWorkspacePersistenceOptions): WorkspacePersistenceAdapter {
  return {
    async recordAction(action) {
      try {
        await persistActionToConvex({
          action,
          mutationRefs,
          resolveOfferId,
          resolveQuoteId,
          resolveRfqId,
          runMutation,
        })
      } catch (error) {
        onSyncError?.(error, action)
      }

      return await fallback.recordAction(action)
    },
    snapshot() {
      return fallback.snapshot()
    },
  }
}

async function persistActionToConvex({
  action,
  mutationRefs,
  resolveOfferId,
  resolveQuoteId,
  resolveRfqId,
  runMutation,
}: {
  action: WorkspaceActionRecord
  mutationRefs: ConvexWorkspaceMutationRefs
  runMutation: ConvexWorkspacePersistenceOptions["runMutation"]
  resolveOfferId?: ConvexWorkspacePersistenceOptions["resolveOfferId"]
  resolveQuoteId?: ConvexWorkspacePersistenceOptions["resolveQuoteId"]
  resolveRfqId: ConvexWorkspacePersistenceOptions["resolveRfqId"]
}) {
  const rfqId = resolveRfqId(action.rfqId)
  if (!rfqId) {
    return
  }

  if (action.kind === "status_change" && action.toStatus) {
    const status = toConvexRfqStatus(action.toStatus)
    if (status) {
      await runMutation(mutationRefs.transitionRfqStatus, compactArgs({
        message: action.note,
        rfqId,
        status,
      }))
      return
    }
  }

  if (action.kind === "follow_up_created" && action.offerId && mutationRefs.createOfferFollowUpActivity) {
    const offerId = resolveOfferId?.(action.offerId)
    const quoteId = action.quoteId ? resolveQuoteId?.(action.quoteId) : undefined
    if (offerId) {
      await runMutation(mutationRefs.createOfferFollowUpActivity, compactArgs({
        actorName: action.actor,
        message: action.activityMessage,
        offerId,
        quoteId,
        rfqId,
      }))
      return
    }
  }

  await runMutation(mutationRefs.recordWorkspaceActivity, compactArgs({
    actorName: action.actor,
    kind: toConvexActivityKind(action),
    message: action.activityMessage,
    offerId: action.offerId ? resolveOfferId?.(action.offerId) : undefined,
    quoteId: action.quoteId ? resolveQuoteId?.(action.quoteId) : undefined,
    rfqId,
  }))
}

function toConvexRfqStatus(status: QuoteQueueStatus): ConvexRfqStatus | undefined {
  const statusMap: Partial<Record<QuoteQueueStatus, ConvexRfqStatus>> = {
    estimating: "estimating",
    lost: "lost",
    new: "new",
    ready: "quoted",
    triage: "triage",
    won: "won",
  }
  return statusMap[status]
}

function toConvexActivityKind(action: WorkspaceActionRecord): ConvexActivityKind {
  if (action.kind === "scenario_saved") {
    return "calculation"
  }
  return action.activityKind === "quote_update" ? "calculation" : action.activityKind
}

function compactArgs(args: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(args).filter(([, value]) => value !== undefined))
}

export type { WorkspacePersistenceSnapshot }
