import { describe, expect, it } from "vitest"

import {
  createCadMetadataAdapter,
  createHeuristicCadMetadataProvider,
  createMetadataOnlyCadProvider,
  createMockCadMetadataProvider,
} from "./cadMetadata"

describe("CAD metadata adapter", () => {
  it("extracts STEP metadata from deterministic text and RFQ context", async () => {
    const provider = createHeuristicCadMetadataProvider()

    const result = await provider.inspect({
      attachment: {
        fileName: "FB-204-A.step",
        kind: "cad",
        contentType: "model/step",
        extractedText: "Bounding box: 120 x 80 x 6 mm\nMaterial: Aluminum 6082",
      },
      part: {
        partNumber: "FB-204-A",
        attachmentNames: ["FB-204-A.step"],
        process: "cnc_milling",
      },
    })

    expect(result).toEqual({
      adapterVersion: "cad-metadata.v1",
      provider: "heuristic",
      status: "succeeded",
      fileName: "FB-204-A.step",
      format: "step",
      previewKind: "cad",
      dimensions: {
        lengthMm: 120,
        widthMm: 80,
        heightMm: 6,
      },
      materialText: "Aluminum 6082",
      process: "cnc_milling",
      units: "mm",
      metadataOnly: false,
      warnings: [],
    })
  })

  it("infers DXF sheet metadata and merges fallback thickness", async () => {
    const result = await createHeuristicCadMetadataProvider().inspect({
      attachment: {
        fileName: "plate_set.dxf",
        kind: "drawing",
        extractedText: "Size 250 x 120 mm, material stainless steel 316L",
      },
      part: {
        partNumber: "PLATE-42",
        attachmentNames: ["plate_set.dxf"],
        dimensions: {
          thicknessMm: 2,
        },
      },
    })

    expect(result).toMatchObject({
      format: "dxf",
      dimensions: {
        lengthMm: 250,
        widthMm: 120,
        thicknessMm: 2,
      },
      materialText: "stainless steel 316L",
      process: "sheet_metal",
      units: "mm",
      warnings: [],
    })
  })

  it("falls back to metadata-only output when the primary provider fails", async () => {
    const adapter = createCadMetadataAdapter({
      provider: createMockCadMetadataProvider({ shouldFail: true }),
      fallbackProvider: createMetadataOnlyCadProvider(),
    })

    const result = await adapter.inspect({
      attachment: {
        fileName: "manual.pdf",
        kind: "drawing",
        contentType: "application/pdf",
      },
      part: {
        partNumber: "MANUAL-1",
        attachmentNames: ["manual.pdf"],
        materialText: "Steel S355",
        process: "fabrication",
        dimensions: {
          lengthMm: 400,
          widthMm: 200,
        },
      },
    })

    expect(result).toEqual({
      adapterVersion: "cad-metadata.v1",
      provider: "metadata_fallback",
      status: "fallback",
      fileName: "manual.pdf",
      format: "pdf",
      previewKind: "drawing",
      dimensions: {
        lengthMm: 400,
        widthMm: 200,
      },
      materialText: "Steel S355",
      process: "fabrication",
      units: "mm",
      metadataOnly: true,
      warnings: [
        "CAD metadata provider mock failed: Mock CAD metadata provider failure.",
        "CAD parser unavailable; using attachment and RFQ metadata only.",
      ],
    })
  })

  it("records unsupported metadata-only attachments without pretending geometry exists", async () => {
    const result = await createMetadataOnlyCadProvider().inspect({
      attachment: {
        fileName: "notes.txt",
        kind: "other",
      },
    })

    expect(result).toMatchObject({
      status: "fallback",
      format: "unknown",
      units: "unknown",
      metadataOnly: true,
      warnings: [
        "CAD parser unavailable; using attachment and RFQ metadata only.",
        "Attachment format is not supported by the CAD metadata adapter.",
        "No CAD dimensions were extracted.",
      ],
    })
  })

  it("rejects blank attachment file names", async () => {
    await expect(
      createHeuristicCadMetadataProvider().inspect({
        attachment: {
          fileName: " ",
          kind: "cad",
        },
      }),
    ).rejects.toThrow("attachment.fileName is required")
  })
})
