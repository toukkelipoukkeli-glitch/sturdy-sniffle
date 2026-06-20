import { describe, expect, it } from "vitest"

import { aluminumBracketFixture } from "./cnc.fixtures"
import { calculateQuote } from "./registry"
import { applyRateCardPreset, getRateCardPreset, listRateCardPresets, rateCardForPreset } from "./rateCards"
import { laserBentBracketFixture } from "./sheetMetal.fixtures"

describe("rate card presets", () => {
  it("lists presets by supported quote process", () => {
    expect(listRateCardPresets().map((preset) => preset.key)).toEqual([
      "factory_standard_eur",
      "prototype_cell_eur",
      "fabrication_shop_eur",
    ])
    expect(listRateCardPresets("cnc_milling").map((preset) => preset.key)).toEqual([
      "factory_standard_eur",
      "prototype_cell_eur",
    ])
    expect(listRateCardPresets("fabrication").map((preset) => preset.key)).toEqual([
      "factory_standard_eur",
      "fabrication_shop_eur",
    ])
  })

  it("returns defensive copies of preset metadata and rate cards", () => {
    const preset = getRateCardPreset("prototype_cell_eur")
    const rateCard = rateCardForPreset("prototype_cell_eur")

    preset.processes = []
    rateCard.minimumOrderCents = 1

    expect(getRateCardPreset("prototype_cell_eur").processes).toEqual(["cnc_milling", "cnc_turning", "plastic", "wire_edm"])
    expect(rateCardForPreset("prototype_cell_eur").minimumOrderCents).toBe(35000)
  })

  it("applies presets to quote inputs without mutating the source fixture", () => {
    const input = applyRateCardPreset(aluminumBracketFixture, "prototype_cell_eur")
    const quote = calculateQuote({ process: "cnc_milling", input })

    expect(input.rateCard).toEqual({
      baseLeadTimeDays: 10,
      currency: "EUR",
      marginPercent: 35,
      minimumOrderCents: 35000,
      rushLeadTimeDays: 5,
      rushMultiplier: 1.5,
      setupMinimumCents: 18000,
    })
    expect(input.rateCard).not.toBe(aluminumBracketFixture.rateCard)
    expect(aluminumBracketFixture.rateCard.minimumOrderCents).toBe(15000)
    expect(quote.currency).toBe("EUR")
    expect(quote.leadTimeDays).toBeGreaterThanOrEqual(10)
  })

  it("supports shared presets for non-CNC calculators", () => {
    const input = applyRateCardPreset(laserBentBracketFixture, "fabrication_shop_eur")
    const quote = calculateQuote({ process: "sheet_metal", input })

    expect(input.rateCard.minimumOrderCents).toBe(50000)
    expect(quote.process).toBe("sheet_metal")
    expect(quote.currency).toBe("EUR")
  })

  it("rejects unknown preset keys", () => {
    expect(() => getRateCardPreset("missing" as never)).toThrow("Unknown rate card preset missing")
  })
})
