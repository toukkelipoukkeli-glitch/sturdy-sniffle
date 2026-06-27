import type { NonCncQuoteProcessKey, ProcessDemoQuote } from "./processDemoQuotes"
import type { QuoteEngineBreakdownLine, QuoteEngineResult } from "./registry"

export const PROCESS_QUOTE_PREVIEW_VERSION = "process-quote-preview.v1"

export interface ProcessQuotePreviewOption {
  process: NonCncQuoteProcessKey
  label: string
  selected: boolean
  totalCents: number
  leadTimeDays: number
  currency: QuoteEngineResult["currency"]
}

export interface ProcessQuotePreview {
  previewVersion: typeof PROCESS_QUOTE_PREVIEW_VERSION
  selected: ProcessDemoQuote
  options: ProcessQuotePreviewOption[]
  editable: false
  guardrailCopy: string
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
    topBreakdown: selected.quote.breakdown.slice(0, 5),
  }
}
