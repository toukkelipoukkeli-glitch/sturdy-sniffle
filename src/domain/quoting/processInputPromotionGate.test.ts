import { describe, expect, it } from "vitest"

import { buildProcessInputDraft } from "./processInputDraft"
import { evaluateProcessInputPromotionGate, PROCESS_INPUT_PROMOTION_GATE_VERSION } from "./processInputPromotionGate"
import { buildProcessInputReadiness, type ProcessInputReadiness } from "./processInputReadiness"

describe("process input promotion gate", () => {
  it("blocks complete fixture drafts until editable controls exist", () => {
    expect(evaluateProcessInputPromotionGate(buildProcessInputReadiness("sheet_metal"), buildProcessInputDraft("sheet_metal"))).toEqual({
      blockerLabels: ["Editable controls missing"],
      blockers: ["editable_controls_missing"],
      gateVersion: PROCESS_INPUT_PROMOTION_GATE_VERSION,
      missingRequiredCount: 0,
      nextStep: "Add process-specific editable input controls before this preview can become an RFQ quote path.",
      status: "blocked",
    })
  })

  it("adds a missing-value blocker for incomplete fixture drafts", () => {
    expect(evaluateProcessInputPromotionGate(buildProcessInputReadiness("wire_edm"), buildProcessInputDraft("wire_edm"))).toEqual({
      blockerLabels: ["Editable controls missing", "Missing required values"],
      blockers: ["editable_controls_missing", "missing_required_values"],
      gateVersion: PROCESS_INPUT_PROMOTION_GATE_VERSION,
      missingRequiredCount: 1,
      nextStep: "Populate every required process draft value, then add editable controls before promotion.",
      status: "blocked",
    })
  })

  it("clamps inconsistent over-populated draft counts to zero missing values", () => {
    const draft = {
      ...buildProcessInputDraft("sheet_metal"),
      populatedRequiredCount: 6,
      requiredCount: 4,
    }

    expect(evaluateProcessInputPromotionGate(buildProcessInputReadiness("sheet_metal"), draft)).toMatchObject({
      blockerLabels: ["Editable controls missing"],
      blockers: ["editable_controls_missing"],
      missingRequiredCount: 0,
    })
  })

  it("marks editable complete drafts ready for promotion", () => {
    const readiness = {
      ...buildProcessInputReadiness("sheet_metal"),
      editable: true,
      nextStep: "Persist the quote snapshot.",
      status: "ready",
    } satisfies ProcessInputReadiness

    expect(evaluateProcessInputPromotionGate(readiness, buildProcessInputDraft("sheet_metal"))).toEqual({
      blockerLabels: [],
      blockers: [],
      gateVersion: PROCESS_INPUT_PROMOTION_GATE_VERSION,
      missingRequiredCount: 0,
      nextStep: "Process input draft is ready for quote promotion.",
      status: "ready",
    })
  })
})
