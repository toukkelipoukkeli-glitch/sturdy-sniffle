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
    expect(preview.options.map((option) => [option.process, option.selected])).toEqual([
      ["sheet_metal", false],
      ["plastic", false],
      ["wire_edm", true],
      ["fabrication", false],
    ])
    expect(preview.topBreakdown.length).toBeGreaterThan(0)
    expect(preview.topBreakdown.length).toBeLessThanOrEqual(5)
    expect(preview.topAssumptions).toEqual(preview.selected.quote.assumptions.slice(0, 4))
    expect(preview.reviewFlags).toEqual(preview.selected.quote.warnings)
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
})
