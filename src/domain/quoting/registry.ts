import { calculateCncQuote, type CncProcess, type CncQuoteInput } from "./cnc"
import { calculateFabricationQuote, type FabricationQuoteInput } from "./fabrication"
import { calculatePlasticsQuote, type PlasticsQuoteInput } from "./plastics"
import { calculateSheetMetalQuote, type SheetMetalQuoteInput } from "./sheetMetal"
import { calculateWireEdmQuote, type WireEdmQuoteInput } from "./wireEdm"

export type QuoteProcessKey = CncProcess | "sheet_metal" | "plastic" | "wire_edm" | "fabrication"
export type QuoteEngineCurrencyCode = "EUR" | "USD" | "GBP"

export type QuoteEngineInput =
  | { process: CncProcess; input: CncQuoteInput }
  | { process: "sheet_metal"; input: SheetMetalQuoteInput }
  | { process: "plastic"; input: PlasticsQuoteInput }
  | { process: "wire_edm"; input: WireEdmQuoteInput }
  | { process: "fabrication"; input: FabricationQuoteInput }

export interface QuoteEngineBreakdownLine {
  key: string
  label: string
  amountCents: number
  formula: string
  source: "calculator"
}

export interface QuoteEngineAssumption {
  key: string
  value: string
}

export interface QuoteEngineResult {
  process: QuoteProcessKey
  calculatorVersion: string
  partNumber: string
  quantity: number
  currency: QuoteEngineCurrencyCode
  leadTimeDays: number
  unitPriceCents: number
  unitRemainderCents: number
  totalCents: number
  breakdown: QuoteEngineBreakdownLine[]
  assumptions: QuoteEngineAssumption[]
  warnings: string[]
}

interface CalculatorResultShape {
  calculatorVersion: string
  partNumber: string
  quantity: number
  currency: QuoteEngineCurrencyCode
  leadTimeDays: number
  unitPriceCents: number
  unitRemainderCents: number
  totalCents: number
  breakdown: QuoteEngineBreakdownLine[]
  assumptions: QuoteEngineAssumption[]
  warnings: string[]
}

export const quoteProcessKeys: readonly QuoteProcessKey[] = [
  "cnc_milling",
  "cnc_turning",
  "sheet_metal",
  "plastic",
  "wire_edm",
  "fabrication",
]

export function calculateQuote(input: QuoteEngineInput): QuoteEngineResult {
  switch (input.process) {
    case "cnc_milling":
    case "cnc_turning":
      if (input.input.process !== input.process) {
        throw new Error("CNC input process must match quote engine process")
      }
      return normalizeResult(input.process, calculateCncQuote(input.input))
    case "sheet_metal":
      return normalizeResult(input.process, calculateSheetMetalQuote(input.input))
    case "plastic":
      return normalizeResult(input.process, calculatePlasticsQuote(input.input))
    case "wire_edm":
      return normalizeResult(input.process, calculateWireEdmQuote(input.input))
    case "fabrication":
      return normalizeResult(input.process, calculateFabricationQuote(input.input))
  }
}

export function isQuoteProcessKey(value: string): value is QuoteProcessKey {
  return quoteProcessKeys.includes(value as QuoteProcessKey)
}

function normalizeResult(process: QuoteProcessKey, result: CalculatorResultShape): QuoteEngineResult {
  return {
    process,
    calculatorVersion: result.calculatorVersion,
    partNumber: result.partNumber,
    quantity: result.quantity,
    currency: result.currency,
    leadTimeDays: result.leadTimeDays,
    unitPriceCents: result.unitPriceCents,
    unitRemainderCents: result.unitRemainderCents,
    totalCents: result.totalCents,
    breakdown: result.breakdown,
    assumptions: result.assumptions,
    warnings: result.warnings,
  }
}
