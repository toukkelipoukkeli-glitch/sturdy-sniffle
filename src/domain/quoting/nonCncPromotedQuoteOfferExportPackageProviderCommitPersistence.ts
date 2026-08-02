import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION,
  type NonCncPromotedQuoteOfferExportPackageExecutionStatus,
} from "./nonCncPromotedQuoteOfferExportPackageExecution"
import { NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION } from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitRunResult,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommit"
import type { NonCncPromotedQuoteOfferExportPackageProviderResultStatus } from "./nonCncPromotedQuoteOfferExportPackageProvider"
import type { NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus } from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-package-provider-commit-persistence.v1"

export interface NonCncPromotedQuoteOfferExportPackageProviderCommitRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_PERSISTENCE_VERSION
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  executionStatus: NonCncPromotedQuoteOfferExportPackageExecutionStatus
  providerStatus: NonCncPromotedQuoteOfferExportPackageProviderResultStatus
  readModelStatus: NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus
  planId: string
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION
  planFingerprint: string
  creationPlanId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId: string
  releaseExecutionFingerprint: string
  sourceExecutionFingerprint: string
  artifactOutcomeCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord[]
  latestRun?: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord
  executionFingerprints: string[]
  planIds: string[]
  planFingerprints: string[]
  packageIds: string[]
  targetRfqIds: string[]
  releaseExecutionFingerprints: string[]
  sourceExecutionFingerprints: string[]
  executionStatusCounts: Partial<Record<NonCncPromotedQuoteOfferExportPackageExecutionStatus, number>>
  providerStatusCounts: Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderResultStatus, number>>
  readModelStatusCounts: Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus, number>>
  artifactOutcomeCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceAdapter {
  recordCommitRun(
    runResult: NonCncPromotedQuoteOfferExportPackageProviderCommitRunResult,
  ): Promise<NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceOptions = {}): NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordCommitRun(runResult) {
      const record = buildProviderCommitRecord(runResult)
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

  function snapshot(): NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function buildProviderCommitRecord(
  runResult: NonCncPromotedQuoteOfferExportPackageProviderCommitRunResult,
): NonCncPromotedQuoteOfferExportPackageProviderCommitRecord {
  const { commitPlan, executionRun } = runResult
  if (commitPlan.status !== "ready" || !executionRun) {
    throw new Error("only ready non-CNC offer export package provider commit runs can be persisted")
  }

  return normalizeRecord({
    actor: executionRun.actor,
    artifactOutcomeCount: commitPlan.artifactOutcomeCount,
    commitVersion: commitPlan.commitVersion,
    creationPlanId: commitPlan.creationPlanId,
    executedAt: executionRun.executedAt,
    executionFingerprint: executionRun.executionFingerprint,
    executionStatus: executionRun.status,
    executionVersion: executionRun.executionVersion,
    packageId: commitPlan.packageId,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_PERSISTENCE_VERSION,
    planFingerprint: commitPlan.planFingerprint,
    planId: commitPlan.planId,
    planVersion: commitPlan.planVersion,
    providerStatus: commitPlan.providerStatus,
    readModelStatus: commitPlan.readModelStatus,
    releaseExecutionFingerprint: requiredNonBlank(commitPlan.releaseExecutionFingerprint, "releaseExecutionFingerprint"),
    selectedPlanId: commitPlan.selectedPlanId,
    sourceExecutionFingerprint: requiredNonBlank(commitPlan.sourceExecutionFingerprint, "sourceExecutionFingerprint"),
    targetRfqId: requiredNonBlank(commitPlan.targetRfqId, "targetRfqId"),
    warningCount: executionRun.warnings.length,
  })
}

function normalizeSnapshot(
  snapshot: LocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceInitialSnapshot | undefined,
): NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteOfferExportPackageProviderCommitRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.executionFingerprint)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.executionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    artifactOutcomeCount: records.reduce((total, record) => total + record.artifactOutcomeCount, 0),
    executionFingerprints: uniqueSorted(records.map((record) => record.executionFingerprint)),
    executionStatusCounts: countExecutionStatuses(records),
    latestRun: records[0],
    packageIds: uniqueSorted(records.flatMap((record) => record.packageId ? [record.packageId] : [])),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_PERSISTENCE_VERSION,
    planFingerprints: uniqueSorted(records.map((record) => record.planFingerprint)),
    planIds: uniqueSorted(records.map((record) => record.planId)),
    providerStatusCounts: countProviderStatuses(records),
    readModelStatusCounts: countReadModelStatuses(records),
    recordCount: records.length,
    records,
    releaseExecutionFingerprints: uniqueSorted(records.map((record) => record.releaseExecutionFingerprint)),
    sourceExecutionFingerprints: uniqueSorted(records.map((record) => record.sourceExecutionFingerprint)),
    targetRfqIds: uniqueSorted(records.map((record) => record.targetRfqId)),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord,
): NonCncPromotedQuoteOfferExportPackageProviderCommitRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    artifactOutcomeCount: nonNegativeInteger(record.artifactOutcomeCount, "artifactOutcomeCount"),
    commitVersion: normalizeCommitVersion(record.commitVersion),
    creationPlanId: optionalTrim(record.creationPlanId),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionStatus: normalizeExecutionStatus(record.executionStatus),
    executionVersion: normalizeExecutionVersion(record.executionVersion),
    packageId: optionalTrim(record.packageId),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    planFingerprint: nonBlank(record.planFingerprint, "planFingerprint"),
    planId: nonBlank(record.planId, "planId"),
    planVersion: normalizePlanVersion(record.planVersion),
    providerStatus: normalizeProviderStatus(record.providerStatus),
    readModelStatus: normalizeReadModelStatus(record.readModelStatus),
    releaseExecutionFingerprint: nonBlank(record.releaseExecutionFingerprint, "releaseExecutionFingerprint"),
    selectedPlanId: optionalTrim(record.selectedPlanId),
    sourceExecutionFingerprint: nonBlank(record.sourceExecutionFingerprint, "sourceExecutionFingerprint"),
    targetRfqId: nonBlank(record.targetRfqId, "targetRfqId"),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.executionStatus !== "succeeded") {
    throw new Error("provider commit records must be succeeded execution records")
  }
  if (normalized.providerStatus !== "applied") {
    throw new Error("provider commit records must have applied provider status")
  }
  if (normalized.readModelStatus !== "ready_to_commit") {
    throw new Error("provider commit records must come from a ready read model")
  }
  if (normalized.artifactOutcomeCount <= 0) {
    throw new Error("provider commit records must include artifact outcomes")
  }

  return normalized
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportPackageProviderCommitPersistenceSnapshot {
  return {
    artifactOutcomeCount: snapshot.artifactOutcomeCount,
    executionFingerprints: [...snapshot.executionFingerprints],
    executionStatusCounts: { ...snapshot.executionStatusCounts },
    latestRun: snapshot.latestRun ? { ...snapshot.latestRun } : undefined,
    packageIds: [...snapshot.packageIds],
    persistenceVersion: snapshot.persistenceVersion,
    planFingerprints: [...snapshot.planFingerprints],
    planIds: [...snapshot.planIds],
    providerStatusCounts: { ...snapshot.providerStatusCounts },
    readModelStatusCounts: { ...snapshot.readModelStatusCounts },
    recordCount: snapshot.recordCount,
    records: snapshot.records.map((record) => ({ ...record })),
    releaseExecutionFingerprints: [...snapshot.releaseExecutionFingerprints],
    sourceExecutionFingerprints: [...snapshot.sourceExecutionFingerprints],
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord,
  right: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.planId, right.planId) ||
    compareLex(left.planFingerprint, right.planFingerprint) ||
    compareLex(left.actor, right.actor) ||
    compareNumber(left.artifactOutcomeCount, right.artifactOutcomeCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function countExecutionStatuses(
  records: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportPackageExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportPackageExecutionStatus, number>>>((counts, record) => {
    counts[record.executionStatus] = (counts[record.executionStatus] ?? 0) + 1
    return counts
  }, {})
}

function countProviderStatuses(
  records: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderResultStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderResultStatus, number>>>(
    (counts, record) => {
      counts[record.providerStatus] = (counts[record.providerStatus] ?? 0) + 1
      return counts
    },
    {},
  )
}

function countReadModelStatuses(
  records: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus, number>>>(
    (counts, record) => {
      counts[record.readModelStatus] = (counts[record.readModelStatus] ?? 0) + 1
      return counts
    },
    {},
  )
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

function requiredNonBlank(value: string | undefined, fieldName: string): string {
  return nonBlank(value ?? "", fieldName)
}

function compareNumber(left: number, right: number): number {
  return left - right
}

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC offer export package provider commit persistence version")
  }
  return version
}

function normalizeCommitVersion(
  version: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord["commitVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION) {
    throw new Error("commitVersion is not a supported non-CNC offer export package provider commit version")
  }
  return version
}

function normalizeExecutionVersion(
  version: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord["executionVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION) {
    throw new Error("executionVersion is not a supported non-CNC offer export package execution version")
  }
  return version
}

function normalizePlanVersion(
  version: NonCncPromotedQuoteOfferExportPackageProviderCommitRecord["planVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION) {
    throw new Error("planVersion is not a supported non-CNC offer export package plan version")
  }
  return version
}

function normalizeExecutionStatus(
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
    throw new Error("executionStatus is not a supported non-CNC offer export package execution status")
  }
  return status
}

function normalizeProviderStatus(
  status: NonCncPromotedQuoteOfferExportPackageProviderResultStatus,
): NonCncPromotedQuoteOfferExportPackageProviderResultStatus {
  if (status !== "applied" && status !== "blocked") {
    throw new Error("providerStatus must be applied or blocked")
  }
  return status
}

function normalizeReadModelStatus(
  status: NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus {
  if (status !== "blocked" && status !== "ready_to_commit") {
    throw new Error("readModelStatus is not a supported non-CNC offer export package provider read-model status")
  }
  return status
}
