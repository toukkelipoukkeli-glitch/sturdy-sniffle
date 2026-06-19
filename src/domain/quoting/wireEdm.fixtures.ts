import type { WireEdmQuoteInput } from "./wireEdm"

export const toolSteelKeywayFixture: WireEdmQuoteInput = {
  partNumber: "EDM-KEY-077",
  quantity: 6,
  priority: "normal",
  material: {
    name: "D2 tool steel",
    densityKgM3: 7850,
    costCentsPerKg: 260,
    yieldFactor: 1.05,
  },
  machine: {
    name: "Mitsubishi MV1200",
    hourlyRateCents: 9500,
    setupRateCents: 7600,
    cuttingRateMm2PerHour: 4200,
    skimPassRateFactor: 0.32,
    threadingMinutesPerStart: 1.5,
    consumableCentsPerCutHour: 1800,
    capacityMinutesPerDay: 360,
  },
  rateCard: {
    currency: "EUR",
    setupMinimumCents: 12000,
    minimumOrderCents: 25000,
    marginPercent: 30,
    rushMultiplier: 1.5,
    baseLeadTimeDays: 9,
    rushLeadTimeDays: 5,
  },
  stock: {
    lengthMm: 100,
    widthMm: 60,
    heightMm: 20,
  },
  operation: {
    setupMinutes: 50,
    programmingMinutes: 35,
    contourLengthMm: 780,
    startHoleCount: 4,
    skimPasses: 2,
    inspectionMinutesPerPart: 8,
    outsideServices: [{ label: "Heat treat certificate", amountCents: 7500 }],
  },
  finish: "Skim cut",
  toleranceClass: "+/- 0.01 mm",
}

export const rushMinimumToolSteelKeywayFixture: WireEdmQuoteInput = {
  ...toolSteelKeywayFixture,
  quantity: 1,
  priority: "rush",
  rateCard: {
    ...toolSteelKeywayFixture.rateCard,
    minimumOrderCents: 200000,
  },
}
