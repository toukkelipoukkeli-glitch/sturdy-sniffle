import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION,
  type NonCncPromotedQuoteOfferExportPackageArtifactExecutionStatus,
  type NonCncPromotedQuoteOfferExportPackageExecutionRun,
  type NonCncPromotedQuoteOfferExportPackageExecutionStatus,
} from "./nonCncPromotedQuoteOfferExportPackageExecution"
import { NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION } from "./nonCncPromotedQuoteOfferExportPackagePlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-package-execution-persistence.v1"

export interface NonCncPromotedQuoteOfferExportPackageExecutionRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  mode: NonCncPromotedQuoteOfferExportPackageExecutionRun["mode"]
  status: NonCncPromotedQuoteOfferExportPackageExecutionStatus
  planId: string
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION
  creationPlanId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  sourceExecutionFingerprint?: string
  artifactCount: number
  blockedArtifactCount: number
  failedArtifactCount: number
  pendingArtifactCount: number
  preparedArtifactCount: number
  succeededArtifactCount: number
  pendingActionCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteOfferExportPackageExecutionPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportPackageExecutionRecord[]
  latestRun?: NonCncPromotedQuoteOfferExportPackageExecutionRecord
  planIds: string[]
  planVersions: Array<typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION>
  creationPlanIds: string[]
  packageIds: string[]
  selectedPlanIds: string[]
  targetRfqIds: string[]
  releaseExecutionFingerprints: string[]
  sourceExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportPackageExecutionStatus, number>>
  warningCount: number
  pendingActionCount: number
}

export interface NonCncPromotedQuoteOfferExportPackageExecutionPersistenceAdapter {
  recordRun(
    run: NonCncPromotedQuoteOfferExportPackageExecutionRun,
  ): Promise<NonCncPromotedQuoteOfferExportPackageExecutionPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportPackageExecutionPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportPackageExecutionPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportPackageExecutionRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportPackageExecutionPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportPackageExecutionPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportPackageExecutionPersistenceOptions = {}): NonCncPromotedQuoteOfferExportPackageExecutionPersistenceAdapter {
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

  function snapshot(): NonCncPromotedQuoteOfferExportPackageExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(
  run: NonCncPromotedQuoteOfferExportPackageExecutionRun,
): NonCncPromotedQuoteOfferExportPackageExecutionRecord {
  const statusCounts = artifactStatusCounts(run.artifacts.map((artifact) => artifact.status))
  return {
    actor: run.actor,
    artifactCount: run.artifactCount,
    blockedArtifactCount: statusCounts.blocked ?? 0,
    creationPlanId: run.creationPlanId,
    executedAt: run.executedAt,
    executionFingerprint: run.executionFingerprint,
    executionVersion: run.executionVersion,
    failedArtifactCount: statusCounts.failed ?? 0,
    mode: run.mode,
    packageId: run.packageId,
    pendingActionCount: run.nextActions.length,
    pendingArtifactCount: statusCounts.pending ?? 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION,
    planId: run.planId,
    planVersion: run.planVersion,
    preparedArtifactCount: statusCounts.prepared ?? 0,
    releaseExecutionFingerprint: run.releaseExecutionFingerprint,
    selectedPlanId: run.selectedPlanId,
    sourceExecutionFingerprint: run.sourceExecutionFingerprint,
    status: run.status,
    succeededArtifactCount: statusCounts.succeeded ?? 0,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
  }
}

function normalizeSnapshot(
  snapshot: LocalNonCncPromotedQuoteOfferExportPackageExecutionPersistenceInitialSnapshot | undefined,
): NonCncPromotedQuoteOfferExportPackageExecutionPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteOfferExportPackageExecutionRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.executionFingerprint)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.executionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    creationPlanIds: uniqueSorted(records.flatMap((record) => record.creationPlanId ? [record.creationPlanId] : [])),
    latestRun: records[0],
    packageIds: uniqueSorted(records.flatMap((record) => record.packageId ? [record.packageId] : [])),
    pendingActionCount: records.reduce((total, record) => total + record.pendingActionCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION,
    planIds: uniqueSorted(records.map((record) => record.planId)),
    planVersions: uniqueSorted(records.map((record) => record.planVersion)),
    recordCount: records.length,
    records,
    releaseExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.releaseExecutionFingerprint ? [record.releaseExecutionFingerprint] : []),
    ),
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
  record: NonCncPromotedQuoteOfferExportPackageExecutionRecord,
): NonCncPromotedQuoteOfferExportPackageExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    artifactCount: nonNegativeInteger(record.artifactCount, "artifactCount"),
    blockedArtifactCount: nonNegativeInteger(record.blockedArtifactCount, "blockedArtifactCount"),
    creationPlanId: optionalTrim(record.creationPlanId),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionVersion: normalizeExecutionVersion(record.executionVersion),
    failedArtifactCount: nonNegativeInteger(record.failedArtifactCount, "failedArtifactCount"),
    mode: normalizeMode(record.mode),
    packageId: optionalTrim(record.packageId),
    pendingActionCount: nonNegativeInteger(record.pendingActionCount, "pendingActionCount"),
    pendingArtifactCount: nonNegativeInteger(record.pendingArtifactCount, "pendingArtifactCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    planId: nonBlank(record.planId, "planId"),
    planVersion: normalizePlanVersion(record.planVersion),
    preparedArtifactCount: nonNegativeInteger(record.preparedArtifactCount, "preparedArtifactCount"),
    releaseExecutionFingerprint: optionalTrim(record.releaseExecutionFingerprint),
    selectedPlanId: optionalTrim(record.selectedPlanId),
    sourceExecutionFingerprint: optionalTrim(record.sourceExecutionFingerprint),
    status: normalizeStatus(record.status),
    succeededArtifactCount: nonNegativeInteger(record.succeededArtifactCount, "succeededArtifactCount"),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  const countedArtifacts =
    normalized.blockedArtifactCount +
    normalized.failedArtifactCount +
    normalized.pendingArtifactCount +
    normalized.preparedArtifactCount +
    normalized.succeededArtifactCount
  if (countedArtifacts !== normalized.artifactCount) {
    throw new Error("artifactCount must equal the sum of per-status artifact counts")
  }
  validateAggregateStatus(normalized)
  if (normalized.status === "blocked" && normalized.targetRfqId !== undefined) {
    throw new Error("blocked offer export package execution records cannot include a targetRfqId")
  }
  if (normalized.status === "blocked" && normalized.releaseExecutionFingerprint !== undefined) {
    throw new Error("blocked offer export package execution records cannot include a releaseExecutionFingerprint")
  }
  if (normalized.status === "blocked" && normalized.sourceExecutionFingerprint !== undefined) {
    throw new Error("blocked offer export package execution records cannot include a sourceExecutionFingerprint")
  }

  return normalized
}

function validateAggregateStatus(record: NonCncPromotedQuoteOfferExportPackageExecutionRecord): void {
  if (record.artifactCount === 0) {
    throw new Error("artifactCount must be greater than zero for offer export package execution records")
  }

  const activeStatusCount = [
    record.blockedArtifactCount,
    record.failedArtifactCount,
    record.pendingArtifactCount,
    record.preparedArtifactCount,
    record.succeededArtifactCount,
  ].filter((count) => count > 0).length

  if (record.status === "blocked" && record.blockedArtifactCount !== record.artifactCount) {
    throw new Error("blocked offer export package execution records must have only blocked artifacts")
  }
  if (record.status === "prepared" && (record.mode !== "dry_run" || record.preparedArtifactCount !== record.artifactCount)) {
    throw new Error("prepared offer export package execution records must be dry-run records with only prepared artifacts")
  }
  if (record.status === "pending" && (record.mode !== "commit" || record.pendingArtifactCount !== record.artifactCount)) {
    throw new Error("pending offer export package execution records must be commit records with only pending artifacts")
  }
  if (record.status === "succeeded" && (record.mode !== "commit" || record.succeededArtifactCount !== record.artifactCount)) {
    throw new Error("succeeded offer export package execution records must be commit records with only succeeded artifacts")
  }
  if (record.status === "failed" && (record.mode !== "commit" || record.failedArtifactCount !== record.artifactCount)) {
    throw new Error("failed offer export package execution records must be commit records with only failed artifacts")
  }
  if (
    record.status === "partial" &&
    (record.mode !== "commit" ||
      record.blockedArtifactCount > 0 ||
      record.preparedArtifactCount > 0 ||
      activeStatusCount < 2)
  ) {
    throw new Error(
      "partial offer export package execution records must be commit records with a mixed succeeded, failed, or pending artifact state",
    )
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportPackageExecutionPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportPackageExecutionPersistenceSnapshot {
  return {
    creationPlanIds: [...snapshot.creationPlanIds],
    latestRun: snapshot.latestRun ? { ...snapshot.latestRun } : undefined,
    packageIds: [...snapshot.packageIds],
    pendingActionCount: snapshot.pendingActionCount,
    persistenceVersion: snapshot.persistenceVersion,
    planIds: [...snapshot.planIds],
    planVersions: [...snapshot.planVersions],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map((record) => ({ ...record })),
    releaseExecutionFingerprints: [...snapshot.releaseExecutionFingerprints],
    selectedPlanIds: [...snapshot.selectedPlanIds],
    sourceExecutionFingerprints: [...snapshot.sourceExecutionFingerprints],
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportPackageExecutionRecord,
  right: NonCncPromotedQuoteOfferExportPackageExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.planId, right.planId) ||
    compareLex(left.planVersion, right.planVersion) ||
    compareLex(left.creationPlanId ?? "", right.creationPlanId ?? "") ||
    compareLex(left.packageId ?? "", right.packageId ?? "") ||
    compareLex(left.selectedPlanId ?? "", right.selectedPlanId ?? "") ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode) ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.releaseExecutionFingerprint ?? "", right.releaseExecutionFingerprint ?? "") ||
    compareLex(left.sourceExecutionFingerprint ?? "", right.sourceExecutionFingerprint ?? "") ||
    compareLex(left.actor, right.actor) ||
    compareLex(left.executionVersion, right.executionVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.artifactCount, right.artifactCount) ||
    compareNumber(left.blockedArtifactCount, right.blockedArtifactCount) ||
    compareNumber(left.failedArtifactCount, right.failedArtifactCount) ||
    compareNumber(left.pendingArtifactCount, right.pendingArtifactCount) ||
    compareNumber(left.preparedArtifactCount, right.preparedArtifactCount) ||
    compareNumber(left.succeededArtifactCount, right.succeededArtifactCount) ||
    compareNumber(left.pendingActionCount, right.pendingActionCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function artifactStatusCounts(
  statuses: NonCncPromotedQuoteOfferExportPackageArtifactExecutionStatus[],
): Partial<Record<NonCncPromotedQuoteOfferExportPackageArtifactExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteOfferExportPackageArtifactExecutionStatus, number>>>(
    (counts, status) => {
      counts[status] = (counts[status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportPackageExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportPackageExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportPackageExecutionStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function uniqueSorted<T extends string>(values: T[]): T[] {
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
  version: NonCncPromotedQuoteOfferExportPackageExecutionRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC offer export package execution persistence version")
  }
  return version
}

function normalizeExecutionVersion(
  version: NonCncPromotedQuoteOfferExportPackageExecutionRecord["executionVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION) {
    throw new Error("executionVersion is not a supported non-CNC offer export package execution version")
  }
  return version
}

function normalizePlanVersion(
  version: NonCncPromotedQuoteOfferExportPackageExecutionRecord["planVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION) {
    throw new Error("planVersion is not a supported non-CNC offer export package plan version")
  }
  return version
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportPackageExecutionRun["mode"],
): NonCncPromotedQuoteOfferExportPackageExecutionRun["mode"] {
  if (mode !== "commit" && mode !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportPackageExecutionStatus,
): NonCncPromotedQuoteOfferExportPackageExecutionStatus {
  if (
    status !== "blocked" &&
    status !== "failed" &&
    status !== "partial" &&
    status !== "pending" &&
    status !== "prepared" &&
    status !== "succeeded"
  ) {
    throw new Error("status is not a supported non-CNC offer export package execution status")
  }
  return status
}
