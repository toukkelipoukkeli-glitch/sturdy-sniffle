export const FABRICATION_CALCULATOR_VERSION = "fabrication.v1"

export type FabricationPriority = "normal" | "rush"
export type FabricationCurrencyCode = "EUR" | "USD" | "GBP"

export interface FabricationMaterialInput {
  label: string
  quantityPerPart: number
  unitCostCents: number
}

export interface FabricationShopInput {
  setupRateCents: number
  fabricationRateCents: number
  weldingRateCents: number
  assemblyRateCents: number
  capacityMinutesPerDay?: number
}

export interface FabricationRateCardInput {
  currency: FabricationCurrencyCode
  setupMinimumCents: number
  minimumOrderCents: number
  marginPercent: number
  rushMultiplier: number
  baseLeadTimeDays: number
  rushLeadTimeDays?: number
}

export interface FabricationOutsideServiceInput {
  label: string
  amountCents: number
}

export interface FabricationOperationInput {
  setupMinutes: number
  fabricationMinutesPerPart: number
  weldingMinutesPerPart?: number
  assemblyMinutesPerPart?: number
  inspectionMinutesPerPart?: number
  complexityMultiplier?: number
  consumableCentsPerPart?: number
  outsideServices?: FabricationOutsideServiceInput[]
}

export interface FabricationQuoteInput {
  partNumber: string
  quantity: number
  priority: FabricationPriority
  materials: FabricationMaterialInput[]
  shop: FabricationShopInput
  rateCard: FabricationRateCardInput
  operation: FabricationOperationInput
  finish?: string
  toleranceClass?: string
}

export interface FabricationBreakdownLine {
  key: string
  label: string
  amountCents: number
  formula: string
  source: "calculator"
}

export interface FabricationAssumption {
  key: string
  value: string
}

export interface FabricationQuoteResult {
  calculatorVersion: typeof FABRICATION_CALCULATOR_VERSION
  process: "fabrication"
  partNumber: string
  quantity: number
  currency: FabricationCurrencyCode
  leadTimeDays: number
  unitPriceCents: number
  unitRemainderCents: number
  totalCents: number
  breakdown: FabricationBreakdownLine[]
  assumptions: FabricationAssumption[]
  warnings: string[]
}

export function calculateFabricationQuote(input: FabricationQuoteInput): FabricationQuoteResult {
  validateInput(input)

  const quantity = input.quantity
  const complexityMultiplier = input.operation.complexityMultiplier ?? 1
  const setupMinutes = input.operation.setupMinutes
  const fabricationMinutes = input.operation.fabricationMinutesPerPart * complexityMultiplier * quantity
  const weldingMinutes = (input.operation.weldingMinutesPerPart ?? 0) * quantity
  const assemblyMinutes = (input.operation.assemblyMinutesPerPart ?? 0) * quantity
  const inspectionMinutes = (input.operation.inspectionMinutesPerPart ?? 0) * quantity
  const setupCents = Math.max(
    prorateHourlyCents(input.shop.setupRateCents, setupMinutes),
    input.rateCard.setupMinimumCents,
  )
  const materialLines = input.materials.map((material, index) =>
    line(
      `material:${normalizeKey(material.label) || "material"}_${index + 1}`,
      material.label,
      ceilCents(material.quantityPerPart * quantity * material.unitCostCents),
      `${formatNumber(material.quantityPerPart)} units/part x ${quantity} x ${material.unitCostCents} cents/unit`,
    ),
  )
  const fabricationCents = prorateHourlyCents(input.shop.fabricationRateCents, fabricationMinutes)
  const weldingCents = prorateHourlyCents(input.shop.weldingRateCents, weldingMinutes)
  const assemblyCents = prorateHourlyCents(input.shop.assemblyRateCents, assemblyMinutes)
  const inspectionCents = prorateHourlyCents(input.shop.setupRateCents, inspectionMinutes)
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
      "Setup and work planning",
      setupCents,
      `max(${setupMinutes} min x ${input.shop.setupRateCents} cents/hour, setup minimum ${input.rateCard.setupMinimumCents})`,
    ),
    ...materialLines,
    line(
      "fabrication",
      "Cutting, fit-up, and fabrication",
      fabricationCents,
      `${formatNumber(input.operation.fabricationMinutesPerPart)} min/part x ${quantity} x ${formatNumber(complexityMultiplier)} complexity x ${input.shop.fabricationRateCents} cents/hour`,
    ),
    line(
      "welding",
      "Welding",
      weldingCents,
      `${formatNumber(input.operation.weldingMinutesPerPart ?? 0)} min/part x ${quantity} x ${input.shop.weldingRateCents} cents/hour`,
    ),
    line(
      "assembly",
      "Assembly",
      assemblyCents,
      `${formatNumber(input.operation.assemblyMinutesPerPart ?? 0)} min/part x ${quantity} x ${input.shop.assemblyRateCents} cents/hour`,
    ),
    line(
      "inspection",
      "Inspection",
      inspectionCents,
      `${formatNumber(input.operation.inspectionMinutesPerPart ?? 0)} min/part x ${quantity} x ${input.shop.setupRateCents} cents/hour`,
    ),
    line(
      "consumables",
      "Weld wire, gas, and shop consumables",
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
  const totalLaborMinutes = setupMinutes + fabricationMinutes + weldingMinutes + assemblyMinutes + inspectionMinutes
  const loadDays = Math.ceil(totalLaborMinutes / (input.shop.capacityMinutesPerDay ?? 420))
  const standardLeadTimeDays = input.rateCard.baseLeadTimeDays + loadDays
  const leadTimeDays =
    input.priority === "rush"
      ? (input.rateCard.rushLeadTimeDays ?? Math.max(1, Math.ceil(standardLeadTimeDays * 0.65)))
      : standardLeadTimeDays

  return {
    calculatorVersion: FABRICATION_CALCULATOR_VERSION,
    process: "fabrication",
    partNumber: input.partNumber.trim(),
    quantity,
    currency: input.rateCard.currency,
    leadTimeDays,
    unitPriceCents,
    unitRemainderCents,
    totalCents,
    breakdown,
    assumptions: buildAssumptions(input, complexityMultiplier, totalLaborMinutes),
    warnings: buildWarnings(input, minimumAdjustmentCents),
  }
}

function validateInput(input: FabricationQuoteInput) {
  if (!input.partNumber.trim()) {
    throw new Error("partNumber is required")
  }

  assertPositiveInteger(input.quantity, "quantity")
  if (input.materials.length === 0) {
    throw new Error("materials must include at least one line")
  }
  for (const material of input.materials) {
    if (!material.label.trim()) {
      throw new Error("material.label is required")
    }
    assertPositive(material.quantityPerPart, "material.quantityPerPart")
    assertCents(material.unitCostCents, "material.unitCostCents")
  }
  assertPositiveCents(input.shop.setupRateCents, "shop.setupRateCents")
  assertPositiveCents(input.shop.fabricationRateCents, "shop.fabricationRateCents")
  assertPositiveCents(input.shop.weldingRateCents, "shop.weldingRateCents")
  assertPositiveCents(input.shop.assemblyRateCents, "shop.assemblyRateCents")
  assertPositive(input.shop.capacityMinutesPerDay ?? 420, "shop.capacityMinutesPerDay")
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
  assertPositive(input.operation.fabricationMinutesPerPart, "operation.fabricationMinutesPerPart")
  assertNonNegative(input.operation.weldingMinutesPerPart ?? 0, "operation.weldingMinutesPerPart")
  assertNonNegative(input.operation.assemblyMinutesPerPart ?? 0, "operation.assemblyMinutesPerPart")
  assertNonNegative(input.operation.inspectionMinutesPerPart ?? 0, "operation.inspectionMinutesPerPart")
  assertPositive(input.operation.complexityMultiplier ?? 1, "operation.complexityMultiplier")
  assertCents(input.operation.consumableCentsPerPart ?? 0, "operation.consumableCentsPerPart")

  for (const service of input.operation.outsideServices ?? []) {
    if (!service.label.trim()) {
      throw new Error("outsideServices.label is required")
    }
    assertCents(service.amountCents, "outsideServices.amountCents")
  }
}

function buildAssumptions(
  input: FabricationQuoteInput,
  complexityMultiplier: number,
  totalLaborMinutes: number,
): FabricationAssumption[] {
  const assumptions: FabricationAssumption[] = [
    { key: "material_line_count", value: String(input.materials.length) },
    { key: "fabrication_minutes_per_part", value: formatNumber(input.operation.fabricationMinutesPerPart) },
    { key: "welding_minutes_per_part", value: formatNumber(input.operation.weldingMinutesPerPart ?? 0) },
    { key: "assembly_minutes_per_part", value: formatNumber(input.operation.assemblyMinutesPerPart ?? 0) },
    { key: "complexity_multiplier", value: formatNumber(complexityMultiplier) },
    { key: "total_labor_minutes", value: formatNumber(totalLaborMinutes) },
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

function buildWarnings(input: FabricationQuoteInput, minimumAdjustmentCents: number): string[] {
  const warnings: string[] = []
  if (minimumAdjustmentCents > 0) {
    warnings.push("Minimum order adjustment applied.")
  }
  if ((input.operation.complexityMultiplier ?? 1) >= 1.4) {
    warnings.push("High fabrication complexity multiplier; review fit-up and fixture assumptions.")
  }
  if ((input.operation.weldingMinutesPerPart ?? 0) > input.operation.fabricationMinutesPerPart) {
    warnings.push("Welding time exceeds fabrication time; review weld process and distortion control.")
  }
  return warnings
}

function line(key: string, label: string, amountCents: number, formula: string): FabricationBreakdownLine {
  return {
    key,
    label,
    amountCents: safeCents(amountCents),
    formula,
    source: "calculator",
  }
}

function sumLines(lines: FabricationBreakdownLine[]) {
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
