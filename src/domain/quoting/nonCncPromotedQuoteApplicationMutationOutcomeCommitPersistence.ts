import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteApplicationMutationCommandOutcomeInput,
  NonCncPromotedQuoteApplicationMutationExecutionRun,
  NonCncPromotedQuoteApplicationMutationExecutionStatus,
} from "./nonCncPromotedQuoteApplicationMutationExecution"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION,
  type NonCncPromotedQuoteApplicationMutationOutcomeCommitPlan,
  type NonCncPromotedQuoteApplicationMutationOutcomeCommitStatus,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommit"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-application-mutation-outcome-commit-persistence.v1"

export type NonCncPromotedQuoteApplicationMutationOutcomeCommitDisposition = "commit_ready" | "review_only"

export interface NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  commitRecordId: string
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION
  mutationPackageId: string
  sourceExecutionFingerprint: string
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteApplicationMutationOutcomeCommitStatus
  disposition: NonCncPromotedQuoteApplicationMutationOutcomeCommitDisposition
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  commandOutcomes: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput[]
  executionFingerprint?: string
  executionStatus?: NonCncPromotedQuoteApplicationMutationExecutionStatus
}

export interface NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  blockedMutationPackageIds: string[]
  commitReadyMutationPackageIds: string[]
  latestRecord?: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord
  outcomeCount: number
  recordCount: number
  records: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord[]
  statusCounts: Partial<Record<NonCncPromotedQuoteApplicationMutationOutcomeCommitStatus, number>>
  warningCount: number
}

export interface RecordNonCncPromotedQuoteApplicationMutationOutcomeCommitInput {
  commitPlan: NonCncPromotedQuoteApplicationMutationOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteApplicationMutationExecutionRun
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceAdapter {
  recordCommit(
    input: RecordNonCncPromotedQuoteApplicationMutationOutcomeCommitInput,
  ): Promise<NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceOptions {
  initialSnapshot?: Partial<NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot>
}

export function createLocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceOptions = {}): NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordCommit(input) {
      const record = buildCommitRecord(input)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records.filter((candidate) => candidate.commitRecordId !== record.commitRecordId),
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildCommitRecord({
  commitPlan,
  executionRun,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteApplicationMutationOutcomeCommitInput): NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord {
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
    commandOutcomes: commitPlan.commandOutcomes.map(cloneOutcome),
    commitRecordId: buildCommitRecordId(commitPlan),
    commitVersion: commitPlan.commitVersion,
    disposition: commitPlan.status === "ready" ? "commit_ready" : "review_only",
    executionFingerprint: executionRun?.executionFingerprint,
    executionStatus: executionRun?.status,
    mutationPackageId: commitPlan.mutationPackageId,
    packageId: commitPlan.packageId,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordedAt: normalizeIsoTimestamp(recordedAt, "recordedAt"),
    recordedBy: nonBlank(recordedBy, "recordedBy"),
    reviewWarnings: [...commitPlan.reviewWarnings],
    selectedPlanId: commitPlan.selectedPlanId,
    sourceExecutionFingerprint: commitPlan.sourceExecutionFingerprint,
    status: commitPlan.status,
    targetRfqId: commitPlan.targetRfqId,
    warningCount: commitPlan.reviewWarnings.length,
  }
}

function assertExecutionMatchesCommitPlan(
  commitPlan: NonCncPromotedQuoteApplicationMutationOutcomeCommitPlan,
  executionRun: NonCncPromotedQuoteApplicationMutationExecutionRun | undefined,
): void {
  if (!executionRun) {
    if (commitPlan.status === "ready") {
      throw new Error("ready application mutation outcome commit plans require a commit execution run")
    }
    return
  }
  if (commitPlan.status !== "ready") {
    throw new Error("blocked application mutation outcome commit plans cannot be recorded with an execution run")
  }
  if (executionRun.mode !== "commit") {
    throw new Error("application mutation outcome commit execution run must use commit mode")
  }

  const mismatches = [
    executionRun.mutationPackageId === commitPlan.mutationPackageId ? undefined : "mutationPackageId",
    executionRun.applicationId === commitPlan.applicationId ? undefined : "applicationId",
    executionRun.applicationRecordId === commitPlan.applicationRecordId ? undefined : "applicationRecordId",
    executionRun.packageId === commitPlan.packageId ? undefined : "packageId",
    executionRun.selectedPlanId === commitPlan.selectedPlanId ? undefined : "selectedPlanId",
    executionRun.targetRfqId === commitPlan.targetRfqId ? undefined : "targetRfqId",
    executionMatchesCommandOutcomes(executionRun, commitPlan) ? undefined : "commandOutcomes",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`application mutation outcome commit execution run does not match commit plan: ${mismatches.join(", ")}`)
  }
}

function executionMatchesCommandOutcomes(
  executionRun: NonCncPromotedQuoteApplicationMutationExecutionRun,
  commitPlan: NonCncPromotedQuoteApplicationMutationOutcomeCommitPlan,
): boolean {
  if (executionRun.commands.length !== commitPlan.commandOutcomes.length) {
    return false
  }
  return commitPlan.commandOutcomes.every((outcome, index) => {
    const command = executionRun.commands[index]
    return (
      command !== undefined &&
      command.key === outcome.key &&
      command.status === outcome.status &&
      command.externalId === outcome.externalId &&
      command.message === outcome.message &&
      compareStringArrays(command.warnings, outcome.warnings ?? [])
    )
  })
}

function buildCommitRecordId({ sourceExecutionFingerprint }: { sourceExecutionFingerprint: string }): string {
  return `non-cnc-application-mutation-outcome-commit:${sourceExecutionFingerprint}`
}

function normalizeSnapshot(
  snapshot: Partial<NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot> | undefined,
): NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot {
  const recordsById = new Map<string, NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsById.get(normalized.commitRecordId)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsById.set(normalized.commitRecordId, normalized)
    }
  }
  const records = [...recordsById.values()].sort(sortNewestFirst)

  return {
    blockedMutationPackageIds: records
      .filter((record) => record.disposition === "review_only")
      .map((record) => record.mutationPackageId)
      .sort(compareLex),
    commitReadyMutationPackageIds: records
      .filter((record) => record.disposition === "commit_ready")
      .map((record) => record.mutationPackageId)
      .sort(compareLex),
    latestRecord: records[0],
    outcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord,
): NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord {
  const normalized = {
    applicationId: optionalTrim(record.applicationId),
    applicationRecordId: optionalTrim(record.applicationRecordId),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandOutcomeCount: nonNegativeInteger(record.commandOutcomeCount, "commandOutcomeCount"),
    commandOutcomes: record.commandOutcomes.map(normalizeOutcome),
    commitRecordId: nonBlank(record.commitRecordId, "commitRecordId"),
    commitVersion: normalizeCommitVersion(record.commitVersion),
    disposition: normalizeDisposition(record.disposition),
    executionFingerprint:
      record.executionFingerprint === undefined ? undefined : nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionStatus: record.executionStatus === undefined ? undefined : normalizeExecutionStatus(record.executionStatus),
    mutationPackageId: nonBlank(record.mutationPackageId, "mutationPackageId"),
    packageId: optionalTrim(record.packageId),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    selectedPlanId: optionalTrim(record.selectedPlanId),
    sourceExecutionFingerprint: nonBlank(record.sourceExecutionFingerprint, "sourceExecutionFingerprint"),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commitRecordId !== buildCommitRecordId(normalized)) {
    throw new Error("commitRecordId must match sourceExecutionFingerprint")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.commandOutcomeCount !== normalized.commandOutcomes.length) {
    throw new Error("commandOutcomeCount must equal commandOutcomes length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "commit_ready") {
    throw new Error("ready application mutation outcome commit records must use commit_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked application mutation outcome commit records must use review_only disposition")
  }
  if (normalized.status === "ready" && !normalized.executionFingerprint) {
    throw new Error("ready application mutation outcome commit records require an executionFingerprint")
  }
  if (normalized.status === "ready" && normalized.executionStatus === undefined) {
    throw new Error("ready application mutation outcome commit records require an executionStatus")
  }
  if (normalized.status === "blocked" && normalized.executionFingerprint !== undefined) {
    throw new Error("blocked application mutation outcome commit records cannot include an executionFingerprint")
  }
  if (normalized.status === "blocked" && normalized.executionStatus !== undefined) {
    throw new Error("blocked application mutation outcome commit records cannot include an executionStatus")
  }

  return normalized
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot,
): NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot {
  return {
    blockedMutationPackageIds: [...snapshot.blockedMutationPackageIds],
    commitReadyMutationPackageIds: [...snapshot.commitReadyMutationPackageIds],
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
  record: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord,
): NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord {
  return {
    applicationId: record.applicationId,
    applicationRecordId: record.applicationRecordId,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandOutcomeCount: record.commandOutcomeCount,
    commandOutcomes: record.commandOutcomes.map(cloneOutcome),
    commitRecordId: record.commitRecordId,
    commitVersion: record.commitVersion,
    disposition: record.disposition,
    executionFingerprint: record.executionFingerprint,
    executionStatus: record.executionStatus,
    mutationPackageId: record.mutationPackageId,
    packageId: record.packageId,
    persistenceVersion: record.persistenceVersion,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewWarnings: [...record.reviewWarnings],
    selectedPlanId: record.selectedPlanId,
    sourceExecutionFingerprint: record.sourceExecutionFingerprint,
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function cloneOutcome(
  outcome: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput,
): NonCncPromotedQuoteApplicationMutationCommandOutcomeInput {
  return {
    externalId: outcome.externalId,
    key: outcome.key,
    message: outcome.message,
    status: outcome.status,
    warnings: outcome.warnings ? [...outcome.warnings] : undefined,
  }
}

function normalizeOutcome(
  outcome: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput,
): NonCncPromotedQuoteApplicationMutationCommandOutcomeInput {
  const normalized = {
    externalId: optionalTrim(outcome.externalId),
    key: nonBlank(outcome.key, "commandOutcome.key"),
    message: optionalTrim(outcome.message),
    status: normalizeOutcomeStatus(outcome.status),
    warnings: outcome.warnings?.map((warning) => nonBlank(warning, "commandOutcome.warning")),
  }
  return normalized
}

function sortNewestFirst(
  left: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord,
  right: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.commitRecordId, right.commitRecordId) ||
    compareLex(left.mutationPackageId, right.mutationPackageId) ||
    compareLex(left.applicationId ?? "", right.applicationId ?? "") ||
    compareLex(left.selectedPlanId ?? "", right.selectedPlanId ?? "")
  )
}

function countStatuses(
  records: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord[],
): Partial<Record<NonCncPromotedQuoteApplicationMutationOutcomeCommitStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteApplicationMutationOutcomeCommitStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function compareStringArrays(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function nonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer`)
  }
  return value
}

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC application mutation outcome commit persistence version")
  }
  return version
}

function normalizeCommitVersion(
  version: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord["commitVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION) {
    throw new Error("commitVersion is not a supported non-CNC application mutation outcome commit version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteApplicationMutationOutcomeCommitDisposition,
): NonCncPromotedQuoteApplicationMutationOutcomeCommitDisposition {
  if (disposition !== "commit_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported non-CNC application mutation outcome commit disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteApplicationMutationOutcomeCommitStatus,
): NonCncPromotedQuoteApplicationMutationOutcomeCommitStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC application mutation outcome commit status")
  }
  return status
}

function normalizeExecutionStatus(
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
    throw new Error("executionStatus is not a supported non-CNC application mutation execution status")
  }
  return status
}

function normalizeOutcomeStatus(
  status: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput["status"],
): NonCncPromotedQuoteApplicationMutationCommandOutcomeInput["status"] {
  if (status !== "applied" && status !== "failed") {
    throw new Error("commandOutcome.status must be applied or failed")
  }
  return status
}
