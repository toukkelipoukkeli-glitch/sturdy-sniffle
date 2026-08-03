import type {
  NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportPackageProviderCommitRecord,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitPersistence"

export type NonCncPromotedQuoteOfferExportPackageProviderCommitHistoryStatus = "committed" | "empty"

export type NonCncPromotedQuoteOfferExportPackageProviderCommitHistorySeverity = "neutral" | "success"

export interface NonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary {
  status: NonCncPromotedQuoteOfferExportPackageProviderCommitHistoryStatus
  severity: NonCncPromotedQuoteOfferExportPackageProviderCommitHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRuns: number
  artifactOutcomeCount: number
  warningCount: number
  executionFingerprints: string[]
  planIds: string[]
  planFingerprints: string[]
  packageIds: string[]
  targetRfqIds: string[]
  releaseExecutionFingerprints: string[]
  sourceExecutionFingerprints: string[]
  latestRun?: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord
  recentRuns: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummaryOptions {
  recentRunLimit?: number
}

const DEFAULT_RECENT_RUN_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary {
  const recentRunLimit = normalizeRecentRunLimit(options.recentRunLimit)
  const recentRuns = snapshot.records.slice(0, recentRunLimit).map(cloneRecord)
  const latestRecord = snapshot.latestRun ?? snapshot.records[0]
  const latestRun = latestRecord ? cloneRecord(latestRecord) : undefined
  const status = latestRun ? "committed" : "empty"
  const summary: Omit<NonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.warningCount),
    artifactOutcomeCount: snapshot.artifactOutcomeCount,
    executionFingerprints: [...snapshot.executionFingerprints],
    latestRun,
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRun),
    packageIds: [...snapshot.packageIds],
    planFingerprints: [...snapshot.planFingerprints],
    planIds: [...snapshot.planIds],
    recentRuns,
    releaseExecutionFingerprints: [...snapshot.releaseExecutionFingerprints],
    severity: status === "committed" ? "success" : "neutral",
    sourceExecutionFingerprints: [...snapshot.sourceExecutionFingerprints],
    status,
    targetRfqIds: [...snapshot.targetRfqIds],
    title: status === "committed" ? "Provider commit history ready" : "No provider commit history",
    totalRuns: snapshot.recordCount,
    warningCount: snapshot.warningCount,
  }

  return {
    ...summary,
    exportText: buildExportText(summary),
  }
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportPackageProviderCommitHistoryStatus,
  totalRuns: number,
  latestRun: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord | undefined,
): string {
  if (!latestRun || status === "empty") {
    return "No non-CNC offer export provider commit runs have been recorded yet."
  }
  return `Latest non-CNC offer export provider commit recorded ${formatCount(latestRun.artifactOutcomeCount, "artifact outcome")} across ${formatCount(totalRuns, "run")} for review-only export wiring.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportPackageProviderCommitHistoryStatus,
  warningCount: number,
): string[] {
  const items =
    status === "empty"
      ? ["Persist a ready provider commit run before wiring live customer-offer export adapters."]
      : ["Review committed provider evidence before enabling active export state."]
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<NonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary, "exportText">,
): string {
  const lines = [
    "Non-CNC offer export provider commit history",
    `Status: ${summary.status}`,
    `Runs: ${summary.totalRuns}`,
    `Artifact outcomes: ${summary.artifactOutcomeCount}`,
    `Warnings: ${summary.warningCount}`,
    `Execution fingerprints: ${summary.executionFingerprints.join(", ") || "none"}`,
    `Export plans: ${summary.planIds.join(", ") || "none"}`,
    `Provider plan fingerprints: ${summary.planFingerprints.join(", ") || "none"}`,
    `Packages: ${summary.packageIds.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Release executions: ${summary.releaseExecutionFingerprints.join(", ") || "none"}`,
    `Source executions: ${summary.sourceExecutionFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRun) {
    lines.push(
      `Latest commit: ${summary.latestRun.executedAt} | ${summary.latestRun.executionStatus} | ${summary.latestRun.providerStatus} | ${summary.latestRun.readModelStatus} | ${summary.latestRun.executionFingerprint}`,
    )
  }
  lines.push("Recent commits:")
  if (summary.recentRuns.length === 0) {
    lines.push("- none")
  } else {
    for (const run of summary.recentRuns) {
      lines.push(
        `- ${run.executedAt} | ${run.executionStatus} | ${run.providerStatus} | outcomes ${run.artifactOutcomeCount} | ${run.executionFingerprint}`,
      )
    }
  }
  lines.push(
    "Boundary: provider commit history is deterministic review data only; live customer-offer, file, release-review, export, and connector writes stay disabled.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord,
): NonCncPromotedQuoteOfferExportPackageProviderCommitRecord {
  return { ...record }
}

function normalizeRecentRunLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_RECENT_RUN_LIMIT
  }
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("recentRunLimit must be a positive safe integer")
  }
  return limit
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}
