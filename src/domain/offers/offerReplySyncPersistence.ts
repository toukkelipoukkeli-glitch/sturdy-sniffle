import type { GmailOfferReplySyncResult } from "../integrations/gmailOfferReply"
import {
  buildConvexOfferReplySyncPayload,
  type BuildConvexOfferReplySyncPayloadOptions,
  type ConvexOfferReplySyncPayload,
} from "./convexOfferReply"

export interface OfferReplySyncPersistenceSnapshot {
  payloads: ConvexOfferReplySyncPayload[]
  recordedMessageIds: string[]
  syncCount: number
}

export interface OfferReplySyncPersistenceAdapter {
  recordSync(result: GmailOfferReplySyncResult): Promise<OfferReplySyncPersistenceSnapshot>
  snapshot(): OfferReplySyncPersistenceSnapshot
}

export interface LocalOfferReplySyncPersistenceOptions {
  initialSnapshot?: Partial<OfferReplySyncPersistenceSnapshot>
  payloadOptions: BuildConvexOfferReplySyncPayloadOptions
}

export interface ConvexOfferReplySyncPersistenceOptions {
  fallback?: OfferReplySyncPersistenceAdapter
  mutationRef: unknown
  onSyncError?: (error: unknown, payload: ConvexOfferReplySyncPayload) => void
  payloadOptions: BuildConvexOfferReplySyncPayloadOptions
  runMutation: (mutationRef: unknown, args: Record<string, unknown>) => Promise<unknown>
}

export function createLocalOfferReplySyncPersistence({
  initialSnapshot,
  payloadOptions,
}: LocalOfferReplySyncPersistenceOptions): OfferReplySyncPersistenceAdapter {
  let snapshotState: OfferReplySyncPersistenceSnapshot = {
    payloads: (initialSnapshot?.payloads ?? []).map(clonePayload),
    recordedMessageIds: normalizeRecordedMessageIds(initialSnapshot?.recordedMessageIds ?? payloadOptions.recordedMessageIds ?? []),
    syncCount: initialSnapshot?.syncCount ?? initialSnapshot?.payloads?.length ?? 0,
  }

  return {
    async recordSync(result) {
      const payload = buildConvexOfferReplySyncPayload(result, {
        ...payloadOptions,
        recordedMessageIds: snapshotState.recordedMessageIds,
      })
      snapshotState = appendPayload(snapshotState, payload)
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): OfferReplySyncPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function createConvexOfferReplySyncPersistence({
  fallback,
  mutationRef,
  onSyncError,
  payloadOptions,
  runMutation,
}: ConvexOfferReplySyncPersistenceOptions): OfferReplySyncPersistenceAdapter {
  const localFallback = fallback ?? createLocalOfferReplySyncPersistence({ payloadOptions })

  return {
    async recordSync(result) {
      const fallbackSnapshot = localFallback.snapshot()
      const payload = buildConvexOfferReplySyncPayload(result, {
        ...payloadOptions,
        recordedMessageIds: fallbackSnapshot.recordedMessageIds,
      })

      try {
        await runMutation(mutationRef, compactArgs(payload))
      } catch (error) {
        try {
          onSyncError?.(error, payload)
        } catch {
          // Local fallback must remain available even if observers fail.
        }
      }

      return await localFallback.recordSync(result)
    },
    snapshot() {
      return localFallback.snapshot()
    },
  }
}

function appendPayload(
  snapshot: OfferReplySyncPersistenceSnapshot,
  payload: ConvexOfferReplySyncPayload,
): OfferReplySyncPersistenceSnapshot {
  return {
    payloads: [...snapshot.payloads, clonePayload(payload)],
    recordedMessageIds: normalizeRecordedMessageIds([
      ...snapshot.recordedMessageIds,
      ...payload.appliedMessageIds,
      ...payload.ignoredMessageIds,
    ]),
    syncCount: snapshot.syncCount + 1,
  }
}

function cloneSnapshot(snapshot: OfferReplySyncPersistenceSnapshot): OfferReplySyncPersistenceSnapshot {
  return {
    payloads: snapshot.payloads.map(clonePayload),
    recordedMessageIds: [...snapshot.recordedMessageIds],
    syncCount: snapshot.syncCount,
  }
}

function clonePayload(payload: ConvexOfferReplySyncPayload): ConvexOfferReplySyncPayload {
  return {
    activities: payload.activities.map((activity) => ({ ...activity })),
    appliedMessageIds: [...payload.appliedMessageIds],
    ignoredMessageIds: [...payload.ignoredMessageIds],
    offerId: payload.offerId,
    ...(payload.quoteId ? { quoteId: payload.quoteId } : {}),
    ...(payload.rfqId ? { rfqId: payload.rfqId } : {}),
    statusTransitions: payload.statusTransitions.map((transition) => ({ ...transition })),
    warnings: [...payload.warnings],
  }
}

function compactArgs(payload: ConvexOfferReplySyncPayload): Record<string, unknown> {
  return {
    activities: payload.activities.map((activity) => ({ ...activity })),
    offerId: payload.offerId,
    ...(payload.quoteId ? { quoteId: payload.quoteId } : {}),
    ...(payload.rfqId ? { rfqId: payload.rfqId } : {}),
    statusTransitions: payload.statusTransitions.map((transition) => ({ ...transition })),
  }
}

function normalizeRecordedMessageIds(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort()
}
