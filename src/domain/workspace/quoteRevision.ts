import type { QuoteEngineResult } from "../quoting/registry"
import { normalizeIsoTimestamp } from "../shared/deterministic"
import type { QuoteComparisonResult, QuoteComparisonRow, QuoteComparisonScenario } from "./quoteComparison"

export const QUOTE_REVISION_AUDIT_VERSION = "quote-revision-audit.v1"

export type QuoteRevisionDecisionKind = "selected_scenario" | "quote_delta" | "calculator_warning" | "handoff_note"
export type QuoteRevisionDecisionSeverity = "info" | "warning"

export interface QuoteRevisionChange {
  field: string
  before: string
  after: string
  reason?: string
}

export interface QuoteRevisionDecision {
  kind: QuoteRevisionDecisionKind
  severity: QuoteRevisionDecisionSeverity
  detail: string
}

export interface QuoteRevisionSelectedScenario {
  id: string
  label: string
  rank: number
  score: number
  priceDeltaCents: number
  leadTimeDeltaDays: number
  recommendationReasons: string[]
}

export interface QuoteRevisionQuoteSummary {
  process: QuoteEngineResult["process"]
  calculatorVersion: string
  partNumber: string
  quantity: number
  currency: QuoteEngineResult["currency"]
  totalCents: number
  unitPriceCents: number
  leadTimeDays: number
  warningCount: number
}

export interface QuoteRevisionAuditInput {
  quoteId: string
  revision: number
  author: string
  createdAt: string
  comparison: QuoteComparisonResult
  scenarios: QuoteComparisonScenario[]
  changes?: QuoteRevisionChange[]
  handoffNotes?: string[]
  previousQuote?: QuoteEngineResult
  rfqId?: string
  selectedScenarioId?: string
}

export interface QuoteRevisionAudit {
  auditVersion: typeof QUOTE_REVISION_AUDIT_VERSION
  quoteId: string
  revision: number
  revisionKey: string
  author: string
  createdAt: string
  comparisonVersion: QuoteComparisonResult["comparisonVersion"]
  selectedScenario: QuoteRevisionSelectedScenario
  quote: QuoteRevisionQuoteSummary
  changes: QuoteRevisionChange[]
  decisions: QuoteRevisionDecision[]
  handoffNotes: string[]
  rfqId?: string
}

export function buildQuoteRevisionAudit(input: QuoteRevisionAuditInput): QuoteRevisionAudit {
  const quoteId = nonBlank(input.quoteId, "quoteId")
  const revision = positiveInteger(input.revision, "revision")
  const author = nonBlank(input.author, "author")
  const createdAt = normalizeIsoTimestamp(input.createdAt, "createdAt")
  const selectedScenarioId = nonBlank(input.selectedScenarioId ?? input.comparison.recommendedScenarioId, "selectedScenarioId")
  const selectedRow = input.comparison.rows.find((row) => row.id === selectedScenarioId)
  if (!selectedRow) {
    throw new Error("selectedScenarioId must exist in comparison rows")
  }

  const selectedScenario = input.scenarios.find((scenario) => scenario.id === selectedScenarioId)
  if (!selectedScenario) {
    throw new Error("selectedScenarioId must exist in scenarios")
  }
  validateScenarioMatchesComparison(selectedScenario, selectedRow, input.comparison)

  const previousQuote = input.previousQuote
  if (previousQuote) {
    validatePreviousQuote(previousQuote, selectedScenario.quote)
  }

  const changes = normalizeChanges(input.changes ?? [])
  const handoffNotes = normalizeNotes(input.handoffNotes ?? [])
  const selectedScenarioSummary = {
    id: selectedRow.id,
    label: selectedRow.label,
    rank: selectedRow.rank,
    score: selectedRow.score,
    priceDeltaCents: selectedRow.priceDeltaCents,
    leadTimeDeltaDays: selectedRow.leadTimeDeltaDays,
    recommendationReasons: [...selectedRow.recommendationReasons],
  }
  const quote = summarizeQuote(selectedScenario.quote)

  return {
    auditVersion: QUOTE_REVISION_AUDIT_VERSION,
    quoteId,
    revision,
    revisionKey: `${quoteId}:r${revision}`,
    author,
    createdAt,
    comparisonVersion: input.comparison.comparisonVersion,
    selectedScenario: selectedScenarioSummary,
    quote,
    changes,
    decisions: buildDecisions({
      comparison: input.comparison,
      handoffNotes,
      previousQuote,
      selectedQuote: selectedScenario.quote,
      selectedScenario: selectedScenarioSummary,
    }),
    handoffNotes,
    rfqId: optionalTrim(input.rfqId),
  }
}

export function duplicateQuoteScenario(
  source: QuoteComparisonScenario,
  next: { id: string; label: string },
): QuoteComparisonScenario {
  const quote = source.quote

  return {
    id: nonBlank(next.id, "id"),
    label: nonBlank(next.label, "label"),
    quote: {
      ...quote,
      assumptions: quote.assumptions.map((assumption) => ({ ...assumption })),
      breakdown: quote.breakdown.map((line) => ({ ...line })),
      warnings: [...quote.warnings],
    },
  }
}

function buildDecisions(input: {
  comparison: QuoteComparisonResult
  handoffNotes: string[]
  previousQuote?: QuoteEngineResult
  selectedQuote: QuoteEngineResult
  selectedScenario: QuoteRevisionSelectedScenario
}): QuoteRevisionDecision[] {
  const decisions: QuoteRevisionDecision[] = []
  const recommendedRow = input.comparison.rows.find((row) => row.id === input.comparison.recommendedScenarioId)
  const selectedLabel = input.selectedScenario.label

  decisions.push({
    kind: "selected_scenario",
    severity: "info",
    detail:
      input.selectedScenario.id === input.comparison.recommendedScenarioId
        ? `Selected recommended scenario ${selectedLabel}.`
        : `Selected ${selectedLabel} over recommended scenario ${recommendedRow?.label ?? input.comparison.recommendedScenarioId}.`,
  })

  if (input.previousQuote) {
    const totalDeltaCents = input.selectedQuote.totalCents - input.previousQuote.totalCents
    const leadTimeDeltaDays = input.selectedQuote.leadTimeDays - input.previousQuote.leadTimeDays
    decisions.push({
      kind: "quote_delta",
      severity: "info",
      detail: `Revision delta: ${formatSignedCents(totalDeltaCents, input.selectedQuote.currency)} total, ${formatSignedDays(
        leadTimeDeltaDays,
      )} lead time.`,
    })
  }

  for (const warning of input.selectedQuote.warnings) {
    decisions.push({
      kind: "calculator_warning",
      severity: "warning",
      detail: warning,
    })
  }

  for (const note of input.handoffNotes) {
    decisions.push({
      kind: "handoff_note",
      severity: "info",
      detail: note,
    })
  }

  return decisions
}

function summarizeQuote(quote: QuoteEngineResult): QuoteRevisionQuoteSummary {
  return {
    process: quote.process,
    calculatorVersion: quote.calculatorVersion,
    partNumber: quote.partNumber,
    quantity: quote.quantity,
    currency: quote.currency,
    totalCents: quote.totalCents,
    unitPriceCents: quote.unitPriceCents,
    leadTimeDays: quote.leadTimeDays,
    warningCount: quote.warnings.length,
  }
}

function validateScenarioMatchesComparison(
  scenario: QuoteComparisonScenario,
  row: QuoteComparisonRow,
  comparison: QuoteComparisonResult,
) {
  if (scenario.quote.partNumber !== comparison.partNumber) {
    throw new Error("selected scenario partNumber must match comparison")
  }
  if (scenario.quote.quantity !== comparison.quantity) {
    throw new Error("selected scenario quantity must match comparison")
  }
  if (scenario.quote.currency !== comparison.currency) {
    throw new Error("selected scenario currency must match comparison")
  }
  if (scenario.quote.totalCents !== row.totalCents) {
    throw new Error("selected scenario totalCents must match comparison row")
  }
  if (scenario.quote.unitPriceCents !== row.unitPriceCents) {
    throw new Error("selected scenario unitPriceCents must match comparison row")
  }
  if (scenario.quote.leadTimeDays !== row.leadTimeDays) {
    throw new Error("selected scenario leadTimeDays must match comparison row")
  }
  if (scenario.quote.warnings.length !== row.warningCount) {
    throw new Error("selected scenario warning count must match comparison row")
  }
}

function validatePreviousQuote(previousQuote: QuoteEngineResult, selectedQuote: QuoteEngineResult) {
  if (previousQuote.partNumber !== selectedQuote.partNumber) {
    throw new Error("previousQuote partNumber must match selected quote")
  }
  if (previousQuote.currency !== selectedQuote.currency) {
    throw new Error("previousQuote currency must match selected quote")
  }
}

function normalizeChanges(changes: QuoteRevisionChange[]): QuoteRevisionChange[] {
  return changes.map((change, index) => {
    const normalized: QuoteRevisionChange = {
      field: nonBlank(change.field, `changes[${index}].field`),
      before: nonBlank(change.before, `changes[${index}].before`),
      after: nonBlank(change.after, `changes[${index}].after`),
    }
    const reason = optionalTrim(change.reason)
    if (reason) {
      normalized.reason = reason
    }
    return normalized
  })
}

function normalizeNotes(notes: string[]): string[] {
  return notes.map((note) => note.trim()).filter(Boolean)
}

function formatSignedCents(cents: number, currency: QuoteEngineResult["currency"]) {
  const sign = cents > 0 ? "+" : cents < 0 ? "-" : ""
  const absolute = Math.abs(cents)
  const major = Math.floor(absolute / 100)
  const minor = String(absolute % 100).padStart(2, "0")
  return `${sign}${currency} ${major}.${minor}`
}

function formatSignedDays(days: number) {
  if (days === 0) {
    return "0 days"
  }
  return `${days > 0 ? "+" : ""}${days} days`
}

function positiveInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
  return value
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
