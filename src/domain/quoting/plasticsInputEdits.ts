import { pomGuideFixture } from "./plastics.fixtures"
import { calculateQuote, type QuoteEngineResult } from "./registry"
import type { PlasticsQuoteInput } from "./plastics"

export const PLASTICS_INPUT_EDITS_VERSION = "plastics-input-edits.v1"

export interface PlasticsInputEditState {
  editVersion: typeof PLASTICS_INPUT_EDITS_VERSION
  process: "plastic"
  stockLengthMm: number
  stockWidthMm: number
  stockHeightMm: number
  materialFamily: string
  operationCount: number
  surfaceFinish: string
}

export type PlasticsInputEditPatch = Partial<
  Pick<
    PlasticsInputEditState,
    "stockLengthMm" | "stockWidthMm" | "stockHeightMm" | "materialFamily" | "operationCount" | "surfaceFinish"
  >
>

export interface EditedPlasticsQuote {
  editState: PlasticsInputEditState
  input: PlasticsQuoteInput
  quote: QuoteEngineResult
}

export function buildPlasticsInputEditState(input: PlasticsQuoteInput = pomGuideFixture): PlasticsInputEditState {
  return {
    editVersion: PLASTICS_INPUT_EDITS_VERSION,
    materialFamily: input.material.name,
    operationCount: plannedOperationCount(input),
    process: "plastic",
    stockHeightMm: input.stockDimensions.heightMm,
    stockLengthMm: input.stockDimensions.lengthMm,
    stockWidthMm: input.stockDimensions.widthMm,
    surfaceFinish: input.finish ?? "",
  }
}

export function applyPlasticsInputEdits(
  patch: PlasticsInputEditPatch,
  input: PlasticsQuoteInput = pomGuideFixture,
): PlasticsQuoteInput {
  const editState = {
    ...buildPlasticsInputEditState(input),
    ...patch,
  }
  assertPositiveFinite("stockLengthMm", editState.stockLengthMm)
  assertPositiveFinite("stockWidthMm", editState.stockWidthMm)
  assertPositiveFinite("stockHeightMm", editState.stockHeightMm)
  assertNonNegativeInteger("operationCount", editState.operationCount)
  const materialFamily = normalizeRequiredText("materialFamily", editState.materialFamily)
  const surfaceFinish = normalizeOptionalText(editState.surfaceFinish)

  return {
    ...input,
    finish: surfaceFinish || undefined,
    material: {
      ...input.material,
      name: materialFamily,
    },
    stockDimensions: {
      heightMm: editState.stockHeightMm,
      lengthMm: editState.stockLengthMm,
      widthMm: editState.stockWidthMm,
    },
  }
}

export function calculateEditedPlasticsQuote(
  patch: PlasticsInputEditPatch,
  input: PlasticsQuoteInput = pomGuideFixture,
): EditedPlasticsQuote {
  const editedInput = applyPlasticsInputEdits(patch, input)
  return {
    editState: buildPlasticsInputEditState(editedInput),
    input: editedInput,
    quote: calculateQuote({ input: editedInput, process: "plastic" }),
  }
}

function plannedOperationCount(input: PlasticsQuoteInput): number {
  const operationSteps = [
    input.operation.setupMinutes > 0,
    (input.operation.programmingMinutes ?? 0) > 0,
    (input.operation.fixtureMinutes ?? 0) > 0,
    input.operation.cycleMinutesPerPart > 0,
    (input.operation.finishingMinutesPerPart ?? 0) > 0,
  ]
  return operationSteps.filter(Boolean).length
}

function assertPositiveFinite(field: keyof PlasticsInputEditPatch, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive finite number`)
  }
}

function assertNonNegativeInteger(field: keyof PlasticsInputEditPatch, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`)
  }
}

function normalizeRequiredText(field: keyof PlasticsInputEditPatch, value: string): string {
  const normalized = value.trim()
  if (normalized.length === 0) {
    throw new Error(`${field} must be a non-empty string`)
  }
  return normalized
}

function normalizeOptionalText(value: string): string {
  return value.trim()
}
