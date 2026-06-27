import { weldedFrameFixture } from "./fabrication.fixtures"
import type { FabricationQuoteInput } from "./fabrication"
import { calculateQuote, type QuoteEngineResult } from "./registry"

export const FABRICATION_INPUT_EDITS_VERSION = "fabrication-input-edits.v1"

export interface FabricationInputEditState {
  editVersion: typeof FABRICATION_INPUT_EDITS_VERSION
  process: "fabrication"
  fabricationMinutesPerPart: number
  weldingMinutesPerPart: number
  assemblyMinutesPerPart: number
  inspectionMinutesPerPart: number
  complexityMultiplier: number
  finishRequirement: string
}

export type FabricationInputEditPatch = Partial<
  Pick<
    FabricationInputEditState,
    | "fabricationMinutesPerPart"
    | "weldingMinutesPerPart"
    | "assemblyMinutesPerPart"
    | "inspectionMinutesPerPart"
    | "complexityMultiplier"
    | "finishRequirement"
  >
>

export interface EditedFabricationQuote {
  editState: FabricationInputEditState
  input: FabricationQuoteInput
  quote: QuoteEngineResult
}

export function buildFabricationInputEditState(
  input: FabricationQuoteInput = weldedFrameFixture,
): FabricationInputEditState {
  return {
    assemblyMinutesPerPart: input.operation.assemblyMinutesPerPart ?? 0,
    complexityMultiplier: input.operation.complexityMultiplier ?? 1,
    editVersion: FABRICATION_INPUT_EDITS_VERSION,
    fabricationMinutesPerPart: input.operation.fabricationMinutesPerPart,
    finishRequirement: input.finish ?? "",
    inspectionMinutesPerPart: input.operation.inspectionMinutesPerPart ?? 0,
    process: "fabrication",
    weldingMinutesPerPart: input.operation.weldingMinutesPerPart ?? 0,
  }
}

export function applyFabricationInputEdits(
  patch: FabricationInputEditPatch,
  input: FabricationQuoteInput = weldedFrameFixture,
): FabricationQuoteInput {
  const editState = {
    ...buildFabricationInputEditState(input),
    ...patch,
  }
  assertPositiveFinite("fabricationMinutesPerPart", editState.fabricationMinutesPerPart)
  assertNonNegativeFinite("weldingMinutesPerPart", editState.weldingMinutesPerPart)
  assertNonNegativeFinite("assemblyMinutesPerPart", editState.assemblyMinutesPerPart)
  assertNonNegativeFinite("inspectionMinutesPerPart", editState.inspectionMinutesPerPart)
  assertPositiveFinite("complexityMultiplier", editState.complexityMultiplier)
  const finishRequirement = normalizeOptionalText(editState.finishRequirement)

  return {
    ...input,
    finish: finishRequirement || undefined,
    operation: {
      ...input.operation,
      assemblyMinutesPerPart: editState.assemblyMinutesPerPart,
      complexityMultiplier: editState.complexityMultiplier,
      fabricationMinutesPerPart: editState.fabricationMinutesPerPart,
      inspectionMinutesPerPart: editState.inspectionMinutesPerPart,
      weldingMinutesPerPart: editState.weldingMinutesPerPart,
    },
  }
}

export function calculateEditedFabricationQuote(
  patch: FabricationInputEditPatch,
  input: FabricationQuoteInput = weldedFrameFixture,
): EditedFabricationQuote {
  const editedInput = applyFabricationInputEdits(patch, input)
  return {
    editState: buildFabricationInputEditState(editedInput),
    input: editedInput,
    quote: calculateQuote({ input: editedInput, process: "fabrication" }),
  }
}

function assertPositiveFinite(field: keyof FabricationInputEditPatch, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive finite number`)
  }
}

function assertNonNegativeFinite(field: keyof FabricationInputEditPatch, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative finite number`)
  }
}

function normalizeOptionalText(value: string): string {
  return value.trim()
}
