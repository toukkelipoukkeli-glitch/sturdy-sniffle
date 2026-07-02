import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION,
  type NonCncPromotedQuoteApplicationMutationApplyCommandStatus,
  type NonCncPromotedQuoteApplicationMutationApplyPlan,
  type NonCncPromotedQuoteApplicationMutationApplyPlanStatus,
} from "./nonCncPromotedQuoteApplicationMutationApplyPlan"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-application-mutation-apply-plan-persistence.v1"

export type NonCncPromotedQuoteApplicationMutationApplyPlanDisposition = "apply_ready" | "review_only"

export interface NonCncPromotedQuoteApplicationMutationApplyPlanRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION
  applyPlanId: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteApplicationMutationApplyPlanStatus
  disposition: NonCncPromotedQuoteApplicationMutationApplyPlanDisposition
  mutationPackageId?: string
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  sourceExecutionFingerprint?: string
  executionFingerprint?: string
  commandCount: number
  readyCommandCount: number
  blockedCommandCount: number
  committedOutcomeCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
}

export interface NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION
  applyReadyPlanIds: string[]
  blockedPlanIds: string[]
  latestRecord?: NonCncPromotedQuoteApplicationMutationApplyPlanRecord
  recordCount: number
  records: NonCncPromotedQuoteApplicationMutationApplyPlanRecord[]
  statusCounts: Partial<Record<NonCncPromotedQuoteApplicationMutationApplyPlanStatus, number>>
  readyCommandCount: number
  blockedCommandCount: number
  warningCount: number
}

export interface RecordNonCncPromotedQuoteApplicationMutationApplyPlanInput {
  applyPlan: NonCncPromotedQuoteApplicationMutationApplyPlan
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceAdapter {
  recordApplyPlan(
    input: RecordNonCncPromotedQuoteApplicationMutationApplyPlanInput,
  ): Promise<NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistenceOptions {
  initialSnapshot?: Partial<NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot>
}

export function createLocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteApplicationMutationApplyPlanPersistenceOptions = {}): NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordApplyPlan(input) {
      const record = buildApplyPlanRecord(input)
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

  function snapshot(): NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildApplyPlanRecord({
  applyPlan,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteApplicationMutationApplyPlanInput): NonCncPromotedQuoteApplicationMutationApplyPlanRecord {
  const commandCounts = countCommandStatuses(applyPlan.commands.map((command) => command.status))
  return {
    applicationId: applyPlan.applicationId,
    applicationRecordId: applyPlan.applicationRecordId,
    applyPlanId: applyPlan.applyPlanId,
    blockedCommandCount: commandCounts.blocked ?? 0,
    blockerCount: applyPlan.blockerLabels.length,
    blockerLabels: [...applyPlan.blockerLabels],
    commandCount: applyPlan.commandCount,
    committedOutcomeCount: applyPlan.committedOutcomeCount,
    disposition: applyPlan.status === "ready" ? "apply_ready" : "review_only",
    executionFingerprint: applyPlan.executionFingerprint,
    mutationPackageId: applyPlan.mutationPackageId,
    packageId: applyPlan.packageId,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION,
    planVersion: applyPlan.planVersion,
    readyCommandCount: commandCounts.ready ?? 0,
    recordedAt: normalizeIsoTimestamp(recordedAt, "recordedAt"),
    recordedBy: nonBlank(recordedBy, "recordedBy"),
    reviewWarnings: [...applyPlan.reviewWarnings],
    selectedPlanId: applyPlan.selectedPlanId,
    sourceExecutionFingerprint: applyPlan.sourceExecutionFingerprint,
    status: applyPlan.status,
    targetRfqId: applyPlan.targetRfqId,
    warningCount: applyPlan.reviewWarnings.length,
  }
}

function normalizeSnapshot(
  snapshot: Partial<NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot> | undefined,
): NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot {
  const recordsByPlanId = new Map<string, NonCncPromotedQuoteApplicationMutationApplyPlanRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByPlanId.get(normalized.applyPlanId)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByPlanId.set(normalized.applyPlanId, normalized)
    }
  }
  const records = [...recordsByPlanId.values()].sort(sortNewestFirst)

  return {
    applyReadyPlanIds: records
      .filter((record) => record.disposition === "apply_ready")
      .map((record) => record.applyPlanId)
      .sort(compareLex),
    blockedCommandCount: records.reduce((total, record) => total + record.blockedCommandCount, 0),
    blockedPlanIds: records
      .filter((record) => record.disposition === "review_only")
      .map((record) => record.applyPlanId)
      .sort(compareLex),
    latestRecord: records[0],
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION,
    readyCommandCount: records.reduce((total, record) => total + record.readyCommandCount, 0),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteApplicationMutationApplyPlanRecord,
): NonCncPromotedQuoteApplicationMutationApplyPlanRecord {
  const normalized = {
    applicationId: optionalTrim(record.applicationId),
    applicationRecordId: optionalTrim(record.applicationRecordId),
    applyPlanId: nonBlank(record.applyPlanId, "applyPlanId"),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    committedOutcomeCount: nonNegativeInteger(record.committedOutcomeCount, "committedOutcomeCount"),
    disposition: normalizeDisposition(record.disposition),
    executionFingerprint:
      record.executionFingerprint === undefined ? undefined : nonBlank(record.executionFingerprint, "executionFingerprint"),
    mutationPackageId: optionalTrim(record.mutationPackageId),
    packageId: optionalTrim(record.packageId),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    planVersion: normalizePlanVersion(record.planVersion),
    readyCommandCount: nonNegativeInteger(record.readyCommandCount, "readyCommandCount"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    selectedPlanId: optionalTrim(record.selectedPlanId),
    sourceExecutionFingerprint:
      record.sourceExecutionFingerprint === undefined
        ? undefined
        : nonBlank(record.sourceExecutionFingerprint, "sourceExecutionFingerprint"),
    status: normalizeStatus(record.status),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.commandCount !== normalized.readyCommandCount + normalized.blockedCommandCount) {
    throw new Error("commandCount must equal readyCommandCount plus blockedCommandCount")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "apply_ready") {
    throw new Error("ready application mutation apply plan records must use apply_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked application mutation apply plan records must use review_only disposition")
  }
  if (normalized.status === "ready" && !normalized.targetRfqId) {
    throw new Error("ready application mutation apply plan records require a targetRfqId")
  }
  if (normalized.status === "ready" && !normalized.sourceExecutionFingerprint) {
    throw new Error("ready application mutation apply plan records require a sourceExecutionFingerprint")
  }
  if (normalized.status === "ready" && !normalized.executionFingerprint) {
    throw new Error("ready application mutation apply plan records require an executionFingerprint")
  }
  if (normalized.status === "blocked" && normalized.targetRfqId !== undefined) {
    throw new Error("blocked application mutation apply plan records cannot include a targetRfqId")
  }
  if (normalized.status === "blocked" && normalized.sourceExecutionFingerprint !== undefined) {
    throw new Error("blocked application mutation apply plan records cannot include a sourceExecutionFingerprint")
  }
  if (normalized.status === "blocked" && normalized.executionFingerprint !== undefined) {
    throw new Error("blocked application mutation apply plan records cannot include an executionFingerprint")
  }

  return normalized
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot,
): NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot {
  return {
    applyReadyPlanIds: [...snapshot.applyReadyPlanIds],
    blockedCommandCount: snapshot.blockedCommandCount,
    blockedPlanIds: [...snapshot.blockedPlanIds],
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    persistenceVersion: snapshot.persistenceVersion,
    readyCommandCount: snapshot.readyCommandCount,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteApplicationMutationApplyPlanRecord,
): NonCncPromotedQuoteApplicationMutationApplyPlanRecord {
  return {
    applicationId: record.applicationId,
    applicationRecordId: record.applicationRecordId,
    applyPlanId: record.applyPlanId,
    blockedCommandCount: record.blockedCommandCount,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandCount: record.commandCount,
    committedOutcomeCount: record.committedOutcomeCount,
    disposition: record.disposition,
    executionFingerprint: record.executionFingerprint,
    mutationPackageId: record.mutationPackageId,
    packageId: record.packageId,
    persistenceVersion: record.persistenceVersion,
    planVersion: record.planVersion,
    readyCommandCount: record.readyCommandCount,
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

function sortNewestFirst(
  left: NonCncPromotedQuoteApplicationMutationApplyPlanRecord,
  right: NonCncPromotedQuoteApplicationMutationApplyPlanRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.applyPlanId, right.applyPlanId) ||
    compareLex(left.mutationPackageId ?? "", right.mutationPackageId ?? "") ||
    compareLex(left.applicationId ?? "", right.applicationId ?? "") ||
    compareLex(left.selectedPlanId ?? "", right.selectedPlanId ?? "") ||
    compareLex(left.status, right.status) ||
    compareLex(left.disposition, right.disposition) ||
    compareLex(left.recordedBy, right.recordedBy) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.readyCommandCount, right.readyCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.committedOutcomeCount, right.committedOutcomeCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function countCommandStatuses(
  statuses: NonCncPromotedQuoteApplicationMutationApplyCommandStatus[],
): Partial<Record<NonCncPromotedQuoteApplicationMutationApplyCommandStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteApplicationMutationApplyCommandStatus, number>>>((counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, {})
}

function countStatuses(
  records: NonCncPromotedQuoteApplicationMutationApplyPlanRecord[],
): Partial<Record<NonCncPromotedQuoteApplicationMutationApplyPlanStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteApplicationMutationApplyPlanStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
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
  version: NonCncPromotedQuoteApplicationMutationApplyPlanRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC application mutation apply plan persistence version")
  }
  return version
}

function normalizePlanVersion(
  version: NonCncPromotedQuoteApplicationMutationApplyPlanRecord["planVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION) {
    throw new Error("planVersion is not a supported non-CNC application mutation apply plan version")
  }
  return version
}

function normalizeDisposition(
  disposition: NonCncPromotedQuoteApplicationMutationApplyPlanDisposition,
): NonCncPromotedQuoteApplicationMutationApplyPlanDisposition {
  if (disposition !== "apply_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported non-CNC application mutation apply plan disposition")
  }
  return disposition
}

function normalizeStatus(
  status: NonCncPromotedQuoteApplicationMutationApplyPlanStatus,
): NonCncPromotedQuoteApplicationMutationApplyPlanStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC application mutation apply plan status")
  }
  return status
}
