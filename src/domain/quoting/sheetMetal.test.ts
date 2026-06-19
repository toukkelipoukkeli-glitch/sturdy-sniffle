import { describe, expect, it } from "vitest"

import { laserBentBracketFixture, rushMinimumBracketFixture } from "./sheetMetal.fixtures"
import { SHEET_METAL_CALCULATOR_VERSION, calculateSheetMetalQuote, type SheetMetalQuoteResult } from "./sheetMetal"

describe("calculateSheetMetalQuote", () => {
  it("calculates an explainable laser-cut and bent sheet-metal quote", () => {
    const quote = calculateSheetMetalQuote(laserBentBracketFixture)

    expect(quote).toMatchObject({
      calculatorVersion: SHEET_METAL_CALCULATOR_VERSION,
      process: "sheet_metal",
      partNumber: "SM-120-BRACKET",
      quantity: 40,
      currency: "EUR",
      leadTimeDays: 7,
      unitPriceCents: 1372,
      unitRemainderCents: 25,
      totalCents: 54905,
      warnings: [],
    })
    expect(lineAmount(quote, "setup")).toBe(8000)
    expect(lineAmount(quote, "material")).toBe(4532)
    expect(lineAmount(quote, "laser_cutting")).toBe(5021)
    expect(lineAmount(quote, "bending")).toBe(10080)
    expect(lineAmount(quote, "deburr")).toBe(3467)
    expect(lineAmount(quote, "inspection")).toBe(1734)
    expect(lineAmount(quote, "hardware:m5_pem_nut_1")).toBe(3400)
    expect(lineAmount(quote, "outside_service:powder_coat_1")).toBe(6000)
    expect(lineAmount(quote, "margin")).toBe(12671)
    expect(assumptionValue(quote, "material_area_m2_per_part")).toBe("0.0354")
    expect(assumptionValue(quote, "cutting_minutes_per_part")).toBe("0.9656")
  })

  it("applies rush surcharge and minimum-order adjustment deterministically", () => {
    const quote = calculateSheetMetalQuote(rushMinimumBracketFixture)

    expect(quote).toMatchObject({
      quantity: 1,
      leadTimeDays: 3,
      unitPriceCents: 30000,
      unitRemainderCents: 0,
      totalCents: 30000,
      warnings: ["Minimum order adjustment applied."],
    })
    expect(lineAmount(quote, "setup")).toBe(8000)
    expect(lineAmount(quote, "material")).toBe(114)
    expect(lineAmount(quote, "laser_cutting")).toBe(126)
    expect(lineAmount(quote, "bending")).toBe(252)
    expect(lineAmount(quote, "deburr")).toBe(87)
    expect(lineAmount(quote, "inspection")).toBe(44)
    expect(lineAmount(quote, "hardware:m5_pem_nut_1")).toBe(85)
    expect(lineAmount(quote, "outside_service:powder_coat_1")).toBe(6000)
    expect(lineAmount(quote, "margin")).toBe(4413)
    expect(lineAmount(quote, "rush_surcharge")).toBe(6693)
    expect(lineAmount(quote, "minimum_order_adjustment")).toBe(4186)
    expect(assumptionValue(quote, "rush_multiplier")).toBe("1.35")
  })

  it("keeps hardware and outside-service keys unique after label normalization", () => {
    const quote = calculateSheetMetalQuote({
      ...laserBentBracketFixture,
      operation: {
        ...laserBentBracketFixture.operation,
        hardware: [
          { label: "M5 PEM nut", amountCentsPerPart: 10 },
          { label: "m5 pem nut!", amountCentsPerPart: 20 },
          { label: "!!!", amountCentsPerPart: 30 },
        ],
        outsideServices: [
          { label: "Powder coat", amountCents: 100 },
          { label: "powder coat!", amountCents: 200 },
        ],
      },
    })

    const addonKeys = quote.breakdown
      .map((line) => line.key)
      .filter((key) => key.startsWith("hardware:") || key.startsWith("outside_service:"))

    expect(addonKeys).toEqual([
      "hardware:m5_pem_nut_1",
      "hardware:m5_pem_nut_2",
      "hardware:hardware_3",
      "outside_service:powder_coat_1",
      "outside_service:powder_coat_2",
    ])
  })

  it("flags high yield factor and bend count for operator review", () => {
    const quote = calculateSheetMetalQuote({
      ...laserBentBracketFixture,
      material: {
        ...laserBentBracketFixture.material,
        yieldFactor: 1.4,
      },
      operation: {
        ...laserBentBracketFixture.operation,
        bendCount: 8,
      },
    })

    expect(quote.warnings).toContain("High sheet yield factor; review nesting and remnant strategy.")
    expect(quote.warnings).toContain("High bend count; review tooling and bend sequence.")
  })

  it("rejects bending operations without a press brake rate", () => {
    expect(() =>
      calculateSheetMetalQuote({
        ...laserBentBracketFixture,
        machine: {
          ...laserBentBracketFixture.machine,
          pressBrakeHourlyRateCents: undefined,
        },
      }),
    ).toThrow("machine.pressBrakeHourlyRateCents must be greater than zero")
  })

  it("rejects non-integer cent inputs before calculation", () => {
    expect(() =>
      calculateSheetMetalQuote({
        ...laserBentBracketFixture,
        operation: {
          ...laserBentBracketFixture.operation,
          hardware: [{ label: "Insert", amountCentsPerPart: 0.5 }],
        },
      }),
    ).toThrow("hardware.amountCentsPerPart must be a non-negative integer cent amount")
  })
})

function lineAmount(quote: SheetMetalQuoteResult, key: string) {
  const line = quote.breakdown.find((item) => item.key === key)
  expect(line, `Missing quote line ${key}`).toBeDefined()
  return line?.amountCents
}

function assumptionValue(quote: SheetMetalQuoteResult, key: string) {
  return quote.assumptions.find((item) => item.key === key)?.value
}
