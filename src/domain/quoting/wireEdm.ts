export const WIRE_EDM_CALCULATOR_VERSION = "wire-edm.v1"

export type WireEdmPriority = "normal" | "rush"
export type WireEdmCurrencyCode = "EUR" | "USD" | "GBP"

export interface WireEdmStockInput {
  lengthMm: number
  widthMm: number
  heightMm: number
}

export interface WireEdmMaterialInput {
  name: string
  densityKgM3: number
  costCentsPerKg: number
  yieldFactor?: number
}

export interface WireEdmMachineInput {
  name: string
  hourlyRateCents: number
  setupRateCents: number
  cuttingRateMm2PerHour: number
  skimPassRateFactor: number
  threadingMinutesPerStart: number
  consumableCentsPerCutHour?: number
  capacityMinutesPerDay?: number
}

export interface WireEdmRateCardInput {
  currency: WireEdmCurrencyCode
  setupMinimumCents: number
  minimumOrderCents: number
  marginPercent: number
  rushMultiplier: number
  baseLeadTimeDays: number
  rushLeadTimeDays?: number
}

export interface WireEdmOutsideServiceInput {
  label: string
  amountCents: number
}

export interface WireEdmOperationInput {
  setupMinutes: number
  programmingMinutes?: number
  contourLengthMm: number
  startHoleCount: number
  skimPasses?: number
  inspectionMinutesPerPart?: number
  outsideServices?: WireEdmOutsideServiceInput[]
}

export interface WireEdmQuoteInput {
  partNumber: string
  quantity: number
  priority: WireEdmPriority
  material: WireEdmMaterialInput
  machine: WireEdmMachineInput
  rateCard: WireEdmRateCardInput
  stock: WireEdmStockInput
  operation: WireEdmOperationInput
  finish?: string
  toleranceClass?: string
}

export interface WireEdmBreakdownLine {
  key: string
  label: string
  amountCents: number
  formula: string
  source: "calculator"
}

export interface WireEdmAssumption {
  key: string
  value: string
}

export interface WireEdmQuoteResult {
  calculatorVersion: typeof WIRE_EDM_CALCULATOR_VERSION
  process: "wire_edm"
  partNumber: string
  quantity: number
  currency: WireEdmCurrencyCode
  leadTimeDays: number
  unitPriceCents: number
  unitRemainderCents: number
  totalCents: number
  breakdown: WireEdmBreakdownLine[]
  assumptions: WireEdmAssumption[]
  warnings: string[]
}

export function calculateWireEdmQuote(input: WireEdmQuoteInput): WireEdmQuoteResult {
  validateInput(input)

  const quantity = input.quantity
  const yieldFactor = input.material.yieldFactor ?? 1
  const setupMinutes = input.operation.setupMinutes + (input.operation.programmingMinutes ?? 0)
  const setupCents = Math.max(
    prorateHourlyCents(input.machine.setupRateCents, setupMinutes),
    input.rateCard.setupMinimumCents,
  )

  const stockKgPerPart = volumeMm3(input.stock) * 1e-9 * input.material.densityKgM3 * yieldFactor
  const materialCents = ceilCents(stockKgPerPart * quantity * input.material.costCentsPerKg)
  const cutAreaMm2PerPart = input.operation.contourLengthMm * input.stock.heightMm
  const roughCutHoursPerPart = cutAreaMm2PerPart / input.machine.cuttingRateMm2PerHour
  const skimPasses = input.operation.skimPasses ?? 0
  const threadingHoursPerPart = (input.operation.startHoleCount * input.machine.threadingMinutesPerStart) / 60
  const cutHoursPerPart = roughCutHoursPerPart * (1 + skimPasses * input.machine.skimPassRateFactor) + threadingHoursPerPart
  const totalCutHours = cutHoursPerPart * quantity
  const cuttingCents = ceilCents(totalCutHours * input.machine.hourlyRateCents)
  const consumablesCents = ceilCents(totalCutHours * (input.machine.consumableCentsPerCutHour ?? 0))
  const inspectionMinutes = (input.operation.inspectionMinutesPerPart ?? 0) * quantity
  const inspectionCents = prorateHourlyCents(input.machine.setupRateCents, inspectionMinutes)
  const outsideServiceLines = (input.operation.outsideServices ?? []).map((service, index) =>
    line(
      `outside_service:${normalizeKey(service.label) || "service"}_${index + 1}`,
      service.label,
      safeCents(service.amountCents),
      "operator-supplied outside service cost",
    ),
  )

  const breakdown = [
    line(
      "setup",
      "Setup and programming",
      setupCents,
      `max(${setupMinutes} min x ${input.machine.setupRateCents} cents/hour, setup minimum ${input.rateCard.setupMinimumCents})`,
    ),
    line(
      "material",
      `${input.material.name} stock`,
      materialCents,
      `${formatNumber(stockKgPerPart)} kg/part x ${quantity} x ${input.material.costCentsPerKg} cents/kg`,
    ),
    line(
      "wire_cutting",
      `${input.machine.name} wire cutting`,
      cuttingCents,
      `${formatNumber(cutHoursPerPart)} cut hours/part x ${quantity} x ${input.machine.hourlyRateCents} cents/hour`,
    ),
    line(
      "wire_consumables",
      "Wire and dielectric consumables",
      consumablesCents,
      `${formatNumber(totalCutHours)} cut hours x ${input.machine.consumableCentsPerCutHour ?? 0} cents/hour`,
    ),
    line(
      "inspection",
      "Inspection",
      inspectionCents,
      `${formatNumber(input.operation.inspectionMinutesPerPart ?? 0)} min/part x ${quantity} x ${input.machine.setupRateCents} cents/hour`,
    ),
    ...outsideServiceLines,
  ].filter((item) => item.amountCents > 0)

  const subtotalCents = sumLines(breakdown)
  const marginCents = ceilCents((subtotalCents * input.rateCard.marginPercent) / 100)
  breakdown.push(line("margin", "Margin", marginCents, `${subtotalCents} cents subtotal x ${input.rateCard.marginPercent}%`))

  const rushBaseCents = subtotalCents + marginCents
  if (input.priority === "rush") {
    breakdown.push(
      line(
        "rush_surcharge",
        "Rush surcharge",
        ceilCents(rushBaseCents * (input.rateCard.rushMultiplier - 1)),
        `${rushBaseCents} cents x (${input.rateCard.rushMultiplier} - 1)`,
      ),
    )
  }

  const beforeMinimumCents = sumLines(breakdown)
  const minimumAdjustmentCents = Math.max(0, input.rateCard.minimumOrderCents - beforeMinimumCents)
  if (minimumAdjustmentCents > 0) {
    breakdown.push(
      line(
        "minimum_order_adjustment",
        "Minimum order adjustment",
        minimumAdjustmentCents,
        `${input.rateCard.minimumOrderCents} cents minimum order - ${beforeMinimumCents} cents calculated price`,
      ),
    )
  }

  const totalCents = sumLines(breakdown)
  const unitPriceCents = Math.floor(totalCents / quantity)
  const unitRemainderCents = safeCents(totalCents - unitPriceCents * quantity)
  const loadDays = Math.ceil((setupMinutes + totalCutHours * 60 + inspectionMinutes) / (input.machine.capacityMinutesPerDay ?? 360))
  const standardLeadTimeDays = input.rateCard.baseLeadTimeDays + loadDays
  const leadTimeDays =
    input.priority === "rush"
      ? (input.rateCard.rushLeadTimeDays ?? Math.max(1, Math.ceil(standardLeadTimeDays * 0.65)))
      : standardLeadTimeDays

  return {
    calculatorVersion: WIRE_EDM_CALCULATOR_VERSION,
    process: "wire_edm",
    partNumber: input.partNumber.trim(),
    quantity,
    currency: input.rateCard.currency,
    leadTimeDays,
    unitPriceCents,
    unitRemainderCents,
    totalCents,
    breakdown,
    assumptions: buildAssumptions(input, stockKgPerPart, cutAreaMm2PerPart, cutHoursPerPart),
    warnings: buildWarnings(input, minimumAdjustmentCents),
  }
}

function validateInput(input: WireEdmQuoteInput) {
  if (!input.partNumber.trim()) {
    throw new Error("partNumber is required")
  }

  assertPositiveInteger(input.quantity, "quantity")
  assertPositive(input.material.densityKgM3, "material.densityKgM3")
  assertCents(input.material.costCentsPerKg, "material.costCentsPerKg")
  assertPositive(input.material.yieldFactor ?? 1, "material.yieldFactor")
  assertPositive(input.stock.lengthMm, "stock.lengthMm")
  assertPositive(input.stock.widthMm, "stock.widthMm")
  assertPositive(input.stock.heightMm, "stock.heightMm")
  assertPositiveCents(input.machine.hourlyRateCents, "machine.hourlyRateCents")
  assertPositiveCents(input.machine.setupRateCents, "machine.setupRateCents")
  assertPositive(input.machine.cuttingRateMm2PerHour, "machine.cuttingRateMm2PerHour")
  assertNonNegative(input.machine.skimPassRateFactor, "machine.skimPassRateFactor")
  assertNonNegative(input.machine.threadingMinutesPerStart, "machine.threadingMinutesPerStart")
  assertCents(input.machine.consumableCentsPerCutHour ?? 0, "machine.consumableCentsPerCutHour")
  assertPositive(input.machine.capacityMinutesPerDay ?? 360, "machine.capacityMinutesPerDay")
  assertCents(input.rateCard.setupMinimumCents, "rateCard.setupMinimumCents")
  assertCents(input.rateCard.minimumOrderCents, "rateCard.minimumOrderCents")
  assertNonNegative(input.rateCard.marginPercent, "rateCard.marginPercent")
  assertPositive(input.rateCard.rushMultiplier, "rateCard.rushMultiplier")
  if (input.rateCard.rushMultiplier < 1) {
    throw new Error("rateCard.rushMultiplier must be at least 1")
  }
  assertPositiveInteger(input.rateCard.baseLeadTimeDays, "rateCard.baseLeadTimeDays")
  if (input.rateCard.rushLeadTimeDays !== undefined) {
    assertPositiveInteger(input.rateCard.rushLeadTimeDays, "rateCard.rushLeadTimeDays")
  }
  assertNonNegative(input.operation.setupMinutes, "operation.setupMinutes")
  assertNonNegative(input.operation.programmingMinutes ?? 0, "operation.programmingMinutes")
  assertPositive(input.operation.contourLengthMm, "operation.contourLengthMm")
  assertNonNegativeInteger(input.operation.startHoleCount, "operation.startHoleCount")
  assertNonNegativeInteger(input.operation.skimPasses ?? 0, "operation.skimPasses")
  assertNonNegative(input.operation.inspectionMinutesPerPart ?? 0, "operation.inspectionMinutesPerPart")

  for (const service of input.operation.outsideServices ?? []) {
    if (!service.label.trim()) {
      throw new Error("outsideServices.label is required")
    }
    assertCents(service.amountCents, "outsideServices.amountCents")
  }
}

function buildAssumptions(
  input: WireEdmQuoteInput,
  stockKgPerPart: number,
  cutAreaMm2PerPart: number,
  cutHoursPerPart: number,
): WireEdmAssumption[] {
  const assumptions: WireEdmAssumption[] = [
    { key: "stock_size_mm", value: `${input.stock.lengthMm} x ${input.stock.widthMm} x ${input.stock.heightMm}` },
    { key: "stock_weight_kg_per_part", value: formatNumber(stockKgPerPart) },
    { key: "cut_area_mm2_per_part", value: formatNumber(cutAreaMm2PerPart) },
    { key: "cut_hours_per_part", value: formatNumber(cutHoursPerPart) },
    { key: "skim_passes", value: String(input.operation.skimPasses ?? 0) },
    { key: "margin_percent", value: formatNumber(input.rateCard.marginPercent) },
  ]

  if (input.priority === "rush") {
    assumptions.push({ key: "rush_multiplier", value: formatNumber(input.rateCard.rushMultiplier) })
  }
  if (input.finish) {
    assumptions.push({ key: "finish", value: input.finish })
  }
  if (input.toleranceClass) {
    assumptions.push({ key: "tolerance_class", value: input.toleranceClass })
  }

  return assumptions
}

function buildWarnings(input: WireEdmQuoteInput, minimumAdjustmentCents: number): string[] {
  const warnings: string[] = []
  if (minimumAdjustmentCents > 0) {
    warnings.push("Minimum order adjustment applied.")
  }
  if ((input.operation.skimPasses ?? 0) >= 3) {
    warnings.push("High skim-pass count; review tolerance and surface-finish requirements.")
  }
  if (input.operation.startHoleCount > 8) {
    warnings.push("High start-hole count; review drill/fixture plan.")
  }
  return warnings
}

function volumeMm3(stock: WireEdmStockInput) {
  return stock.lengthMm * stock.widthMm * stock.heightMm
}

function line(key: string, label: string, amountCents: number, formula: string): WireEdmBreakdownLine {
  return {
    key,
    label,
    amountCents: safeCents(amountCents),
    formula,
    source: "calculator",
  }
}

function sumLines(lines: WireEdmBreakdownLine[]) {
  return safeCents(lines.reduce((total, item) => total + item.amountCents, 0))
}

function prorateHourlyCents(hourlyRateCents: number, minutes: number) {
  return ceilCents((hourlyRateCents * minutes) / 60)
}

function ceilCents(value: number) {
  return safeCents(Math.ceil(value))
}

function safeCents(value: number) {
  if (!Number.isInteger(value)) {
    throw new Error(`Expected integer cents, received ${value}`)
  }
  return value
}

function assertPositive(value: number, key: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be greater than zero`)
  }
}

function assertNonNegative(value: number, key: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be non-negative`)
  }
}

function assertPositiveInteger(value: number, key: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
}

function assertNonNegativeInteger(value: number, key: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer`)
  }
}

function assertPositiveCents(value: number, key: string) {
  assertCents(value, key)
  if (value <= 0) {
    throw new Error(`${key} must be greater than zero`)
  }
}

function assertCents(value: number, key: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer cent amount`)
  }
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : Number(value.toFixed(4)).toString()
}
