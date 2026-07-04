import {
  buildConvexOfferReleaseProviderOutcomeReadinessPayload,
  buildOfferReleaseProviderOutcomeReadinessFromConvex,
  type BuildConvexOfferReleaseProviderOutcomeReadinessPayloadOptions,
  type ConvexOfferReleaseProviderOutcomeReadinessPayload,
} from "./convexOfferReleaseProviderOutcomeReadiness"
import type { OfferReleaseProviderOutcomeReadiness } from "./offerReleaseProviderOutcomeReadiness"

export interface OfferReleaseProviderOutcomeReadinessPersistenceSnapshot {
  blockedReadinessKeys: string[]
  readyReadinessKeys: string[]
  recordCount: number
  records: ConvexOfferReleaseProviderOutcomeReadinessPayload[]
  statusCounts: Partial<Record<OfferReleaseProviderOutcomeReadiness["status"], number>>
}

export interface OfferReleaseProviderOutcomeReadinessPersistenceAdapter {
  recordReadiness(
    readiness: OfferReleaseProviderOutcomeReadiness,
    options?: BuildConvexOfferReleaseProviderOutcomeReadinessPayloadOptions,
  ): Promise<OfferReleaseProviderOutcomeReadinessPersistenceSnapshot>
  snapshot(): OfferReleaseProviderOutcomeReadinessPersistenceSnapshot
}

export interface LocalOfferReleaseProviderOutcomeReadinessPersistenceOptions {
  initialSnapshot?: Partial<OfferReleaseProviderOutcomeReadinessPersistenceSnapshot>
}

export interface ConvexOfferReleaseProviderOutcomeReadinessPersistenceOptions {
  fallback?: OfferReleaseProviderOutcomeReadinessPersistenceAdapter
  mutationRef: unknown
  onPersistError?: (error: unknown, payload: ConvexOfferReleaseProviderOutcomeReadinessPayload) => void
  runMutation: (mutationRef: unknown, args: Record<string, unknown>) => Promise<unknown>
}

export function createLocalOfferReleaseProviderOutcomeReadinessPersistence({
  initialSnapshot,
}: LocalOfferReleaseProviderOutcomeReadinessPersistenceOptions = {}): OfferReleaseProviderOutcomeReadinessPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordReadiness(readiness, options) {
      const payload = buildConvexOfferReleaseProviderOutcomeReadinessPayload(readiness, options)
      validatePayloadConsistency(payload)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records.filter((record) => record.readinessKey !== payload.readinessKey),
          payload,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): OfferReleaseProviderOutcomeReadinessPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function createConvexOfferReleaseProviderOutcomeReadinessPersistence({
  fallback,
  mutationRef,
  onPersistError,
  runMutation,
}: ConvexOfferReleaseProviderOutcomeReadinessPersistenceOptions): OfferReleaseProviderOutcomeReadinessPersistenceAdapter {
  const localFallback = fallback ?? createLocalOfferReleaseProviderOutcomeReadinessPersistence()

  return {
    async recordReadiness(readiness, options) {
      const payload = buildConvexOfferReleaseProviderOutcomeReadinessPayload(readiness, options)
      validatePayloadConsistency(payload)

      try {
        await runMutation(mutationRef, compactArgs(payload))
      } catch (error) {
        try {
          onPersistError?.(error, payload)
        } catch {
          // Local fallback must remain available even if observers fail.
        }
      }

      return await localFallback.recordReadiness(readiness, options)
    },
    snapshot() {
      return localFallback.snapshot()
    },
  }
}

function normalizeSnapshot(
  snapshot: Partial<OfferReleaseProviderOutcomeReadinessPersistenceSnapshot> | undefined,
): OfferReleaseProviderOutcomeReadinessPersistenceSnapshot {
  const recordsByKey = new Map<string, ConvexOfferReleaseProviderOutcomeReadinessPayload>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    recordsByKey.set(normalized.readinessKey, normalized)
  }
  const records = [...recordsByKey.values()].sort(sortRecords)

  return {
    blockedReadinessKeys: records.filter((record) => record.status === "blocked").map((record) => record.readinessKey),
    readyReadinessKeys: records.filter((record) => record.status === "ready").map((record) => record.readinessKey),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
  }
}

function normalizeRecord(
  record: ConvexOfferReleaseProviderOutcomeReadinessPayload,
): ConvexOfferReleaseProviderOutcomeReadinessPayload {
  const normalized = buildConvexOfferReleaseProviderOutcomeReadinessPayload(
    buildOfferReleaseProviderOutcomeReadinessFromConvex(record),
    {
      offerId: record.offerId,
      readinessKey: record.readinessKey,
    },
  )
  validatePayloadConsistency(normalized)
  return normalized
}

function validatePayloadConsistency(payload: ConvexOfferReleaseProviderOutcomeReadinessPayload) {
  if (payload.appliedCommandCount + payload.failedCommandCount !== payload.latestCommandCount) {
    throw new Error("applied and failed provider outcome counts must equal latestCommandCount")
  }
  if (payload.latestCommandCount + payload.missingCommandCount !== payload.expectedCommandCount) {
    throw new Error("latest and missing provider outcome counts must equal expectedCommandCount")
  }
  if (payload.status === "ready" && (payload.failedCommandCount > 0 || payload.missingCommandCount > 0)) {
    throw new Error("provider outcome readiness cannot be ready while failed or missing commands remain")
  }
}

function cloneSnapshot(
  snapshot: OfferReleaseProviderOutcomeReadinessPersistenceSnapshot,
): OfferReleaseProviderOutcomeReadinessPersistenceSnapshot {
  return {
    blockedReadinessKeys: [...snapshot.blockedReadinessKeys],
    readyReadinessKeys: [...snapshot.readyReadinessKeys],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(clonePayload),
    statusCounts: { ...snapshot.statusCounts },
  }
}

function clonePayload(
  payload: ConvexOfferReleaseProviderOutcomeReadinessPayload,
): ConvexOfferReleaseProviderOutcomeReadinessPayload {
  return {
    appliedCommandCount: payload.appliedCommandCount,
    blockerLabels: [...payload.blockerLabels],
    expectedCommandCount: payload.expectedCommandCount,
    failedCommandCount: payload.failedCommandCount,
    latestCommandCount: payload.latestCommandCount,
    ...(payload.latestOutcomeFingerprint ? { latestOutcomeFingerprint: payload.latestOutcomeFingerprint } : {}),
    missingCommandCount: payload.missingCommandCount,
    nextActions: [...payload.nextActions],
    offerId: payload.offerId,
    offerNumber: payload.offerNumber,
    readinessKey: payload.readinessKey,
    readinessVersion: payload.readinessVersion,
    rfqId: payload.rfqId,
    status: payload.status,
  }
}

function compactArgs(payload: ConvexOfferReleaseProviderOutcomeReadinessPayload): Record<string, unknown> {
  return {
    appliedCommandCount: payload.appliedCommandCount,
    blockerLabels: [...payload.blockerLabels],
    expectedCommandCount: payload.expectedCommandCount,
    failedCommandCount: payload.failedCommandCount,
    latestCommandCount: payload.latestCommandCount,
    ...(payload.latestOutcomeFingerprint ? { latestOutcomeFingerprint: payload.latestOutcomeFingerprint } : {}),
    missingCommandCount: payload.missingCommandCount,
    nextActions: [...payload.nextActions],
    offerId: payload.offerId,
    offerNumber: payload.offerNumber,
    readinessKey: payload.readinessKey,
    readinessVersion: payload.readinessVersion,
    status: payload.status,
  }
}

function countStatuses(
  records: ConvexOfferReleaseProviderOutcomeReadinessPayload[],
): Partial<Record<OfferReleaseProviderOutcomeReadiness["status"], number>> {
  return records.reduce<Partial<Record<OfferReleaseProviderOutcomeReadiness["status"], number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function sortRecords(
  left: ConvexOfferReleaseProviderOutcomeReadinessPayload,
  right: ConvexOfferReleaseProviderOutcomeReadinessPayload,
): number {
  return left.readinessKey.localeCompare(right.readinessKey)
}
