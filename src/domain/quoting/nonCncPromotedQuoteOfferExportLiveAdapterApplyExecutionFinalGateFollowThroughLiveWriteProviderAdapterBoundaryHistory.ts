import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistoryStatus =
  | "blocked"
  | "empty"
  | "ready"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  readyCount: number
  blockedCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  blockerCount: number
  warningCount: number
  readyBoundaryIds: string[]
  blockedBoundaryIds: string[]
  providerAdapterBoundaryFingerprints: string[]
  providerReadModelRecordIds: string[]
  liveWriteBoundaryIds: string[]
  liveWriteBoundaryFingerprints: string[]
  adapterBoundaryIds: string[]
  adapterBoundaryFingerprints: string[]
  commitRecordIds: string[]
  committedExecutionFingerprints: string[]
  followThroughIds: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  commandIdempotencyKeys: string[]
  sourceCommandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const status = historyStatus(latestRecord)
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
    "exportText"
  > = {
    actionItems: actionItems(status, snapshot.warningCount),
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    adapterBoundaryIds: [...snapshot.adapterBoundaryIds],
    blockedBoundaryIds: [...snapshot.blockedBoundaryIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedCount: snapshot.statusCounts.blocked ?? 0,
    blockerCount: snapshot.blockerCount,
    commandCount: snapshot.commandCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    followThroughIds: [...snapshot.followThroughIds],
    latestRecord,
    liveWriteBoundaryFingerprints: [...snapshot.liveWriteBoundaryFingerprints],
    liveWriteBoundaryIds: [...snapshot.liveWriteBoundaryIds],
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRecord),
    pendingWriteIntentCount: snapshot.pendingWriteIntentCount,
    plannedCommandCount: snapshot.plannedCommandCount,
    providerAdapterBoundaryFingerprints: [...snapshot.providerAdapterBoundaryFingerprints],
    providerReadModelRecordIds: [...snapshot.providerReadModelRecordIds],
    readinessRecordIds: [...snapshot.readinessRecordIds],
    readyBoundaryIds: [...snapshot.readyBoundaryIds],
    readyCount: snapshot.statusCounts.ready ?? 0,
    recentRecords,
    reviewedOutcomeCount: snapshot.reviewedOutcomeCount,
    severity: historySeverity(status),
    sourceCommandIdempotencyKeys: [...snapshot.sourceCommandIdempotencyKeys],
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
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "ready" ? "ready" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "ready") {
    return "success"
  }
  return "neutral"
}

function historyTitle(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistoryStatus,
): string {
  if (status === "blocked") {
    return "Final-gate follow-through provider-adapter history blocked"
  }
  if (status === "ready") {
    return "Final-gate follow-through provider-adapter history ready"
  }
  return "No final-gate follow-through provider-adapter history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistoryStatus,
  totalRecords: number,
  latestRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord
    | undefined,
): string {
  if (!latestRecord) {
    return "No non-CNC final-gate follow-through provider-adapter boundary records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC final-gate follow-through provider-adapter boundary is blocked after ${formatCount(totalRecords, "record")}; provider command evidence remains withheld and live writes remain disabled.`
  }
  return `Latest non-CNC final-gate follow-through provider-adapter boundary has ${formatCount(latestRecord.plannedCommandCount, "review-only provider command")} ready for provider-adapter review; live writes remain disabled until an explicit provider adapter is enabled.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist final-gate follow-through provider-adapter boundary records before surfacing provider-adapter readiness.")
  } else if (status === "blocked") {
    items.push("Resolve provider-adapter boundary blockers before retrying final-gate follow-through provider preparation.")
  } else {
    items.push("Review persisted provider-preparation command descriptors before enabling live provider-adapter writes.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible provider follow-through.`)
  }
  return items
}

function buildExportText(
  summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
    "exportText"
  >,
): string {
  const lines = [
    "Non-CNC final-gate follow-through provider-adapter boundary history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Ready boundaries: ${summary.readyCount}`,
    `Blocked boundaries: ${summary.blockedCount}`,
    `Commands: ${summary.commandCount}`,
    `Planned commands: ${summary.plannedCommandCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Pending write intents: ${summary.pendingWriteIntentCount}`,
    `Reviewed outcomes: ${summary.reviewedOutcomeCount}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Ready boundary IDs: ${summary.readyBoundaryIds.join(", ") || "none"}`,
    `Blocked boundary IDs: ${summary.blockedBoundaryIds.join(", ") || "none"}`,
    `Provider-adapter fingerprints: ${summary.providerAdapterBoundaryFingerprints.join(", ") || "none"}`,
    `Provider read models: ${summary.providerReadModelRecordIds.join(", ") || "none"}`,
    `Live-write boundaries: ${summary.liveWriteBoundaryIds.join(", ") || "none"}`,
    `Live-write boundary fingerprints: ${summary.liveWriteBoundaryFingerprints.join(", ") || "none"}`,
    `Adapter boundaries: ${summary.adapterBoundaryIds.join(", ") || "none"}`,
    `Adapter boundary fingerprints: ${summary.adapterBoundaryFingerprints.join(", ") || "none"}`,
    `Commit records: ${summary.commitRecordIds.join(", ") || "none"}`,
    `Committed executions: ${summary.committedExecutionFingerprints.join(", ") || "none"}`,
    `Follow-through IDs: ${summary.followThroughIds.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Readiness records: ${summary.readinessRecordIds.join(", ") || "none"}`,
    `Command idempotency keys: ${summary.commandIdempotencyKeys.join(", ") || "none"}`,
    `Source command idempotency keys: ${summary.sourceCommandIdempotencyKeys.join(", ") || "none"}`,
    `Evidence fingerprints: ${summary.evidenceFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest provider-adapter boundary: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | ${summary.latestRecord.disposition} | ${summary.latestRecord.providerAdapterBoundaryId}`,
    )
  }
  lines.push("Recent final-gate provider-adapter boundaries:")
  if (summary.recentRecords.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentRecords) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | ${record.disposition} | planned ${record.plannedCommandCount} | blocked ${record.blockedCommandCount} | ${record.providerAdapterBoundaryId}`,
      )
    }
  }
  lines.push(
    "Boundary: final-gate follow-through provider-adapter boundary history is deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled by default.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  return {
    ...record,
    blockerLabels: [...record.blockerLabels],
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    commandStatuses: [...record.commandStatuses],
    evidenceFingerprints: [...record.evidenceFingerprints],
    nextActionLabels: [...record.nextActionLabels],
    reviewWarnings: [...record.reviewWarnings],
    sourceCommandIdempotencyKeys: [...record.sourceCommandIdempotencyKeys],
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
