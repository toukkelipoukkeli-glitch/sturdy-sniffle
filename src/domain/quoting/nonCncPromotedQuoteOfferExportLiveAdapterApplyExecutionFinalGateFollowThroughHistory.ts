import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistoryStatus =
  | "blocked"
  | "empty"
  | "follow_through_ready"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  followThroughReadyCount: number
  blockedCount: number
  appliedCommandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  blockerCount: number
  warningCount: number
  readyFollowThroughIds: string[]
  blockedFollowThroughIds: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  latestExecutionFingerprints: string[]
  latestApplyPlanIds: string[]
  latestCommitRecordIds: string[]
  latestCommittedExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const followThroughReadyCount = snapshot.statusCounts.ready ?? 0
  const blockedCount = snapshot.statusCounts.blocked ?? 0
  const status = historyStatus(latestRecord)
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary,
    "exportText"
  > = {
    actionItems: actionItems(status, snapshot.warningCount),
    appliedCommandCount: snapshot.appliedCommandCount,
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedCount,
    blockedFollowThroughIds: [...snapshot.blockedFollowThroughIds],
    blockerCount: snapshot.blockerCount,
    followThroughReadyCount,
    latestApplyPlanIds: [...snapshot.latestApplyPlanIds],
    latestCommitRecordIds: [...snapshot.latestCommitRecordIds],
    latestCommittedExecutionFingerprints: [...snapshot.latestCommittedExecutionFingerprints],
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestRecord,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRecord),
    plannedCommandCount: snapshot.plannedCommandCount,
    readinessRecordIds: [...snapshot.readinessRecordIds],
    readyFollowThroughIds: [...snapshot.readyFollowThroughIds],
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
  latestRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "ready" ? "follow_through_ready" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "follow_through_ready") {
    return "success"
  }
  return "neutral"
}

function historyTitle(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistoryStatus,
): string {
  if (status === "blocked") {
    return "Live-adapter final-gate follow-through history blocked"
  }
  if (status === "follow_through_ready") {
    return "Live-adapter final-gate follow-through history ready"
  }
  return "No live-adapter final-gate follow-through history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistoryStatus,
  totalRecords: number,
  latestRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord | undefined,
): string {
  if (!latestRecord) {
    return "No non-CNC live-adapter final-gate follow-through records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC live-adapter final-gate follow-through record is blocked after ${formatCount(totalRecords, "record")}; live customer-offer, file, release-review, export, and connector writes remain disabled.`
  }
  return `Latest non-CNC live-adapter final-gate follow-through record is ready with ${formatCount(latestRecord.appliedCommandCount, "applied command")} for review-only release follow-through.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist final-gate follow-through records before wiring release follow-through adapters.")
  } else if (status === "blocked") {
    items.push("Resolve final-gate follow-through blockers before enabling release follow-through adapters.")
  } else {
    items.push("Review persisted final-gate follow-through commands before wiring customer-visible release state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughHistorySummary,
    "exportText"
  >,
): string {
  const lines = [
    "Non-CNC live adapter final-gate follow-through history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Follow-through-ready records: ${summary.followThroughReadyCount}`,
    `Blocked records: ${summary.blockedCount}`,
    `Applied commands: ${summary.appliedCommandCount}`,
    `Planned commands: ${summary.plannedCommandCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Ready follow-through IDs: ${summary.readyFollowThroughIds.join(", ") || "none"}`,
    `Blocked follow-through IDs: ${summary.blockedFollowThroughIds.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Readiness records: ${summary.readinessRecordIds.join(", ") || "none"}`,
    `Execution fingerprints: ${summary.latestExecutionFingerprints.join(", ") || "none"}`,
    `Apply plans: ${summary.latestApplyPlanIds.join(", ") || "none"}`,
    `Commit records: ${summary.latestCommitRecordIds.join(", ") || "none"}`,
    `Committed executions: ${summary.latestCommittedExecutionFingerprints.join(", ") || "none"}`,
    `Source executions: ${summary.latestSourceExecutionFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest follow-through: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | ${summary.latestRecord.disposition} | ${summary.latestRecord.followThroughId}`,
    )
  }
  lines.push("Recent follow-through records:")
  if (summary.recentRecords.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentRecords) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | ${record.disposition} | applied ${record.appliedCommandCount} | blocked ${record.blockedCommandCount} | ${record.followThroughId}`,
      )
    }
  }
  lines.push(
    "Boundary: final-gate follow-through history is deterministic review data only; live customer-offer, file, release-review, export, and connector writes stay disabled.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughRecord {
  return {
    ...record,
    blockerLabels: [...record.blockerLabels],
    reviewWarnings: [...record.reviewWarnings],
  }
}

function normalizeRecentRecordLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_RECENT_RECORD_LIMIT
  }
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("recentRecordLimit must be a positive safe integer")
  }
  return limit
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}
