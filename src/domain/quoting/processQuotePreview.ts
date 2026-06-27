import type { NonCncQuoteProcessKey, ProcessDemoQuote } from "./processDemoQuotes"
import type { QuoteEngineAssumption, QuoteEngineBreakdownLine, QuoteEngineResult } from "./registry"

export const PROCESS_QUOTE_PREVIEW_VERSION = "process-quote-preview.v1"

export interface ProcessQuotePreviewOption {
  process: NonCncQuoteProcessKey
  label: string
  selected: boolean
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

export interface ProcessQuotePreview {
  previewVersion: typeof PROCESS_QUOTE_PREVIEW_VERSION
  selected: ProcessDemoQuote
  options: ProcessQuotePreviewOption[]
  editable: false
  guardrailCopy: string
  operatorChecklist: ProcessQuotePreviewChecklistItem[]
  reviewFlags: string[]
  topAssumptions: QuoteEngineAssumption[]
  topBreakdown: QuoteEngineBreakdownLine[]
}

export function buildProcessQuotePreview(demos: ProcessDemoQuote[], selectedProcess?: NonCncQuoteProcessKey): ProcessQuotePreview {
  if (demos.length === 0) {
    throw new Error("At least one process demo quote is required")
  }
  const selected = demos.find((demo) => demo.process === selectedProcess) ?? demos[0]

  return {
    previewVersion: PROCESS_QUOTE_PREVIEW_VERSION,
    selected,
    options: demos.map((demo) => ({
      process: demo.process,
      label: demo.label,
      selected: demo.process === selected.process,
      totalCents: demo.quote.totalCents,
      leadTimeDays: demo.quote.leadTimeDays,
      currency: demo.quote.currency,
    })),
    editable: false,
    guardrailCopy: "Read-only registry fixture. Process-specific editable inputs are not enabled yet.",
    operatorChecklist: buildOperatorChecklist(selected),
    reviewFlags: selected.quote.warnings,
    topAssumptions: selected.quote.assumptions.slice(0, 4),
    topBreakdown: selected.quote.breakdown.slice(0, 5),
  }
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
