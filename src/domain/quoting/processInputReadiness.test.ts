import { describe, expect, it } from "vitest"

import { buildProcessInputReadiness, PROCESS_INPUT_READINESS_VERSION } from "./processInputReadiness"

describe("process input readiness", () => {
  it("describes blocked editable-input requirements for each non-CNC process", () => {
    expect(buildProcessInputReadiness("sheet_metal")).toEqual({
      editable: false,
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
})
