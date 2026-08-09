import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistoryStatus =
  | "blocked"
  | "empty"
  | "ready"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  readyCount: number
  blockedCount: number
  appliedCommandCount: number
  blockerCount: number
  warningCount: number
  targetRfqIds: string[]
  readyRecordIds: string[]
  blockedRecordIds: string[]
  latestExecutionFingerprints: string[]
  latestApplyPlanIds: string[]
  latestCommitRecordIds: string[]
  latestCommittedExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const readyCount = snapshot.statusCounts.ready ?? 0
  const blockedCount = snapshot.statusCounts.blocked ?? 0
  const status = historyStatus(latestRecord)
  const summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.warningCount),
    appliedCommandCount: snapshot.records.reduce((total, record) => total + record.appliedCommandCount, 0),
    blockedCount,
    blockedRecordIds: [...snapshot.blockedRecordIds],
    blockerCount: snapshot.blockerCount,
    latestApplyPlanIds: [...snapshot.latestApplyPlanIds],
    latestCommitRecordIds: [...snapshot.latestCommitRecordIds],
    latestCommittedExecutionFingerprints: [...snapshot.latestCommittedExecutionFingerprints],
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestRecord,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRecord),
    readyCount,
    readyRecordIds: [...snapshot.readyRecordIds],
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
  latestRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "ready" ? "ready" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "ready") {
    return "success"
  }
  return "neutral"
}

function historyTitle(status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistoryStatus): string {
  if (status === "blocked") {
    return "Live-adapter apply readiness history blocked"
  }
  if (status === "ready") {
    return "Live-adapter apply readiness history ready"
  }
  return "No live-adapter apply readiness history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistoryStatus,
  totalRecords: number,
  latestRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord | undefined,
): string {
  if (!latestRecord || status === "empty") {
    return "No non-CNC live-adapter apply execution readiness records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC live-adapter apply execution readiness is blocked after ${formatCount(totalRecords, "record")}; live customer-offer, file, release-review, export, and connector writes remain disabled.`
  }
  return `Latest non-CNC live-adapter apply execution readiness is final-gate ready with ${formatCount(latestRecord.appliedCommandCount, "applied command")} backed by committed apply execution evidence.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist apply-execution readiness before enabling customer-offer export adapters.")
  } else if (status === "blocked") {
    items.push("Resolve apply-execution readiness blockers before using final-gate evidence.")
  } else {
    items.push("Review persisted apply-execution readiness evidence before wiring active export state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary, "exportText">,
): string {
  const lines = [
    "Non-CNC live adapter apply execution readiness history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Ready records: ${summary.readyCount}`,
    `Blocked records: ${summary.blockedCount}`,
    `Applied commands: ${summary.appliedCommandCount}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Ready record IDs: ${summary.readyRecordIds.join(", ") || "none"}`,
    `Blocked record IDs: ${summary.blockedRecordIds.join(", ") || "none"}`,
    `Apply executions: ${summary.latestExecutionFingerprints.join(", ") || "none"}`,
    `Apply plans: ${summary.latestApplyPlanIds.join(", ") || "none"}`,
    `Commit records: ${summary.latestCommitRecordIds.join(", ") || "none"}`,
    `Committed executions: ${summary.latestCommittedExecutionFingerprints.join(", ") || "none"}`,
    `Source executions: ${summary.latestSourceExecutionFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest readiness: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | applied ${summary.latestRecord.appliedCommandCount} | ${summary.latestRecord.readinessRecordId}`,
    )
  }
  lines.push("Recent readiness records:")
  if (summary.recentRecords.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentRecords) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | applied ${record.appliedCommandCount} | blockers ${record.blockerCount} | ${record.readinessRecordId}`,
      )
    }
  }
  lines.push(
    "Boundary: apply-execution readiness history is deterministic review data only; live customer-offer, file, release-review, export, and connector writes stay disabled.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  return {
    ...record,
    blockerLabels: [...record.blockerLabels],
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
