import { laserBentBracketFixture } from "./sheetMetal.fixtures"
import { calculateQuote, type QuoteEngineResult } from "./registry"
import type { SheetMetalQuoteInput } from "./sheetMetal"

export const SHEET_METAL_INPUT_EDITS_VERSION = "sheet-metal-input-edits.v1"

export interface SheetMetalInputEditState {
  editVersion: typeof SHEET_METAL_INPUT_EDITS_VERSION
  process: "sheet_metal"
  blankLengthMm: number
  blankWidthMm: number
  materialThicknessMm: number
  cuttingLengthMm: number
  bendCount: number
}

export type SheetMetalInputEditPatch = Partial<
  Pick<
    SheetMetalInputEditState,
    "blankLengthMm" | "blankWidthMm" | "materialThicknessMm" | "cuttingLengthMm" | "bendCount"
  >
>

export interface EditedSheetMetalQuote {
  editState: SheetMetalInputEditState
  input: SheetMetalQuoteInput
  quote: QuoteEngineResult
}

export function buildSheetMetalInputEditState(input: SheetMetalQuoteInput = laserBentBracketFixture): SheetMetalInputEditState {
  return {
    bendCount: input.operation.bendCount ?? 0,
    blankLengthMm: input.blank.lengthMm,
    blankWidthMm: input.blank.widthMm,
    cuttingLengthMm: input.operation.cuttingLengthMm,
    editVersion: SHEET_METAL_INPUT_EDITS_VERSION,
    materialThicknessMm: input.blank.thicknessMm,
    process: "sheet_metal",
  }
}

export function applySheetMetalInputEdits(
  patch: SheetMetalInputEditPatch,
  input: SheetMetalQuoteInput = laserBentBracketFixture,
): SheetMetalQuoteInput {
  const editState = {
    ...buildSheetMetalInputEditState(input),
    ...patch,
  }
  assertPositiveFinite("blankLengthMm", editState.blankLengthMm)
  assertPositiveFinite("blankWidthMm", editState.blankWidthMm)
  assertPositiveFinite("materialThicknessMm", editState.materialThicknessMm)
  assertPositiveFinite("cuttingLengthMm", editState.cuttingLengthMm)
  assertNonNegativeInteger("bendCount", editState.bendCount)

  return {
    ...input,
    blank: {
      ...input.blank,
      lengthMm: editState.blankLengthMm,
      thicknessMm: editState.materialThicknessMm,
      widthMm: editState.blankWidthMm,
    },
    operation: {
      ...input.operation,
      bendCount: editState.bendCount,
      cuttingLengthMm: editState.cuttingLengthMm,
    },
  }
}

export function calculateEditedSheetMetalQuote(
  patch: SheetMetalInputEditPatch,
  input: SheetMetalQuoteInput = laserBentBracketFixture,
): EditedSheetMetalQuote {
  const editedInput = applySheetMetalInputEdits(patch, input)
  return {
    editState: buildSheetMetalInputEditState(editedInput),
    input: editedInput,
    quote: calculateQuote({ input: editedInput, process: "sheet_metal" }),
  }
}

function assertPositiveFinite(field: keyof SheetMetalInputEditPatch, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive finite number`)
  }
}

function assertNonNegativeInteger(field: keyof SheetMetalInputEditPatch, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`)
  }
}
