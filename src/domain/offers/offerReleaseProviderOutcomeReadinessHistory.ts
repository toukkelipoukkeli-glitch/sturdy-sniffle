import { compareLex } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type { ConvexOfferReleaseProviderOutcomeReadinessPayload } from "./convexOfferReleaseProviderOutcomeReadiness"
import type { OfferReleaseProviderOutcomeReadiness } from "./offerReleaseProviderOutcomeReadiness"
import type { OfferReleaseProviderOutcomeReadinessPersistenceSnapshot } from "./offerReleaseProviderOutcomeReadinessPersistence"

export const OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_HISTORY_VERSION =
  "offer-release-provider-outcome-readiness-history.v1"

export interface OfferReleaseProviderOutcomeReadinessHistorySummary {
  historyVersion: typeof OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_HISTORY_VERSION
  totalReadinessRecords: number
  readyRecordCount: number
  blockedRecordCount: number
  currentReadiness?: OfferReleaseProviderOutcomeReadinessRecordSummary
  statusCounts: Partial<Record<OfferReleaseProviderOutcomeReadiness["status"], number>>
}

export interface OfferReleaseProviderOutcomeReadinessRecordSummary {
  appliedCommandCount: number
  blockerCount: number
  expectedCommandCount: number
  failedCommandCount: number
  latestCommandCount: number
  missingCommandCount: number
  nextActionCount: number
  offerId: string
  offerNumber: string
  readinessKey: string
  readinessVersion: string
  rfqId: string
  status: OfferReleaseProviderOutcomeReadiness["status"]
}

export function summarizeOfferReleaseProviderOutcomeReadinessHistory(
  snapshot: Pick<OfferReleaseProviderOutcomeReadinessPersistenceSnapshot, "records"> | undefined,
  currentReadinessKey?: string,
): OfferReleaseProviderOutcomeReadinessHistorySummary {
  const recordsInSnapshotOrder = (snapshot?.records ?? []).map(normalizeRecordSummary)
  const records = [...recordsInSnapshotOrder].sort(sortRecords)
  const statusCounts = countStatuses(records)
  const currentKey = currentReadinessKey?.trim()

  return {
    blockedRecordCount: statusCounts.blocked ?? 0,
    currentReadiness: currentKey
      ? records.find((record) => record.readinessKey === currentKey)
      : recordsInSnapshotOrder.at(-1),
    historyVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_HISTORY_VERSION,
    readyRecordCount: statusCounts.ready ?? 0,
    statusCounts,
    totalReadinessRecords: records.length,
  }
}

function normalizeRecordSummary(
  record: ConvexOfferReleaseProviderOutcomeReadinessPayload,
): OfferReleaseProviderOutcomeReadinessRecordSummary {
  return {
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "record.appliedCommandCount"),
    blockerCount: record.blockerLabels.length,
    expectedCommandCount: nonNegativeInteger(record.expectedCommandCount, "record.expectedCommandCount"),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "record.failedCommandCount"),
    latestCommandCount: nonNegativeInteger(record.latestCommandCount, "record.latestCommandCount"),
    missingCommandCount: nonNegativeInteger(record.missingCommandCount, "record.missingCommandCount"),
    nextActionCount: record.nextActions.length,
    offerId: nonBlank(record.offerId, "record.offerId"),
    offerNumber: nonBlank(record.offerNumber, "record.offerNumber"),
    readinessKey: nonBlank(record.readinessKey, "record.readinessKey"),
    readinessVersion: nonBlank(record.readinessVersion, "record.readinessVersion"),
    rfqId: nonBlank(record.rfqId, "record.rfqId"),
    status: normalizeStatus(record.status),
  }
}

function countStatuses(
  records: OfferReleaseProviderOutcomeReadinessRecordSummary[],
): Partial<Record<OfferReleaseProviderOutcomeReadiness["status"], number>> {
  return records.reduce<Partial<Record<OfferReleaseProviderOutcomeReadiness["status"], number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function normalizeStatus(status: OfferReleaseProviderOutcomeReadiness["status"]): OfferReleaseProviderOutcomeReadiness["status"] {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("provider outcome readiness history status must be blocked or ready")
  }
  return status
}

function nonNegativeInteger(value: number, key: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer`)
  }
  return value
}

function sortRecords(
  left: OfferReleaseProviderOutcomeReadinessRecordSummary,
  right: OfferReleaseProviderOutcomeReadinessRecordSummary,
): number {
  return (
    compareLex(left.offerId, right.offerId) ||
    compareLex(left.rfqId, right.rfqId) ||
    compareLex(left.status, right.status) ||
    compareLex(left.readinessKey, right.readinessKey)
  )
}
