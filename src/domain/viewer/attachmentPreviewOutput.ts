import type { RfqAttachmentDraft } from "../rfq/intake"

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
  thumbnailLabel: string
  renderer: string
  summary: string
  warnings: string[]
}

export function buildAttachmentPreviewOutput(attachment: RfqAttachmentDraft): AttachmentPreviewOutput {
  const fileName = nonBlank(attachment.fileName, "attachment.fileName")
  const normalizedFileName = fileName.toLowerCase()
  const contentType = attachment.contentType?.toLowerCase()

  if (attachment.kind === "cad" || /\.(step|stp)$/.test(normalizedFileName) || contentType?.includes("step")) {
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

  if (/\.dxf$/.test(normalizedFileName) || contentType?.includes("dxf")) {
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

  if (attachment.kind === "drawing" || /\.pdf$/.test(normalizedFileName) || contentType === "application/pdf") {
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

  if (attachment.kind === "photo" || contentType?.startsWith("image/")) {
    return {
      outputVersion: ATTACHMENT_PREVIEW_OUTPUT_VERSION,
      fileName,
      kind: "image_thumbnail",
      status: "ready",
      label: "Image preview",
      renderer: "browser-image",
      summary: "Image thumbnail preview descriptor",
      thumbnailLabel: "Image thumbnail",
      warnings: [],
    }
  }

  if (attachment.kind === "spreadsheet" || /\.(csv|xlsx?|ods)$/.test(normalizedFileName)) {
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
