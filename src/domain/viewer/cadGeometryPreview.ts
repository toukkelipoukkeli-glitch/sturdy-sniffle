import type { CadMetadataDimensions, CadMetadataFormat, CadMetadataResult } from "../integrations/cadMetadata"
import { cadMetadataFileMatches } from "./cadMetadataFileMatch"

export const CAD_GEOMETRY_PREVIEW_VERSION = "cad-geometry-preview.v1"

export type CadGeometryPreviewProviderKey = "metadata_geometry" | "metadata_fallback" | "mock"
export type CadGeometryPreviewStatus = "ready" | "fallback"
export type CadGeometryPreviewKind = "step_bounding_box" | "dxf_flat_pattern" | "metadata_card"
export type CadGeometryPreviewRenderer = "step-metadata-bounds" | "dxf-metadata-outline" | "metadata-card"

export interface CadGeometryPreviewInput {
  fileName: string
  cadMetadata?: CadMetadataResult
}

export interface CadGeometryPreviewAdapterOptions {
  provider?: CadGeometryPreviewProvider
  fallbackProvider?: CadGeometryPreviewProvider
}

export interface MockCadGeometryPreviewProviderOptions {
  result?: Partial<CadGeometryPreviewResult>
  shouldFail?: boolean
}

export interface CadGeometryPreviewProvider {
  provider: CadGeometryPreviewProviderKey
  build(input: CadGeometryPreviewInput): CadGeometryPreviewResult
}

export interface CadGeometryPreviewPoint {
  xMm: number
  yMm: number
}

export interface CadGeometryPreviewOutlineSegment {
  key: string
  from: CadGeometryPreviewPoint
  to: CadGeometryPreviewPoint
}

export interface CadGeometryPreviewBounds {
  lengthMm: number
  widthMm: number
  heightMm?: number
  thicknessMm?: number
}

export interface CadGeometryPreviewResult {
  adapterVersion: typeof CAD_GEOMETRY_PREVIEW_VERSION
  provider: CadGeometryPreviewProviderKey
  status: CadGeometryPreviewStatus
  fileName: string
  format: CadMetadataFormat
  previewKind: CadGeometryPreviewKind
  renderer: CadGeometryPreviewRenderer
  units: "mm" | "unknown"
  bounds?: CadGeometryPreviewBounds
  outlineSegments: CadGeometryPreviewOutlineSegment[]
  layerCount?: number
  warnings: string[]
}

export function createCadGeometryPreviewAdapter(options: CadGeometryPreviewAdapterOptions = {}): CadGeometryPreviewProvider {
  const provider = options.provider ?? createMetadataCadGeometryPreviewProvider()
  const fallbackProvider = options.fallbackProvider ?? createMetadataFallbackCadGeometryPreviewProvider()

  return {
    provider: provider.provider,
    build(input) {
      try {
        return provider.build(input)
      } catch (error) {
        const fallback = fallbackProvider.build(input)
        return {
          ...fallback,
          warnings: [
            `CAD geometry provider ${provider.provider} failed: ${errorToMessage(error)}.`,
            ...fallback.warnings,
          ],
        }
      }
    },
  }
}

export function createMetadataCadGeometryPreviewProvider(): CadGeometryPreviewProvider {
  return {
    provider: "metadata_geometry",
    build(input) {
      const fileName = nonBlank(input.fileName, "fileName")
      const metadata = input.cadMetadata
      const metadataMatches = metadata ? cadMetadataFileMatches(metadata.fileName, fileName) : false
      if (!metadata || !metadataMatches) {
        return buildFallbackResult({
          fileName,
          format: detectFormat(fileName),
          provider: this.provider,
          units: "unknown",
          warnings: metadata
            ? ["CAD metadata does not match the requested attachment; using metadata-only geometry preview."]
            : ["No CAD metadata available for geometry preview."],
        })
      }

      if (metadata.status !== "succeeded" || metadata.metadataOnly) {
        return buildFallbackFromMetadata(fileName, metadata, this.provider, [
          "CAD metadata is fallback-only; using metadata-only geometry preview.",
        ])
      }

      if (metadata.format === "step") {
        return buildStepPreview(fileName, metadata, this.provider)
      }
      if (metadata.format === "dxf") {
        return buildDxfPreview(fileName, metadata, this.provider)
      }

      return buildFallbackFromMetadata(fileName, metadata, this.provider, [
        "CAD geometry preview supports STEP and DXF metadata only.",
      ])
    },
  }
}

export function createMetadataFallbackCadGeometryPreviewProvider(): CadGeometryPreviewProvider {
  return {
    provider: "metadata_fallback",
    build(input) {
      const fileName = nonBlank(input.fileName, "fileName")
      const metadata = input.cadMetadata
      if (!metadata || !cadMetadataFileMatches(metadata.fileName, fileName)) {
        return buildFallbackResult({
          fileName,
          format: detectFormat(fileName),
          provider: this.provider,
          units: "unknown",
          warnings: metadata
            ? ["CAD metadata does not match the requested attachment; using metadata-only geometry preview."]
            : ["No CAD metadata available for geometry preview."],
        })
      }

      return buildFallbackFromMetadata(fileName, metadata, this.provider, [
        "CAD geometry parser unavailable; using metadata-only geometry preview.",
      ])
    },
  }
}

export function createMockCadGeometryPreviewProvider(options: MockCadGeometryPreviewProviderOptions = {}): CadGeometryPreviewProvider {
  return {
    provider: "mock",
    build(input) {
      if (options.shouldFail) {
        throw new Error("Mock CAD geometry preview provider failure")
      }
      const fallback = createMetadataCadGeometryPreviewProvider().build(input)

      return {
        ...fallback,
        ...options.result,
        adapterVersion: CAD_GEOMETRY_PREVIEW_VERSION,
        provider: "mock",
        warnings: options.result?.warnings ?? fallback.warnings,
      }
    },
  }
}

function buildStepPreview(
  fileName: string,
  metadata: CadMetadataResult,
  provider: CadGeometryPreviewProviderKey,
): CadGeometryPreviewResult {
  const dimensions = readStepBounds(metadata.dimensions)
  if (!dimensions) {
    return buildFallbackFromMetadata(fileName, metadata, provider, [
      "STEP geometry preview requires length, width, and height or thickness dimensions.",
    ])
  }

  return {
    adapterVersion: CAD_GEOMETRY_PREVIEW_VERSION,
    provider,
    status: "ready",
    fileName,
    format: "step",
    previewKind: "step_bounding_box",
    renderer: "step-metadata-bounds",
    units: "mm",
    bounds: dimensions,
    outlineSegments: rectangleOutline(dimensions.lengthMm, dimensions.widthMm),
    warnings: unique(metadata.warnings),
  }
}

function buildDxfPreview(
  fileName: string,
  metadata: CadMetadataResult,
  provider: CadGeometryPreviewProviderKey,
): CadGeometryPreviewResult {
  const dimensions = readFlatBounds(metadata.dimensions)
  if (!dimensions) {
    return buildFallbackFromMetadata(fileName, metadata, provider, [
      "DXF geometry preview requires length and width dimensions.",
    ])
  }

  return {
    adapterVersion: CAD_GEOMETRY_PREVIEW_VERSION,
    provider,
    status: "ready",
    fileName,
    format: "dxf",
    previewKind: "dxf_flat_pattern",
    renderer: "dxf-metadata-outline",
    units: "mm",
    bounds: dimensions,
    outlineSegments: rectangleOutline(dimensions.lengthMm, dimensions.widthMm),
    layerCount: 1,
    warnings: unique(metadata.warnings),
  }
}

function buildFallbackFromMetadata(
  fileName: string,
  metadata: CadMetadataResult,
  provider: CadGeometryPreviewProviderKey,
  warnings: string[],
): CadGeometryPreviewResult {
  return buildFallbackResult({
    fileName,
    format: metadata.format,
    provider,
    units: metadata.units,
    warnings: [...warnings, ...metadata.warnings],
  })
}

function buildFallbackResult(input: {
  fileName: string
  format: CadMetadataFormat
  provider: CadGeometryPreviewProviderKey
  units: "mm" | "unknown"
  warnings: string[]
}): CadGeometryPreviewResult {
  return {
    adapterVersion: CAD_GEOMETRY_PREVIEW_VERSION,
    provider: input.provider,
    status: "fallback",
    fileName: input.fileName,
    format: input.format,
    previewKind: "metadata_card",
    renderer: "metadata-card",
    units: input.units,
    outlineSegments: [],
    warnings: unique(input.warnings),
  }
}

function readStepBounds(dimensions: CadMetadataDimensions | undefined): CadGeometryPreviewBounds | undefined {
  const flat = readFlatBounds(dimensions)
  const heightMm = positiveFinite(dimensions?.heightMm) ?? positiveFinite(dimensions?.thicknessMm)
  if (!flat || heightMm === undefined) {
    return undefined
  }

  return {
    ...flat,
    heightMm,
  }
}

function readFlatBounds(dimensions: CadMetadataDimensions | undefined): CadGeometryPreviewBounds | undefined {
  const lengthMm = positiveFinite(dimensions?.lengthMm)
  const widthMm = positiveFinite(dimensions?.widthMm)
  if (lengthMm === undefined || widthMm === undefined) {
    return undefined
  }
  const thicknessMm = positiveFinite(dimensions?.thicknessMm)

  return {
    lengthMm,
    widthMm,
    ...(thicknessMm === undefined ? {} : { thicknessMm }),
  }
}

function rectangleOutline(lengthMm: number, widthMm: number): CadGeometryPreviewOutlineSegment[] {
  return [
    {
      key: "edge-bottom",
      from: { xMm: 0, yMm: 0 },
      to: { xMm: lengthMm, yMm: 0 },
    },
    {
      key: "edge-right",
      from: { xMm: lengthMm, yMm: 0 },
      to: { xMm: lengthMm, yMm: widthMm },
    },
    {
      key: "edge-top",
      from: { xMm: lengthMm, yMm: widthMm },
      to: { xMm: 0, yMm: widthMm },
    },
    {
      key: "edge-left",
      from: { xMm: 0, yMm: widthMm },
      to: { xMm: 0, yMm: 0 },
    },
  ]
}

function detectFormat(fileName: string): CadMetadataFormat {
  const normalized = fileName.toLowerCase()
  if (/\.(step|stp)$/.test(normalized)) {
    return "step"
  }
  if (/\.dxf$/.test(normalized)) {
    return "dxf"
  }
  if (/\.pdf$/.test(normalized)) {
    return "pdf"
  }
  return "unknown"
}

function positiveFinite(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
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
