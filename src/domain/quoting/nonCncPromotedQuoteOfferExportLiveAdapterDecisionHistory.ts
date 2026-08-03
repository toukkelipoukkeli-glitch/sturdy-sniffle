import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import { fingerprintNonCncPromotedQuoteOfferExportPackagePayload } from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterDecision,
  NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode,
  NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_HISTORY_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-decision-history.v1"

export interface NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord {
  historyVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_HISTORY_VERSION
  decisionFingerprint: string
  recordedAt: string
  actor: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus
  mode: NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode
  enabled: boolean
  canUseLiveAdapter: boolean
  adapterAction: NonCncPromotedQuoteOfferExportLiveAdapterDecision["adapterAction"]
  targetRfqId: string
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  latestExecutionFingerprint?: string
  latestPlanId?: string
  latestPackageId?: string
  latestReleaseExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot {
  historyVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_HISTORY_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord[]
  latestDecision?: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord
  decisionFingerprints: string[]
  targetRfqIds: string[]
  latestExecutionFingerprints: string[]
  latestReleaseExecutionFingerprints: string[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus, number>>
  modeCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode, number>>
  adapterActionCounts: Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterDecision["adapterAction"], number>>
  blockerCount: number
  warningCount: number
  nextActionCount: number
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary {
  status: "empty" | "blocked" | "fallback" | "ready"
  severity: "neutral" | "blocked" | "warning" | "success"
  title: string
  operatorSummary: string
  actionItems: string[]
  totalRecords: number
  blockerCount: number
  warningCount: number
  nextActionCount: number
  targetRfqIds: string[]
  latestDecision?: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord
  recentDecisions: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord[]
  exportText: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistoryAdapter {
  recordDecision(
    decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision,
    input: RecordNonCncPromotedQuoteOfferExportLiveAdapterDecisionInput,
  ): Promise<NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot
}

export interface RecordNonCncPromotedQuoteOfferExportLiveAdapterDecisionInput {
  actor: string
  recordedAt: string
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistoryInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistoryOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistoryInitialSnapshot
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummaryOptions {
  recentDecisionLimit?: number
}

const DEFAULT_RECENT_DECISION_LIMIT = 5

export function createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistoryOptions = {}): NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistoryAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordDecision(decision, input) {
      const record = buildLiveAdapterDecisionRecord(decision, input)
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

  function snapshot(): NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function buildLiveAdapterDecisionRecord(
  decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision,
  { actor, recordedAt }: RecordNonCncPromotedQuoteOfferExportLiveAdapterDecisionInput,
): NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord {
  return normalizeRecord({
    actor: nonBlank(actor, "actor"),
    adapterAction: decision.adapterAction,
    blockerLabels: decision.blockerLabels.map((label, index) => nonBlank(label, `blockerLabels[${index}]`)),
    canUseLiveAdapter: decision.canUseLiveAdapter,
    decisionFingerprint: fingerprintDecision(decision),
    enabled: decision.enabled,
    historyVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_HISTORY_VERSION,
    latestExecutionFingerprint: decision.latestExecutionFingerprint,
    latestPackageId: decision.latestPackageId,
    latestPlanId: decision.latestPlanId,
    latestReleaseExecutionFingerprint: decision.latestReleaseExecutionFingerprint,
    latestSourceExecutionFingerprint: decision.latestSourceExecutionFingerprint,
    mode: decision.mode,
    nextActionLabels: decision.nextActionLabels.map((label, index) => nonBlank(label, `nextActionLabels[${index}]`)),
    recordedAt: normalizeIsoTimestamp(recordedAt, "recordedAt"),
    reviewWarnings: decision.reviewWarnings.map((warning, index) => nonBlank(warning, `reviewWarnings[${index}]`)),
    status: decision.status,
    targetRfqId: decision.targetRfqId,
  })
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot,
  options: BuildNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummaryOptions = {},
): NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary {
  const recentDecisionLimit = normalizeRecentDecisionLimit(options.recentDecisionLimit)
  const latestRecord = snapshot.latestDecision ?? snapshot.records[0]
  const latestDecision = latestRecord ? cloneRecord(latestRecord) : undefined
  const status = latestDecision?.status ?? "empty"
  const recentDecisions = snapshot.records.slice(0, recentDecisionLimit).map(cloneRecord)
  const summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary, "exportText"> = {
    actionItems: actionItems(status, snapshot.blockerCount),
    blockerCount: snapshot.blockerCount,
    latestDecision,
    nextActionCount: snapshot.nextActionCount,
    operatorSummary: operatorSummary(status, snapshot.recordCount, latestDecision),
    recentDecisions,
    severity: severity(status),
    status,
    targetRfqIds: [...snapshot.targetRfqIds],
    title: title(status),
    totalRecords: snapshot.recordCount,
    warningCount: snapshot.warningCount,
  }

  return {
    ...summary,
    exportText: buildExportText(summary),
  }
}

function normalizeSnapshot(
  snapshot: LocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistoryInitialSnapshot | undefined,
): NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord>()
  for (const record of snapshot?.records ?? []) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new Error("records[] entries must be non-null objects")
    }
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.decisionFingerprint)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.decisionFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    adapterActionCounts: countAdapterActions(records),
    blockerCount: records.reduce((total, record) => total + record.blockerLabels.length, 0),
    decisionFingerprints: uniqueSorted(records.map((record) => record.decisionFingerprint)),
    historyVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_HISTORY_VERSION,
    latestDecision: records[0],
    latestExecutionFingerprints: uniqueSorted(
      records.flatMap((record) => (record.latestExecutionFingerprint ? [record.latestExecutionFingerprint] : [])),
    ),
    latestReleaseExecutionFingerprints: uniqueSorted(
      records.flatMap((record) =>
        record.latestReleaseExecutionFingerprint ? [record.latestReleaseExecutionFingerprint] : [],
      ),
    ),
    modeCounts: countModes(records),
    nextActionCount: records.reduce((total, record) => total + record.nextActionLabels.length, 0),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    targetRfqIds: uniqueSorted(records.map((record) => record.targetRfqId)),
    warningCount: records.reduce((total, record) => total + record.reviewWarnings.length, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    adapterAction: normalizeAdapterAction(record.adapterAction),
    blockerLabels: normalizeTextList(record.blockerLabels, "blockerLabels"),
    canUseLiveAdapter: normalizeBoolean(record.canUseLiveAdapter, "canUseLiveAdapter"),
    decisionFingerprint: nonBlank(record.decisionFingerprint, "decisionFingerprint"),
    enabled: normalizeBoolean(record.enabled, "enabled"),
    historyVersion: normalizeHistoryVersion(record.historyVersion),
    latestExecutionFingerprint: optionalNonBlank(record.latestExecutionFingerprint, "latestExecutionFingerprint"),
    latestPackageId: optionalNonBlank(record.latestPackageId, "latestPackageId"),
    latestPlanId: optionalNonBlank(record.latestPlanId, "latestPlanId"),
    latestReleaseExecutionFingerprint: optionalNonBlank(
      record.latestReleaseExecutionFingerprint,
      "latestReleaseExecutionFingerprint",
    ),
    latestSourceExecutionFingerprint: optionalNonBlank(
      record.latestSourceExecutionFingerprint,
      "latestSourceExecutionFingerprint",
    ),
    mode: normalizeMode(record.mode),
    nextActionLabels: normalizeTextList(record.nextActionLabels, "nextActionLabels"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    reviewWarnings: normalizeTextList(record.reviewWarnings, "reviewWarnings"),
    status: normalizeStatus(record.status),
    targetRfqId: nonBlank(record.targetRfqId, "targetRfqId"),
  }

  validateDecisionRecord(normalized)
  return normalized
}

function validateDecisionRecord(record: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord): void {
  if (record.status === "ready") {
    if (record.mode !== "live_adapter" || record.adapterAction !== "enable_live_adapter") {
      throw new Error("ready live-adapter decision records must enable the live adapter mode")
    }
    if (!record.enabled || !record.canUseLiveAdapter) {
      throw new Error("ready live-adapter decision records must have provider-write opt-in enabled")
    }
    if (record.blockerLabels.length > 0) {
      throw new Error("ready live-adapter decision records cannot include blockers")
    }
    if (!record.latestExecutionFingerprint || !record.latestReleaseExecutionFingerprint) {
      throw new Error("ready live-adapter decision records must include latest execution evidence")
    }
    return
  }

  if (record.mode !== "review_only" || record.adapterAction !== "keep_review_only") {
    throw new Error("blocked or fallback live-adapter decision records must keep review-only mode")
  }
  if (record.status === "blocked" && record.canUseLiveAdapter) {
    throw new Error("blocked live-adapter decision records cannot use live adapters")
  }
  if (record.status === "fallback" && (!record.canUseLiveAdapter || record.enabled)) {
    throw new Error("fallback live-adapter decision records must have ready evidence and disabled opt-in")
  }
  if (record.blockerLabels.length === 0) {
    throw new Error("blocked or fallback live-adapter decision records must include blocker labels")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot,
): NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot {
  return {
    adapterActionCounts: { ...snapshot.adapterActionCounts },
    blockerCount: snapshot.blockerCount,
    decisionFingerprints: [...snapshot.decisionFingerprints],
    historyVersion: snapshot.historyVersion,
    latestDecision: snapshot.latestDecision ? cloneRecord(snapshot.latestDecision) : undefined,
    latestExecutionFingerprints: [...snapshot.latestExecutionFingerprints],
    latestReleaseExecutionFingerprints: [...snapshot.latestReleaseExecutionFingerprints],
    modeCounts: { ...snapshot.modeCounts },
    nextActionCount: snapshot.nextActionCount,
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    targetRfqIds: [...snapshot.targetRfqIds],
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord,
): NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord {
  return {
    ...record,
    blockerLabels: [...record.blockerLabels],
    nextActionLabels: [...record.nextActionLabels],
    reviewWarnings: [...record.reviewWarnings],
  }
}

function fingerprintDecision(decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision): string {
  return `non-cnc-promoted-quote-offer-export-live-adapter-decision-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({
      adapterAction: decision.adapterAction,
      blockerLabels: decision.blockerLabels,
      canUseLiveAdapter: decision.canUseLiveAdapter,
      enabled: decision.enabled,
      latestExecutionFingerprint: decision.latestExecutionFingerprint,
      latestPackageId: decision.latestPackageId,
      latestPlanId: decision.latestPlanId,
      latestReleaseExecutionFingerprint: decision.latestReleaseExecutionFingerprint,
      latestSourceExecutionFingerprint: decision.latestSourceExecutionFingerprint,
      mode: decision.mode,
      nextActionLabels: decision.nextActionLabels,
      reviewWarnings: decision.reviewWarnings,
      status: decision.status,
      targetRfqId: decision.targetRfqId,
    }),
  )}`
}

function buildExportText(
  summary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary, "exportText">,
): string {
  const lines = [
    "Non-CNC offer export live adapter decision history",
    `Status: ${summary.status}`,
    `Records: ${summary.totalRecords}`,
    `Blockers: ${summary.blockerCount}`,
    `Warnings: ${summary.warningCount}`,
    `Next actions: ${summary.nextActionCount}`,
    `Target RFQs: ${summary.targetRfqIds.join(", ") || "none"}`,
  ]
  if (summary.latestDecision) {
    lines.push(
      `Latest decision: ${summary.latestDecision.recordedAt} | ${summary.latestDecision.status} | ${summary.latestDecision.mode} | ${summary.latestDecision.adapterAction} | ${summary.latestDecision.decisionFingerprint}`,
    )
  }
  lines.push("Recent decisions:")
  if (summary.recentDecisions.length === 0) {
    lines.push("- none")
  } else {
    for (const decision of summary.recentDecisions) {
      lines.push(
        `- ${decision.recordedAt} | ${decision.status} | ${decision.mode} | ${decision.adapterAction} | ${decision.targetRfqId}`,
      )
    }
  }
  lines.push(
    "Boundary: live customer-offer, file, release-review, export, and connector writes remain disabled unless a future provider-write adapter explicitly consumes ready opt-in evidence.",
  )
  return lines.join("\n")
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary["status"],
  totalRecords: number,
  latestDecision: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord | undefined,
): string {
  if (!latestDecision || status === "empty") {
    return "No non-CNC offer export live-adapter decisions have been recorded yet."
  }
  if (status === "ready") {
    return `Latest non-CNC offer export live-adapter decision enables guarded provider writes after ${formatCount(
      totalRecords,
      "record",
    )}; keep local/mock fallback attached for rollback.`
  }
  if (status === "fallback") {
    return `Latest non-CNC offer export live-adapter decision keeps review-only fallback active because provider-write opt-in is disabled after ${formatCount(
      totalRecords,
      "record",
    )}.`
  }
  return `Latest non-CNC offer export live-adapter decision is blocked by ${formatCount(
    latestDecision.blockerLabels.length,
    "blocker",
  )}; live writes remain disabled.`
}

function actionItems(
  status: NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary["status"],
  blockerCount: number,
): string[] {
  if (status === "empty") {
    return ["Record a reviewed live-adapter decision before any customer-visible export adapter is enabled."]
  }
  if (status === "ready") {
    return ["Review ready decision evidence before connecting a live customer-offer export provider."]
  }
  const items = ["Keep local/mock export provider fallback authoritative while live writes are blocked."]
  if (blockerCount > 0) {
    items.push(`Resolve ${formatCount(blockerCount, "decision blocker")} before enabling live provider writes.`)
  }
  return items
}

function title(status: NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary["status"]): string {
  if (status === "empty") {
    return "No live-adapter decision history"
  }
  if (status === "ready") {
    return "Live-adapter decision ready"
  }
  if (status === "fallback") {
    return "Live-adapter decision fallback"
  }
  return "Live-adapter decision blocked"
}

function severity(
  status: NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary["status"],
): NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySummary["severity"] {
  if (status === "ready") {
    return "success"
  }
  if (status === "fallback") {
    return "warning"
  }
  if (status === "blocked") {
    return "blocked"
  }
  return "neutral"
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord,
  right: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.decisionFingerprint, right.decisionFingerprint) ||
    compareLex(left.targetRfqId, right.targetRfqId) ||
    compareLex(left.status, right.status) ||
    compareLex(left.mode, right.mode) ||
    compareLex(left.actor, right.actor) ||
    compareNumber(left.blockerLabels.length, right.blockerLabels.length) ||
    compareNumber(left.reviewWarnings.length, right.reviewWarnings.length) ||
    compareNumber(left.nextActionLabels.length, right.nextActionLabels.length)
  )
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus, number>>>(
    (counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function countModes(
  records: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode, number>>>((counts, record) => {
    counts[record.mode] = (counts[record.mode] ?? 0) + 1
    return counts
  }, {})
}

function countAdapterActions(
  records: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterDecision["adapterAction"], number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportLiveAdapterDecision["adapterAction"], number>>>(
    (counts, record) => {
      counts[record.adapterAction] = (counts[record.adapterAction] ?? 0) + 1
      return counts
    },
    {},
  )
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort(compareLex)
}

function normalizeHistoryVersion(
  version: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord["historyVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_HISTORY_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_DECISION_HISTORY_VERSION) {
    throw new Error("historyVersion is not a supported non-CNC offer export live-adapter decision history version")
  }
  return version
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus,
): NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus {
  if (status !== "blocked" && status !== "fallback" && status !== "ready") {
    throw new Error("status is not a supported non-CNC offer export live-adapter decision status")
  }
  return status
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode,
): NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode {
  if (mode !== "review_only" && mode !== "live_adapter") {
    throw new Error("mode is not a supported non-CNC offer export live-adapter decision mode")
  }
  return mode
}

function normalizeAdapterAction(
  action: NonCncPromotedQuoteOfferExportLiveAdapterDecision["adapterAction"],
): NonCncPromotedQuoteOfferExportLiveAdapterDecision["adapterAction"] {
  if (action !== "keep_review_only" && action !== "enable_live_adapter") {
    throw new Error("adapterAction is not a supported non-CNC offer export live-adapter decision action")
  }
  return action
}

function normalizeBoolean(value: boolean, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be a boolean`)
  }
  return value
}

function optionalNonBlank(value: string | undefined, fieldName: string): string | undefined {
  return value === undefined ? undefined : nonBlank(value, fieldName)
}

function normalizeTextList(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`)
  }
  return value.map((item, index) => {
    if (typeof item !== "string") {
      throw new Error(`${fieldName}[${index}] must be a string`)
    }
    return nonBlank(item, `${fieldName}[${index}]`)
  })
}

function normalizeRecentDecisionLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_RECENT_DECISION_LIMIT
  }
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("recentDecisionLimit must be a positive safe integer")
  }
  return limit
}

function compareNumber(left: number, right: number): number {
  return left - right
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => compareLex(left, right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
