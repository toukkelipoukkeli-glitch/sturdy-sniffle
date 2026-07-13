import { nonNegativeInteger } from "../shared/numberValidation"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
  type OfferFollowUpActivityReadinessHistorySummary,
  type OfferFollowUpActivityReadinessRecordSummary,
  type OfferFollowUpActivityReadinessSyncSummary,
} from "./offerFollowUpActivityReadinessHistory"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
  offerFollowUpActivityReadinessSyncHealthReadRecoveryAction,
  type OfferFollowUpActivityReadinessSyncHealthSummary,
} from "./offerFollowUpActivityReadinessSyncHealth"

export const OFFER_FOLLOW_UP_ACTIVITY_READINESS_READ_MODEL_VERSION =
  "offer-follow-up-activity-readiness-read-model.v1"

export type OfferFollowUpActivityReadinessReadModelStatus =
  | "fallback"
  | "partial"
  | "pending"
  | "ready"
  | "review"

export interface OfferFollowUpActivityReadinessReadModelInput {
  history: OfferFollowUpActivityReadinessHistorySummary
  sync: OfferFollowUpActivityReadinessSyncSummary
  syncHealth: OfferFollowUpActivityReadinessSyncHealthSummary
}

export interface OfferFollowUpActivityReadinessReadModel {
  blockerLabels: string[]
  canUsePersistedRead: boolean
  currentReadiness?: OfferFollowUpActivityReadinessRecordSummary
  nextActionLabels: string[]
  operatorSummary: string
  readModelVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_READ_MODEL_VERSION
  source: OfferFollowUpActivityReadinessSyncSummary["currentSource"]
  status: OfferFollowUpActivityReadinessReadModelStatus
  syncHealthStatus: OfferFollowUpActivityReadinessSyncHealthSummary["status"]
  totalReadinessRecords: number
  warningLabels: string[]
}

export function buildOfferFollowUpActivityReadinessReadModel({
  history,
  sync,
  syncHealth,
}: OfferFollowUpActivityReadinessReadModelInput): OfferFollowUpActivityReadinessReadModel {
  assertSupportedVersions(history, syncHealth)
  const totalReadinessRecords = nonNegativeInteger(history.totalReadinessRecords, "history.totalReadinessRecords")
  const currentReadiness = cloneCurrentReadiness(history.currentReadiness)
  const source = currentReadiness ? sync.currentSource : "none"
  const status = determineStatus(currentReadiness, syncHealth)
  const blockerLabels = blockersForStatus(status, currentReadiness, syncHealth)
  const warningLabels = warningsForStatus(status, currentReadiness, sync, syncHealth)

  return {
    blockerLabels,
    canUsePersistedRead: status === "ready",
    currentReadiness,
    nextActionLabels: nextActionsForStatus(status, currentReadiness, syncHealth),
    operatorSummary: operatorSummaryForStatus(status, currentReadiness, sync, syncHealth, totalReadinessRecords),
    readModelVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_READ_MODEL_VERSION,
    source,
    status,
    syncHealthStatus: syncHealth.status,
    totalReadinessRecords,
    warningLabels,
  }
}

function assertSupportedVersions(
  history: OfferFollowUpActivityReadinessHistorySummary,
  syncHealth: OfferFollowUpActivityReadinessSyncHealthSummary,
): void {
  if (history.historyVersion !== OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION) {
    throw new Error("follow-up readiness history version is not supported")
  }
  if (syncHealth.healthVersion !== OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION) {
    throw new Error("follow-up readiness sync health version is not supported")
  }
}

function determineStatus(
  currentReadiness: OfferFollowUpActivityReadinessRecordSummary | undefined,
  syncHealth: OfferFollowUpActivityReadinessSyncHealthSummary,
): OfferFollowUpActivityReadinessReadModelStatus {
  if (syncHealth.severity === "critical") {
    return "fallback"
  }
  if (!currentReadiness) {
    return "pending"
  }
  if (currentReadiness.status === "recorded") {
    return syncHealth.severity === "healthy" ? "ready" : "fallback"
  }
  return currentReadiness.status
}

function blockersForStatus(
  status: OfferFollowUpActivityReadinessReadModelStatus,
  currentReadiness: OfferFollowUpActivityReadinessRecordSummary | undefined,
  syncHealth: OfferFollowUpActivityReadinessSyncHealthSummary,
): string[] {
  if (status === "fallback") {
    return syncHealth.severity === "critical"
      ? ["Follow-up readiness persisted reads are stale or unavailable."]
      : ["Follow-up readiness persisted reads are using local fallback."]
  }
  if (status === "partial" && currentReadiness) {
    return [`${currentReadiness.missingTaskCount} expected follow-up task(s) are missing persisted activity.`]
  }
  return []
}

function warningsForStatus(
  status: OfferFollowUpActivityReadinessReadModelStatus,
  currentReadiness: OfferFollowUpActivityReadinessRecordSummary | undefined,
  sync: OfferFollowUpActivityReadinessSyncSummary,
  syncHealth: OfferFollowUpActivityReadinessSyncHealthSummary,
): string[] {
  const warnings: string[] = []
  if (sync.mode === "mixed") {
    warnings.push("Follow-up readiness records are split across Convex/local/other sources.")
  } else if (sync.mode === "other") {
    warnings.push("Follow-up readiness records do not match the selected local or Convex identifiers.")
  }
  if (syncHealth.severity === "warning") {
    warnings.push(syncHealth.operatorSummary)
  }
  if (status === "review" && currentReadiness) {
    if (currentReadiness.unexpectedTaskCount > 0) {
      warnings.push(`${currentReadiness.unexpectedTaskCount} unexpected follow-up task id(s) need review.`)
    }
    if (currentReadiness.unmatchedActivityCount > 0) {
      warnings.push(`${currentReadiness.unmatchedActivityCount} unmatched follow-up activity message(s) need review.`)
    }
  }
  return warnings
}

function nextActionsForStatus(
  status: OfferFollowUpActivityReadinessReadModelStatus,
  currentReadiness: OfferFollowUpActivityReadinessRecordSummary | undefined,
  syncHealth: OfferFollowUpActivityReadinessSyncHealthSummary,
): string[] {
  if (status === "ready") {
    return ["Use persisted follow-up readiness to avoid duplicate follow-up activity writes."]
  }
  if (status === "pending") {
    return ["Read or record follow-up readiness before relying on persisted follow-up coverage."]
  }
  if (status === "partial" && currentReadiness) {
    return [`Record ${currentReadiness.missingTaskCount} missing follow-up activity task(s).`]
  }
  if (status === "review") {
    return ["Review persisted follow-up readiness before writing more activity records."]
  }
  const recoveryActions =
    syncHealth.recoveryActionLabels.length > 0
      ? syncHealth.recoveryActionLabels
      : [offerFollowUpActivityReadinessSyncHealthReadRecoveryAction]
  return [...recoveryActions, "Keep local readiness history visible until persisted reads recover."]
}

function operatorSummaryForStatus(
  status: OfferFollowUpActivityReadinessReadModelStatus,
  currentReadiness: OfferFollowUpActivityReadinessRecordSummary | undefined,
  sync: OfferFollowUpActivityReadinessSyncSummary,
  syncHealth: OfferFollowUpActivityReadinessSyncHealthSummary,
  totalReadinessRecords: number,
): string {
  if (!currentReadiness) {
    return `No current follow-up readiness record is available across ${totalReadinessRecords} persisted record(s).`
  }
  const sourceText = sync.currentSource === "none" ? "no source" : sync.currentSource
  if (status === "ready") {
    return `Current follow-up readiness is recorded from ${sourceText}; persisted read coverage is ready.`
  }
  if (status === "fallback") {
    return `Current follow-up readiness read is not trusted because ${syncHealth.operatorSummary}`
  }
  if (status === "partial") {
    return `Current follow-up readiness is partial from ${sourceText}; ${currentReadiness.missingTaskCount} expected task(s) are missing.`
  }
  if (status === "review") {
    return `Current follow-up readiness needs review from ${sourceText}; unexpected or unmatched persisted activity remains.`
  }
  return `Current follow-up readiness is pending from ${sourceText}; persisted coverage is not complete yet.`
}

function cloneCurrentReadiness(
  currentReadiness: OfferFollowUpActivityReadinessRecordSummary | undefined,
): OfferFollowUpActivityReadinessRecordSummary | undefined {
  return currentReadiness ? { ...currentReadiness } : undefined
}
