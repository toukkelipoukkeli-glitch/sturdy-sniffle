import type { NonCncQuoteProcessKey } from "./processDemoQuotes"

export const PROCESS_INPUT_READINESS_VERSION = "process-input-readiness.v1"

export interface ProcessInputReadiness {
  readinessVersion: typeof PROCESS_INPUT_READINESS_VERSION
  process: NonCncQuoteProcessKey
  editable: false
  status: "blocked"
  requiredGroups: string[]
  nextStep: string
}

const requiredGroupsByProcess: Record<NonCncQuoteProcessKey, string[]> = {
  fabrication: ["frame geometry", "weld length", "cutting operations", "finish and inspection"],
  plastic: ["stock dimensions", "material family", "machining operations", "surface finish"],
  sheet_metal: ["blank dimensions", "material and thickness", "cutting route", "bend operations"],
  wire_edm: ["stock dimensions", "cut length", "wire settings", "inspection scope"],
}

export function buildProcessInputReadiness(process: NonCncQuoteProcessKey): ProcessInputReadiness {
  return {
    editable: false,
    nextStep: "Add process-specific editable input controls before this preview can become an RFQ quote path.",
    process,
    readinessVersion: PROCESS_INPUT_READINESS_VERSION,
    requiredGroups: requiredGroupsByProcess[process],
    status: "blocked",
  }
}
