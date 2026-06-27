import { describe, expect, it } from "vitest"

import { weldedFrameFixture } from "./fabrication.fixtures"
import {
  FABRICATION_INPUT_EDITS_VERSION,
  applyFabricationInputEdits,
  buildFabricationInputEditState,
  calculateEditedFabricationQuote,
} from "./fabricationInputEdits"

describe("fabrication input edits", () => {
  it("builds editable state from the fabrication fixture planned fields", () => {
    expect(buildFabricationInputEditState()).toEqual({
      assemblyMinutesPerPart: 18,
      complexityMultiplier: 1.1,
      editVersion: FABRICATION_INPUT_EDITS_VERSION,
      fabricationMinutesPerPart: 45,
      finishRequirement: "Hot-dip galvanized",
      inspectionMinutesPerPart: 6,
      process: "fabrication",
      weldingMinutesPerPart: 35,
    })
  })

  it("applies planned field edits without mutating the source input", () => {
    const edited = applyFabricationInputEdits({
      assemblyMinutesPerPart: 20,
      complexityMultiplier: 1.45,
      fabricationMinutesPerPart: 52,
      finishRequirement: " Powder coated ",
      inspectionMinutesPerPart: 8,
      weldingMinutesPerPart: 42,
    })

    expect(edited).toMatchObject({
      finish: "Powder coated",
      operation: {
        assemblyMinutesPerPart: 20,
        complexityMultiplier: 1.45,
        fabricationMinutesPerPart: 52,
        inspectionMinutesPerPart: 8,
        weldingMinutesPerPart: 42,
      },
    })
    expect(weldedFrameFixture.finish).toBe("Hot-dip galvanized")
    expect(weldedFrameFixture.operation).toMatchObject({
      assemblyMinutesPerPart: 18,
      complexityMultiplier: 1.1,
      fabricationMinutesPerPart: 45,
      inspectionMinutesPerPart: 6,
      weldingMinutesPerPart: 35,
    })
  })

  it("calculates edited fabrication quotes through the shared registry", () => {
    const result = calculateEditedFabricationQuote({
      assemblyMinutesPerPart: 20,
      complexityMultiplier: 1.45,
      fabricationMinutesPerPart: 52,
      finishRequirement: " Powder coated ",
      inspectionMinutesPerPart: 8,
      weldingMinutesPerPart: 42,
    })

    expect(result.editState).toEqual({
      assemblyMinutesPerPart: 20,
      complexityMultiplier: 1.45,
      editVersion: FABRICATION_INPUT_EDITS_VERSION,
      fabricationMinutesPerPart: 52,
      finishRequirement: "Powder coated",
      inspectionMinutesPerPart: 8,
      process: "fabrication",
      weldingMinutesPerPart: 42,
    })
    expect(result.quote).toMatchObject({
      calculatorVersion: "fabrication.v1",
      currency: "EUR",
      leadTimeDays: 14,
      process: "fabrication",
      totalCents: 178989,
      unitPriceCents: 35797,
      unitRemainderCents: 4,
      warnings: ["High fabrication complexity multiplier; review fit-up and fixture assumptions."],
    })
    expect(result.quote.breakdown.find((line) => line.key === "fabrication")?.amountCents).toBe(45240)
    expect(result.quote.breakdown.find((line) => line.key === "welding")?.amountCents).toBe(28700)
    expect(result.quote.assumptions.find((assumption) => assumption.key === "finish")?.value).toBe("Powder coated")
  })

  it("clears optional finish requirement when the edit is blank", () => {
    const edited = applyFabricationInputEdits({ finishRequirement: "   " })

    expect(edited.finish).toBeUndefined()
  })

  it("rejects invalid fabrication planned field edits before calculation", () => {
    expect(() => applyFabricationInputEdits({ fabricationMinutesPerPart: Number.NaN })).toThrow(
      "fabricationMinutesPerPart must be a positive finite number",
    )
    expect(() => applyFabricationInputEdits({ fabricationMinutesPerPart: 0 })).toThrow(
      "fabricationMinutesPerPart must be a positive finite number",
    )
    expect(() => applyFabricationInputEdits({ weldingMinutesPerPart: -1 })).toThrow(
      "weldingMinutesPerPart must be a non-negative finite number",
    )
    expect(() => applyFabricationInputEdits({ complexityMultiplier: 0 })).toThrow(
      "complexityMultiplier must be a positive finite number",
    )
  })
})
