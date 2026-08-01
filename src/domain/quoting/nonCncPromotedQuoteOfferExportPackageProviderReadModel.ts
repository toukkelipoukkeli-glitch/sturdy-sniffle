import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type {
  NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput,
} from "./nonCncPromotedQuoteOfferExportPackageExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderResult,
} from "./nonCncPromotedQuoteOfferExportPackageProvider"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION =
  "non-cnc-promoted-quote-offer-export-package-provider-read-model.v1"

export type NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus = "blocked" | "ready_to_commit"

export interface NonCncPromotedQuoteOfferExportPackageProviderReadModel {
  readModelVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION
  providerVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION
  status: NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus
  providerStatus: NonCncPromotedQuoteOfferExportPackageProviderResult["status"]
  mode: NonCncPromotedQuoteOfferExportPackageProviderResult["mode"]
  planId: string
  planFingerprint: string
  artifactOutcomeCount: number
  readyOutcomeCount: number
  blockedOutcomeCount: number
  artifactOutcomeKeys: string[]
  blockerLabels: string[]
  nextOperatorMessage: string
  reviewWarnings: string[]
  offerExportBoundary: string
  artifactOutcomes?: NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput[]
}

export function buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(
  result: NonCncPromotedQuoteOfferExportPackageProviderResult,
): NonCncPromotedQuoteOfferExportPackageProviderReadModel {
  const providerVersion = normalizeProviderVersion(result.providerVersion)
  const mode = normalizeMode(result.mode)
  const providerStatus = normalizeProviderStatus(result.status)
  const planId = nonBlank(result.planId, "planId")
  const planFingerprint = nonBlank(result.planFingerprint, "planFingerprint")
  const reviewWarnings = uniqueLabels(result.warnings.map((warning) => warning.trim()).filter(Boolean))

  if (providerStatus === "blocked") {
    const blockerLabels = uniqueLabels([
      ...result.blockerLabels,
      "Non-CNC offer export package provider result is blocked; artifact outcomes are withheld.",
    ])
    return {
      artifactOutcomeCount: 0,
      artifactOutcomeKeys: [],
      blockedOutcomeCount: 0,
      blockerLabels,
      mode,
      nextOperatorMessage: blockerLabels.join(" "),
      offerExportBoundary:
        "Non-CNC offer export package provider read models are deterministic review data only; active RFQ quote, offer, release, export, and connector state stay unchanged until a later adapter applies them.",
      planFingerprint,
      planId,
      providerStatus,
      providerVersion,
      readModelVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION,
      readyOutcomeCount: 0,
      reviewWarnings,
      status: "blocked",
    }
  }

  const artifactOutcomes = normalizeArtifactOutcomes(result.artifactOutcomes ?? [])
  const blockerLabels = artifactOutcomes.length === 0
    ? ["Applied non-CNC offer export package provider result did not include artifact outcomes."]
    : []
  const status = blockerLabels.length === 0 ? "ready_to_commit" : "blocked"

  return {
    artifactOutcomeCount: artifactOutcomes.length,
    artifactOutcomeKeys: artifactOutcomes.map((outcome) => outcome.key),
    artifactOutcomes: status === "ready_to_commit" ? artifactOutcomes : undefined,
    blockedOutcomeCount: blockerLabels.length,
    blockerLabels,
    mode,
    nextOperatorMessage:
      status === "ready_to_commit"
        ? `Review and commit ${artifactOutcomes.length} non-CNC offer export package provider outcome${artifactOutcomes.length === 1 ? "" : "s"}.`
        : blockerLabels.join(" "),
    offerExportBoundary:
      "Non-CNC offer export package provider read models are deterministic review data only; active RFQ quote, offer, release, export, and connector state stay unchanged until a later adapter applies them.",
    planFingerprint,
    planId,
    providerStatus,
    providerVersion,
    readModelVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION,
    readyOutcomeCount: status === "ready_to_commit" ? artifactOutcomes.length : 0,
    reviewWarnings,
    status,
  }
}

function normalizeArtifactOutcomes(
  outcomes: NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput[],
): NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput[] {
  const seenKeys = new Set<string>()
  return outcomes.map((outcome, index) => {
    const key = normalizeArtifactKey(outcome.key, `artifactOutcomes[${index}].key`)
    if (seenKeys.has(key)) {
      throw new Error(`artifactOutcomes[${index}].key is duplicated`)
    }
    seenKeys.add(key)
    return {
      artifactExternalId: optionalTrim(outcome.artifactExternalId),
      fileName: optionalTrim(outcome.fileName),
      key,
      message: optionalTrim(outcome.message),
      status: normalizeOutcomeStatus(outcome.status, `artifactOutcomes[${index}].status`),
      warnings: uniqueLabels((outcome.warnings ?? []).map((warning) => warning.trim()).filter(Boolean)),
    }
  })
}

function normalizeArtifactKey(value: string, key: string): NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput["key"] {
  const normalized = nonBlank(value, key)
  if (
    normalized !== "customer_offer_draft" &&
    normalized !== "plain_text_export" &&
    normalized !== "pdf_export" &&
    normalized !== "release_review_packet"
  ) {
    throw new Error(`${key} must be a valid offer export package artifact key`)
  }
  return normalized
}

function normalizeOutcomeStatus(
  value: NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput["status"],
  key: string,
): NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput["status"] {
  if (value !== "failed" && value !== "succeeded") {
    throw new Error(`${key} must be failed or succeeded`)
  }
  return value
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportPackageProviderResult["mode"],
): NonCncPromotedQuoteOfferExportPackageProviderResult["mode"] {
  if (mode !== "local" && mode !== "mock") {
    throw new Error("provider mode must be local or mock")
  }
  return mode
}

function normalizeProviderStatus(
  status: NonCncPromotedQuoteOfferExportPackageProviderResult["status"],
): NonCncPromotedQuoteOfferExportPackageProviderResult["status"] {
  if (status !== "applied" && status !== "blocked") {
    throw new Error("provider status must be applied or blocked")
  }
  return status
}

function normalizeProviderVersion(
  version: NonCncPromotedQuoteOfferExportPackageProviderResult["providerVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION) {
    throw new Error("providerVersion is not a supported non-CNC offer export package provider version")
  }
  return version
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
