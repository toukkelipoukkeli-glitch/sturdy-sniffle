import type {
  NonCncPromotedQuoteOfferExportPackageExecutionPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportPackageExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportPackageExecutionPersistence"

export type NonCncPromotedQuoteOfferExportPackageExecutionHistoryStatus =
  | "blocked"
  | "empty"
  | "needs_review"
  | "pending"
  | "prepared"
  | "succeeded"

export type NonCncPromotedQuoteOfferExportPackageExecutionHistorySeverity =
  | "attention"
  | "neutral"
  | "ready"
  | "review"
  | "success"

export interface NonCncPromotedQuoteOfferExportPackageExecutionHistorySummary {
  status: NonCncPromotedQuoteOfferExportPackageExecutionHistoryStatus
  severity: NonCncPromotedQuoteOfferExportPackageExecutionHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRuns: number
  artifactCount: number
  blockedArtifactCount: number
  failedArtifactCount: number
  pendingArtifactCount: number
  preparedArtifactCount: number
  succeededArtifactCount: number
  pendingActionCount: number
  warningCount: number
  planIds: string[]
  creationPlanIds: string[]
  packageIds: string[]
  selectedPlanIds: string[]
  targetRfqIds: string[]
  releaseExecutionFingerprints: string[]
  sourceExecutionFingerprints: string[]
  latestRun?: NonCncPromotedQuoteOfferExportPackageExecutionRecord
  recentRuns: NonCncPromotedQuoteOfferExportPackageExecutionRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummaryOptions {
  recentRunLimit?: number
}

const DEFAULT_RECENT_RUN_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportPackageExecutionPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportPackageExecutionHistorySummary {
  const recentRunLimit = normalizeRecentRunLimit(options.recentRunLimit)
  const recentRuns = snapshot.records.slice(0, recentRunLimit).map((record) => ({ ...record }))
  const latestRun = snapshot.latestRun ? { ...snapshot.latestRun } : undefined
  const artifactCounts = aggregateArtifactCounts(snapshot.records)
  const status = historyStatus(latestRun)
  const summary: Omit<NonCncPromotedQuoteOfferExportPackageExecutionHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.warningCount),
    artifactCount: artifactCounts.artifactCount,
    blockedArtifactCount: artifactCounts.blockedArtifactCount,
    creationPlanIds: [...snapshot.creationPlanIds],
    failedArtifactCount: artifactCounts.failedArtifactCount,
    latestRun,
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRun),
    packageIds: [...snapshot.packageIds],
    pendingActionCount: snapshot.pendingActionCount,
    pendingArtifactCount: artifactCounts.pendingArtifactCount,
    planIds: [...snapshot.planIds],
    preparedArtifactCount: artifactCounts.preparedArtifactCount,
    recentRuns,
    releaseExecutionFingerprints: [...snapshot.releaseExecutionFingerprints],
    selectedPlanIds: [...snapshot.selectedPlanIds],
    severity: historySeverity(status),
    sourceExecutionFingerprints: [...snapshot.sourceExecutionFingerprints],
    status,
    succeededArtifactCount: artifactCounts.succeededArtifactCount,
    targetRfqIds: [...snapshot.targetRfqIds],
    title: historyTitle(status),
    totalRuns: snapshot.recordCount,
    warningCount: snapshot.warningCount,
  }

  return {
    ...summary,
    exportText: buildExportText(summary),
  }
}

function aggregateArtifactCounts(records: NonCncPromotedQuoteOfferExportPackageExecutionRecord[]) {
  return records.reduce(
    (totals, record) => ({
      artifactCount: totals.artifactCount + record.artifactCount,
      blockedArtifactCount: totals.blockedArtifactCount + record.blockedArtifactCount,
      failedArtifactCount: totals.failedArtifactCount + record.failedArtifactCount,
      pendingArtifactCount: totals.pendingArtifactCount + record.pendingArtifactCount,
      preparedArtifactCount: totals.preparedArtifactCount + record.preparedArtifactCount,
      succeededArtifactCount: totals.succeededArtifactCount + record.succeededArtifactCount,
    }),
    {
      artifactCount: 0,
      blockedArtifactCount: 0,
      failedArtifactCount: 0,
      pendingArtifactCount: 0,
      preparedArtifactCount: 0,
      succeededArtifactCount: 0,
    },
  )
}

function historyStatus(
  latestRun: NonCncPromotedQuoteOfferExportPackageExecutionRecord | undefined,
): NonCncPromotedQuoteOfferExportPackageExecutionHistoryStatus {
  if (!latestRun) {
    return "empty"
  }
  switch (latestRun.status) {
    case "blocked":
      return "blocked"
    case "failed":
    case "partial":
      return "needs_review"
    case "pending":
      return "pending"
    case "prepared":
      return "prepared"
    case "succeeded":
      return "succeeded"
    default:
      return assertNeverExecutionStatus(latestRun.status)
  }
}

function assertNeverExecutionStatus(status: never): never {
  throw new Error(`Unhandled non-CNC offer export package execution status: ${String(status)}`)
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportPackageExecutionHistoryStatus,
): NonCncPromotedQuoteOfferExportPackageExecutionHistorySeverity {
  if (status === "blocked" || status === "needs_review") {
    return "attention"
  }
  if (status === "pending") {
    return "review"
  }
  if (status === "prepared") {
    return "ready"
  }
  if (status === "succeeded") {
    return "success"
  }
  return "neutral"
}

function historyTitle(status: NonCncPromotedQuoteOfferExportPackageExecutionHistoryStatus): string {
  if (status === "blocked") {
    return "Offer export package history blocked"
  }
  if (status === "needs_review") {
    return "Offer export package history needs review"
  }
  if (status === "pending") {
    return "Offer export package history pending outcomes"
  }
  if (status === "prepared") {
    return "Offer export package dry-run prepared"
  }
  if (status === "succeeded") {
    return "Offer export package history ready"
  }
  return "No offer export package history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportPackageExecutionHistoryStatus,
  totalRuns: number,
  latestRun: NonCncPromotedQuoteOfferExportPackageExecutionRecord | undefined,
): string {
  if (!latestRun) {
    return "No non-CNC offer export package execution audits have been recorded yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC offer export package execution is blocked after ${formatCount(totalRuns, "run")}; live customer-offer, file, release-review, and connector writes remain disabled.`
  }
  if (status === "needs_review") {
    return `Latest non-CNC offer export package execution recorded ${latestRun.status} artifact outcomes; review before retrying or wiring active export state.`
  }
  if (status === "pending") {
    return `Latest non-CNC offer export package execution is waiting for artifact outcomes across ${formatCount(latestRun.artifactCount, "artifact")}.`
  }
  if (status === "prepared") {
    return `Latest non-CNC offer export package dry-run prepared ${formatCount(latestRun.artifactCount, "artifact")} for review before any provider side effects.`
  }
  return `Latest non-CNC offer export package execution succeeded with ${formatCount(latestRun.succeededArtifactCount, "artifact")} recorded for review-only export wiring.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportPackageExecutionHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Run a dry-run non-CNC offer export package audit before enabling live export adapters.")
  } else if (status === "blocked") {
    items.push("Resolve non-CNC offer export package blockers before recording another execution.")
  } else if (status === "needs_review") {
    items.push("Review failed or partial non-CNC offer export package artifact outcomes before retrying.")
  } else if (status === "pending") {
    items.push("Wait for pending non-CNC offer export package artifact outcomes before using release evidence.")
  } else if (status === "prepared") {
    items.push("Review prepared non-CNC offer export package artifacts before committing provider side effects.")
  } else {
    items.push("Review succeeded non-CNC offer export package evidence before wiring active export state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<NonCncPromotedQuoteOfferExportPackageExecutionHistorySummary, "exportText">,
): string {
  const lines = [
    "Non-CNC offer export package execution history",
    `Status: ${summary.status}`,
    `Runs: ${summary.totalRuns}`,
    `Artifacts: ${summary.artifactCount}`,
    `Succeeded artifacts: ${summary.succeededArtifactCount}`,
    `Failed artifacts: ${summary.failedArtifactCount}`,
    `Pending artifacts: ${summary.pendingArtifactCount}`,
    `Prepared artifacts: ${summary.preparedArtifactCount}`,
    `Blocked artifacts: ${summary.blockedArtifactCount}`,
    `Pending actions: ${summary.pendingActionCount}`,
    `Warnings: ${summary.warningCount}`,
    `Export plans: ${summary.planIds.join(", ") || "none"}`,
    `Creation plans: ${summary.creationPlanIds.join(", ") || "none"}`,
    `Packages: ${summary.packageIds.join(", ") || "none"}`,
    `Selected plans: ${summary.selectedPlanIds.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Release executions: ${summary.releaseExecutionFingerprints.join(", ") || "none"}`,
    `Source executions: ${summary.sourceExecutionFingerprints.join(", ") || "none"}`,
  ]
  if (summary.latestRun) {
    lines.push(
      `Latest run: ${summary.latestRun.executedAt} | ${summary.latestRun.status} | ${summary.latestRun.mode} | ${summary.latestRun.executionFingerprint}`,
    )
  }
  lines.push("Recent runs:")
  if (summary.recentRuns.length === 0) {
    lines.push("- none")
  } else {
    for (const run of summary.recentRuns) {
      lines.push(
        `- ${run.executedAt} | ${run.status} | ${run.mode} | ${run.executionFingerprint} | ${run.planId} | artifacts ${run.artifactCount}`,
      )
    }
  }
  return lines.join("\n")
}

function normalizeRecentRunLimit(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_RECENT_RUN_LIMIT
  }
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("recentRunLimit must be a positive safe integer")
  }
  return value
}

function formatCount(value: number, label: string): string {
  return `${value} ${label}${value === 1 ? "" : "s"}`
}
