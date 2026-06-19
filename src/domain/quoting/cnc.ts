export const CNC_CALCULATOR_VERSION = "cnc.v1"

export type CncProcess = "cnc_milling" | "cnc_turning"
export type CncPriority = "normal" | "rush"
export type QuoteCurrencyCode = "EUR" | "USD" | "GBP"

export interface CncDimensions {
  lengthMm?: number
  widthMm?: number
  heightMm?: number
  diameterMm?: number
}

export interface CncMaterialInput {
  name: string
  densityKgM3: number
  costCentsPerKg: number
  yieldFactor?: number
}

export interface CncMachineInput {
  name: string
  hourlyRateCents: number
  setupRateCents: number
  capacityMinutesPerDay?: number
}

export interface CncRateCardInput {
  currency: QuoteCurrencyCode
  setupMinimumCents: number
  minimumOrderCents: number
  marginPercent: number
  rushMultiplier: number
  baseLeadTimeDays: number
  rushLeadTimeDays?: number
}

export interface CncOutsideServiceInput {
  label: string
  amountCents: number
}

export interface CncOperationInput {
  setupMinutes: number
  programmingMinutes?: number
  fixtureMinutes?: number
  cycleMinutesPerPart: number
  inspectionMinutesPerPart?: number
  consumableCentsPerPart?: number
  complexityMultiplier?: number
  outsideServices?: CncOutsideServiceInput[]
}

export interface CncQuoteInput {
  partNumber: string
  process: CncProcess
  quantity: number
  priority: CncPriority
  material: CncMaterialInput
  machine: CncMachineInput
  rateCard: CncRateCardInput
  stockDimensions: CncDimensions
  finishedDimensions?: CncDimensions
  operation: CncOperationInput
  toleranceClass?: string
  finish?: string
}

export interface QuoteBreakdownLine {
  key: string
  label: string
  amountCents: number
  formula: string
  source: "calculator"
}

export interface QuoteAssumption {
  key: string
  value: string
}

export interface CncQuoteResult {
  calculatorVersion: typeof CNC_CALCULATOR_VERSION
  process: CncProcess
  partNumber: string
  quantity: number
  currency: QuoteCurrencyCode
  leadTimeDays: number
  /** Base integer unit price; add unitRemainderCents once when reconstructing totalCents. */
  unitPriceCents: number
  unitRemainderCents: number
  totalCents: number
  breakdown: QuoteBreakdownLine[]
  assumptions: QuoteAssumption[]
  warnings: string[]
}

export function calculateCncQuote(input: CncQuoteInput): CncQuoteResult {
  validateInput(input)

  const quantity = input.quantity
  const materialYieldFactor = input.material.yieldFactor ?? 1
  const stockVolumeMm3 = calculateVolumeMm3(input.process, input.stockDimensions, "stockDimensions")
  const finishedVolumeMm3 = input.finishedDimensions
    ? calculateVolumeMm3(input.process, input.finishedDimensions, "finishedDimensions")
    : undefined
  if (input.finishedDimensions) {
    validateFinishedEnvelope(input.process, input.stockDimensions, input.finishedDimensions)
  }
  const removalRatio = finishedVolumeMm3 === undefined ? undefined : (stockVolumeMm3 - finishedVolumeMm3) / stockVolumeMm3

  const setupMinutes =
    input.operation.setupMinutes + (input.operation.programmingMinutes ?? 0) + (input.operation.fixtureMinutes ?? 0)
  const setupCents = Math.max(
    prorateHourlyCents(input.machine.setupRateCents, setupMinutes),
    input.rateCard.setupMinimumCents,
  )

  const cycleMinutesPerPart = input.operation.cycleMinutesPerPart * (input.operation.complexityMultiplier ?? 1)
  const runMinutes = cycleMinutesPerPart * quantity
  const machiningCents = prorateHourlyCents(input.machine.hourlyRateCents, runMinutes)

  const materialKgPerPart = stockVolumeMm3 * 1e-9 * input.material.densityKgM3 * materialYieldFactor
  const materialCents = ceilCents(materialKgPerPart * quantity * input.material.costCentsPerKg)

  const inspectionMinutes = (input.operation.inspectionMinutesPerPart ?? 0) * quantity
  const inspectionCents = prorateHourlyCents(input.machine.setupRateCents, inspectionMinutes)
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
      "Setup and programming",
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
      "machining",
      `${input.machine.name} machine time`,
      machiningCents,
      `${formatNumber(cycleMinutesPerPart)} min/part x ${quantity} x ${input.machine.hourlyRateCents} cents/hour`,
    ),
    line(
      "inspection",
      "Inspection",
      inspectionCents,
      `${formatNumber(input.operation.inspectionMinutesPerPart ?? 0)} min/part x ${quantity} x ${input.machine.setupRateCents} cents/hour`,
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
  breakdown.push(
    line(
      "margin",
      "Margin",
      marginCents,
      `${subtotalCents} cents subtotal x ${input.rateCard.marginPercent}%`,
    ),
  )

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
  const loadDays = Math.ceil((setupMinutes + runMinutes) / (input.machine.capacityMinutesPerDay ?? 420))
  const standardLeadTimeDays = input.rateCard.baseLeadTimeDays + loadDays
  const leadTimeDays =
    input.priority === "rush"
      ? (input.rateCard.rushLeadTimeDays ?? Math.max(1, Math.ceil(standardLeadTimeDays * 0.65)))
      : standardLeadTimeDays
  const warnings = buildWarnings(removalRatio, minimumAdjustmentCents)

  return {
    calculatorVersion: CNC_CALCULATOR_VERSION,
    process: input.process,
    partNumber: input.partNumber.trim(),
    quantity,
    currency: input.rateCard.currency,
    leadTimeDays,
    unitPriceCents,
    unitRemainderCents,
    totalCents,
    breakdown,
    assumptions: buildAssumptions(input, materialKgPerPart, cycleMinutesPerPart, removalRatio),
    warnings,
  }
}

function validateInput(input: CncQuoteInput) {
  if (!input.partNumber.trim()) {
    throw new Error("partNumber is required")
  }

  assertPositiveInteger(input.quantity, "quantity")
  assertCents(input.material.costCentsPerKg, "material.costCentsPerKg")
  assertPositive(input.material.densityKgM3, "material.densityKgM3")
  assertPositive(input.material.yieldFactor ?? 1, "material.yieldFactor")
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
  assertNonNegative(input.operation.inspectionMinutesPerPart ?? 0, "operation.inspectionMinutesPerPart")
  assertCents(input.operation.consumableCentsPerPart ?? 0, "operation.consumableCentsPerPart")
  assertPositive(input.operation.complexityMultiplier ?? 1, "operation.complexityMultiplier")

  for (const service of input.operation.outsideServices ?? []) {
    if (!service.label.trim()) {
      throw new Error("outside service label is required")
    }
    assertCents(service.amountCents, `outside service ${service.label}`)
  }
}

function calculateVolumeMm3(process: CncProcess, dimensions: CncDimensions, fieldName: string): number {
  if (process === "cnc_turning") {
    const diameterMm = requiredPositive(dimensions.diameterMm, `${fieldName}.diameterMm`)
    const lengthMm = requiredPositive(dimensions.lengthMm, `${fieldName}.lengthMm`)
    return Math.PI * (diameterMm / 2) ** 2 * lengthMm
  }

  const lengthMm = requiredPositive(dimensions.lengthMm, `${fieldName}.lengthMm`)
  const widthMm = requiredPositive(dimensions.widthMm, `${fieldName}.widthMm`)
  const heightMm = requiredPositive(dimensions.heightMm, `${fieldName}.heightMm`)
  return lengthMm * widthMm * heightMm
}

function validateFinishedEnvelope(process: CncProcess, stock: CncDimensions, finished: CncDimensions) {
  const axes: Array<keyof CncDimensions> =
    process === "cnc_turning" ? ["diameterMm", "lengthMm"] : ["lengthMm", "widthMm", "heightMm"]

  for (const axis of axes) {
    const stockValue = requiredPositive(stock[axis], `stockDimensions.${axis}`)
    const finishedValue = requiredPositive(finished[axis], `finishedDimensions.${axis}`)
    if (finishedValue > stockValue) {
      throw new Error("finishedDimensions cannot exceed stockDimensions for a subtractive CNC quote")
    }
  }
}

function buildWarnings(removalRatio: number | undefined, minimumAdjustmentCents: number): string[] {
  const warnings: string[] = []

  if (removalRatio !== undefined && removalRatio > 0.7) {
    warnings.push("High material removal ratio; review stock size and machining strategy.")
  }

  if (minimumAdjustmentCents > 0) {
    warnings.push("Minimum order adjustment applied.")
  }

  return warnings
}

function buildAssumptions(
  input: CncQuoteInput,
  materialKgPerPart: number,
  cycleMinutesPerPart: number,
  removalRatio: number | undefined,
): QuoteAssumption[] {
  const assumptions: QuoteAssumption[] = [
    { key: "material_yield_factor", value: formatNumber(input.material.yieldFactor ?? 1) },
    { key: "stock_weight_kg_per_part", value: formatNumber(materialKgPerPart) },
    { key: "cycle_minutes_per_part", value: formatNumber(cycleMinutesPerPart) },
    { key: "margin_percent", value: formatNumber(input.rateCard.marginPercent) },
  ]

  if (removalRatio !== undefined) {
    assumptions.push({ key: "material_removal_ratio", value: formatNumber(removalRatio) })
  }

  if (input.priority === "rush") {
    assumptions.push({ key: "rush_multiplier", value: formatNumber(input.rateCard.rushMultiplier) })
  }

  if (input.toleranceClass) {
    assumptions.push({ key: "tolerance_class", value: input.toleranceClass })
  }

  if (input.finish) {
    assumptions.push({ key: "finish", value: input.finish })
  }

  return assumptions
}

function line(key: string, label: string, amountCents: number, formula: string): QuoteBreakdownLine {
  return {
    key,
    label,
    amountCents: safeCents(amountCents),
    formula,
    source: "calculator",
  }
}

function prorateHourlyCents(hourlyRateCents: number, minutes: number): number {
  return ceilCents((hourlyRateCents * minutes) / 60)
}

function ceilCents(value: number): number {
  return safeCents(Math.ceil(value))
}

function safeCents(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid money amount: ${value}`)
  }

  return value
}

function sumLines(lines: QuoteBreakdownLine[]): number {
  return safeCents(lines.reduce((sum, item) => sum + item.amountCents, 0))
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")
}

function assertPositiveInteger(value: number | undefined, fieldName: string) {
  if (!Number.isInteger(value) || value === undefined || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`)
  }
}

function assertPositive(value: number | undefined, fieldName: string) {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    throw new Error(`${fieldName} must be positive`)
  }
}

function assertCents(value: number | undefined, fieldName: string) {
  if (!Number.isSafeInteger(value) || value === undefined || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer cent amount`)
  }
}

function assertPositiveCents(value: number | undefined, fieldName: string) {
  if (!Number.isSafeInteger(value) || value === undefined || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer cent amount`)
  }
}

function requiredPositive(value: number | undefined, fieldName: string): number {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    throw new Error(`${fieldName} must be positive`)
  }

  return value
}

function assertNonNegative(value: number | undefined, fieldName: string) {
  if (!Number.isFinite(value) || value === undefined || value < 0) {
    throw new Error(`${fieldName} must be non-negative`)
  }
}
