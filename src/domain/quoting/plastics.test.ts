import { describe, expect, it } from "vitest"

import { pomGuideFixture, rushMinimumPomGuideFixture } from "./plastics.fixtures"
import { PLASTICS_CALCULATOR_VERSION, calculatePlasticsQuote, type PlasticsQuoteResult } from "./plastics"

describe("calculatePlasticsQuote", () => {
  it("calculates an explainable plastic machining quote", () => {
    const quote = calculatePlasticsQuote(pomGuideFixture)

    expect(quote).toMatchObject({
      calculatorVersion: PLASTICS_CALCULATOR_VERSION,
      process: "plastic_machining",
      partNumber: "POM-GUIDE-042",
      quantity: 30,
      currency: "EUR",
      leadTimeDays: 10,
      unitPriceCents: 3236,
      unitRemainderCents: 16,
      totalCents: 97096,
      warnings: [],
    })
    expect(lineAmount(quote, "setup")).toBe(10000)
    expect(lineAmount(quote, "material")).toBe(1756)
    expect(lineAmount(quote, "processing")).toBe(47500)
    expect(lineAmount(quote, "finishing")).toBe(8500)
    expect(lineAmount(quote, "consumables")).toBe(3600)
    expect(lineAmount(quote, "outside_service:annealing_1")).toBe(4500)
    expect(lineAmount(quote, "margin")).toBe(21240)
    expect(assumptionValue(quote, "stock_weight_kg_per_part")).toBe("0.0623")
    expect(assumptionValue(quote, "material_removal_ratio")).toBe("0.2969")
  })

  it("applies rush surcharge and minimum-order adjustment deterministically", () => {
    const quote = calculatePlasticsQuote(rushMinimumPomGuideFixture)

    expect(quote).toMatchObject({
      quantity: 1,
      leadTimeDays: 5,
      unitPriceCents: 40000,
      unitRemainderCents: 0,
      totalCents: 40000,
      warnings: ["Minimum order adjustment applied."],
    })
    expect(lineAmount(quote, "setup")).toBe(10000)
    expect(lineAmount(quote, "material")).toBe(59)
    expect(lineAmount(quote, "processing")).toBe(1584)
    expect(lineAmount(quote, "finishing")).toBe(284)
    expect(lineAmount(quote, "consumables")).toBe(120)
    expect(lineAmount(quote, "outside_service:annealing_1")).toBe(4500)
    expect(lineAmount(quote, "margin")).toBe(4634)
    expect(lineAmount(quote, "rush_surcharge")).toBe(7414)
    expect(lineAmount(quote, "minimum_order_adjustment")).toBe(11405)
    expect(assumptionValue(quote, "rush_multiplier")).toBe("1.35")
  })

  it("keeps outside-service keys unique after label normalization", () => {
    const quote = calculatePlasticsQuote({
      ...pomGuideFixture,
      operation: {
        ...pomGuideFixture.operation,
        outsideServices: [
          { label: "Annealing", amountCents: 100 },
          { label: "annealing!", amountCents: 200 },
          { label: "!!!", amountCents: 300 },
        ],
      },
    })

    const outsideServiceKeys = quote.breakdown
      .map((line) => line.key)
      .filter((key) => key.startsWith("outside_service:"))

    expect(outsideServiceKeys).toEqual([
      "outside_service:annealing_1",
      "outside_service:annealing_2",
      "outside_service:service_3",
    ])
  })

  it("flags high material removal and finishing-heavy plastics quotes", () => {
    const quote = calculatePlasticsQuote({
      ...pomGuideFixture,
      finishedDimensions: {
        lengthMm: 30,
        widthMm: 20,
        heightMm: 4,
      },
      operation: {
        ...pomGuideFixture.operation,
        finishingMinutesPerPart: 12.5,
      },
    })

    expect(quote.warnings).toContain("High plastic material removal ratio; review stock size and chip strategy.")
    expect(quote.warnings).toContain("Finishing time is at least cycle time; review edge quality assumptions.")
  })

  it("rejects finished geometry that exceeds the stock envelope", () => {
    expect(() =>
      calculatePlasticsQuote({
        ...pomGuideFixture,
        finishedDimensions: {
          lengthMm: 90,
          widthMm: 20,
          heightMm: 8,
        },
      }),
    ).toThrow("finishedDimensions cannot exceed stockDimensions")
  })

  it("rejects non-integer cent inputs before calculation", () => {
    expect(() =>
      calculatePlasticsQuote({
        ...pomGuideFixture,
        operation: {
          ...pomGuideFixture.operation,
          consumableCentsPerPart: 0.5,
        },
      }),
    ).toThrow("operation.consumableCentsPerPart must be a non-negative integer cent amount")
  })
})

function lineAmount(quote: PlasticsQuoteResult, key: string) {
  const line = quote.breakdown.find((item) => item.key === key)
  expect(line, `Missing quote line ${key}`).toBeDefined()
  return line?.amountCents
}

function assumptionValue(quote: PlasticsQuoteResult, key: string) {
  return quote.assumptions.find((item) => item.key === key)?.value
}
