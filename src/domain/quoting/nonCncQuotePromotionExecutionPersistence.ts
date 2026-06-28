import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type {
  NonCncQuotePromotionCommandExecutionStatus,
  NonCncQuotePromotionExecutionRun,
  NonCncQuotePromotionExecutionStatus,
} from "./nonCncQuotePromotionExecution"
import { NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION } from "./nonCncQuotePromotionCommandPackage"

export const NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION =
  "non-cnc-quote-promotion-execution-persistence.v1"

export interface NonCncQuotePromotionExecutionRecord {
  persistenceVersion: typeof NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  mode: NonCncQuotePromotionExecutionRun["mode"]
  status: NonCncQuotePromotionExecutionStatus
  packageId: string
  packageVersion: NonCncQuotePromotionExecutionRun["packageVersion"]
  selectedPlanId: string
  targetRfqId?: string
  commandCount: number
  appliedCommandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  pendingActionCount: number
  warningCount: number
}

export interface NonCncQuotePromotionExecutionPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncQuotePromotionExecutionRecord[]
  latestRun?: NonCncQuotePromotionExecutionRecord
  packageIds: string[]
  selectedPlanIds: string[]
  statusCounts: Partial<Record<NonCncQuotePromotionExecutionStatus, number>>
  warningCount: number
  pendingActionCount: number
}

export interface NonCncQuotePromotionExecutionPersistenceAdapter {
  recordRun(run: NonCncQuotePromotionExecutionRun): Promise<NonCncQuotePromotionExecutionPersistenceSnapshot>
  snapshot(): NonCncQuotePromotionExecutionPersistenceSnapshot
}

export interface LocalNonCncQuotePromotionExecutionPersistenceOptions {
  initialSnapshot?: Partial<NonCncQuotePromotionExecutionPersistenceSnapshot>
}

export function createLocalNonCncQuotePromotionExecutionPersistence({
  initialSnapshot,
}: LocalNonCncQuotePromotionExecutionPersistenceOptions = {}): NonCncQuotePromotionExecutionPersistenceAdapter {
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

  function snapshot(): NonCncQuotePromotionExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(run: NonCncQuotePromotionExecutionRun): NonCncQuotePromotionExecutionRecord {
  const statusCounts = commandStatusCounts(run.commands.map((command) => command.status))
  return {
    actor: run.actor,
    appliedCommandCount: statusCounts.applied ?? 0,
    blockedCommandCount: statusCounts.blocked ?? 0,
    commandCount: run.commands.length,
    executedAt: run.executedAt,
    executionFingerprint: run.executionFingerprint,
    failedCommandCount: statusCounts.failed ?? 0,
    mode: run.mode,
    packageId: run.packageId,
    packageVersion: run.packageVersion,
    pendingActionCount: run.nextActions.length,
    pendingCommandCount: statusCounts.pending ?? 0,
    persistenceVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION,
    preparedCommandCount: statusCounts.prepared ?? 0,
    selectedPlanId: run.selectedPlanId,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
  }
}

function normalizeSnapshot(
  snapshot: Partial<NonCncQuotePromotionExecutionPersistenceSnapshot> | undefined,
): NonCncQuotePromotionExecutionPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncQuotePromotionExecutionRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    recordsByFingerprint.set(normalized.executionFingerprint, normalized)
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    latestRun: records[0],
    packageIds: uniqueSorted(records.map((record) => record.packageId)),
    pendingActionCount: records.reduce((total, record) => total + record.pendingActionCount, 0),
    persistenceVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    selectedPlanIds: uniqueSorted(records.map((record) => record.selectedPlanId)),
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(record: NonCncQuotePromotionExecutionRecord): NonCncQuotePromotionExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "appliedCommandCount"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "failedCommandCount"),
    mode: normalizeMode(record.mode),
    packageId: nonBlank(record.packageId, "packageId"),
    packageVersion: normalizePackageVersion(record.packageVersion),
    pendingActionCount: nonNegativeInteger(record.pendingActionCount, "pendingActionCount"),
    pendingCommandCount: nonNegativeInteger(record.pendingCommandCount, "pendingCommandCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    preparedCommandCount: nonNegativeInteger(record.preparedCommandCount, "preparedCommandCount"),
    selectedPlanId: nonBlank(record.selectedPlanId, "selectedPlanId"),
    status: normalizeStatus(record.status),
    targetRfqId: record.targetRfqId === undefined ? undefined : nonBlank(record.targetRfqId, "targetRfqId"),
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
  snapshot: NonCncQuotePromotionExecutionPersistenceSnapshot,
): NonCncQuotePromotionExecutionPersistenceSnapshot {
  return {
    latestRun: snapshot.latestRun ? { ...snapshot.latestRun } : undefined,
    packageIds: [...snapshot.packageIds],
    pendingActionCount: snapshot.pendingActionCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map((record) => ({ ...record })),
    selectedPlanIds: [...snapshot.selectedPlanIds],
    statusCounts: { ...snapshot.statusCounts },
    warningCount: snapshot.warningCount,
  }
}

function sortNewestFirst(left: NonCncQuotePromotionExecutionRecord, right: NonCncQuotePromotionExecutionRecord): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.packageId, right.packageId) ||
    compareLex(left.selectedPlanId, right.selectedPlanId) ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode)
  )
}

function commandStatusCounts(
  statuses: NonCncQuotePromotionCommandExecutionStatus[],
): Partial<Record<NonCncQuotePromotionCommandExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncQuotePromotionCommandExecutionStatus, number>>>((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

function countStatuses(
  records: NonCncQuotePromotionExecutionRecord[],
): Partial<Record<NonCncQuotePromotionExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncQuotePromotionExecutionStatus, number>>>((counts, record) => {
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
  version: NonCncQuotePromotionExecutionRecord["persistenceVersion"],
): typeof NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION {
  if (version !== NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC promotion execution persistence version")
  }
  return version
}

function normalizePackageVersion(
  version: NonCncQuotePromotionExecutionRun["packageVersion"],
): typeof NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION {
  if (version !== NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION) {
    throw new Error("packageVersion is not a supported non-CNC promotion command package version")
  }
  return version
}

function normalizeMode(mode: NonCncQuotePromotionExecutionRun["mode"]): NonCncQuotePromotionExecutionRun["mode"] {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(status: NonCncQuotePromotionExecutionStatus): NonCncQuotePromotionExecutionStatus {
  if (
    status !== "blocked" &&
    status !== "failed" &&
    status !== "partial" &&
    status !== "pending" &&
    status !== "prepared" &&
    status !== "succeeded"
  ) {
    throw new Error("status is not a supported non-CNC promotion execution status")
  }
  return status
}
