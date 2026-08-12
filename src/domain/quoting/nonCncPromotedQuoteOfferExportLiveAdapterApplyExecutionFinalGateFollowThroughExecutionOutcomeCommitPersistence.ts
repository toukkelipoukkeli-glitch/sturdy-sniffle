import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommit"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-execution-outcome-commit-persistence.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitDisposition =
  | "commit_ready"
  | "review_only"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_VERSION
  commitRecordId: string
  executionFingerprint: string
  committedExecutionFingerprint?: string
  followThroughId: string
  followThroughFingerprint: string
  targetRfqId?: string
  readinessRecordId?: string
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitStatus
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitDisposition
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord[]
  latestRecord?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord
  blockedCommitRecordIds: string[]
  commitReadyRecordIds: string[]
  committedExecutionFingerprints: string[]
  executionFingerprints: string[]
  followThroughIds: string[]
  followThroughFingerprints: string[]
  targetRfqIds: string[]
  readinessRecordIds: string[]
  latestExecutionFingerprints: string[]
  latestApplyPlanIds: string[]
  latestCommitRecordIds: string[]
  latestCommittedExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitStatus, number>>
  commandOutcomeCount: number
  blockerCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitInput {
  commitPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceAdapter {
  recordCommit(
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceAdapter {
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildCommitRecord({
  commitPlan,
  executionRun,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord {
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
    disposition: commitPlan.status === "ready" ? "commit_ready" : "review_only",
    executionFingerprint: commitPlan.executionFingerprint,
    followThroughFingerprint: commitPlan.followThroughFingerprint,
    followThroughId: commitPlan.followThroughId,
    latestApplyPlanId: commitPlan.latestApplyPlanId,
    latestCommitRecordId: commitPlan.latestCommitRecordId,
    latestCommittedExecutionFingerprint: commitPlan.latestCommittedExecutionFingerprint,
    latestExecutionFingerprint: commitPlan.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: commitPlan.latestSourceExecutionFingerprint,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    readinessRecordId: commitPlan.readinessRecordId,
    recordedAt,
    recordedBy,
    reviewWarnings: [...commitPlan.reviewWarnings],
    status: commitPlan.status,
    targetRfqId: commitPlan.targetRfqId,
    warningCount: commitPlan.reviewWarnings.length,
  })
}

function assertExecutionMatchesCommitPlan(
  commitPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan,
  executionRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun | undefined,
): void {
  if (!executionRun) {
    if (commitPlan.status === "ready") {
      throw new Error("ready final-gate follow-through outcome commit plans require a commit execution run")
    }
    return
  }
  if (commitPlan.status !== "ready") {
    throw new Error("blocked final-gate follow-through outcome commit plans cannot be recorded with an execution run")
  }
  if (executionRun.mode !== "commit") {
    throw new Error("final-gate follow-through outcome commit execution run must use commit mode")
  }
  if (executionRun.status !== "succeeded") {
    throw new Error("ready final-gate follow-through outcome commit records require a succeeded execution run")
  }

  const mismatches = [
    executionRun.followThroughId === commitPlan.followThroughId ? undefined : "followThroughId",
    executionRun.followThroughFingerprint === commitPlan.followThroughFingerprint ? undefined : "followThroughFingerprint",
    executionRun.targetRfqId === commitPlan.targetRfqId ? undefined : "targetRfqId",
    executionRun.readinessRecordId === commitPlan.readinessRecordId ? undefined : "readinessRecordId",
    executionRun.latestExecutionFingerprint === commitPlan.latestExecutionFingerprint
      ? undefined
      : "latestExecutionFingerprint",
    executionRun.latestApplyPlanId === commitPlan.latestApplyPlanId ? undefined : "latestApplyPlanId",
    executionRun.latestCommitRecordId === commitPlan.latestCommitRecordId ? undefined : "latestCommitRecordId",
    executionRun.latestCommittedExecutionFingerprint === commitPlan.latestCommittedExecutionFingerprint
      ? undefined
      : "latestCommittedExecutionFingerprint",
    executionRun.latestSourceExecutionFingerprint === commitPlan.latestSourceExecutionFingerprint
      ? undefined
      : "latestSourceExecutionFingerprint",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`final-gate follow-through outcome commit execution run does not match commit plan: ${mismatches.join(", ")}`)
  }
}

function buildCommitRecordId({
  executionFingerprint,
  followThroughId,
}: Pick<
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan,
  "executionFingerprint" | "followThroughId"
>): string {
  return `non-cnc-final-gate-follow-through-outcome-commit:${followThroughId}:${executionFingerprint}`
}

function normalizeSnapshot(
  snapshot:
    | LocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceInitialSnapshot
    | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot {
  const recordsById =
    new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord>()
  const recordKeysByIdAndRecordedAt = new Map<string, string>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const timestampKey = JSON.stringify([normalized.commitRecordId, normalized.recordedAt])
    const recordKey = stableRecordKey(normalized)
    const existingRecordKey = recordKeysByIdAndRecordedAt.get(timestampKey)
    if (existingRecordKey && existingRecordKey !== recordKey) {
      throw new Error("conflicting final-gate follow-through outcome commit records cannot share commitRecordId and recordedAt")
    }
    recordKeysByIdAndRecordedAt.set(timestampKey, recordKey)
    const existing = recordsById.get(normalized.commitRecordId)
    const recordOrder = existing ? sortNewestFirst(normalized, existing) : -1
    if (!existing || recordOrder < 0) {
      recordsById.set(normalized.commitRecordId, normalized)
    } else if (recordOrder === 0 && stableRecordKey(normalized) !== stableRecordKey(existing)) {
      throw new Error("conflicting final-gate follow-through outcome commit records cannot share commitRecordId and recordedAt")
    }
  }
  const records = [...recordsById.values()].sort(sortNewestFirst)

  return {
    blockedCommitRecordIds: uniqueSorted(
      records.filter((record) => record.disposition === "review_only").map((record) => record.commitRecordId),
    ),
    blockerCount: records.reduce((total, record) => total + record.blockerCount, 0),
    commandOutcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    committedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.committedExecutionFingerprint ? [record.committedExecutionFingerprint] : []),
    ),
    commitReadyRecordIds: uniqueSorted(
      records.filter((record) => record.disposition === "commit_ready").map((record) => record.commitRecordId),
    ),
    executionFingerprints: uniqueSorted(records.map((record) => record.executionFingerprint)),
    followThroughFingerprints: uniqueSorted(records.map((record) => record.followThroughFingerprint)),
    followThroughIds: uniqueSorted(records.map((record) => record.followThroughId)),
    latestApplyPlanIds: uniqueSorted(records.flatMap((record) => record.latestApplyPlanId ? [record.latestApplyPlanId] : [])),
    latestCommitRecordIds: uniqueSorted(
      records.flatMap((record) => record.latestCommitRecordId ? [record.latestCommitRecordId] : []),
    ),
    latestCommittedExecutionFingerprints: uniqueSorted(
      records.flatMap((record) =>
        record.latestCommittedExecutionFingerprint ? [record.latestCommittedExecutionFingerprint] : [],
      ),
    ),
    latestExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.latestExecutionFingerprint ? [record.latestExecutionFingerprint] : []),
    ),
    latestRecord: records[0],
    latestSourceExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.latestSourceExecutionFingerprint ? [record.latestSourceExecutionFingerprint] : []),
    ),
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    readinessRecordIds: uniqueSorted(records.flatMap((record) => record.readinessRecordId ? [record.readinessRecordId] : [])),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord {
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
    disposition: normalizeDisposition(record.disposition),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    followThroughFingerprint: nonBlank(record.followThroughFingerprint, "followThroughFingerprint"),
    followThroughId: nonBlank(record.followThroughId, "followThroughId"),
    latestApplyPlanId: optionalTrim(record.latestApplyPlanId),
    latestCommitRecordId: optionalTrim(record.latestCommitRecordId),
    latestCommittedExecutionFingerprint: optionalTrim(record.latestCommittedExecutionFingerprint),
    latestExecutionFingerprint: optionalTrim(record.latestExecutionFingerprint),
    latestSourceExecutionFingerprint: optionalTrim(record.latestSourceExecutionFingerprint),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    readinessRecordId: optionalTrim(record.readinessRecordId),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commitRecordId !== buildCommitRecordId(normalized)) {
    throw new Error("commitRecordId must match followThroughId and executionFingerprint")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "commit_ready") {
    throw new Error("ready final-gate follow-through outcome commit records must use commit_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked final-gate follow-through outcome commit records must use review_only disposition")
  }
  if (normalized.status === "ready" && normalized.committedExecutionFingerprint === undefined) {
    throw new Error("ready final-gate follow-through outcome commit records require a committedExecutionFingerprint")
  }
  if (normalized.status === "blocked" && normalized.committedExecutionFingerprint !== undefined) {
    throw new Error("blocked final-gate follow-through outcome commit records cannot include a committedExecutionFingerprint")
  }
  validateEvidenceGating(normalized)

  return normalized
}

function validateEvidenceGating(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
): void {
  const evidenceFields = [
    record.latestApplyPlanId,
    record.latestCommitRecordId,
    record.latestCommittedExecutionFingerprint,
    record.latestExecutionFingerprint,
    record.latestSourceExecutionFingerprint,
    record.readinessRecordId,
    record.targetRfqId,
  ]
  if (record.status === "blocked" && evidenceFields.some((value) => value !== undefined)) {
    throw new Error("blocked final-gate follow-through outcome commit records cannot include ready evidence identifiers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPersistenceSnapshot {
  return {
    blockedCommitRecordIds: [...snapshot.blockedCommitRecordIds],
    blockerCount: snapshot.blockerCount,
    commandOutcomeCount: snapshot.commandOutcomeCount,
    committedExecutionFingerprints: [...snapshot.committedExecutionFingerprints],
    commitReadyRecordIds: [...snapshot.commitReadyRecordIds],
    executionFingerprints: [...snapshot.executionFingerprints],
    followThroughFingerprints: [...snapshot.followThroughFingerprints],
    followThroughIds: [...snapshot.followThroughIds],
    latestApplyPlanIds: [...snapshot.latestApplyPlanIds],
    latestCommitRecordIds: [...snapshot.latestCommitRecordIds],
    latestCommittedExecutionFingerprints: [...snapshot.latestCommittedExecutionFingerprints],
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    persistenceVersion: snapshot.persistenceVersion,
    readinessRecordIds: [...snapshot.readinessRecordIds],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord {
  return {
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandOutcomeCount: record.commandOutcomeCount,
    committedExecutionFingerprint: record.committedExecutionFingerprint,
    commitRecordId: record.commitRecordId,
    commitVersion: record.commitVersion,
    disposition: record.disposition,
    executionFingerprint: record.executionFingerprint,
    followThroughFingerprint: record.followThroughFingerprint,
    followThroughId: record.followThroughId,
    latestApplyPlanId: record.latestApplyPlanId,
    latestCommitRecordId: record.latestCommitRecordId,
    latestCommittedExecutionFingerprint: record.latestCommittedExecutionFingerprint,
    latestExecutionFingerprint: record.latestExecutionFingerprint,
    latestSourceExecutionFingerprint: record.latestSourceExecutionFingerprint,
    persistenceVersion: record.persistenceVersion,
    readinessRecordId: record.readinessRecordId,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewWarnings: [...record.reviewWarnings],
    status: record.status,
    targetRfqId: record.targetRfqId,
    warningCount: record.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.commitRecordId, right.commitRecordId) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.followThroughId, right.followThroughId) ||
    compareLex(left.followThroughFingerprint, right.followThroughFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.disposition, right.disposition) ||
    compareLex(left.committedExecutionFingerprint ?? "", right.committedExecutionFingerprint ?? "") ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.readinessRecordId ?? "", right.readinessRecordId ?? "") ||
    compareLex(left.latestExecutionFingerprint ?? "", right.latestExecutionFingerprint ?? "") ||
    compareLex(left.latestApplyPlanId ?? "", right.latestApplyPlanId ?? "") ||
    compareLex(left.latestCommitRecordId ?? "", right.latestCommitRecordId ?? "") ||
    compareLex(left.latestCommittedExecutionFingerprint ?? "", right.latestCommittedExecutionFingerprint ?? "") ||
    compareLex(left.latestSourceExecutionFingerprint ?? "", right.latestSourceExecutionFingerprint ?? "") ||
    compareLex(left.recordedBy, right.recordedBy) ||
    compareLex(left.commitVersion, right.commitVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.commandOutcomeCount, right.commandOutcomeCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount) ||
    compareLex(left.blockerLabels.join("\n"), right.blockerLabels.join("\n")) ||
    compareLex(left.reviewWarnings.join("\n"), right.reviewWarnings.join("\n"))
  )
}

function stableRecordKey(
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord,
): string {
  return JSON.stringify(Object.entries(record).sort(([left], [right]) => compareLex(left, right)))
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitStatus, number>>>(
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

function compareNumber(left: number, right: number): number {
  return left - right
}

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION
  ) {
    throw new Error("persistenceVersion is not a supported final-gate follow-through outcome commit persistence version")
  }
  return version
}

function normalizeCommitVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRecord["commitVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_VERSION {
  if (
    version !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_VERSION
  ) {
    throw new Error("commitVersion is not a supported final-gate follow-through outcome commit version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitDisposition,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitDisposition {
  if (disposition !== "commit_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported final-gate follow-through outcome commit disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported final-gate follow-through outcome commit status")
  }
  return status
}
