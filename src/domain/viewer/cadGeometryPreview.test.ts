import { describe, expect, it } from "vitest"

import {
  createCadGeometryPreviewAdapter,
  createMetadataCadGeometryPreviewProvider,
  createMockCadGeometryPreviewProvider,
} from "./cadGeometryPreview"

describe("CAD geometry preview adapter", () => {
  it("builds a deterministic STEP bounding-box descriptor from matching metadata", () => {
    const result = createMetadataCadGeometryPreviewProvider().build({
      fileName: "FB-204-A.step",
      cadMetadata: {
        adapterVersion: "cad-metadata.v1",
        dimensions: {
          lengthMm: 120,
          widthMm: 80,
          heightMm: 6,
        },
        fileName: "fb_204_a.STEP",
        format: "step",
        metadataOnly: false,
        previewKind: "cad",
        provider: "heuristic",
        status: "succeeded",
        units: "mm",
        warnings: [],
      },
    })

    expect(result).toEqual({
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
        {
          key: "edge-bottom",
          from: { xMm: 0, yMm: 0 },
          to: { xMm: 120, yMm: 0 },
        },
        {
          key: "edge-right",
          from: { xMm: 120, yMm: 0 },
          to: { xMm: 120, yMm: 80 },
        },
        {
          key: "edge-top",
          from: { xMm: 120, yMm: 80 },
          to: { xMm: 0, yMm: 80 },
        },
        {
          key: "edge-left",
          from: { xMm: 0, yMm: 80 },
          to: { xMm: 0, yMm: 0 },
        },
      ],
      warnings: [],
    })
  })

  it("builds a flat DXF outline descriptor while preserving adapter warnings", () => {
    const result = createMetadataCadGeometryPreviewProvider().build({
      fileName: "flat-pattern.dxf",
      cadMetadata: {
        adapterVersion: "cad-metadata.v1",
        dimensions: {
          lengthMm: 250,
          widthMm: 120,
          thicknessMm: 2,
        },
        fileName: "flat-pattern.dxf",
        format: "dxf",
        metadataOnly: false,
        previewKind: "drawing",
        provider: "heuristic",
        status: "succeeded",
        units: "mm",
        warnings: ["Check bend relief manually."],
      },
    })

    expect(result).toMatchObject({
      status: "ready",
      fileName: "flat-pattern.dxf",
      format: "dxf",
      previewKind: "dxf_flat_pattern",
      renderer: "dxf-metadata-outline",
      units: "mm",
      bounds: {
        lengthMm: 250,
        widthMm: 120,
        thicknessMm: 2,
      },
      layerCount: 1,
      warnings: ["Check bend relief manually."],
    })
    expect(result.outlineSegments).toHaveLength(4)
  })

  it("keeps parser failures nonfatal through the fallback provider", () => {
    const adapter = createCadGeometryPreviewAdapter({
      provider: createMockCadGeometryPreviewProvider({ shouldFail: true }),
    })

    const result = adapter.build({
      fileName: "housing.step",
      cadMetadata: {
        adapterVersion: "cad-metadata.v1",
        dimensions: {
          lengthMm: 120,
          widthMm: 80,
          heightMm: 6,
        },
        fileName: "housing.step",
        format: "step",
        metadataOnly: false,
        previewKind: "cad",
        provider: "heuristic",
        status: "succeeded",
        units: "mm",
        warnings: [],
      },
    })

    expect(result).toMatchObject({
      provider: "metadata_fallback",
      status: "fallback",
      fileName: "housing.step",
      format: "step",
      previewKind: "metadata_card",
      renderer: "metadata-card",
      units: "mm",
      outlineSegments: [],
      warnings: [
        "CAD geometry provider mock failed: Mock CAD geometry preview provider failure.",
        "CAD geometry parser unavailable; using metadata-only geometry preview.",
      ],
    })
  })

  it("keeps adapter fallback deterministic when validation also fails", () => {
    const result = createCadGeometryPreviewAdapter({
      provider: createMockCadGeometryPreviewProvider({ shouldFail: true }),
    }).build({
      fileName: " ",
    })

    expect(result).toMatchObject({
      adapterVersion: "cad-geometry-preview.v1",
      provider: "metadata_fallback",
      status: "fallback",
      fileName: "unknown",
      format: "unknown",
      previewKind: "metadata_card",
      renderer: "metadata-card",
      units: "unknown",
      outlineSegments: [],
      warnings: [
        "CAD geometry provider mock failed: Mock CAD geometry preview provider failure.",
        "CAD geometry fallback provider metadata_fallback failed: fileName is required.",
        "No CAD geometry fallback file name was available; using unknown preview target.",
      ],
    })
  })

  it("keeps adapter fallback deterministic when a custom fallback provider fails", () => {
    const result = createCadGeometryPreviewAdapter({
      provider: createMockCadGeometryPreviewProvider({ shouldFail: true }),
      fallbackProvider: createMockCadGeometryPreviewProvider({ shouldFail: true }),
    }).build({
      fileName: "housing.step",
    })

    expect(result).toMatchObject({
      adapterVersion: "cad-geometry-preview.v1",
      provider: "metadata_fallback",
      status: "fallback",
      fileName: "housing.step",
      format: "step",
      previewKind: "metadata_card",
      renderer: "metadata-card",
      units: "unknown",
      outlineSegments: [],
      warnings: [
        "CAD geometry provider mock failed: Mock CAD geometry preview provider failure.",
        "CAD geometry fallback provider mock failed: Mock CAD geometry preview provider failure.",
      ],
    })
  })

  it("does not use mismatched or incomplete metadata as ready geometry", () => {
    expect(
      createMetadataCadGeometryPreviewProvider().build({
        fileName: "ab-c.step",
        cadMetadata: {
          adapterVersion: "cad-metadata.v1",
          dimensions: {
            lengthMm: 999,
            widthMm: 100,
            heightMm: 20,
          },
          fileName: "a-bc.step",
          format: "step",
          metadataOnly: false,
          previewKind: "cad",
          provider: "heuristic",
          status: "succeeded",
          units: "mm",
          warnings: [],
        },
      }),
    ).toMatchObject({
      status: "fallback",
      format: "step",
      renderer: "metadata-card",
      warnings: ["CAD metadata does not match the requested attachment; using metadata-only geometry preview."],
    })

    expect(
      createMetadataCadGeometryPreviewProvider().build({
        fileName: "housing.step",
        cadMetadata: {
          adapterVersion: "cad-metadata.v1",
          dimensions: {
            lengthMm: 120,
            widthMm: 80,
          },
          fileName: "housing.step",
          format: "step",
          metadataOnly: false,
          previewKind: "cad",
          provider: "heuristic",
          status: "succeeded",
          units: "mm",
          warnings: ["No CAD dimensions were extracted."],
        },
      }),
    ).toMatchObject({
      status: "fallback",
      format: "step",
      renderer: "metadata-card",
      warnings: [
        "STEP geometry preview requires length, width, and height or thickness dimensions.",
        "No CAD dimensions were extracted.",
      ],
    })
  })

  it("rejects blank attachment file names", () => {
    expect(() =>
      createMetadataCadGeometryPreviewProvider().build({
        fileName: " ",
      }),
    ).toThrow("fileName is required")
  })
})
