import type {
  NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord,
} from "./nonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence"

export type NonCncPromotedQuoteOfferExportPackageProviderReadModelHistoryStatus =
  | "blocked"
  | "empty"
  | "mixed"
  | "ready_to_commit"

export type NonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySeverity =
  | "attention"
  | "neutral"
  | "ready"
  | "review"

export interface NonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary {
  status: NonCncPromotedQuoteOfferExportPackageProviderReadModelHistoryStatus
  severity: NonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  artifactOutcomeCount: number
  readyOutcomeCount: number
  blockedOutcomeCount: number
  blockerCount: number
  warningCount: number
  readModelFingerprints: string[]
  planIds: string[]
  planFingerprints: string[]
  artifactOutcomeKeys: string[]
  latestReadModel?: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord
  recentReadModels: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummaryOptions {
  recentReadModelLimit?: number
}

const DEFAULT_RECENT_READ_MODEL_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary {
  const recentReadModelLimit = normalizeRecentReadModelLimit(options.recentReadModelLimit)
  const recentReadModels = snapshot.records.slice(0, recentReadModelLimit).map(cloneRecord)
  const latestReadModel = snapshot.latestReadModel ? cloneRecord(snapshot.latestReadModel) : undefined
  const status = historyStatus(snapshot)
  const summary: Omit<NonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.blockerCount, snapshot.warningCount),
    artifactOutcomeCount: snapshot.artifactOutcomeCount,
    artifactOutcomeKeys: [...snapshot.artifactOutcomeKeys],
    blockedOutcomeCount: snapshot.blockedOutcomeCount,
    blockerCount: snapshot.blockerCount,
    latestReadModel,
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestReadModel),
    planFingerprints: [...snapshot.planFingerprints],
    planIds: [...snapshot.planIds],
    readModelFingerprints: [...snapshot.readModelFingerprints],
    readyOutcomeCount: snapshot.readyOutcomeCount,
    recentReadModels,
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
  snapshot: NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelHistoryStatus {
  if (!snapshot.latestReadModel) {
    return "empty"
  }
  const readyRecords = snapshot.statusCounts.ready_to_commit ?? 0
  const blockedRecords = snapshot.statusCounts.blocked ?? 0
  if (readyRecords > 0 && blockedRecords > 0) {
    return "mixed"
  }
  return snapshot.latestReadModel.status
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportPackageProviderReadModelHistoryStatus,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySeverity {
  if (status === "blocked") {
    return "attention"
  }
  if (status === "mixed") {
    return "review"
  }
  if (status === "ready_to_commit") {
    return "ready"
  }
  return "neutral"
}

function historyTitle(status: NonCncPromotedQuoteOfferExportPackageProviderReadModelHistoryStatus): string {
  if (status === "blocked") {
    return "Provider read-model history blocked"
  }
  if (status === "mixed") {
    return "Provider read-model history needs review"
  }
  if (status === "ready_to_commit") {
    return "Provider read-model history ready"
  }
  return "No provider read-model history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportPackageProviderReadModelHistoryStatus,
  totalRecords: number,
  latestReadModel: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord | undefined,
): string {
  if (!latestReadModel) {
    return "No non-CNC offer export package provider read-model snapshots have been recorded yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC offer export provider read model is blocked after ${formatCount(totalRecords, "snapshot")}; artifact outcomes remain withheld from commit inputs.`
  }
  if (status === "mixed") {
    return `Non-CNC offer export provider read-model history contains ready and blocked snapshots; review blockers before committing provider outcomes.`
  }
  return `Latest non-CNC offer export provider read model is ready with ${formatCount(latestReadModel.readyOutcomeCount, "artifact outcome")} available for guarded execution commit.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportPackageProviderReadModelHistoryStatus,
  blockerCount: number,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Record a local/mock provider read model before enabling live export adapters.")
  } else if (status === "blocked") {
    items.push("Resolve provider read-model blockers before committing artifact outcomes.")
  } else if (status === "mixed") {
    items.push("Compare the latest ready snapshot with blocked provider read models before applying export state.")
  } else {
    items.push("Review ready provider read-model evidence before wiring active export state.")
  }
  if (blockerCount > 0) {
    items.push(`Review ${formatCount(blockerCount, "blocker")} across provider read-model snapshots.`)
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<NonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary, "exportText">,
): string {
  const lines = [
    "Non-CNC offer export provider read-model history",
    `Status: ${summary.status}`,
    `Snapshots: ${summary.totalRecords}`,
    `Artifact outcomes: ${summary.artifactOutcomeCount}`,
    `Ready outcomes: ${summary.readyOutcomeCount}`,
    `Blocked outcomes: ${summary.blockedOutcomeCount}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Provider read models: ${summary.readModelFingerprints.join(", ") || "none"}`,
    `Export plans: ${summary.planIds.join(", ") || "none"}`,
    `Provider fingerprints: ${summary.planFingerprints.join(", ") || "none"}`,
    `Artifact keys: ${summary.artifactOutcomeKeys.join(", ") || "none"}`,
  ]
  if (summary.latestReadModel) {
    lines.push(
      `Latest snapshot: ${summary.latestReadModel.recordedAt} | ${summary.latestReadModel.status} | ${summary.latestReadModel.mode} | ${summary.latestReadModel.readModelFingerprint}`,
    )
  }
  lines.push("Recent snapshots:")
  if (summary.recentReadModels.length === 0) {
    lines.push("- none")
  } else {
    for (const record of summary.recentReadModels) {
      lines.push(
        `- ${record.recordedAt} | ${record.status} | ${record.providerStatus} | ready ${record.readyOutcomeCount} | blocked ${record.blockedOutcomeCount} | ${record.readModelFingerprint}`,
      )
    }
  }
  lines.push("Boundary: provider read-model history is deterministic review data only; live customer-offer, file, release-review, export, and connector writes stay disabled.")
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord {
  return {
    ...record,
    artifactOutcomeKeys: [...record.artifactOutcomeKeys],
  }
}

function normalizeRecentReadModelLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_RECENT_READ_MODEL_LIMIT
  }
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("recentReadModelLimit must be a positive safe integer")
  }
  return limit
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}
