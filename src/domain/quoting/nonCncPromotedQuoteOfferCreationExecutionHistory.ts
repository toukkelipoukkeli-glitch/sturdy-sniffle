import type {
  NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot,
  NonCncPromotedQuoteOfferCreationExecutionRecord,
} from "./nonCncPromotedQuoteOfferCreationExecutionPersistence"

export type NonCncPromotedQuoteOfferCreationExecutionHistoryStatus =
  | "blocked"
  | "empty"
  | "needs_review"
  | "pending"
  | "prepared"
  | "succeeded"

export type NonCncPromotedQuoteOfferCreationExecutionHistorySeverity = "attention" | "neutral" | "ready" | "review" | "success"

export interface NonCncPromotedQuoteOfferCreationExecutionHistorySummary {
  status: NonCncPromotedQuoteOfferCreationExecutionHistoryStatus
  severity: NonCncPromotedQuoteOfferCreationExecutionHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRuns: number
  commandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  succeededCommandCount: number
  pendingActionCount: number
  warningCount: number
  creationPlanIds: string[]
  packageIds: string[]
  selectedPlanIds: string[]
  targetRfqIds: string[]
  releaseExecutionFingerprints: string[]
  latestRun?: NonCncPromotedQuoteOfferCreationExecutionRecord
  recentRuns: NonCncPromotedQuoteOfferCreationExecutionRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferCreationExecutionHistorySummaryOptions {
  recentRunLimit?: number
}

const DEFAULT_RECENT_RUN_LIMIT = 5

export function buildNonCncPromotedQuoteOfferCreationExecutionHistorySummary(
  snapshot: NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferCreationExecutionHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferCreationExecutionHistorySummary {
  const recentRunLimit = normalizeRecentRunLimit(options.recentRunLimit)
  const recentRuns = snapshot.records.slice(0, recentRunLimit).map((record) => ({ ...record }))
  const latestRun = snapshot.latestRun ? { ...snapshot.latestRun } : undefined
  const commandCounts = aggregateCommandCounts(snapshot.records)
  const status = historyStatus(latestRun)
  const summary: Omit<NonCncPromotedQuoteOfferCreationExecutionHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.warningCount),
    blockedCommandCount: commandCounts.blockedCommandCount,
    commandCount: commandCounts.commandCount,
    creationPlanIds: [...snapshot.creationPlanIds],
    failedCommandCount: commandCounts.failedCommandCount,
    latestRun,
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRun),
    packageIds: [...snapshot.packageIds],
    pendingActionCount: snapshot.pendingActionCount,
    pendingCommandCount: commandCounts.pendingCommandCount,
    preparedCommandCount: commandCounts.preparedCommandCount,
    recentRuns,
    releaseExecutionFingerprints: [...snapshot.releaseExecutionFingerprints],
    selectedPlanIds: [...snapshot.selectedPlanIds],
    severity: historySeverity(status),
    status,
    succeededCommandCount: commandCounts.succeededCommandCount,
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

function aggregateCommandCounts(records: NonCncPromotedQuoteOfferCreationExecutionRecord[]) {
  return records.reduce(
    (totals, record) => ({
      blockedCommandCount: totals.blockedCommandCount + record.blockedCommandCount,
      commandCount: totals.commandCount + record.commandCount,
      failedCommandCount: totals.failedCommandCount + record.failedCommandCount,
      pendingCommandCount: totals.pendingCommandCount + record.pendingCommandCount,
      preparedCommandCount: totals.preparedCommandCount + record.preparedCommandCount,
      succeededCommandCount: totals.succeededCommandCount + record.succeededCommandCount,
    }),
    {
      blockedCommandCount: 0,
      commandCount: 0,
      failedCommandCount: 0,
      pendingCommandCount: 0,
      preparedCommandCount: 0,
      succeededCommandCount: 0,
    },
  )
}

function historyStatus(
  latestRun: NonCncPromotedQuoteOfferCreationExecutionRecord | undefined,
): NonCncPromotedQuoteOfferCreationExecutionHistoryStatus {
  if (!latestRun) {
    return "empty"
  }
  if (latestRun.status === "blocked") {
    return "blocked"
  }
  if (latestRun.status === "failed" || latestRun.status === "partial") {
    return "needs_review"
  }
  if (latestRun.status === "pending") {
    return "pending"
  }
  if (latestRun.status === "prepared") {
    return "prepared"
  }
  return "succeeded"
}

function historySeverity(
  status: NonCncPromotedQuoteOfferCreationExecutionHistoryStatus,
): NonCncPromotedQuoteOfferCreationExecutionHistorySeverity {
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

function historyTitle(status: NonCncPromotedQuoteOfferCreationExecutionHistoryStatus): string {
  if (status === "blocked") {
    return "Offer creation history blocked"
  }
  if (status === "needs_review") {
    return "Offer creation history needs review"
  }
  if (status === "pending") {
    return "Offer creation history pending outcomes"
  }
  if (status === "prepared") {
    return "Offer creation dry-run prepared"
  }
  if (status === "succeeded") {
    return "Offer creation history ready"
  }
  return "No offer creation history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferCreationExecutionHistoryStatus,
  totalRuns: number,
  latestRun: NonCncPromotedQuoteOfferCreationExecutionRecord | undefined,
): string {
  if (!latestRun) {
    return "No customer-offer creation execution audits have been recorded yet."
  }
  if (status === "blocked") {
    return `Latest customer-offer creation execution is blocked after ${formatCount(totalRuns, "run")}; live offer/export/release writes remain disabled.`
  }
  if (status === "needs_review") {
    return `Latest customer-offer creation execution recorded ${latestRun.status} command outcomes; review before retrying or wiring active offer state.`
  }
  if (status === "pending") {
    return `Latest customer-offer creation execution is waiting for command outcomes across ${formatCount(latestRun.commandCount, "command")}.`
  }
  if (status === "prepared") {
    return `Latest customer-offer creation dry-run prepared ${formatCount(latestRun.commandCount, "command")} for review before any provider side effects.`
  }
  return `Latest customer-offer creation execution succeeded with ${formatCount(latestRun.succeededCommandCount, "command")} recorded for review-only offer wiring.`
}

function actionItems(status: NonCncPromotedQuoteOfferCreationExecutionHistoryStatus, warningCount: number): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Run a dry-run customer-offer creation audit before enabling live offer adapters.")
  } else if (status === "blocked") {
    items.push("Resolve customer-offer creation blockers before recording another execution.")
  } else if (status === "needs_review") {
    items.push("Review failed or partial customer-offer creation command outcomes before retrying.")
  } else if (status === "pending") {
    items.push("Wait for pending customer-offer creation command outcomes before using release evidence.")
  } else if (status === "prepared") {
    items.push("Review prepared customer-offer creation commands before committing provider side effects.")
  } else {
    items.push("Review succeeded customer-offer creation evidence before wiring active offer state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(summary: Omit<NonCncPromotedQuoteOfferCreationExecutionHistorySummary, "exportText">): string {
  const lines = [
    "Non-CNC offer creation execution history",
    `Status: ${summary.status}`,
    `Runs: ${summary.totalRuns}`,
    `Commands: ${summary.commandCount}`,
    `Succeeded commands: ${summary.succeededCommandCount}`,
    `Failed commands: ${summary.failedCommandCount}`,
    `Pending commands: ${summary.pendingCommandCount}`,
    `Prepared commands: ${summary.preparedCommandCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Pending actions: ${summary.pendingActionCount}`,
    `Warnings: ${summary.warningCount}`,
    `Creation plans: ${summary.creationPlanIds.join(", ") || "none"}`,
    `Packages: ${summary.packageIds.join(", ") || "none"}`,
    `Selected plans: ${summary.selectedPlanIds.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Release executions: ${summary.releaseExecutionFingerprints.join(", ") || "none"}`,
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
        `- ${run.executedAt} | ${run.status} | ${run.mode} | ${run.executionFingerprint} | ${run.creationPlanId} | commands ${run.commandCount}`,
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
