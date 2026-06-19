export const PLASTICS_CALCULATOR_VERSION = "plastics.v1"

export type PlasticsProcess = "plastic_machining" | "thermoforming"
export type PlasticsPriority = "normal" | "rush"
export type PlasticsCurrencyCode = "EUR" | "USD" | "GBP"

export interface PlasticsDimensions {
  lengthMm: number
  widthMm: number
  heightMm: number
}

export interface PlasticsMaterialInput {
  name: string
  densityKgM3: number
  costCentsPerKg: number
  yieldFactor?: number
}

export interface PlasticsMachineInput {
  name: string
  hourlyRateCents: number
  setupRateCents: number
  capacityMinutesPerDay?: number
}

export interface PlasticsRateCardInput {
  currency: PlasticsCurrencyCode
  setupMinimumCents: number
  minimumOrderCents: number
  marginPercent: number
  rushMultiplier: number
  baseLeadTimeDays: number
  rushLeadTimeDays?: number
}

export interface PlasticsOutsideServiceInput {
  label: string
  amountCents: number
}

export interface PlasticsOperationInput {
  setupMinutes: number
  programmingMinutes?: number
  fixtureMinutes?: number
  cycleMinutesPerPart: number
  finishingMinutesPerPart?: number
  consumableCentsPerPart?: number
  outsideServices?: PlasticsOutsideServiceInput[]
}

export interface PlasticsQuoteInput {
  partNumber: string
  process: PlasticsProcess
  quantity: number
  priority: PlasticsPriority
  material: PlasticsMaterialInput
  machine: PlasticsMachineInput
  rateCard: PlasticsRateCardInput
  stockDimensions: PlasticsDimensions
  finishedDimensions?: PlasticsDimensions
  operation: PlasticsOperationInput
  finish?: string
  toleranceClass?: string
}

export interface PlasticsBreakdownLine {
  key: string
  label: string
  amountCents: number
  formula: string
  source: "calculator"
}

export interface PlasticsAssumption {
  key: string
  value: string
}

export interface PlasticsQuoteResult {
  calculatorVersion: typeof PLASTICS_CALCULATOR_VERSION
  process: PlasticsProcess
  partNumber: string
  quantity: number
  currency: PlasticsCurrencyCode
  leadTimeDays: number
  unitPriceCents: number
  unitRemainderCents: number
  totalCents: number
  breakdown: PlasticsBreakdownLine[]
  assumptions: PlasticsAssumption[]
  warnings: string[]
}

export function calculatePlasticsQuote(input: PlasticsQuoteInput): PlasticsQuoteResult {
  validateInput(input)

  const quantity = input.quantity
  const yieldFactor = input.material.yieldFactor ?? 1
  const stockVolumeMm3 = volumeMm3(input.stockDimensions)
  const finishedVolumeMm3 = input.finishedDimensions ? volumeMm3(input.finishedDimensions) : undefined
  if (input.finishedDimensions) {
    validateFinishedEnvelope(input.stockDimensions, input.finishedDimensions)
  }
  const removalRatio = finishedVolumeMm3 === undefined ? undefined : (stockVolumeMm3 - finishedVolumeMm3) / stockVolumeMm3

  const setupMinutes =
    input.operation.setupMinutes + (input.operation.programmingMinutes ?? 0) + (input.operation.fixtureMinutes ?? 0)
  const setupCents = Math.max(
    prorateHourlyCents(input.machine.setupRateCents, setupMinutes),
    input.rateCard.setupMinimumCents,
  )

  const materialKgPerPart = stockVolumeMm3 * 1e-9 * input.material.densityKgM3 * yieldFactor
  const materialCents = ceilCents(materialKgPerPart * quantity * input.material.costCentsPerKg)

  const cycleMinutes = input.operation.cycleMinutesPerPart * quantity
  const processingCents = prorateHourlyCents(input.machine.hourlyRateCents, cycleMinutes)
  const finishingMinutes = (input.operation.finishingMinutesPerPart ?? 0) * quantity
  const finishingCents = prorateHourlyCents(input.machine.setupRateCents, finishingMinutes)
  const consumablesCents = safeCents((input.operation.consumableCentsPerPart ?? 0) * quantity)
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
      "Setup, programming, and fixtures",
      setupCents,
      `max(${setupMinutes} min x ${input.machine.setupRateCents} cents/hour, setup minimum ${input.rateCard.setupMinimumCents})`,
    ),
    line(
      "material",
      `${input.material.name} stock`,
      materialCents,
      `${formatNumber(materialKgPerPart)} kg/part x ${quantity} x ${input.material.costCentsPerKg} cents/kg`,
    ),
    line(
      "processing",
      `${input.machine.name} processing time`,
      processingCents,
      `${formatNumber(input.operation.cycleMinutesPerPart)} min/part x ${quantity} x ${input.machine.hourlyRateCents} cents/hour`,
    ),
    line(
      "finishing",
      "Finishing",
      finishingCents,
      `${formatNumber(input.operation.finishingMinutesPerPart ?? 0)} min/part x ${quantity} x ${input.machine.setupRateCents} cents/hour`,
    ),
    line(
      "consumables",
      "Tools and consumables",
      consumablesCents,
      `${input.operation.consumableCentsPerPart ?? 0} cents/part x ${quantity}`,
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
  const loadDays = Math.ceil((setupMinutes + cycleMinutes + finishingMinutes) / (input.machine.capacityMinutesPerDay ?? 420))
  const standardLeadTimeDays = input.rateCard.baseLeadTimeDays + loadDays
  const leadTimeDays =
    input.priority === "rush"
      ? (input.rateCard.rushLeadTimeDays ?? Math.max(1, Math.ceil(standardLeadTimeDays * 0.65)))
      : standardLeadTimeDays

  return {
    calculatorVersion: PLASTICS_CALCULATOR_VERSION,
    process: input.process,
    partNumber: input.partNumber.trim(),
    quantity,
    currency: input.rateCard.currency,
    leadTimeDays,
    unitPriceCents,
    unitRemainderCents,
    totalCents,
    breakdown,
    assumptions: buildAssumptions(input, materialKgPerPart, removalRatio),
    warnings: buildWarnings(input, removalRatio, minimumAdjustmentCents),
  }
}

function validateInput(input: PlasticsQuoteInput) {
  if (!input.partNumber.trim()) {
    throw new Error("partNumber is required")
  }

  assertPositiveInteger(input.quantity, "quantity")
  assertPositive(input.material.densityKgM3, "material.densityKgM3")
  assertCents(input.material.costCentsPerKg, "material.costCentsPerKg")
  assertPositive(input.material.yieldFactor ?? 1, "material.yieldFactor")
  assertDimensions(input.stockDimensions, "stockDimensions")
  if (input.finishedDimensions) {
    assertDimensions(input.finishedDimensions, "finishedDimensions")
  }
  assertPositiveCents(input.machine.hourlyRateCents, "machine.hourlyRateCents")
  assertPositiveCents(input.machine.setupRateCents, "machine.setupRateCents")
  assertPositive(input.machine.capacityMinutesPerDay ?? 420, "machine.capacityMinutesPerDay")
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
  assertNonNegative(input.operation.fixtureMinutes ?? 0, "operation.fixtureMinutes")
  assertPositive(input.operation.cycleMinutesPerPart, "operation.cycleMinutesPerPart")
  assertNonNegative(input.operation.finishingMinutesPerPart ?? 0, "operation.finishingMinutesPerPart")
  assertCents(input.operation.consumableCentsPerPart ?? 0, "operation.consumableCentsPerPart")

  for (const service of input.operation.outsideServices ?? []) {
    if (!service.label.trim()) {
      throw new Error("outsideServices.label is required")
    }
    assertCents(service.amountCents, "outsideServices.amountCents")
  }
}

function buildAssumptions(
  input: PlasticsQuoteInput,
  materialKgPerPart: number,
  removalRatio: number | undefined,
): PlasticsAssumption[] {
  const assumptions: PlasticsAssumption[] = [
    { key: "stock_size_mm", value: `${input.stockDimensions.lengthMm} x ${input.stockDimensions.widthMm} x ${input.stockDimensions.heightMm}` },
    { key: "material_yield_factor", value: formatNumber(input.material.yieldFactor ?? 1) },
    { key: "stock_weight_kg_per_part", value: formatNumber(materialKgPerPart) },
    { key: "cycle_minutes_per_part", value: formatNumber(input.operation.cycleMinutesPerPart) },
    { key: "margin_percent", value: formatNumber(input.rateCard.marginPercent) },
  ]

  if (removalRatio !== undefined) {
    assumptions.push({ key: "material_removal_ratio", value: formatNumber(removalRatio) })
  }
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

function buildWarnings(
  input: PlasticsQuoteInput,
  removalRatio: number | undefined,
  minimumAdjustmentCents: number,
): string[] {
  const warnings: string[] = []
  if (minimumAdjustmentCents > 0) {
    warnings.push("Minimum order adjustment applied.")
  }
  if (removalRatio !== undefined && removalRatio > 0.55) {
    warnings.push("High plastic material removal ratio; review stock size and chip strategy.")
  }
  if ((input.operation.finishingMinutesPerPart ?? 0) >= input.operation.cycleMinutesPerPart) {
    warnings.push("Finishing time is at least cycle time; review edge quality assumptions.")
  }
  return warnings
}

function validateFinishedEnvelope(stock: PlasticsDimensions, finished: PlasticsDimensions) {
  if (
    finished.lengthMm > stock.lengthMm ||
    finished.widthMm > stock.widthMm ||
    finished.heightMm > stock.heightMm
  ) {
    throw new Error("finishedDimensions cannot exceed stockDimensions")
  }
}

function assertDimensions(dimensions: PlasticsDimensions, key: string) {
  assertPositive(dimensions.lengthMm, `${key}.lengthMm`)
  assertPositive(dimensions.widthMm, `${key}.widthMm`)
  assertPositive(dimensions.heightMm, `${key}.heightMm`)
}

function volumeMm3(dimensions: PlasticsDimensions) {
  return dimensions.lengthMm * dimensions.widthMm * dimensions.heightMm
}

function line(key: string, label: string, amountCents: number, formula: string): PlasticsBreakdownLine {
  return {
    key,
    label,
    amountCents: safeCents(amountCents),
    formula,
    source: "calculator",
  }
}

function sumLines(lines: PlasticsBreakdownLine[]) {
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
