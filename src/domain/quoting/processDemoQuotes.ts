import { weldedFrameFixture } from "./fabrication.fixtures"
import { pomGuideFixture } from "./plastics.fixtures"
import { calculateQuote, type QuoteEngineInput, type QuoteEngineResult, type QuoteProcessKey } from "./registry"
import { laserBentBracketFixture } from "./sheetMetal.fixtures"
import { toolSteelKeywayFixture } from "./wireEdm.fixtures"

export const PROCESS_DEMO_QUOTES_VERSION = "process-demo-quotes.v1"

export type NonCncQuoteProcessKey = Exclude<QuoteProcessKey, "cnc_milling" | "cnc_turning">

export interface ProcessDemoQuote {
  process: NonCncQuoteProcessKey
  label: string
  quote: QuoteEngineResult
}

const demoInputs: Record<NonCncQuoteProcessKey, QuoteEngineInput> = {
  fabrication: { input: weldedFrameFixture, process: "fabrication" },
  plastic: { input: pomGuideFixture, process: "plastic" },
  sheet_metal: { input: laserBentBracketFixture, process: "sheet_metal" },
  wire_edm: { input: toolSteelKeywayFixture, process: "wire_edm" },
}

const demoOrder: readonly NonCncQuoteProcessKey[] = ["sheet_metal", "plastic", "wire_edm", "fabrication"]

export function buildProcessDemoQuotes(): ProcessDemoQuote[] {
  return demoOrder.map((process) => ({
    label: processDemoLabel(process),
    process,
    quote: calculateQuote(demoInputs[process]),
  }))
}

function processDemoLabel(process: NonCncQuoteProcessKey): string {
  switch (process) {
    case "fabrication":
      return "Fabrication"
    case "plastic":
      return "Plastic machining"
    case "sheet_metal":
      return "Sheet metal"
    case "wire_edm":
      return "Wire EDM"
  }
}
