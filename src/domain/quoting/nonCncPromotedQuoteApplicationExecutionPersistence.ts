import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_VERSION,
  type NonCncPromotedQuoteApplicationCommandExecutionStatus,
  type NonCncPromotedQuoteApplicationExecutionRun,
  type NonCncPromotedQuoteApplicationExecutionStatus,
} from "./nonCncPromotedQuoteApplicationExecution"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-application-execution-persistence.v1"

export interface NonCncPromotedQuoteApplicationExecutionRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  mode: NonCncPromotedQuoteApplicationExecutionRun["mode"]
  status: NonCncPromotedQuoteApplicationExecutionStatus
  applicationId: string
  applicationRecordId: string
  packageId: string
  selectedPlanId: string
  targetRfqId: string
  commandCount: number
  appliedCommandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  pendingActionCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteApplicationExecutionRecord[]
  latestRun?: NonCncPromotedQuoteApplicationExecutionRecord
  applicationIds: string[]
  applicationRecordIds: string[]
  selectedPlanIds: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteApplicationExecutionStatus, number>>
  warningCount: number
  pendingActionCount: number
}

export interface NonCncPromotedQuoteApplicationExecutionPersistenceAdapter {
  recordRun(
    run: NonCncPromotedQuoteApplicationExecutionRun,
  ): Promise<NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteApplicationExecutionPersistenceOptions {
  initialSnapshot?: Partial<NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot>
}

export function createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteApplicationExecutionPersistenceOptions = {}): NonCncPromotedQuoteApplicationExecutionPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordRun(run) {
      const record = buildExecutionRecord(run)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records.filter((candidate) => candidate.executionFingerprint !== record.executionFingerprint),
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(
  run: NonCncPromotedQuoteApplicationExecutionRun,
): NonCncPromotedQuoteApplicationExecutionRecord {
  const statusCounts = commandStatusCounts(run.commands.map((command) => command.status))
  return {
    actor: run.actor,
    applicationId: run.applicationId,
    applicationRecordId: run.applicationRecordId,
    appliedCommandCount: statusCounts.applied ?? 0,
    blockedCommandCount: statusCounts.blocked ?? 0,
    commandCount: run.commands.length,
    executedAt: run.executedAt,
    executionFingerprint: run.executionFingerprint,
    executionVersion: run.executionVersion,
    failedCommandCount: statusCounts.failed ?? 0,
    mode: run.mode,
    packageId: run.packageId,
    pendingActionCount: run.nextActions.length,
    pendingCommandCount: statusCounts.pending ?? 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION,
    preparedCommandCount: statusCounts.prepared ?? 0,
    selectedPlanId: run.selectedPlanId,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
  }
}

function normalizeSnapshot(
  snapshot: Partial<NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot> | undefined,
): NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteApplicationExecutionRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.executionFingerprint)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.executionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    applicationIds: uniqueSorted(records.map((record) => record.applicationId)),
    applicationRecordIds: uniqueSorted(records.map((record) => record.applicationRecordId)),
    latestRun: records[0],
    pendingActionCount: records.reduce((total, record) => total + record.pendingActionCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    selectedPlanIds: uniqueSorted(records.map((record) => record.selectedPlanId)),
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteApplicationExecutionRecord,
): NonCncPromotedQuoteApplicationExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    applicationId: nonBlank(record.applicationId, "applicationId"),
    applicationRecordId: nonBlank(record.applicationRecordId, "applicationRecordId"),
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "appliedCommandCount"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionVersion: normalizeExecutionVersion(record.executionVersion),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "failedCommandCount"),
    mode: normalizeMode(record.mode),
    packageId: nonBlank(record.packageId, "packageId"),
    pendingActionCount: nonNegativeInteger(record.pendingActionCount, "pendingActionCount"),
    pendingCommandCount: nonNegativeInteger(record.pendingCommandCount, "pendingCommandCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    preparedCommandCount: nonNegativeInteger(record.preparedCommandCount, "preparedCommandCount"),
    selectedPlanId: nonBlank(record.selectedPlanId, "selectedPlanId"),
    status: normalizeStatus(record.status),
    targetRfqId: nonBlank(record.targetRfqId, "targetRfqId"),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  const countedCommands =
    normalized.appliedCommandCount +
    normalized.blockedCommandCount +
    normalized.failedCommandCount +
    normalized.pendingCommandCount +
    normalized.preparedCommandCount
  if (countedCommands !== normalized.commandCount) {
    throw new Error("commandCount must equal the sum of per-status command counts")
  }

  return normalized
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot,
): NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot {
  return {
    applicationIds: [...snapshot.applicationIds],
    applicationRecordIds: [...snapshot.applicationRecordIds],
    latestRun: snapshot.latestRun ? { ...snapshot.latestRun } : undefined,
    pendingActionCount: snapshot.pendingActionCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map((record) => ({ ...record })),
    selectedPlanIds: [...snapshot.selectedPlanIds],
    statusCounts: { ...snapshot.statusCounts },
    warningCount: snapshot.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteApplicationExecutionRecord,
  right: NonCncPromotedQuoteApplicationExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.applicationId, right.applicationId) ||
    compareLex(left.packageId, right.packageId) ||
    compareLex(left.selectedPlanId, right.selectedPlanId) ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode)
  )
}

function commandStatusCounts(
  statuses: NonCncPromotedQuoteApplicationCommandExecutionStatus[],
): Partial<Record<NonCncPromotedQuoteApplicationCommandExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteApplicationCommandExecutionStatus, number>>>((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

function countStatuses(
  records: NonCncPromotedQuoteApplicationExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteApplicationExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteApplicationExecutionStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareLex)
}

function nonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`)
  }
  return value
}

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteApplicationExecutionRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC application execution persistence version")
  }
  return version
}

function normalizeExecutionVersion(
  version: NonCncPromotedQuoteApplicationExecutionRecord["executionVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_VERSION) {
    throw new Error("executionVersion is not a supported non-CNC application execution version")
  }
  return version
}

function normalizeMode(
  mode: NonCncPromotedQuoteApplicationExecutionRun["mode"],
): NonCncPromotedQuoteApplicationExecutionRun["mode"] {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(
  status: NonCncPromotedQuoteApplicationExecutionStatus,
): NonCncPromotedQuoteApplicationExecutionStatus {
  if (
    status !== "blocked" &&
    status !== "failed" &&
    status !== "partial" &&
    status !== "pending" &&
    status !== "prepared" &&
    status !== "succeeded"
  ) {
    throw new Error("status is not a supported non-CNC application execution status")
  }
  return status
}
