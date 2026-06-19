import type { SheetMetalQuoteInput } from "./sheetMetal"

export const laserBentBracketFixture: SheetMetalQuoteInput = {
  partNumber: "SM-120-BRACKET",
  quantity: 40,
  priority: "normal",
  material: {
    name: "DC01 steel 2 mm",
    costCentsPerM2: 3200,
    yieldFactor: 1.18,
  },
  machine: {
    laserName: "Bystronic ByStar",
    laserHourlyRateCents: 7800,
    setupRateCents: 6500,
    cuttingSpeedMmPerMinute: 1800,
    pierceSeconds: 0.8,
    pressBrakeName: "Amada HFE",
    pressBrakeHourlyRateCents: 7200,
    capacityMinutesPerDay: 420,
  },
  rateCard: {
    currency: "EUR",
    setupMinimumCents: 8000,
    minimumOrderCents: 20000,
    marginPercent: 30,
    rushMultiplier: 1.35,
    baseLeadTimeDays: 6,
    rushLeadTimeDays: 3,
  },
  blank: {
    lengthMm: 250,
    widthMm: 120,
    thicknessMm: 2,
  },
  operation: {
    setupMinutes: 35,
    programmingMinutes: 25,
    cuttingLengthMm: 1450,
    pierceCount: 12,
    bendCount: 3,
    bendMinutesPerBend: 0.7,
    deburrMinutesPerPart: 0.8,
    inspectionMinutesPerPart: 0.4,
    hardware: [{ label: "M5 PEM nut", amountCentsPerPart: 85 }],
    outsideServices: [{ label: "Powder coat", amountCents: 6000 }],
  },
  finish: "Powder coated RAL 9005",
  toleranceClass: "ISO 2768-M",
}

export const rushMinimumBracketFixture: SheetMetalQuoteInput = {
  ...laserBentBracketFixture,
  quantity: 1,
  priority: "rush",
  rateCard: {
    ...laserBentBracketFixture.rateCard,
    minimumOrderCents: 30000,
  },
}
