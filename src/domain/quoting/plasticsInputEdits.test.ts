import { describe, expect, it } from "vitest"

import { pomGuideFixture } from "./plastics.fixtures"
import {
  PLASTICS_INPUT_EDITS_VERSION,
  applyPlasticsInputEdits,
  buildPlasticsInputEditState,
  calculateEditedPlasticsQuote,
} from "./plasticsInputEdits"

describe("plastics input edits", () => {
  it("builds editable state from the plastics fixture planned fields", () => {
    expect(buildPlasticsInputEditState()).toEqual({
      editVersion: PLASTICS_INPUT_EDITS_VERSION,
      materialFamily: "POM-C natural",
      operationCount: 5,
      process: "plastic",
      stockHeightMm: 12,
      stockLengthMm: 80,
      stockWidthMm: 40,
      surfaceFinish: "Deburred and annealed",
    })
  })

  it("applies planned field edits without mutating the source input", () => {
    const edited = applyPlasticsInputEdits({
      materialFamily: " POM-C black ",
      stockHeightMm: 14,
      stockLengthMm: 90,
      stockWidthMm: 45,
      surfaceFinish: " Fine deburr ",
    })

    expect(edited).toMatchObject({
      finish: "Fine deburr",
      material: {
        name: "POM-C black",
      },
      stockDimensions: {
        heightMm: 14,
        lengthMm: 90,
        widthMm: 45,
      },
    })
    expect(pomGuideFixture.material.name).toBe("POM-C natural")
    expect(pomGuideFixture.stockDimensions).toEqual({
      heightMm: 12,
      lengthMm: 80,
      widthMm: 40,
    })
  })

  it("calculates edited plastics quotes through the shared registry", () => {
    const result = calculateEditedPlasticsQuote({
      materialFamily: " POM-C black ",
      stockHeightMm: 14,
      stockLengthMm: 90,
      stockWidthMm: 45,
      surfaceFinish: " Fine deburr ",
    })

    expect(result.editState).toEqual({
      editVersion: PLASTICS_INPUT_EDITS_VERSION,
      materialFamily: "POM-C black",
      operationCount: 5,
      process: "plastic",
      stockHeightMm: 14,
      stockLengthMm: 90,
      stockWidthMm: 45,
      surfaceFinish: "Fine deburr",
    })
    expect(result.quote).toMatchObject({
      calculatorVersion: "plastics.v1",
      currency: "EUR",
      leadTimeDays: 10,
      process: "plastic",
      totalCents: 98168,
      unitPriceCents: 3272,
      unitRemainderCents: 8,
      warnings: [],
    })
    expect(result.quote.breakdown.find((line) => line.key === "material")?.amountCents).toBe(2593)
    expect(result.quote.breakdown.find((line) => line.key === "processing")?.amountCents).toBe(47500)
  })

  it("rejects invalid plastics planned field edits before calculation", () => {
    expect(() => applyPlasticsInputEdits({ stockLengthMm: Number.POSITIVE_INFINITY })).toThrow(
      "stockLengthMm must be a positive finite number",
    )
    expect(() => applyPlasticsInputEdits({ stockHeightMm: 0 })).toThrow("stockHeightMm must be a positive finite number")
    expect(() => applyPlasticsInputEdits({ materialFamily: "   " })).toThrow("materialFamily must be a non-empty string")
  })

  it("keeps operation count read-only until plastics operation editing is supported", () => {
    // @ts-expect-error operationCount is derived state until operation-level edits are supported.
    expect(() => applyPlasticsInputEdits({ operationCount: 7 })).toThrow(
      "operationCount is read-only until plastics operation editing is supported",
    )
    expect(buildPlasticsInputEditState().operationCount).toBe(5)
  })
})
