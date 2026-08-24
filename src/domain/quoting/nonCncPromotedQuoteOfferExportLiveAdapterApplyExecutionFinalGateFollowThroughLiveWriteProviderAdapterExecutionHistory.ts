import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceSnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistoryStatus =
  | "blocked"
  | "empty"
  | "needs_review"
  | "pending"
  | "prepared"
  | "succeeded"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySeverity =
  | "attention"
  | "neutral"
  | "ready"
  | "review"
  | "success"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary {
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistoryStatus
  severity: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySeverity
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRuns: number
  commandCount: number
  plannedCommandCount: number
  appliedCommandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  nextActionCount: number
  warningCount: number
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
  commandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  externalIds: string[]
  latestRun?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord
  recentRuns: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord[]
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummaryOptions {
  recentRunLimit?: number
}

const DEFAULT_RECENT_RUN_LIMIT = 5

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistenceSnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary {
  const recentRunLimit = normalizeRecentRunLimit(options.recentRunLimit)
  const latestRun = snapshot.latestRun ? cloneRecord(snapshot.latestRun) : undefined
  const recentRuns = snapshot.records.slice(0, recentRunLimit).map(cloneRecord)
  const status = historyStatus(latestRun)
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary,
    "exportText"
  > = {
    actionItems: actionItems(status, snapshot.warningCount),
    adapterBoundaryFingerprints: [...snapshot.adapterBoundaryFingerprints],
    adapterBoundaryIds: [...snapshot.adapterBoundaryIds],
    appliedCommandCount: snapshot.appliedCommandCount,
    blockedCommandCount: snapshot.blockedCommandCount,
    commandCount: snapshot.commandCount,
    commandIdempotencyKeys: [...snapshot.commandIdempotencyKeys],
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitRecordIds: [...snapshot.commitRecordIds],
    evidenceFingerprints: [...snapshot.evidenceFingerprints],
    externalIds: [...snapshot.externalIds],
    failedCommandCount: snapshot.failedCommandCount,
    followThroughIds: [...snapshot.followThroughIds],
    latestRun,
    liveWriteBoundaryFingerprints: [...snapshot.liveWriteBoundaryFingerprints],
    liveWriteBoundaryIds: [...snapshot.liveWriteBoundaryIds],
    nextActionCount: snapshot.nextActionCount,
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestRun),
    pendingCommandCount: snapshot.pendingCommandCount,
    pendingWriteIntentCount: snapshot.pendingWriteIntentCount,
    plannedCommandCount: snapshot.plannedCommandCount,
    preparedCommandCount: snapshot.preparedCommandCount,
    providerAdapterBoundaryFingerprints: [...snapshot.providerAdapterBoundaryFingerprints],
    providerAdapterBoundaryIds: [...snapshot.providerAdapterBoundaryIds],
    providerReadModelRecordIds: [...snapshot.providerReadModelRecordIds],
    readinessRecordIds: [...snapshot.readinessRecordIds],
    recentRuns,
    reviewedOutcomeCount: snapshot.reviewedOutcomeCount,
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

function historyStatus(
  latestRun:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistoryStatus {
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
      return assertNeverProviderAdapterExecutionStatus(latestRun.status)
  }
}

function assertNeverProviderAdapterExecutionStatus(status: never): never {
  throw new Error(`Unhandled non-CNC final-gate provider-adapter execution status: ${String(status)}`)
}

function historySeverity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistoryStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySeverity {
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

function historyTitle(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistoryStatus,
): string {
  if (status === "blocked") {
    return "Final-gate provider-adapter execution history blocked"
  }
  if (status === "needs_review") {
    return "Final-gate provider-adapter execution history needs review"
  }
  if (status === "pending") {
    return "Final-gate provider-adapter execution history pending outcomes"
  }
  if (status === "prepared") {
    return "Final-gate provider-adapter dry-run prepared"
  }
  if (status === "succeeded") {
    return "Final-gate provider-adapter execution history ready"
  }
  return "No final-gate provider-adapter execution history"
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistoryStatus,
  totalRuns: number,
  latestRun:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord
    | undefined,
): string {
  if (!latestRun) {
    return "No non-CNC final-gate provider-adapter execution runs have been persisted yet."
  }
  if (status === "blocked") {
    return `Latest non-CNC final-gate provider-adapter execution is blocked after ${formatCount(totalRuns, "run")}; provider execution evidence remains withheld and live writes remain disabled.`
  }
  if (status === "needs_review") {
    return `Latest non-CNC final-gate provider-adapter execution recorded ${latestRun.status} command outcomes; review before retrying or wiring customer-visible provider state.`
  }
  if (status === "pending") {
    return `Latest non-CNC final-gate provider-adapter execution is waiting for command outcomes across ${formatCount(latestRun.commandCount, "command")}.`
  }
  if (status === "prepared") {
    return `Latest non-CNC final-gate provider-adapter dry-run prepared ${formatCount(latestRun.preparedCommandCount, "provider command")} for review before any provider side effects.`
  }
  return `Latest non-CNC final-gate provider-adapter execution succeeded with ${formatCount(latestRun.appliedCommandCount, "command")} recorded for review-only provider follow-through.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistoryStatus,
  warningCount: number,
): string[] {
  const items: string[] = []
  if (status === "empty") {
    items.push("Persist a final-gate provider-adapter dry-run before enabling live provider adapters.")
  } else if (status === "blocked") {
    items.push("Resolve final-gate provider-adapter execution blockers before recording provider outcomes.")
  } else if (status === "needs_review") {
    items.push("Review failed or partial final-gate provider-adapter command outcomes before retrying.")
  } else if (status === "pending") {
    items.push("Record pending final-gate provider-adapter command outcomes before using provider evidence.")
  } else if (status === "prepared") {
    items.push("Review prepared final-gate provider-adapter commands before committing provider side effects.")
  } else {
    items.push("Review applied final-gate provider-adapter evidence before wiring live customer-offer, file, release-review, export, connector, or follow-through writes.")
  }
  if (warningCount > 0) {
    items.push(`Review ${formatCount(warningCount, "warning")} before customer-visible provider release.`)
  }
  return items
}

function buildExportText(
  summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionHistorySummary,
    "exportText"
  >,
): string {
  const lines = [
    "Non-CNC final-gate follow-through provider-adapter execution history",
    `Status: ${summary.status}`,
    `Runs: ${summary.totalRuns}`,
    `Commands: ${summary.commandCount}`,
    `Planned commands: ${summary.plannedCommandCount}`,
    `Prepared commands: ${summary.preparedCommandCount}`,
    `Pending commands: ${summary.pendingCommandCount}`,
    `Applied commands: ${summary.appliedCommandCount}`,
    `Failed commands: ${summary.failedCommandCount}`,
    `Blocked commands: ${summary.blockedCommandCount}`,
    `Pending write intents: ${summary.pendingWriteIntentCount}`,
    `Reviewed outcomes: ${summary.reviewedOutcomeCount}`,
    `Next actions: ${summary.nextActionCount}`,
    `Warnings: ${summary.warningCount}`,
    `Provider-adapter boundaries: ${summary.providerAdapterBoundaryIds.join(", ") || "none"}`,
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
    `Evidence fingerprints: ${summary.evidenceFingerprints.join(", ") || "none"}`,
    `External IDs: ${summary.externalIds.join(", ") || "none"}`,
  ]
  if (summary.latestRun) {
    lines.push(
      `Latest provider-adapter execution: ${summary.latestRun.executedAt} | ${summary.latestRun.status} | ${summary.latestRun.mode} | ${summary.latestRun.executionFingerprint}`,
    )
  }
  lines.push("Recent provider-adapter execution runs:")
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
    "Boundary: final-gate follow-through provider-adapter execution history is deterministic review data only; live customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled by default.",
  )
  return lines.join("\n")
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord {
  return {
    ...record,
    commandIdempotencyKeys: [...record.commandIdempotencyKeys],
    evidenceFingerprints: [...record.evidenceFingerprints],
    externalIds: [...record.externalIds],
  }
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
