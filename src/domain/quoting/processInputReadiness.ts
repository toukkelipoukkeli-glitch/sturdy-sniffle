import type { NonCncQuoteProcessKey } from "./processDemoQuotes"

export const PROCESS_INPUT_READINESS_VERSION = "process-input-readiness.v2"

export type ProcessInputValueKind = "dimension" | "material" | "operation" | "quantity" | "rate" | "surface" | "text"

export interface ProcessInputFieldPlan {
  key: string
  label: string
  group: string
  valueKind: ProcessInputValueKind
  required: boolean
}

export interface ProcessInputReadiness {
  readinessVersion: typeof PROCESS_INPUT_READINESS_VERSION
  process: NonCncQuoteProcessKey
  editable: false
  status: "blocked"
  fieldPlans: ProcessInputFieldPlan[]
  requiredGroups: string[]
  nextStep: string
}

const requiredGroupsByProcess: Record<NonCncQuoteProcessKey, readonly string[]> = {
  fabrication: ["frame geometry", "weld length", "cutting operations", "finish and inspection"],
  plastic: ["stock dimensions", "material family", "machining operations", "surface finish"],
  sheet_metal: ["blank dimensions", "material and thickness", "cutting route", "bend operations"],
  wire_edm: ["stock dimensions", "cut length", "wire settings", "inspection scope"],
}

const fieldPlansByProcess: Record<NonCncQuoteProcessKey, readonly ProcessInputFieldPlan[]> = {
  fabrication: [
    requiredField("frameLengthMm", "Frame length", "frame geometry", "dimension"),
    requiredField("frameWidthMm", "Frame width", "frame geometry", "dimension"),
    requiredField("weldLengthMm", "Weld length", "weld length", "dimension"),
    requiredField("cutCount", "Cut operations", "cutting operations", "quantity"),
    requiredField("finishRequirement", "Finish requirement", "finish and inspection", "surface"),
  ],
  plastic: [
    requiredField("stockSizeMm", "Stock size", "stock dimensions", "dimension"),
    requiredField("materialFamily", "Material family", "material family", "material"),
    requiredField("operationCount", "Machining operations", "machining operations", "quantity"),
    requiredField("surfaceFinishRa", "Surface finish Ra", "surface finish", "surface"),
  ],
  sheet_metal: [
    requiredField("blankSizeMm", "Blank size", "blank dimensions", "dimension"),
    requiredField("materialThicknessMm", "Material thickness", "material and thickness", "dimension"),
    requiredField("cutLengthMm", "Cut length", "cutting route", "dimension"),
    requiredField("bendCount", "Bend count", "bend operations", "quantity"),
  ],
  wire_edm: [
    requiredField("stockSizeMm", "Stock size", "stock dimensions", "dimension"),
    requiredField("cutLengthMm", "Cut length", "cut length", "dimension"),
    requiredField("wireDiameterMm", "Wire diameter", "wire settings", "dimension"),
    requiredField("finishPasses", "Finish passes", "wire settings", "quantity"),
    requiredField("inspectionLevel", "Inspection level", "inspection scope", "text"),
  ],
}

export function buildProcessInputReadiness(process: NonCncQuoteProcessKey): ProcessInputReadiness {
  return {
    editable: false,
    fieldPlans: fieldPlansByProcess[process].map((field) => ({ ...field })),
    nextStep: "Add process-specific editable input controls before this preview can become an RFQ quote path.",
    process,
    readinessVersion: PROCESS_INPUT_READINESS_VERSION,
    requiredGroups: [...requiredGroupsByProcess[process]],
    status: "blocked",
  }
}

function requiredField(
  key: string,
  label: string,
  group: string,
  valueKind: ProcessInputValueKind,
): ProcessInputFieldPlan {
  return {
    group,
    key,
    label,
    required: true,
    valueKind,
  }
}
