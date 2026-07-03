import type { ParsedRfqIntake, RfqAttachmentDraft, RfqAttachmentKind, RfqPartDraft } from "../rfq/intake"
import { compareLex } from "../shared/deterministic"
import type { CadMetadataResult } from "../integrations/cadMetadata"
import { buildAttachmentPreviewOutput, type AttachmentPreviewOutput } from "./attachmentPreviewOutput"
import { cadMetadataFileBelongsToPart, cadMetadataFileMatches } from "./cadMetadataFileMatch"

export const PART_PREVIEW_MODEL_VERSION = "part-preview.v1"

export type PartPreviewMode = "cad" | "drawing" | "photo" | "spreadsheet" | "metadata"
export type PartPreviewReviewState = "ready" | "metadata_only" | "needs_review" | "unsupported"

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
  previewLabel: string
  previewOutput: AttachmentPreviewOutput
  score: number
  thumbnailLabel: string
  modes: PartPreviewMode[]
  primary: boolean
  reviewReasons: string[]
  reviewState: PartPreviewReviewState
}

export interface PartPreviewModel {
  modelVersion: typeof PART_PREVIEW_MODEL_VERSION
  partNumber: string
  title: string
  primaryMode: PartPreviewMode
  primaryAttachmentName?: string
  primaryPreviewLabel: string
  primaryThumbnailLabel: string
  availableModes: PartPreviewMode[]
  attachments: PartPreviewAttachment[]
  measurementOverlays: PartMeasurementOverlay[]
  cadMetadata: PartPreviewCadMetadata[]
  manufacturabilityFlags: string[]
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
  preferredPrimaryAttachmentName?: string
  subject?: string
}

type RankedPartPreviewAttachment = Omit<PartPreviewAttachment, "primary" | "reviewReasons" | "reviewState">

interface RankedPartPreviewAttachmentRecord {
  attachment: RankedPartPreviewAttachment
  cadMetadata?: CadMetadataResult
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
  const attachmentFileNames = input.part.attachmentNames
  const attachmentNames = new Set(attachmentFileNames.map(normalizeToken))
  const matchingAttachments = selectMatchingAttachments(partNumber, attachmentNames, input.attachments)
  const cadMetadata = selectMatchingCadMetadata(partNumber, attachmentFileNames, input.cadMetadata ?? [])
  const rankedAttachmentRecords = matchingAttachments
    .map((attachment): RankedPartPreviewAttachmentRecord => {
      const matchingCadMetadata = findCadMetadataForAttachment(cadMetadata, attachment.fileName)
      return {
        attachment: rankAttachment(attachment, partNumber, attachmentNames, matchingCadMetadata),
        cadMetadata: matchingCadMetadata,
      }
    })
    .sort((left, right) => right.attachment.score - left.attachment.score || compareLex(left.attachment.fileName, right.attachment.fileName))
  const rankedAttachments = rankedAttachmentRecords.map(({ attachment }) => attachment)
  const preferredPrimaryToken = input.preferredPrimaryAttachmentName ? normalizeToken(input.preferredPrimaryAttachmentName) : undefined
  const preferredPrimaryRecord = input.preferredPrimaryAttachmentName
    ? rankedAttachmentRecords.find(
        ({ attachment }) => attachment.fileName === input.preferredPrimaryAttachmentName && attachment.modes[0] !== "metadata",
      ) ??
      (preferredPrimaryToken
        ? rankedAttachmentRecords.find(
            ({ attachment }) => normalizeToken(attachment.fileName) === preferredPrimaryToken && attachment.modes[0] !== "metadata",
          )
        : undefined)
    : undefined
  const primaryRecord = preferredPrimaryRecord ?? rankedAttachmentRecords.find(({ attachment }) => attachment.modes[0] !== "metadata")
  const primaryAttachment = primaryRecord?.attachment
  const primaryMode = primaryAttachment?.modes[0] ?? "metadata"
  const primaryCadMetadata = primaryRecord?.cadMetadata ?? cadMetadata[0]
  const measurementOverlays = buildMeasurementOverlays({
    ...input.part,
    dimensions: {
      ...input.part.dimensions,
      ...primaryCadMetadata?.dimensions,
    },
  })
  const warnings = buildWarnings(primaryMode, rankedAttachments, measurementOverlays, cadMetadata)
  const manufacturabilityFlags = buildManufacturabilityFlags(primaryMode, cadMetadata, measurementOverlays)

  return {
    modelVersion: PART_PREVIEW_MODEL_VERSION,
    partNumber,
    title: input.part.description?.trim() || partNumber,
    primaryMode,
    primaryAttachmentName: primaryAttachment?.fileName,
    primaryPreviewLabel: primaryAttachment?.previewLabel ?? "Metadata preview",
    primaryThumbnailLabel: primaryAttachment?.thumbnailLabel ?? "Metadata card",
    availableModes: collectAvailableModes(rankedAttachments),
    attachments: rankedAttachmentRecords.map(({ attachment, cadMetadata }) => ({
      ...attachment,
      primary: attachment.fileName === primaryAttachment?.fileName,
      ...reviewStateForAttachment(attachment, cadMetadata),
    })),
    measurementOverlays,
    cadMetadata: cadMetadata.map(toPartPreviewCadMetadata),
    manufacturabilityFlags,
    warnings,
    metadata: {
      process: input.part.process,
      materialText: input.part.materialText,
      quantity: input.part.quantity,
      subject: optionalTrim(input.subject),
    },
  }
}

function reviewStateForAttachment(
  attachment: Omit<PartPreviewAttachment, "primary" | "reviewReasons" | "reviewState">,
  metadata: CadMetadataResult | undefined,
): Pick<PartPreviewAttachment, "reviewReasons" | "reviewState"> {
  if (attachment.modes[0] === "metadata") {
    return {
      reviewReasons: ["Attachment cannot be previewed directly."],
      reviewState: "unsupported",
    }
  }
  if (metadata?.metadataOnly || metadata?.status === "fallback") {
    return {
      reviewReasons: [`${attachment.fileName} only has metadata fallback coverage.`],
      reviewState: "metadata_only",
    }
  }
  if (metadata && metadata.warnings.length > 0) {
    return {
      reviewReasons: metadata.warnings,
      reviewState: "needs_review",
    }
  }
  return {
    reviewReasons: [],
    reviewState: "ready",
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
  attachmentNames: string[],
  cadMetadata: CadMetadataResult[],
): CadMetadataResult[] {
  if (attachmentNames.length > 0) {
    return cadMetadata
      .filter((metadata) => attachmentNames.some((attachmentName) => cadMetadataFileMatches(metadata.fileName, attachmentName)))
      .sort((left, right) => compareLex(left.fileName, right.fileName))
  }

  return cadMetadata
    .filter((metadata) => cadMetadataFileBelongsToPart(metadata.fileName, partNumber))
    .sort((left, right) => compareLex(left.fileName, right.fileName))
}

function findCadMetadataForAttachment(cadMetadata: CadMetadataResult[], attachmentFileName: string): CadMetadataResult | undefined {
  return cadMetadata.find((metadata) => cadMetadataFileMatches(metadata.fileName, attachmentFileName))
}

function rankAttachment(
  attachment: RfqAttachmentDraft,
  partNumber: string,
  attachmentNames: Set<string>,
  cadMetadata: CadMetadataResult | undefined,
): RankedPartPreviewAttachment {
  const modes = modesForAttachment(attachment.kind)
  const previewOutput = buildAttachmentPreviewOutput(attachment, cadMetadata)
  const score =
    modePriority[modes[0]] +
    (normalizeToken(attachment.fileName).includes(normalizeToken(partNumber)) ? 20 : 0) +
    (attachmentNames.has(normalizeToken(attachment.fileName)) ? 10 : 0)

  return {
    fileName: attachment.fileName,
    kind: attachment.kind,
    contentType: attachment.contentType,
    sizeBytes: attachment.sizeBytes,
    previewLabel: previewOutput.label,
    previewOutput,
    score,
    thumbnailLabel: previewOutput.thumbnailLabel,
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

function collectAvailableModes(attachments: RankedPartPreviewAttachment[]): PartPreviewMode[] {
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
  attachments: RankedPartPreviewAttachment[],
  measurementOverlays: PartMeasurementOverlay[],
  cadMetadata: CadMetadataResult[],
): string[] {
  const warnings: string[] = []
  if (primaryMode === "metadata") {
    warnings.push("No previewable attachment matched this part; using metadata-only preview.")
  } else if (primaryMode !== "cad" && attachments.some((attachment) => attachment.kind === "drawing" || attachment.kind === "photo")) {
    warnings.push(`CAD geometry is unavailable; using ${primaryModeWarningLabel(primaryMode)} preview.`)
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

function primaryModeWarningLabel(mode: PartPreviewMode): string {
  switch (mode) {
    case "cad":
      return "CAD"
    case "drawing":
      return "drawing"
    case "photo":
      return "photo"
    case "spreadsheet":
      return "spreadsheet"
    case "metadata":
      return "metadata-only"
  }
}

function buildManufacturabilityFlags(
  primaryMode: PartPreviewMode,
  cadMetadata: CadMetadataResult[],
  measurementOverlays: PartMeasurementOverlay[],
): string[] {
  const flags = new Set<string>()
  if (primaryMode !== "cad") {
    flags.add("cad_geometry_missing")
  }
  if (measurementOverlays.length === 0) {
    flags.add("dimensions_missing")
  }
  for (const metadata of cadMetadata) {
    if (metadata.metadataOnly) {
      flags.add("metadata_only_review")
    }
    for (const warning of metadata.warnings) {
      flags.add(normalizeFlag(warning))
    }
  }
  return [...flags].sort(compareLex)
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

function normalizeFlag(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  return normalized || "review_required"
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
