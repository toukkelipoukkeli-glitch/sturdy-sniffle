import { describe, expect, it } from "vitest"

import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import { calculateQuote, type QuoteEngineResult } from "../quoting/registry"
import { compareQuoteScenarios } from "./quoteComparison"

const baseQuote = calculateQuote({
  process: "cnc_milling",
  input: aluminumBracketFixture,
})

describe("quote comparison", () => {
  it("ranks alternate scenarios by price, lead time, and review flags", () => {
    const economy = quoteVariant(baseQuote, {
      totalCents: 100000,
      unitPriceCents: 4000,
      leadTimeDays: 8,
      warnings: [],
    })
    const rush = quoteVariant(baseQuote, {
      totalCents: 130000,
      unitPriceCents: 5200,
      leadTimeDays: 3,
      warnings: ["Rush schedule requires production approval."],
    })
    const riskyBudget = quoteVariant(baseQuote, {
      totalCents: 95000,
      unitPriceCents: 3800,
      leadTimeDays: 8,
      warnings: ["Material assumption needs review.", "Fixture estimate needs review."],
    })

    const comparison = compareQuoteScenarios([
      { id: "rush", label: "Rush", quote: rush },
      { id: "economy", label: "Economy", quote: economy },
      { id: "risky-budget", label: "Risky budget", quote: riskyBudget },
    ])

    expect(comparison).toMatchObject({
      comparisonVersion: "quote-comparison.v1",
      recommendedScenarioId: "economy",
      currency: "EUR",
      partNumber: "FB-CNC-204-A",
      quantity: 25,
    })
    expect(comparison.rows.map((row) => [row.id, row.rank, row.score])).toEqual([
      ["economy", 1, 81],
      ["rush", 2, 79],
      ["risky-budget", 3, 74],
    ])
    expect(comparison.rows[0]).toMatchObject({
      priceDeltaCents: 5000,
      leadTimeDeltaDays: 5,
      recommendationReasons: ["No calculator review flags."],
    })
    expect(comparison.rows[2]?.recommendationReasons).toContain("Lowest total price.")
    expect(comparison.rows[2]?.recommendationReasons).toContain("2 calculator review flags.")
  })

  it("supports a single quote scenario", () => {
    const comparison = compareQuoteScenarios([{ id: "base", label: "Base quote", quote: baseQuote }])

    expect(comparison.recommendedScenarioId).toBe("base")
    expect(comparison.rows).toEqual([
      {
        id: "base",
        label: "Base quote",
        rank: 1,
        partNumber: "FB-CNC-204-A",
        quantity: 25,
        totalCents: baseQuote.totalCents,
        unitPriceCents: baseQuote.unitPriceCents,
        leadTimeDays: baseQuote.leadTimeDays,
        warningCount: baseQuote.warnings.length,
        priceDeltaCents: 0,
        leadTimeDeltaDays: 0,
        score: 100,
        recommendationReasons: ["Lowest total price.", "Shortest lead time.", "No calculator review flags."],
      },
    ])
  })

  it("rejects empty or incomparable scenario sets", () => {
    expect(() => compareQuoteScenarios([])).toThrow("At least one quote scenario is required")
    expect(() =>
      compareQuoteScenarios([
        { id: "base", label: "Base", quote: baseQuote },
        {
          id: "other-part",
          label: "Other part",
          quote: {
            ...baseQuote,
            partNumber: "OTHER",
          },
        },
      ]),
    ).toThrow("quote scenarios must use the same partNumber")
    expect(() =>
      compareQuoteScenarios([
        { id: "base", label: "Base", quote: baseQuote },
        {
          id: "blank",
          label: " ",
          quote: baseQuote,
        },
      ]),
    ).toThrow("scenario.label is required")
  })
})

function quoteVariant(quote: QuoteEngineResult, overrides: Partial<QuoteEngineResult>): QuoteEngineResult {
  return {
    ...quote,
    ...overrides,
  }
}
