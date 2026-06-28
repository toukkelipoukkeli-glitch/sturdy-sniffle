import type { ProcessInputDraft } from "./processInputDraft"
import type { ProcessInputReadiness } from "./processInputReadiness"

export const PROCESS_INPUT_PROMOTION_GATE_VERSION = "process-input-promotion-gate.v1"

export type ProcessInputPromotionBlocker = "editable_controls_missing" | "missing_required_values"

export interface ProcessInputPromotionGate {
  gateVersion: typeof PROCESS_INPUT_PROMOTION_GATE_VERSION
  status: "blocked" | "ready"
  blockers: ProcessInputPromotionBlocker[]
  blockerLabels: string[]
  missingRequiredCount: number
  nextStep: string
}

export function evaluateProcessInputPromotionGate(
  readiness: ProcessInputReadiness,
  draft: ProcessInputDraft,
): ProcessInputPromotionGate {
  const missingRequiredCount = Math.max(0, draft.requiredCount - draft.populatedRequiredCount)
  const blockers: ProcessInputPromotionBlocker[] = readiness.editable ? [] : ["editable_controls_missing"]
  if (missingRequiredCount > 0) {
    blockers.push("missing_required_values")
  }

  return {
    blockerLabels: blockers.map(formatBlockerLabel),
    blockers,
    gateVersion: PROCESS_INPUT_PROMOTION_GATE_VERSION,
    missingRequiredCount,
    nextStep:
      missingRequiredCount > 0
        ? blockers.includes("editable_controls_missing")
          ? "Populate every required process draft value, then add editable controls before promotion."
          : "Populate every required process draft value before promotion."
        : blockers.length > 0
          ? readiness.nextStep
          : "Process input draft is ready for quote promotion.",
    status: blockers.length > 0 ? "blocked" : "ready",
  }
}

function formatBlockerLabel(blocker: ProcessInputPromotionBlocker): string {
  switch (blocker) {
    case "editable_controls_missing":
      return "Editable controls missing"
    case "missing_required_values":
      return "Missing required values"
  }
}
