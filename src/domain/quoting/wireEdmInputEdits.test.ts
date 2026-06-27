import { describe, expect, it } from "vitest"

import { toolSteelKeywayFixture } from "./wireEdm.fixtures"
import {
  WIRE_EDM_INPUT_EDITS_VERSION,
  applyWireEdmInputEdits,
  buildWireEdmInputEditState,
  calculateEditedWireEdmQuote,
} from "./wireEdmInputEdits"

describe("wire EDM input edits", () => {
  it("builds editable state from the wire EDM fixture planned fields", () => {
    expect(buildWireEdmInputEditState()).toEqual({
      contourLengthMm: 780,
      editVersion: WIRE_EDM_INPUT_EDITS_VERSION,
      inspectionLevel: "+/- 0.01 mm",
      process: "wire_edm",
      skimPasses: 2,
      stockHeightMm: 20,
      stockLengthMm: 100,
      stockWidthMm: 60,
    })
  })

  it("applies planned field edits without mutating the source input", () => {
    const edited = applyWireEdmInputEdits({
      contourLengthMm: 900,
      inspectionLevel: " Precision inspection ",
      skimPasses: 3,
      stockHeightMm: 24,
      stockLengthMm: 120,
      stockWidthMm: 70,
    })

    expect(edited).toMatchObject({
      operation: {
        contourLengthMm: 900,
        skimPasses: 3,
      },
      stock: {
        heightMm: 24,
        lengthMm: 120,
        widthMm: 70,
      },
      toleranceClass: "Precision inspection",
    })
    expect(toolSteelKeywayFixture.operation.contourLengthMm).toBe(780)
    expect(toolSteelKeywayFixture.operation.skimPasses).toBe(2)
    expect(toolSteelKeywayFixture.stock).toEqual({
      heightMm: 20,
      lengthMm: 100,
      widthMm: 60,
    })
  })

  it("calculates edited wire EDM quotes through the shared registry", () => {
    const result = calculateEditedWireEdmQuote({
      contourLengthMm: 900,
      inspectionLevel: " Precision inspection ",
      skimPasses: 3,
      stockHeightMm: 24,
      stockLengthMm: 120,
      stockWidthMm: 70,
    })

    expect(result.editState).toEqual({
      contourLengthMm: 900,
      editVersion: WIRE_EDM_INPUT_EDITS_VERSION,
      inspectionLevel: "Precision inspection",
      process: "wire_edm",
      skimPasses: 3,
      stockHeightMm: 24,
      stockLengthMm: 120,
      stockWidthMm: 70,
    })
    expect(result.quote).toMatchObject({
      calculatorVersion: "wire-edm.v1",
      currency: "EUR",
      leadTimeDays: 20,
      process: "wire_edm",
      totalCents: 933891,
      unitPriceCents: 155648,
      unitRemainderCents: 3,
      warnings: ["High skim-pass count; review tolerance and surface-finish requirements."],
    })
    expect(result.quote.breakdown.find((line) => line.key === "material")?.amountCents).toBe(2593)
    expect(result.quote.breakdown.find((line) => line.key === "wire_cutting")?.amountCents).toBe(580260)
    expect(result.quote.assumptions.find((assumption) => assumption.key === "tolerance_class")?.value).toBe(
      "Precision inspection",
    )
  })

  it("clears optional inspection level when the edit is blank", () => {
    const edited = applyWireEdmInputEdits({ inspectionLevel: "   " })

    expect(edited.toleranceClass).toBeUndefined()
  })

  it("rejects invalid wire EDM planned field edits before calculation", () => {
    expect(() => applyWireEdmInputEdits({ stockLengthMm: Number.NaN })).toThrow(
      "stockLengthMm must be a positive finite number",
    )
    expect(() => applyWireEdmInputEdits({ contourLengthMm: 0 })).toThrow(
      "contourLengthMm must be a positive finite number",
    )
    expect(() => applyWireEdmInputEdits({ skimPasses: 1.5 })).toThrow("skimPasses must be a non-negative integer")
  })
})
