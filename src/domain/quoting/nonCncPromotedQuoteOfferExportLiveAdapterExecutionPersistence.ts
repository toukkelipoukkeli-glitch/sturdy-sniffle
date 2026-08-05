import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_ACTIONS,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_STATUSES,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_MODES,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_STATUSES,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import { NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PLAN_VERSION } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-execution-persistence.v1"

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PERSISTENCE_VERSION
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_VERSION
  executionFingerprint: string
  executedAt: string
  actor: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["mode"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus
  planId: string
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PLAN_VERSION
  planFingerprint: string
  decisionFingerprint: string
  decisionStatus: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["decisionStatus"]
  adapterAction: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["adapterAction"]
  targetRfqId?: string
  latestExecutionFingerprint?: string
  latestPackageId?: string
  latestPlanId?: string
  latestReleaseExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  failedCommandCount: number
  pendingCommandCount: number
  preparedCommandCount: number
  succeededCommandCount: number
  withheldCommandCount: number
  pendingActionCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord[]
  latestRun?: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord
  planIds: string[]
  planFingerprints: string[]
  decisionFingerprints: string[]
  targetRfqIds: string[]
  latestExecutionFingerprints: string[]
  latestPackageIds: string[]
  latestPlanIds: string[]
  latestReleaseExecutionFingerprints: string[]
  latestSourceExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus, number>>
  commandStatusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus, number>>
  warningCount: number
  pendingActionCount: number
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceAdapter {
  recordRun(
    run: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceSnapshot
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceAdapter {
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildExecutionRecord(
  run: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord {
  const statusCounts = commandStatusCounts(run.commands.map((command) => command.status))
  return normalizeRecord({
    actor: run.actor,
    adapterAction: run.adapterAction,
    blockedCommandCount: statusCounts.blocked ?? 0,
    commandCount: run.commandCount,
    decisionFingerprint: run.decisionFingerprint,
    decisionStatus: run.decisionStatus,
    executedAt: run.executedAt,
    executionFingerprint: run.executionFingerprint,
    executionVersion: run.executionVersion,
    failedCommandCount: statusCounts.failed ?? 0,
    latestExecutionFingerprint: run.latestExecutionFingerprint,
    latestPackageId: run.latestPackageId,
    latestPlanId: run.latestPlanId,
    latestReleaseExecutionFingerprint: run.latestReleaseExecutionFingerprint,
    latestSourceExecutionFingerprint: run.latestSourceExecutionFingerprint,
    mode: run.mode,
    pendingActionCount: run.nextActions.length,
    pendingCommandCount: statusCounts.pending ?? 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
    planFingerprint: run.planFingerprint,
    planId: run.planId,
    plannedCommandCount: run.plannedCommandCount,
    planVersion: run.planVersion,
    preparedCommandCount: statusCounts.prepared ?? 0,
    status: run.status,
    succeededCommandCount: statusCounts.succeeded ?? 0,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
    withheldCommandCount: statusCounts.withheld ?? 0,
  })
}

function normalizeSnapshot(
  snapshot: LocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceInitialSnapshot | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.executionFingerprint)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.executionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    commandStatusCounts: aggregateCommandStatusCounts(records),
    decisionFingerprints: uniqueSorted(records.map((record) => record.decisionFingerprint)),
    latestExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.latestExecutionFingerprint ? [record.latestExecutionFingerprint] : []),
    ),
    latestPackageIds: uniqueSorted(records.flatMap((record) => record.latestPackageId ? [record.latestPackageId] : [])),
    latestPlanIds: uniqueSorted(records.flatMap((record) => record.latestPlanId ? [record.latestPlanId] : [])),
    latestReleaseExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.latestReleaseExecutionFingerprint ? [record.latestReleaseExecutionFingerprint] : []),
    ),
    latestRun: records[0],
    latestSourceExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => record.latestSourceExecutionFingerprint ? [record.latestSourceExecutionFingerprint] : []),
    ),
    pendingActionCount: records.reduce((total, record) => total + record.pendingActionCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
    planFingerprints: uniqueSorted(records.map((record) => record.planFingerprint)),
    planIds: uniqueSorted(records.map((record) => record.planId)),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.flatMap((record) => record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    adapterAction: normalizeAdapterAction(record.adapterAction),
    blockedCommandCount: nonNegativeInteger(record.blockedCommandCount, "blockedCommandCount"),
    commandCount: nonNegativeInteger(record.commandCount, "commandCount"),
    decisionFingerprint: nonBlank(record.decisionFingerprint, "decisionFingerprint"),
    decisionStatus: normalizeDecisionStatus(record.decisionStatus),
    executedAt: normalizeIsoTimestamp(record.executedAt, "executedAt"),
    executionFingerprint: nonBlank(record.executionFingerprint, "executionFingerprint"),
    executionVersion: normalizeExecutionVersion(record.executionVersion),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "failedCommandCount"),
    latestExecutionFingerprint: optionalTrim(record.latestExecutionFingerprint),
    latestPackageId: optionalTrim(record.latestPackageId),
    latestPlanId: optionalTrim(record.latestPlanId),
    latestReleaseExecutionFingerprint: optionalTrim(record.latestReleaseExecutionFingerprint),
    latestSourceExecutionFingerprint: optionalTrim(record.latestSourceExecutionFingerprint),
    mode: normalizeMode(record.mode),
    pendingActionCount: nonNegativeInteger(record.pendingActionCount, "pendingActionCount"),
    pendingCommandCount: nonNegativeInteger(record.pendingCommandCount, "pendingCommandCount"),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    planFingerprint: nonBlank(record.planFingerprint, "planFingerprint"),
    planId: nonBlank(record.planId, "planId"),
    plannedCommandCount: nonNegativeInteger(record.plannedCommandCount, "plannedCommandCount"),
    planVersion: normalizePlanVersion(record.planVersion),
    preparedCommandCount: nonNegativeInteger(record.preparedCommandCount, "preparedCommandCount"),
    status: normalizeStatus(record.status),
    succeededCommandCount: nonNegativeInteger(record.succeededCommandCount, "succeededCommandCount"),
    targetRfqId: optionalTrim(record.targetRfqId),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
    withheldCommandCount: nonNegativeInteger(record.withheldCommandCount, "withheldCommandCount"),
  }

  const countedCommands =
    normalized.blockedCommandCount +
    normalized.failedCommandCount +
    normalized.pendingCommandCount +
    normalized.preparedCommandCount +
    normalized.succeededCommandCount +
    normalized.withheldCommandCount
  if (countedCommands !== normalized.commandCount) {
    throw new Error("commandCount must equal the sum of per-status live-adapter command counts")
  }
  const countedPlannedCommands =
    normalized.failedCommandCount +
    normalized.pendingCommandCount +
    normalized.preparedCommandCount +
    normalized.succeededCommandCount
  if (countedPlannedCommands !== normalized.plannedCommandCount) {
    throw new Error("plannedCommandCount must equal prepared pending failed and succeeded live-adapter command counts")
  }
  validateAggregateStatus(normalized)
  validateEvidenceGating(normalized)

  return normalized
}

function validateAggregateStatus(record: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord): void {
  if (record.commandCount === 0) {
    throw new Error("commandCount must be greater than zero for live-adapter execution records")
  }

  const mixedOutcomeCount = [
    record.failedCommandCount,
    record.pendingCommandCount,
    record.succeededCommandCount,
  ].filter((count) => count > 0).length

  if (record.status === "blocked" && record.blockedCommandCount !== record.commandCount) {
    throw new Error("blocked live-adapter execution records must have only blocked commands")
  }
  if (record.status === "withheld" && record.withheldCommandCount !== record.commandCount) {
    throw new Error("withheld live-adapter execution records must have only withheld commands")
  }
  if (record.status === "prepared" && (record.mode !== "dry_run" || record.preparedCommandCount !== record.commandCount)) {
    throw new Error("prepared live-adapter execution records must be dry-run records with only prepared commands")
  }
  if (record.status === "pending" && (record.mode !== "commit" || record.pendingCommandCount !== record.commandCount)) {
    throw new Error("pending live-adapter execution records must be commit records with only pending commands")
  }
  if (record.status === "succeeded" && (record.mode !== "commit" || record.succeededCommandCount !== record.commandCount)) {
    throw new Error("succeeded live-adapter execution records must be commit records with only succeeded commands")
  }
  if (record.status === "failed" && (record.mode !== "commit" || record.failedCommandCount !== record.commandCount)) {
    throw new Error("failed live-adapter execution records must be commit records with only failed commands")
  }
  if (
    record.status === "partial" &&
    (record.mode !== "commit" ||
      record.blockedCommandCount > 0 ||
      record.preparedCommandCount > 0 ||
      record.withheldCommandCount > 0 ||
      mixedOutcomeCount < 2)
  ) {
    throw new Error(
      "partial live-adapter execution records must be commit records with a mixed succeeded failed or pending command state",
    )
  }
}

function validateEvidenceGating(record: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord): void {
  const evidenceFields = [
    record.latestExecutionFingerprint,
    record.latestPackageId,
    record.latestPlanId,
    record.latestReleaseExecutionFingerprint,
    record.latestSourceExecutionFingerprint,
    record.targetRfqId,
  ]
  if (record.status === "blocked" || record.status === "withheld") {
    if (evidenceFields.some((value) => value !== undefined)) {
      throw new Error("blocked and withheld live-adapter execution records cannot include live evidence identifiers")
    }
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistenceSnapshot {
  return {
    commandStatusCounts: { ...snapshot.commandStatusCounts },
    decisionFingerprints: [...snapshot.decisionFingerprints],
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestPackageIds: [...snapshot.latestPackageIds],
    latestPlanIds: [...snapshot.latestPlanIds],
    latestReleaseExecutionFingerprints: [...snapshot.latestReleaseExecutionFingerprints],
    latestRun: snapshot.latestRun ? { ...snapshot.latestRun } : undefined,
    latestSourceExecutionFingerprints: [...snapshot.latestSourceExecutionFingerprints],
    pendingActionCount: snapshot.pendingActionCount,
    persistenceVersion: snapshot.persistenceVersion,
    planFingerprints: [...snapshot.planFingerprints],
    planIds: [...snapshot.planIds],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map((record) => ({ ...record })),
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord,
): number {
  return (
    compareLex(right.executedAt, left.executedAt) ||
    compareLex(left.executionFingerprint, right.executionFingerprint) ||
    compareLex(left.planId, right.planId) ||
    compareLex(left.planFingerprint, right.planFingerprint) ||
    compareLex(left.decisionFingerprint, right.decisionFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode) ||
    compareLex(left.adapterAction, right.adapterAction) ||
    compareLex(left.decisionStatus, right.decisionStatus) ||
    compareLex(left.targetRfqId ?? "", right.targetRfqId ?? "") ||
    compareLex(left.latestExecutionFingerprint ?? "", right.latestExecutionFingerprint ?? "") ||
    compareLex(left.latestPackageId ?? "", right.latestPackageId ?? "") ||
    compareLex(left.latestPlanId ?? "", right.latestPlanId ?? "") ||
    compareLex(left.latestReleaseExecutionFingerprint ?? "", right.latestReleaseExecutionFingerprint ?? "") ||
    compareLex(left.latestSourceExecutionFingerprint ?? "", right.latestSourceExecutionFingerprint ?? "") ||
    compareLex(left.actor, right.actor) ||
    compareLex(left.executionVersion, right.executionVersion) ||
    compareLex(left.persistenceVersion, right.persistenceVersion) ||
    compareNumber(left.commandCount, right.commandCount) ||
    compareNumber(left.plannedCommandCount, right.plannedCommandCount) ||
    compareNumber(left.blockedCommandCount, right.blockedCommandCount) ||
    compareNumber(left.failedCommandCount, right.failedCommandCount) ||
    compareNumber(left.pendingCommandCount, right.pendingCommandCount) ||
    compareNumber(left.preparedCommandCount, right.preparedCommandCount) ||
    compareNumber(left.succeededCommandCount, right.succeededCommandCount) ||
    compareNumber(left.withheldCommandCount, right.withheldCommandCount) ||
    compareNumber(left.pendingActionCount, right.pendingActionCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function commandStatusCounts(
  statuses: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus, number>> {
  return statuses.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus, number>>>(
    (counts, status) => {
      counts[status] = (counts[status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function aggregateCommandStatusCounts(
  records: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus, number>>>(
    (counts, record) => {
      addStatusCount(counts, "blocked", record.blockedCommandCount)
      addStatusCount(counts, "failed", record.failedCommandCount)
      addStatusCount(counts, "pending", record.pendingCommandCount)
      addStatusCount(counts, "prepared", record.preparedCommandCount)
      addStatusCount(counts, "succeeded", record.succeededCommandCount)
      addStatusCount(counts, "withheld", record.withheldCommandCount)
      return counts
    },
    {},
  )
}

function addStatusCount(
  counts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus, number>>,
  status: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecutionStatus,
  count: number,
): void {
  if (count > 0) {
    counts[status] = (counts[status] ?? 0) + count
  }
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus, number>>>((counts, record) => {
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

function compareNumber(left: number, right: number): number {
  return left - right
}

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PERSISTENCE_VERSION) {
    throw new Error("persistenceVersion is not a supported non-CNC live-adapter execution persistence version")
  }
  return version
}

function normalizeExecutionVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord["executionVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_VERSION) {
    throw new Error("executionVersion is not a supported non-CNC live-adapter execution version")
  }
  return version
}

function normalizePlanVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRecord["planVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PLAN_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PLAN_VERSION) {
    throw new Error("planVersion is not a supported non-CNC live-adapter execution plan version")
  }
  return version
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["mode"],
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["mode"] {
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_MODES.includes(mode)) {
    throw new Error("mode must be commit or dry_run")
  }
  return mode
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionStatus {
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_STATUSES.includes(status)) {
    throw new Error("status is not a supported non-CNC live-adapter execution status")
  }
  return status
}

function normalizeDecisionStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["decisionStatus"],
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["decisionStatus"] {
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_STATUSES.includes(status)) {
    throw new Error("decisionStatus is not a supported non-CNC live-adapter decision status")
  }
  return status
}

function normalizeAdapterAction(
  action: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["adapterAction"],
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["adapterAction"] {
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_ACTIONS.includes(action)) {
    throw new Error("adapterAction is not a supported non-CNC live-adapter action")
  }
  return action
}
