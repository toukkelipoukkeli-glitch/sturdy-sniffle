import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import {
  MANUAL_MATERIAL_PRESETS,
  buildManualCncQuoteInput,
  manualMaterialPreset,
  type ManualRfqQuoteInput,
} from "./manualRfq"

const baseInput: ManualRfqQuoteInput = {
  partNumber: "MANUAL-001",
  process: "cnc_milling",
  materialKey: "aluminum_6082",
  quantity: 10,
  priority: "normal",
  setupMinutes: 30,
  cycleMinutesPerPart: 12,
}

describe("manual RFQ quote input", () => {
  it("builds a valid, quotable CNC input from minimal operator fields", () => {
    const input = buildManualCncQuoteInput(baseInput)
    expect(input.partNumber).toBe("MANUAL-001")
    expect(input.process).toBe("cnc_milling")
    expect(input.material.name).toBe("Aluminum 6082")
    expect(input.rateCard.currency).toBe("EUR")
    expect(input.stockDimensions.lengthMm).toBeGreaterThan(0)
    // The produced input must be accepted by the deterministic calculator.
    const quote = calculateCncQuote(input)
    expect(quote.totalCents).toBeGreaterThan(0)
    expect(quote.quantity).toBe(10)
  })

  it("uses turning geometry and machine defaults for cnc_turning", () => {
    const input = buildManualCncQuoteInput({ ...baseInput, process: "cnc_turning", materialKey: "stainless_316l" })
    expect(input.process).toBe("cnc_turning")
    expect(input.machine.name).toContain("lathe")
    expect(input.stockDimensions.diameterMm).toBeGreaterThan(0)
    expect(calculateCncQuote(input).totalCents).toBeGreaterThan(0)
  })

  it("clamps invalid quantity, setup, and cycle to safe minimums", () => {
    const input = buildManualCncQuoteInput({ ...baseInput, quantity: 0, setupMinutes: -5, cycleMinutesPerPart: 0 })
    expect(input.quantity).toBe(1)
    expect(input.operation.setupMinutes).toBe(0)
    expect(input.operation.cycleMinutesPerPart).toBeGreaterThan(0)

    const nonFiniteInput = buildManualCncQuoteInput({
      ...baseInput,
      cycleMinutesPerPart: Number.POSITIVE_INFINITY,
      quantity: Number.NaN,
      setupMinutes: Number.NEGATIVE_INFINITY,
    })
    expect(nonFiniteInput.quantity).toBe(1)
    expect(nonFiniteInput.operation.setupMinutes).toBe(0)
    expect(nonFiniteInput.operation.cycleMinutesPerPart).toBe(0.1)
  })

  it("omits blank optional tolerance/finish and trims part number", () => {
    const input = buildManualCncQuoteInput({ ...baseInput, partNumber: "  P-7  ", toleranceClass: "  ", finish: "" })
    expect(input.partNumber).toBe("P-7")
    expect(input.toleranceClass).toBeUndefined()
    expect(input.finish).toBeUndefined()
  })

  it("exposes consistent, resolvable material presets", () => {
    for (const preset of MANUAL_MATERIAL_PRESETS) {
      expect(manualMaterialPreset(preset.key)).toEqual(preset)
      expect(preset.densityKgM3).toBeGreaterThan(0)
      expect(preset.costCentsPerKg).toBeGreaterThan(0)
    }
    expect(() => manualMaterialPreset("nope" as never)).toThrow()
  })
})
