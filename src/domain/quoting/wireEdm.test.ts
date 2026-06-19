import { describe, expect, it } from "vitest"

import { rushMinimumToolSteelKeywayFixture, toolSteelKeywayFixture } from "./wireEdm.fixtures"
import { WIRE_EDM_CALCULATOR_VERSION, calculateWireEdmQuote, type WireEdmQuoteResult } from "./wireEdm"

describe("calculateWireEdmQuote", () => {
  it("calculates an explainable wire EDM quote", () => {
    const quote = calculateWireEdmQuote(toolSteelKeywayFixture)

    expect(quote).toMatchObject({
      calculatorVersion: WIRE_EDM_CALCULATOR_VERSION,
      process: "wire_edm",
      partNumber: "EDM-KEY-077",
      quantity: 6,
      currency: "EUR",
      leadTimeDays: 16,
      unitPriceCents: 96829,
      unitRemainderCents: 0,
      totalCents: 580974,
      warnings: [],
    })
    expect(lineAmount(quote, "setup")).toBe(12000)
    expect(lineAmount(quote, "material")).toBe(1543)
    expect(lineAmount(quote, "wire_cutting")).toBe(352912)
    expect(lineAmount(quote, "wire_consumables")).toBe(66868)
    expect(lineAmount(quote, "inspection")).toBe(6080)
    expect(lineAmount(quote, "outside_service:heat_treat_certificate_1")).toBe(7500)
    expect(lineAmount(quote, "margin")).toBe(134071)
    expect(assumptionValue(quote, "cut_area_mm2_per_part")).toBe("15600")
    expect(assumptionValue(quote, "cut_hours_per_part")).toBe("6.1914")
  })

  it("applies rush surcharge and minimum-order adjustment deterministically", () => {
    const quote = calculateWireEdmQuote(rushMinimumToolSteelKeywayFixture)

    expect(quote).toMatchObject({
      quantity: 1,
      leadTimeDays: 5,
      unitPriceCents: 200000,
      unitRemainderCents: 0,
      totalCents: 200000,
      warnings: ["Minimum order adjustment applied."],
    })
    expect(lineAmount(quote, "setup")).toBe(12000)
    expect(lineAmount(quote, "material")).toBe(258)
    expect(lineAmount(quote, "wire_cutting")).toBe(58819)
    expect(lineAmount(quote, "wire_consumables")).toBe(11145)
    expect(lineAmount(quote, "inspection")).toBe(1014)
    expect(lineAmount(quote, "outside_service:heat_treat_certificate_1")).toBe(7500)
    expect(lineAmount(quote, "margin")).toBe(27221)
    expect(lineAmount(quote, "rush_surcharge")).toBe(58979)
    expect(lineAmount(quote, "minimum_order_adjustment")).toBe(23064)
    expect(assumptionValue(quote, "rush_multiplier")).toBe("1.5")
  })

  it("keeps outside-service keys unique after label normalization", () => {
    const quote = calculateWireEdmQuote({
      ...toolSteelKeywayFixture,
      operation: {
        ...toolSteelKeywayFixture.operation,
        outsideServices: [
          { label: "Heat treat certificate", amountCents: 100 },
          { label: "heat treat certificate!", amountCents: 200 },
          { label: "!!!", amountCents: 300 },
        ],
      },
    })

    const outsideServiceKeys = quote.breakdown
      .map((line) => line.key)
      .filter((key) => key.startsWith("outside_service:"))

    expect(outsideServiceKeys).toEqual([
      "outside_service:heat_treat_certificate_1",
      "outside_service:heat_treat_certificate_2",
      "outside_service:service_3",
    ])
  })

  it("flags high skim-pass and start-hole counts for operator review", () => {
    const quote = calculateWireEdmQuote({
      ...toolSteelKeywayFixture,
      operation: {
        ...toolSteelKeywayFixture.operation,
        skimPasses: 3,
        startHoleCount: 9,
      },
    })

    expect(quote.warnings).toContain("High skim-pass count; review tolerance and surface-finish requirements.")
    expect(quote.warnings).toContain("High start-hole count; review drill/fixture plan.")
  })

  it("rejects non-integer skim passes", () => {
    expect(() =>
      calculateWireEdmQuote({
        ...toolSteelKeywayFixture,
        operation: {
          ...toolSteelKeywayFixture.operation,
          skimPasses: 1.5,
        },
      }),
    ).toThrow("operation.skimPasses must be a non-negative integer")
  })

  it("rejects non-integer cent inputs before calculation", () => {
    expect(() =>
      calculateWireEdmQuote({
        ...toolSteelKeywayFixture,
        machine: {
          ...toolSteelKeywayFixture.machine,
          consumableCentsPerCutHour: 0.5,
        },
      }),
    ).toThrow("machine.consumableCentsPerCutHour must be a non-negative integer cent amount")
  })
})

function lineAmount(quote: WireEdmQuoteResult, key: string) {
  const line = quote.breakdown.find((item) => item.key === key)
  expect(line, `Missing quote line ${key}`).toBeDefined()
  return line?.amountCents
}

function assumptionValue(quote: WireEdmQuoteResult, key: string) {
  return quote.assumptions.find((item) => item.key === key)?.value
}
