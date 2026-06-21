import type { CncQuoteInput } from "../quoting/cnc"

/**
 * Deterministic helpers for operator-entered (manual) RFQs.
 *
 * The operator fills a small, friendly form; this module turns those few fields
 * into a complete, valid {@link CncQuoteInput} using realistic shop defaults
 * (material properties, machine rates, a standard rate card, stock geometry).
 * Everything here is pure and deterministic — no AI, no network, no clock — so
 * the same form input always produces the same quote input and it is unit-testable.
 */

export type ManualCncProcess = "cnc_milling" | "cnc_turning"
export type ManualPriority = "normal" | "rush"
export type ManualMaterialKey =
  | "aluminum_6082"
  | "aluminum_7075"
  | "stainless_316l"
  | "steel_s355"
  | "brass_cuzn"
  | "pom_acetal"

export interface ManualMaterialPreset {
  key: ManualMaterialKey
  name: string
  densityKgM3: number
  costCentsPerKg: number
  yieldFactor: number
}

export const MANUAL_MATERIAL_PRESETS: readonly ManualMaterialPreset[] = [
  { key: "aluminum_6082", name: "Aluminum 6082", densityKgM3: 2700, costCentsPerKg: 520, yieldFactor: 1.12 },
  { key: "aluminum_7075", name: "Aluminum 7075", densityKgM3: 2810, costCentsPerKg: 780, yieldFactor: 1.18 },
  { key: "stainless_316l", name: "Stainless steel 316L", densityKgM3: 8000, costCentsPerKg: 640, yieldFactor: 1.08 },
  { key: "steel_s355", name: "Structural steel S355", densityKgM3: 7850, costCentsPerKg: 180, yieldFactor: 1.1 },
  { key: "brass_cuzn", name: "Brass CuZn39Pb3", densityKgM3: 8500, costCentsPerKg: 940, yieldFactor: 1.06 },
  { key: "pom_acetal", name: "POM (acetal)", densityKgM3: 1410, costCentsPerKg: 410, yieldFactor: 1.2 },
]

export function manualMaterialPreset(key: ManualMaterialKey): ManualMaterialPreset {
  const preset = MANUAL_MATERIAL_PRESETS.find((candidate) => candidate.key === key)
  if (!preset) {
    throw new Error(`unknown manual material preset: ${key}`)
  }
  return preset
}

/** A balanced factory-standard EUR rate card used as the default for manual RFQs. */
const MANUAL_DEFAULT_RATE_CARD = {
  currency: "EUR",
  setupMinimumCents: 12000,
  minimumOrderCents: 25000,
  marginPercent: 28,
  rushMultiplier: 1.4,
  baseLeadTimeDays: 7,
  rushLeadTimeDays: 4,
} as const satisfies CncQuoteInput["rateCard"]

function defaultMachineForProcess(process: ManualCncProcess): CncQuoteInput["machine"] {
  if (process === "cnc_turning") {
    return { name: "CNC lathe (default)", hourlyRateCents: 9200, setupRateCents: 7600, capacityMinutesPerDay: 390 }
  }
  return { name: "3-axis mill (default)", hourlyRateCents: 8500, setupRateCents: 7000, capacityMinutesPerDay: 420 }
}

function defaultDimensionsForProcess(process: ManualCncProcess): {
  stock: CncQuoteInput["stockDimensions"]
  finished: CncQuoteInput["finishedDimensions"]
} {
  if (process === "cnc_turning") {
    return {
      stock: { diameterMm: 40, lengthMm: 90 },
      finished: { diameterMm: 32, lengthMm: 80 },
    }
  }
  return {
    stock: { lengthMm: 120, widthMm: 80, heightMm: 25 },
    finished: { lengthMm: 110, widthMm: 70, heightMm: 18 },
  }
}

export interface ManualRfqQuoteInput {
  partNumber: string
  process: ManualCncProcess
  materialKey: ManualMaterialKey
  quantity: number
  priority: ManualPriority
  setupMinutes: number
  cycleMinutesPerPart: number
  toleranceClass?: string
  finish?: string
}

/** Build a complete, valid CNC quote input from the operator's manual RFQ form fields. */
export function buildManualCncQuoteInput(input: ManualRfqQuoteInput): CncQuoteInput {
  const material = manualMaterialPreset(input.materialKey)
  const dimensions = defaultDimensionsForProcess(input.process)
  const quantity = clampFiniteNumber(input.quantity, 1, Math.round)

  return {
    partNumber: input.partNumber.trim() || "MANUAL-PART",
    process: input.process,
    quantity,
    priority: input.priority,
    material: {
      name: material.name,
      densityKgM3: material.densityKgM3,
      costCentsPerKg: material.costCentsPerKg,
      yieldFactor: material.yieldFactor,
    },
    machine: defaultMachineForProcess(input.process),
    rateCard: { ...MANUAL_DEFAULT_RATE_CARD },
    stockDimensions: dimensions.stock,
    finishedDimensions: dimensions.finished,
    operation: {
      setupMinutes: clampFiniteNumber(input.setupMinutes, 0),
      programmingMinutes: 15,
      fixtureMinutes: 10,
      cycleMinutesPerPart: clampFiniteNumber(input.cycleMinutesPerPart, 0.1),
      inspectionMinutesPerPart: 1,
      consumableCentsPerPart: 150,
    },
    toleranceClass: input.toleranceClass?.trim() || undefined,
    finish: input.finish?.trim() || undefined,
  }
}

function clampFiniteNumber(value: number, minimum: number, transform: (finiteValue: number) => number = (finiteValue) => finiteValue) {
  if (!Number.isFinite(value)) {
    return minimum
  }
  return Math.max(minimum, transform(value))
}
