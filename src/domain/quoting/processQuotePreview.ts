import type { NonCncQuoteProcessKey, ProcessDemoQuote } from "./processDemoQuotes"
import { buildProcessInputDraft, type ProcessInputDraft } from "./processInputDraft"
import { evaluateProcessInputPromotionGate, type ProcessInputPromotionGate } from "./processInputPromotionGate"
import { buildProcessInputReadiness, type ProcessInputReadiness } from "./processInputReadiness"
import type { QuoteEngineAssumption, QuoteEngineBreakdownLine, QuoteEngineResult } from "./registry"

export const PROCESS_QUOTE_PREVIEW_VERSION = "process-quote-preview.v5"

export interface ProcessQuotePreviewOption {
  process: NonCncQuoteProcessKey
  label: string
  selected: boolean
  badges: string[]
  draftCoverageLabel: string
  draftStatus: ProcessInputDraft["status"]
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
  inputDraft: ProcessInputDraft
  inputPromotionGate: ProcessInputPromotionGate
  inputReadiness: ProcessInputReadiness
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
  const comparison = buildComparisonSummary(selected, demos, lowestTotalCents, shortestLeadTimeDays)
  const inputReadiness = buildProcessInputReadiness(selected.process)
  const inputDraftsByProcess = new Map(demos.map((demo) => [demo.process, buildProcessInputDraft(demo.process)]))
  const inputDraft = inputDraftsByProcess.get(selected.process) ?? buildProcessInputDraft(selected.process)
  const inputPromotionGate = evaluateProcessInputPromotionGate(inputReadiness, inputDraft)

  return {
    previewVersion: PROCESS_QUOTE_PREVIEW_VERSION,
    selected,
    comparison,
    inputDraft,
    inputPromotionGate,
    inputReadiness,
    options: demos.map((demo) => {
      const optionDraft = inputDraftsByProcess.get(demo.process)
      if (!optionDraft) {
        throw new Error(`Missing input draft for ${demo.process}`)
      }
      return {
        process: demo.process,
        label: demo.label,
        selected: demo.process === selected.process,
        badges: buildOptionBadges(demo, lowestTotalCents, shortestLeadTimeDays, optionDraft),
        draftCoverageLabel: `${optionDraft.populatedRequiredCount}/${optionDraft.requiredCount} inputs`,
        draftStatus: optionDraft.status,
        totalCents: demo.quote.totalCents,
        leadTimeDays: demo.quote.leadTimeDays,
        currency: demo.quote.currency,
      }
    }),
    editable: false,
    guardrailCopy: "Read-only registry fixture. Process-specific editable inputs are not enabled yet.",
    operatorChecklist,
    reviewFlags: selected.quote.warnings,
    summaryText: buildPreviewSummaryText(selected, operatorChecklist, comparison, inputReadiness, inputDraft, inputPromotionGate),
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
  const cheapestCandidates = demos.filter((demo) => demo.quote.totalCents === lowestTotalCents)
  const fastestCandidates = demos.filter((demo) => demo.quote.leadTimeDays === shortestLeadTimeDays)
  const cheapest = cheapestCandidates.find((demo) => demo.process === selected.process) ?? cheapestCandidates[0] ?? selected
  const fastest = fastestCandidates.find((demo) => demo.process === selected.process) ?? fastestCandidates[0] ?? selected
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
  inputDraft: ProcessInputDraft,
): string[] {
  return [
    demo.quote.totalCents === lowestTotalCents ? "Best price" : undefined,
    demo.quote.leadTimeDays === shortestLeadTimeDays ? "Fastest lead" : undefined,
    demo.quote.warnings.length > 0 ? "Review flags" : undefined,
    inputDraft.status === "ready_for_read_only_review" ? "Draft complete" : "Draft gaps",
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
  comparison: ProcessQuotePreviewComparison,
  inputReadiness: ProcessInputReadiness,
  inputDraft: ProcessInputDraft,
  inputPromotionGate: ProcessInputPromotionGate,
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
    "Comparison:",
    `- Best price: ${comparison.cheapestLabel} (${formatPreviewCurrency(comparison.cheapestTotalCents, comparison.currency)})`,
    `- Fastest lead: ${comparison.fastestLabel} (${comparison.fastestLeadTimeDays} days)`,
    `- Selected delta: ${formatPreviewDelta(comparison.selectedPriceDeltaCents, comparison.currency)}, ${formatLeadDelta(comparison.selectedLeadTimeDeltaDays)}`,
    "",
    "Editable input readiness:",
    `- Status: ${inputReadiness.status}`,
    `- Required groups: ${inputReadiness.requiredGroups.join(", ")}`,
    `- Planned fields: ${inputReadiness.fieldPlans.map((field) => field.label).join(", ")}`,
    `- Draft coverage: ${inputDraft.populatedRequiredCount}/${inputDraft.requiredCount} required fields populated from ${inputDraft.source}`,
    ...inputDraft.values.map((field) => `- ${field.label}: ${field.value}`),
    `- Promotion gate: ${inputPromotionGate.status}`,
    `- Blockers: ${inputPromotionGate.blockerLabels.join(", ")}`,
    `- Next step: ${inputPromotionGate.nextStep}`,
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

function formatPreviewDelta(cents: number, currency: QuoteEngineResult["currency"]): string {
  return cents === 0 ? "best price" : `+${formatPreviewCurrency(cents, currency)}`
}

function formatLeadDelta(days: number): string {
  return days === 0 ? "fastest lead" : `+${days} days lead`
}
