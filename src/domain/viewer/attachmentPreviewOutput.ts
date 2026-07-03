import type { RfqAttachmentDraft } from "../rfq/intake"
import type { CadMetadataResult } from "../integrations/cadMetadata"
import { createCadGeometryPreviewAdapter, type CadGeometryPreviewResult } from "./cadGeometryPreview"
import { cadMetadataFileMatches } from "./cadMetadataFileMatch"

export const ATTACHMENT_PREVIEW_OUTPUT_VERSION = "attachment-preview-output.v1"

export type AttachmentPreviewOutputKind =
  | "step_model"
  | "dxf_drawing"
  | "pdf_page"
  | "image_thumbnail"
  | "spreadsheet_table"
  | "metadata_card"

export type AttachmentPreviewOutputStatus = "ready" | "fallback"

export interface AttachmentPreviewOutput {
  outputVersion: typeof ATTACHMENT_PREVIEW_OUTPUT_VERSION
  fileName: string
  kind: AttachmentPreviewOutputKind
  status: AttachmentPreviewOutputStatus
  label: string
  sourceUrl?: string
  thumbnailLabel: string
  renderer: string
  summary: string
  geometryPreview?: CadGeometryPreviewResult
  warnings: string[]
}

const cadGeometryPreviewAdapter = createCadGeometryPreviewAdapter()

export function buildAttachmentPreviewOutput(
  attachment: RfqAttachmentDraft,
  cadMetadata?: CadMetadataResult,
): AttachmentPreviewOutput {
  const fileName = nonBlank(attachment.fileName, "attachment.fileName")
  const normalizedFileName = fileName.toLowerCase()
  const contentType = attachment.contentType?.toLowerCase()

  if (attachment.kind === "cad") {
    return stepOutput(fileName, cadMetadata)
  }

  if (attachment.kind === "drawing") {
    if (/\.dxf$/.test(normalizedFileName) || contentType?.includes("dxf")) {
      return dxfOutput(fileName, cadMetadata)
    }
    return pdfOutput(attachment, fileName)
  }

  if (attachment.kind === "photo") {
    return imageOutput(attachment, fileName)
  }

  if (attachment.kind === "spreadsheet") {
    return fallbackOutput({
      fileName,
      kind: "spreadsheet_table",
      label: "Spreadsheet preview",
      renderer: "spreadsheet-grid",
      summary: "Spreadsheet grid preview descriptor",
      thumbnailLabel: "Spreadsheet grid",
      warning: "Spreadsheet renderer unavailable; using deterministic table placeholder.",
    })
  }

  if (/\.(step|stp)$/.test(normalizedFileName) || contentType?.includes("step")) {
    return stepOutput(fileName, cadMetadata)
  }

  if (/\.dxf$/.test(normalizedFileName) || contentType?.includes("dxf")) {
    return dxfOutput(fileName, cadMetadata)
  }

  if (/\.pdf$/.test(normalizedFileName) || contentType?.includes("pdf")) {
    return pdfOutput(attachment, fileName)
  }

  if (contentType?.startsWith("image/")) {
    return imageOutput(attachment, fileName)
  }

  if (/\.(csv|xlsx?|ods)$/.test(normalizedFileName)) {
    return fallbackOutput({
      fileName,
      kind: "spreadsheet_table",
      label: "Spreadsheet preview",
      renderer: "spreadsheet-grid",
      summary: "Spreadsheet grid preview descriptor",
      thumbnailLabel: "Spreadsheet grid",
      warning: "Spreadsheet renderer unavailable; using deterministic table placeholder.",
    })
  }

  return {
    outputVersion: ATTACHMENT_PREVIEW_OUTPUT_VERSION,
    fileName,
    kind: "metadata_card",
    status: "fallback",
    label: "Metadata preview",
    renderer: "metadata-card",
    summary: "Attachment metadata preview descriptor",
    thumbnailLabel: "Metadata card",
    warnings: ["Attachment cannot be previewed directly; showing metadata only."],
  }
}

function stepOutput(fileName: string, cadMetadata: CadMetadataResult | undefined): AttachmentPreviewOutput {
  if (cadMetadataReadyFor(cadMetadata, fileName, "step")) {
    return {
      outputVersion: ATTACHMENT_PREVIEW_OUTPUT_VERSION,
      fileName,
      kind: "step_model",
      status: "ready",
      label: "3D CAD preview",
      renderer: "step-metadata-card",
      summary: "STEP metadata preview descriptor",
      thumbnailLabel: "3D CAD model",
      geometryPreview: cadGeometryPreviewAdapter.build({ fileName, cadMetadata }),
      warnings: [...cadMetadata.warnings],
    }
  }

  return fallbackOutput({
    fileName,
    kind: "step_model",
    label: "3D CAD preview",
    renderer: "step-viewer",
    summary: "STEP model preview descriptor",
    thumbnailLabel: "3D CAD model",
    warning: "STEP geometry renderer unavailable; using deterministic CAD model placeholder.",
  })
}

function dxfOutput(fileName: string, cadMetadata: CadMetadataResult | undefined): AttachmentPreviewOutput {
  if (cadMetadataReadyFor(cadMetadata, fileName, "dxf")) {
    return {
      outputVersion: ATTACHMENT_PREVIEW_OUTPUT_VERSION,
      fileName,
      kind: "dxf_drawing",
      status: "ready",
      label: "DXF drawing preview",
      renderer: "dxf-metadata-card",
      summary: "DXF metadata preview descriptor",
      thumbnailLabel: "DXF drawing",
      geometryPreview: cadGeometryPreviewAdapter.build({ fileName, cadMetadata }),
      warnings: [...cadMetadata.warnings],
    }
  }

  return fallbackOutput({
    fileName,
    kind: "dxf_drawing",
    label: "DXF drawing preview",
    renderer: "dxf-viewer",
    summary: "DXF drawing preview descriptor",
    thumbnailLabel: "DXF drawing",
    warning: "DXF renderer unavailable; using deterministic drawing placeholder.",
  })
}

function cadMetadataReadyFor(
  metadata: CadMetadataResult | undefined,
  fileName: string,
  format: "step" | "dxf",
): metadata is CadMetadataResult {
  return Boolean(
    metadata &&
      cadMetadataFileMatches(metadata.fileName, fileName) &&
      metadata.status === "succeeded" &&
      !metadata.metadataOnly &&
      metadata.format === format,
  )
}

function imageOutput(attachment: RfqAttachmentDraft, fileName: string): AttachmentPreviewOutput {
  const sourceUrl = safeImageSource(attachment.previewUrl)
  if (!sourceUrl) {
    return fallbackOutput({
      fileName,
      kind: "image_thumbnail",
      label: "Image preview",
      renderer: "browser-image",
      summary: "Image thumbnail preview descriptor",
      thumbnailLabel: "Image thumbnail",
      warning: "Image preview source unavailable; using deterministic image placeholder.",
    })
  }

  return {
    outputVersion: ATTACHMENT_PREVIEW_OUTPUT_VERSION,
    fileName,
    kind: "image_thumbnail",
    status: "ready",
    label: "Image preview",
    renderer: "browser-image",
    sourceUrl,
    summary: "Image thumbnail preview descriptor",
    thumbnailLabel: "Image thumbnail",
    warnings: [],
  }
}

function pdfOutput(attachment: RfqAttachmentDraft, fileName: string): AttachmentPreviewOutput {
  const sourceUrl = safePdfSource(attachment.previewUrl)
  if (!sourceUrl) {
    return fallbackOutput({
      fileName,
      kind: "pdf_page",
      label: "PDF drawing preview",
      renderer: "pdf-page",
      summary: "PDF page preview descriptor",
      thumbnailLabel: "PDF drawing",
      warning: "PDF renderer unavailable; using deterministic drawing placeholder.",
    })
  }

  return {
    outputVersion: ATTACHMENT_PREVIEW_OUTPUT_VERSION,
    fileName,
    kind: "pdf_page",
    status: "ready",
    label: "PDF drawing preview",
    renderer: "browser-pdf",
    sourceUrl,
    summary: "PDF page preview descriptor",
    thumbnailLabel: "PDF drawing",
    warnings: [],
  }
}

function safeImageSource(previewUrl: string | undefined): string | undefined {
  const trimmed = previewUrl?.trim()
  if (!trimmed) {
    return undefined
  }
  if (/^data:image\/[a-z0-9.+-]+[;,]/i.test(trimmed) || /^blob:/i.test(trimmed)) {
    return trimmed
  }
  return undefined
}

function safePdfSource(previewUrl: string | undefined): string | undefined {
  const trimmed = previewUrl?.trim()
  if (!trimmed) {
    return undefined
  }
  if (/^data:application\/pdf[;,]/i.test(trimmed) || /^blob:/i.test(trimmed)) {
    return trimmed
  }
  return undefined
}

function fallbackOutput(input: {
  fileName: string
  kind: AttachmentPreviewOutputKind
  label: string
  renderer: string
  summary: string
  thumbnailLabel: string
  warning: string
}): AttachmentPreviewOutput {
  return {
    outputVersion: ATTACHMENT_PREVIEW_OUTPUT_VERSION,
    fileName: input.fileName,
    kind: input.kind,
    status: "fallback",
    label: input.label,
    renderer: input.renderer,
    summary: input.summary,
    thumbnailLabel: input.thumbnailLabel,
    warnings: [input.warning],
  }
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
