import { describe, expect, it } from "vitest"

import { parseRfqIntake } from "../rfq/intake"
import { cncBracketEmail } from "../rfq/intake.fixtures"
import { buildPartPreviewModel, buildPartPreviewModelsFromRfq } from "./partPreview"

describe("part preview model", () => {
  it("selects CAD as the primary preview and builds measurement overlays", () => {
    const parsed = parseRfqIntake(cncBracketEmail)
    const model = buildPartPreviewModelsFromRfq(parsed)[0]

    expect(model).toMatchObject({
      modelVersion: "part-preview.v1",
      partNumber: "FB-204-A",
      title: "FB-204-A",
      primaryMode: "cad",
      primaryAttachmentName: "FB-204-A.step",
      primaryPreviewLabel: "3D CAD preview",
      primaryThumbnailLabel: "3D CAD model",
      availableModes: ["cad", "drawing", "metadata"],
      manufacturabilityFlags: [],
      metadata: {
        process: "cnc_milling",
        materialText: "Aluminum 6082",
        quantity: 25,
        subject: "RFQ: CNC bracket PN FB-204-A",
      },
      warnings: [],
    })
    expect(model?.measurementOverlays).toEqual([
      { key: "length", label: "Length", valueMm: 120 },
      { key: "width", label: "Width", valueMm: 80 },
      { key: "height", label: "Height", valueMm: 6 },
    ])
    expect(model?.attachments).toMatchObject([
      {
        fileName: "FB-204-A.step",
        kind: "cad",
        primary: true,
        previewLabel: "3D CAD preview",
        reviewState: "ready",
        thumbnailLabel: "3D CAD model",
      },
      {
        fileName: "FB-204-A.pdf",
        kind: "drawing",
        primary: false,
        previewLabel: "Drawing preview",
        reviewState: "ready",
        thumbnailLabel: "Drawing sheet",
      },
    ])
  })

  it("honors an operator-selected primary attachment when it can be previewed", () => {
    const parsed = parseRfqIntake(cncBracketEmail)
    const model = buildPartPreviewModel({
      attachments: parsed.attachments,
      part: parsed.parts[0],
      preferredPrimaryAttachmentName: "FB-204-A.pdf",
      subject: parsed.subject,
    })

    expect(model.primaryMode).toBe("drawing")
    expect(model.primaryAttachmentName).toBe("FB-204-A.pdf")
    expect(model.primaryPreviewLabel).toBe("Drawing preview")
    expect(model.primaryThumbnailLabel).toBe("Drawing sheet")
    expect(model.attachments).toMatchObject([
      {
        fileName: "FB-204-A.step",
        primary: false,
      },
      {
        fileName: "FB-204-A.pdf",
        primary: true,
      },
    ])
  })

  it("restores an exact preferred filename before normalized sibling matches", () => {
    const model = buildPartPreviewModel({
      part: {
        partNumber: "FB-204-A",
        attachmentNames: ["FB-204-A.step", "FB_204_A.step"],
      },
      attachments: [
        {
          fileName: "FB-204-A.step",
          kind: "cad",
        },
        {
          fileName: "FB_204_A.step",
          kind: "cad",
        },
      ],
      preferredPrimaryAttachmentName: "FB_204_A.step",
    })

    expect(model.primaryMode).toBe("cad")
    expect(model.primaryAttachmentName).toBe("FB_204_A.step")
    expect(model.attachments).toMatchObject([
      {
        fileName: "FB-204-A.step",
        primary: false,
      },
      {
        fileName: "FB_204_A.step",
        primary: true,
      },
    ])
  })

  it("ignores stale and metadata-only preferred attachments", () => {
    const previewableInput = {
      part: {
        partNumber: "FB-204-A",
        attachmentNames: ["FB-204-A.step", "notes.txt"],
      },
      attachments: [
        {
          fileName: "FB-204-A.step",
          kind: "cad" as const,
        },
        {
          fileName: "notes.txt",
          kind: "other" as const,
        },
      ],
    }

    const stalePreference = buildPartPreviewModel({
      ...previewableInput,
      preferredPrimaryAttachmentName: "missing.step",
    })
    const metadataPreference = buildPartPreviewModel({
      ...previewableInput,
      preferredPrimaryAttachmentName: "notes.txt",
    })

    expect(stalePreference.primaryMode).toBe("cad")
    expect(stalePreference.primaryAttachmentName).toBe("FB-204-A.step")
    expect(metadataPreference.primaryMode).toBe("cad")
    expect(metadataPreference.primaryAttachmentName).toBe("FB-204-A.step")
  })

  it("falls back to drawing previews when CAD geometry is unavailable", () => {
    const model = buildPartPreviewModel({
      subject: "RFQ: laser bracket",
      part: {
        partNumber: "LASER-42",
        process: "sheet_metal",
        materialText: "Stainless steel 316L",
        quantity: 100,
        dimensions: {
          lengthMm: 250,
          widthMm: 120,
          thicknessMm: 2,
        },
        attachmentNames: ["LASER-42.pdf"],
      },
      attachments: [
        {
          fileName: "LASER-42.pdf",
          kind: "drawing",
          contentType: "application/pdf",
        },
      ],
    })

    expect(model.primaryMode).toBe("drawing")
    expect(model.primaryAttachmentName).toBe("LASER-42.pdf")
    expect(model.primaryThumbnailLabel).toBe("Drawing sheet")
    expect(model.availableModes).toEqual(["drawing", "metadata"])
    expect(model.measurementOverlays).toEqual([
      { key: "length", label: "Length", valueMm: 250 },
      { key: "width", label: "Width", valueMm: 120 },
      { key: "thickness", label: "Thickness", valueMm: 2 },
    ])
    expect(model.warnings).toEqual(["CAD geometry is unavailable; using drawing preview."])
    expect(model.manufacturabilityFlags).toEqual(["cad_geometry_missing"])
  })

  it("uses parsed CAD metadata for measurement overlays and adapter warnings", () => {
    const model = buildPartPreviewModel({
      part: {
        partNumber: "LASER-42",
        process: "sheet_metal",
        materialText: "Stainless steel 316L",
        quantity: 100,
        dimensions: {
          thicknessMm: 2,
        },
        attachmentNames: ["LASER-42.dxf"],
      },
      attachments: [
        {
          fileName: "LASER-42.dxf",
          kind: "drawing",
          contentType: "image/vnd.dxf",
        },
      ],
      cadMetadata: [
        {
          adapterVersion: "cad-metadata.v1",
          dimensions: {
            lengthMm: 250,
            widthMm: 120,
          },
          fileName: "LASER-42.dxf",
          format: "dxf",
          materialText: "stainless steel 316L",
          metadataOnly: false,
          previewKind: "drawing",
          process: "sheet_metal",
          provider: "heuristic",
          status: "succeeded",
          units: "mm",
          warnings: ["Check bend relief manually."],
        },
      ],
    })

    expect(model.measurementOverlays).toEqual([
      { key: "length", label: "Length", valueMm: 250 },
      { key: "width", label: "Width", valueMm: 120 },
      { key: "thickness", label: "Thickness", valueMm: 2 },
    ])
    expect(model.cadMetadata).toEqual([
      {
        fileName: "LASER-42.dxf",
        format: "dxf",
        materialText: "stainless steel 316L",
        metadataOnly: false,
        process: "sheet_metal",
        provider: "heuristic",
        status: "succeeded",
        warnings: ["Check bend relief manually."],
      },
    ])
    expect(model.attachments[0]).toMatchObject({
      fileName: "LASER-42.dxf",
      reviewReasons: ["Check bend relief manually."],
      reviewState: "needs_review",
    })
    expect(model.manufacturabilityFlags).toEqual(["cad_geometry_missing", "check_bend_relief_manually"])
    expect(model.warnings).toContain("Check bend relief manually.")
  })

  it("matches primary CAD metadata with normalized file names", () => {
    const model = buildPartPreviewModel({
      part: {
        partNumber: "FB-204-A",
        attachmentNames: ["FB-204-A.step", "FB-204-A.pdf"],
      },
      attachments: [
        {
          fileName: "FB-204-A.step",
          kind: "cad",
        },
        {
          fileName: "FB-204-A.pdf",
          kind: "drawing",
        },
      ],
      cadMetadata: [
        {
          adapterVersion: "cad-metadata.v1",
          dimensions: {
            lengthMm: 10,
          },
          fileName: "FB-204-A.pdf",
          format: "pdf",
          metadataOnly: true,
          previewKind: "drawing",
          provider: "metadata_fallback",
          status: "fallback",
          units: "mm",
          warnings: [],
        },
        {
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
      ],
    })

    expect(model.primaryAttachmentName).toBe("FB-204-A.step")
    expect(model.measurementOverlays).toEqual([
      { key: "length", label: "Length", valueMm: 120 },
      { key: "width", label: "Width", valueMm: 80 },
      { key: "height", label: "Height", valueMm: 6 },
    ])
  })

  it("uses metadata-only mode when no previewable attachments match", () => {
    const model = buildPartPreviewModel({
      part: {
        partNumber: "NO-GEOM",
        attachmentNames: ["notes.txt"],
      },
      attachments: [
        {
          fileName: "notes.txt",
          kind: "other",
        },
      ],
    })

    expect(model.primaryMode).toBe("metadata")
    expect(model.primaryAttachmentName).toBeUndefined()
    expect(model.availableModes).toEqual(["metadata"])
    expect(model.attachments[0]).toMatchObject({
      fileName: "notes.txt",
      reviewReasons: ["Attachment cannot be previewed directly."],
      reviewState: "unsupported",
    })
    expect(model.manufacturabilityFlags).toEqual(["cad_geometry_missing", "dimensions_missing"])
    expect(model.warnings).toEqual([
      "No previewable attachment matched this part; using metadata-only preview.",
      "No extracted dimensions available for measurement overlays.",
    ])
  })

  it("matches attachments by part number when explicit attachment names are absent", () => {
    const model = buildPartPreviewModel({
      part: {
        partNumber: "POM-GUIDE-042",
        process: "plastic",
        attachmentNames: [],
      },
      attachments: [
        {
          fileName: "unrelated.step",
          kind: "cad",
        },
        {
          fileName: "POM-GUIDE-042.png",
          kind: "photo",
        },
      ],
    })

    expect(model.primaryMode).toBe("photo")
    expect(model.primaryAttachmentName).toBe("POM-GUIDE-042.png")
    expect(model.attachments).toHaveLength(1)
  })

  it("rejects blank part numbers", () => {
    expect(() =>
      buildPartPreviewModel({
        part: {
          partNumber: " ",
          attachmentNames: [],
        },
        attachments: [],
      }),
    ).toThrow("part.partNumber is required")
  })
})
