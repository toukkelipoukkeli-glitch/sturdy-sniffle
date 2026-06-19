import { describe, expect, it } from "vitest"

import { aluminumBracketFixture, rushTurnedSpacerFixture } from "./cnc.fixtures"
import { CNC_CALCULATOR_VERSION, calculateCncQuote, type CncQuoteResult } from "./cnc"

describe("calculateCncQuote", () => {
  it("calculates an explainable CNC milling quote from fixture inputs", () => {
    const quote = calculateCncQuote(aluminumBracketFixture)

    expect(quote).toMatchObject({
      calculatorVersion: CNC_CALCULATOR_VERSION,
      process: "cnc_milling",
      partNumber: "FB-CNC-204-A",
      quantity: 25,
      currency: "EUR",
      leadTimeDays: 9,
      unitPriceCents: 4616,
      unitRemainderCents: 18,
      totalCents: 115418,
      warnings: [],
    })
    expect(lineAmount(quote, "setup")).toBe(12000)
    expect(lineAmount(quote, "material")).toBe(3774)
    expect(lineAmount(quote, "machining")).toBe(65521)
    expect(lineAmount(quote, "inspection")).toBe(4375)
    expect(lineAmount(quote, "consumables")).toBe(4500)
    expect(lineAmount(quote, "margin")).toBe(25248)
    expect(assumptionValue(quote, "material_yield_factor")).toBe("1.12")
    expect(assumptionValue(quote, "material_removal_ratio")).toBe("0.3583")
  })

  it("applies rush surcharge and minimum-order adjustment deterministically", () => {
    const quote = calculateCncQuote(rushTurnedSpacerFixture)

    expect(quote).toMatchObject({
      process: "cnc_turning",
      quantity: 1,
      leadTimeDays: 3,
      unitPriceCents: 50000,
      unitRemainderCents: 0,
      totalCents: 50000,
      warnings: ["Minimum order adjustment applied."],
    })
    expect(lineAmount(quote, "setup")).toBe(9000)
    expect(lineAmount(quote, "material")).toBe(556)
    expect(lineAmount(quote, "machining")).toBe(3374)
    expect(lineAmount(quote, "inspection")).toBe(507)
    expect(lineAmount(quote, "consumables")).toBe(350)
    expect(lineAmount(quote, "outside_service:passivation_1")).toBe(4500)
    expect(lineAmount(quote, "margin")).toBe(4572)
    expect(lineAmount(quote, "rush_surcharge")).toBe(11430)
    expect(lineAmount(quote, "minimum_order_adjustment")).toBe(15711)
    expect(assumptionValue(quote, "rush_multiplier")).toBe("1.5")
  })

  it("keeps outside-service breakdown keys unique after label normalization", () => {
    const quote = calculateCncQuote({
      ...rushTurnedSpacerFixture,
      rateCard: {
        ...rushTurnedSpacerFixture.rateCard,
        minimumOrderCents: 0,
      },
      operation: {
        ...rushTurnedSpacerFixture.operation,
        outsideServices: [
          { label: "Passivation", amountCents: 100 },
          { label: "passivation!", amountCents: 200 },
          { label: "!!!", amountCents: 300 },
        ],
      },
    })

    const outsideServiceKeys = quote.breakdown
      .map((line) => line.key)
      .filter((key) => key.startsWith("outside_service:"))

    expect(outsideServiceKeys).toEqual([
      "outside_service:passivation_1",
      "outside_service:passivation_2",
      "outside_service:service_3",
    ])
  })

  it("flags high material-removal quotes for operator review", () => {
    const quote = calculateCncQuote({
      ...aluminumBracketFixture,
      finishedDimensions: {
        lengthMm: 50,
        widthMm: 40,
        heightMm: 3,
      },
    })

    expect(quote.warnings).toContain("High material removal ratio; review stock size and machining strategy.")
  })

  it("rejects finished geometry that exceeds the stock envelope", () => {
    expect(() =>
      calculateCncQuote({
        ...aluminumBracketFixture,
        finishedDimensions: {
          lengthMm: 140,
          widthMm: 10,
          heightMm: 4,
        },
      }),
    ).toThrow("finishedDimensions cannot exceed stockDimensions")
  })

  it("rejects non-integer cent inputs before calculation", () => {
    expect(() =>
      calculateCncQuote({
        ...aluminumBracketFixture,
        operation: {
          ...aluminumBracketFixture.operation,
          consumableCentsPerPart: 0.5,
        },
      }),
    ).toThrow("operation.consumableCentsPerPart must be a non-negative integer cent amount")
  })
})

function lineAmount(quote: CncQuoteResult, key: string) {
  const line = quote.breakdown.find((item) => item.key === key)
  expect(line, `Missing quote line ${key}`).toBeDefined()
  return line?.amountCents
}

function assumptionValue(quote: CncQuoteResult, key: string) {
  return quote.assumptions.find((item) => item.key === key)?.value
}
