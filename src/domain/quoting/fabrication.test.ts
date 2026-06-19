import { describe, expect, it } from "vitest"

import { rushMinimumWeldedFrameFixture, weldedFrameFixture } from "./fabrication.fixtures"
import {
  FABRICATION_CALCULATOR_VERSION,
  calculateFabricationQuote,
  type FabricationQuoteInput,
  type FabricationQuoteResult,
} from "./fabrication"

describe("calculateFabricationQuote", () => {
  it("calculates an explainable welded fabrication quote", () => {
    const quote = calculateFabricationQuote(weldedFrameFixture)

    expect(quote).toMatchObject({
      calculatorVersion: FABRICATION_CALCULATOR_VERSION,
      process: "fabrication",
      partNumber: "FAB-FRAME-508",
      quantity: 5,
      currency: "EUR",
      leadTimeDays: 14,
      unitPriceCents: 30142,
      unitRemainderCents: 0,
      totalCents: 150710,
      warnings: [],
    })
    expect(lineAmount(quote, "setup")).toBe(9000)
    expect(lineAmount(quote, "material:s355_tube_set_1")).toBe(21000)
    expect(lineAmount(quote, "material:laser_cut_gusset_kit_2")).toBe(8000)
    expect(lineAmount(quote, "fabrication")).toBe(29701)
    expect(lineAmount(quote, "welding")).toBe(23917)
    expect(lineAmount(quote, "assembly")).toBe(10200)
    expect(lineAmount(quote, "inspection")).toBe(3500)
    expect(lineAmount(quote, "consumables")).toBe(3250)
    expect(lineAmount(quote, "outside_service:galvanizing_1")).toBe(12000)
    expect(lineAmount(quote, "margin")).toBe(30142)
    expect(assumptionValue(quote, "complexity_multiplier")).toBe("1.1")
    expect(assumptionValue(quote, "total_labor_minutes")).toBe("602.5")
  })

  it("applies rush surcharge and minimum-order adjustment deterministically", () => {
    const quote = calculateFabricationQuote(rushMinimumWeldedFrameFixture)

    expect(quote).toMatchObject({
      quantity: 1,
      leadTimeDays: 6,
      unitPriceCents: 80000,
      unitRemainderCents: 0,
      totalCents: 80000,
      warnings: ["Minimum order adjustment applied."],
    })
    expect(lineAmount(quote, "setup")).toBe(9000)
    expect(lineAmount(quote, "material:s355_tube_set_1")).toBe(4200)
    expect(lineAmount(quote, "material:laser_cut_gusset_kit_2")).toBe(1600)
    expect(lineAmount(quote, "fabrication")).toBe(5941)
    expect(lineAmount(quote, "welding")).toBe(4784)
    expect(lineAmount(quote, "assembly")).toBe(2040)
    expect(lineAmount(quote, "inspection")).toBe(700)
    expect(lineAmount(quote, "consumables")).toBe(650)
    expect(lineAmount(quote, "outside_service:galvanizing_1")).toBe(12000)
    expect(lineAmount(quote, "margin")).toBe(10229)
    expect(lineAmount(quote, "rush_surcharge")).toBe(20458)
    expect(lineAmount(quote, "minimum_order_adjustment")).toBe(8398)
    expect(assumptionValue(quote, "rush_multiplier")).toBe("1.4")
  })

  it("keeps material and outside-service keys unique after label normalization", () => {
    const quote = calculateFabricationQuote({
      ...weldedFrameFixture,
      materials: [
        { label: "S355 tube set", quantityPerPart: 1, unitCostCents: 100 },
        { label: "s355 tube set!", quantityPerPart: 1, unitCostCents: 200 },
        { label: "!!!", quantityPerPart: 1, unitCostCents: 300 },
      ],
      operation: {
        ...weldedFrameFixture.operation,
        outsideServices: [
          { label: "Galvanizing", amountCents: 100 },
          { label: "galvanizing!", amountCents: 200 },
        ],
      },
    })

    const addonKeys = quote.breakdown
      .map((line) => line.key)
      .filter((key) => key.startsWith("material:") || key.startsWith("outside_service:"))

    expect(addonKeys).toEqual([
      "material:s355_tube_set_1",
      "material:s355_tube_set_2",
      "material:material_3",
      "outside_service:galvanizing_1",
      "outside_service:galvanizing_2",
    ])
  })

  it("flags high complexity and welding-heavy fabrication quotes", () => {
    const quote = calculateFabricationQuote({
      ...weldedFrameFixture,
      operation: {
        ...weldedFrameFixture.operation,
        complexityMultiplier: 1.5,
        weldingMinutesPerPart: 60,
      },
    })

    expect(quote.warnings).toContain("High fabrication complexity multiplier; review fit-up and fixture assumptions.")
    expect(quote.warnings).toContain("Welding time exceeds fabrication time; review weld process and distortion control.")
  })

  it("rejects empty material lists", () => {
    expect(() =>
      calculateFabricationQuote({
        ...weldedFrameFixture,
        materials: [],
      }),
    ).toThrow("materials must include at least one line")
  })

  it("rejects invalid runtime priority and currency values", () => {
    expect(() =>
      calculateFabricationQuote({
        ...weldedFrameFixture,
        priority: "urgent" as FabricationQuoteInput["priority"],
      }),
    ).toThrow("priority must be one of: normal, rush")

    expect(() =>
      calculateFabricationQuote({
        ...weldedFrameFixture,
        rateCard: {
          ...weldedFrameFixture.rateCard,
          currency: "JPY" as FabricationQuoteInput["rateCard"]["currency"],
        },
      }),
    ).toThrow("rateCard.currency must be one of: EUR, USD, GBP")
  })

  it("rejects non-integer cent inputs before calculation", () => {
    expect(() =>
      calculateFabricationQuote({
        ...weldedFrameFixture,
        materials: [{ label: "Tube", quantityPerPart: 1, unitCostCents: 0.5 }],
      }),
    ).toThrow("material.unitCostCents must be a non-negative integer cent amount")
  })
})

function lineAmount(quote: FabricationQuoteResult, key: string) {
  const line = quote.breakdown.find((item) => item.key === key)
  expect(line, `Missing quote line ${key}`).toBeDefined()
  return line?.amountCents
}

function assumptionValue(quote: FabricationQuoteResult, key: string) {
  return quote.assumptions.find((item) => item.key === key)?.value
}
