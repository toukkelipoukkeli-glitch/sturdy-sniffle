import { describe, expect, it } from "vitest"

import { buildAttachmentPreviewOutput } from "./attachmentPreviewOutput"

describe("attachment preview output", () => {
  it("returns nonfatal fallback descriptors for parser-backed engineering files", () => {
    expect(
      buildAttachmentPreviewOutput({
        fileName: "housing.step",
        kind: "cad",
        contentType: "model/step",
      }),
    ).toMatchObject({
      fileName: "housing.step",
      kind: "step_model",
      label: "3D CAD preview",
      renderer: "step-viewer",
      status: "fallback",
      thumbnailLabel: "3D CAD model",
      warnings: ["STEP geometry renderer unavailable; using deterministic CAD model placeholder."],
    })

    expect(
      buildAttachmentPreviewOutput({
        fileName: "flat-pattern.dxf",
        kind: "drawing",
        contentType: "image/vnd.dxf",
      }),
    ).toMatchObject({
      kind: "dxf_drawing",
      label: "DXF drawing preview",
      renderer: "dxf-viewer",
      status: "fallback",
      thumbnailLabel: "DXF drawing",
    })

    expect(
      buildAttachmentPreviewOutput({
        fileName: "drawing.pdf",
        kind: "drawing",
        contentType: "application/pdf",
      }),
    ).toMatchObject({
      kind: "pdf_page",
      label: "PDF drawing preview",
      renderer: "pdf-page",
      status: "fallback",
      thumbnailLabel: "PDF drawing",
    })
  })

  it("returns ready descriptors for browser-native image previews", () => {
    expect(
      buildAttachmentPreviewOutput({
        fileName: "fixture-photo.png",
        kind: "photo",
        contentType: "image/png",
        previewUrl: "data:image/png;base64,AA==",
      }),
    ).toMatchObject({
      kind: "image_thumbnail",
      label: "Image preview",
      renderer: "browser-image",
      sourceUrl: "data:image/png;base64,AA==",
      status: "ready",
      thumbnailLabel: "Image thumbnail",
      warnings: [],
    })
  })

  it("returns ready descriptors for safe browser-native PDF previews", () => {
    expect(
      buildAttachmentPreviewOutput({
        fileName: "drawing.pdf",
        kind: "drawing",
        contentType: "application/pdf",
        previewUrl: "data:application/pdf;base64,JVBERi0xLjQK",
      }),
    ).toMatchObject({
      kind: "pdf_page",
      label: "PDF drawing preview",
      renderer: "browser-pdf",
      sourceUrl: "data:application/pdf;base64,JVBERi0xLjQK",
      status: "ready",
      thumbnailLabel: "PDF drawing",
      warnings: [],
    })
  })

  it("returns ready descriptors for parser-backed STEP and DXF metadata", () => {
    expect(
      buildAttachmentPreviewOutput(
        {
          fileName: "housing.step",
          kind: "cad",
          contentType: "model/step",
        },
        {
          adapterVersion: "cad-metadata.v1",
          fileName: "housing.step",
          format: "step",
          metadataOnly: false,
          previewKind: "cad",
          provider: "heuristic",
          status: "succeeded",
          units: "mm",
          warnings: [],
        },
      ),
    ).toMatchObject({
      kind: "step_model",
      label: "3D CAD preview",
      renderer: "step-metadata-card",
      status: "ready",
      thumbnailLabel: "3D CAD model",
      warnings: [],
    })

    expect(
      buildAttachmentPreviewOutput(
        {
          fileName: "flat-pattern.dxf",
          kind: "drawing",
          contentType: "image/vnd.dxf",
        },
        {
          adapterVersion: "cad-metadata.v1",
          fileName: "flat-pattern.dxf",
          format: "dxf",
          metadataOnly: false,
          previewKind: "drawing",
          provider: "heuristic",
          status: "succeeded",
          units: "mm",
          warnings: ["Check bend relief manually."],
        },
      ),
    ).toMatchObject({
      kind: "dxf_drawing",
      label: "DXF drawing preview",
      renderer: "dxf-metadata-card",
      status: "ready",
      thumbnailLabel: "DXF drawing",
      warnings: ["Check bend relief manually."],
    })
  })

  it("keeps deterministic fallbacks when CAD metadata is unsuitable", () => {
    expect(
      buildAttachmentPreviewOutput(
        {
          fileName: "ab-c.step",
          kind: "cad",
          contentType: "model/step",
        },
        {
          adapterVersion: "cad-metadata.v1",
          fileName: "a-bc.step",
          format: "step",
          metadataOnly: false,
          previewKind: "cad",
          provider: "heuristic",
          status: "succeeded",
          units: "mm",
          warnings: [],
        },
      ),
    ).toMatchObject({
      kind: "step_model",
      renderer: "step-viewer",
      status: "fallback",
    })

    expect(
      buildAttachmentPreviewOutput(
        {
          fileName: "housing.step",
          kind: "cad",
          contentType: "model/step",
        },
        {
          adapterVersion: "cad-metadata.v1",
          fileName: "supplier-housing.step",
          format: "step",
          metadataOnly: false,
          previewKind: "cad",
          provider: "heuristic",
          status: "succeeded",
          units: "mm",
          warnings: [],
        },
      ),
    ).toMatchObject({
      kind: "step_model",
      renderer: "step-viewer",
      status: "fallback",
      warnings: ["STEP geometry renderer unavailable; using deterministic CAD model placeholder."],
    })

    expect(
      buildAttachmentPreviewOutput(
        {
          fileName: "flat-pattern.dxf",
          kind: "drawing",
          contentType: "image/vnd.dxf",
        },
        {
          adapterVersion: "cad-metadata.v1",
          fileName: "flat-pattern.dxf",
          format: "dxf",
          metadataOnly: true,
          previewKind: "drawing",
          provider: "metadata_fallback",
          status: "fallback",
          units: "mm",
          warnings: ["CAD parser unavailable; using attachment and RFQ metadata only."],
        },
      ),
    ).toMatchObject({
      kind: "dxf_drawing",
      renderer: "dxf-viewer",
      status: "fallback",
      warnings: ["DXF renderer unavailable; using deterministic drawing placeholder."],
    })

    expect(
      buildAttachmentPreviewOutput(
        {
          fileName: "flat-pattern.dxf",
          kind: "drawing",
          contentType: "image/vnd.dxf",
        },
        {
          adapterVersion: "cad-metadata.v1",
          fileName: "flat-pattern.dxf",
          format: "step",
          metadataOnly: false,
          previewKind: "drawing",
          provider: "heuristic",
          status: "succeeded",
          units: "mm",
          warnings: [],
        },
      ),
    ).toMatchObject({
      kind: "dxf_drawing",
      renderer: "dxf-viewer",
      status: "fallback",
      warnings: ["DXF renderer unavailable; using deterministic drawing placeholder."],
    })
  })

  it("falls back when image attachments do not include a safe browser source", () => {
    expect(
      buildAttachmentPreviewOutput({
        fileName: "fixture-photo.png",
        kind: "photo",
        contentType: "image/png",
      }),
    ).toMatchObject({
      kind: "image_thumbnail",
      renderer: "browser-image",
      status: "fallback",
      warnings: ["Image preview source unavailable; using deterministic image placeholder."],
    })

    expect(
      buildAttachmentPreviewOutput({
        fileName: "supplier-photo.png",
        kind: "photo",
        contentType: "image/png",
        previewUrl: "https://supplier.example/photo.png",
      }),
    ).toMatchObject({
      kind: "image_thumbnail",
      renderer: "browser-image",
      status: "fallback",
      warnings: ["Image preview source unavailable; using deterministic image placeholder."],
    })
  })

  it("falls back when PDF attachments do not include a safe browser source", () => {
    expect(
      buildAttachmentPreviewOutput({
        fileName: "drawing.pdf",
        kind: "drawing",
        contentType: "application/pdf",
      }),
    ).toMatchObject({
      kind: "pdf_page",
      renderer: "pdf-page",
      status: "fallback",
      warnings: ["PDF renderer unavailable; using deterministic drawing placeholder."],
    })

    expect(
      buildAttachmentPreviewOutput({
        fileName: "supplier-drawing.pdf",
        kind: "drawing",
        contentType: "application/pdf",
        previewUrl: "https://supplier.example/drawing.pdf",
      }),
    ).toMatchObject({
      kind: "pdf_page",
      renderer: "pdf-page",
      status: "fallback",
      warnings: ["PDF renderer unavailable; using deterministic drawing placeholder."],
    })
  })

  it("falls back to table and metadata cards for unsupported preview renderers", () => {
    expect(
      buildAttachmentPreviewOutput({
        fileName: "bom.xlsx",
        kind: "spreadsheet",
      }),
    ).toMatchObject({
      kind: "spreadsheet_table",
      label: "Spreadsheet preview",
      renderer: "spreadsheet-grid",
      status: "fallback",
      thumbnailLabel: "Spreadsheet grid",
    })

    expect(
      buildAttachmentPreviewOutput({
        fileName: "notes.txt",
        kind: "other",
      }),
    ).toMatchObject({
      kind: "metadata_card",
      label: "Metadata preview",
      renderer: "metadata-card",
      status: "fallback",
      thumbnailLabel: "Metadata card",
      warnings: ["Attachment cannot be previewed directly; showing metadata only."],
    })
  })

  it("accepts PDF content types with parameters", () => {
    expect(
      buildAttachmentPreviewOutput({
        fileName: "drawing",
        kind: "other",
        contentType: "application/pdf; charset=binary",
      }),
    ).toMatchObject({
      kind: "pdf_page",
      label: "PDF drawing preview",
      renderer: "pdf-page",
      status: "fallback",
      thumbnailLabel: "PDF drawing",
      warnings: ["PDF renderer unavailable; using deterministic drawing placeholder."],
    })
  })

  it("uses attachment kind before filename hints to stay aligned with preview modes", () => {
    expect(
      buildAttachmentPreviewOutput({
        fileName: "supplier-misnamed.step",
        kind: "drawing",
        contentType: "application/pdf",
      }),
    ).toMatchObject({
      kind: "pdf_page",
      label: "PDF drawing preview",
      renderer: "pdf-page",
      status: "fallback",
      thumbnailLabel: "PDF drawing",
      warnings: ["PDF renderer unavailable; using deterministic drawing placeholder."],
    })
  })
})
