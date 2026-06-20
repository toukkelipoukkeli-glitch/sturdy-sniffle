import type { AiProviderKey, ProviderPurpose, ProviderRunStatus } from "./ai"
import type { ProviderRunAudit } from "./providerRunAudit"

export type ProviderRunHistoryFilter = "all" | "failed" | "fallbacks" | "skipped" | "succeeded" | "warnings"

export interface ProviderRunHistoryEvent {
  key: string
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

  return {
    events,
    failedCount: audits.filter((audit) => audit.status === "failed").length,
    fallbackCount: audits.filter(hasFallbackWarning).length,
    filter,
    skippedCount: audits.filter((audit) => audit.status === "skipped").length,
    succeededCount: audits.filter((audit) => audit.status === "succeeded").length,
    totalRuns: audits.length,
    warningCount: audits.reduce((count, audit) => count + audit.warnings.length, 0),
  }
}

function auditEvent(audit: ProviderRunAudit): ProviderRunHistoryEvent {
  const detail = audit.errorMessage ?? audit.outputSummary ?? audit.promptExcerpt
  return {
    key: audit.runKey,
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
