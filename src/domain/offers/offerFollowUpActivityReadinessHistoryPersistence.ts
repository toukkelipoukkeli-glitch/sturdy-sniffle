import { compareLex } from "../shared/deterministic"
import { optionalTrim } from "../shared/stringValidation"
import {
  summarizeOfferFollowUpActivityReadinessHistory,
  type OfferFollowUpActivityReadinessHistoryRecord,
  type OfferFollowUpActivityReadinessHistorySummary,
} from "./offerFollowUpActivityReadinessHistory"
import type { OfferFollowUpActivityReadiness } from "./offerFollowUpActivityReadiness"

export interface OfferFollowUpActivityReadinessHistoryPersistenceSnapshot {
  currentReadinessKey?: string
  recordCount: number
  records: OfferFollowUpActivityReadinessHistoryRecord[]
  summary: OfferFollowUpActivityReadinessHistorySummary
}

export interface OfferFollowUpActivityReadinessHistoryPersistenceAdapter {
  recordReadiness(
    record: OfferFollowUpActivityReadinessHistoryRecord,
  ): Promise<OfferFollowUpActivityReadinessHistoryPersistenceSnapshot>
  snapshot(): OfferFollowUpActivityReadinessHistoryPersistenceSnapshot
}

export interface LocalOfferFollowUpActivityReadinessHistoryPersistenceOptions {
  initialSnapshot?: Partial<OfferFollowUpActivityReadinessHistoryPersistenceSnapshot>
}

export function createLocalOfferFollowUpActivityReadinessHistoryPersistence({
  initialSnapshot,
}: LocalOfferFollowUpActivityReadinessHistoryPersistenceOptions = {}): OfferFollowUpActivityReadinessHistoryPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordReadiness(record) {
      const normalized = normalizeRecord(record)
      snapshotState = normalizeSnapshot({
        currentReadinessKey: normalized.readinessKey,
        records: [
          ...snapshotState.records.filter((existing) => existing.readinessKey !== normalized.readinessKey),
          normalized,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): OfferFollowUpActivityReadinessHistoryPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function normalizeSnapshot(
  snapshot: Partial<OfferFollowUpActivityReadinessHistoryPersistenceSnapshot> | undefined,
): OfferFollowUpActivityReadinessHistoryPersistenceSnapshot {
  const recordsByKey = new Map<string, OfferFollowUpActivityReadinessHistoryRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    recordsByKey.set(normalized.readinessKey, normalized)
  }

  const records = [...recordsByKey.values()].sort(sortRecords)
  const requestedCurrentKey = optionalTrim(snapshot?.currentReadinessKey)
  const currentReadinessKey = requestedCurrentKey && recordsByKey.has(requestedCurrentKey) ? requestedCurrentKey : undefined
  const summary = summarizeOfferFollowUpActivityReadinessHistory(records, currentReadinessKey)

  return {
    ...(summary.currentReadiness ? { currentReadinessKey: summary.currentReadiness.readinessKey } : {}),
    recordCount: records.length,
    records,
    summary,
  }
}

function normalizeRecord(record: OfferFollowUpActivityReadinessHistoryRecord): OfferFollowUpActivityReadinessHistoryRecord {
  const summary = summarizeOfferFollowUpActivityReadinessHistory([record], record.readinessKey)
  const normalized = summary.currentReadiness
  if (!normalized) {
    throw new Error("follow-up activity readiness history record could not be normalized")
  }

  return {
    offerId: normalized.offerId,
    readiness: {
      ...cloneReadiness(record.readiness),
      expectedTaskCount: normalized.expectedTaskCount,
      missingTaskCount: normalized.missingTaskCount,
      recordedTaskCount: normalized.recordedTaskCount,
      status: normalized.status,
      totalActivities: normalized.totalActivities,
      unexpectedTaskCount: normalized.unexpectedTaskCount,
      unmatchedActivityCount: normalized.unmatchedActivityCount,
    },
    readinessKey: normalized.readinessKey,
    recordedAt: normalized.recordedAt,
    rfqId: normalized.rfqId,
  }
}

function cloneSnapshot(
  snapshot: OfferFollowUpActivityReadinessHistoryPersistenceSnapshot,
): OfferFollowUpActivityReadinessHistoryPersistenceSnapshot {
  return {
    ...(snapshot.currentReadinessKey ? { currentReadinessKey: snapshot.currentReadinessKey } : {}),
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    summary: {
      ...snapshot.summary,
      ...(snapshot.summary.currentReadiness ? { currentReadiness: { ...snapshot.summary.currentReadiness } } : {}),
      statusCounts: { ...snapshot.summary.statusCounts },
    },
  }
}

function cloneRecord(record: OfferFollowUpActivityReadinessHistoryRecord): OfferFollowUpActivityReadinessHistoryRecord {
  return {
    offerId: record.offerId,
    readiness: cloneReadiness(record.readiness),
    readinessKey: record.readinessKey,
    recordedAt: record.recordedAt,
    rfqId: record.rfqId,
  }
}

function cloneReadiness(readiness: OfferFollowUpActivityReadiness): OfferFollowUpActivityReadiness {
  return {
    expectedFollowUpTaskIds: [...readiness.expectedFollowUpTaskIds],
    expectedTaskCount: readiness.expectedTaskCount,
    ...(readiness.latestActivityMessage ? { latestActivityMessage: readiness.latestActivityMessage } : {}),
    missingFollowUpTaskIds: [...readiness.missingFollowUpTaskIds],
    missingTaskCount: readiness.missingTaskCount,
    nextActions: [...readiness.nextActions],
    readinessVersion: readiness.readinessVersion,
    recordedFollowUpTaskIds: [...readiness.recordedFollowUpTaskIds],
    recordedTaskCount: readiness.recordedTaskCount,
    status: readiness.status,
    totalActivities: readiness.totalActivities,
    unexpectedFollowUpTaskIds: [...readiness.unexpectedFollowUpTaskIds],
    unexpectedTaskCount: readiness.unexpectedTaskCount,
    unmatchedActivityCount: readiness.unmatchedActivityCount,
  }
}

function sortRecords(
  left: OfferFollowUpActivityReadinessHistoryRecord,
  right: OfferFollowUpActivityReadinessHistoryRecord,
): number {
  return compareLex(left.readinessKey, right.readinessKey)
}
