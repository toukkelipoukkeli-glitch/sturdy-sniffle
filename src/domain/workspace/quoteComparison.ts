import type { QuoteEngineResult } from "../quoting/registry"
import { compareLex } from "../shared/deterministic"

export const QUOTE_COMPARISON_VERSION = "quote-comparison.v1"

export interface QuoteComparisonScenario {
  id: string
  label: string
  quote: QuoteEngineResult
}

export interface QuoteComparisonRow {
  id: string
  label: string
  rank: number
  partNumber: string
  quantity: number
  totalCents: number
  unitPriceCents: number
  leadTimeDays: number
  warningCount: number
  priceDeltaCents: number
  leadTimeDeltaDays: number
  score: number
  recommendationReasons: string[]
}

export interface QuoteComparisonResult {
  comparisonVersion: typeof QUOTE_COMPARISON_VERSION
  recommendedScenarioId: string
  currency: QuoteEngineResult["currency"]
  partNumber: string
  quantity: number
  rows: QuoteComparisonRow[]
}

export function compareQuoteScenarios(scenarios: QuoteComparisonScenario[]): QuoteComparisonResult {
  if (scenarios.length === 0) {
    throw new Error("At least one quote scenario is required")
  }

  const normalizedScenarios = scenarios.map(normalizeScenario)
  validateComparableQuotes(normalizedScenarios)

  const totals = normalizedScenarios.map((scenario) => scenario.quote.totalCents)
  const leadTimes = normalizedScenarios.map((scenario) => scenario.quote.leadTimeDays)
  const minTotal = Math.min(...totals)
  const minLeadTime = Math.min(...leadTimes)
  const rows = normalizedScenarios
    .map((scenario) => buildComparisonRow(scenario, minTotal, minLeadTime))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.totalCents - right.totalCents ||
        left.leadTimeDays - right.leadTimeDays ||
        compareLex(left.label, right.label),
    )
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }))

  return {
    comparisonVersion: QUOTE_COMPARISON_VERSION,
    recommendedScenarioId: rows[0].id,
    currency: normalizedScenarios[0].quote.currency,
    partNumber: normalizedScenarios[0].quote.partNumber,
    quantity: normalizedScenarios[0].quote.quantity,
    rows,
  }
}

function normalizeScenario(scenario: QuoteComparisonScenario): QuoteComparisonScenario {
  return {
    id: nonBlank(scenario.id, "scenario.id"),
    label: nonBlank(scenario.label, "scenario.label"),
    quote: scenario.quote,
  }
}

function validateComparableQuotes(scenarios: QuoteComparisonScenario[]) {
  const first = scenarios[0].quote
  for (const scenario of scenarios) {
    if (scenario.quote.partNumber !== first.partNumber) {
      throw new Error("quote scenarios must use the same partNumber")
    }
    if (scenario.quote.quantity !== first.quantity) {
      throw new Error("quote scenarios must use the same quantity")
    }
    if (scenario.quote.currency !== first.currency) {
      throw new Error("quote scenarios must use the same currency")
    }
  }
}

function buildComparisonRow(
  scenario: QuoteComparisonScenario,
  minTotal: number,
  minLeadTime: number,
): Omit<QuoteComparisonRow, "rank"> {
  const quote = scenario.quote
  const priceScore = minTotal === 0 ? 60 : (minTotal / quote.totalCents) * 60
  const leadScore = minLeadTime === 0 ? 25 : (minLeadTime / quote.leadTimeDays) * 25
  const warningScore = Math.max(0, 15 - quote.warnings.length * 5)
  const score = Math.round(priceScore + leadScore + warningScore)

  return {
    id: scenario.id,
    label: scenario.label,
    partNumber: quote.partNumber,
    quantity: quote.quantity,
    totalCents: quote.totalCents,
    unitPriceCents: quote.unitPriceCents,
    leadTimeDays: quote.leadTimeDays,
    warningCount: quote.warnings.length,
    priceDeltaCents: quote.totalCents - minTotal,
    leadTimeDeltaDays: quote.leadTimeDays - minLeadTime,
    score,
    recommendationReasons: buildReasons(quote, minTotal, minLeadTime),
  }
}

function buildReasons(quote: QuoteEngineResult, minTotal: number, minLeadTime: number): string[] {
  const reasons: string[] = []
  if (quote.totalCents === minTotal) {
    reasons.push("Lowest total price.")
  }
  if (quote.leadTimeDays === minLeadTime) {
    reasons.push("Shortest lead time.")
  }
  if (quote.warnings.length === 0) {
    reasons.push("No calculator review flags.")
  } else {
    reasons.push(`${quote.warnings.length} calculator review flag${quote.warnings.length === 1 ? "" : "s"}.`)
  }
  return reasons
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
