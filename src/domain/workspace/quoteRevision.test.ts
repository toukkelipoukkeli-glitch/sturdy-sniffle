import { describe, expect, it } from "vitest"

import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import { calculateQuote, type QuoteEngineResult } from "../quoting/registry"
import { compareQuoteScenarios, type QuoteComparisonScenario } from "./quoteComparison"
import { buildQuoteRevisionAudit, duplicateQuoteScenario } from "./quoteRevision"

const baseQuote = calculateQuote({
  process: "cnc_milling",
  input: aluminumBracketFixture,
})

describe("quote revision audit", () => {
  it("builds a deterministic audit record for the selected quote scenario", () => {
    const economy = quoteVariant(baseQuote, {
      leadTimeDays: 10,
      totalCents: baseQuote.totalCents - 5000,
      warnings: [],
    })
    const rush = quoteVariant(baseQuote, {
      leadTimeDays: 4,
      totalCents: baseQuote.totalCents + 100000,
      warnings: ["Rush schedule requires production approval."],
    })
    const scenarios: QuoteComparisonScenario[] = [
      { id: "economy", label: "Economy", quote: economy },
      { id: "rush", label: "Rush", quote: rush },
    ]
    const comparison = compareQuoteScenarios(scenarios)

    const audit = buildQuoteRevisionAudit({
      author: "Sari Estimator",
      changes: [
        {
          after: "rush",
          before: "normal",
          field: "priority",
          reason: "Customer asked for the shortest workable delivery.",
        },
      ],
      comparison,
      createdAt: "2026-06-20T10:15:00+03:00",
      handoffNotes: ["Confirm spindle capacity before sending.", " "],
      previousQuote: baseQuote,
      quoteId: "quote-204",
      revision: 2,
      rfqId: "rfq-204",
      scenarios,
      selectedScenarioId: "rush",
    })

    expect(audit).toMatchObject({
      auditVersion: "quote-revision-audit.v1",
      author: "Sari Estimator",
      comparisonVersion: "quote-comparison.v1",
      createdAt: "2026-06-20T07:15:00.000Z",
      quoteId: "quote-204",
      revision: 2,
      revisionKey: "quote-204:r2",
      rfqId: "rfq-204",
      selectedScenario: {
        id: "rush",
        label: "Rush",
      },
      quote: {
        partNumber: "FB-CNC-204-A",
        process: "cnc_milling",
        totalCents: rush.totalCents,
        warningCount: 1,
      },
    })
    expect(audit.handoffNotes).toEqual(["Confirm spindle capacity before sending."])
    expect(audit.changes).toEqual([
      {
        after: "rush",
        before: "normal",
        field: "priority",
        reason: "Customer asked for the shortest workable delivery.",
      },
    ])
    expect(audit.decisions.map((decision) => decision.kind)).toEqual([
      "selected_scenario",
      "quote_delta",
      "calculator_warning",
      "handoff_note",
    ])
    expect(audit.decisions[0]?.detail).toBe("Selected Rush over recommended scenario Economy.")
    expect(audit.decisions[1]?.detail).toBe("Revision delta: +EUR 1000.00 total, -5 days lead time.")
    expect(audit.decisions[2]).toMatchObject({
      detail: "Rush schedule requires production approval.",
      severity: "warning",
    })
  })

  it("duplicates quote scenarios without sharing mutable quote arrays", () => {
    const source: QuoteComparisonScenario = {
      id: "base",
      label: "Base",
      quote: baseQuote,
    }

    const copy = duplicateQuoteScenario(source, { id: "base-copy", label: "Base copy" })

    expect(copy).toMatchObject({
      id: "base-copy",
      label: "Base copy",
      quote: {
        partNumber: "FB-CNC-204-A",
        totalCents: baseQuote.totalCents,
      },
    })
    expect(copy.quote).not.toBe(source.quote)
    expect(copy.quote.assumptions).not.toBe(source.quote.assumptions)
    expect(copy.quote.breakdown).not.toBe(source.quote.breakdown)
    expect(copy.quote.warnings).not.toBe(source.quote.warnings)
  })

  it("rejects invalid revision audit inputs", () => {
    const scenarios: QuoteComparisonScenario[] = [{ id: "base", label: "Base", quote: baseQuote }]
    const comparison = compareQuoteScenarios(scenarios)

    expect(() =>
      buildQuoteRevisionAudit({
        author: "Estimator",
        comparison,
        createdAt: "2026-06-20T07:15:00.000Z",
        quoteId: "quote-204",
        revision: 0,
        scenarios,
      }),
    ).toThrow("revision must be a positive integer")

    expect(() =>
      buildQuoteRevisionAudit({
        author: "Estimator",
        comparison,
        createdAt: "2026-06-20T07:15:00.000Z",
        quoteId: "quote-204",
        revision: 1,
        scenarios,
        selectedScenarioId: "missing",
      }),
    ).toThrow("selectedScenarioId must exist in comparison rows")

    expect(() =>
      buildQuoteRevisionAudit({
        author: "Estimator",
        changes: [{ after: "rush", before: "normal", field: " " }],
        comparison,
        createdAt: "not-a-date",
        quoteId: "quote-204",
        revision: 1,
        scenarios,
      }),
    ).toThrow("createdAt must be a valid ISO timestamp")

    expect(() =>
      buildQuoteRevisionAudit({
        author: "Estimator",
        comparison,
        createdAt: "2026-06-20T07:15:00.000Z",
        quoteId: "quote-204",
        revision: 1,
        scenarios: [
          {
            id: "base",
            label: "Base",
            quote: quoteVariant(baseQuote, { totalCents: baseQuote.totalCents + 1 }),
          },
        ],
      }),
    ).toThrow("selected scenario totalCents must match comparison row")
  })
})

function quoteVariant(quote: QuoteEngineResult, overrides: Partial<QuoteEngineResult>): QuoteEngineResult {
  const totalCents = overrides.totalCents ?? quote.totalCents
  const quantity = overrides.quantity ?? quote.quantity
  const unitPriceCents = overrides.unitPriceCents ?? Math.floor(totalCents / quantity)
  const unitRemainderCents = overrides.unitRemainderCents ?? totalCents - unitPriceCents * quantity

  return {
    ...quote,
    ...overrides,
    totalCents,
    unitPriceCents,
    unitRemainderCents,
  }
}
