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
      ["sheet_metal", false, ["Best price", "Fastest lead", "Draft complete"]],
      ["plastic", false, ["Draft gaps"]],
      ["wire_edm", true, ["Draft gaps"]],
      ["fabrication", false, ["Draft gaps"]],
    ])
    expect(preview.options.map((option) => [option.process, option.draftCoverageLabel, option.draftStatus])).toEqual([
      ["sheet_metal", "4/4 inputs", "ready_for_read_only_review"],
      ["plastic", "3/4 inputs", "missing_fixture_values"],
      ["wire_edm", "4/5 inputs", "missing_fixture_values"],
      ["fabrication", "1/5 inputs", "missing_fixture_values"],
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
    expect(preview.inputReadiness).toMatchObject({
      editable: false,
      fieldPlans: [
        {
          group: "stock dimensions",
          key: "stockSizeMm",
          label: "Stock size",
          required: true,
          valueKind: "dimension",
        },
        {
          group: "cut length",
          key: "cutLengthMm",
          label: "Cut length",
          required: true,
          valueKind: "dimension",
        },
        {
          group: "wire settings",
          key: "wireDiameterMm",
          label: "Wire diameter",
          required: true,
          valueKind: "dimension",
        },
        {
          group: "wire settings",
          key: "finishPasses",
          label: "Finish passes",
          required: true,
          valueKind: "quantity",
        },
        {
          group: "inspection scope",
          key: "inspectionLevel",
          label: "Inspection level",
          required: true,
          valueKind: "text",
        },
      ],
      process: "wire_edm",
      requiredGroups: ["stock dimensions", "cut length", "wire settings", "inspection scope"],
      status: "blocked",
    })
    expect(preview.inputDraft).toMatchObject({
      editable: false,
      populatedRequiredCount: 4,
      process: "wire_edm",
      requiredCount: 5,
      source: "registry_fixture",
      status: "missing_fixture_values",
    })
    expect(preview.inputDraft.values.find((value) => value.key === "wireDiameterMm")).toMatchObject({
      status: "missing",
      value: "Missing fixture value",
    })
    expect(preview.inputPromotionGate).toEqual({
      blockerLabels: ["Editable controls missing", "Missing required values"],
      blockers: ["editable_controls_missing", "missing_required_values"],
      gateVersion: "process-input-promotion-gate.v1",
      missingRequiredCount: 1,
      nextStep: "Populate every required process draft value, then add editable controls before promotion.",
      status: "blocked",
    })
    expect(preview.offerHandoff).toEqual({
      blockers: [
        "Non-CNC preview is not promoted into active RFQ quote state.",
        "Offer builder and release execution still use the active workspace quote.",
        "Promotion gate blocked: Editable controls missing, Missing required values.",
      ],
      candidateLines: [
        "Process quote: Wire EDM for EDM-KEY-077",
        "Preview total: EUR 5809.74 at 16 days",
        "Calculator: wire-edm.v1",
      ],
      handoffVersion: "process-quote-offer-handoff.v1",
      nextSteps: [
        "Map a validated non-CNC input draft into the RFQ quote path.",
        "Persist the selected process quote before enabling offer release.",
        "Run offer readiness on the promoted quote after customer-facing terms are confirmed.",
      ],
      status: "preview_only",
      statusLabel: "Preview only",
      summary:
        "Wire EDM can be reviewed as a non-CNC offer candidate, but it is not connected to the active RFQ offer or release path.",
    })
    expect(preview.topBreakdown.length).toBeGreaterThan(0)
    expect(preview.topBreakdown.length).toBeLessThanOrEqual(5)
    expect(preview.topAssumptions).toEqual(preview.selected.quote.assumptions.slice(0, 4))
    expect(preview.reviewFlags).toEqual(preview.selected.quote.warnings)
    expect(preview.summaryText).toContain("Non-CNC quote preview\nProcess: Wire EDM\nPart: EDM-KEY-077")
    expect(preview.summaryText).toContain("Total: EUR 5809.74")
    expect(preview.summaryText).toContain("Comparison:\n- Best price: Sheet metal (EUR 549.05)")
    expect(preview.summaryText).toContain("- Fastest lead: Sheet metal (7 days)")
    expect(preview.summaryText).toContain("- Selected delta: +EUR 5260.69, +9 days lead")
    expect(preview.summaryText).toContain("Editable input readiness:\n- Status: blocked")
    expect(preview.summaryText).toContain("- Required groups: stock dimensions, cut length, wire settings, inspection scope")
    expect(preview.summaryText).toContain("- Planned fields: Stock size, Cut length, Wire diameter, Finish passes, Inspection level")
    expect(preview.summaryText).toContain("- Draft coverage: 4/5 required fields populated from registry_fixture")
    expect(preview.summaryText).toContain("- Wire diameter: Missing fixture value")
    expect(preview.summaryText).toContain("- Promotion gate: blocked")
    expect(preview.summaryText).toContain("- Blockers: Editable controls missing, Missing required values")
    expect(preview.summaryText).toContain("- Next step: Populate every required process draft value, then add editable controls before promotion.")
    expect(preview.summaryText).not.toContain("- Promotion next step:")
    expect(preview.summaryText).toContain("Offer handoff:\n- Status: Preview only")
    expect(preview.summaryText).toContain("- Process quote: Wire EDM for EDM-KEY-077")
    expect(preview.summaryText).toContain("- Blocker: Non-CNC preview is not promoted into active RFQ quote state.")
    expect(preview.summaryText).toContain("- Next: Persist the selected process quote before enabling offer release.")
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

  it("prefers the selected process label for tied cheapest and fastest comparisons", () => {
    const [sheetMetalDemo, plasticDemo] = buildProcessDemoQuotes()
    const tiedPlasticDemo = {
      ...plasticDemo,
      quote: {
        ...plasticDemo.quote,
        leadTimeDays: sheetMetalDemo.quote.leadTimeDays,
        totalCents: sheetMetalDemo.quote.totalCents,
      },
    }

    const preview = buildProcessQuotePreview([sheetMetalDemo, tiedPlasticDemo], "plastic")

    expect(preview.comparison).toEqual({
      cheapestLabel: "Plastic machining",
      cheapestTotalCents: sheetMetalDemo.quote.totalCents,
      currency: "EUR",
      fastestLabel: "Plastic machining",
      fastestLeadTimeDays: sheetMetalDemo.quote.leadTimeDays,
      selectedLeadTimeDeltaDays: 0,
      selectedPriceDeltaCents: 0,
    })
    expect(preview.summaryText).toContain("Comparison:\n- Best price: Plastic machining (EUR 549.05)")
    expect(preview.summaryText).toContain("- Fastest lead: Plastic machining (7 days)")
    expect(preview.summaryText).toContain("- Selected delta: best price, fastest lead")
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
    expect(preview.options[0]?.badges).toEqual(["Best price", "Fastest lead", "Review flags", "Draft complete"])
    expect(preview.offerHandoff).toMatchObject({
      status: "needs_review",
      statusLabel: "Estimator review",
    })
    expect(preview.offerHandoff.blockers).toContain("1 calculator flag must be reviewed before customer offer use.")
  })
})
