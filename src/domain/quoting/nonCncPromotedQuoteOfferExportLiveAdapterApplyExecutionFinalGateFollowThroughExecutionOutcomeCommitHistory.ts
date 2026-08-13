import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistoryStatus =
  | "blocked"
  | "committed"
  | "empty"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  commandOutcomeCount: number
  blockedCount: number
  committedCount: number
  blockerCount: number
  warningCount: number
  blockedCommitRecordIds: string[]
  commitReadyRecordIds: string[]
  committedExecutionFingerprints: string[]
  executionFingerprints: string[]
  followThroughIds: string[]
  followThroughFingerprints: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  latestExecutionFingerprints: string[]
  latestApplyPlanIds: string[]
  latestCommitRecordIds: string[]
  latestCommittedExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const blockedCount = snapshot.statusCounts.blocked ?? 0
  const committedCount = snapshot.statusCounts.ready ?? 0
  const status = historyStatus(latestRecord)
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary,
    "exportText"
  > = {
    actionItems: actionItems(status, snapshot.warningCount),
    blockedCommitRecordIds: [...snapshot.blockedCommitRecordIds],
    blockedCount,
    blockerCount: snapshot.blockerCount,
    commandOutcomeCount: snapshot.commandOutcomeCount,
    committedCount,
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitReadyRecordIds: [...snapshot.commitReadyRecordIds],
    executionFingerprints: [...snapshot.executionFingerprints],
    followThroughFingerprints: [...snapshot.followThroughFingerprints],
    followThroughIds: [...snapshot.followThroughIds],
    latestApplyPlanIds: [...snapshot.latestApplyPlanIds],
    latestCommitRecordIds: [...snapshot.latestCommitRecordIds],
    latestCommittedExecutionFingerprints: [...snapshot.latestCommittedExecutionFingerprints],
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestRecord,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRecord),
    readinessRecordIds: [...snapshot.readinessRecordIds],
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
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "ready" ? "committed" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "committed") {
    return "success"
  }
  return "neutral"
}

function historyTitle(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistoryStatus,
): string {
  if (status === "blocked") {
    return "Final-gate follow-through outcome commit history blocked"
  }
  if (status === "committed") {
    return "Final-gate follow-through outcome commit history ready"
  }
  return "No final-gate follow-through outcome commit history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistoryStatus,
  totalRecords: number,
  latestRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord
    | undefined,
): string {
  if (!latestRecord) {
    return "No non-CNC live-adapter final-gate follow-through outcome commit records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC live-adapter final-gate follow-through outcome commit is blocked after ${formatCount(totalRecords, "record")}; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes remain disabled.`
  }
  return `Latest non-CNC live-adapter final-gate follow-through outcome commit persisted ${formatCount(latestRecord.commandOutcomeCount, "reviewed outcome")} with committed execution evidence for review-only release follow-through.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push(
      "Persist a reviewed final-gate follow-through outcome commit before enabling customer-visible release follow-through adapters.",
    )
  } else if (status === "blocked") {
    items.push("Resolve final-gate follow-through outcome commit blockers before retrying release follow-through wiring.")
  } else {
    items.push("Review committed final-gate follow-through outcome evidence before wiring active release state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitHistorySummary,
    "exportText"
  >,
): string {
  const lines = [
    "Non-CNC live adapter final-gate follow-through outcome commit history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Reviewed outcomes: ${summary.commandOutcomeCount}`,
    `Committed records: ${summary.committedCount}`,
    `Blocked records: ${summary.blockedCount}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Commit-ready records: ${summary.commitReadyRecordIds.join(", ") || "none"}`,
    `Blocked commit records: ${summary.blockedCommitRecordIds.join(", ") || "none"}`,
    `Outcome draft executions: ${summary.executionFingerprints.join(", ") || "none"}`,
    `Committed executions: ${summary.committedExecutionFingerprints.join(", ") || "none"}`,
    `Follow-through IDs: ${summary.followThroughIds.join(", ") || "none"}`,
    `Follow-through fingerprints: ${summary.followThroughFingerprints.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Readiness records: ${summary.readinessRecordIds.join(", ") || "none"}`,
    `Apply executions: ${summary.latestExecutionFingerprints.join(", ") || "none"}`,
    `Apply plans: ${summary.latestApplyPlanIds.join(", ") || "none"}`,
    `Upstream commit records: ${summary.latestCommitRecordIds.join(", ") || "none"}`,
    `Upstream committed executions: ${summary.latestCommittedExecutionFingerprints.join(", ") || "none"}`,
    `Source executions: ${summary.latestSourceExecutionFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest commit: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | ${summary.latestRecord.disposition} | ${summary.latestRecord.commitRecordId}`,
    )
  }
  lines.push("Recent final-gate outcome commits:")
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
    "Boundary: final-gate follow-through outcome commit history is deterministic review data only; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord {
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
