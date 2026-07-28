import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { NonCncPromotedQuoteOfferCreationExecutionRun } from "./nonCncPromotedQuoteOfferCreationExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitPlan,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitStatus,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommit"

export const NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-creation-outcome-commit-persistence.v1"

export type NonCncPromotedQuoteOfferCreationOutcomeCommitDisposition = "commit_ready" | "review_only"

export interface NonCncPromotedQuoteOfferCreationOutcomeCommitRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION
  commitRecordId: string
  creationPlanId: string
  packageId: string
  selectedPlanId: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteOfferCreationOutcomeCommitStatus
  disposition: NonCncPromotedQuoteOfferCreationOutcomeCommitDisposition
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  executionFingerprint?: string
}

export interface NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  blockedCreationPlanIds: string[]
  commitReadyCreationPlanIds: string[]
  latestRecord?: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord
  outcomeCount: number
  recordCount: number
  records: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferCreationOutcomeCommitStatus, number>>
  targetRfqIds: string[]
  releaseExecutionFingerprints: string[]
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferCreationOutcomeCommitInput {
  commitPlan: NonCncPromotedQuoteOfferCreationOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteOfferCreationExecutionRun
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceAdapter {
  recordCommit(
    input: RecordNonCncPromotedQuoteOfferCreationOutcomeCommitInput,
  ): Promise<NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceOptions {
  initialSnapshot?: Partial<NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot>
}

export function createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceOptions = {}): NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceAdapter {
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

  function snapshot(): NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildCommitRecord({
  commitPlan,
  executionRun,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferCreationOutcomeCommitInput): NonCncPromotedQuoteOfferCreationOutcomeCommitRecord {
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
    creationPlanId: commitPlan.creationPlanId,
    disposition: commitPlan.status === "ready" ? "commit_ready" : "review_only",
    executionFingerprint: executionRun?.executionFingerprint,
    packageId: commitPlan.packageId,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordedAt: normalizeIsoTimestamp(recordedAt, "recordedAt"),
    recordedBy: nonBlank(recordedBy, "recordedBy"),
    releaseExecutionFingerprint: commitPlan.releaseExecutionFingerprint,
    reviewWarnings: [...commitPlan.reviewWarnings],
    selectedPlanId: commitPlan.selectedPlanId,
    status: commitPlan.status,
    targetRfqId: commitPlan.targetRfqId,
    warningCount: commitPlan.reviewWarnings.length,
  }
}

function assertExecutionMatchesCommitPlan(
  commitPlan: NonCncPromotedQuoteOfferCreationOutcomeCommitPlan,
  executionRun: NonCncPromotedQuoteOfferCreationExecutionRun | undefined,
): void {
  if (!executionRun) {
    if (commitPlan.status === "ready") {
      throw new Error("ready customer-offer creation outcome commit plans require a commit execution run")
    }
    return
  }
  if (commitPlan.status !== "ready") {
    throw new Error("blocked customer-offer creation outcome commit plans cannot be recorded with an execution run")
  }
  if (executionRun.mode !== "commit") {
    throw new Error("customer-offer creation outcome commit execution run must use commit mode")
  }

  const mismatches = [
    executionRun.creationPlanId === commitPlan.creationPlanId ? undefined : "creationPlanId",
    executionRun.packageId === commitPlan.packageId ? undefined : "packageId",
    executionRun.selectedPlanId === commitPlan.selectedPlanId ? undefined : "selectedPlanId",
    executionRun.targetRfqId === commitPlan.targetRfqId ? undefined : "targetRfqId",
    executionRun.releaseExecutionFingerprint === commitPlan.releaseExecutionFingerprint
      ? undefined
      : "releaseExecutionFingerprint",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(
      `customer-offer creation outcome commit execution run does not match commit plan: ${mismatches.join(", ")}`,
    )
  }
}

function buildCommitRecordId({ creationPlanId }: { creationPlanId: string }): string {
  return `non-cnc-offer-creation-outcome-commit:${creationPlanId}`
}

function normalizeSnapshot(
  snapshot: Partial<NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot> | undefined,
): NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot {
  const recordsById = new Map<string, NonCncPromotedQuoteOfferCreationOutcomeCommitRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsById.get(normalized.commitRecordId)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsById.set(normalized.commitRecordId, normalized)
    }
  }
  const records = [...recordsById.values()].sort(sortNewestFirst)

  return {
    blockedCreationPlanIds: uniqueSorted(
      records.filter((record) => record.disposition === "review_only").map((record) => record.creationPlanId),
    ),
    commitReadyCreationPlanIds: uniqueSorted(
      records.filter((record) => record.disposition === "commit_ready").map((record) => record.creationPlanId),
    ),
    latestRecord: records[0],
    outcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    releaseExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => (record.releaseExecutionFingerprint ? [record.releaseExecutionFingerprint] : [])),
    ),
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => (record.targetRfqId ? [record.targetRfqId] : []))),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
): NonCncPromotedQuoteOfferCreationOutcomeCommitRecord {
  const normalized = {
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandOutcomeCount: nonNegativeInteger(record.commandOutcomeCount, "commandOutcomeCount"),
    commitRecordId: nonBlank(record.commitRecordId, "commitRecordId"),
    commitVersion: normalizeCommitVersion(record.commitVersion),
    creationPlanId: nonBlank(record.creationPlanId, "creationPlanId"),
    disposition: normalizeDisposition(record.disposition),
    executionFingerprint: optionalTrim(record.executionFingerprint),
    packageId: nonBlank(record.packageId, "packageId"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    releaseExecutionFingerprint: optionalTrim(record.releaseExecutionFingerprint),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    selectedPlanId: nonBlank(record.selectedPlanId, "selectedPlanId"),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commitRecordId !== buildCommitRecordId(normalized)) {
    throw new Error("commitRecordId must match creationPlanId")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "commit_ready") {
    throw new Error("ready customer-offer creation outcome commit records must use commit_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked customer-offer creation outcome commit records must use review_only disposition")
  }
  if (normalized.status === "ready" && normalized.executionFingerprint === undefined) {
    throw new Error("ready customer-offer creation outcome commit records require an executionFingerprint")
  }
  if (normalized.status === "blocked" && normalized.executionFingerprint !== undefined) {
    throw new Error("blocked customer-offer creation outcome commit records cannot include an executionFingerprint")
  }
  if (normalized.status === "blocked" && normalized.targetRfqId !== undefined) {
    throw new Error("blocked customer-offer creation outcome commit records cannot include a targetRfqId")
  }
  if (normalized.status === "blocked" && normalized.releaseExecutionFingerprint !== undefined) {
    throw new Error("blocked customer-offer creation outcome commit records cannot include a releaseExecutionFingerprint")
  }

  return normalized
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot,
): NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot {
  return {
    blockedCreationPlanIds: [...snapshot.blockedCreationPlanIds],
    commitReadyCreationPlanIds: [...snapshot.commitReadyCreationPlanIds],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    outcomeCount: snapshot.outcomeCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    releaseExecutionFingerprints: [...snapshot.releaseExecutionFingerprints],
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
): NonCncPromotedQuoteOfferCreationOutcomeCommitRecord {
  return {
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandOutcomeCount: record.commandOutcomeCount,
    commitRecordId: record.commitRecordId,
    commitVersion: record.commitVersion,
    creationPlanId: record.creationPlanId,
    disposition: record.disposition,
    executionFingerprint: record.executionFingerprint,
    packageId: record.packageId,
    persistenceVersion: record.persistenceVersion,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    releaseExecutionFingerprint: record.releaseExecutionFingerprint,
    reviewWarnings: [...record.reviewWarnings],
    selectedPlanId: record.selectedPlanId,
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.commitRecordId, right.commitRecordId) ||
    compareLex(left.creationPlanId, right.creationPlanId) ||
    compareLex(left.selectedPlanId, right.selectedPlanId) ||
    compareLex(left.status, right.status)
  )
}

function countStatuses(
  records: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord[],
): Partial<Record<NonCncPromotedQuoteOfferCreationOutcomeCommitStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferCreationOutcomeCommitStatus, number>>>((counts, record) => {
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

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC offer creation outcome commit persistence version")
  }
  return version
}

function normalizeCommitVersion(
  version: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord["commitVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION) {
    throw new Error("commitVersion is not a supported non-CNC offer creation outcome commit version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferCreationOutcomeCommitDisposition,
): NonCncPromotedQuoteOfferCreationOutcomeCommitDisposition {
  if (disposition !== "commit_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported non-CNC offer creation outcome commit disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferCreationOutcomeCommitStatus,
): NonCncPromotedQuoteOfferCreationOutcomeCommitStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC offer creation outcome commit status")
  }
  return status
}
