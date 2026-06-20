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
      availableModes: ["cad", "drawing", "metadata"],
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
      },
      {
        fileName: "FB-204-A.pdf",
        kind: "drawing",
        primary: false,
      },
    ])
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
    expect(model.availableModes).toEqual(["drawing", "metadata"])
    expect(model.measurementOverlays).toEqual([
      { key: "length", label: "Length", valueMm: 250 },
      { key: "width", label: "Width", valueMm: 120 },
      { key: "thickness", label: "Thickness", valueMm: 2 },
    ])
    expect(model.warnings).toEqual(["CAD geometry is unavailable; using drawing preview."])
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
    expect(model.warnings).toContain("Check bend relief manually.")
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
