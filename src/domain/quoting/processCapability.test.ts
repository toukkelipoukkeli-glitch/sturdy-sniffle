import { describe, expect, it } from "vitest"

import { buildProcessCapabilityMatrix } from "./processCapability"

describe("process capability matrix", () => {
  it("summarizes every deterministic quote process in registry order", () => {
    const matrix = buildProcessCapabilityMatrix()

    expect(matrix).toMatchObject({
      matrixVersion: "process-capability-matrix.v1",
      readyProcessCount: 5,
      supportedProcessCount: 6,
      totalRateCardPresetLinks: 12,
    })
    expect(matrix.capabilities.map((capability) => capability.process)).toEqual([
      "cnc_milling",
      "cnc_turning",
      "sheet_metal",
      "plastic",
      "wire_edm",
      "fabrication",
    ])
  })

  it("records calculator versions, sample economics, and rate-card coverage", () => {
    const matrix = buildProcessCapabilityMatrix()

    expect(matrix.capabilities).toEqual([
      expect.objectContaining({
        calculatorVersion: "cnc.v1",
        label: "CNC milling",
        process: "cnc_milling",
        rateCardPresetKeys: ["factory_standard_eur", "prototype_cell_eur"],
        sampleCurrency: "EUR",
        samplePartNumber: "FB-CNC-204-A",
        status: "ready",
      }),
      expect.objectContaining({
        calculatorVersion: "cnc.v1",
        label: "CNC turning",
        process: "cnc_turning",
        rateCardPresetKeys: ["factory_standard_eur", "prototype_cell_eur"],
        samplePartNumber: "FB-TURN-019",
        status: "needs_review",
      }),
      expect.objectContaining({
        calculatorVersion: "sheet-metal.v1",
        label: "Sheet metal",
        process: "sheet_metal",
        rateCardPresetKeys: ["factory_standard_eur", "fabrication_shop_eur"],
        samplePartNumber: "SM-120-BRACKET",
        status: "ready",
      }),
      expect.objectContaining({
        calculatorVersion: "plastics.v1",
        label: "Plastic machining",
        process: "plastic",
        rateCardPresetKeys: ["factory_standard_eur", "prototype_cell_eur"],
        samplePartNumber: "POM-GUIDE-042",
        status: "ready",
      }),
      expect.objectContaining({
        calculatorVersion: "wire-edm.v1",
        label: "Wire EDM",
        process: "wire_edm",
        rateCardPresetKeys: ["factory_standard_eur", "prototype_cell_eur"],
        samplePartNumber: "EDM-KEY-077",
        status: "ready",
      }),
      expect.objectContaining({
        calculatorVersion: "fabrication.v1",
        label: "Fabrication",
        process: "fabrication",
        rateCardPresetKeys: ["factory_standard_eur", "fabrication_shop_eur"],
        samplePartNumber: "FAB-FRAME-508",
        status: "ready",
      }),
    ])
    expect(matrix.capabilities.every((capability) => capability.sampleLeadTimeDays > 0)).toBe(true)
    expect(matrix.capabilities.every((capability) => capability.sampleTotalCents > 0)).toBe(true)
  })

  it("returns defensive warning arrays", () => {
    const matrix = buildProcessCapabilityMatrix()
    const turning = matrix.capabilities.find((capability) => capability.process === "cnc_turning")
    expect(turning?.warnings).toContain("Minimum order adjustment applied.")

    turning?.warnings.push("mutated")

    expect(buildProcessCapabilityMatrix().capabilities.find((capability) => capability.process === "cnc_turning")?.warnings).not.toContain(
      "mutated",
    )
  })
})
