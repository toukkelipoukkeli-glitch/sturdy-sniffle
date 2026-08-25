import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistoryStatus =
  | "blocked"
  | "committed"
  | "empty"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  blockedCount: number
  committedCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
  blockedCommitRecordIds: string[]
  commitReadyRecordIds: string[]
  providerAdapterExecutionFingerprints: string[]
  executionFingerprints: string[]
  providerAdapterBoundaryIds: string[]
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
  commandOutcomeKeys: string[]
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  externalIds: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const blockedCount = snapshot.statusCounts.blocked ?? 0
  const committedCount = snapshot.statusCounts.ready ?? 0
  const status = historyStatus(latestRecord)
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary,
    "exportText"
  > = {
    actionItems: actionItems(status, snapshot.warningCount),
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    adapterBoundaryIds: [...snapshot.adapterBoundaryIds],
    blockedCommitRecordIds: [...snapshot.blockedCommitRecordIds],
    blockedCount,
    blockerCount: snapshot.blockerCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    commandOutcomeCount: snapshot.commandOutcomeCount,
    commandOutcomeKeys: [...snapshot.commandOutcomeKeys],
    committedCount,
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitReadyRecordIds: [...snapshot.commitReadyRecordIds],
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    executionFingerprints: [...snapshot.executionFingerprints],
    externalIds: [...snapshot.externalIds],
    followThroughIds: [...snapshot.followThroughIds],
    latestRecord,
    liveWriteBoundaryFingerprints: [...snapshot.liveWriteBoundaryFingerprints],
    liveWriteBoundaryIds: [...snapshot.liveWriteBoundaryIds],
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRecord),
    pendingWriteIntentCount: snapshot.pendingWriteIntentCount,
    providerAdapterBoundaryFingerprints: [...snapshot.providerAdapterBoundaryFingerprints],
    providerAdapterBoundaryIds: [...snapshot.providerAdapterBoundaryIds],
    providerAdapterExecutionFingerprints: [...snapshot.providerAdapterExecutionFingerprints],
    providerReadModelRecordIds: [...snapshot.providerReadModelRecordIds],
    readinessRecordIds: [...snapshot.readinessRecordIds],
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
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "ready" ? "committed" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "committed") {
    return "success"
  }
  return "neutral"
}

function historyTitle(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistoryStatus,
): string {
  if (status === "blocked") {
    return "Final-gate provider-adapter execution outcome commit history blocked"
  }
  if (status === "committed") {
    return "Final-gate provider-adapter execution outcome commit history ready"
  }
  return "No final-gate provider-adapter execution outcome commit history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistoryStatus,
  totalRecords: number,
  latestRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord
    | undefined,
): string {
  if (!latestRecord) {
    return "No non-CNC final-gate provider-adapter execution outcome commit records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC final-gate provider-adapter execution outcome commit is blocked after ${formatCount(totalRecords, "record")}; provider outcome evidence remains withheld and live writes remain disabled.`
  }
  return `Latest non-CNC final-gate provider-adapter execution outcome commit persisted ${formatCount(latestRecord.reviewedOutcomeCount, "reviewed provider outcome")} with provider-adapter commit execution evidence for review-only follow-through.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push(
      "Persist a reviewed final-gate provider-adapter execution outcome commit before enabling provider-backed follow-through adapters.",
    )
  } else if (status === "blocked") {
    items.push("Resolve final-gate provider-adapter execution outcome commit blockers before retrying provider follow-through wiring.")
  } else {
    items.push(
      "Review committed provider-adapter execution outcome evidence before wiring live customer-offer, file, release-review, export, connector, or follow-through writes.",
    )
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible provider release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitHistorySummary,
    "exportText"
  >,
): string {
  const lines = [
    "Non-CNC final-gate provider-adapter execution outcome commit history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Committed records: ${summary.committedCount}`,
    `Blocked records: ${summary.blockedCount}`,
    `Pending write intents: ${summary.pendingWriteIntentCount}`,
    `Reviewed outcomes: ${summary.reviewedOutcomeCount}`,
    `Command outcomes: ${summary.commandOutcomeCount}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Commit-ready records: ${summary.commitReadyRecordIds.join(", ") || "none"}`,
    `Blocked commit records: ${summary.blockedCommitRecordIds.join(", ") || "none"}`,
    `Outcome draft executions: ${summary.executionFingerprints.join(", ") || "none"}`,
    `Provider-adapter commit executions: ${summary.providerAdapterExecutionFingerprints.join(", ") || "none"}`,
    `Provider-adapter boundaries: ${summary.providerAdapterBoundaryIds.join(", ") || "none"}`,
    `Provider-adapter fingerprints: ${summary.providerAdapterBoundaryFingerprints.join(", ") || "none"}`,
    `Provider read models: ${summary.providerReadModelRecordIds.join(", ") || "none"}`,
    `Live-write boundaries: ${summary.liveWriteBoundaryIds.join(", ") || "none"}`,
    `Live-write boundary fingerprints: ${summary.liveWriteBoundaryFingerprints.join(", ") || "none"}`,
    `Adapter boundaries: ${summary.adapterBoundaryIds.join(", ") || "none"}`,
    `Adapter boundary fingerprints: ${summary.adapterBoundaryFingerprints.join(", ") || "none"}`,
    `Upstream commit records: ${summary.commitRecordIds.join(", ") || "none"}`,
    `Upstream committed executions: ${summary.committedExecutionFingerprints.join(", ") || "none"}`,
    `Follow-through IDs: ${summary.followThroughIds.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Readiness records: ${summary.readinessRecordIds.join(", ") || "none"}`,
    `Command outcome keys: ${summary.commandOutcomeKeys.join(", ") || "none"}`,
    `Command idempotency keys: ${summary.commandIdempotencyKeys.join(", ") || "none"}`,
    `Evidence fingerprints: ${summary.evidenceFingerprints.join(", ") || "none"}`,
    `External IDs: ${summary.externalIds.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest provider-adapter outcome commit: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | ${summary.latestRecord.disposition} | ${summary.latestRecord.providerAdapterExecutionOutcomeCommitRecordId}`,
    )
  }
  lines.push("Recent provider-adapter outcome commits:")
  if (summary.recentRecords.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentRecords) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | ${record.disposition} | outcomes ${record.commandOutcomeCount} | ${record.providerAdapterExecutionOutcomeCommitRecordId}`,
      )
    }
  }
  lines.push(
    "Boundary: final-gate provider-adapter execution outcome commit history is deterministic review data only; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled by default.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord {
  return {
    ...record,
    blockerLabels: [...record.blockerLabels],
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    commandOutcomeKeys: [...record.commandOutcomeKeys],
    commandOutcomeStatuses: [...record.commandOutcomeStatuses],
    evidenceFingerprints: [...record.evidenceFingerprints],
    externalIds: [...record.externalIds],
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
