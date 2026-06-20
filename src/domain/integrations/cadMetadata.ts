import type { RfqAttachmentDraft, RfqAttachmentKind, RfqPartDraft, RfqProcessKey } from "../rfq/intake"

export const CAD_METADATA_ADAPTER_VERSION = "cad-metadata.v1"

export type CadMetadataProviderKey = "heuristic" | "step" | "dxf" | "pdf" | "mock" | "metadata_fallback"
export type CadMetadataFormat = "step" | "dxf" | "pdf" | "unknown"
export type CadMetadataStatus = "succeeded" | "fallback"

export interface CadMetadataDimensions {
  lengthMm?: number
  widthMm?: number
  heightMm?: number
  thicknessMm?: number
}

export interface CadMetadataInput {
  attachment: RfqAttachmentDraft
  part?: RfqPartDraft
}

export interface CadMetadataResult {
  adapterVersion: typeof CAD_METADATA_ADAPTER_VERSION
  provider: CadMetadataProviderKey
  status: CadMetadataStatus
  fileName: string
  format: CadMetadataFormat
  previewKind: RfqAttachmentKind
  dimensions?: CadMetadataDimensions
  materialText?: string
  process?: RfqProcessKey
  units: "mm" | "unknown"
  metadataOnly: boolean
  warnings: string[]
}

export interface CadMetadataProvider {
  provider: CadMetadataProviderKey
  inspect(input: CadMetadataInput): Promise<CadMetadataResult>
}

export interface CadMetadataAdapterOptions {
  provider?: CadMetadataProvider
  fallbackProvider?: CadMetadataProvider
}

export interface MockCadMetadataProviderOptions {
  results?: Record<string, Partial<CadMetadataResult>>
  shouldFail?: boolean
}

export function createCadMetadataAdapter(options: CadMetadataAdapterOptions = {}): CadMetadataProvider {
  const fallbackProvider = options.fallbackProvider ?? createMetadataOnlyCadProvider()
  const provider = options.provider ?? createHeuristicCadMetadataProvider()

  return {
    provider: provider.provider,
    async inspect(input) {
      try {
        return await provider.inspect(input)
      } catch (error) {
        const fallback = await fallbackProvider.inspect(input)
        return {
          ...fallback,
          warnings: [
            `CAD metadata provider ${provider.provider} failed: ${errorToMessage(error)}.`,
            ...fallback.warnings,
          ],
        }
      }
    },
  }
}

export function createHeuristicCadMetadataProvider(): CadMetadataProvider {
  return {
    provider: "heuristic",
    async inspect(input) {
      const attachment = normalizeAttachment(input.attachment)
      const format = detectFormat(attachment)
      const extractedText = input.attachment.extractedText ?? ""
      const dimensions = mergeDimensions(extractDimensions(extractedText), input.part?.dimensions)
      const materialText = extractMaterial(extractedText) ?? input.part?.materialText
      const process = input.part?.process ?? processForFormat(format)
      const warnings = buildWarnings(format, dimensions, false)

      return {
        adapterVersion: CAD_METADATA_ADAPTER_VERSION,
        provider: this.provider,
        status: "succeeded",
        fileName: attachment.fileName,
        format,
        previewKind: attachment.kind,
        dimensions,
        materialText,
        process,
        units: hasDimensions(dimensions) ? "mm" : "unknown",
        metadataOnly: false,
        warnings,
      }
    },
  }
}

export function createMetadataOnlyCadProvider(): CadMetadataProvider {
  return {
    provider: "metadata_fallback",
    async inspect(input) {
      const attachment = normalizeAttachment(input.attachment)
      const format = detectFormat(attachment)
      const dimensions = input.part?.dimensions

      return {
        adapterVersion: CAD_METADATA_ADAPTER_VERSION,
        provider: "metadata_fallback",
        status: "fallback",
        fileName: attachment.fileName,
        format,
        previewKind: attachment.kind,
        dimensions,
        materialText: input.part?.materialText,
        process: input.part?.process,
        units: hasDimensions(dimensions) ? "mm" : "unknown",
        metadataOnly: true,
        warnings: buildWarnings(format, dimensions, true),
      }
    },
  }
}

export function createMockCadMetadataProvider(options: MockCadMetadataProviderOptions = {}): CadMetadataProvider {
  return {
    provider: "mock",
    async inspect(input) {
      if (options.shouldFail) {
        throw new Error("Mock CAD metadata provider failure")
      }
      const fallback = await createHeuristicCadMetadataProvider().inspect(input)
      const override = options.results?.[input.attachment.fileName]

      return {
        ...fallback,
        ...override,
        adapterVersion: CAD_METADATA_ADAPTER_VERSION,
        provider: "mock",
        warnings: override?.warnings ?? fallback.warnings,
      }
    },
  }
}

function normalizeAttachment(attachment: RfqAttachmentDraft): RfqAttachmentDraft {
  const fileName = nonBlank(attachment.fileName, "attachment.fileName")
  return {
    ...attachment,
    fileName,
  }
}

function detectFormat(attachment: RfqAttachmentDraft): CadMetadataFormat {
  const fileName = attachment.fileName.toLowerCase()
  const contentType = attachment.contentType?.toLowerCase()
  if (/\.(step|stp)$/.test(fileName) || contentType?.includes("step")) {
    return "step"
  }
  if (/\.dxf$/.test(fileName) || contentType?.includes("dxf")) {
    return "dxf"
  }
  if (/\.pdf$/.test(fileName) || contentType === "application/pdf") {
    return "pdf"
  }
  return "unknown"
}

function extractDimensions(text: string): CadMetadataDimensions | undefined {
  const normalized = text.replace(/,/g, ".")
  const boxMatch = /\b(?:bbox|bounding box|dimensions?)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm\b/i.exec(normalized)
  if (boxMatch) {
    return {
      lengthMm: Number(boxMatch[1]),
      widthMm: Number(boxMatch[2]),
      heightMm: Number(boxMatch[3]),
    }
  }

  const flatMatch = /\b(?:size|dimensions?)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:x\s*)?(?:t(?:hickness)?\s*)?(\d+(?:\.\d+)?)?\s*mm\b/i.exec(normalized)
  if (!flatMatch) {
    return undefined
  }

  return {
    lengthMm: Number(flatMatch[1]),
    widthMm: Number(flatMatch[2]),
    thicknessMm: flatMatch[3] ? Number(flatMatch[3]) : undefined,
  }
}

function mergeDimensions(primary: CadMetadataDimensions | undefined, fallback: CadMetadataDimensions | undefined): CadMetadataDimensions | undefined {
  if (!primary && !fallback) {
    return undefined
  }
  const merged = {
    ...fallback,
  }
  for (const [key, value] of Object.entries(primary ?? {})) {
    if (typeof value === "number" && Number.isFinite(value)) {
      merged[key as keyof CadMetadataDimensions] = value
    }
  }
  return merged
}

function extractMaterial(text: string): string | undefined {
  return (
    /\b(?:material|mat)\s*[:=]\s*([A-Za-z0-9 -]{2,40})/i.exec(text)?.[1]?.trim() ??
    /\b(?:aluminum|aluminium|stainless steel|steel|pom|peek|ptfe)\s*[A-Za-z0-9-]*/i.exec(text)?.[0]?.trim()
  )
}

function processForFormat(format: CadMetadataFormat): RfqProcessKey | undefined {
  if (format === "dxf") {
    return "sheet_metal"
  }
  if (format === "step") {
    return "cnc_milling"
  }
  return undefined
}

function buildWarnings(format: CadMetadataFormat, dimensions: CadMetadataDimensions | undefined, metadataOnly: boolean): string[] {
  const warnings: string[] = []
  if (metadataOnly) {
    warnings.push("CAD parser unavailable; using attachment and RFQ metadata only.")
  }
  if (format === "unknown") {
    warnings.push("Attachment format is not supported by the CAD metadata adapter.")
  }
  if (!hasDimensions(dimensions)) {
    warnings.push("No CAD dimensions were extracted.")
  }
  return warnings
}

function hasDimensions(dimensions: CadMetadataDimensions | undefined): boolean {
  return Object.values(dimensions ?? {}).some((value) => typeof value === "number" && Number.isFinite(value))
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
