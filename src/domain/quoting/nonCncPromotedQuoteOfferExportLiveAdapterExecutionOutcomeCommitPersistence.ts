import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommit"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-execution-outcome-commit-persistence.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitDisposition =
  | "commit_ready"
  | "review_only"

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  commitRecordId: string
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION
  planId: string
  planFingerprint: string
  decisionFingerprint: string
  sourceExecutionFingerprint: string
  committedExecutionFingerprint?: string
  targetRfqId?: string
  latestExecutionFingerprint?: string
  latestPackageId?: string
  latestPlanId?: string
  latestReleaseExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitStatus
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitDisposition
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  blockedPlanIds: string[]
  commitReadyPlanIds: string[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord
  outcomeCount: number
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord[]
  sourceExecutionFingerprints: string[]
  committedExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitStatus, number>>
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitInput {
  commitPlan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceAdapter {
  recordCommit(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceAdapter {
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildCommitRecord({
  commitPlan,
  executionRun,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitInput): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord {
  assertExecutionMatchesCommitPlan(commitPlan, executionRun)
  if (commitPlan.commandOutcomeCount !== commitPlan.commandOutcomes.length) {
    throw new Error("commandOutcomeCount must equal commandOutcomes length")
  }

  return normalizeRecord({
    blockerCount: commitPlan.blockerLabels.length,
    blockerLabels: [...commitPlan.blockerLabels],
    commandOutcomeCount: commitPlan.commandOutcomeCount,
    committedExecutionFingerprint: executionRun?.executionFingerprint,
    commitRecordId: buildCommitRecordId(commitPlan),
    commitVersion: commitPlan.commitVersion,
    decisionFingerprint: commitPlan.decisionFingerprint,
    disposition: commitPlan.status === "ready" ? "commit_ready" : "review_only",
    latestExecutionFingerprint: commitPlan.latestExecutionFingerprint,
    latestPackageId: commitPlan.latestPackageId,
    latestPlanId: commitPlan.latestPlanId,
    latestReleaseExecutionFingerprint: commitPlan.latestReleaseExecutionFingerprint,
    latestSourceExecutionFingerprint: commitPlan.latestSourceExecutionFingerprint,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    planFingerprint: commitPlan.planFingerprint,
    planId: commitPlan.planId,
    recordedAt,
    recordedBy,
    reviewWarnings: [...commitPlan.reviewWarnings],
    sourceExecutionFingerprint: commitPlan.executionFingerprint,
    status: commitPlan.status,
    targetRfqId: commitPlan.targetRfqId,
    warningCount: commitPlan.reviewWarnings.length,
  })
}

function assertExecutionMatchesCommitPlan(
  commitPlan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan,
  executionRun: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun | undefined,
): void {
  if (!executionRun) {
    if (commitPlan.status === "ready") {
      throw new Error("ready live-adapter outcome commit plans require a commit execution run")
    }
    return
  }
  if (commitPlan.status !== "ready") {
    throw new Error("blocked live-adapter outcome commit plans cannot be recorded with an execution run")
  }
  if (executionRun.mode !== "commit") {
    throw new Error("live-adapter outcome commit execution run must use commit mode")
  }
  if (executionRun.status !== "succeeded") {
    throw new Error("ready live-adapter outcome commit records require a succeeded execution run")
  }

  const mismatches = [
    executionRun.planId === commitPlan.planId ? undefined : "planId",
    executionRun.planFingerprint === commitPlan.planFingerprint ? undefined : "planFingerprint",
    executionRun.decisionFingerprint === commitPlan.decisionFingerprint ? undefined : "decisionFingerprint",
    executionRun.targetRfqId === commitPlan.targetRfqId ? undefined : "targetRfqId",
    executionRun.latestExecutionFingerprint === commitPlan.latestExecutionFingerprint
      ? undefined
      : "latestExecutionFingerprint",
    executionRun.latestPackageId === commitPlan.latestPackageId ? undefined : "latestPackageId",
    executionRun.latestPlanId === commitPlan.latestPlanId ? undefined : "latestPlanId",
    executionRun.latestReleaseExecutionFingerprint === commitPlan.latestReleaseExecutionFingerprint
      ? undefined
      : "latestReleaseExecutionFingerprint",
    executionRun.latestSourceExecutionFingerprint === commitPlan.latestSourceExecutionFingerprint
      ? undefined
      : "latestSourceExecutionFingerprint",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`live-adapter outcome commit execution run does not match commit plan: ${mismatches.join(", ")}`)
  }
}

function buildCommitRecordId({
  executionFingerprint,
  planId,
}: Pick<NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan, "executionFingerprint" | "planId">): string {
  return `non-cnc-live-adapter-outcome-commit:${planId}:${executionFingerprint}`
}

function normalizeSnapshot(
  snapshot: LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceInitialSnapshot | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceSnapshot {
  const recordsById = new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsById.get(normalized.commitRecordId)
    const recordOrder = existing ? sortNewestFirst(normalized, existing) : -1
    if (!existing || recordOrder < 0) {
      recordsById.set(normalized.commitRecordId, normalized)
    } else if (recordOrder === 0 && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error("conflicting live-adapter outcome commit records cannot share commitRecordId and recordedAt")
    }
  }
  const records = [...recordsById.values()].sort(sortNewestFirst)

  return {
    blockedPlanIds: uniqueSorted(records.filter((record) => record.disposition === "review_only").map((record) => record.planId)),
    committedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.committedExecutionFingerprint ? [record.committedExecutionFingerprint] : []),
    ),
    commitReadyPlanIds: uniqueSorted(
      records.filter((record) => record.disposition === "commit_ready").map((record) => record.planId),
    ),
    latestRecord: records[0],
    outcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    sourceExecutionFingerprints: uniqueSorted(records.map((record) => record.sourceExecutionFingerprint)),
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord {
  const normalized = {
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandOutcomeCount: nonNegativeInteger(record.commandOutcomeCount, "commandOutcomeCount"),
    committedExecutionFingerprint:
      record.committedExecutionFingerprint === undefined
        ? undefined
        : nonBlank(record.committedExecutionFingerprint, "committedExecutionFingerprint"),
    commitRecordId: nonBlank(record.commitRecordId, "commitRecordId"),
    commitVersion: normalizeCommitVersion(record.commitVersion),
    decisionFingerprint: nonBlank(record.decisionFingerprint, "decisionFingerprint"),
    disposition: normalizeDisposition(record.disposition),
    latestExecutionFingerprint: optionalTrim(record.latestExecutionFingerprint),
    latestPackageId: optionalTrim(record.latestPackageId),
    latestPlanId: optionalTrim(record.latestPlanId),
    latestReleaseExecutionFingerprint: optionalTrim(record.latestReleaseExecutionFingerprint),
    latestSourceExecutionFingerprint: optionalTrim(record.latestSourceExecutionFingerprint),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    planFingerprint: nonBlank(record.planFingerprint, "planFingerprint"),
    planId: nonBlank(record.planId, "planId"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    sourceExecutionFingerprint: nonBlank(record.sourceExecutionFingerprint, "sourceExecutionFingerprint"),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commitRecordId !== buildCommitRecordId({
    executionFingerprint: normalized.sourceExecutionFingerprint,
    planId: normalized.planId,
  })) {
    throw new Error("commitRecordId must match planId and sourceExecutionFingerprint")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "commit_ready") {
    throw new Error("ready live-adapter outcome commit records must use commit_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked live-adapter outcome commit records must use review_only disposition")
  }
  if (normalized.status === "ready" && normalized.committedExecutionFingerprint === undefined) {
    throw new Error("ready live-adapter outcome commit records require a committedExecutionFingerprint")
  }
  if (normalized.status === "blocked" && normalized.committedExecutionFingerprint !== undefined) {
    throw new Error("blocked live-adapter outcome commit records cannot include a committedExecutionFingerprint")
  }
  validateEvidenceGating(normalized)

  return normalized
}

function validateEvidenceGating(record: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord): void {
  const evidenceFields = [
    record.latestExecutionFingerprint,
    record.latestPackageId,
    record.latestPlanId,
    record.latestReleaseExecutionFingerprint,
    record.latestSourceExecutionFingerprint,
    record.targetRfqId,
  ]
  if (record.status === "blocked" && evidenceFields.some((value) => value !== undefined)) {
    throw new Error("blocked live-adapter outcome commit records cannot include live evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistenceSnapshot {
  return {
    blockedPlanIds: [...snapshot.blockedPlanIds],
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitReadyPlanIds: [...snapshot.commitReadyPlanIds],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    outcomeCount: snapshot.outcomeCount,
    persistenceVersion: snapshot.persistenceVersion,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    sourceExecutionFingerprints: [...snapshot.sourceExecutionFingerprints],
    statusCounts: { ...snapshot.statusCounts },
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord {
  return {
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandOutcomeCount: record.commandOutcomeCount,
    committedExecutionFingerprint: record.committedExecutionFingerprint,
    commitRecordId: record.commitRecordId,
    commitVersion: record.commitVersion,
    decisionFingerprint: record.decisionFingerprint,
    disposition: record.disposition,
    latestExecutionFingerprint: record.latestExecutionFingerprint,
    latestPackageId: record.latestPackageId,
    latestPlanId: record.latestPlanId,
    latestReleaseExecutionFingerprint: record.latestReleaseExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    persistenceVersion: record.persistenceVersion,
    planFingerprint: record.planFingerprint,
    planId: record.planId,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewWarnings: [...record.reviewWarnings],
    sourceExecutionFingerprint: record.sourceExecutionFingerprint,
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function stableRecordKey(record: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord): string {
  return JSON.stringify({
    blockerCount: record.blockerCount,
    blockerLabels: record.blockerLabels,
    commandOutcomeCount: record.commandOutcomeCount,
    committedExecutionFingerprint: record.committedExecutionFingerprint,
    commitRecordId: record.commitRecordId,
    commitVersion: record.commitVersion,
    decisionFingerprint: record.decisionFingerprint,
    disposition: record.disposition,
    latestExecutionFingerprint: record.latestExecutionFingerprint,
    latestPackageId: record.latestPackageId,
    latestPlanId: record.latestPlanId,
    latestReleaseExecutionFingerprint: record.latestReleaseExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    persistenceVersion: record.persistenceVersion,
    planFingerprint: record.planFingerprint,
    planId: record.planId,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewWarnings: record.reviewWarnings,
    sourceExecutionFingerprint: record.sourceExecutionFingerprint,
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  })
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.commitRecordId, right.commitRecordId) ||
    compareLex(left.planId, right.planId) ||
    compareLex(left.sourceExecutionFingerprint, right.sourceExecutionFingerprint)
  )
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitStatus, number>>>(
    (counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    },
    {},
  )
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
  version: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC live-adapter outcome commit persistence version")
  }
  return version
}

function normalizeCommitVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRecord["commitVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION) {
    throw new Error("commitVersion is not a supported non-CNC live-adapter outcome commit version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitDisposition,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitDisposition {
  if (disposition !== "commit_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported non-CNC live-adapter outcome commit disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC live-adapter outcome commit status")
  }
  return status
}
