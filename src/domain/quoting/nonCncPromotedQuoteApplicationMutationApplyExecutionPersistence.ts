import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION,
  type NonCncPromotedQuoteApplicationMutationApplyCommandExecutionStatus,
  type NonCncPromotedQuoteApplicationMutationApplyExecutionRun,
  type NonCncPromotedQuoteApplicationMutationApplyExecutionStatus,
} from "./nonCncPromotedQuoteApplicationMutationApplyExecution"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-application-mutation-apply-execution-persistence.v1"

export interface NonCncPromotedQuoteApplicationMutationApplyExecutionRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionRun["mode"]
  status: NonCncPromotedQuoteApplicationMutationApplyExecutionStatus
  applyPlanId: string
  mutationPackageId?: string
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  sourceExecutionFingerprint?: string
  commandCount: number
  appliedCommandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  pendingActionCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord[]
  latestRun?: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord
  applyPlanIds: string[]
  mutationPackageIds: string[]
  applicationIds: string[]
  applicationRecordIds: string[]
  selectedPlanIds: string[]
  targetRfqIds: string[]
  sourceExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteApplicationMutationApplyExecutionStatus, number>>
  warningCount: number
  pendingActionCount: number
}

export interface NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceAdapter {
  recordRun(
    run: NonCncPromotedQuoteApplicationMutationApplyExecutionRun,
  ): Promise<NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceOptions {
  initialSnapshot?: Partial<NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot>
}

export function createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceOptions = {}): NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceAdapter {
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

  function snapshot(): NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(
  run: NonCncPromotedQuoteApplicationMutationApplyExecutionRun,
): NonCncPromotedQuoteApplicationMutationApplyExecutionRecord {
  const statusCounts = commandStatusCounts(run.commands.map((command) => command.status))
  return {
    actor: run.actor,
    applicationId: run.applicationId,
    applicationRecordId: run.applicationRecordId,
    appliedCommandCount: statusCounts.applied ?? 0,
    applyPlanId: run.applyPlanId,
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
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
    preparedCommandCount: statusCounts.prepared ?? 0,
    selectedPlanId: run.selectedPlanId,
    sourceExecutionFingerprint: run.sourceExecutionFingerprint,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
  }
}

function normalizeSnapshot(
  snapshot: Partial<NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot> | undefined,
): NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteApplicationMutationApplyExecutionRecord>()
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
    applyPlanIds: uniqueSorted(records.map((record) => record.applyPlanId)),
    latestRun: records[0],
    mutationPackageIds: uniqueSorted(records.flatMap((record) => record.mutationPackageId ? [record.mutationPackageId] : [])),
    pendingActionCount: records.reduce((total, record) => total + record.pendingActionCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    selectedPlanIds: uniqueSorted(records.flatMap((record) => record.selectedPlanId ? [record.selectedPlanId] : [])),
    sourceExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.sourceExecutionFingerprint ? [record.sourceExecutionFingerprint] : []),
    ),
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord,
): NonCncPromotedQuoteApplicationMutationApplyExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    applicationId: optionalTrim(record.applicationId),
    applicationRecordId: optionalTrim(record.applicationRecordId),
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "appliedCommandCount"),
    applyPlanId: nonBlank(record.applyPlanId, "applyPlanId"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionVersion: normalizeExecutionVersion(record.executionVersion),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "failedCommandCount"),
    mode: normalizeMode(record.mode),
    mutationPackageId: optionalTrim(record.mutationPackageId),
    packageId: optionalTrim(record.packageId),
    pendingActionCount: nonNegativeInteger(record.pendingActionCount, "pendingActionCount"),
    pendingCommandCount: nonNegativeInteger(record.pendingCommandCount, "pendingCommandCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    preparedCommandCount: nonNegativeInteger(record.preparedCommandCount, "preparedCommandCount"),
    selectedPlanId: optionalTrim(record.selectedPlanId),
    sourceExecutionFingerprint: optionalTrim(record.sourceExecutionFingerprint),
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
  validateAggregateStatus(normalized)
  if (normalized.status === "blocked" && normalized.targetRfqId !== undefined) {
    throw new Error("blocked application mutation apply execution records cannot include a targetRfqId")
  }
  if (normalized.status === "blocked" && normalized.sourceExecutionFingerprint !== undefined) {
    throw new Error("blocked application mutation apply execution records cannot include a sourceExecutionFingerprint")
  }

  return normalized
}

function validateAggregateStatus(record: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord): void {
  if (record.commandCount === 0) {
    throw new Error("commandCount must be greater than zero for application mutation apply execution records")
  }

  const activeStatusCount = [
    record.appliedCommandCount,
    record.blockedCommandCount,
    record.failedCommandCount,
    record.pendingCommandCount,
    record.preparedCommandCount,
  ].filter((count) => count > 0).length

  if (record.status === "blocked" && record.blockedCommandCount !== record.commandCount) {
    throw new Error("blocked application mutation apply execution records must have only blocked commands")
  }
  if (record.status === "prepared" && (record.mode !== "dry_run" || record.preparedCommandCount !== record.commandCount)) {
    throw new Error("prepared application mutation apply execution records must be dry-run records with only prepared commands")
  }
  if (record.status === "pending" && (record.mode !== "commit" || record.pendingCommandCount !== record.commandCount)) {
    throw new Error("pending application mutation apply execution records must be commit records with only pending commands")
  }
  if (record.status === "succeeded" && (record.mode !== "commit" || record.appliedCommandCount !== record.commandCount)) {
    throw new Error("succeeded application mutation apply execution records must be commit records with only applied commands")
  }
  if (record.status === "failed" && (record.mode !== "commit" || record.failedCommandCount !== record.commandCount)) {
    throw new Error("failed application mutation apply execution records must be commit records with only failed commands")
  }
  if (
    record.status === "partial" &&
    (record.mode !== "commit" ||
      record.blockedCommandCount > 0 ||
      record.preparedCommandCount > 0 ||
      activeStatusCount < 2)
  ) {
    throw new Error(
      "partial application mutation apply execution records must be commit records with a mixed applied, failed, or pending command state",
    )
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot,
): NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot {
  return {
    applicationIds: [...snapshot.applicationIds],
    applicationRecordIds: [...snapshot.applicationRecordIds],
    applyPlanIds: [...snapshot.applyPlanIds],
    latestRun: snapshot.latestRun ? { ...snapshot.latestRun } : undefined,
    mutationPackageIds: [...snapshot.mutationPackageIds],
    pendingActionCount: snapshot.pendingActionCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map((record) => ({ ...record })),
    selectedPlanIds: [...snapshot.selectedPlanIds],
    sourceExecutionFingerprints: [...snapshot.sourceExecutionFingerprints],
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord,
  right: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.applyPlanId, right.applyPlanId) ||
    compareLex(left.mutationPackageId ?? "", right.mutationPackageId ?? "") ||
    compareLex(left.applicationId ?? "", right.applicationId ?? "") ||
    compareLex(left.packageId ?? "", right.packageId ?? "") ||
    compareLex(left.selectedPlanId ?? "", right.selectedPlanId ?? "") ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode) ||
    compareLex(left.applicationRecordId ?? "", right.applicationRecordId ?? "") ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.sourceExecutionFingerprint ?? "", right.sourceExecutionFingerprint ?? "") ||
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
  statuses: NonCncPromotedQuoteApplicationMutationApplyCommandExecutionStatus[],
): Partial<Record<NonCncPromotedQuoteApplicationMutationApplyCommandExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteApplicationMutationApplyCommandExecutionStatus, number>>>((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

function countStatuses(
  records: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteApplicationMutationApplyExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteApplicationMutationApplyExecutionStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareLex)
}

function nonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer`)
  }
  return value
}

function compareNumber(left: number, right: number): number {
  return left - right
}

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC application mutation apply execution persistence version")
  }
  return version
}

function normalizeExecutionVersion(
  version: NonCncPromotedQuoteApplicationMutationApplyExecutionRecord["executionVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION) {
    throw new Error("executionVersion is not a supported non-CNC application mutation apply execution version")
  }
  return version
}

function normalizeMode(
  mode: NonCncPromotedQuoteApplicationMutationApplyExecutionRun["mode"],
): NonCncPromotedQuoteApplicationMutationApplyExecutionRun["mode"] {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(
  status: NonCncPromotedQuoteApplicationMutationApplyExecutionStatus,
): NonCncPromotedQuoteApplicationMutationApplyExecutionStatus {
  if (
    status !== "blocked" &&
    status !== "failed" &&
    status !== "partial" &&
    status !== "pending" &&
    status !== "prepared" &&
    status !== "succeeded"
  ) {
    throw new Error("status is not a supported non-CNC application mutation apply execution status")
  }
  return status
}
