import {
  buildConvexConnectorRfqSyncPayload,
  type BuildConvexConnectorRfqSyncPayloadOptions,
  type ConvexConnectorRfqSyncPayload,
} from "./convexConnectorSync"
import type { ConnectorRfqSyncResult } from "./connectorSync"

export interface ConnectorSyncPersistenceSnapshot {
  payloads: ConvexConnectorRfqSyncPayload[]
  syncCount: number
}

export interface ConnectorSyncPersistenceAdapter {
  recordSync(result: ConnectorRfqSyncResult): Promise<ConnectorSyncPersistenceSnapshot>
  snapshot(): ConnectorSyncPersistenceSnapshot
}

export interface LocalConnectorSyncPersistenceOptions {
  initialSnapshot?: Partial<ConnectorSyncPersistenceSnapshot>
  payloadOptions?: BuildConvexConnectorRfqSyncPayloadOptions
}

export interface ConvexConnectorSyncPersistenceOptions {
  fallback?: ConnectorSyncPersistenceAdapter
  mutationRef: unknown
  onSyncError?: (error: unknown, payload: ConvexConnectorRfqSyncPayload) => void
  payloadOptions?: BuildConvexConnectorRfqSyncPayloadOptions
  runMutation: (mutationRef: unknown, args: Record<string, unknown>) => Promise<unknown>
}

export function createLocalConnectorSyncPersistence({
  initialSnapshot,
  payloadOptions,
}: LocalConnectorSyncPersistenceOptions = {}): ConnectorSyncPersistenceAdapter {
  let snapshotState: ConnectorSyncPersistenceSnapshot = {
    payloads: [...(initialSnapshot?.payloads ?? [])],
    syncCount: initialSnapshot?.syncCount ?? initialSnapshot?.payloads?.length ?? 0,
  }

  return {
    async recordSync(result) {
      const payload = buildConvexConnectorRfqSyncPayload(result, payloadOptions)
      snapshotState = {
        payloads: [...snapshotState.payloads, payload],
        syncCount: snapshotState.syncCount + 1,
      }
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): ConnectorSyncPersistenceSnapshot {
    return {
      payloads: snapshotState.payloads.map(clonePayload),
      syncCount: snapshotState.syncCount,
    }
  }
}

export function createConvexConnectorSyncPersistence({
  fallback,
  mutationRef,
  onSyncError,
  payloadOptions,
  runMutation,
}: ConvexConnectorSyncPersistenceOptions): ConnectorSyncPersistenceAdapter {
  const localFallback = fallback ?? createLocalConnectorSyncPersistence({ payloadOptions })

  return {
    async recordSync(result) {
      const payload = buildConvexConnectorRfqSyncPayload(result, payloadOptions)
      try {
        await runMutation(mutationRef, compactArgs(payload))
      } catch (error) {
        onSyncError?.(error, payload)
      }

      return await localFallback.recordSync(result)
    },
    snapshot() {
      return localFallback.snapshot()
    },
  }
}

function clonePayload(payload: ConvexConnectorRfqSyncPayload): ConvexConnectorRfqSyncPayload {
  return {
    activities: payload.activities.map((activity) => ({ ...activity })),
    links: payload.links.map((link) => ({ ...link })),
  }
}

function compactArgs(payload: ConvexConnectorRfqSyncPayload): Record<string, unknown> {
  return {
    activities: payload.activities.map((activity) => ({ ...activity })),
    links: payload.links.map((link) => ({ ...link })),
  }
}
