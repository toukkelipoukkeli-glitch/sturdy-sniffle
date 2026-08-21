import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistoryStatus =
  | "blocked"
  | "empty"
  | "ready_to_prepare"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySeverity =
  | "attention"
  | "neutral"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  providerReadyCount: number
  blockedCount: number
  commandCount: number
  pendingWriteIntentCount: number
  blockedCommandCount: number
  reviewedOutcomeCount: number
  blockerCount: number
  warningCount: number
  providerReadyRecordIds: string[]
  blockedRecordIds: string[]
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
  evidenceFingerprints: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord
  recentRecords: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummaryOptions {
  recentRecordLimit?: number
}

const DEFAULT_RECENT_RECORD_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary {
  const recentRecordLimit = normalizeRecentRecordLimit(options.recentRecordLimit)
  const latestRecord = snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined
  const recentRecords = snapshot.records.slice(0, recentRecordLimit).map(cloneRecord)
  const status = historyStatus(latestRecord)
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary,
    "exportText"
  > = {
    actionItems: actionItems(status, snapshot.warningCount),
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    adapterBoundaryIds: [...snapshot.adapterBoundaryIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedCount: snapshot.statusCounts.blocked ?? 0,
    blockedRecordIds: [...snapshot.blockedRecordIds],
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
    providerReadyCount: snapshot.statusCounts.ready_to_prepare ?? 0,
    providerReadyRecordIds: [...snapshot.providerReadyRecordIds],
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
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistoryStatus {
  if (!latestRecord) {
    return "empty"
  }
  return latestRecord.status === "ready_to_prepare" ? "ready_to_prepare" : "blocked"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "ready_to_prepare") {
    return "success"
  }
  return "neutral"
}

function historyTitle(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistoryStatus,
): string {
  if (status === "blocked") {
    return "Final-gate follow-through provider read-model history blocked"
  }
  if (status === "ready_to_prepare") {
    return "Final-gate follow-through provider read-model history ready"
  }
  return "No final-gate follow-through provider read-model history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistoryStatus,
  totalRecords: number,
  latestRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord
    | undefined,
): string {
  if (!latestRecord) {
    return "No non-CNC final-gate follow-through live-write provider read-model records have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC final-gate follow-through live-write provider read model is blocked after ${formatCount(totalRecords, "record")}; provider-preparation evidence remains withheld and live writes remain disabled.`
  }
  return `Latest non-CNC final-gate follow-through live-write provider read model has ${formatCount(latestRecord.pendingWriteIntentCount, "pending write intent")} ready for provider-preparation review; live writes remain disabled until an explicit provider adapter is enabled.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push(
      "Persist a final-gate follow-through live-write provider read model before enabling any provider-preparation adapter.",
    )
  } else if (status === "blocked") {
    items.push("Resolve provider read-model blockers before retrying final-gate follow-through provider preparation.")
  } else {
    items.push("Review provider-preparation evidence before wiring active final-gate follow-through provider writes.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary,
    "exportText"
  >,
): string {
  const lines = [
    "Non-CNC final-gate follow-through live-write provider read-model history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Provider-ready records: ${summary.providerReadyCount}`,
    `Blocked records: ${summary.blockedCount}`,
    `Commands: ${summary.commandCount}`,
    `Pending write intents: ${summary.pendingWriteIntentCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Reviewed outcomes: ${summary.reviewedOutcomeCount}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Provider-ready record IDs: ${summary.providerReadyRecordIds.join(", ") || "none"}`,
    `Blocked record IDs: ${summary.blockedRecordIds.join(", ") || "none"}`,
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
    `Evidence fingerprints: ${summary.evidenceFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRecord) {
    lines.push(
      `Latest provider read model: ${summary.latestRecord.recordedAt} | ${summary.latestRecord.status} | ${summary.latestRecord.disposition} | ${summary.latestRecord.providerReadModelRecordId}`,
    )
  }
  lines.push("Recent final-gate provider read models:")
  if (summary.recentRecords.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentRecords) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | ${record.disposition} | pending ${record.pendingWriteIntentCount} | blocked ${record.blockedCommandCount} | ${record.providerReadModelRecordId}`,
      )
    }
  }
  lines.push(
    "Boundary: final-gate follow-through provider read-model history is deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled by default.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord {
  return {
    ...record,
    blockerLabels: [...record.blockerLabels],
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    evidenceFingerprints: [...record.evidenceFingerprints],
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
