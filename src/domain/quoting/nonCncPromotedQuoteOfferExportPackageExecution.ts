import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_ARTIFACT_KEYS,
  type NonCncPromotedQuoteOfferExportPackageArtifact,
  type NonCncPromotedQuoteOfferExportPackageArtifactKey,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION =
  "non-cnc-promoted-quote-offer-export-package-execution.v1"

export type NonCncPromotedQuoteOfferExportPackageExecutionMode = "commit" | "dry_run"
export type NonCncPromotedQuoteOfferExportPackageExecutionStatus =
  | "blocked"
  | "failed"
  | "partial"
  | "pending"
  | "prepared"
  | "succeeded"
export type NonCncPromotedQuoteOfferExportPackageArtifactExecutionStatus =
  | "blocked"
  | "failed"
  | "pending"
  | "prepared"
  | "succeeded"

export interface NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput {
  key: string
  status: "failed" | "succeeded"
  artifactExternalId?: string
  fileName?: string
  message?: string
  warnings?: string[]
}

export interface NonCncPromotedQuoteOfferExportPackageArtifactExecution {
  key: NonCncPromotedQuoteOfferExportPackageArtifactKey
  label: string
  status: NonCncPromotedQuoteOfferExportPackageArtifactExecutionStatus
  sourceTarget: NonCncPromotedQuoteOfferExportPackageArtifact["sourceTarget"]
  idempotencyKey: string
  blockerLabels: string[]
  artifactId?: string
  plannedFileName?: string
  artifactExternalId?: string
  fileName?: string
  message?: string
  warnings: string[]
}

export interface NonCncPromotedQuoteOfferExportPackageExecutionRun {
  executionVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION
  executionFingerprint: string
  actor: string
  executedAt: string
  mode: NonCncPromotedQuoteOfferExportPackageExecutionMode
  status: NonCncPromotedQuoteOfferExportPackageExecutionStatus
  planId: string
  planVersion: NonCncPromotedQuoteOfferExportPackagePlan["planVersion"]
  artifactCount: number
  artifacts: NonCncPromotedQuoteOfferExportPackageArtifactExecution[]
  nextActions: string[]
  warnings: string[]
  offerExportBoundary: string
  creationPlanId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  sourceExecutionFingerprint?: string
}

export interface BuildNonCncPromotedQuoteOfferExportPackageExecutionRunInput {
  actor: string
  artifactOutcomes?: NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput[]
  executedAt: string
  mode: NonCncPromotedQuoteOfferExportPackageExecutionMode
  plan: NonCncPromotedQuoteOfferExportPackagePlan
}

interface NormalizedArtifactOutcome {
  key: NonCncPromotedQuoteOfferExportPackageArtifactKey
  status: "failed" | "succeeded"
  artifactExternalId?: string
  fileName?: string
  message?: string
  warnings: string[]
}

export function buildNonCncPromotedQuoteOfferExportPackageExecutionRun(
  input: BuildNonCncPromotedQuoteOfferExportPackageExecutionRunInput,
): NonCncPromotedQuoteOfferExportPackageExecutionRun {
  const actor = nonBlank(input.actor, "actor")
  const executedAt = normalizeIsoTimestamp(input.executedAt, "executedAt")
  const mode = normalizeMode(input.mode)
  const outcomesByKey = normalizeArtifactOutcomes(input.plan.artifacts, input.artifactOutcomes ?? [], mode)
  const artifacts = input.plan.artifacts.map((artifact) =>
    buildArtifactExecution({
      artifact,
      mode,
      outcome: outcomesByKey.get(artifact.key),
      planStatus: input.plan.status,
    }),
  )
  const status = executionStatus(input.plan, mode, artifacts)

  const run: Omit<NonCncPromotedQuoteOfferExportPackageExecutionRun, "executionFingerprint"> = {
    actor,
    artifactCount: artifacts.length,
    artifacts,
    creationPlanId: input.plan.creationPlanId,
    executedAt,
    executionVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION,
    mode,
    nextActions: executionNextActions(input.plan, mode, artifacts, status),
    offerExportBoundary:
      "Non-CNC offer export package execution runs are deterministic audit records only; this adapter does not create customer offers, files, release reviews, or connector side effects.",
    packageId: input.plan.packageId,
    planId: input.plan.planId,
    planVersion: input.plan.planVersion,
    releaseExecutionFingerprint: status === "blocked" ? undefined : input.plan.releaseExecutionFingerprint,
    selectedPlanId: input.plan.selectedPlanId,
    sourceExecutionFingerprint: status === "blocked" ? undefined : input.plan.executionFingerprint,
    status,
    targetRfqId: status === "blocked" ? undefined : input.plan.targetRfqId,
    warnings: executionWarnings(input.plan, artifacts),
  }

  return {
    ...run,
    executionFingerprint: fingerprintNonCncPromotedQuoteOfferExportPackageExecutionRun(run),
  }
}

export function fingerprintNonCncPromotedQuoteOfferExportPackageExecutionRun(
  run:
    | Omit<NonCncPromotedQuoteOfferExportPackageExecutionRun, "executionFingerprint">
    | NonCncPromotedQuoteOfferExportPackageExecutionRun,
): string {
  const stablePayload = stableJson({
    actor: run.actor,
    artifactCount: run.artifactCount,
    artifacts: run.artifacts,
    creationPlanId: run.creationPlanId,
    executedAt: run.executedAt,
    executionVersion: run.executionVersion,
    mode: run.mode,
    nextActions: run.nextActions,
    offerExportBoundary: run.offerExportBoundary,
    packageId: run.packageId,
    planId: run.planId,
    planVersion: run.planVersion,
    releaseExecutionFingerprint: run.releaseExecutionFingerprint,
    selectedPlanId: run.selectedPlanId,
    sourceExecutionFingerprint: run.sourceExecutionFingerprint,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warnings: run.warnings,
  })
  return `non-cnc-promoted-quote-offer-export-package-execution-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stablePayload)}`
}

function buildArtifactExecution({
  artifact,
  mode,
  outcome,
  planStatus,
}: {
  artifact: NonCncPromotedQuoteOfferExportPackageArtifact
  mode: NonCncPromotedQuoteOfferExportPackageExecutionMode
  outcome?: NormalizedArtifactOutcome
  planStatus: NonCncPromotedQuoteOfferExportPackagePlan["status"]
}): NonCncPromotedQuoteOfferExportPackageArtifactExecution {
  const status = artifactExecutionStatus(artifact, mode, outcome, planStatus)
  const executable = status === "failed" || status === "succeeded"
  return {
    artifactExternalId: executable ? outcome?.artifactExternalId : undefined,
    artifactId: status === "blocked" ? undefined : artifact.artifactId,
    blockerLabels: [...artifact.blockerLabels],
    fileName: executable ? outcome?.fileName : undefined,
    idempotencyKey: `${artifact.artifactId ?? artifact.key}:export-package-execution:${artifact.key}`,
    key: artifact.key,
    label: artifact.label,
    message: executable ? outcome?.message : undefined,
    plannedFileName: status === "blocked" ? undefined : artifact.fileName,
    sourceTarget: artifact.sourceTarget,
    status,
    warnings: executable ? outcome?.warnings ?? [] : [],
  }
}

function artifactExecutionStatus(
  artifact: NonCncPromotedQuoteOfferExportPackageArtifact,
  mode: NonCncPromotedQuoteOfferExportPackageExecutionMode,
  outcome: NormalizedArtifactOutcome | undefined,
  planStatus: NonCncPromotedQuoteOfferExportPackagePlan["status"],
): NonCncPromotedQuoteOfferExportPackageArtifactExecutionStatus {
  if (planStatus === "blocked" || artifact.status === "blocked" || !artifact.artifactId) {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }
  return outcome?.status ?? "pending"
}

function executionStatus(
  plan: NonCncPromotedQuoteOfferExportPackagePlan,
  mode: NonCncPromotedQuoteOfferExportPackageExecutionMode,
  artifacts: NonCncPromotedQuoteOfferExportPackageArtifactExecution[],
): NonCncPromotedQuoteOfferExportPackageExecutionStatus {
  if (plan.status === "blocked" || artifacts.some((artifact) => artifact.status === "blocked")) {
    return "blocked"
  }
  if (mode === "dry_run") {
    return "prepared"
  }

  const succeededCount = artifacts.filter((artifact) => artifact.status === "succeeded").length
  const failedCount = artifacts.filter((artifact) => artifact.status === "failed").length
  const pendingCount = artifacts.filter((artifact) => artifact.status === "pending").length
  if (succeededCount === artifacts.length) {
    return "succeeded"
  }
  if (failedCount === artifacts.length) {
    return "failed"
  }
  if (pendingCount === artifacts.length) {
    return "pending"
  }
  return "partial"
}

function executionNextActions(
  plan: NonCncPromotedQuoteOfferExportPackagePlan,
  mode: NonCncPromotedQuoteOfferExportPackageExecutionMode,
  artifacts: NonCncPromotedQuoteOfferExportPackageArtifactExecution[],
  status: NonCncPromotedQuoteOfferExportPackageExecutionStatus,
): string[] {
  if (status === "blocked") {
    return uniqueLabels([
      "Resolve non-CNC offer export package blockers before running the adapter.",
      ...plan.blockerLabels,
      ...artifacts.flatMap((artifact) => artifact.blockerLabels),
    ])
  }
  if (mode === "dry_run") {
    return [`Review ${artifacts.length} prepared non-CNC offer export artifact descriptor${artifacts.length === 1 ? "" : "s"} before committing.`]
  }
  if (status === "succeeded") {
    return ["Review the recorded non-CNC offer export package audit before wiring live customer export state."]
  }
  if (status === "pending") {
    return [`Record export outcomes for ${artifacts.length} non-CNC offer export artifact${artifacts.length === 1 ? "" : "s"}.`]
  }
  return ["Review failed or partial non-CNC offer export package artifact outcomes before retrying."]
}

function executionWarnings(
  plan: NonCncPromotedQuoteOfferExportPackagePlan,
  artifacts: NonCncPromotedQuoteOfferExportPackageArtifactExecution[],
): string[] {
  return uniqueLabels([...plan.reviewWarnings, ...artifacts.flatMap((artifact) => artifact.warnings)])
}

function normalizeArtifactOutcomes(
  artifacts: NonCncPromotedQuoteOfferExportPackageArtifact[],
  outcomes: NonCncPromotedQuoteOfferExportPackageArtifactOutcomeInput[],
  mode: NonCncPromotedQuoteOfferExportPackageExecutionMode,
): Map<NonCncPromotedQuoteOfferExportPackageArtifactKey, NormalizedArtifactOutcome> {
  const artifactByKey = new Map(artifacts.map((artifact) => [artifact.key, artifact]))
  const normalized = new Map<NonCncPromotedQuoteOfferExportPackageArtifactKey, NormalizedArtifactOutcome>()
  for (const [index, outcome] of outcomes.entries()) {
    const key = normalizeArtifactKey(outcome.key, `artifactOutcomes[${index}].key`)
    const artifact = artifactByKey.get(key)
    if (!artifact) {
      throw new Error(`artifactOutcomes[${index}].key does not match an offer export package artifact`)
    }
    if (mode === "dry_run") {
      throw new Error(`artifact outcome ${key} cannot be recorded for a dry-run non-CNC offer export package execution`)
    }
    if (artifact.status === "blocked" || !artifact.artifactId) {
      throw new Error(`artifact outcome ${key} cannot be recorded for a blocked non-CNC offer export package artifact`)
    }
    if (normalized.has(key)) {
      throw new Error(`artifactOutcomes[${index}].key is duplicated`)
    }
    normalized.set(key, {
      artifactExternalId: optionalTrim(outcome.artifactExternalId),
      fileName: optionalTrim(outcome.fileName),
      key,
      message: optionalTrim(outcome.message),
      status: normalizeOutcomeStatus(outcome.status, `artifactOutcomes[${index}].status`),
      warnings: uniqueLabels((outcome.warnings ?? []).map((warning) => warning.trim()).filter(Boolean)),
    })
  }
  return normalized
}

function normalizeArtifactKey(value: string, key: string): NonCncPromotedQuoteOfferExportPackageArtifactKey {
  const normalized = nonBlank(value, key)
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_ARTIFACT_KEYS.includes(normalized as NonCncPromotedQuoteOfferExportPackageArtifactKey)) {
    throw new Error(`${key} must be a valid offer export package artifact key`)
  }
  return normalized as NonCncPromotedQuoteOfferExportPackageArtifactKey
}

function normalizeMode(
  value: NonCncPromotedQuoteOfferExportPackageExecutionMode,
): NonCncPromotedQuoteOfferExportPackageExecutionMode {
  if (value !== "commit" && value !== "dry_run") {
    throw new Error("mode must be commit or dry_run")
  }
  return value
}

function normalizeOutcomeStatus(value: string, key: string): NormalizedArtifactOutcome["status"] {
  if (value !== "failed" && value !== "succeeded") {
    throw new Error(`${key} must be failed or succeeded`)
  }
  return value
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
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
