import type {
  NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistoryStatus =
  | "blocked"
  | "committed"
  | "empty"

export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  outcomeCount: number
  blockedCount: number
  committedCount: number
  warningCount: number
  blockedPlanIds: string[]
  commitReadyPlanIds: string[]
  sourceExecutionFingerprints: string[]
  committedExecutionFingerprints: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const blockedCount = snapshot.statusCounts.blocked ?? 0
  const committedCount = snapshot.statusCounts.ready ?? 0
  const status = historyStatus(latestRecord)
  const summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.warningCount),
    blockedCount,
    blockedPlanIds: [...snapshot.blockedPlanIds],
    committedCount,
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitReadyPlanIds: [...snapshot.commitReadyPlanIds],
    latestRecord,
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRecord),
    outcomeCount: snapshot.outcomeCount,
    recentRecords,
    severity: historySeverity(status),
    sourceExecutionFingerprints: [...snapshot.sourceExecutionFingerprints],
    status,
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
  latestRecord: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "ready" ? "committed" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "committed") {
    return "success"
  }
  return "neutral"
}

function historyTitle(status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistoryStatus): string {
  if (status === "blocked") {
    return "Live-adapter outcome commit history blocked"
  }
  if (status === "committed") {
    return "Live-adapter outcome commit history ready"
  }
  return "No live-adapter outcome commit history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistoryStatus,
  totalRecords: number,
  latestRecord: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord | undefined,
): string {
  if (!latestRecord || status === "empty") {
    return "No non-CNC live-adapter outcome commit records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC live-adapter outcome commit is blocked after ${formatCount(totalRecords, "record")}; live customer-offer, file, release-review, export, and connector writes remain disabled.`
  }
  return `Latest non-CNC live-adapter outcome commit persisted ${formatCount(latestRecord.commandOutcomeCount, "outcome")} with committed execution evidence for review-only export wiring.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist a reviewed live-adapter outcome commit before enabling customer-offer export adapters.")
  } else if (status === "blocked") {
    items.push("Resolve outcome commit blockers before retrying live-adapter export wiring.")
  } else {
    items.push("Review committed live-adapter outcome evidence before wiring active export state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary, "exportText">,
): string {
  const lines = [
    "Non-CNC live adapter outcome commit history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Outcomes: ${summary.outcomeCount}`,
    `Committed records: ${summary.committedCount}`,
    `Blocked records: ${summary.blockedCount}`,
    `Warnings: ${summary.warningCount}`,
    `Ready plans: ${summary.commitReadyPlanIds.join(", ") || "none"}`,
    `Blocked plans: ${summary.blockedPlanIds.join(", ") || "none"}`,
    `Source executions: ${summary.sourceExecutionFingerprints.join(", ") || "none"}`,
    `Committed executions: ${summary.committedExecutionFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest commit: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | ${summary.latestRecord.disposition} | ${summary.latestRecord.commitRecordId}`,
    )
  }
  lines.push("Recent outcome commits:")
  if (summary.recentRecords.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentRecords) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | ${record.disposition} | outcomes ${record.commandOutcomeCount} | ${record.commitRecordId}`,
      )
    }
  }
  lines.push(
    "Boundary: outcome commit history is deterministic review data only; live customer-offer, file, release-review, export, and connector writes stay disabled.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord {
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
