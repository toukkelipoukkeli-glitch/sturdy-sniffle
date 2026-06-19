import type { CncQuoteInput } from "./cnc"

export const aluminumBracketFixture: CncQuoteInput = {
  partNumber: "FB-CNC-204-A",
  process: "cnc_milling",
  quantity: 25,
  priority: "normal",
  material: {
    name: "Aluminum 6082",
    densityKgM3: 2700,
    costCentsPerKg: 520,
    yieldFactor: 1.12,
  },
  machine: {
    name: "Haas VF-2",
    hourlyRateCents: 8500,
    setupRateCents: 7000,
    capacityMinutesPerDay: 420,
  },
  rateCard: {
    currency: "EUR",
    setupMinimumCents: 12000,
    minimumOrderCents: 15000,
    marginPercent: 28,
    rushMultiplier: 1.4,
    baseLeadTimeDays: 7,
    rushLeadTimeDays: 4,
  },
  stockDimensions: {
    lengthMm: 120,
    widthMm: 80,
    heightMm: 10,
  },
  finishedDimensions: {
    lengthMm: 110,
    widthMm: 70,
    heightMm: 8,
  },
  operation: {
    setupMinutes: 45,
    programmingMinutes: 30,
    fixtureMinutes: 15,
    cycleMinutesPerPart: 18.5,
    inspectionMinutesPerPart: 1.5,
    consumableCentsPerPart: 180,
  },
  toleranceClass: "ISO 2768-M",
  finish: "Deburred",
}

export const rushTurnedSpacerFixture: CncQuoteInput = {
  partNumber: "FB-TURN-019",
  process: "cnc_turning",
  quantity: 1,
  priority: "rush",
  material: {
    name: "Stainless steel 316L",
    densityKgM3: 8000,
    costCentsPerKg: 640,
    yieldFactor: 1.08,
  },
  machine: {
    name: "Mazak Quick Turn",
    hourlyRateCents: 9200,
    setupRateCents: 7600,
    capacityMinutesPerDay: 390,
  },
  rateCard: {
    currency: "EUR",
    setupMinimumCents: 9000,
    minimumOrderCents: 50000,
    marginPercent: 25,
    rushMultiplier: 1.5,
    baseLeadTimeDays: 8,
    rushLeadTimeDays: 3,
  },
  stockDimensions: {
    diameterMm: 40,
    lengthMm: 80,
  },
  finishedDimensions: {
    diameterMm: 32,
    lengthMm: 70,
  },
  operation: {
    setupMinutes: 30,
    programmingMinutes: 15,
    cycleMinutesPerPart: 22,
    inspectionMinutesPerPart: 4,
    consumableCentsPerPart: 350,
    outsideServices: [{ label: "Passivation", amountCents: 4500 }],
  },
  toleranceClass: "+/- 0.05 mm",
  finish: "Passivated",
}
