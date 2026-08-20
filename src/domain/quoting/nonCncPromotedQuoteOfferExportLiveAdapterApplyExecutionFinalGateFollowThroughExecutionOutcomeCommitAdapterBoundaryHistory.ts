import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistoryStatus =
  | "blocked"
  | "empty"
  | "ready"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  readyCount: number
  blockedCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  committedOutcomeCount: number
  blockerCount: number
  warningCount: number
  readyBoundaryIds: string[]
  blockedBoundaryIds: string[]
  adapterBoundaryFingerprints: string[]
  commitRecordIds: string[]
  committedExecutionFingerprints: string[]
  followThroughIds: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const status = historyStatus(latestRecord)
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary,
    "exportText"
  > = {
    actionItems: actionItems(status, snapshot.warningCount),
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    blockedBoundaryIds: [...snapshot.blockedBoundaryIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedCount: snapshot.statusCounts.blocked ?? 0,
    blockerCount: snapshot.blockerCount,
    commandCount: snapshot.commandCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    committedOutcomeCount: snapshot.committedOutcomeCount,
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    followThroughIds: [...snapshot.followThroughIds],
    latestRecord,
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRecord),
    plannedCommandCount: snapshot.plannedCommandCount,
    readinessRecordIds: [...snapshot.readinessRecordIds],
    readyBoundaryIds: [...snapshot.readyBoundaryIds],
    readyCount: snapshot.statusCounts.ready ?? 0,
    recentRecords,
    severity: historySeverity(status),
    status,
    targetRfqIds: [...snapshot.targetRfqIds],
    title: historyTitle(status),
    totalRecords: snapshot.recordCount,
    warningCount: snapshot.warningCount,
  }

  return {
    ...summary,
    exportText: buildExportText(summary),
  }
}

function historyStatus(
  latestRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "ready" ? "ready" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "ready") {
    return "success"
  }
  return "neutral"
}

function historyTitle(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistoryStatus,
): string {
  if (status === "blocked") {
    return "Final-gate follow-through adapter boundary history blocked"
  }
  if (status === "ready") {
    return "Final-gate follow-through adapter boundary history ready"
  }
  return "No final-gate follow-through adapter boundary history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistoryStatus,
  totalRecords: number,
  latestRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord
    | undefined,
): string {
  if (!latestRecord) {
    return "No non-CNC live-adapter final-gate follow-through adapter-boundary records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC live-adapter final-gate follow-through adapter boundary is blocked after ${formatCount(totalRecords, "record")}; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes remain disabled.`
  }
  return `Latest non-CNC live-adapter final-gate follow-through adapter boundary has ${formatCount(latestRecord.plannedCommandCount, "review-only command")} ready with ${formatCount(latestRecord.committedOutcomeCount, "reviewed outcome")} for operator review.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist final-gate follow-through adapter-boundary records before surfacing live follow-through readiness.")
  } else if (status === "blocked") {
    items.push("Resolve final-gate follow-through adapter-boundary blockers before retrying follow-through review.")
  } else {
    items.push("Review persisted final-gate follow-through command descriptors before enabling live follow-through writes.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release follow-through.`)
  }
  return items
}

function buildExportText(
  summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary,
    "exportText"
  >,
): string {
  const lines = [
    "Non-CNC live adapter final-gate follow-through adapter boundary history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Ready boundaries: ${summary.readyCount}`,
    `Blocked boundaries: ${summary.blockedCount}`,
    `Commands: ${summary.commandCount}`,
    `Planned commands: ${summary.plannedCommandCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Reviewed outcomes: ${summary.committedOutcomeCount}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Ready boundary IDs: ${summary.readyBoundaryIds.join(", ") || "none"}`,
    `Blocked boundary IDs: ${summary.blockedBoundaryIds.join(", ") || "none"}`,
    `Adapter fingerprints: ${summary.adapterBoundaryFingerprints.join(", ") || "none"}`,
    `Commit records: ${summary.commitRecordIds.join(", ") || "none"}`,
    `Committed executions: ${summary.committedExecutionFingerprints.join(", ") || "none"}`,
    `Follow-through IDs: ${summary.followThroughIds.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Readiness records: ${summary.readinessRecordIds.join(", ") || "none"}`,
    `Idempotency keys: ${summary.commandIdempotencyKeys.join(", ") || "none"}`,
    `Evidence fingerprints: ${summary.evidenceFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest boundary: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | ${summary.latestRecord.disposition} | ${summary.latestRecord.adapterBoundaryId}`,
    )
  }
  lines.push("Recent final-gate adapter boundaries:")
  if (summary.recentRecords.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentRecords) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | ${record.disposition} | commands ${record.commandCount} | ${record.adapterBoundaryId}`,
      )
    }
  }
  lines.push(
    "Boundary: final-gate follow-through adapter-boundary history is deterministic review data only; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryRecord {
  return {
    ...record,
    blockerLabels: [...record.blockerLabels],
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    commandStatuses: [...record.commandStatuses],
    evidenceFingerprints: [...record.evidenceFingerprints],
    nextActionLabels: [...record.nextActionLabels],
    reviewWarnings: [...record.reviewWarnings],
  }
}

function normalizeRecentRecordLimit(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_RECENT_RECORD_LIMIT
  }
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("recentRecordLimit must be a positive safe integer")
  }
  return value
}

function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
