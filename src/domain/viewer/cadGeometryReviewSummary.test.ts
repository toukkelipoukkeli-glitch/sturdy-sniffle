import { describe, expect, it } from "vitest"

import type { CadGeometryPreviewResult } from "./cadGeometryPreview"
import { buildCadGeometryReviewSummary } from "./cadGeometryReviewSummary"

const readyStepPreview: CadGeometryPreviewResult = {
  adapterVersion: "cad-geometry-preview.v1",
  provider: "metadata_geometry",
  status: "ready",
  fileName: "FB-204-A.step",
  format: "step",
  previewKind: "step_bounding_box",
  renderer: "step-metadata-bounds",
  units: "mm",
  bounds: {
    lengthMm: 120,
    widthMm: 80,
    heightMm: 6,
  },
  outlineSegments: [
    { key: "edge-bottom", from: { xMm: 0, yMm: 0 }, to: { xMm: 120, yMm: 0 } },
    { key: "edge-right", from: { xMm: 120, yMm: 0 }, to: { xMm: 120, yMm: 80 } },
    { key: "edge-top", from: { xMm: 120, yMm: 80 }, to: { xMm: 0, yMm: 80 } },
    { key: "edge-left", from: { xMm: 0, yMm: 80 }, to: { xMm: 0, yMm: 0 } },
  ],
  warnings: [],
}

describe("CAD geometry review summary", () => {
  it("marks complete STEP bounds and outline as ready", () => {
    expect(buildCadGeometryReviewSummary(readyStepPreview)).toEqual({
      summaryVersion: "cad-geometry-review-summary.v1",
      fileName: "FB-204-A.step",
      format: "step",
      previewKind: "step_bounding_box",
      status: "ready",
      checkCounts: { ready: 5 },
      warningCount: 0,
      warnings: [],
      blockers: [],
      nextAction: "Geometry descriptor is ready for operator preview.",
      checks: [
        {
          key: "preview_status",
          status: "ready",
          label: "Preview status",
          message: "Geometry preview descriptor is ready.",
          warnings: [],
        },
        {
          key: "bounds",
          status: "ready",
          label: "Bounds",
          message: "Geometry bounds are available.",
          warnings: [],
        },
        {
          key: "outline",
          status: "ready",
          label: "Outline",
          message: "Geometry outline is available.",
          warnings: [],
        },
        {
          key: "units",
          status: "ready",
          label: "Units",
          message: "Geometry units are millimeters.",
          warnings: [],
        },
        {
          key: "provider_warnings",
          status: "ready",
          label: "Provider warnings",
          message: "No geometry provider warnings.",
          warnings: [],
        },
      ],
    })
  })

  it("keeps DXF flat patterns review-only when thickness is missing", () => {
    const summary = buildCadGeometryReviewSummary({
      ...readyStepPreview,
      fileName: "flat.dxf",
      format: "dxf",
      previewKind: "dxf_flat_pattern",
      renderer: "dxf-metadata-outline",
      bounds: {
        lengthMm: 250,
        widthMm: 120,
      },
      warnings: ["Check bend relief manually."],
    })

    expect(summary).toMatchObject({
      status: "needs_review",
      checkCounts: { ready: 3, needs_review: 2 },
      warningCount: 2,
      warnings: [
        "DXF flat pattern thickness should be confirmed from drawing or material metadata.",
        "Check bend relief manually.",
      ],
      blockers: [],
      nextAction: "Review geometry warnings and confirm dimensions before relying on this preview.",
    })
    expect(summary.checks.find((check) => check.key === "bounds")).toMatchObject({
      status: "needs_review",
      message: "Flat pattern length and width are available, but thickness is missing.",
    })
  })

  it("blocks metadata-only geometry previews until bounds and outlines exist", () => {
    const summary = buildCadGeometryReviewSummary({
      adapterVersion: "cad-geometry-preview.v1",
      provider: "metadata_fallback",
      status: "fallback",
      fileName: "housing.step",
      format: "step",
      previewKind: "metadata_card",
      renderer: "metadata-card",
      units: "unknown",
      outlineSegments: [],
      warnings: ["CAD geometry parser unavailable; using metadata-only geometry preview."],
    })

    expect(summary).toMatchObject({
      status: "blocked",
      checkCounts: { blocked: 2, needs_review: 3 },
      warningCount: 5,
      blockers: ["Geometry bounds are unavailable.", "Geometry outline is unavailable for metadata-only preview."],
      nextAction: "Use the metadata card and request geometry parser review before geometry-dependent decisions.",
    })
    expect(summary.warnings).toEqual([
      "Geometry preview is fallback-only; review metadata before using it for geometry-dependent decisions.",
      "No geometry bounds were available from the preview descriptor.",
      "No geometry outline segments were available from the preview descriptor.",
      "Geometry units are unknown; verify dimensions before quote calculations use this preview.",
      "CAD geometry parser unavailable; using metadata-only geometry preview.",
    ])
  })
})
