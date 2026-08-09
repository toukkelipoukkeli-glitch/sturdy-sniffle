import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistoryStatus =
  | "applied"
  | "blocked"
  | "empty"
  | "needs_review"
  | "pending"
  | "prepared"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySeverity =
  | "attention"
  | "neutral"
  | "ready"
  | "review"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRuns: number
  commandCount: number
  appliedCommandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  pendingActionCount: number
  warningCount: number
  applyPlanIds: string[]
  applyPlanFingerprints: string[]
  targetRfqIds: string[]
  latestCommitPlanIds: string[]
  latestCommitRecordIds: string[]
  latestCommittedExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  latestRun?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord
  recentRuns: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummaryOptions {
  recentRunLimit?: number
}

const DEFAULT_RECENT_RUN_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary {
  const recentRunLimit = normalizeRecentRunLimit(options.recentRunLimit)
  const recentRuns = snapshot.records.slice(0, recentRunLimit).map(cloneRecord)
  const latestRun = snapshot.latestRun ? cloneRecord(snapshot.latestRun) : undefined
  const commandCounts = aggregateCommandCounts(snapshot.records)
  const status = historyStatus(latestRun)
  const summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.warningCount),
    appliedCommandCount: commandCounts.appliedCommandCount,
    applyPlanFingerprints: [...snapshot.applyPlanFingerprints],
    applyPlanIds: [...snapshot.applyPlanIds],
    blockedCommandCount: commandCounts.blockedCommandCount,
    commandCount: commandCounts.commandCount,
    failedCommandCount: commandCounts.failedCommandCount,
    latestCommitPlanIds: [...snapshot.latestCommitPlanIds],
    latestCommitRecordIds: [...snapshot.latestCommitRecordIds],
    latestCommittedExecutionFingerprints: [...snapshot.latestCommittedExecutionFingerprints],
    latestRun,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRun),
    pendingActionCount: snapshot.pendingActionCount,
    pendingCommandCount: commandCounts.pendingCommandCount,
    preparedCommandCount: commandCounts.preparedCommandCount,
    recentRuns,
    severity: historySeverity(status),
    status,
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

function aggregateCommandCounts(records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord[]) {
  return records.reduce(
    (totals, record) => ({
      appliedCommandCount: totals.appliedCommandCount + record.appliedCommandCount,
      blockedCommandCount: totals.blockedCommandCount + record.blockedCommandCount,
      commandCount: totals.commandCount + record.commandCount,
      failedCommandCount: totals.failedCommandCount + record.failedCommandCount,
      pendingCommandCount: totals.pendingCommandCount + record.pendingCommandCount,
      preparedCommandCount: totals.preparedCommandCount + record.preparedCommandCount,
    }),
    {
      appliedCommandCount: 0,
      blockedCommandCount: 0,
      commandCount: 0,
      failedCommandCount: 0,
      pendingCommandCount: 0,
      preparedCommandCount: 0,
    },
  )
}

function historyStatus(
  latestRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistoryStatus {
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
      return "applied"
    default:
      return assertNeverApplyExecutionStatus(latestRun.status)
  }
}

function assertNeverApplyExecutionStatus(status: never): never {
  throw new Error(`Unhandled non-CNC live-adapter apply execution status: ${String(status)}`)
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySeverity {
  if (status === "blocked" || status === "needs_review") {
    return "attention"
  }
  if (status === "pending") {
    return "review"
  }
  if (status === "prepared") {
    return "ready"
  }
  if (status === "applied") {
    return "success"
  }
  return "neutral"
}

function historyTitle(status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistoryStatus): string {
  if (status === "blocked") {
    return "Live-adapter apply execution history blocked"
  }
  if (status === "needs_review") {
    return "Live-adapter apply execution history needs review"
  }
  if (status === "pending") {
    return "Live-adapter apply execution history pending outcomes"
  }
  if (status === "prepared") {
    return "Live-adapter apply dry-run prepared"
  }
  if (status === "applied") {
    return "Live-adapter apply execution history ready"
  }
  return "No live-adapter apply execution history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistoryStatus,
  totalRuns: number,
  latestRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord | undefined,
): string {
  if (!latestRun) {
    return "No non-CNC live-adapter apply execution runs have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC live-adapter apply execution is blocked after ${formatCount(totalRuns, "run")}; live customer-offer, file, release-review, export, and connector writes remain disabled.`
  }
  if (status === "needs_review") {
    return `Latest non-CNC live-adapter apply execution recorded ${latestRun.status} command outcomes; review before retrying or wiring active export state.`
  }
  if (status === "pending") {
    return `Latest non-CNC live-adapter apply execution is waiting for command outcomes across ${formatCount(latestRun.commandCount, "command")}.`
  }
  if (status === "prepared") {
    return `Latest non-CNC live-adapter apply dry-run prepared ${formatCount(latestRun.preparedCommandCount, "command")} for review before any provider side effects.`
  }
  return `Latest non-CNC live-adapter apply execution succeeded with ${formatCount(latestRun.appliedCommandCount, "command")} recorded for review-only export wiring.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist a live-adapter apply dry-run before enabling customer-offer export adapters.")
  } else if (status === "blocked") {
    items.push("Resolve live-adapter apply execution blockers before recording another execution.")
  } else if (status === "needs_review") {
    items.push("Review failed or partial live-adapter apply command outcomes before retrying.")
  } else if (status === "pending") {
    items.push("Record pending live-adapter apply command outcomes before using release evidence.")
  } else if (status === "prepared") {
    items.push("Review prepared live-adapter apply commands before committing provider side effects.")
  } else {
    items.push("Review applied live-adapter evidence before wiring active export state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary, "exportText">,
): string {
  const lines = [
    "Non-CNC offer export live adapter apply execution history",
    `Status: ${summary.status}`,
    `Runs: ${summary.totalRuns}`,
    `Commands: ${summary.commandCount}`,
    `Prepared commands: ${summary.preparedCommandCount}`,
    `Pending commands: ${summary.pendingCommandCount}`,
    `Applied commands: ${summary.appliedCommandCount}`,
    `Failed commands: ${summary.failedCommandCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Pending actions: ${summary.pendingActionCount}`,
    `Warnings: ${summary.warningCount}`,
    `Apply plans: ${summary.applyPlanIds.join(", ") || "none"}`,
    `Apply plan fingerprints: ${summary.applyPlanFingerprints.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Commit plans: ${summary.latestCommitPlanIds.join(", ") || "none"}`,
    `Commit records: ${summary.latestCommitRecordIds.join(", ") || "none"}`,
    `Committed executions: ${summary.latestCommittedExecutionFingerprints.join(", ") || "none"}`,
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
  lines.push(
    "Boundary: apply execution history is deterministic review data only; live customer-offer, file, release-review, export, and connector writes stay disabled.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord {
  return { ...record }
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
