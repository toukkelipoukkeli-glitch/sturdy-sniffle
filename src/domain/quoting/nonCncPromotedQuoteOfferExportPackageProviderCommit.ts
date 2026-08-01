import {
  buildNonCncPromotedQuoteOfferExportPackageExecutionRun,
  type NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput,
  type NonCncPromotedQuoteOfferExportPackageExecutionRun,
} from "./nonCncPromotedQuoteOfferExportPackageExecution"
import type { NonCncPromotedQuoteOfferExportPackagePlan } from "./nonCncPromotedQuoteOfferExportPackagePlan"
import { fingerprintNonCncPromotedQuoteOfferExportPackageProviderPlan } from "./nonCncPromotedQuoteOfferExportPackageProvider"
import type { NonCncPromotedQuoteOfferExportPackageProviderReadModel } from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION =
  "non-cnc-promoted-quote-offer-export-package-provider-commit.v1"

export type NonCncPromotedQuoteOfferExportPackageProviderCommitStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteOfferExportPackageProviderCommitPlan {
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION
  status: NonCncPromotedQuoteOfferExportPackageProviderCommitStatus
  planId: string
  planVersion: NonCncPromotedQuoteOfferExportPackagePlan["planVersion"]
  planFingerprint: string
  providerStatus: NonCncPromotedQuoteOfferExportPackageProviderReadModel["providerStatus"]
  readModelStatus: NonCncPromotedQuoteOfferExportPackageProviderReadModel["status"]
  mode: NonCncPromotedQuoteOfferExportPackageProviderReadModel["mode"]
  artifactOutcomeCount: number
  artifactOutcomes: NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  offerExportBoundary: string
  creationPlanId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  sourceExecutionFingerprint?: string
}

export interface BuildNonCncPromotedQuoteOfferExportPackageProviderCommitPlanInput {
  plan: NonCncPromotedQuoteOfferExportPackagePlan
  readModel: NonCncPromotedQuoteOfferExportPackageProviderReadModel
}

export interface BuildNonCncPromotedQuoteOfferExportPackageProviderCommitRunInput
  extends BuildNonCncPromotedQuoteOfferExportPackageProviderCommitPlanInput {
  actor: string
  executedAt: string
}

export interface NonCncPromotedQuoteOfferExportPackageProviderCommitRunResult {
  commitPlan: NonCncPromotedQuoteOfferExportPackageProviderCommitPlan
  executionRun?: NonCncPromotedQuoteOfferExportPackageExecutionRun
}

export function buildNonCncPromotedQuoteOfferExportPackageProviderCommitPlan({
  plan,
  readModel,
}: BuildNonCncPromotedQuoteOfferExportPackageProviderCommitPlanInput): NonCncPromotedQuoteOfferExportPackageProviderCommitPlan {
  assertReadModelMatchesPlan(plan, readModel)
  const outcomeEntries = readModel.artifactOutcomes ?? []
  const outcomeBlockers = artifactOutcomeBlockers(plan, outcomeEntries)
  const blockerLabels = uniqueLabels([
    ...readModel.blockerLabels,
    ...(readModel.status === "ready_to_commit"
      ? []
      : ["Non-CNC offer export package provider read model must be ready before commit."]),
    ...(outcomeEntries.length === 0
      ? ["Non-CNC offer export package provider commit has no artifact outcomes."]
      : []),
    ...outcomeBlockers,
  ])
  const status = blockerLabels.length === 0 ? "ready" : "blocked"
  const artifactOutcomes = status === "ready" ? outcomeEntries.map(cloneArtifactOutcome) : []

  return {
    artifactOutcomeCount: artifactOutcomes.length,
    artifactOutcomes,
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commitVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION,
    creationPlanId: plan.creationPlanId,
    mode: readModel.mode,
    nextOperatorMessage:
      status === "ready"
        ? `Commit ${artifactOutcomes.length} reviewed non-CNC offer export package provider outcome${artifactOutcomes.length === 1 ? "" : "s"} into a deterministic execution audit.`
        : blockerLabels.join(" ") ||
          "Non-CNC offer export package provider commit is blocked until the read model is ready and matches the plan.",
    offerExportBoundary:
      "Provider outcome commit plans are deterministic audit inputs only; active RFQ quote, offer, release, export, and connector state stay unchanged until a later adapter applies them.",
    packageId: plan.packageId,
    planFingerprint: readModel.planFingerprint,
    planId: plan.planId,
    planVersion: plan.planVersion,
    providerStatus: readModel.providerStatus,
    readModelStatus: readModel.status,
    releaseExecutionFingerprint: status === "ready" ? plan.releaseExecutionFingerprint : undefined,
    reviewWarnings: [...readModel.reviewWarnings],
    selectedPlanId: plan.selectedPlanId,
    sourceExecutionFingerprint: status === "ready" ? plan.executionFingerprint : undefined,
    status,
    targetRfqId: status === "ready" ? plan.targetRfqId : undefined,
  }
}

export function buildNonCncPromotedQuoteOfferExportPackageProviderCommitRun(
  input: BuildNonCncPromotedQuoteOfferExportPackageProviderCommitRunInput,
): NonCncPromotedQuoteOfferExportPackageProviderCommitRunResult {
  const commitPlan = buildNonCncPromotedQuoteOfferExportPackageProviderCommitPlan(input)
  if (commitPlan.status !== "ready") {
    return { commitPlan }
  }

  return {
    commitPlan,
    executionRun: buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      actor: input.actor,
      artifactOutcomes: commitPlan.artifactOutcomes,
      executedAt: input.executedAt,
      mode: "commit",
      plan: input.plan,
    }),
  }
}

function assertReadModelMatchesPlan(
  plan: NonCncPromotedQuoteOfferExportPackagePlan,
  readModel: NonCncPromotedQuoteOfferExportPackageProviderReadModel,
): void {
  const expectedPlanFingerprint = fingerprintNonCncPromotedQuoteOfferExportPackageProviderPlan(plan)
  const mismatches = [
    plan.planId === readModel.planId ? undefined : "planId",
    expectedPlanFingerprint === readModel.planFingerprint ? undefined : "planFingerprint",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`non-CNC offer export package provider read model does not match plan: ${mismatches.join(", ")}`)
  }
}

function artifactOutcomeBlockers(
  plan: NonCncPromotedQuoteOfferExportPackagePlan,
  outcomes: NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput[],
): string[] {
  const blockers: string[] = []
  const outcomesByKey = new Map(outcomes.map((outcome) => [outcome.key, outcome]))
  const planKeys = plan.artifacts.map((artifact) => artifact.key)
  const outcomeKeys = outcomes.map((outcome) => outcome.key)
  if (planKeys.length !== outcomeKeys.length || planKeys.some((key, index) => key !== outcomeKeys[index])) {
    blockers.push("Non-CNC offer export package provider outcome list does not match the export package plan artifacts.")
  }

  for (const artifact of plan.artifacts) {
    const outcome = outcomesByKey.get(artifact.key)
    if (!outcome) {
      blockers.push(`Missing provider artifact outcome for ${artifact.label}.`)
      continue
    }
    if (outcome.status !== "succeeded") {
      blockers.push(`Provider artifact outcome for ${artifact.label} is ${outcome.status}; commit is blocked.`)
    }
    if (!outcome.artifactExternalId?.trim()) {
      blockers.push(`Provider artifact outcome for ${artifact.label} is missing an external id.`)
    }
  }
  return blockers
}

function cloneArtifactOutcome(
  outcome: NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput,
): NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput {
  return {
    artifactExternalId: outcome.artifactExternalId,
    fileName: outcome.fileName,
    key: outcome.key,
    message: outcome.message,
    status: outcome.status,
    warnings: outcome.warnings ? [...outcome.warnings] : undefined,
  }
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
