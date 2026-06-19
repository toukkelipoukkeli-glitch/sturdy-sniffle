import type { FabricationQuoteInput } from "./fabrication"

export const weldedFrameFixture: FabricationQuoteInput = {
  partNumber: "FAB-FRAME-508",
  quantity: 5,
  priority: "normal",
  materials: [
    { label: "S355 tube set", quantityPerPart: 1, unitCostCents: 4200 },
    { label: "Laser-cut gusset kit", quantityPerPart: 1, unitCostCents: 1600 },
  ],
  shop: {
    setupRateCents: 7000,
    fabricationRateCents: 7200,
    weldingRateCents: 8200,
    assemblyRateCents: 6800,
    capacityMinutesPerDay: 420,
  },
  rateCard: {
    currency: "EUR",
    setupMinimumCents: 9000,
    minimumOrderCents: 30000,
    marginPercent: 25,
    rushMultiplier: 1.4,
    baseLeadTimeDays: 12,
    rushLeadTimeDays: 6,
  },
  operation: {
    setupMinutes: 60,
    fabricationMinutesPerPart: 45,
    weldingMinutesPerPart: 35,
    assemblyMinutesPerPart: 18,
    inspectionMinutesPerPart: 6,
    complexityMultiplier: 1.1,
    consumableCentsPerPart: 650,
    outsideServices: [{ label: "Galvanizing", amountCents: 12000 }],
  },
  finish: "Hot-dip galvanized",
  toleranceClass: "EN ISO 13920-BF",
}

export const rushMinimumWeldedFrameFixture: FabricationQuoteInput = {
  ...weldedFrameFixture,
  quantity: 1,
  priority: "rush",
  rateCard: {
    ...weldedFrameFixture.rateCard,
    minimumOrderCents: 80000,
  },
}
