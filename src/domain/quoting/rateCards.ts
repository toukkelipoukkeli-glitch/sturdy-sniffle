import type { QuoteEngineCurrencyCode, QuoteProcessKey } from "./registry"

export interface SharedRateCardInput {
  currency: QuoteEngineCurrencyCode
  setupMinimumCents: number
  minimumOrderCents: number
  marginPercent: number
  rushMultiplier: number
  baseLeadTimeDays: number
  rushLeadTimeDays?: number
}

export type RateCardPresetKey = "factory_standard_eur" | "prototype_cell_eur" | "fabrication_shop_eur"

export interface RateCardPreset {
  key: RateCardPresetKey
  label: string
  description: string
  processes: readonly QuoteProcessKey[]
  rateCard: SharedRateCardInput
}

export const rateCardPresets: readonly RateCardPreset[] = [
  {
    key: "factory_standard_eur",
    label: "Factory standard EUR",
    description: "Balanced setup minimums and lead times for repeatable shop work.",
    processes: ["cnc_milling", "cnc_turning", "sheet_metal", "plastic", "wire_edm", "fabrication"],
    rateCard: {
      currency: "EUR",
      setupMinimumCents: 12000,
      minimumOrderCents: 25000,
      marginPercent: 28,
      rushMultiplier: 1.4,
      baseLeadTimeDays: 7,
      rushLeadTimeDays: 4,
    },
  },
  {
    key: "prototype_cell_eur",
    label: "Prototype cell EUR",
    description: "Higher setup recovery for low-volume prototypes and engineering change churn.",
    processes: ["cnc_milling", "cnc_turning", "plastic", "wire_edm"],
    rateCard: {
      currency: "EUR",
      setupMinimumCents: 18000,
      minimumOrderCents: 35000,
      marginPercent: 35,
      rushMultiplier: 1.5,
      baseLeadTimeDays: 10,
      rushLeadTimeDays: 5,
    },
  },
  {
    key: "fabrication_shop_eur",
    label: "Fabrication shop EUR",
    description: "Shop-floor preset for sheet metal and welded fabrication packages.",
    processes: ["sheet_metal", "fabrication"],
    rateCard: {
      currency: "EUR",
      setupMinimumCents: 15000,
      minimumOrderCents: 50000,
      marginPercent: 30,
      rushMultiplier: 1.35,
      baseLeadTimeDays: 12,
      rushLeadTimeDays: 6,
    },
  },
]

export function listRateCardPresets(process?: QuoteProcessKey): RateCardPreset[] {
  const presets = process ? rateCardPresets.filter((preset) => preset.processes.includes(process)) : rateCardPresets
  return presets.map(clonePreset)
}

export function getRateCardPreset(key: RateCardPresetKey): RateCardPreset {
  const preset = rateCardPresets.find((candidate) => candidate.key === key)
  if (!preset) {
    throw new Error(`Unknown rate card preset ${key}`)
  }
  return clonePreset(preset)
}

export function rateCardForPreset(key: RateCardPresetKey): SharedRateCardInput {
  return cloneRateCard(getRateCardPreset(key).rateCard)
}

export function applyRateCardPreset<T extends { rateCard: SharedRateCardInput }>(
  input: T,
  key: RateCardPresetKey,
): Omit<T, "rateCard"> & { rateCard: SharedRateCardInput } {
  return {
    ...input,
    rateCard: rateCardForPreset(key),
  }
}

function clonePreset(preset: RateCardPreset): RateCardPreset {
  return {
    ...preset,
    processes: [...preset.processes],
    rateCard: cloneRateCard(preset.rateCard),
  }
}

function cloneRateCard(rateCard: SharedRateCardInput): SharedRateCardInput {
  validateRateCard(rateCard)
  return { ...rateCard }
}

function validateRateCard(rateCard: SharedRateCardInput) {
  assertCents(rateCard.setupMinimumCents, "setupMinimumCents")
  assertCents(rateCard.minimumOrderCents, "minimumOrderCents")
  assertNonNegative(rateCard.marginPercent, "marginPercent")
  assertPositive(rateCard.rushMultiplier, "rushMultiplier")
  if (rateCard.rushMultiplier < 1) {
    throw new Error("rushMultiplier must be at least 1")
  }
  assertPositiveInteger(rateCard.baseLeadTimeDays, "baseLeadTimeDays")
  if (rateCard.rushLeadTimeDays !== undefined) {
    assertPositiveInteger(rateCard.rushLeadTimeDays, "rushLeadTimeDays")
  }
}

function assertCents(value: number, key: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer cent amount`)
  }
}

function assertNonNegative(value: number, key: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be non-negative`)
  }
}

function assertPositive(value: number, key: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be positive`)
  }
}

function assertPositiveInteger(value: number, key: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
}
