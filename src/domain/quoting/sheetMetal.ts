export const SHEET_METAL_CALCULATOR_VERSION = "sheet-metal.v1"

export type SheetMetalPriority = "normal" | "rush"
export type SheetMetalCurrencyCode = "EUR" | "USD" | "GBP"

export interface SheetMetalBlankInput {
  lengthMm: number
  widthMm: number
  thicknessMm: number
}

export interface SheetMetalMaterialInput {
  name: string
  costCentsPerM2: number
  yieldFactor?: number
}

export interface SheetMetalMachineInput {
  laserName: string
  laserHourlyRateCents: number
  setupRateCents: number
  cuttingSpeedMmPerMinute: number
  pierceSeconds: number
  pressBrakeName?: string
  pressBrakeHourlyRateCents?: number
  capacityMinutesPerDay?: number
}

export interface SheetMetalRateCardInput {
  currency: SheetMetalCurrencyCode
  setupMinimumCents: number
  minimumOrderCents: number
  marginPercent: number
  rushMultiplier: number
  baseLeadTimeDays: number
  rushLeadTimeDays?: number
}

export interface SheetMetalHardwareInput {
  label: string
  amountCentsPerPart: number
}

export interface SheetMetalOutsideServiceInput {
  label: string
  amountCents: number
}

export interface SheetMetalOperationInput {
  setupMinutes: number
  programmingMinutes?: number
  cuttingLengthMm: number
  pierceCount: number
  bendCount?: number
  bendMinutesPerBend?: number
  deburrMinutesPerPart?: number
  inspectionMinutesPerPart?: number
  hardware?: SheetMetalHardwareInput[]
  outsideServices?: SheetMetalOutsideServiceInput[]
}

export interface SheetMetalQuoteInput {
  partNumber: string
  quantity: number
  priority: SheetMetalPriority
  material: SheetMetalMaterialInput
  machine: SheetMetalMachineInput
  rateCard: SheetMetalRateCardInput
  blank: SheetMetalBlankInput
  operation: SheetMetalOperationInput
  finish?: string
  toleranceClass?: string
}

export interface SheetMetalBreakdownLine {
  key: string
  label: string
  amountCents: number
  formula: string
  source: "calculator"
}

export interface SheetMetalAssumption {
  key: string
  value: string
}

export interface SheetMetalQuoteResult {
  calculatorVersion: typeof SHEET_METAL_CALCULATOR_VERSION
  process: "sheet_metal"
  partNumber: string
  quantity: number
  currency: SheetMetalCurrencyCode
  leadTimeDays: number
  unitPriceCents: number
  unitRemainderCents: number
  totalCents: number
  breakdown: SheetMetalBreakdownLine[]
  assumptions: SheetMetalAssumption[]
  warnings: string[]
}

export function calculateSheetMetalQuote(input: SheetMetalQuoteInput): SheetMetalQuoteResult {
  validateInput(input)

  const quantity = input.quantity
  const yieldFactor = input.material.yieldFactor ?? 1
  const blankAreaM2 = input.blank.lengthMm * input.blank.widthMm * 1e-6
  const materialAreaM2PerPart = blankAreaM2 * yieldFactor
  const setupMinutes = input.operation.setupMinutes + (input.operation.programmingMinutes ?? 0)
  const setupCents = Math.max(
    prorateHourlyCents(input.machine.setupRateCents, setupMinutes),
    input.rateCard.setupMinimumCents,
  )

  const cuttingMinutesPerPart =
    input.operation.cuttingLengthMm / input.machine.cuttingSpeedMmPerMinute +
    (input.operation.pierceCount * input.machine.pierceSeconds) / 60
  const cuttingMinutes = cuttingMinutesPerPart * quantity
  const laserCents = prorateHourlyCents(input.machine.laserHourlyRateCents, cuttingMinutes)

  const bendCount = input.operation.bendCount ?? 0
  const bendMinutesPerBend = input.operation.bendMinutesPerBend ?? 0
  const bendingMinutes = bendCount * bendMinutesPerBend * quantity
  const bendingCents = prorateHourlyCents(input.machine.pressBrakeHourlyRateCents ?? 0, bendingMinutes)

  const materialCents = ceilCents(materialAreaM2PerPart * quantity * input.material.costCentsPerM2)
  const deburrMinutes = (input.operation.deburrMinutesPerPart ?? 0) * quantity
  const deburrCents = prorateHourlyCents(input.machine.setupRateCents, deburrMinutes)
  const inspectionMinutes = (input.operation.inspectionMinutesPerPart ?? 0) * quantity
  const inspectionCents = prorateHourlyCents(input.machine.setupRateCents, inspectionMinutes)
  const hardwareLines = (input.operation.hardware ?? []).map((hardware, index) =>
    line(
      `hardware:${normalizeKey(hardware.label) || "hardware"}_${index + 1}`,
      hardware.label,
      safeCents(hardware.amountCentsPerPart * quantity),
      `${hardware.amountCentsPerPart} cents/part x ${quantity}`,
    ),
  )
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
      `${input.material.name} sheet`,
      materialCents,
      `${formatNumber(materialAreaM2PerPart)} m2/part x ${quantity} x ${input.material.costCentsPerM2} cents/m2`,
    ),
    line(
      "laser_cutting",
      `${input.machine.laserName} cutting`,
      laserCents,
      `${formatNumber(cuttingMinutesPerPart)} min/part x ${quantity} x ${input.machine.laserHourlyRateCents} cents/hour`,
    ),
    line(
      "bending",
      input.machine.pressBrakeName ? `${input.machine.pressBrakeName} bending` : "Press brake bending",
      bendingCents,
      `${bendCount} bends x ${formatNumber(bendMinutesPerBend)} min/bend x ${quantity} x ${input.machine.pressBrakeHourlyRateCents ?? 0} cents/hour`,
    ),
    line(
      "deburr",
      "Deburr and edge finishing",
      deburrCents,
      `${formatNumber(input.operation.deburrMinutesPerPart ?? 0)} min/part x ${quantity} x ${input.machine.setupRateCents} cents/hour`,
    ),
    line(
      "inspection",
      "Inspection",
      inspectionCents,
      `${formatNumber(input.operation.inspectionMinutesPerPart ?? 0)} min/part x ${quantity} x ${input.machine.setupRateCents} cents/hour`,
    ),
    ...hardwareLines,
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
  const loadDays = Math.ceil((setupMinutes + cuttingMinutes + bendingMinutes) / (input.machine.capacityMinutesPerDay ?? 420))
  const standardLeadTimeDays = input.rateCard.baseLeadTimeDays + loadDays
  const leadTimeDays =
    input.priority === "rush"
      ? (input.rateCard.rushLeadTimeDays ?? Math.max(1, Math.ceil(standardLeadTimeDays * 0.65)))
      : standardLeadTimeDays

  return {
    calculatorVersion: SHEET_METAL_CALCULATOR_VERSION,
    process: "sheet_metal",
    partNumber: input.partNumber.trim(),
    quantity,
    currency: input.rateCard.currency,
    leadTimeDays,
    unitPriceCents,
    unitRemainderCents,
    totalCents,
    breakdown,
    assumptions: buildAssumptions(input, materialAreaM2PerPart, cuttingMinutesPerPart),
    warnings: buildWarnings(input, minimumAdjustmentCents),
  }
}

function validateInput(input: SheetMetalQuoteInput) {
  if (!input.partNumber.trim()) {
    throw new Error("partNumber is required")
  }

  assertPositiveInteger(input.quantity, "quantity")
  assertCents(input.material.costCentsPerM2, "material.costCentsPerM2")
  assertPositive(input.material.yieldFactor ?? 1, "material.yieldFactor")
  assertPositive(input.blank.lengthMm, "blank.lengthMm")
  assertPositive(input.blank.widthMm, "blank.widthMm")
  assertPositive(input.blank.thicknessMm, "blank.thicknessMm")
  assertPositiveCents(input.machine.laserHourlyRateCents, "machine.laserHourlyRateCents")
  assertPositiveCents(input.machine.setupRateCents, "machine.setupRateCents")
  assertPositive(input.machine.cuttingSpeedMmPerMinute, "machine.cuttingSpeedMmPerMinute")
  assertNonNegative(input.machine.pierceSeconds, "machine.pierceSeconds")
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
  assertPositive(input.operation.cuttingLengthMm, "operation.cuttingLengthMm")
  assertNonNegativeInteger(input.operation.pierceCount, "operation.pierceCount")
  assertNonNegativeInteger(input.operation.bendCount ?? 0, "operation.bendCount")
  assertNonNegative(input.operation.bendMinutesPerBend ?? 0, "operation.bendMinutesPerBend")
  if ((input.operation.bendCount ?? 0) > 0) {
    assertPositive(input.operation.bendMinutesPerBend ?? 0, "operation.bendMinutesPerBend")
    assertPositiveCents(input.machine.pressBrakeHourlyRateCents ?? 0, "machine.pressBrakeHourlyRateCents")
  }
  assertNonNegative(input.operation.deburrMinutesPerPart ?? 0, "operation.deburrMinutesPerPart")
  assertNonNegative(input.operation.inspectionMinutesPerPart ?? 0, "operation.inspectionMinutesPerPart")

  for (const hardware of input.operation.hardware ?? []) {
    if (!hardware.label.trim()) {
      throw new Error("hardware.label is required")
    }
    assertCents(hardware.amountCentsPerPart, "hardware.amountCentsPerPart")
  }

  for (const service of input.operation.outsideServices ?? []) {
    if (!service.label.trim()) {
      throw new Error("outsideServices.label is required")
    }
    assertCents(service.amountCents, "outsideServices.amountCents")
  }
}

function buildAssumptions(
  input: SheetMetalQuoteInput,
  materialAreaM2PerPart: number,
  cuttingMinutesPerPart: number,
): SheetMetalAssumption[] {
  const assumptions: SheetMetalAssumption[] = [
    { key: "blank_size_mm", value: `${input.blank.lengthMm} x ${input.blank.widthMm} x ${input.blank.thicknessMm}` },
    { key: "material_yield_factor", value: formatNumber(input.material.yieldFactor ?? 1) },
    { key: "material_area_m2_per_part", value: formatNumber(materialAreaM2PerPart) },
    { key: "cutting_minutes_per_part", value: formatNumber(cuttingMinutesPerPart) },
    { key: "margin_percent", value: formatNumber(input.rateCard.marginPercent) },
  ]

  if ((input.operation.bendCount ?? 0) > 0) {
    assumptions.push({ key: "bend_count", value: String(input.operation.bendCount) })
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

function buildWarnings(input: SheetMetalQuoteInput, minimumAdjustmentCents: number): string[] {
  const warnings: string[] = []
  if (minimumAdjustmentCents > 0) {
    warnings.push("Minimum order adjustment applied.")
  }
  if ((input.material.yieldFactor ?? 1) >= 1.35) {
    warnings.push("High sheet yield factor; review nesting and remnant strategy.")
  }
  if ((input.operation.bendCount ?? 0) >= 8) {
    warnings.push("High bend count; review tooling and bend sequence.")
  }
  return warnings
}

function line(key: string, label: string, amountCents: number, formula: string): SheetMetalBreakdownLine {
  return {
    key,
    label,
    amountCents: safeCents(amountCents),
    formula,
    source: "calculator",
  }
}

function sumLines(lines: SheetMetalBreakdownLine[]) {
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
