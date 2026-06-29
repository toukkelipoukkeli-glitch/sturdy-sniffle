import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION,
  type NonCncPromotedQuoteApplicationMutationCommandExecutionStatus,
  type NonCncPromotedQuoteApplicationMutationExecutionRun,
  type NonCncPromotedQuoteApplicationMutationExecutionStatus,
} from "./nonCncPromotedQuoteApplicationMutationExecution"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-application-mutation-execution-persistence.v1"

export interface NonCncPromotedQuoteApplicationMutationExecutionRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  mode: NonCncPromotedQuoteApplicationMutationExecutionRun["mode"]
  status: NonCncPromotedQuoteApplicationMutationExecutionStatus
  mutationPackageId: string
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
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

export interface NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteApplicationMutationExecutionRecord[]
  latestRun?: NonCncPromotedQuoteApplicationMutationExecutionRecord
  mutationPackageIds: string[]
  applicationIds: string[]
  applicationRecordIds: string[]
  selectedPlanIds: string[]
  targetRfqIds: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteApplicationMutationExecutionStatus, number>>
  warningCount: number
  pendingActionCount: number
}

export interface NonCncPromotedQuoteApplicationMutationExecutionPersistenceAdapter {
  recordRun(
    run: NonCncPromotedQuoteApplicationMutationExecutionRun,
  ): Promise<NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteApplicationMutationExecutionPersistenceOptions {
  initialSnapshot?: Partial<NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot>
}

export function createLocalNonCncPromotedQuoteApplicationMutationExecutionPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteApplicationMutationExecutionPersistenceOptions = {}): NonCncPromotedQuoteApplicationMutationExecutionPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordRun(run) {
      const record = buildExecutionRecord(run)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records,
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(
  run: NonCncPromotedQuoteApplicationMutationExecutionRun,
): NonCncPromotedQuoteApplicationMutationExecutionRecord {
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
    mutationPackageId: run.mutationPackageId,
    packageId: run.packageId,
    pendingActionCount: run.nextActions.length,
    pendingCommandCount: statusCounts.pending ?? 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
    preparedCommandCount: statusCounts.prepared ?? 0,
    selectedPlanId: run.selectedPlanId,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
  }
}

function normalizeSnapshot(
  snapshot: Partial<NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot> | undefined,
): NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteApplicationMutationExecutionRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.executionFingerprint)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.executionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    applicationIds: uniqueSorted(records.flatMap((record) => record.applicationId ? [record.applicationId] : [])),
    applicationRecordIds: uniqueSorted(records.flatMap((record) => record.applicationRecordId ? [record.applicationRecordId] : [])),
    latestRun: records[0],
    mutationPackageIds: uniqueSorted(records.map((record) => record.mutationPackageId)),
    pendingActionCount: records.reduce((total, record) => total + record.pendingActionCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    selectedPlanIds: uniqueSorted(records.flatMap((record) => record.selectedPlanId ? [record.selectedPlanId] : [])),
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteApplicationMutationExecutionRecord,
): NonCncPromotedQuoteApplicationMutationExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    applicationId: optionalTrim(record.applicationId),
    applicationRecordId: optionalTrim(record.applicationRecordId),
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "appliedCommandCount"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionVersion: normalizeExecutionVersion(record.executionVersion),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "failedCommandCount"),
    mode: normalizeMode(record.mode),
    mutationPackageId: nonBlank(record.mutationPackageId, "mutationPackageId"),
    packageId: optionalTrim(record.packageId),
    pendingActionCount: nonNegativeInteger(record.pendingActionCount, "pendingActionCount"),
    pendingCommandCount: nonNegativeInteger(record.pendingCommandCount, "pendingCommandCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    preparedCommandCount: nonNegativeInteger(record.preparedCommandCount, "preparedCommandCount"),
    selectedPlanId: optionalTrim(record.selectedPlanId),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
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
  snapshot: NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot,
): NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot {
  return {
    applicationIds: [...snapshot.applicationIds],
    applicationRecordIds: [...snapshot.applicationRecordIds],
    latestRun: snapshot.latestRun ? { ...snapshot.latestRun } : undefined,
    mutationPackageIds: [...snapshot.mutationPackageIds],
    pendingActionCount: snapshot.pendingActionCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map((record) => ({ ...record })),
    selectedPlanIds: [...snapshot.selectedPlanIds],
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteApplicationMutationExecutionRecord,
  right: NonCncPromotedQuoteApplicationMutationExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.mutationPackageId, right.mutationPackageId) ||
    compareLex(left.applicationId ?? "", right.applicationId ?? "") ||
    compareLex(left.packageId ?? "", right.packageId ?? "") ||
    compareLex(left.selectedPlanId ?? "", right.selectedPlanId ?? "") ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode) ||
    compareLex(left.applicationRecordId ?? "", right.applicationRecordId ?? "") ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.actor, right.actor) ||
    compareLex(left.executionVersion, right.executionVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.appliedCommandCount, right.appliedCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.failedCommandCount, right.failedCommandCount) ||
    compareNumber(left.pendingCommandCount, right.pendingCommandCount) ||
    compareNumber(left.preparedCommandCount, right.preparedCommandCount) ||
    compareNumber(left.pendingActionCount, right.pendingActionCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function commandStatusCounts(
  statuses: NonCncPromotedQuoteApplicationMutationCommandExecutionStatus[],
): Partial<Record<NonCncPromotedQuoteApplicationMutationCommandExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteApplicationMutationCommandExecutionStatus, number>>>((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

function countStatuses(
  records: NonCncPromotedQuoteApplicationMutationExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteApplicationMutationExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteApplicationMutationExecutionStatus, number>>>((counts, record) => {
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

function compareNumber(left: number, right: number): number {
  return left - right
}

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteApplicationMutationExecutionRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC application mutation execution persistence version")
  }
  return version
}

function normalizeExecutionVersion(
  version: NonCncPromotedQuoteApplicationMutationExecutionRecord["executionVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION) {
    throw new Error("executionVersion is not a supported non-CNC application mutation execution version")
  }
  return version
}

function normalizeMode(
  mode: NonCncPromotedQuoteApplicationMutationExecutionRun["mode"],
): NonCncPromotedQuoteApplicationMutationExecutionRun["mode"] {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(
  status: NonCncPromotedQuoteApplicationMutationExecutionStatus,
): NonCncPromotedQuoteApplicationMutationExecutionStatus {
  if (
    status !== "blocked" &&
    status !== "failed" &&
    status !== "partial" &&
    status !== "pending" &&
    status !== "prepared" &&
    status !== "succeeded"
  ) {
    throw new Error("status is not a supported non-CNC application mutation execution status")
  }
  return status
}
