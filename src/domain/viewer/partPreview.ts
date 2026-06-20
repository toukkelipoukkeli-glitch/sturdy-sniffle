import type { ParsedRfqIntake, RfqAttachmentDraft, RfqAttachmentKind, RfqPartDraft } from "../rfq/intake"
import { compareLex } from "../shared/deterministic"
import type { CadMetadataResult } from "../integrations/cadMetadata"

export const PART_PREVIEW_MODEL_VERSION = "part-preview.v1"

export type PartPreviewMode = "cad" | "drawing" | "photo" | "spreadsheet" | "metadata"

export interface PartMeasurementOverlay {
  key: string
  label: string
  valueMm: number
}

export interface PartPreviewAttachment {
  fileName: string
  kind: RfqAttachmentKind
  contentType?: string
  sizeBytes?: number
  score: number
  modes: PartPreviewMode[]
  primary: boolean
}

export interface PartPreviewModel {
  modelVersion: typeof PART_PREVIEW_MODEL_VERSION
  partNumber: string
  title: string
  primaryMode: PartPreviewMode
  primaryAttachmentName?: string
  availableModes: PartPreviewMode[]
  attachments: PartPreviewAttachment[]
  measurementOverlays: PartMeasurementOverlay[]
  cadMetadata: PartPreviewCadMetadata[]
  warnings: string[]
  metadata: {
    process?: string
    materialText?: string
    quantity?: number
    subject?: string
  }
}

export interface BuildPartPreviewModelInput {
  part: RfqPartDraft
  attachments: RfqAttachmentDraft[]
  cadMetadata?: CadMetadataResult[]
  subject?: string
}

export interface PartPreviewCadMetadata {
  fileName: string
  provider: CadMetadataResult["provider"]
  status: CadMetadataResult["status"]
  format: CadMetadataResult["format"]
  materialText?: string
  process?: CadMetadataResult["process"]
  metadataOnly: boolean
  warnings: string[]
}

const modePriority: Record<PartPreviewMode, number> = {
  cad: 100,
  drawing: 80,
  photo: 60,
  spreadsheet: 40,
  metadata: 0,
}

export function buildPartPreviewModelsFromRfq(parsedRfq: ParsedRfqIntake): PartPreviewModel[] {
  return parsedRfq.parts.map((part) =>
    buildPartPreviewModel({
      part,
      attachments: parsedRfq.attachments,
      subject: parsedRfq.subject,
    }),
  )
}

export function buildPartPreviewModel(input: BuildPartPreviewModelInput): PartPreviewModel {
  const partNumber = nonBlank(input.part.partNumber, "part.partNumber")
  const attachmentNames = new Set(input.part.attachmentNames.map(normalizeToken))
  const matchingAttachments = selectMatchingAttachments(partNumber, attachmentNames, input.attachments)
  const rankedAttachments = matchingAttachments
    .map((attachment) => rankAttachment(attachment, partNumber, attachmentNames))
    .sort((left, right) => right.score - left.score || compareLex(left.fileName, right.fileName))
  const primaryAttachment = rankedAttachments.find((attachment) => attachment.modes[0] !== "metadata")
  const primaryMode = primaryAttachment?.modes[0] ?? "metadata"
  const cadMetadata = selectMatchingCadMetadata(partNumber, attachmentNames, input.cadMetadata ?? [])
  const primaryAttachmentToken = primaryAttachment ? normalizeToken(primaryAttachment.fileName) : undefined
  const primaryCadMetadata =
    cadMetadata.find((metadata) => normalizeToken(metadata.fileName) === primaryAttachmentToken) ?? cadMetadata[0]
  const measurementOverlays = buildMeasurementOverlays({
    ...input.part,
    dimensions: {
      ...input.part.dimensions,
      ...primaryCadMetadata?.dimensions,
    },
  })
  const warnings = buildWarnings(primaryMode, rankedAttachments, measurementOverlays, cadMetadata)

  return {
    modelVersion: PART_PREVIEW_MODEL_VERSION,
    partNumber,
    title: input.part.description?.trim() || partNumber,
    primaryMode,
    primaryAttachmentName: primaryAttachment?.fileName,
    availableModes: collectAvailableModes(rankedAttachments),
    attachments: rankedAttachments.map((attachment) => ({
      ...attachment,
      primary: attachment.fileName === primaryAttachment?.fileName,
    })),
    measurementOverlays,
    cadMetadata: cadMetadata.map(toPartPreviewCadMetadata),
    warnings,
    metadata: {
      process: input.part.process,
      materialText: input.part.materialText,
      quantity: input.part.quantity,
      subject: optionalTrim(input.subject),
    },
  }
}

function selectMatchingAttachments(
  partNumber: string,
  attachmentNames: Set<string>,
  attachments: RfqAttachmentDraft[],
): RfqAttachmentDraft[] {
  if (attachmentNames.size > 0) {
    return attachments.filter((attachment) => attachmentNames.has(normalizeToken(attachment.fileName)))
  }

  const normalizedPartNumber = normalizeToken(partNumber)
  const matchedByName = attachments.filter((attachment) => normalizeToken(attachment.fileName).includes(normalizedPartNumber))
  return matchedByName.length > 0 ? matchedByName : attachments
}

function selectMatchingCadMetadata(
  partNumber: string,
  attachmentNames: Set<string>,
  cadMetadata: CadMetadataResult[],
): CadMetadataResult[] {
  const normalizedPartNumber = normalizeToken(partNumber)
  return cadMetadata
    .filter((metadata) => {
      const normalizedFileName = normalizeToken(metadata.fileName)
      return attachmentNames.has(normalizedFileName) || normalizedFileName.includes(normalizedPartNumber)
    })
    .sort((left, right) => compareLex(left.fileName, right.fileName))
}

function rankAttachment(
  attachment: RfqAttachmentDraft,
  partNumber: string,
  attachmentNames: Set<string>,
): Omit<PartPreviewAttachment, "primary"> {
  const modes = modesForAttachment(attachment.kind)
  const score =
    modePriority[modes[0]] +
    (normalizeToken(attachment.fileName).includes(normalizeToken(partNumber)) ? 20 : 0) +
    (attachmentNames.has(normalizeToken(attachment.fileName)) ? 10 : 0)

  return {
    fileName: attachment.fileName,
    kind: attachment.kind,
    contentType: attachment.contentType,
    sizeBytes: attachment.sizeBytes,
    score,
    modes,
  }
}

function modesForAttachment(kind: RfqAttachmentKind): PartPreviewMode[] {
  switch (kind) {
    case "cad":
      return ["cad", "metadata"]
    case "drawing":
      return ["drawing", "metadata"]
    case "photo":
      return ["photo", "metadata"]
    case "spreadsheet":
      return ["spreadsheet", "metadata"]
    case "email_body":
    case "other":
      return ["metadata"]
  }
}

function collectAvailableModes(attachments: Array<Omit<PartPreviewAttachment, "primary">>): PartPreviewMode[] {
  const modes = new Set<PartPreviewMode>()
  for (const attachment of attachments) {
    for (const mode of attachment.modes) {
      modes.add(mode)
    }
  }
  modes.add("metadata")

  return [...modes].sort((left, right) => modePriority[right] - modePriority[left])
}

function buildMeasurementOverlays(part: RfqPartDraft): PartMeasurementOverlay[] {
  const dimensions = part.dimensions
  if (!dimensions) {
    return []
  }

  return [
    overlay("length", "Length", dimensions.lengthMm),
    overlay("width", "Width", dimensions.widthMm),
    overlay("height", "Height", dimensions.heightMm),
    overlay("thickness", "Thickness", dimensions.thicknessMm),
  ].filter((overlay): overlay is PartMeasurementOverlay => overlay !== undefined)
}

function overlay(key: string, label: string, valueMm: number | undefined): PartMeasurementOverlay | undefined {
  if (valueMm === undefined) {
    return undefined
  }
  return { key, label, valueMm }
}

function buildWarnings(
  primaryMode: PartPreviewMode,
  attachments: Array<Omit<PartPreviewAttachment, "primary">>,
  measurementOverlays: PartMeasurementOverlay[],
  cadMetadata: CadMetadataResult[],
): string[] {
  const warnings: string[] = []
  if (primaryMode === "metadata") {
    warnings.push("No previewable attachment matched this part; using metadata-only preview.")
  } else if (primaryMode !== "cad" && attachments.some((attachment) => attachment.kind === "drawing")) {
    warnings.push("CAD geometry is unavailable; using drawing preview.")
  }

  if (measurementOverlays.length === 0) {
    warnings.push("No extracted dimensions available for measurement overlays.")
  }
  for (const metadata of cadMetadata) {
    warnings.push(...metadata.warnings)
    if (metadata.metadataOnly) {
      warnings.push(`${metadata.fileName} uses metadata-only CAD review.`)
    }
  }

  return [...new Set(warnings)]
}

function toPartPreviewCadMetadata(metadata: CadMetadataResult): PartPreviewCadMetadata {
  return {
    fileName: metadata.fileName,
    provider: metadata.provider,
    status: metadata.status,
    format: metadata.format,
    materialText: metadata.materialText,
    process: metadata.process,
    metadataOnly: metadata.metadataOnly,
    warnings: metadata.warnings,
  }
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
