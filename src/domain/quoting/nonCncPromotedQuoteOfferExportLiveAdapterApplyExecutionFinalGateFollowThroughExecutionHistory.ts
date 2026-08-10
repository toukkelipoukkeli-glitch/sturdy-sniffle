import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistoryStatus =
  | "applied"
  | "blocked"
  | "empty"
  | "needs_review"
  | "pending"
  | "prepared"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySeverity =
  | "attention"
  | "neutral"
  | "ready"
  | "review"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySeverity
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
  followThroughIds: string[]
  followThroughFingerprints: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  latestExecutionFingerprints: string[]
  latestApplyPlanIds: string[]
  latestCommitRecordIds: string[]
  latestCommittedExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  latestRun?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord
  recentRuns: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummaryOptions {
  recentRunLimit?: number
}

const DEFAULT_RECENT_RUN_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary {
  const recentRunLimit = normalizeRecentRunLimit(options.recentRunLimit)
  const latestRun = snapshot.latestRun ? cloneRecord(snapshot.latestRun) : undefined
  const recentRuns = snapshot.records.slice(0, recentRunLimit).map(cloneRecord)
  const commandCounts = aggregateCommandCounts(snapshot.records)
  const status = historyStatus(latestRun)
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary,
    "exportText"
  > = {
    actionItems: actionItems(status, snapshot.warningCount),
    appliedCommandCount: commandCounts.appliedCommandCount,
    blockedCommandCount: commandCounts.blockedCommandCount,
    commandCount: commandCounts.commandCount,
    failedCommandCount: commandCounts.failedCommandCount,
    followThroughFingerprints: [...snapshot.followThroughFingerprints],
    followThroughIds: [...snapshot.followThroughIds],
    latestApplyPlanIds: [...snapshot.latestApplyPlanIds],
    latestCommitRecordIds: [...snapshot.latestCommitRecordIds],
    latestCommittedExecutionFingerprints: [...snapshot.latestCommittedExecutionFingerprints],
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestRun,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRun),
    pendingActionCount: snapshot.pendingActionCount,
    pendingCommandCount: commandCounts.pendingCommandCount,
    preparedCommandCount: commandCounts.preparedCommandCount,
    readinessRecordIds: [...snapshot.readinessRecordIds],
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

function aggregateCommandCounts(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord[],
) {
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
  latestRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistoryStatus {
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
      return assertNeverFinalGateExecutionStatus(latestRun.status)
  }
}

function assertNeverFinalGateExecutionStatus(status: never): never {
  throw new Error(`Unhandled non-CNC live-adapter final-gate follow-through execution status: ${String(status)}`)
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySeverity {
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

function historyTitle(status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistoryStatus): string {
  if (status === "blocked") {
    return "Final-gate follow-through execution history blocked"
  }
  if (status === "needs_review") {
    return "Final-gate follow-through execution history needs review"
  }
  if (status === "pending") {
    return "Final-gate follow-through execution history pending outcomes"
  }
  if (status === "prepared") {
    return "Final-gate follow-through dry-run prepared"
  }
  if (status === "applied") {
    return "Final-gate follow-through execution history ready"
  }
  return "No final-gate follow-through execution history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistoryStatus,
  totalRuns: number,
  latestRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord | undefined,
): string {
  if (!latestRun) {
    return "No non-CNC live-adapter final-gate follow-through execution runs have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC live-adapter final-gate follow-through execution is blocked after ${formatCount(totalRuns, "run")}; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes remain disabled.`
  }
  if (status === "needs_review") {
    return `Latest non-CNC live-adapter final-gate follow-through execution recorded ${latestRun.status} command outcomes; review before retrying or wiring customer-visible release state.`
  }
  if (status === "pending") {
    return `Latest non-CNC live-adapter final-gate follow-through execution is waiting for command outcomes across ${formatCount(latestRun.commandCount, "command")}.`
  }
  if (status === "prepared") {
    return `Latest non-CNC live-adapter final-gate follow-through dry-run prepared ${formatCount(latestRun.preparedCommandCount, "command")} for review before any provider side effects.`
  }
  return `Latest non-CNC live-adapter final-gate follow-through execution succeeded with ${formatCount(latestRun.appliedCommandCount, "command")} recorded for review-only release follow-through.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist a final-gate follow-through dry-run before enabling customer-visible release follow-through adapters.")
  } else if (status === "blocked") {
    items.push("Resolve final-gate follow-through execution blockers before recording another execution.")
  } else if (status === "needs_review") {
    items.push("Review failed or partial final-gate follow-through command outcomes before retrying.")
  } else if (status === "pending") {
    items.push("Record pending final-gate follow-through command outcomes before using release evidence.")
  } else if (status === "prepared") {
    items.push("Review prepared final-gate follow-through commands before committing provider side effects.")
  } else {
    items.push("Review applied final-gate follow-through evidence before wiring active release state.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionHistorySummary,
    "exportText"
  >,
): string {
  const lines = [
    "Non-CNC live adapter final-gate follow-through execution history",
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
    `Follow-through IDs: ${summary.followThroughIds.join(", ") || "none"}`,
    `Follow-through fingerprints: ${summary.followThroughFingerprints.join(", ") || "none"}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
    `Readiness records: ${summary.readinessRecordIds.join(", ") || "none"}`,
    `Apply executions: ${summary.latestExecutionFingerprints.join(", ") || "none"}`,
    `Apply plans: ${summary.latestApplyPlanIds.join(", ") || "none"}`,
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
    "Boundary: final-gate follow-through execution history is deterministic review data only; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord {
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
