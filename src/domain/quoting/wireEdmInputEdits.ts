import { calculateQuote, type QuoteEngineResult } from "./registry"
import { toolSteelKeywayFixture } from "./wireEdm.fixtures"
import type { WireEdmQuoteInput } from "./wireEdm"

export const WIRE_EDM_INPUT_EDITS_VERSION = "wire-edm-input-edits.v1"

export interface WireEdmInputEditState {
  editVersion: typeof WIRE_EDM_INPUT_EDITS_VERSION
  process: "wire_edm"
  stockLengthMm: number
  stockWidthMm: number
  stockHeightMm: number
  contourLengthMm: number
  skimPasses: number
  inspectionLevel: string
}

export type WireEdmInputEditPatch = Partial<
  Pick<
    WireEdmInputEditState,
    "stockLengthMm" | "stockWidthMm" | "stockHeightMm" | "contourLengthMm" | "skimPasses" | "inspectionLevel"
  >
>

export interface EditedWireEdmQuote {
  editState: WireEdmInputEditState
  input: WireEdmQuoteInput
  quote: QuoteEngineResult
}

export function buildWireEdmInputEditState(input: WireEdmQuoteInput = toolSteelKeywayFixture): WireEdmInputEditState {
  return {
    contourLengthMm: input.operation.contourLengthMm,
    editVersion: WIRE_EDM_INPUT_EDITS_VERSION,
    inspectionLevel: input.toleranceClass ?? "",
    process: "wire_edm",
    skimPasses: input.operation.skimPasses ?? 0,
    stockHeightMm: input.stock.heightMm,
    stockLengthMm: input.stock.lengthMm,
    stockWidthMm: input.stock.widthMm,
  }
}

export function applyWireEdmInputEdits(
  patch: WireEdmInputEditPatch,
  input: WireEdmQuoteInput = toolSteelKeywayFixture,
): WireEdmQuoteInput {
  const editState = {
    ...buildWireEdmInputEditState(input),
    ...patch,
  }
  assertPositiveFinite("stockLengthMm", editState.stockLengthMm)
  assertPositiveFinite("stockWidthMm", editState.stockWidthMm)
  assertPositiveFinite("stockHeightMm", editState.stockHeightMm)
  assertPositiveFinite("contourLengthMm", editState.contourLengthMm)
  assertNonNegativeInteger("skimPasses", editState.skimPasses)
  const inspectionLevel = normalizeOptionalText(editState.inspectionLevel)

  return {
    ...input,
    operation: {
      ...input.operation,
      contourLengthMm: editState.contourLengthMm,
      skimPasses: editState.skimPasses,
    },
    stock: {
      heightMm: editState.stockHeightMm,
      lengthMm: editState.stockLengthMm,
      widthMm: editState.stockWidthMm,
    },
    toleranceClass: inspectionLevel || undefined,
  }
}

export function calculateEditedWireEdmQuote(
  patch: WireEdmInputEditPatch,
  input: WireEdmQuoteInput = toolSteelKeywayFixture,
): EditedWireEdmQuote {
  const editedInput = applyWireEdmInputEdits(patch, input)
  return {
    editState: buildWireEdmInputEditState(editedInput),
    input: editedInput,
    quote: calculateQuote({ input: editedInput, process: "wire_edm" }),
  }
}

function assertPositiveFinite(field: keyof WireEdmInputEditPatch, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive finite number`)
  }
}

function assertNonNegativeInteger(field: keyof WireEdmInputEditPatch, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`)
  }
}

function normalizeOptionalText(value: string): string {
  return value.trim()
}
