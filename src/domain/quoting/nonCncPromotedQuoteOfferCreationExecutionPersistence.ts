import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_VERSION,
  type NonCncPromotedQuoteOfferCreationCommandExecutionStatus,
  type NonCncPromotedQuoteOfferCreationExecutionRun,
  type NonCncPromotedQuoteOfferCreationExecutionStatus,
} from "./nonCncPromotedQuoteOfferCreationExecution"

export const NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-creation-execution-persistence.v1"

export interface NonCncPromotedQuoteOfferCreationExecutionRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  mode: NonCncPromotedQuoteOfferCreationExecutionRun["mode"]
  status: NonCncPromotedQuoteOfferCreationExecutionStatus
  creationPlanId: string
  packageId: string
  selectedPlanId: string
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  commandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  succeededCommandCount: number
  pendingActionCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferCreationExecutionRecord[]
  latestRun?: NonCncPromotedQuoteOfferCreationExecutionRecord
  creationPlanIds: string[]
  packageIds: string[]
  selectedPlanIds: string[]
  targetRfqIds: string[]
  releaseExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferCreationExecutionStatus, number>>
  warningCount: number
  pendingActionCount: number
}

export interface NonCncPromotedQuoteOfferCreationExecutionPersistenceAdapter {
  recordRun(
    run: NonCncPromotedQuoteOfferCreationExecutionRun,
  ): Promise<NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferCreationExecutionPersistenceOptions {
  initialSnapshot?: Partial<NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot>
}

export function createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferCreationExecutionPersistenceOptions = {}): NonCncPromotedQuoteOfferCreationExecutionPersistenceAdapter {
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

  function snapshot(): NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(
  run: NonCncPromotedQuoteOfferCreationExecutionRun,
): NonCncPromotedQuoteOfferCreationExecutionRecord {
  const statusCounts = commandStatusCounts(run.commands.map((command) => command.status))
  return {
    actor: run.actor,
    blockedCommandCount: statusCounts.blocked ?? 0,
    commandCount: run.commands.length,
    creationPlanId: run.creationPlanId,
    executedAt: run.executedAt,
    executionFingerprint: run.executionFingerprint,
    executionVersion: run.executionVersion,
    failedCommandCount: statusCounts.failed ?? 0,
    mode: run.mode,
    packageId: run.packageId,
    pendingActionCount: run.nextActions.length,
    pendingCommandCount: statusCounts.pending ?? 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION,
    preparedCommandCount: statusCounts.prepared ?? 0,
    releaseExecutionFingerprint: run.releaseExecutionFingerprint,
    selectedPlanId: run.selectedPlanId,
    status: run.status,
    succeededCommandCount: statusCounts.succeeded ?? 0,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
  }
}

function normalizeSnapshot(
  snapshot: Partial<NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot> | undefined,
): NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteOfferCreationExecutionRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.executionFingerprint)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.executionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    creationPlanIds: uniqueSorted(records.map((record) => record.creationPlanId)),
    latestRun: records[0],
    packageIds: uniqueSorted(records.map((record) => record.packageId)),
    pendingActionCount: records.reduce((total, record) => total + record.pendingActionCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    releaseExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.releaseExecutionFingerprint ? [record.releaseExecutionFingerprint] : []),
    ),
    selectedPlanIds: uniqueSorted(records.map((record) => record.selectedPlanId)),
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferCreationExecutionRecord,
): NonCncPromotedQuoteOfferCreationExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    creationPlanId: nonBlank(record.creationPlanId, "creationPlanId"),
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
    releaseExecutionFingerprint: optionalTrim(record.releaseExecutionFingerprint),
    selectedPlanId: nonBlank(record.selectedPlanId, "selectedPlanId"),
    status: normalizeStatus(record.status),
    succeededCommandCount: nonNegativeInteger(record.succeededCommandCount, "succeededCommandCount"),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  const countedCommands =
    normalized.blockedCommandCount +
    normalized.failedCommandCount +
    normalized.pendingCommandCount +
    normalized.preparedCommandCount +
    normalized.succeededCommandCount
  if (countedCommands !== normalized.commandCount) {
    throw new Error("commandCount must equal the sum of per-status command counts")
  }
  validateAggregateStatus(normalized)
  if (normalized.status === "blocked" && normalized.targetRfqId !== undefined) {
    throw new Error("blocked offer creation execution records cannot include a targetRfqId")
  }
  if (normalized.status === "blocked" && normalized.releaseExecutionFingerprint !== undefined) {
    throw new Error("blocked offer creation execution records cannot include a releaseExecutionFingerprint")
  }

  return normalized
}

function validateAggregateStatus(record: NonCncPromotedQuoteOfferCreationExecutionRecord): void {
  if (record.commandCount === 0) {
    throw new Error("commandCount must be greater than zero for offer creation execution records")
  }

  const activeStatusCount = [
    record.blockedCommandCount,
    record.failedCommandCount,
    record.pendingCommandCount,
    record.preparedCommandCount,
    record.succeededCommandCount,
  ].filter((count) => count > 0).length

  if (record.status === "blocked" && record.blockedCommandCount !== record.commandCount) {
    throw new Error("blocked offer creation execution records must have only blocked commands")
  }
  if (record.status === "prepared" && (record.mode !== "dry_run" || record.preparedCommandCount !== record.commandCount)) {
    throw new Error("prepared offer creation execution records must be dry-run records with only prepared commands")
  }
  if (record.status === "pending" && (record.mode !== "commit" || record.pendingCommandCount !== record.commandCount)) {
    throw new Error("pending offer creation execution records must be commit records with only pending commands")
  }
  if (record.status === "succeeded" && (record.mode !== "commit" || record.succeededCommandCount !== record.commandCount)) {
    throw new Error("succeeded offer creation execution records must be commit records with only succeeded commands")
  }
  if (record.status === "failed" && (record.mode !== "commit" || record.failedCommandCount !== record.commandCount)) {
    throw new Error("failed offer creation execution records must be commit records with only failed commands")
  }
  if (
    record.status === "partial" &&
    (record.mode !== "commit" ||
      record.blockedCommandCount > 0 ||
      record.preparedCommandCount > 0 ||
      activeStatusCount < 2)
  ) {
    throw new Error(
      "partial offer creation execution records must be commit records with a mixed succeeded, failed, or pending command state",
    )
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot,
): NonCncPromotedQuoteOfferCreationExecutionPersistenceSnapshot {
  return {
    creationPlanIds: [...snapshot.creationPlanIds],
    latestRun: snapshot.latestRun ? { ...snapshot.latestRun } : undefined,
    packageIds: [...snapshot.packageIds],
    pendingActionCount: snapshot.pendingActionCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map((record) => ({ ...record })),
    releaseExecutionFingerprints: [...snapshot.releaseExecutionFingerprints],
    selectedPlanIds: [...snapshot.selectedPlanIds],
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferCreationExecutionRecord,
  right: NonCncPromotedQuoteOfferCreationExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.creationPlanId, right.creationPlanId) ||
    compareLex(left.packageId, right.packageId) ||
    compareLex(left.selectedPlanId, right.selectedPlanId) ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode) ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.releaseExecutionFingerprint ?? "", right.releaseExecutionFingerprint ?? "") ||
    compareLex(left.actor, right.actor) ||
    compareLex(left.executionVersion, right.executionVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.failedCommandCount, right.failedCommandCount) ||
    compareNumber(left.pendingCommandCount, right.pendingCommandCount) ||
    compareNumber(left.preparedCommandCount, right.preparedCommandCount) ||
    compareNumber(left.succeededCommandCount, right.succeededCommandCount) ||
    compareNumber(left.pendingActionCount, right.pendingActionCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function commandStatusCounts(
  statuses: NonCncPromotedQuoteOfferCreationCommandExecutionStatus[],
): Partial<Record<NonCncPromotedQuoteOfferCreationCommandExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteOfferCreationCommandExecutionStatus, number>>>((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

function countStatuses(
  records: NonCncPromotedQuoteOfferCreationExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferCreationExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferCreationExecutionStatus, number>>>((counts, record) => {
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
  version: NonCncPromotedQuoteOfferCreationExecutionRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC offer creation execution persistence version")
  }
  return version
}

function normalizeExecutionVersion(
  version: NonCncPromotedQuoteOfferCreationExecutionRecord["executionVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_VERSION) {
    throw new Error("executionVersion is not a supported non-CNC offer creation execution version")
  }
  return version
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferCreationExecutionRun["mode"],
): NonCncPromotedQuoteOfferCreationExecutionRun["mode"] {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferCreationExecutionStatus,
): NonCncPromotedQuoteOfferCreationExecutionStatus {
  if (
    status !== "blocked" &&
    status !== "failed" &&
    status !== "partial" &&
    status !== "pending" &&
    status !== "prepared" &&
    status !== "succeeded"
  ) {
    throw new Error("status is not a supported non-CNC offer creation execution status")
  }
  return status
}
