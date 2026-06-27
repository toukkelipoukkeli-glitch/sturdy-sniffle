import { describe, expect, it } from "vitest"

import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, PROCESS_QUOTE_PREVIEW_VERSION } from "./processQuotePreview"

describe("process quote preview", () => {
  it("selects a non-CNC registry demo and marks the option", () => {
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "wire_edm")

    expect(preview.previewVersion).toBe(PROCESS_QUOTE_PREVIEW_VERSION)
    expect(preview.selected.process).toBe("wire_edm")
    expect(preview.editable).toBe(false)
    expect(preview.guardrailCopy).toBe("Read-only registry fixture. Process-specific editable inputs are not enabled yet.")
    expect(preview.options.map((option) => [option.process, option.selected, option.badges])).toEqual([
      ["sheet_metal", false, ["Best price", "Fastest lead"]],
      ["plastic", false, []],
      ["wire_edm", true, []],
      ["fabrication", false, []],
    ])
    expect(preview.comparison).toEqual({
      cheapestLabel: "Sheet metal",
      cheapestTotalCents: 54905,
      currency: "EUR",
      fastestLabel: "Sheet metal",
      fastestLeadTimeDays: 7,
      selectedLeadTimeDeltaDays: 9,
      selectedPriceDeltaCents: 526069,
    })
    expect(preview.topBreakdown.length).toBeGreaterThan(0)
    expect(preview.topBreakdown.length).toBeLessThanOrEqual(5)
    expect(preview.topAssumptions).toEqual(preview.selected.quote.assumptions.slice(0, 4))
    expect(preview.reviewFlags).toEqual(preview.selected.quote.warnings)
    expect(preview.summaryText).toContain("Non-CNC quote preview\nProcess: Wire EDM\nPart: EDM-KEY-077")
    expect(preview.summaryText).toContain("Total: EUR 5809.74")
    expect(preview.summaryText).toContain("- stock_size_mm: 100 x 60 x 20")
    expect(preview.summaryText).toContain("- Input model read-only [blocked]: Editable process-specific inputs are not enabled yet.")
    expect(preview.summaryText).toContain("- No calculator flags")
    expect(preview.operatorChecklist).toEqual([
      {
        detail: "Wire EDM totals came from wire-edm.v1.",
        key: "calculator-ready",
        label: "Calculator ready",
        level: "ready",
      },
      {
        detail: "Editable process-specific inputs are not enabled yet.",
        key: "editable-inputs",
        label: "Input model read-only",
        level: "blocked",
      },
      {
        detail: "Use this preview for operator comparison only; releases still use the active RFQ quote.",
        key: "offer-wiring",
        label: "Offer wiring pending",
        level: "review",
      },
      {
        detail: "No calculator flags on this fixture.",
        key: "calculator-flags",
        label: "Calculator flags",
        level: "ready",
      },
    ])
  })

  it("falls back to the first demo for stale selections", () => {
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "fabrication")
    const fallback = buildProcessQuotePreview(buildProcessDemoQuotes(), undefined)

    expect(preview.selected.process).toBe("fabrication")
    expect(fallback.selected.process).toBe("sheet_metal")
  })

  it("rejects mixed currencies before assigning price comparison badges", () => {
    const [sheetMetalDemo, plasticDemo] = buildProcessDemoQuotes()

    expect(() =>
      buildProcessQuotePreview([
        sheetMetalDemo,
        {
          ...plasticDemo,
          quote: {
            ...plasticDemo.quote,
            currency: "USD",
          },
        },
      ]),
    ).toThrow("Process demo quotes must share a currency before computing comparison badges")
  })

  it("marks calculator flags for warning-bearing process previews", () => {
    const [baseDemo] = buildProcessDemoQuotes()
    const preview = buildProcessQuotePreview([
      {
        ...baseDemo,
        quote: {
          ...baseDemo.quote,
          warnings: ["Minimum order adjustment applied."],
        },
      },
    ])

    expect(preview.operatorChecklist.find((item) => item.key === "calculator-flags")).toEqual({
      detail: "1 calculator flag requires review.",
      key: "calculator-flags",
      label: "Calculator flags",
      level: "review",
    })
    expect(preview.summaryText).toContain("- Minimum order adjustment applied.")
    expect(preview.summaryText).toContain("- Calculator flags [review]: 1 calculator flag requires review.")
    expect(preview.options[0]?.badges).toEqual(["Best price", "Fastest lead", "Review flags"])
  })
})
