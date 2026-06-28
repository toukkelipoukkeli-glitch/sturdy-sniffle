import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION,
  type NonCncPromotedQuoteApplicationCommand,
  type NonCncPromotedQuoteApplicationPlan,
  type NonCncPromotedQuoteApplicationPlanStatus,
} from "./nonCncPromotedQuoteApplicationPlan"
import type { NonCncQuotePromotionQuoteSnapshot } from "./nonCncQuotePromotionPlan"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION = "non-cnc-promoted-quote-application-persistence.v1"

export type NonCncPromotedQuoteApplicationDisposition = "application_ready" | "review_only"

export interface NonCncPromotedQuoteApplicationCommandRecord {
  detail: string
  externalId?: string
  key: NonCncPromotedQuoteApplicationCommand["key"]
  label: string
  status: NonCncPromotedQuoteApplicationCommand["status"]
}

export interface NonCncPromotedQuoteApplicationRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION
  applicationRecordId: string
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION
  applicationId: string
  packageId: string
  selectedPlanId: string
  targetRfqId: string
  recordedAt: string
  recordedBy: string
  status: NonCncPromotedQuoteApplicationPlanStatus
  disposition: NonCncPromotedQuoteApplicationDisposition
  commandCount: number
  readyCommandCount: number
  blockerCount: number
  warningCount: number
  blockerLabels: string[]
  reviewWarnings: string[]
  commands: NonCncPromotedQuoteApplicationCommandRecord[]
  quoteSnapshot?: NonCncQuotePromotionQuoteSnapshot
  sourceExecutionFingerprint?: string
}

export interface NonCncPromotedQuoteApplicationPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION
  applicationReadyIds: string[]
  blockedApplicationIds: string[]
  latestRecord?: NonCncPromotedQuoteApplicationRecord
  commandCount: number
  readyCommandCount: number
  recordCount: number
  records: NonCncPromotedQuoteApplicationRecord[]
  statusCounts: Partial<Record<NonCncPromotedQuoteApplicationPlanStatus, number>>
  warningCount: number
}

export interface RecordNonCncPromotedQuoteApplicationInput {
  applicationPlan: NonCncPromotedQuoteApplicationPlan
  recordedAt: string
  recordedBy: string
}

export interface NonCncPromotedQuoteApplicationPersistenceAdapter {
  recordApplication(input: RecordNonCncPromotedQuoteApplicationInput): Promise<NonCncPromotedQuoteApplicationPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteApplicationPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteApplicationPersistenceOptions {
  initialSnapshot?: Partial<NonCncPromotedQuoteApplicationPersistenceSnapshot>
}

export function createLocalNonCncPromotedQuoteApplicationPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteApplicationPersistenceOptions = {}): NonCncPromotedQuoteApplicationPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordApplication(input) {
      const record = buildApplicationRecord(input)
      snapshotState = normalizeSnapshot({
        records: [...snapshotState.records.filter((candidate) => candidate.applicationRecordId !== record.applicationRecordId), record],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncPromotedQuoteApplicationPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildApplicationRecord({
  applicationPlan,
  recordedAt,
  recordedBy,
}: RecordNonCncPromotedQuoteApplicationInput): NonCncPromotedQuoteApplicationRecord {
  return {
    applicationId: applicationPlan.applicationId,
    applicationRecordId: buildApplicationRecordId(applicationPlan),
    blockerCount: applicationPlan.blockerLabels.length,
    blockerLabels: [...applicationPlan.blockerLabels],
    commandCount: applicationPlan.commands.length,
    commands: applicationPlan.commands.map((command) => ({ ...command })),
    disposition: applicationPlan.status === "ready" ? "application_ready" : "review_only",
    packageId: applicationPlan.packageId,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
    planVersion: applicationPlan.planVersion,
    quoteSnapshot: applicationPlan.status === "ready" && applicationPlan.quoteSnapshot ? { ...applicationPlan.quoteSnapshot } : undefined,
    readyCommandCount: applicationPlan.commands.filter((command) => command.status === "ready").length,
    recordedAt: normalizeIsoTimestamp(recordedAt, "recordedAt"),
    recordedBy: nonBlank(recordedBy, "recordedBy"),
    reviewWarnings: [...applicationPlan.reviewWarnings],
    selectedPlanId: applicationPlan.selectedPlanId,
    sourceExecutionFingerprint: applicationPlan.sourceExecutionFingerprint,
    status: applicationPlan.status,
    targetRfqId: applicationPlan.targetRfqId,
    warningCount: applicationPlan.reviewWarnings.length,
  }
}

function buildApplicationRecordId({ applicationId }: { applicationId: string }): string {
  return `non-cnc-promoted-quote-application-record:${applicationId}`
}

function normalizeSnapshot(
  snapshot: Partial<NonCncPromotedQuoteApplicationPersistenceSnapshot> | undefined,
): NonCncPromotedQuoteApplicationPersistenceSnapshot {
  const recordsById = new Map<string, NonCncPromotedQuoteApplicationRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    recordsById.set(normalized.applicationRecordId, normalized)
  }
  const records = [...recordsById.values()].sort(sortNewestFirst)

  return {
    applicationReadyIds: records
      .filter((record) => record.disposition === "application_ready")
      .map((record) => record.applicationId)
      .sort(compareLex),
    blockedApplicationIds: records
      .filter((record) => record.disposition === "review_only")
      .map((record) => record.applicationId)
      .sort(compareLex),
    commandCount: records.reduce((total, record) => total + record.commandCount, 0),
    latestRecord: records[0],
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
    readyCommandCount: records.reduce((total, record) => total + record.readyCommandCount, 0),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(record: NonCncPromotedQuoteApplicationRecord): NonCncPromotedQuoteApplicationRecord {
  const normalized = {
    applicationId: nonBlank(record.applicationId, "applicationId"),
    applicationRecordId: nonBlank(record.applicationRecordId, "applicationRecordId"),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    blockerLabels: record.blockerLabels.map((label) => nonBlank(label, "blockerLabel")),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    commands: record.commands.map(normalizeCommandRecord),
    disposition: normalizeDisposition(record.disposition),
    packageId: nonBlank(record.packageId, "packageId"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    planVersion: normalizePlanVersion(record.planVersion),
    quoteSnapshot: record.quoteSnapshot ? { ...record.quoteSnapshot } : undefined,
    readyCommandCount: nonNegativeInteger(record.readyCommandCount, "readyCommandCount"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    reviewWarnings: record.reviewWarnings.map((warning) => nonBlank(warning, "reviewWarning")),
    selectedPlanId: nonBlank(record.selectedPlanId, "selectedPlanId"),
    sourceExecutionFingerprint:
      record.sourceExecutionFingerprint === undefined ? undefined : nonBlank(record.sourceExecutionFingerprint, "sourceExecutionFingerprint"),
    status: normalizeStatus(record.status),
    targetRfqId: nonBlank(record.targetRfqId, "targetRfqId"),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.applicationRecordId !== buildApplicationRecordId(normalized)) {
    throw new Error("applicationRecordId must match applicationId")
  }
  if (normalized.blockerCount !== normalized.blockerLabels.length) {
    throw new Error("blockerCount must equal blockerLabels length")
  }
  if (normalized.commandCount !== normalized.commands.length) {
    throw new Error("commandCount must equal commands length")
  }
  if (normalized.readyCommandCount !== normalized.commands.filter((command) => command.status === "ready").length) {
    throw new Error("readyCommandCount must equal ready command count")
  }
  if (normalized.warningCount !== normalized.reviewWarnings.length) {
    throw new Error("warningCount must equal reviewWarnings length")
  }
  if (normalized.status === "ready" && normalized.disposition !== "application_ready") {
    throw new Error("ready application records must use application_ready disposition")
  }
  if (normalized.status === "blocked" && normalized.disposition !== "review_only") {
    throw new Error("blocked application records must use review_only disposition")
  }
  if (normalized.status === "ready" && !normalized.quoteSnapshot) {
    throw new Error("ready application records must include a quoteSnapshot")
  }
  if (normalized.status === "blocked" && normalized.quoteSnapshot) {
    throw new Error("blocked application records must not include a quoteSnapshot")
  }

  return normalized
}

function normalizeCommandRecord(command: NonCncPromotedQuoteApplicationCommandRecord): NonCncPromotedQuoteApplicationCommandRecord {
  return {
    detail: nonBlank(command.detail, "command.detail"),
    externalId: command.externalId === undefined ? undefined : nonBlank(command.externalId, "command.externalId"),
    key: command.key,
    label: nonBlank(command.label, "command.label"),
    status: normalizeCommandStatus(command.status),
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteApplicationPersistenceSnapshot,
): NonCncPromotedQuoteApplicationPersistenceSnapshot {
  return {
    applicationReadyIds: [...snapshot.applicationReadyIds],
    blockedApplicationIds: [...snapshot.blockedApplicationIds],
    commandCount: snapshot.commandCount,
    latestRecord: snapshot.latestRecord ? cloneRecord(snapshot.latestRecord) : undefined,
    persistenceVersion: snapshot.persistenceVersion,
    readyCommandCount: snapshot.readyCommandCount,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(record: NonCncPromotedQuoteApplicationRecord): NonCncPromotedQuoteApplicationRecord {
  return {
    applicationId: record.applicationId,
    applicationRecordId: record.applicationRecordId,
    blockerCount: record.blockerCount,
    blockerLabels: [...record.blockerLabels],
    commandCount: record.commandCount,
    commands: record.commands.map((command) => ({ ...command })),
    disposition: record.disposition,
    packageId: record.packageId,
    persistenceVersion: record.persistenceVersion,
    planVersion: record.planVersion,
    quoteSnapshot: record.quoteSnapshot ? { ...record.quoteSnapshot } : undefined,
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
  left: NonCncPromotedQuoteApplicationRecord,
  right: NonCncPromotedQuoteApplicationRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.applicationRecordId, right.applicationRecordId) ||
    compareLex(left.applicationId, right.applicationId) ||
    compareLex(left.selectedPlanId, right.selectedPlanId)
  )
}

function countStatuses(
  records: NonCncPromotedQuoteApplicationRecord[],
): Partial<Record<NonCncPromotedQuoteApplicationPlanStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteApplicationPlanStatus, number>>>((counts, record) => {
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
  version: NonCncPromotedQuoteApplicationRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC application persistence version")
  }
  return version
}

function normalizePlanVersion(
  version: NonCncPromotedQuoteApplicationRecord["planVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION) {
    throw new Error("planVersion is not a supported non-CNC application plan version")
  }
  return version
}

function normalizeDisposition(disposition: NonCncPromotedQuoteApplicationDisposition): NonCncPromotedQuoteApplicationDisposition {
  if (disposition !== "application_ready" && disposition !== "review_only") {
    throw new Error("disposition is not a supported non-CNC application disposition")
  }
  return disposition
}

function normalizeStatus(status: NonCncPromotedQuoteApplicationPlanStatus): NonCncPromotedQuoteApplicationPlanStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("status is not a supported non-CNC application status")
  }
  return status
}

function normalizeCommandStatus(
  status: NonCncPromotedQuoteApplicationCommand["status"],
): NonCncPromotedQuoteApplicationCommand["status"] {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("command.status is not a supported non-CNC application command status")
  }
  return status
}
