import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type { NonCncPromotedQuoteApplicationExecutionRun } from "./nonCncPromotedQuoteApplicationExecution"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION,
  type NonCncPromotedQuoteApplicationOutcomeCommitPlan,
  type NonCncPromotedQuoteApplicationOutcomeCommitStatus,
} from "./nonCncPromotedQuoteApplicationOutcomeCommit"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-application-outcome-commit-persistence.v1"

export type NonCncPromotedQuoteApplicationOutcomeCommitDisposition = "commit_ready" | "review_only"

export interface NonCncPromotedQuoteApplicationOutcomeCommitRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  commitRecordId: string
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION
  applicationId: string
  applicationRecordId: string
  packageId: string
  selectedPlanId: string
  targetRfqId: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteApplicationOutcomeCommitStatus
  disposition: NonCncPromotedQuoteApplicationOutcomeCommitDisposition
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  executionFingerprint?: string
}

export interface NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  blockedApplicationIds: string[]
  commitReadyApplicationIds: string[]
  latestRecord?: NonCncPromotedQuoteApplicationOutcomeCommitRecord
  outcomeCount: number
  recordCount: number
  records: NonCncPromotedQuoteApplicationOutcomeCommitRecord[]
  statusCounts: Partial<Record<NonCncPromotedQuoteApplicationOutcomeCommitStatus, number>>
  warningCount: number
}

export interface RecordNonCncPromotedQuoteApplicationOutcomeCommitInput {
  commitPlan: NonCncPromotedQuoteApplicationOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteApplicationExecutionRun
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteApplicationOutcomeCommitPersistenceAdapter {
  recordCommit(
    input: RecordNonCncPromotedQuoteApplicationOutcomeCommitInput,
  ): Promise<NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteApplicationOutcomeCommitPersistenceOptions {
  initialSnapshot?: Partial<NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot>
}

export function createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteApplicationOutcomeCommitPersistenceOptions = {}): NonCncPromotedQuoteApplicationOutcomeCommitPersistenceAdapter {
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

  function snapshot(): NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildCommitRecord({
  commitPlan,
  executionRun,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteApplicationOutcomeCommitInput): NonCncPromotedQuoteApplicationOutcomeCommitRecord {
  assertExecutionMatchesCommitPlan(commitPlan, executionRun)
  if (commitPlan.commandOutcomeCount !== commitPlan.commandOutcomes.length) {
    throw new Error("commandOutcomeCount must equal commandOutcomes length")
  }

  return {
    applicationId: commitPlan.applicationId,
    applicationRecordId: commitPlan.applicationRecordId,
    blockerCount: commitPlan.blockerLabels.length,
    blockerLabels: [...commitPlan.blockerLabels],
    commandOutcomeCount: commitPlan.commandOutcomeCount,
    commitRecordId: buildCommitRecordId(commitPlan),
    commitVersion: commitPlan.commitVersion,
    disposition: commitPlan.status === "ready" ? "commit_ready" : "review_only",
    executionFingerprint: executionRun?.executionFingerprint,
    packageId: commitPlan.packageId,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
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
  commitPlan: NonCncPromotedQuoteApplicationOutcomeCommitPlan,
  executionRun: NonCncPromotedQuoteApplicationExecutionRun | undefined,
): void {
  if (!executionRun) {
    if (commitPlan.status === "ready") {
      throw new Error("ready application outcome commit plans require a commit execution run")
    }
    return
  }
  if (commitPlan.status !== "ready") {
    throw new Error("blocked application outcome commit plans cannot be recorded with an execution run")
  }
  if (executionRun.mode !== "commit") {
    throw new Error("application outcome commit execution run must use commit mode")
  }

  const mismatches = [
    executionRun.applicationId === commitPlan.applicationId ? undefined : "applicationId",
    executionRun.applicationRecordId === commitPlan.applicationRecordId ? undefined : "applicationRecordId",
    executionRun.packageId === commitPlan.packageId ? undefined : "packageId",
    executionRun.selectedPlanId === commitPlan.selectedPlanId ? undefined : "selectedPlanId",
    executionRun.targetRfqId === commitPlan.targetRfqId ? undefined : "targetRfqId",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`application outcome commit execution run does not match commit plan: ${mismatches.join(", ")}`)
  }
}

function buildCommitRecordId({ applicationRecordId }: { applicationRecordId: string }): string {
  return `non-cnc-application-outcome-commit:${applicationRecordId}`
}

function normalizeSnapshot(
  snapshot: Partial<NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot> | undefined,
): NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot {
  const recordsById = new Map<string, NonCncPromotedQuoteApplicationOutcomeCommitRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsById.get(normalized.commitRecordId)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsById.set(normalized.commitRecordId, normalized)
    }
  }
  const records = [...recordsById.values()].sort(sortNewestFirst)

  return {
    blockedApplicationIds: records
      .filter((record) => record.disposition === "review_only")
      .map((record) => record.applicationId)
      .sort(compareLex),
    commitReadyApplicationIds: records
      .filter((record) => record.disposition === "commit_ready")
      .map((record) => record.applicationId)
      .sort(compareLex),
    latestRecord: records[0],
    outcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteApplicationOutcomeCommitRecord,
): NonCncPromotedQuoteApplicationOutcomeCommitRecord {
  const normalized = {
    applicationId: nonBlank(record.applicationId, "applicationId"),
    applicationRecordId: nonBlank(record.applicationRecordId, "applicationRecordId"),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandOutcomeCount: nonNegativeInteger(record.commandOutcomeCount, "commandOutcomeCount"),
    commitRecordId: nonBlank(record.commitRecordId, "commitRecordId"),
    commitVersion: normalizeCommitVersion(record.commitVersion),
    disposition: normalizeDisposition(record.disposition),
    executionFingerprint:
      record.executionFingerprint === undefined ? undefined : nonBlank(record.executionFingerprint, "executionFingerprint"),
    packageId: nonBlank(record.packageId, "packageId"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    selectedPlanId: nonBlank(record.selectedPlanId, "selectedPlanId"),
    status: normalizeStatus(record.status),
    targetRfqId: nonBlank(record.targetRfqId, "targetRfqId"),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commitRecordId !== buildCommitRecordId(normalized)) {
    throw new Error("commitRecordId must match applicationRecordId")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "commit_ready") {
    throw new Error("ready application outcome commit records must use commit_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked application outcome commit records must use review_only disposition")
  }
  if (normalized.status === "ready" && normalized.executionFingerprint === undefined) {
    throw new Error("ready application outcome commit records require an executionFingerprint")
  }
  if (normalized.status === "blocked" && normalized.executionFingerprint !== undefined) {
    throw new Error("blocked application outcome commit records cannot include an executionFingerprint")
  }

  return normalized
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot,
): NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot {
  return {
    blockedApplicationIds: [...snapshot.blockedApplicationIds],
    commitReadyApplicationIds: [...snapshot.commitReadyApplicationIds],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    outcomeCount: snapshot.outcomeCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteApplicationOutcomeCommitRecord,
): NonCncPromotedQuoteApplicationOutcomeCommitRecord {
  return {
    applicationId: record.applicationId,
    applicationRecordId: record.applicationRecordId,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandOutcomeCount: record.commandOutcomeCount,
    commitRecordId: record.commitRecordId,
    commitVersion: record.commitVersion,
    disposition: record.disposition,
    executionFingerprint: record.executionFingerprint,
    packageId: record.packageId,
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
  left: NonCncPromotedQuoteApplicationOutcomeCommitRecord,
  right: NonCncPromotedQuoteApplicationOutcomeCommitRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.commitRecordId, right.commitRecordId) ||
    compareLex(left.applicationId, right.applicationId) ||
    compareLex(left.selectedPlanId, right.selectedPlanId)
  )
}

function countStatuses(
  records: NonCncPromotedQuoteApplicationOutcomeCommitRecord[],
): Partial<Record<NonCncPromotedQuoteApplicationOutcomeCommitStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteApplicationOutcomeCommitStatus, number>>>((counts, record) => {
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
  version: NonCncPromotedQuoteApplicationOutcomeCommitRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC application outcome commit persistence version")
  }
  return version
}

function normalizeCommitVersion(
  version: NonCncPromotedQuoteApplicationOutcomeCommitRecord["commitVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION) {
    throw new Error("commitVersion is not a supported non-CNC application outcome commit version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteApplicationOutcomeCommitDisposition,
): NonCncPromotedQuoteApplicationOutcomeCommitDisposition {
  if (disposition !== "commit_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported non-CNC application outcome commit disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteApplicationOutcomeCommitStatus,
): NonCncPromotedQuoteApplicationOutcomeCommitStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC application outcome commit status")
  }
  return status
}
