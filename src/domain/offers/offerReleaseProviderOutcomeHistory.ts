import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type { OfferReleaseCommandOutcomeInput } from "./offerReleaseExecution"
import type {
  OfferReleaseProviderOutcomePersistenceRecord,
  OfferReleaseProviderOutcomePersistenceSnapshot,
} from "./offerReleaseProviderOutcomePersistence"

export const OFFER_RELEASE_PROVIDER_OUTCOME_HISTORY_VERSION = "offer-release-provider-outcome-history.v1"

export interface OfferReleaseProviderOutcomeHistorySummary {
  historyVersion: typeof OFFER_RELEASE_PROVIDER_OUTCOME_HISTORY_VERSION
  totalOutcomeBatches: number
  latestOutcomeBatch?: OfferReleaseProviderOutcomeHistoryRecordSummary
  statusCounts: Partial<Record<OfferReleaseCommandOutcomeInput["status"], number>>
  commandCount: number
  appliedCommandCount: number
  failedCommandCount: number
  warningCount: number
  commandSummaries: OfferReleaseProviderOutcomeCommandSummary[]
}

export interface OfferReleaseProviderOutcomeHistoryRecordSummary {
  outcomeFingerprint: string
  recordedAt: string
  recordedBy: string
  offerId: string
  offerNumber: string
  rfqId: string
  releaseAt: string
  commandCount: number
  appliedCommandCount: number
  failedCommandCount: number
  warningCount: number
  failedCommandKeys: string[]
}

export interface OfferReleaseProviderOutcomeCommandSummary {
  commandKey: string
  outcomeCount: number
  latestRecordedAt: string
  statuses: OfferReleaseCommandOutcomeInput["status"][]
}

export function summarizeOfferReleaseProviderOutcomeHistory(
  snapshot: Pick<OfferReleaseProviderOutcomePersistenceSnapshot, "records">,
): OfferReleaseProviderOutcomeHistorySummary {
  const records = snapshot.records.map(normalizeRecordSummary).sort(sortNewestFirst)
  const statusCounts = countOutcomeStatuses(records)

  return {
    appliedCommandCount: records.reduce((total, record) => total + record.appliedCommandCount, 0),
    commandCount: records.reduce((total, record) => total + record.commandCount, 0),
    commandSummaries: summarizeCommands(records),
    failedCommandCount: records.reduce((total, record) => total + record.failedCommandCount, 0),
    historyVersion: OFFER_RELEASE_PROVIDER_OUTCOME_HISTORY_VERSION,
    latestOutcomeBatch: records[0] ? toPublicRecordSummary(records[0]) : undefined,
    statusCounts,
    totalOutcomeBatches: records.length,
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecordSummary(
  record: OfferReleaseProviderOutcomePersistenceRecord,
): NormalizedRecordSummary {
  const commandOutcomes = record.commandOutcomes.map(normalizeCommandOutcome).sort(sortOutcomes)
  return {
    appliedCommandCount: commandOutcomes.filter((outcome) => outcome.status === "applied").length,
    commandCount: commandOutcomes.length,
    failedCommandCount: commandOutcomes.filter((outcome) => outcome.status === "failed").length,
    failedCommandKeys: commandOutcomes.filter((outcome) => outcome.status === "failed").map((outcome) => outcome.key),
    offerId: nonBlank(record.offerId, "record.offerId"),
    offerNumber: nonBlank(record.offerNumber, "record.offerNumber"),
    outcomeFingerprint: nonBlank(record.outcomeFingerprint, "record.outcomeFingerprint"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "record.recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "record.recordedBy"),
    releaseAt: normalizeIsoTimestamp(record.releaseAt, "record.releaseAt"),
    rfqId: nonBlank(record.rfqId, "record.rfqId"),
    warningCount: commandOutcomes.reduce((total, outcome) => total + outcome.warnings.length, 0),
    commandOutcomes,
  }
}

function toPublicRecordSummary(record: NormalizedRecordSummary): OfferReleaseProviderOutcomeHistoryRecordSummary {
  return {
    appliedCommandCount: record.appliedCommandCount,
    commandCount: record.commandCount,
    failedCommandCount: record.failedCommandCount,
    failedCommandKeys: [...record.failedCommandKeys],
    offerId: record.offerId,
    offerNumber: record.offerNumber,
    outcomeFingerprint: record.outcomeFingerprint,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    releaseAt: record.releaseAt,
    rfqId: record.rfqId,
    warningCount: record.warningCount,
  }
}

function normalizeCommandOutcome(outcome: OfferReleaseCommandOutcomeInput): NormalizedCommandOutcome {
  return {
    key: nonBlank(outcome.key, "commandOutcomes.key"),
    status: normalizeStatus(outcome.status),
    warnings: [...new Set((outcome.warnings ?? []).map((warning) => warning.trim()).filter(Boolean))],
  }
}

function sortNewestFirst(
  left: NormalizedRecordSummary,
  right: NormalizedRecordSummary,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.outcomeFingerprint, right.outcomeFingerprint) ||
    compareLex(left.offerId, right.offerId) ||
    compareLex(left.releaseAt, right.releaseAt)
  )
}

function sortOutcomes(left: NormalizedCommandOutcome, right: NormalizedCommandOutcome): number {
  return compareLex(left.key, right.key) || compareLex(left.status, right.status)
}

function countOutcomeStatuses(
  records: NormalizedRecordSummary[],
): Partial<Record<OfferReleaseCommandOutcomeInput["status"], number>> {
  return records.reduce<Partial<Record<OfferReleaseCommandOutcomeInput["status"], number>>>((counts, record) => {
    counts.applied = (counts.applied ?? 0) + record.appliedCommandCount
    counts.failed = (counts.failed ?? 0) + record.failedCommandCount
    return counts
  }, {})
}

function summarizeCommands(
  records: NormalizedRecordSummary[],
): OfferReleaseProviderOutcomeCommandSummary[] {
  const byCommand = new Map<string, CommandSummaryAccumulator>()

  for (const record of records) {
    for (const outcome of record.commandOutcomes) {
      appendCommandSummary(byCommand, outcome.key, record.recordedAt, outcome.status)
    }
  }

  return [...byCommand.entries()]
    .map(([commandKey, summary]) => ({
      commandKey,
      latestRecordedAt: summary.latestRecordedAt,
      outcomeCount: summary.outcomeCount,
      statuses: [...summary.statuses].sort(compareLex),
    }))
    .sort((left, right) => compareLex(right.latestRecordedAt, left.latestRecordedAt) || compareLex(left.commandKey, right.commandKey))
}

function appendCommandSummary(
  byCommand: Map<string, CommandSummaryAccumulator>,
  commandKey: string,
  recordedAt: string,
  status: OfferReleaseCommandOutcomeInput["status"],
): void {
  const existing = byCommand.get(commandKey)
  if (existing) {
    existing.latestRecordedAt =
      compareLex(recordedAt, existing.latestRecordedAt) > 0 ? recordedAt : existing.latestRecordedAt
    existing.outcomeCount += 1
    existing.statuses.add(status)
    return
  }

  byCommand.set(commandKey, {
    latestRecordedAt: recordedAt,
    outcomeCount: 1,
    statuses: new Set([status]),
  })
}

function normalizeStatus(status: OfferReleaseCommandOutcomeInput["status"]): OfferReleaseCommandOutcomeInput["status"] {
  if (status !== "applied" && status !== "failed") {
    throw new Error("provider outcome history status must be applied or failed")
  }
  return status
}

interface NormalizedCommandOutcome {
  key: string
  status: OfferReleaseCommandOutcomeInput["status"]
  warnings: string[]
}

interface NormalizedRecordSummary extends OfferReleaseProviderOutcomeHistoryRecordSummary {
  commandOutcomes: NormalizedCommandOutcome[]
}

interface CommandSummaryAccumulator {
  latestRecordedAt: string
  outcomeCount: number
  statuses: Set<OfferReleaseCommandOutcomeInput["status"]>
}
