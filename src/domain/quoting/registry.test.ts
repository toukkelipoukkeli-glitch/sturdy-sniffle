import { describe, expect, it } from "vitest"

import { aluminumBracketFixture, rushTurnedSpacerFixture } from "./cnc.fixtures"
import { weldedFrameFixture } from "./fabrication.fixtures"
import { pomGuideFixture } from "./plastics.fixtures"
import { calculateQuote, isQuoteProcessKey, quoteProcessKeys } from "./registry"
import { laserBentBracketFixture } from "./sheetMetal.fixtures"
import { toolSteelKeywayFixture } from "./wireEdm.fixtures"

describe("quote engine registry", () => {
  it("routes CNC milling and turning inputs through the CNC calculator", () => {
    const millingQuote = calculateQuote({
      process: "cnc_milling",
      input: aluminumBracketFixture,
    })
    const turningQuote = calculateQuote({
      process: "cnc_turning",
      input: rushTurnedSpacerFixture,
    })

    expect(millingQuote).toMatchObject({
      process: "cnc_milling",
      calculatorVersion: "cnc.v1",
      totalCents: 115418,
    })
    expect(turningQuote).toMatchObject({
      process: "cnc_turning",
      calculatorVersion: "cnc.v1",
      totalCents: 50000,
    })
  })

  it("routes non-CNC process keys through their deterministic calculators", () => {
    const sheetMetalQuote = calculateQuote({
      process: "sheet_metal",
      input: laserBentBracketFixture,
    })
    const plasticsQuote = calculateQuote({
      process: "plastic",
      input: pomGuideFixture,
    })
    const wireEdmQuote = calculateQuote({
      process: "wire_edm",
      input: toolSteelKeywayFixture,
    })
    const fabricationQuote = calculateQuote({
      process: "fabrication",
      input: weldedFrameFixture,
    })

    expect(sheetMetalQuote).toMatchObject({
      process: "sheet_metal",
      calculatorVersion: "sheet-metal.v1",
      totalCents: 54905,
    })
    expect(plasticsQuote).toMatchObject({
      process: "plastic",
      calculatorVersion: "plastics.v1",
      totalCents: 97096,
    })
    expect(wireEdmQuote).toMatchObject({
      process: "wire_edm",
      calculatorVersion: "wire-edm.v1",
      totalCents: 580974,
    })
    expect(fabricationQuote).toMatchObject({
      process: "fabrication",
      calculatorVersion: "fabrication.v1",
      totalCents: 150710,
    })
  })

  it("exposes stable supported process keys", () => {
    expect(quoteProcessKeys).toEqual([
      "cnc_milling",
      "cnc_turning",
      "sheet_metal",
      "plastic",
      "wire_edm",
      "fabrication",
    ])
    expect(isQuoteProcessKey("wire_edm")).toBe(true)
    expect(isQuoteProcessKey("laser")).toBe(false)
  })

  it("rejects mismatched CNC input process keys", () => {
    expect(() =>
      calculateQuote({
        process: "cnc_turning",
        input: aluminumBracketFixture,
      }),
    ).toThrow("CNC input process must match quote engine process")
  })
})
