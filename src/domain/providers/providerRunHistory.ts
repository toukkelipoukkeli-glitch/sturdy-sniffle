import type { AiProviderKey, ProviderPurpose, ProviderRunStatus } from "./ai"
import type { ProviderRunAudit } from "./providerRunAudit"

export type ProviderRunHistoryFilter = "all" | "failed" | "fallbacks" | "skipped" | "succeeded" | "warnings"

export interface ProviderRunHistoryEvent {
  provider: AiProviderKey
  purpose: ProviderPurpose
  runKey: string
  status: ProviderRunStatus
  summary: string
  usedFallback: boolean
  warningCount: number
}

export interface ProviderRunHistorySummary {
  events: ProviderRunHistoryEvent[]
  failedCount: number
  fallbackCount: number
  filter: ProviderRunHistoryFilter
  skippedCount: number
  succeededCount: number
  totalRuns: number
  warningCount: number
}

export interface BuildProviderRunHistorySummaryOptions {
  filter?: ProviderRunHistoryFilter
}

export function buildProviderRunHistorySummary(
  audits: ProviderRunAudit[],
  options: BuildProviderRunHistorySummaryOptions = {},
): ProviderRunHistorySummary {
  const filter = options.filter ?? "all"
  const sortedAudits = [...audits].sort(compareAudits)
  const events = sortedAudits.map(auditEvent).filter((event) => eventMatchesFilter(event, filter))
  const counts = audits.reduce(
    (current, audit) => ({
      failed: current.failed + (audit.status === "failed" ? 1 : 0),
      fallback: current.fallback + (hasFallbackWarning(audit) ? 1 : 0),
      skipped: current.skipped + (audit.status === "skipped" ? 1 : 0),
      succeeded: current.succeeded + (audit.status === "succeeded" ? 1 : 0),
      warnings: current.warnings + audit.warnings.length,
    }),
    { failed: 0, fallback: 0, skipped: 0, succeeded: 0, warnings: 0 },
  )

  return {
    events,
    failedCount: counts.failed,
    fallbackCount: counts.fallback,
    filter,
    skippedCount: counts.skipped,
    succeededCount: counts.succeeded,
    totalRuns: audits.length,
    warningCount: counts.warnings,
  }
}

function auditEvent(audit: ProviderRunAudit): ProviderRunHistoryEvent {
  const detail = audit.errorMessage ?? audit.outputSummary ?? audit.promptExcerpt
  return {
    provider: audit.provider,
    purpose: audit.purpose,
    runKey: audit.runKey,
    status: audit.status,
    summary: compactSummary(detail),
    usedFallback: hasFallbackWarning(audit),
    warningCount: audit.warnings.length,
  }
}

function compareAudits(left: ProviderRunAudit, right: ProviderRunAudit): number {
  return right.startedAt.localeCompare(left.startedAt) || left.runKey.localeCompare(right.runKey)
}

function eventMatchesFilter(event: ProviderRunHistoryEvent, filter: ProviderRunHistoryFilter): boolean {
  switch (filter) {
    case "all":
      return true
    case "failed":
      return event.status === "failed"
    case "fallbacks":
      return event.usedFallback
    case "skipped":
      return event.status === "skipped"
    case "succeeded":
      return event.status === "succeeded"
    case "warnings":
      return event.warningCount > 0
  }
}

function hasFallbackWarning(audit: ProviderRunAudit): boolean {
  return audit.provider === "mock" || audit.warnings.some((warning) => warning.toLowerCase().includes("fallback"))
}

function compactSummary(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 240)
}
