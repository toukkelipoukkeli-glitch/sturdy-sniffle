import type {
  NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistoryStatus =
  | "blocked"
  | "empty"
  | "needs_review"
  | "pending"
  | "prepared"
  | "succeeded"
  | "withheld"

export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySeverity =
  | "attention"
  | "neutral"
  | "ready"
  | "review"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRuns: number
  commandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  plannedCommandCount: number
  preparedCommandCount: number
  succeededCommandCount: number
  withheldCommandCount: number
  pendingActionCount: number
  warningCount: number
  planIds: string[]
  planFingerprints: string[]
  decisionFingerprints: string[]
  targetRfqIds: string[]
  latestExecutionFingerprints: string[]
  latestPackageIds: string[]
  latestPlanIds: string[]
  latestReleaseExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  latestRun?: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord
  recentRuns: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummaryOptions {
  recentRunLimit?: number
}

const DEFAULT_RECENT_RUN_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummary {
  const recentRunLimit = normalizeRecentRunLimit(options.recentRunLimit)
  const recentRuns = snapshot.records.slice(0, recentRunLimit).map((record) => ({ ...record }))
  const latestRun = snapshot.latestRun ? { ...snapshot.latestRun } : undefined
  const commandCounts = aggregateCommandCounts(snapshot.records)
  const status = historyStatus(latestRun)
  const summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.warningCount),
    blockedCommandCount: commandCounts.blockedCommandCount,
    commandCount: commandCounts.commandCount,
    decisionFingerprints: [...snapshot.decisionFingerprints],
    failedCommandCount: commandCounts.failedCommandCount,
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestPackageIds: [...snapshot.latestPackageIds],
    latestPlanIds: [...snapshot.latestPlanIds],
    latestReleaseExecutionFingerprints: [...snapshot.latestReleaseExecutionFingerprints],
    latestRun,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRun),
    pendingActionCount: snapshot.pendingActionCount,
    pendingCommandCount: commandCounts.pendingCommandCount,
    planFingerprints: [...snapshot.planFingerprints],
    planIds: [...snapshot.planIds],
    plannedCommandCount: commandCounts.plannedCommandCount,
    preparedCommandCount: commandCounts.preparedCommandCount,
    recentRuns,
    severity: historySeverity(status),
    status,
    succeededCommandCount: commandCounts.succeededCommandCount,
    targetRfqIds: [...snapshot.targetRfqIds],
    title: historyTitle(status),
    totalRuns: snapshot.recordCount,
    warningCount: snapshot.warningCount,
    withheldCommandCount: commandCounts.withheldCommandCount,
  }

  return {
    ...summary,
    exportText: buildExportText(summary),
  }
}

function aggregateCommandCounts(records: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord[]) {
  return records.reduce(
    (totals, record) => ({
      blockedCommandCount: totals.blockedCommandCount + record.blockedCommandCount,
      commandCount: totals.commandCount + record.commandCount,
      failedCommandCount: totals.failedCommandCount + record.failedCommandCount,
      pendingCommandCount: totals.pendingCommandCount + record.pendingCommandCount,
      plannedCommandCount: totals.plannedCommandCount + record.plannedCommandCount,
      preparedCommandCount: totals.preparedCommandCount + record.preparedCommandCount,
      succeededCommandCount: totals.succeededCommandCount + record.succeededCommandCount,
      withheldCommandCount: totals.withheldCommandCount + record.withheldCommandCount,
    }),
    {
      blockedCommandCount: 0,
      commandCount: 0,
      failedCommandCount: 0,
      pendingCommandCount: 0,
      plannedCommandCount: 0,
      preparedCommandCount: 0,
      succeededCommandCount: 0,
      withheldCommandCount: 0,
    },
  )
}

function historyStatus(
  latestRun: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistoryStatus {
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
    case "withheld":
      return "withheld"
    default:
      return assertNeverExecutionStatus(latestRun.status)
  }
}

function assertNeverExecutionStatus(status: never): never {
  throw new Error(`Unhandled non-CNC live-adapter execution status: ${String(status)}`)
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySeverity {
  if (status === "blocked" || status === "needs_review") {
    return "attention"
  }
  if (status === "pending" || status === "withheld") {
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

function historyTitle(status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistoryStatus): string {
  if (status === "blocked") {
    return "Live-adapter execution history blocked"
  }
  if (status === "needs_review") {
    return "Live-adapter execution history needs review"
  }
  if (status === "pending") {
    return "Live-adapter execution history pending outcomes"
  }
  if (status === "prepared") {
    return "Live-adapter dry-run prepared"
  }
  if (status === "succeeded") {
    return "Live-adapter execution history ready"
  }
  if (status === "withheld") {
    return "Live-adapter execution history withheld"
  }
  return "No live-adapter execution history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistoryStatus,
  totalRuns: number,
  latestRun: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord | undefined,
): string {
  if (!latestRun) {
    return "No non-CNC offer export live-adapter execution audits have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC live-adapter execution is blocked after ${formatCount(totalRuns, "run")}; live customer-offer, file, release-review, export, and connector writes remain disabled.`
  }
  if (status === "withheld") {
    return `Latest non-CNC live-adapter execution withheld ${formatCount(latestRun.withheldCommandCount, "command")} while review-only fallback remains authoritative.`
  }
  if (status === "needs_review") {
    return `Latest non-CNC live-adapter execution recorded ${latestRun.status} command outcomes; review before retrying or wiring active export state.`
  }
  if (status === "pending") {
    return `Latest non-CNC live-adapter execution is waiting for command outcomes across ${formatCount(latestRun.commandCount, "command")}.`
  }
  if (status === "prepared") {
    return `Latest non-CNC live-adapter dry-run prepared ${formatCount(latestRun.preparedCommandCount, "command")} for review before any provider side effects.`
  }
  return `Latest non-CNC live-adapter execution succeeded with ${formatCount(latestRun.succeededCommandCount, "command")} recorded for review-only export wiring.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist a live-adapter dry-run execution audit before enabling customer-offer export adapters.")
  } else if (status === "blocked") {
    items.push("Resolve live-adapter execution blockers before recording another execution.")
  } else if (status === "withheld") {
    items.push("Keep review-only local/mock fallback authoritative while live-adapter execution is withheld.")
  } else if (status === "needs_review") {
    items.push("Review failed or partial live-adapter command outcomes before retrying.")
  } else if (status === "pending") {
    items.push("Record pending live-adapter command outcomes before using release evidence.")
  } else if (status === "prepared") {
    items.push("Review prepared live-adapter commands before committing provider side effects.")
  } else {
    items.push("Review succeeded live-adapter evidence before wiring active export state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterExecutionHistorySummary, "exportText">,
): string {
  const lines = [
    "Non-CNC offer export live adapter execution history",
    `Status: ${summary.status}`,
    `Runs: ${summary.totalRuns}`,
    `Commands: ${summary.commandCount}`,
    `Planned commands: ${summary.plannedCommandCount}`,
    `Prepared commands: ${summary.preparedCommandCount}`,
    `Pending commands: ${summary.pendingCommandCount}`,
    `Succeeded commands: ${summary.succeededCommandCount}`,
    `Failed commands: ${summary.failedCommandCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Withheld commands: ${summary.withheldCommandCount}`,
    `Pending actions: ${summary.pendingActionCount}`,
    `Warnings: ${summary.warningCount}`,
    `Plans: ${summary.planIds.join(", ") || "none"}`,
    `Plan fingerprints: ${summary.planFingerprints.join(", ") || "none"}`,
    `Decision fingerprints: ${summary.decisionFingerprints.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Latest provider commits: ${summary.latestExecutionFingerprints.join(", ") || "none"}`,
    `Latest packages: ${summary.latestPackageIds.join(", ") || "none"}`,
    `Latest export plans: ${summary.latestPlanIds.join(", ") || "none"}`,
    `Release executions: ${summary.latestReleaseExecutionFingerprints.join(", ") || "none"}`,
    `Source executions: ${summary.latestSourceExecutionFingerprints.join(", ") || "none"}`,
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
        `- ${run.executedAt} | ${run.status} | ${run.mode} | commands ${run.commandCount} | ${run.executionFingerprint}`,
      )
    }
  }
  return lines.join("\n")
}

function normalizeRecentRunLimit(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_RECENT_RUN_LIMIT
  }
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("recentRunLimit must be a positive safe integer")
  }
  return value
}

function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
