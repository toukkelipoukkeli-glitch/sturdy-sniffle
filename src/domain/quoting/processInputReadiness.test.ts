import { describe, expect, it } from "vitest"

import { buildProcessInputReadiness, PROCESS_INPUT_READINESS_VERSION } from "./processInputReadiness"

describe("process input readiness", () => {
  it("describes blocked editable-input requirements for each non-CNC process", () => {
    expect(buildProcessInputReadiness("sheet_metal")).toEqual({
      editable: false,
      fieldPlans: [
        {
          group: "blank dimensions",
          key: "blankSizeMm",
          label: "Blank size",
          required: true,
          valueKind: "dimension",
        },
        {
          group: "material and thickness",
          key: "materialThicknessMm",
          label: "Material thickness",
          required: true,
          valueKind: "dimension",
        },
        {
          group: "cutting route",
          key: "cutLengthMm",
          label: "Cut length",
          required: true,
          valueKind: "dimension",
        },
        {
          group: "bend operations",
          key: "bendCount",
          label: "Bend count",
          required: true,
          valueKind: "quantity",
        },
      ],
      nextStep: "Add process-specific editable input controls before this preview can become an RFQ quote path.",
      process: "sheet_metal",
      readinessVersion: PROCESS_INPUT_READINESS_VERSION,
      requiredGroups: ["blank dimensions", "material and thickness", "cutting route", "bend operations"],
      status: "blocked",
    })
    expect(buildProcessInputReadiness("wire_edm").requiredGroups).toContain("wire settings")
    expect(buildProcessInputReadiness("fabrication").requiredGroups).toContain("weld length")
    expect(buildProcessInputReadiness("plastic").requiredGroups).toContain("machining operations")
  })

  it("returns defensive copies of readiness arrays", () => {
    const readiness = buildProcessInputReadiness("wire_edm")
    readiness.requiredGroups.push("mutated group")
    readiness.fieldPlans[0] = {
      group: "mutated",
      key: "mutated",
      label: "Mutated",
      required: false,
      valueKind: "text",
    }

    expect(buildProcessInputReadiness("wire_edm").requiredGroups).not.toContain("mutated group")
    expect(buildProcessInputReadiness("wire_edm").fieldPlans[0]).toEqual({
      group: "stock dimensions",
      key: "stockSizeMm",
      label: "Stock size",
      required: true,
      valueKind: "dimension",
    })
  })
})
