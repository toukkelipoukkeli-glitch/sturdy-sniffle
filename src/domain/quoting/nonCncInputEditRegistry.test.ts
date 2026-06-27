import { describe, expect, it } from "vitest"

import {
  NON_CNC_INPUT_EDIT_REGISTRY_VERSION,
  applyNonCncInputEdits,
  buildNonCncInputEditState,
  calculateEditedNonCncQuote,
  listNonCncInputEditAdapters,
} from "./nonCncInputEditRegistry"

describe("non-CNC input edit registry", () => {
  it("lists deterministic adapter summaries for every non-CNC process", () => {
    expect(NON_CNC_INPUT_EDIT_REGISTRY_VERSION).toBe("non-cnc-input-edit-registry.v1")
    expect(listNonCncInputEditAdapters()).toEqual([
      {
        editableFieldKeys: ["blankLengthMm", "blankWidthMm", "materialThicknessMm", "cuttingLengthMm", "bendCount"],
        editVersion: "sheet-metal-input-edits.v1",
        label: "Sheet metal",
        process: "sheet_metal",
        readOnlyFieldKeys: [],
        status: "domain_ready",
      },
      {
        editableFieldKeys: ["stockLengthMm", "stockWidthMm", "stockHeightMm", "materialFamily", "surfaceFinish"],
        editVersion: "plastics-input-edits.v1",
        label: "Plastic machining",
        process: "plastic",
        readOnlyFieldKeys: ["operationCount"],
        status: "domain_ready",
      },
      {
        editableFieldKeys: ["stockLengthMm", "stockWidthMm", "stockHeightMm", "contourLengthMm", "skimPasses", "inspectionLevel"],
        editVersion: "wire-edm-input-edits.v1",
        label: "Wire EDM",
        process: "wire_edm",
        readOnlyFieldKeys: [],
        status: "domain_ready",
      },
      {
        editableFieldKeys: [
          "fabricationMinutesPerPart",
          "weldingMinutesPerPart",
          "assemblyMinutesPerPart",
          "inspectionMinutesPerPart",
          "complexityMultiplier",
          "finishRequirement",
        ],
        editVersion: "fabrication-input-edits.v1",
        label: "Fabrication",
        process: "fabrication",
        readOnlyFieldKeys: [],
        status: "domain_ready",
      },
    ])
  })

  it("builds edit states through the shared process dispatch", () => {
    expect(buildNonCncInputEditState({ process: "sheet_metal" })).toMatchObject({
      bendCount: 3,
      editVersion: "sheet-metal-input-edits.v1",
      process: "sheet_metal",
    })
    expect(buildNonCncInputEditState({ process: "plastic" })).toMatchObject({
      editVersion: "plastics-input-edits.v1",
      operationCount: 5,
      process: "plastic",
    })
    expect(buildNonCncInputEditState({ process: "wire_edm" })).toMatchObject({
      editVersion: "wire-edm-input-edits.v1",
      process: "wire_edm",
      skimPasses: 2,
    })
    expect(buildNonCncInputEditState({ process: "fabrication" })).toMatchObject({
      editVersion: "fabrication-input-edits.v1",
      fabricationMinutesPerPart: 45,
      process: "fabrication",
    })
  })

  it("calculates edited quotes for all non-CNC adapters through one boundary", () => {
    const sheetMetal = calculateEditedNonCncQuote({
      patch: { bendCount: 5, blankLengthMm: 300, blankWidthMm: 150, cuttingLengthMm: 1800, materialThicknessMm: 3 },
      process: "sheet_metal",
    })
    const plastic = calculateEditedNonCncQuote({
      patch: {
        materialFamily: " POM-C black ",
        stockHeightMm: 14,
        stockLengthMm: 90,
        stockWidthMm: 45,
        surfaceFinish: " Fine deburr ",
      },
      process: "plastic",
    })
    const wireEdm = calculateEditedNonCncQuote({
      patch: {
        contourLengthMm: 900,
        inspectionLevel: " Precision inspection ",
        skimPasses: 3,
        stockHeightMm: 24,
        stockLengthMm: 120,
        stockWidthMm: 70,
      },
      process: "wire_edm",
    })
    const fabrication = calculateEditedNonCncQuote({
      patch: {
        assemblyMinutesPerPart: 20,
        complexityMultiplier: 1.45,
        fabricationMinutesPerPart: 52,
        finishRequirement: " Powder coated ",
        inspectionMinutesPerPart: 8,
        weldingMinutesPerPart: 42,
      },
      process: "fabrication",
    })

    expect(sheetMetal).toMatchObject({
      editState: { bendCount: 5, process: "sheet_metal" },
      quote: { calculatorVersion: "sheet-metal.v1", totalCents: 67901 },
    })
    expect(plastic).toMatchObject({
      editState: { materialFamily: "POM-C black", operationCount: 5, process: "plastic" },
      quote: { calculatorVersion: "plastics.v1", totalCents: 98168 },
    })
    expect(wireEdm).toMatchObject({
      editState: { contourLengthMm: 900, process: "wire_edm", skimPasses: 3 },
      quote: { calculatorVersion: "wire-edm.v1", totalCents: 933891 },
    })
    expect(fabrication).toMatchObject({
      editState: { complexityMultiplier: 1.45, finishRequirement: "Powder coated", process: "fabrication" },
      quote: { calculatorVersion: "fabrication.v1", totalCents: 178989 },
    })
  })

  it("applies edits and surfaces adapter validation errors through the registry", () => {
    expect(applyNonCncInputEdits({ patch: { finishRequirement: "   " }, process: "fabrication" })).toMatchObject({
      finish: undefined,
    })

    expect(() => applyNonCncInputEdits({ patch: { skimPasses: 1.5 }, process: "wire_edm" })).toThrow(
      "skimPasses must be a non-negative integer",
    )
    expect(() =>
      applyNonCncInputEdits({
        // @ts-expect-error operationCount is intentionally read-only in the plastics adapter.
        patch: { operationCount: 7 },
        process: "plastic",
      }),
    ).toThrow("operationCount is read-only until plastics operation editing is supported")
  })
})
