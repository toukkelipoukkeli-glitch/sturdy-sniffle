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
      }),
    ).toMatchObject({
      kind: "image_thumbnail",
      label: "Image preview",
      renderer: "browser-image",
      status: "ready",
      thumbnailLabel: "Image thumbnail",
      warnings: [],
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
})
