import type { FabricationQuoteInput } from "./fabrication"
import {
  FABRICATION_INPUT_EDITS_VERSION,
  applyFabricationInputEdits,
  buildFabricationInputEditState,
  calculateEditedFabricationQuote,
  type EditedFabricationQuote,
  type FabricationInputEditPatch,
  type FabricationInputEditState,
} from "./fabricationInputEdits"
import type { PlasticsQuoteInput } from "./plastics"
import {
  PLASTICS_INPUT_EDITS_VERSION,
  applyPlasticsInputEdits,
  buildPlasticsInputEditState,
  calculateEditedPlasticsQuote,
  type EditedPlasticsQuote,
  type PlasticsInputEditPatch,
  type PlasticsInputEditState,
} from "./plasticsInputEdits"
import type { NonCncQuoteProcessKey } from "./processDemoQuotes"
import type { SheetMetalQuoteInput } from "./sheetMetal"
import {
  SHEET_METAL_INPUT_EDITS_VERSION,
  applySheetMetalInputEdits,
  buildSheetMetalInputEditState,
  calculateEditedSheetMetalQuote,
  type EditedSheetMetalQuote,
  type SheetMetalInputEditPatch,
  type SheetMetalInputEditState,
} from "./sheetMetalInputEdits"
import type { WireEdmQuoteInput } from "./wireEdm"
import {
  WIRE_EDM_INPUT_EDITS_VERSION,
  applyWireEdmInputEdits,
  buildWireEdmInputEditState,
  calculateEditedWireEdmQuote,
  type EditedWireEdmQuote,
  type WireEdmInputEditPatch,
  type WireEdmInputEditState,
} from "./wireEdmInputEdits"

export const NON_CNC_INPUT_EDIT_REGISTRY_VERSION = "non-cnc-input-edit-registry.v1"

export type NonCncInputEditState =
  | FabricationInputEditState
  | PlasticsInputEditState
  | SheetMetalInputEditState
  | WireEdmInputEditState

export type NonCncEditedQuote =
  | EditedFabricationQuote
  | EditedPlasticsQuote
  | EditedSheetMetalQuote
  | EditedWireEdmQuote

export type NonCncEditedInput = FabricationQuoteInput | PlasticsQuoteInput | SheetMetalQuoteInput | WireEdmQuoteInput

export type NonCncInputEditRequest =
  | { process: "fabrication"; patch: FabricationInputEditPatch; input?: FabricationQuoteInput }
  | { process: "plastic"; patch: PlasticsInputEditPatch; input?: PlasticsQuoteInput }
  | { process: "sheet_metal"; patch: SheetMetalInputEditPatch; input?: SheetMetalQuoteInput }
  | { process: "wire_edm"; patch: WireEdmInputEditPatch; input?: WireEdmQuoteInput }

export type NonCncInputEditStateRequest =
  | { process: "fabrication"; input?: FabricationQuoteInput }
  | { process: "plastic"; input?: PlasticsQuoteInput }
  | { process: "sheet_metal"; input?: SheetMetalQuoteInput }
  | { process: "wire_edm"; input?: WireEdmQuoteInput }

export interface NonCncInputEditAdapterSummary {
  process: NonCncQuoteProcessKey
  label: string
  editVersion: NonCncInputEditState["editVersion"]
  editableFieldKeys: string[]
  readOnlyFieldKeys: string[]
  status: "domain_ready"
}

export function listNonCncInputEditAdapters(): NonCncInputEditAdapterSummary[] {
  return [
    {
      editableFieldKeys: ["blankLengthMm", "blankWidthMm", "materialThicknessMm", "cuttingLengthMm", "bendCount"],
      editVersion: SHEET_METAL_INPUT_EDITS_VERSION,
      label: "Sheet metal",
      process: "sheet_metal",
      readOnlyFieldKeys: [],
      status: "domain_ready",
    },
    {
      editableFieldKeys: ["stockLengthMm", "stockWidthMm", "stockHeightMm", "materialFamily", "surfaceFinish"],
      editVersion: PLASTICS_INPUT_EDITS_VERSION,
      label: "Plastic machining",
      process: "plastic",
      readOnlyFieldKeys: ["operationCount"],
      status: "domain_ready",
    },
    {
      editableFieldKeys: ["stockLengthMm", "stockWidthMm", "stockHeightMm", "contourLengthMm", "skimPasses", "inspectionLevel"],
      editVersion: WIRE_EDM_INPUT_EDITS_VERSION,
      label: "Wire EDM",
      process: "wire_edm",
      readOnlyFieldKeys: [],
      status: "domain_ready",
    },
    {
      editableFieldKeys: [
        "fabricationMinutesPerPart",
        "weldingMinutesPerPart",
        "assemblyMinutesPerPart",
        "inspectionMinutesPerPart",
        "complexityMultiplier",
        "finishRequirement",
      ],
      editVersion: FABRICATION_INPUT_EDITS_VERSION,
      label: "Fabrication",
      process: "fabrication",
      readOnlyFieldKeys: [],
      status: "domain_ready",
    },
  ]
}

export function buildNonCncInputEditState(request: NonCncInputEditStateRequest): NonCncInputEditState {
  switch (request.process) {
    case "fabrication":
      return buildFabricationInputEditState(request.input)
    case "plastic":
      return buildPlasticsInputEditState(request.input)
    case "sheet_metal":
      return buildSheetMetalInputEditState(request.input)
    case "wire_edm":
      return buildWireEdmInputEditState(request.input)
  }
}

export function applyNonCncInputEdits(request: NonCncInputEditRequest): NonCncEditedInput {
  switch (request.process) {
    case "fabrication":
      return applyFabricationInputEdits(request.patch, request.input)
    case "plastic":
      return applyPlasticsInputEdits(request.patch, request.input)
    case "sheet_metal":
      return applySheetMetalInputEdits(request.patch, request.input)
    case "wire_edm":
      return applyWireEdmInputEdits(request.patch, request.input)
  }
}

export function calculateEditedNonCncQuote(request: NonCncInputEditRequest): NonCncEditedQuote {
  switch (request.process) {
    case "fabrication":
      return calculateEditedFabricationQuote(request.patch, request.input)
    case "plastic":
      return calculateEditedPlasticsQuote(request.patch, request.input)
    case "sheet_metal":
      return calculateEditedSheetMetalQuote(request.patch, request.input)
    case "wire_edm":
      return calculateEditedWireEdmQuote(request.patch, request.input)
  }
}
