import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
  NonCncPromotedQuoteOfferCreationOutcomeCommitTarget,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION =
  "non-cnc-promoted-quote-offer-export-package-plan.v1"

export type NonCncPromotedQuoteOfferExportPackagePlanStatus = "blocked" | "ready"
export type NonCncPromotedQuoteOfferExportPackageArtifactKey =
  | "customer_offer_draft"
  | "plain_text_export"
  | "pdf_export"
  | "release_review_packet"

export interface NonCncPromotedQuoteOfferExportPackageArtifact {
  key: NonCncPromotedQuoteOfferExportPackageArtifactKey
  label: string
  status: NonCncPromotedQuoteOfferExportPackagePlanStatus
  sourceTarget: NonCncPromotedQuoteOfferCreationOutcomeCommitTarget
  blockerLabels: string[]
  artifactId?: string
  fileName?: string
}

export interface NonCncPromotedQuoteOfferExportPackagePlan {
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION
  planId: string
  status: NonCncPromotedQuoteOfferExportPackagePlanStatus
  requestedAt: string
  requestedBy: string
  artifactCount: number
  artifacts: NonCncPromotedQuoteOfferExportPackageArtifact[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  offerExportBoundary: string
  creationPlanId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  executionFingerprint?: string
}

export interface BuildNonCncPromotedQuoteOfferExportPackagePlanInput {
  readModel: NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel
  requestedAt: string
  requestedBy: string
}

const artifactMeta = [
  {
    key: "customer_offer_draft",
    label: "Customer offer draft descriptor",
    sourceTarget: "customer_offer",
  },
  {
    key: "plain_text_export",
    label: "Plain-text export descriptor",
    sourceTarget: "export_package",
  },
  {
    key: "pdf_export",
    label: "PDF export descriptor",
    sourceTarget: "export_package",
  },
  {
    key: "release_review_packet",
    label: "Release review packet descriptor",
    sourceTarget: "release_review",
  },
] satisfies Array<{
  key: NonCncPromotedQuoteOfferExportPackageArtifactKey
  label: string
  sourceTarget: NonCncPromotedQuoteOfferCreationOutcomeCommitTarget
}>

export function buildNonCncPromotedQuoteOfferExportPackagePlan({
  readModel,
  requestedAt,
  requestedBy,
}: BuildNonCncPromotedQuoteOfferExportPackagePlanInput): NonCncPromotedQuoteOfferExportPackagePlan {
  const normalizedRequestedAt = normalizeIsoTimestamp(requestedAt, "requestedAt")
  const normalizedRequestedBy = nonBlank(requestedBy, "requestedBy")
  const blockerLabels = exportPackageBlockers(readModel)
  const ready = blockerLabels.length === 0
  const planId = buildPlanId(readModel, normalizedRequestedAt)
  const artifacts = artifactMeta.map((artifact) =>
    buildArtifact({
      artifact,
      blockerLabels,
      planId,
      readModel,
      ready,
    }),
  )

  return {
    artifactCount: ready ? artifacts.length : 0,
    artifacts,
    blockerLabels,
    creationPlanId: readModel.creationPlanId,
    executionFingerprint: ready ? readModel.executionFingerprint : undefined,
    nextOperatorMessage: ready
      ? "Reviewed non-CNC customer-offer outcomes are ready for a future export package adapter."
      : "Resolve customer-offer creation read-model blockers before preparing export package artifacts.",
    offerExportBoundary:
      "Non-CNC offer export package plans are deterministic adapter descriptors only; building this plan does not create customer offers, files, release reviews, or connector side effects.",
    packageId: readModel.packageId,
    planId,
    planVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION,
    releaseExecutionFingerprint: ready ? readModel.releaseExecutionFingerprint : undefined,
    requestedAt: normalizedRequestedAt,
    requestedBy: normalizedRequestedBy,
    reviewWarnings: [...readModel.reviewWarnings],
    selectedPlanId: readModel.selectedPlanId,
    status: ready ? "ready" : "blocked",
    targetRfqId: ready ? readModel.targetRfqId : undefined,
  }
}

function buildArtifact({
  artifact,
  blockerLabels,
  planId,
  readModel,
  ready,
}: {
  artifact: (typeof artifactMeta)[number]
  blockerLabels: string[]
  planId: string
  readModel: NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel
  ready: boolean
}): NonCncPromotedQuoteOfferExportPackageArtifact {
  const artifactBlockers = ready
    ? []
    : uniqueLabels([
        ...blockerLabels,
        ...(readModel.creationTargets.includes(artifact.sourceTarget)
          ? []
          : [`${artifact.label} requires ${artifact.sourceTarget} readiness.`]),
      ])

  return {
    artifactId: ready ? buildArtifactId(planId, artifact.key) : undefined,
    blockerLabels: artifactBlockers,
    fileName: ready ? artifactFileName(readModel, artifact.key) : undefined,
    key: artifact.key,
    label: artifact.label,
    sourceTarget: artifact.sourceTarget,
    status: ready ? "ready" : "blocked",
  }
}

function exportPackageBlockers(readModel: NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel): string[] {
  return uniqueLabels([
    ...(readModel.status === "ready_to_create"
      ? []
      : ["Customer-offer creation outcome commit read model is not ready."]),
    ...(readModel.committedOutcomeCount > 0 ? [] : ["Customer-offer creation read model has no committed outcomes."]),
    ...(readModel.creationPlanId ? [] : ["Customer-offer creation plan id is missing."]),
    ...(readModel.packageId ? [] : ["Customer-offer creation package id is missing."]),
    ...(readModel.selectedPlanId ? [] : ["Customer-offer creation selected plan id is missing."]),
    ...(readModel.targetRfqId ? [] : ["Customer-offer creation target RFQ is missing."]),
    ...(readModel.executionFingerprint ? [] : ["Customer-offer creation execution fingerprint is missing."]),
    ...(readModel.releaseExecutionFingerprint ? [] : ["Customer-offer creation release execution fingerprint is missing."]),
    ...missingTargets(readModel.creationTargets),
    ...readModel.blockerLabels,
  ])
}

function missingTargets(targets: NonCncPromotedQuoteOfferCreationOutcomeCommitTarget[]): string[] {
  const targetSet = new Set(targets)
  return [
    ...(targetSet.has("customer_offer") ? [] : ["Customer-offer creation target is missing."]),
    ...(targetSet.has("export_package") ? [] : ["Export package creation target is missing."]),
    ...(targetSet.has("release_review") ? [] : ["Release review target is missing."]),
  ]
}

function buildPlanId(
  readModel: NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
  requestedAt: string,
): string {
  return `non-cnc-promoted-quote-offer-export-package-plan-${fingerprint(
    stableJson({
      creationPlanId: readModel.creationPlanId,
      executionFingerprint: readModel.executionFingerprint,
      packageId: readModel.packageId,
      releaseExecutionFingerprint: readModel.releaseExecutionFingerprint,
      requestedAt,
      selectedPlanId: readModel.selectedPlanId,
      targetRfqId: readModel.targetRfqId,
    }),
  )}`
}

function buildArtifactId(planId: string, key: NonCncPromotedQuoteOfferExportPackageArtifactKey): string {
  return `non-cnc-offer-export-artifact:${key}:${fingerprint(stableJson({ key, planId }))}`
}

function artifactFileName(
  readModel: NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
  key: NonCncPromotedQuoteOfferExportPackageArtifactKey,
): string | undefined {
  const baseName = sanitizeFileComponent(`${readModel.targetRfqId ?? "non-cnc"}-${readModel.packageId ?? "offer"}`)
  switch (key) {
    case "customer_offer_draft":
      return undefined
    case "plain_text_export":
      return `${baseName}.txt`
    case "pdf_export":
      return `${baseName}.pdf`
    case "release_review_packet":
      return `${baseName}-release-review.json`
    default:
      return assertNever(key)
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function fingerprint(value: string): string {
  return sha256(value).slice(0, 32)
}

function sanitizeFileComponent(value: string): string {
  return nonBlank(value, "fileName").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "non-cnc-offer"
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function assertNever(value: never): never {
  throw new Error(`Unsupported non-CNC offer export package artifact: ${JSON.stringify(value)}`)
}

function sha256(input: string): string {
  const bytes = new TextEncoder().encode(input)
  const words = new Uint32Array(64)
  const hash = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])
  const constants = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ])
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const bitLength = bytes.length * 8
  for (let index = 0; index < 8; index += 1) {
    padded[padded.length - 1 - index] = (bitLength / 2 ** (index * 8)) & 0xff
  }

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const byteIndex = offset + index * 4
      words[index] =
        (padded[byteIndex] << 24) |
        (padded[byteIndex + 1] << 16) |
        (padded[byteIndex + 2] << 8) |
        padded[byteIndex + 3]
    }
    for (let index = 16; index < 64; index += 1) {
      words[index] = add32(sigma1(words[index - 2]), words[index - 7], sigma0(words[index - 15]), words[index - 16])
    }

    let [a, b, c, d, e, f, g, h] = hash
    for (let index = 0; index < 64; index += 1) {
      const temp1 = add32(h, bigSigma1(e), choose(e, f, g), constants[index], words[index])
      const temp2 = add32(bigSigma0(a), majority(a, b, c))
      h = g
      g = f
      f = e
      e = add32(d, temp1)
      d = c
      c = b
      b = a
      a = add32(temp1, temp2)
    }
    hash[0] = add32(hash[0], a)
    hash[1] = add32(hash[1], b)
    hash[2] = add32(hash[2], c)
    hash[3] = add32(hash[3], d)
    hash[4] = add32(hash[4], e)
    hash[5] = add32(hash[5], f)
    hash[6] = add32(hash[6], g)
    hash[7] = add32(hash[7], h)
  }

  return [...hash].map((word) => word.toString(16).padStart(8, "0")).join("")
}

function add32(...values: number[]): number {
  return values.reduce((total, value) => (total + value) >>> 0, 0)
}

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits))
}

function choose(x: number, y: number, z: number): number {
  return (x & y) ^ (~x & z)
}

function majority(x: number, y: number, z: number): number {
  return (x & y) ^ (x & z) ^ (y & z)
}

function bigSigma0(value: number): number {
  return rotateRight(value, 2) ^ rotateRight(value, 13) ^ rotateRight(value, 22)
}

function bigSigma1(value: number): number {
  return rotateRight(value, 6) ^ rotateRight(value, 11) ^ rotateRight(value, 25)
}

function sigma0(value: number): number {
  return rotateRight(value, 7) ^ rotateRight(value, 18) ^ (value >>> 3)
}

function sigma1(value: number): number {
  return rotateRight(value, 17) ^ rotateRight(value, 19) ^ (value >>> 10)
}
