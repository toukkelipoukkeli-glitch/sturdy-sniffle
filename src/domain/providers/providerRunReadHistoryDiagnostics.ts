import { compareLex } from "../shared/deterministic"
import {
  PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION,
  type ProviderRunReadHistoryPersistenceRecord,
  type ProviderRunReadHistoryPersistenceSnapshot,
} from "./providerRunReadHistoryPersistence"

export const PROVIDER_RUN_READ_HISTORY_DIAGNOSTICS_VERSION = "provider-run-read-history-diagnostics.v1"
export const providerRunReadHistoryFallbackRecoveryAction =
  "Check Convex provider-run reads before trusting local provider audit history."
export const providerRunReadHistoryPendingRecoveryAction =
  "Keep local provider audits visible while Convex provider-run reads are still pending."

export type ProviderRunReadHistoryDiagnosticStatus = "fallback" | "healthy" | "mixed" | "pending"
export type ProviderRunReadHistoryDiagnosticSeverity = "healthy" | "info" | "warning"

export interface ProviderRunReadHistoryDiagnosticActionItem {
  detail: string
  key: string
  label: string
  severity: ProviderRunReadHistoryDiagnosticSeverity
}

export interface ProviderRunReadHistoryDiagnosticSummary {
  diagnosticVersion: typeof PROVIDER_RUN_READ_HISTORY_DIAGNOSTICS_VERSION
  latestRecord?: ProviderRunReadHistoryPersistenceRecord
  nextActionItems: ProviderRunReadHistoryDiagnosticActionItem[]
  operatorSummary: string
  recentRecords: ProviderRunReadHistoryPersistenceRecord[]
  recoveryActionLabels: string[]
  severity: ProviderRunReadHistoryDiagnosticSeverity
  status: ProviderRunReadHistoryDiagnosticStatus
  totalRecordCount: number
}

export function summarizeProviderRunReadHistoryDiagnostics(
  snapshot: ProviderRunReadHistoryPersistenceSnapshot,
): ProviderRunReadHistoryDiagnosticSummary {
  assertPersistenceVersion(snapshot)
  const recentRecords = snapshot.records.map(cloneRecord).sort(sortNewestFirst)
  const status = determineStatus(snapshot)
  return {
    diagnosticVersion: PROVIDER_RUN_READ_HISTORY_DIAGNOSTICS_VERSION,
    latestRecord: recentRecords[0],
    nextActionItems: nextActionsForStatus(status),
    operatorSummary: buildOperatorSummary(snapshot, status),
    recentRecords,
    recoveryActionLabels: recoveryActionsForStatus(status),
    severity: determineSeverity(status),
    status,
    totalRecordCount: snapshot.recordCount,
  }
}

export function buildProviderRunReadHistoryDiagnosticExportSummary(
  snapshot: ProviderRunReadHistoryPersistenceSnapshot,
): string {
  const diagnostic = summarizeProviderRunReadHistoryDiagnostics(snapshot)
  const lines = [
    `Provider run read history: ${diagnostic.status}`,
    `Severity: ${diagnostic.severity}`,
    `Records: total ${snapshot.recordCount}, convex ${snapshot.convexRecordKeys.length}, fallback ${snapshot.fallbackRecordKeys.length}, local ${snapshot.localRecordKeys.length}, pending ${snapshot.pendingRecordKeys.length}`,
    `Runs: persisted ${snapshot.persistedRunCount}, local ${snapshot.localRunCount}, errors ${snapshot.errorCount}`,
    `Summary: ${diagnostic.operatorSummary}`,
  ]

  if (diagnostic.latestRecord) {
    lines.push(
      `Latest read: ${diagnostic.latestRecord.status} ${diagnostic.latestRecord.persistedAt} ${diagnostic.latestRecord.recordKey}`,
    )
  }
  if (diagnostic.recoveryActionLabels.length > 0) {
    lines.push(`Recovery actions: ${diagnostic.recoveryActionLabels.join(" | ")}`)
  }
  if (diagnostic.nextActionItems.length > 0) {
    lines.push("Next actions:")
    for (const action of diagnostic.nextActionItems) {
      lines.push(`- ${action.severity} ${action.label}: ${action.detail}`)
    }
  }
  if (diagnostic.recentRecords.length > 0) {
    lines.push("Recent provider reads:")
    for (const record of diagnostic.recentRecords) {
      lines.push(`- ${record.status} ${record.persistedAt} ${record.recordKey} ${record.rfqId}`)
    }
  }

  return lines.join("\n")
}

function determineStatus(snapshot: ProviderRunReadHistoryPersistenceSnapshot): ProviderRunReadHistoryDiagnosticStatus {
  if (snapshot.fallbackRecordKeys.length > 0) {
    return snapshot.convexRecordKeys.length > 0 || snapshot.localRecordKeys.length > 0 || snapshot.pendingRecordKeys.length > 0
      ? "mixed"
      : "fallback"
  }
  if (snapshot.pendingRecordKeys.length > 0) {
    return "pending"
  }
  return "healthy"
}

function determineSeverity(status: ProviderRunReadHistoryDiagnosticStatus): ProviderRunReadHistoryDiagnosticSeverity {
  switch (status) {
    case "fallback":
    case "mixed":
      return "warning"
    case "pending":
      return "info"
    case "healthy":
      return "healthy"
  }
}

function buildOperatorSummary(
  snapshot: ProviderRunReadHistoryPersistenceSnapshot,
  status: ProviderRunReadHistoryDiagnosticStatus,
): string {
  if (snapshot.recordCount === 0) {
    return "Provider-run read history has no persisted read records yet."
  }
  const countText = `${snapshot.recordCount} read record${snapshot.recordCount === 1 ? "" : "s"}`
  const sourceText = `${snapshot.convexRecordKeys.length} Convex, ${snapshot.fallbackRecordKeys.length} fallback, ${snapshot.localRecordKeys.length} local, ${snapshot.pendingRecordKeys.length} pending`
  switch (status) {
    case "fallback":
      return `Provider-run read history has ${countText} (${sourceText}); latest read used local fallback.`
    case "mixed":
      return `Provider-run read history has ${countText} (${sourceText}); review fallback records before trusting merged provider audits.`
    case "pending":
      return `Provider-run read history has ${countText} (${sourceText}); Convex reads are still pending.`
    case "healthy":
      return `Provider-run read history has ${countText} (${sourceText}); no fallback reads recorded.`
  }
}

function recoveryActionsForStatus(status: ProviderRunReadHistoryDiagnosticStatus): string[] {
  switch (status) {
    case "fallback":
    case "mixed":
      return [providerRunReadHistoryFallbackRecoveryAction]
    case "pending":
      return [providerRunReadHistoryPendingRecoveryAction]
    case "healthy":
      return []
  }
}

function nextActionsForStatus(status: ProviderRunReadHistoryDiagnosticStatus): ProviderRunReadHistoryDiagnosticActionItem[] {
  switch (status) {
    case "fallback":
      return [
        {
          detail: "Convex provider-run reads failed; compare local audits before using release decisions.",
          key: "verify-convex-provider-reads",
          label: "Verify Convex provider reads",
          severity: "warning",
        },
        {
          detail: "Keep local provider audit history visible until the persisted read path recovers.",
          key: "keep-local-provider-audits",
          label: "Keep local audits visible",
          severity: "info",
        },
      ]
    case "mixed":
      return [
        {
          detail: "Fallback and persisted reads are both present; reconcile the newest fallback before trusting merged audits.",
          key: "reconcile-provider-read-sources",
          label: "Reconcile read sources",
          severity: "warning",
        },
        {
          detail: "Copy the diagnostic export into the provider incident or handoff before clearing fallback history.",
          key: "attach-provider-diagnostic-export",
          label: "Attach diagnostic export",
          severity: "info",
        },
      ]
    case "pending":
      return [
        {
          detail: "Convex provider-run reads are still pending; keep local provider audits visible while the read settles.",
          key: "wait-for-convex-provider-read",
          label: "Wait for Convex read",
          severity: "info",
        },
      ]
    case "healthy":
      return [
        {
          detail: "No provider-read fallback is recorded for this RFQ; continue monitoring persisted read history.",
          key: "monitor-provider-read-history",
          label: "Monitor provider reads",
          severity: "healthy",
        },
      ]
  }
}

function assertPersistenceVersion(snapshot: ProviderRunReadHistoryPersistenceSnapshot): void {
  if (snapshot.persistenceVersion !== PROVIDER_RUN_READ_HISTORY_PERSISTENCE_VERSION) {
    throw new Error("provider run read history persistence version is not supported")
  }
}

function cloneRecord(record: ProviderRunReadHistoryPersistenceRecord): ProviderRunReadHistoryPersistenceRecord {
  return {
    ...record,
    readHistory: {
      ...record.readHistory,
      errorMessages: [...record.readHistory.errorMessages],
      localRunKeys: [...record.readHistory.localRunKeys],
      persistedRunKeys: [...record.readHistory.persistedRunKeys],
      sync: { ...record.readHistory.sync },
    },
  }
}

function sortNewestFirst(
  left: ProviderRunReadHistoryPersistenceRecord,
  right: ProviderRunReadHistoryPersistenceRecord,
): number {
  return (
    compareLex(right.persistedAt, left.persistedAt) ||
    compareLex(left.recordKey, right.recordKey) ||
    compareLex(left.rfqId, right.rfqId)
  )
}
