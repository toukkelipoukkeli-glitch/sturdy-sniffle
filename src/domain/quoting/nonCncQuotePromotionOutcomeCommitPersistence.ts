import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import { NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION } from "./nonCncQuotePromotionCommandPackage"
import type { NonCncQuotePromotionExecutionRun } from "./nonCncQuotePromotionExecution"
import type { NonCncQuotePromotionOutcomeCommitPlan, NonCncQuotePromotionOutcomeCommitStatus } from "./nonCncQuotePromotionOutcomeCommit"
import { NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_VERSION } from "./nonCncQuotePromotionOutcomeCommit"

export const NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION =
  "non-cnc-quote-promotion-outcome-commit-persistence.v1"

export type NonCncQuotePromotionOutcomeCommitDisposition = "commit_ready" | "review_only"

export interface NonCncQuotePromotionOutcomeCommitRecord {
  persistenceVersion: typeof NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  commitRecordId: string
  commitVersion: typeof NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_VERSION
  packageId: string
  packageVersion: NonCncQuotePromotionOutcomeCommitPlan["packageVersion"]
  selectedPlanId: string
  targetRfqId?: string
  recordedAt: string
  recordedBy: string
  status: NonCncQuotePromotionOutcomeCommitStatus
  disposition: NonCncQuotePromotionOutcomeCommitDisposition
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  executionFingerprint?: string
}

export interface NonCncQuotePromotionOutcomeCommitPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  blockedPackageIds: string[]
  commitReadyPackageIds: string[]
  latestRecord?: NonCncQuotePromotionOutcomeCommitRecord
  outcomeCount: number
  recordCount: number
  records: NonCncQuotePromotionOutcomeCommitRecord[]
  statusCounts: Partial<Record<NonCncQuotePromotionOutcomeCommitStatus, number>>
  warningCount: number
}

export interface RecordNonCncQuotePromotionOutcomeCommitInput {
  commitPlan: NonCncQuotePromotionOutcomeCommitPlan
  executionRun?: NonCncQuotePromotionExecutionRun
  recordedAt: string
  recordedBy: string
}

export interface NonCncQuotePromotionOutcomeCommitPersistenceAdapter {
  recordCommit(input: RecordNonCncQuotePromotionOutcomeCommitInput): Promise<NonCncQuotePromotionOutcomeCommitPersistenceSnapshot>
  snapshot(): NonCncQuotePromotionOutcomeCommitPersistenceSnapshot
}

export interface LocalNonCncQuotePromotionOutcomeCommitPersistenceOptions {
  initialSnapshot?: Partial<NonCncQuotePromotionOutcomeCommitPersistenceSnapshot>
}

export function createLocalNonCncQuotePromotionOutcomeCommitPersistence({
  initialSnapshot,
}: LocalNonCncQuotePromotionOutcomeCommitPersistenceOptions = {}): NonCncQuotePromotionOutcomeCommitPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordCommit(input) {
      const record = buildCommitRecord(input)
      snapshotState = normalizeSnapshot({
        records: [...snapshotState.records.filter((candidate) => candidate.commitRecordId !== record.commitRecordId), record],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncQuotePromotionOutcomeCommitPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildCommitRecord({
  commitPlan,
  executionRun,
  recordedAt,
  recordedBy,
}: RecordNonCncQuotePromotionOutcomeCommitInput): NonCncQuotePromotionOutcomeCommitRecord {
  assertExecutionMatchesCommitPlan(commitPlan, executionRun)
  if (commitPlan.commandOutcomeCount !== commitPlan.commandOutcomes.length) {
    throw new Error("commandOutcomeCount must equal commandOutcomes length")
  }

  return {
    blockerCount: commitPlan.blockerLabels.length,
    blockerLabels: [...commitPlan.blockerLabels],
    commandOutcomeCount: commitPlan.commandOutcomeCount,
    commitRecordId: buildCommitRecordId(commitPlan),
    commitVersion: commitPlan.commitVersion,
    disposition: commitPlan.status === "ready" ? "commit_ready" : "review_only",
    executionFingerprint: executionRun?.executionFingerprint,
    packageId: commitPlan.packageId,
    packageVersion: commitPlan.packageVersion,
    persistenceVersion: NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordedAt: normalizeIsoTimestamp(recordedAt, "recordedAt"),
    recordedBy: nonBlank(recordedBy, "recordedBy"),
    reviewWarnings: [...commitPlan.reviewWarnings],
    selectedPlanId: commitPlan.selectedPlanId,
    status: commitPlan.status,
    targetRfqId: commitPlan.targetRfqId,
    warningCount: commitPlan.reviewWarnings.length,
  }
}

function assertExecutionMatchesCommitPlan(
  commitPlan: NonCncQuotePromotionOutcomeCommitPlan,
  executionRun: NonCncQuotePromotionExecutionRun | undefined,
): void {
  if (!executionRun) {
    return
  }
  if (commitPlan.status !== "ready") {
    throw new Error("blocked outcome commit plans cannot be recorded with an execution run")
  }
  if (executionRun.mode !== "commit") {
    throw new Error("outcome commit execution run must use commit mode")
  }

  const mismatches = [
    executionRun.packageId === commitPlan.packageId ? undefined : "packageId",
    executionRun.packageVersion === commitPlan.packageVersion ? undefined : "packageVersion",
    executionRun.selectedPlanId === commitPlan.selectedPlanId ? undefined : "selectedPlanId",
    executionRun.targetRfqId === commitPlan.targetRfqId ? undefined : "targetRfqId",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`outcome commit execution run does not match commit plan: ${mismatches.join(", ")}`)
  }
}

function buildCommitRecordId({ packageId }: { packageId: string }): string {
  return `non-cnc-outcome-commit:${packageId}`
}

function normalizeSnapshot(
  snapshot: Partial<NonCncQuotePromotionOutcomeCommitPersistenceSnapshot> | undefined,
): NonCncQuotePromotionOutcomeCommitPersistenceSnapshot {
  const recordsById = new Map<string, NonCncQuotePromotionOutcomeCommitRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    recordsById.set(normalized.commitRecordId, normalized)
  }
  const records = [...recordsById.values()].sort(sortNewestFirst)

  return {
    blockedPackageIds: records.filter((record) => record.disposition === "review_only").map((record) => record.packageId).sort(compareLex),
    commitReadyPackageIds: records.filter((record) => record.disposition === "commit_ready").map((record) => record.packageId).sort(compareLex),
    latestRecord: records[0],
    outcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    persistenceVersion: NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(record: NonCncQuotePromotionOutcomeCommitRecord): NonCncQuotePromotionOutcomeCommitRecord {
  const normalized = {
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandOutcomeCount: nonNegativeInteger(record.commandOutcomeCount, "commandOutcomeCount"),
    commitRecordId: nonBlank(record.commitRecordId, "commitRecordId"),
    commitVersion: normalizeCommitVersion(record.commitVersion),
    disposition: normalizeDisposition(record.disposition),
    executionFingerprint:
      record.executionFingerprint === undefined ? undefined : nonBlank(record.executionFingerprint, "executionFingerprint"),
    packageId: nonBlank(record.packageId, "packageId"),
    packageVersion: normalizePackageVersion(record.packageVersion),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    selectedPlanId: nonBlank(record.selectedPlanId, "selectedPlanId"),
    status: normalizeStatus(record.status),
    targetRfqId: record.targetRfqId === undefined ? undefined : nonBlank(record.targetRfqId, "targetRfqId"),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commitRecordId !== buildCommitRecordId(normalized)) {
    throw new Error("commitRecordId must match packageId")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "commit_ready") {
    throw new Error("ready outcome commit records must use commit_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked outcome commit records must use review_only disposition")
  }

  return normalized
}

function cloneSnapshot(
  snapshot: NonCncQuotePromotionOutcomeCommitPersistenceSnapshot,
): NonCncQuotePromotionOutcomeCommitPersistenceSnapshot {
  return {
    blockedPackageIds: [...snapshot.blockedPackageIds],
    commitReadyPackageIds: [...snapshot.commitReadyPackageIds],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    outcomeCount: snapshot.outcomeCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(record: NonCncQuotePromotionOutcomeCommitRecord): NonCncQuotePromotionOutcomeCommitRecord {
  return {
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandOutcomeCount: record.commandOutcomeCount,
    commitRecordId: record.commitRecordId,
    commitVersion: record.commitVersion,
    disposition: record.disposition,
    executionFingerprint: record.executionFingerprint,
    packageId: record.packageId,
    packageVersion: record.packageVersion,
    persistenceVersion: record.persistenceVersion,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewWarnings: [...record.reviewWarnings],
    selectedPlanId: record.selectedPlanId,
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncQuotePromotionOutcomeCommitRecord,
  right: NonCncQuotePromotionOutcomeCommitRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.commitRecordId, right.commitRecordId) ||
    compareLex(left.packageId, right.packageId) ||
    compareLex(left.selectedPlanId, right.selectedPlanId)
  )
}

function countStatuses(
  records: NonCncQuotePromotionOutcomeCommitRecord[],
): Partial<Record<NonCncQuotePromotionOutcomeCommitStatus, number>> {
  return records.reduce<Partial<Record<NonCncQuotePromotionOutcomeCommitStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function nonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`)
  }
  return value
}

function normalizePersistenceVersion(
  version: NonCncQuotePromotionOutcomeCommitRecord["persistenceVersion"],
): typeof NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION {
  if (version !== NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC outcome commit persistence version")
  }
  return version
}

function normalizeCommitVersion(
  version: NonCncQuotePromotionOutcomeCommitRecord["commitVersion"],
): typeof NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_VERSION {
  if (version !== NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_VERSION) {
    throw new Error("commitVersion is not a supported non-CNC outcome commit version")
  }
  return version
}

function normalizePackageVersion(
  version: NonCncQuotePromotionOutcomeCommitRecord["packageVersion"],
): typeof NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION {
  if (version !== NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION) {
    throw new Error("packageVersion is not a supported non-CNC promotion command package version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncQuotePromotionOutcomeCommitDisposition,
): NonCncQuotePromotionOutcomeCommitDisposition {
  if (disposition !== "commit_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported non-CNC outcome commit disposition")
  }
  return disposition
}

function normalizeStatus(status: NonCncQuotePromotionOutcomeCommitStatus): NonCncQuotePromotionOutcomeCommitStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC outcome commit status")
  }
  return status
}
