import type { NonCncQuoteProcessKey, ProcessDemoQuote } from "./processDemoQuotes"
import type { QuoteEngineAssumption, QuoteEngineBreakdownLine, QuoteEngineResult } from "./registry"

export const PROCESS_QUOTE_PREVIEW_VERSION = "process-quote-preview.v1"

export interface ProcessQuotePreviewOption {
  process: NonCncQuoteProcessKey
  label: string
  selected: boolean
  badges: string[]
  totalCents: number
  leadTimeDays: number
  currency: QuoteEngineResult["currency"]
}

export type ProcessQuotePreviewChecklistLevel = "ready" | "review" | "blocked"

export interface ProcessQuotePreviewChecklistItem {
  key: string
  label: string
  detail: string
  level: ProcessQuotePreviewChecklistLevel
}

export interface ProcessQuotePreviewComparison {
  cheapestLabel: string
  cheapestTotalCents: number
  fastestLabel: string
  fastestLeadTimeDays: number
  selectedLeadTimeDeltaDays: number
  selectedPriceDeltaCents: number
  currency: QuoteEngineResult["currency"]
}

export interface ProcessQuotePreview {
  previewVersion: typeof PROCESS_QUOTE_PREVIEW_VERSION
  selected: ProcessDemoQuote
  comparison: ProcessQuotePreviewComparison
  options: ProcessQuotePreviewOption[]
  editable: false
  guardrailCopy: string
  operatorChecklist: ProcessQuotePreviewChecklistItem[]
  reviewFlags: string[]
  summaryText: string
  topAssumptions: QuoteEngineAssumption[]
  topBreakdown: QuoteEngineBreakdownLine[]
}

export function buildProcessQuotePreview(demos: ProcessDemoQuote[], selectedProcess?: NonCncQuoteProcessKey): ProcessQuotePreview {
  if (demos.length === 0) {
    throw new Error("At least one process demo quote is required")
  }
  const currencies = new Set(demos.map((demo) => demo.quote.currency))
  if (currencies.size !== 1) {
    throw new Error("Process demo quotes must share a currency before computing comparison badges")
  }
  const selected = demos.find((demo) => demo.process === selectedProcess) ?? demos[0]
  const operatorChecklist = buildOperatorChecklist(selected)
  const lowestTotalCents = Math.min(...demos.map((demo) => demo.quote.totalCents))
  const shortestLeadTimeDays = Math.min(...demos.map((demo) => demo.quote.leadTimeDays))

  return {
    previewVersion: PROCESS_QUOTE_PREVIEW_VERSION,
    selected,
    comparison: buildComparisonSummary(selected, demos, lowestTotalCents, shortestLeadTimeDays),
    options: demos.map((demo) => ({
      process: demo.process,
      label: demo.label,
      selected: demo.process === selected.process,
      badges: buildOptionBadges(demo, lowestTotalCents, shortestLeadTimeDays),
      totalCents: demo.quote.totalCents,
      leadTimeDays: demo.quote.leadTimeDays,
      currency: demo.quote.currency,
    })),
    editable: false,
    guardrailCopy: "Read-only registry fixture. Process-specific editable inputs are not enabled yet.",
    operatorChecklist,
    reviewFlags: selected.quote.warnings,
    summaryText: buildPreviewSummaryText(selected, operatorChecklist),
    topAssumptions: selected.quote.assumptions.slice(0, 4),
    topBreakdown: selected.quote.breakdown.slice(0, 5),
  }
}

function buildComparisonSummary(
  selected: ProcessDemoQuote,
  demos: ProcessDemoQuote[],
  lowestTotalCents: number,
  shortestLeadTimeDays: number,
): ProcessQuotePreviewComparison {
  const cheapest = demos.find((demo) => demo.quote.totalCents === lowestTotalCents) ?? selected
  const fastest = demos.find((demo) => demo.quote.leadTimeDays === shortestLeadTimeDays) ?? selected
  return {
    cheapestLabel: cheapest.label,
    cheapestTotalCents: lowestTotalCents,
    currency: selected.quote.currency,
    fastestLabel: fastest.label,
    fastestLeadTimeDays: shortestLeadTimeDays,
    selectedLeadTimeDeltaDays: selected.quote.leadTimeDays - shortestLeadTimeDays,
    selectedPriceDeltaCents: selected.quote.totalCents - lowestTotalCents,
  }
}

function buildOptionBadges(
  demo: ProcessDemoQuote,
  lowestTotalCents: number,
  shortestLeadTimeDays: number,
): string[] {
  return [
    demo.quote.totalCents === lowestTotalCents ? "Best price" : undefined,
    demo.quote.leadTimeDays === shortestLeadTimeDays ? "Fastest lead" : undefined,
    demo.quote.warnings.length > 0 ? "Review flags" : undefined,
  ].filter((badge): badge is string => Boolean(badge))
}

function buildOperatorChecklist(selected: ProcessDemoQuote): ProcessQuotePreviewChecklistItem[] {
  return [
    {
      detail: `${selected.label} totals came from ${selected.quote.calculatorVersion}.`,
      key: "calculator-ready",
      label: "Calculator ready",
      level: "ready",
    },
    {
      detail: "Editable process-specific inputs are not enabled yet.",
      key: "editable-inputs",
      label: "Input model read-only",
      level: "blocked",
    },
    {
      detail: "Use this preview for operator comparison only; releases still use the active RFQ quote.",
      key: "offer-wiring",
      label: "Offer wiring pending",
      level: "review",
    },
    {
      detail:
        selected.quote.warnings.length > 0
          ? `${selected.quote.warnings.length} calculator flag${selected.quote.warnings.length === 1 ? " requires" : "s require"} review.`
          : "No calculator flags on this fixture.",
      key: "calculator-flags",
      label: "Calculator flags",
      level: selected.quote.warnings.length > 0 ? "review" : "ready",
    },
  ]
}

function buildPreviewSummaryText(
  selected: ProcessDemoQuote,
  operatorChecklist: ProcessQuotePreviewChecklistItem[],
): string {
  const quote = selected.quote
  return [
    "Non-CNC quote preview",
    `Process: ${selected.label}`,
    `Part: ${quote.partNumber}`,
    `Quantity: ${quote.quantity}`,
    `Lead time: ${quote.leadTimeDays} days`,
    `Total: ${formatPreviewCurrency(quote.totalCents, quote.currency)}`,
    `Unit: ${formatPreviewCurrency(quote.unitPriceCents, quote.currency)}`,
    `Calculator: ${quote.calculatorVersion}`,
    "Mode: Read-only registry fixture; process-specific editable inputs are not enabled yet.",
    "",
    "Top assumptions:",
    ...quote.assumptions.slice(0, 4).map((assumption) => `- ${assumption.key}: ${assumption.value}`),
    "",
    "Operator checklist:",
    ...operatorChecklist.map((item) => `- ${item.label} [${item.level}]: ${item.detail}`),
    "",
    "Review flags:",
    ...(quote.warnings.length > 0 ? quote.warnings.map((warning) => `- ${warning}`) : ["- No calculator flags"]),
  ].join("\n")
}

function formatPreviewCurrency(cents: number, currency: QuoteEngineResult["currency"]): string {
  return `${currency} ${(cents / 100).toFixed(2)}`
}
