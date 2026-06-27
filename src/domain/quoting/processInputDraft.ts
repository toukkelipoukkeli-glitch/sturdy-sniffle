import { weldedFrameFixture } from "./fabrication.fixtures"
import { pomGuideFixture } from "./plastics.fixtures"
import type { NonCncQuoteProcessKey } from "./processDemoQuotes"
import { buildProcessInputReadiness, type ProcessInputFieldPlan, type ProcessInputValueKind } from "./processInputReadiness"
import { laserBentBracketFixture } from "./sheetMetal.fixtures"
import { toolSteelKeywayFixture } from "./wireEdm.fixtures"

export const PROCESS_INPUT_DRAFT_VERSION = "process-input-draft.v1"

export type ProcessInputDraftSource = "registry_fixture"
export type ProcessInputDraftValueStatus = "populated" | "missing"

export interface ProcessInputDraftValue {
  key: string
  label: string
  group: string
  valueKind: ProcessInputValueKind
  required: boolean
  status: ProcessInputDraftValueStatus
  value: string
  sourcePath?: string
}

export interface ProcessInputDraft {
  draftVersion: typeof PROCESS_INPUT_DRAFT_VERSION
  process: NonCncQuoteProcessKey
  editable: false
  source: ProcessInputDraftSource
  values: ProcessInputDraftValue[]
  populatedRequiredCount: number
  requiredCount: number
  status: "ready_for_read_only_review" | "missing_fixture_values"
}

interface DraftValueSource {
  value: string
  sourcePath: string
}

const missingValue = "Missing fixture value"

export function buildProcessInputDraft(process: NonCncQuoteProcessKey): ProcessInputDraft {
  const readiness = buildProcessInputReadiness(process)
  const valueSources = draftValuesByProcess[process]
  const values = readiness.fieldPlans.map((field) => buildDraftValue(field, valueSources[field.key]))
  const populatedRequiredCount = values.filter((value) => value.required && value.status === "populated").length
  const requiredCount = values.filter((value) => value.required).length

  return {
    draftVersion: PROCESS_INPUT_DRAFT_VERSION,
    editable: false,
    populatedRequiredCount,
    process,
    requiredCount,
    source: "registry_fixture",
    status: populatedRequiredCount === requiredCount ? "ready_for_read_only_review" : "missing_fixture_values",
    values,
  }
}

function buildDraftValue(field: ProcessInputFieldPlan, source?: DraftValueSource): ProcessInputDraftValue {
  return {
    group: field.group,
    key: field.key,
    label: field.label,
    required: field.required,
    sourcePath: source?.sourcePath,
    status: source ? "populated" : "missing",
    value: source?.value ?? missingValue,
    valueKind: field.valueKind,
  }
}

const draftValuesByProcess: Record<NonCncQuoteProcessKey, Record<string, DraftValueSource | undefined>> = {
  fabrication: {
    finishRequirement: optionalSourced(weldedFrameFixture.finish, "weldedFrameFixture.finish"),
  },
  plastic: {
    materialFamily: sourced(pomGuideFixture.material.name, "pomGuideFixture.material.name"),
    operationCount: sourced("5 planned machining steps", "pomGuideFixture.operation"),
    stockSizeMm: sourced(
      `${pomGuideFixture.stockDimensions.lengthMm} x ${pomGuideFixture.stockDimensions.widthMm} x ${pomGuideFixture.stockDimensions.heightMm} mm`,
      "pomGuideFixture.stockDimensions",
    ),
  },
  sheet_metal: {
    bendCount: sourced(`${laserBentBracketFixture.operation.bendCount} bends`, "laserBentBracketFixture.operation.bendCount"),
    blankSizeMm: sourced(
      `${laserBentBracketFixture.blank.lengthMm} x ${laserBentBracketFixture.blank.widthMm} mm`,
      "laserBentBracketFixture.blank",
    ),
    cutLengthMm: sourced(`${laserBentBracketFixture.operation.cuttingLengthMm} mm`, "laserBentBracketFixture.operation.cuttingLengthMm"),
    materialThicknessMm: sourced(`${laserBentBracketFixture.blank.thicknessMm} mm`, "laserBentBracketFixture.blank.thicknessMm"),
  },
  wire_edm: {
    cutLengthMm: sourced(`${toolSteelKeywayFixture.operation.contourLengthMm} mm contour`, "toolSteelKeywayFixture.operation.contourLengthMm"),
    finishPasses: sourced(`${toolSteelKeywayFixture.operation.skimPasses} skim passes`, "toolSteelKeywayFixture.operation.skimPasses"),
    inspectionLevel: optionalSourced(toolSteelKeywayFixture.toleranceClass, "toolSteelKeywayFixture.toleranceClass"),
    stockSizeMm: sourced(
      `${toolSteelKeywayFixture.stock.lengthMm} x ${toolSteelKeywayFixture.stock.widthMm} x ${toolSteelKeywayFixture.stock.heightMm} mm`,
      "toolSteelKeywayFixture.stock",
    ),
  },
}

function sourced(value: string, sourcePath: string): DraftValueSource {
  return {
    sourcePath,
    value,
  }
}

function optionalSourced(value: string | undefined, sourcePath: string): DraftValueSource | undefined {
  return value ? sourced(value, sourcePath) : undefined
}
