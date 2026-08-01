import { nonBlank } from "../shared/stringValidation"
import type { NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput } from "./nonCncPromotedQuoteOfferExportPackageExecution"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
  type NonCncPromotedQuoteOfferExportPackageArtifact,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION =
  "non-cnc-promoted-quote-offer-export-package-provider.v1"

export type NonCncPromotedQuoteOfferExportPackageProviderMode = "local" | "mock"
export type NonCncPromotedQuoteOfferExportPackageProviderResultStatus = "applied" | "blocked"

export interface NonCncPromotedQuoteOfferExportPackageProviderResult {
  providerVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION
  mode: NonCncPromotedQuoteOfferExportPackageProviderMode
  status: NonCncPromotedQuoteOfferExportPackageProviderResultStatus
  planId: string
  planFingerprint: string
  blockerLabels: string[]
  warnings: string[]
  artifactOutcomes?: NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput[]
}

export interface NonCncPromotedQuoteOfferExportPackageProvider {
  exportPackage(
    plan: NonCncPromotedQuoteOfferExportPackagePlan,
  ): Promise<NonCncPromotedQuoteOfferExportPackageProviderResult>
}

export interface LocalNonCncPromotedQuoteOfferExportPackageProviderOptions {
  externalIdPrefix?: string
  mode?: NonCncPromotedQuoteOfferExportPackageProviderMode
}

const LOCAL_PROVIDER_WARNING =
  "Local non-CNC offer export package provider recorded artifact outcomes; no customer-offer, file, release-review, or connector write was made."

export function createLocalNonCncPromotedQuoteOfferExportPackageProvider({
  externalIdPrefix = "local-non-cnc-offer-export",
  mode = "local",
}: LocalNonCncPromotedQuoteOfferExportPackageProviderOptions = {}): NonCncPromotedQuoteOfferExportPackageProvider {
  const normalizedExternalIdPrefix = nonBlank(externalIdPrefix, "externalIdPrefix")
  const normalizedMode = normalizeMode(mode)

  return {
    async exportPackage(plan) {
      return buildLocalNonCncPromotedQuoteOfferExportPackageProviderResult(plan, {
        externalIdPrefix: normalizedExternalIdPrefix,
        mode: normalizedMode,
      })
    },
  }
}

export function buildLocalNonCncPromotedQuoteOfferExportPackageProviderResult(
  plan: NonCncPromotedQuoteOfferExportPackagePlan,
  {
    externalIdPrefix = "local-non-cnc-offer-export",
    mode = "local",
  }: LocalNonCncPromotedQuoteOfferExportPackageProviderOptions = {},
): NonCncPromotedQuoteOfferExportPackageProviderResult {
  const normalizedExternalIdPrefix = nonBlank(externalIdPrefix, "externalIdPrefix")
  const normalizedMode = normalizeMode(mode)
  const planFingerprint = fingerprintNonCncPromotedQuoteOfferExportPackageProviderPlan(plan)
  const blockerLabels = validateReadyPlan(plan)
  if (blockerLabels.length > 0) {
    return {
      blockerLabels,
      mode: normalizedMode,
      planFingerprint,
      planId: plan.planId,
      providerVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION,
      status: "blocked",
      warnings: [],
    }
  }

  return {
    artifactOutcomes: plan.artifacts.map((artifact) =>
      buildArtifactOutcome({
        artifact,
        externalIdPrefix: normalizedExternalIdPrefix,
        plan,
        planFingerprint,
      }),
    ),
    blockerLabels: [],
    mode: normalizedMode,
    planFingerprint,
    planId: plan.planId,
    providerVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION,
    status: "applied",
    warnings: [LOCAL_PROVIDER_WARNING],
  }
}

export function fingerprintNonCncPromotedQuoteOfferExportPackageProviderPlan(
  plan: NonCncPromotedQuoteOfferExportPackagePlan,
): string {
  return `non-cnc-promoted-quote-offer-export-package-provider-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({
      artifactCount: plan.artifactCount,
      artifacts: plan.artifacts.map((artifact) => ({
        artifactId: artifact.artifactId,
        fileName: artifact.fileName,
        key: artifact.key,
        sourceTarget: artifact.sourceTarget,
        status: artifact.status,
      })),
      creationPlanId: plan.creationPlanId,
      packageId: plan.packageId,
      planId: plan.planId,
      planVersion: plan.planVersion,
      releaseExecutionFingerprint: plan.releaseExecutionFingerprint,
      selectedPlanId: plan.selectedPlanId,
      sourceExecutionFingerprint: plan.executionFingerprint,
      status: plan.status,
      targetRfqId: plan.targetRfqId,
    }),
  )}`
}

function validateReadyPlan(plan: NonCncPromotedQuoteOfferExportPackagePlan): string[] {
  const blockerLabels = [...plan.blockerLabels]
  if (plan.status !== "ready") {
    blockerLabels.push(`Non-CNC offer export package plan is ${plan.status}; local provider export is blocked.`)
  }
  if (plan.artifactCount <= 0) {
    blockerLabels.push("Non-CNC offer export package plan has no provider-ready artifacts.")
  }
  if (!plan.targetRfqId) {
    blockerLabels.push("Non-CNC offer export package plan is missing a target RFQ.")
  }
  if (!plan.releaseExecutionFingerprint) {
    blockerLabels.push("Non-CNC offer export package plan is missing release execution evidence.")
  }
  if (!plan.executionFingerprint) {
    blockerLabels.push("Non-CNC offer export package plan is missing source customer-offer execution evidence.")
  }

  for (const artifact of plan.artifacts) {
    if (artifact.status !== "ready") {
      blockerLabels.push(`${artifact.label} is ${artifact.status}; local provider export is blocked.`)
    }
    if (!artifact.artifactId) {
      blockerLabels.push(`${artifact.label} is missing an artifact id.`)
    }
  }

  return uniqueLabels(blockerLabels)
}

function buildArtifactOutcome({
  artifact,
  externalIdPrefix,
  plan,
  planFingerprint,
}: {
  artifact: NonCncPromotedQuoteOfferExportPackageArtifact
  externalIdPrefix: string
  plan: NonCncPromotedQuoteOfferExportPackagePlan
  planFingerprint: string
}): NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput {
  return {
    artifactExternalId: `${externalIdPrefix}:${artifact.key}:${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
      stableJson({
        artifactId: artifact.artifactId,
        key: artifact.key,
        planFingerprint,
      }),
    )}`,
    fileName: artifact.fileName,
    key: artifact.key,
    message: providerOutcomeMessage(plan, artifact),
    status: "succeeded",
    warnings: [LOCAL_PROVIDER_WARNING],
  }
}

function providerOutcomeMessage(
  plan: NonCncPromotedQuoteOfferExportPackagePlan,
  artifact: NonCncPromotedQuoteOfferExportPackageArtifact,
): string {
  switch (artifact.key) {
    case "customer_offer_draft":
      return `Customer offer draft recorded locally for ${plan.targetRfqId}.`
    case "plain_text_export":
      return `Plain-text offer export recorded locally as ${artifact.fileName}.`
    case "pdf_export":
      return `PDF offer export recorded locally as ${artifact.fileName}.`
    case "release_review_packet":
      return `Release review packet recorded locally as ${artifact.fileName}.`
    default:
      return assertNever(artifact.key)
  }
}

function normalizeMode(
  mode: NonCncPromotedQuoteOfferExportPackageProviderMode,
): NonCncPromotedQuoteOfferExportPackageProviderMode {
  if (mode !== "local" && mode !== "mock") {
    throw new Error("non-CNC offer export package provider mode must be local or mock")
  }
  return mode
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

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function assertNever(value: never): never {
  throw new Error(`Unsupported non-CNC offer export package artifact: ${JSON.stringify(value)}`)
}
