import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistoryStatus =
  | "blocked"
  | "empty"
  | "ready"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  readyCount: number
  blockedCount: number
  commandCount: number
  pendingCommandCount: number
  blockedCommandCount: number
  reviewedOutcomeCount: number
  blockerCount: number
  warningCount: number
  readyBoundaryIds: string[]
  blockedBoundaryIds: string[]
  liveWriteBoundaryFingerprints: string[]
  adapterBoundaryIds: string[]
  adapterBoundaryFingerprints: string[]
  commitRecordIds: string[]
  committedExecutionFingerprints: string[]
  followThroughIds: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const readyCount = snapshot.statusCounts.review_ready ?? 0
  const blockedCount = snapshot.statusCounts.blocked ?? 0
  const status = historyStatus(latestRecord)
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary,
    "exportText"
  > = {
    actionItems: actionItems(status, snapshot.warningCount),
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    adapterBoundaryIds: [...snapshot.adapterBoundaryIds],
    blockedBoundaryIds: [...snapshot.blockedBoundaryIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedCount,
    blockerCount: snapshot.blockerCount,
    commandCount: snapshot.commandCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    followThroughIds: [...snapshot.followThroughIds],
    latestRecord,
    liveWriteBoundaryFingerprints: [...snapshot.liveWriteBoundaryFingerprints],
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRecord),
    pendingCommandCount: snapshot.pendingCommandCount,
    readinessRecordIds: [...snapshot.readinessRecordIds],
    readyBoundaryIds: [...snapshot.readyBoundaryIds],
    readyCount,
    recentRecords,
    reviewedOutcomeCount: snapshot.reviewedOutcomeCount,
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
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "review_ready" ? "ready" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "ready") {
    return "success"
  }
  return "neutral"
}

function historyTitle(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistoryStatus,
): string {
  if (status === "blocked") {
    return "Final-gate follow-through live-write boundary history blocked"
  }
  if (status === "ready") {
    return "Final-gate follow-through live-write boundary history ready"
  }
  return "No final-gate follow-through live-write boundary history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistoryStatus,
  totalRecords: number,
  latestRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord
    | undefined,
): string {
  if (!latestRecord) {
    return "No non-CNC final-gate follow-through live-write boundary records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC final-gate follow-through live-write boundary is blocked after ${formatCount(totalRecords, "record")}; customer-offer, file, release-review, export, connector, and final-gate follow-through writes remain disabled.`
  }
  return `Latest non-CNC final-gate follow-through live-write boundary has ${formatCount(latestRecord.pendingCommandCount, "pending write intent")} ready for review after operator approval; live writes remain disabled until an explicit provider adapter is enabled.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push(
      "Persist a reviewed final-gate follow-through live-write boundary before enabling any provider write adapter.",
    )
  } else if (status === "blocked") {
    items.push("Resolve final-gate follow-through live-write boundary blockers before retrying write-adapter preparation.")
  } else {
    items.push("Review pending final-gate follow-through write intents before wiring active provider writes.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryHistorySummary,
    "exportText"
  >,
): string {
  const lines = [
    "Non-CNC final-gate follow-through live-write boundary history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Ready boundaries: ${summary.readyCount}`,
    `Blocked boundaries: ${summary.blockedCount}`,
    `Commands: ${summary.commandCount}`,
    `Pending write intents: ${summary.pendingCommandCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Reviewed outcomes: ${summary.reviewedOutcomeCount}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Ready boundary IDs: ${summary.readyBoundaryIds.join(", ") || "none"}`,
    `Blocked boundary IDs: ${summary.blockedBoundaryIds.join(", ") || "none"}`,
    `Live-write boundary fingerprints: ${summary.liveWriteBoundaryFingerprints.join(", ") || "none"}`,
    `Adapter boundaries: ${summary.adapterBoundaryIds.join(", ") || "none"}`,
    `Adapter boundary fingerprints: ${summary.adapterBoundaryFingerprints.join(", ") || "none"}`,
    `Commit records: ${summary.commitRecordIds.join(", ") || "none"}`,
    `Committed executions: ${summary.committedExecutionFingerprints.join(", ") || "none"}`,
    `Follow-through IDs: ${summary.followThroughIds.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Readiness records: ${summary.readinessRecordIds.join(", ") || "none"}`,
    `Command idempotency keys: ${summary.commandIdempotencyKeys.join(", ") || "none"}`,
    `Evidence fingerprints: ${summary.evidenceFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest boundary: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | ${summary.latestRecord.disposition} | ${summary.latestRecord.liveWriteBoundaryId}`,
    )
  }
  lines.push("Recent final-gate live-write boundaries:")
  if (summary.recentRecords.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentRecords) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | ${record.disposition} | pending ${record.pendingCommandCount} | blocked ${record.blockedCommandCount} | ${record.liveWriteBoundaryId}`,
      )
    }
  }
  lines.push(
    "Boundary: final-gate follow-through live-write boundary history is deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled by default.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryRecord {
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
