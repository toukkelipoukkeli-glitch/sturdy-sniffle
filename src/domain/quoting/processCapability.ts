import { aluminumBracketFixture, rushTurnedSpacerFixture } from "./cnc.fixtures"
import { weldedFrameFixture } from "./fabrication.fixtures"
import { pomGuideFixture } from "./plastics.fixtures"
import {
  calculateQuote,
  quoteProcessKeys,
  type QuoteEngineInput,
  type QuoteEngineResult,
  type QuoteProcessKey,
} from "./registry"
import { listRateCardPresets, type RateCardPresetKey } from "./rateCards"
import { laserBentBracketFixture } from "./sheetMetal.fixtures"
import { toolSteelKeywayFixture } from "./wireEdm.fixtures"

export const PROCESS_CAPABILITY_MATRIX_VERSION = "process-capability-matrix.v1"

export type ProcessCapabilityStatus = "ready" | "needs_review"

export interface ProcessCapability {
  process: QuoteProcessKey
  label: string
  status: ProcessCapabilityStatus
  calculatorVersion: string
  samplePartNumber: string
  sampleLeadTimeDays: number
  sampleTotalCents: number
  sampleCurrency: QuoteEngineResult["currency"]
  rateCardPresetKeys: RateCardPresetKey[]
  warnings: string[]
}

export interface ProcessCapabilityMatrix {
  matrixVersion: typeof PROCESS_CAPABILITY_MATRIX_VERSION
  supportedProcessCount: number
  readyProcessCount: number
  totalRateCardPresetLinks: number
  capabilities: ProcessCapability[]
}

const representativeInputs: Record<QuoteProcessKey, QuoteEngineInput> = {
  cnc_milling: { input: aluminumBracketFixture, process: "cnc_milling" },
  cnc_turning: { input: rushTurnedSpacerFixture, process: "cnc_turning" },
  fabrication: { input: weldedFrameFixture, process: "fabrication" },
  plastic: { input: pomGuideFixture, process: "plastic" },
  sheet_metal: { input: laserBentBracketFixture, process: "sheet_metal" },
  wire_edm: { input: toolSteelKeywayFixture, process: "wire_edm" },
}

export function buildProcessCapabilityMatrix(): ProcessCapabilityMatrix {
  const capabilities = quoteProcessKeys.map(buildProcessCapability)

  return {
    matrixVersion: PROCESS_CAPABILITY_MATRIX_VERSION,
    supportedProcessCount: capabilities.length,
    readyProcessCount: capabilities.filter((capability) => capability.status === "ready").length,
    totalRateCardPresetLinks: capabilities.reduce((total, capability) => total + capability.rateCardPresetKeys.length, 0),
    capabilities,
  }
}

function buildProcessCapability(process: QuoteProcessKey): ProcessCapability {
  const quote = calculateQuote(representativeInputs[process])
  const rateCardPresetKeys = listRateCardPresets(process).map((preset) => preset.key)

  return {
    process,
    label: processLabel(process),
    status: quote.warnings.length === 0 ? "ready" : "needs_review",
    calculatorVersion: quote.calculatorVersion,
    samplePartNumber: quote.partNumber,
    sampleLeadTimeDays: quote.leadTimeDays,
    sampleTotalCents: quote.totalCents,
    sampleCurrency: quote.currency,
    rateCardPresetKeys,
    warnings: [...quote.warnings],
  }
}

function processLabel(process: QuoteProcessKey): string {
  switch (process) {
    case "cnc_milling":
      return "CNC milling"
    case "cnc_turning":
      return "CNC turning"
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
