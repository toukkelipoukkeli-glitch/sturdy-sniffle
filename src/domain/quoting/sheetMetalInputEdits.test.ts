import { describe, expect, it } from "vitest"

import { laserBentBracketFixture } from "./sheetMetal.fixtures"
import {
  SHEET_METAL_INPUT_EDITS_VERSION,
  applySheetMetalInputEdits,
  buildSheetMetalInputEditState,
  calculateEditedSheetMetalQuote,
} from "./sheetMetalInputEdits"

describe("sheet metal input edits", () => {
  it("builds editable state from the sheet-metal fixture planned fields", () => {
    expect(buildSheetMetalInputEditState()).toEqual({
      bendCount: 3,
      blankLengthMm: 250,
      blankWidthMm: 120,
      cuttingLengthMm: 1450,
      editVersion: SHEET_METAL_INPUT_EDITS_VERSION,
      materialThicknessMm: 2,
      process: "sheet_metal",
    })
  })

  it("applies planned field edits without mutating the source input", () => {
    const edited = applySheetMetalInputEdits({
      bendCount: 5,
      blankLengthMm: 300,
      blankWidthMm: 150,
      cuttingLengthMm: 1800,
      materialThicknessMm: 3,
    })

    expect(edited).toMatchObject({
      blank: {
        lengthMm: 300,
        thicknessMm: 3,
        widthMm: 150,
      },
      operation: {
        bendCount: 5,
        cuttingLengthMm: 1800,
      },
    })
    expect(laserBentBracketFixture.blank).toEqual({
      lengthMm: 250,
      thicknessMm: 2,
      widthMm: 120,
    })
    expect(laserBentBracketFixture.operation.bendCount).toBe(3)
  })

  it("calculates edited sheet-metal quotes through the shared registry", () => {
    const result = calculateEditedSheetMetalQuote({
      bendCount: 5,
      blankLengthMm: 300,
      blankWidthMm: 150,
      cuttingLengthMm: 1800,
      materialThicknessMm: 3,
    })

    expect(result.editState).toMatchObject({
      bendCount: 5,
      blankLengthMm: 300,
      blankWidthMm: 150,
      cuttingLengthMm: 1800,
      materialThicknessMm: 3,
    })
    expect(result.quote).toMatchObject({
      calculatorVersion: "sheet-metal.v1",
      currency: "EUR",
      leadTimeDays: 7,
      process: "sheet_metal",
      totalCents: 67901,
      unitPriceCents: 1697,
      unitRemainderCents: 21,
      warnings: [],
    })
    expect(result.quote.breakdown.find((line) => line.key === "material")?.amountCents).toBe(6797)
    expect(result.quote.breakdown.find((line) => line.key === "laser_cutting")?.amountCents).toBe(6033)
    expect(result.quote.breakdown.find((line) => line.key === "bending")?.amountCents).toBe(16800)
  })

  it("rejects invalid planned field edits before calculation", () => {
    expect(() => applySheetMetalInputEdits({ blankLengthMm: Number.NaN })).toThrow("blankLengthMm must be a positive finite number")
    expect(() => applySheetMetalInputEdits({ materialThicknessMm: 0 })).toThrow(
      "materialThicknessMm must be a positive finite number",
    )
    expect(() => applySheetMetalInputEdits({ bendCount: 1.5 })).toThrow("bendCount must be a non-negative integer")
  })
})
