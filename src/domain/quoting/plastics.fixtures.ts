import type { PlasticsQuoteInput } from "./plastics"

export const pomGuideFixture: PlasticsQuoteInput = {
  partNumber: "POM-GUIDE-042",
  process: "plastic_machining",
  quantity: 30,
  priority: "normal",
  material: {
    name: "POM-C natural",
    densityKgM3: 1410,
    costCentsPerKg: 940,
    yieldFactor: 1.15,
  },
  machine: {
    name: "Datron Neo",
    hourlyRateCents: 7600,
    setupRateCents: 6800,
    capacityMinutesPerDay: 420,
  },
  rateCard: {
    currency: "EUR",
    setupMinimumCents: 10000,
    minimumOrderCents: 18000,
    marginPercent: 28,
    rushMultiplier: 1.35,
    baseLeadTimeDays: 8,
    rushLeadTimeDays: 5,
  },
  stockDimensions: {
    lengthMm: 80,
    widthMm: 40,
    heightMm: 12,
  },
  finishedDimensions: {
    lengthMm: 75,
    widthMm: 36,
    heightMm: 10,
  },
  operation: {
    setupMinutes: 40,
    programmingMinutes: 35,
    fixtureMinutes: 10,
    cycleMinutesPerPart: 12.5,
    finishingMinutesPerPart: 2.5,
    consumableCentsPerPart: 120,
    outsideServices: [{ label: "Annealing", amountCents: 4500 }],
  },
  finish: "Deburred and annealed",
  toleranceClass: "+/- 0.10 mm",
}

export const rushMinimumPomGuideFixture: PlasticsQuoteInput = {
  ...pomGuideFixture,
  quantity: 1,
  priority: "rush",
  rateCard: {
    ...pomGuideFixture.rateCard,
    minimumOrderCents: 40000,
  },
}
