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
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
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
