import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type { OfferReleaseExecutionRun, OfferReleaseExecutionStatus } from "./offerReleaseExecution"

export const OFFER_RELEASE_EXECUTION_HISTORY_VERSION = "offer-release-execution-history.v1"

export interface OfferReleaseExecutionHistorySummary {
  historyVersion: typeof OFFER_RELEASE_EXECUTION_HISTORY_VERSION
  totalRuns: number
  latestRun?: OfferReleaseExecutionHistoryRunSummary
  statusCounts: Partial<Record<OfferReleaseExecutionStatus, number>>
  repeatedFingerprints: OfferReleaseExecutionFingerprintSummary[]
  warningCount: number
  pendingActionCount: number
}

export interface OfferReleaseExecutionHistoryRunSummary {
  executionFingerprint: string
  executedAt: string
  mode: OfferReleaseExecutionRun["mode"]
  offerId: string
  offerNumber: string
  status: OfferReleaseExecutionStatus
}

export interface OfferReleaseExecutionFingerprintSummary {
  executionFingerprint: string
  count: number
  latestExecutedAt: string
  statuses: OfferReleaseExecutionStatus[]
}

export function summarizeOfferReleaseExecutionHistory(
  runs: OfferReleaseExecutionRun[],
): OfferReleaseExecutionHistorySummary {
  const normalizedRuns = runs.map(normalizeHistoryRun).sort(sortNewestFirst)
  const statusCounts = countStatuses(normalizedRuns)
  const repeatedFingerprints = summarizeRepeatedFingerprints(normalizedRuns)

  return {
    historyVersion: OFFER_RELEASE_EXECUTION_HISTORY_VERSION,
    totalRuns: normalizedRuns.length,
    latestRun: normalizedRuns[0],
    statusCounts,
    repeatedFingerprints,
    warningCount: normalizedRuns.reduce((total, run) => total + run.warningCount, 0),
    pendingActionCount: normalizedRuns.reduce((total, run) => total + run.pendingActionCount, 0),
  }
}

function normalizeHistoryRun(run: OfferReleaseExecutionRun): NormalizedHistoryRun {
  const executionFingerprint = nonBlank(run.executionFingerprint, "executionFingerprint")
  return {
    executionFingerprint,
    executedAt: normalizeIsoTimestamp(run.executedAt, "executedAt"),
    mode: run.mode,
    offerId: nonBlank(run.offerId, "offerId"),
    offerNumber: nonBlank(run.offerNumber, "offerNumber"),
    pendingActionCount: run.nextActions.length,
    status: run.status,
    warningCount: run.warnings.length,
  }
}

function sortNewestFirst(left: NormalizedHistoryRun, right: NormalizedHistoryRun) {
  return compareLex(right.executedAt, left.executedAt) || compareLex(left.executionFingerprint, right.executionFingerprint)
}

function countStatuses(runs: NormalizedHistoryRun[]): Partial<Record<OfferReleaseExecutionStatus, number>> {
  return runs.reduce<Partial<Record<OfferReleaseExecutionStatus, number>>>((counts, run) => {
    counts[run.status] = (counts[run.status] ?? 0) + 1
    return counts
  }, {})
}

function summarizeRepeatedFingerprints(runs: NormalizedHistoryRun[]): OfferReleaseExecutionFingerprintSummary[] {
  const byFingerprint = new Map<string, NormalizedHistoryRun[]>()
  for (const run of runs) {
    byFingerprint.set(run.executionFingerprint, [...(byFingerprint.get(run.executionFingerprint) ?? []), run])
  }

  return [...byFingerprint.entries()]
    .flatMap(([executionFingerprint, fingerprintRuns]) => {
      if (fingerprintRuns.length < 2) {
        return []
      }
      const sortedRuns = [...fingerprintRuns].sort(sortNewestFirst)
      return [
        {
          executionFingerprint,
          count: sortedRuns.length,
          latestExecutedAt: sortedRuns[0].executedAt,
          statuses: uniqueStatuses(sortedRuns),
        },
      ]
    })
    .sort((left, right) => compareLex(right.latestExecutedAt, left.latestExecutedAt) || compareLex(left.executionFingerprint, right.executionFingerprint))
}

function uniqueStatuses(runs: NormalizedHistoryRun[]): OfferReleaseExecutionStatus[] {
  return [...new Set(runs.map((run) => run.status))].sort(compareLex)
}

interface NormalizedHistoryRun extends OfferReleaseExecutionHistoryRunSummary {
  pendingActionCount: number
  warningCount: number
}
