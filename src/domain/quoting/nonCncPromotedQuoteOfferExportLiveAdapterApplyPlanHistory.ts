import { compareLex } from "../shared/deterministic"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistoryStatus = "apply_ready" | "blocked" | "empty"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  applyReadyCount: number
  blockedCount: number
  committedOutcomeCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  warningCount: number
  applyReadyPlanIds: string[]
  blockedPlanIds: string[]
  committedExecutionFingerprints: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const applyReadyCount = snapshot.statusCounts.ready ?? 0
  const blockedCount = snapshot.statusCounts.blocked ?? 0
  const status = historyStatus(latestRecord)
  const summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.warningCount),
    applyReadyCount,
    applyReadyPlanIds: [...snapshot.applyReadyPlanIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedCount,
    blockedPlanIds: [...snapshot.blockedPlanIds],
    committedExecutionFingerprints: uniqueCommittedExecutionFingerprints(snapshot.records),
    committedOutcomeCount: snapshot.committedOutcomeCount,
    latestRecord,
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRecord),
    plannedCommandCount: snapshot.plannedCommandCount,
    recentRecords,
    severity: historySeverity(status),
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
  latestRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "ready" ? "apply_ready" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "apply_ready") {
    return "success"
  }
  return "neutral"
}

function historyTitle(status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistoryStatus): string {
  if (status === "blocked") {
    return "Live-adapter apply plan history blocked"
  }
  if (status === "apply_ready") {
    return "Live-adapter apply plan history ready"
  }
  return "No live-adapter apply plan history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistoryStatus,
  totalRecords: number,
  latestRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord | undefined,
): string {
  if (!latestRecord || status === "empty") {
    return "No non-CNC live-adapter apply plan records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC live-adapter apply plan is blocked after ${formatCount(totalRecords, "record")}; live customer-offer, file, release-review, export, and connector writes remain disabled.`
  }
  return `Latest non-CNC live-adapter apply plan has ${formatCount(latestRecord.plannedCommandCount, "planned command")} backed by committed outcome evidence for future adapter wiring.`
}

function actionItems(status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistoryStatus, warningCount: number): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist a reviewed live-adapter apply plan before enabling customer-offer export adapters.")
  } else if (status === "blocked") {
    items.push("Resolve apply-plan blockers before retrying live-adapter export wiring.")
  } else {
    items.push("Review persisted apply-plan commands before wiring active export state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanHistorySummary, "exportText">,
): string {
  const lines = [
    "Non-CNC live adapter apply plan history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Apply-ready records: ${summary.applyReadyCount}`,
    `Blocked records: ${summary.blockedCount}`,
    `Committed outcomes: ${summary.committedOutcomeCount}`,
    `Planned commands: ${summary.plannedCommandCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Warnings: ${summary.warningCount}`,
    `Apply-ready plans: ${summary.applyReadyPlanIds.join(", ") || "none"}`,
    `Blocked plans: ${summary.blockedPlanIds.join(", ") || "none"}`,
    `Committed executions: ${summary.committedExecutionFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest apply plan: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | ${summary.latestRecord.disposition} | ${summary.latestRecord.applyPlanId}`,
    )
  }
  lines.push("Recent apply plans:")
  if (summary.recentRecords.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentRecords) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | ${record.disposition} | planned ${record.plannedCommandCount} | blocked ${record.blockedCommandCount} | ${record.applyPlanId}`,
      )
    }
  }
  lines.push(
    "Boundary: apply plan history is deterministic review data only; live customer-offer, file, release-review, export, and connector writes stay disabled.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord {
  return {
    ...record,
    blockerLabels: [...record.blockerLabels],
    reviewWarnings: [...record.reviewWarnings],
  }
}

function uniqueCommittedExecutionFingerprints(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord[],
): string[] {
  const fingerprints = records
    .map((record) => record.latestCommittedExecutionFingerprint)
    .filter((fingerprint): fingerprint is string => Boolean(fingerprint))
  return [...new Set(fingerprints)].sort(compareLex)
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
