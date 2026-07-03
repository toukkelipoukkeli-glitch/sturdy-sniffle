import type { CadGeometryPreviewKind, CadGeometryPreviewResult } from "./cadGeometryPreview"

export const CAD_GEOMETRY_REVIEW_SUMMARY_VERSION = "cad-geometry-review-summary.v1"

export type CadGeometryReviewStatus = "ready" | "needs_review" | "blocked"
export type CadGeometryReviewCheckKey = "preview_status" | "bounds" | "outline" | "units" | "provider_warnings"

export interface CadGeometryReviewCheck {
  key: CadGeometryReviewCheckKey
  status: CadGeometryReviewStatus
  label: string
  message: string
  warnings: string[]
}

export interface CadGeometryReviewSummary {
  summaryVersion: typeof CAD_GEOMETRY_REVIEW_SUMMARY_VERSION
  fileName: string
  format: CadGeometryPreviewResult["format"]
  previewKind: CadGeometryPreviewResult["previewKind"]
  status: CadGeometryReviewStatus
  checkCounts: Partial<Record<CadGeometryReviewStatus, number>>
  warningCount: number
  warnings: string[]
  blockers: string[]
  nextAction: string
  checks: CadGeometryReviewCheck[]
}

export function buildCadGeometryReviewSummary(preview: CadGeometryPreviewResult): CadGeometryReviewSummary {
  const checks = [
    previewStatusCheck(preview),
    boundsCheck(preview),
    outlineCheck(preview),
    unitsCheck(preview),
    providerWarningsCheck(preview),
  ]
  const status = summarizeStatus(checks)
  const blockers = checks.filter((check) => check.status === "blocked").map((check) => check.message)
  const warnings = unique(checks.flatMap((check) => check.warnings))

  return {
    summaryVersion: CAD_GEOMETRY_REVIEW_SUMMARY_VERSION,
    fileName: preview.fileName,
    format: preview.format,
    previewKind: preview.previewKind,
    status,
    checkCounts: countStatuses(checks),
    warningCount: warnings.length,
    warnings,
    blockers,
    nextAction: nextActionFor(status),
    checks,
  }
}

function previewStatusCheck(preview: CadGeometryPreviewResult): CadGeometryReviewCheck {
  if (preview.status === "ready") {
    return {
      key: "preview_status",
      status: "ready",
      label: "Preview status",
      message: "Geometry preview descriptor is ready.",
      warnings: [],
    }
  }

  return {
    key: "preview_status",
    status: "needs_review",
    label: "Preview status",
    message: "Geometry preview descriptor is using a fallback path.",
    warnings: ["Geometry preview is fallback-only; review metadata before using it for geometry-dependent decisions."],
  }
}

function boundsCheck(preview: CadGeometryPreviewResult): CadGeometryReviewCheck {
  const bounds = preview.bounds
  if (!bounds) {
    return {
      key: "bounds",
      status: "blocked",
      label: "Bounds",
      message: "Geometry bounds are unavailable.",
      warnings: ["No geometry bounds were available from the preview descriptor."],
    }
  }

  const hasFlatBounds = positiveFinite(bounds.lengthMm) && positiveFinite(bounds.widthMm)

  switch (preview.previewKind) {
    case "step_bounding_box": {
      const hasDepth = positiveFinite(bounds.heightMm) || positiveFinite(bounds.thicknessMm)
      if (!hasFlatBounds || !hasDepth) {
        return incompleteBoundsCheck()
      }
      return readyBoundsCheck()
    }
    case "dxf_flat_pattern":
      if (!hasFlatBounds) {
        return incompleteBoundsCheck()
      }
      if (!positiveFinite(bounds.thicknessMm)) {
        return {
          key: "bounds",
          status: "needs_review",
          label: "Bounds",
          message: "Flat pattern length and width are available, but thickness is missing.",
          warnings: ["DXF flat pattern thickness should be confirmed from drawing or material metadata."],
        }
      }
      return readyBoundsCheck()
    case "metadata_card":
      if (!hasFlatBounds) {
        return incompleteBoundsCheck()
      }
      return readyBoundsCheck()
    default:
      return assertNeverPreviewKind(preview.previewKind)
  }
}

function outlineCheck(preview: CadGeometryPreviewResult): CadGeometryReviewCheck {
  switch (preview.previewKind) {
    case "step_bounding_box":
    case "dxf_flat_pattern":
      if (preview.outlineSegments.length < 4) {
        return {
          key: "outline",
          status: "blocked",
          label: "Outline",
          message: "Geometry outline is incomplete.",
          warnings: ["Geometry outline needs at least four deterministic segments for the preview surface."],
        }
      }
      return {
        key: "outline",
        status: "ready",
        label: "Outline",
        message: "Geometry outline is available.",
        warnings: [],
      }
    case "metadata_card":
      return {
        key: "outline",
        status: "blocked",
        label: "Outline",
        message: "Geometry outline is unavailable for metadata-only preview.",
        warnings: ["No geometry outline segments were available from the preview descriptor."],
      }
    default:
      return assertNeverPreviewKind(preview.previewKind)
    }
}

function incompleteBoundsCheck(): CadGeometryReviewCheck {
  return {
    key: "bounds",
    status: "blocked",
    label: "Bounds",
    message: "Geometry bounds are incomplete.",
    warnings: ["Geometry bounds must include positive length and width; STEP bounds also need height or thickness."],
  }
}

function readyBoundsCheck(): CadGeometryReviewCheck {
  return {
    key: "bounds",
    status: "ready",
    label: "Bounds",
    message: "Geometry bounds are available.",
    warnings: [],
  }
}

function unitsCheck(preview: CadGeometryPreviewResult): CadGeometryReviewCheck {
  if (preview.units === "mm") {
    return {
      key: "units",
      status: "ready",
      label: "Units",
      message: "Geometry units are millimeters.",
      warnings: [],
    }
  }

  return {
    key: "units",
    status: "needs_review",
    label: "Units",
    message: "Geometry units are unknown.",
    warnings: ["Geometry units are unknown; verify dimensions before quote calculations use this preview."],
  }
}

function providerWarningsCheck(preview: CadGeometryPreviewResult): CadGeometryReviewCheck {
  if (preview.warnings.length === 0) {
    return {
      key: "provider_warnings",
      status: "ready",
      label: "Provider warnings",
      message: "No geometry provider warnings.",
      warnings: [],
    }
  }

  return {
    key: "provider_warnings",
    status: "needs_review",
    label: "Provider warnings",
    message: `${preview.warnings.length} geometry provider warning${preview.warnings.length === 1 ? "" : "s"}.`,
    warnings: [...preview.warnings],
  }
}

function summarizeStatus(checks: CadGeometryReviewCheck[]): CadGeometryReviewStatus {
  if (checks.some((check) => check.status === "blocked")) {
    return "blocked"
  }
  if (checks.some((check) => check.status === "needs_review")) {
    return "needs_review"
  }
  return "ready"
}

function countStatuses(checks: CadGeometryReviewCheck[]): Partial<Record<CadGeometryReviewStatus, number>> {
  return checks.reduce<Partial<Record<CadGeometryReviewStatus, number>>>((counts, check) => {
    counts[check.status] = (counts[check.status] ?? 0) + 1
    return counts
  }, {})
}

function nextActionFor(status: CadGeometryReviewStatus) {
  if (status === "blocked") {
    return "Use the metadata card and request geometry parser review before geometry-dependent decisions."
  }
  if (status === "needs_review") {
    return "Review geometry warnings and confirm dimensions before relying on this preview."
  }
  return "Geometry descriptor is ready for operator preview."
}

function positiveFinite(value: number | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

function assertNeverPreviewKind(previewKind: never): never {
  const unexpectedPreviewKind: CadGeometryPreviewKind = previewKind
  throw new Error(`Unhandled CAD geometry preview kind: ${unexpectedPreviewKind}`)
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}
