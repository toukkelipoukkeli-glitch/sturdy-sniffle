import type {
  NonCncPromotedQuoteApplicationMutationOutcomeCommitMutationTarget,
  NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION =
  "non-cnc-promoted-quote-application-mutation-apply-plan.v1"

export type NonCncPromotedQuoteApplicationMutationApplyPlanStatus = "blocked" | "ready"
export type NonCncPromotedQuoteApplicationMutationApplyCommandStatus = "blocked" | "ready"
export type NonCncPromotedQuoteApplicationMutationApplyCommandKey =
  | "apply_active_rfq_quote"
  | "apply_offer_workspace"
  | "apply_release_state"

export interface NonCncPromotedQuoteApplicationMutationApplyCommand {
  key: NonCncPromotedQuoteApplicationMutationApplyCommandKey
  label: string
  mutationTarget: NonCncPromotedQuoteApplicationMutationOutcomeCommitMutationTarget
  status: NonCncPromotedQuoteApplicationMutationApplyCommandStatus
  blockerLabels: string[]
  reviewWarnings: string[]
  targetRfqId?: string
  sourceExecutionFingerprint?: string
  applicationTargetId?: string
}

export interface NonCncPromotedQuoteApplicationMutationApplyPlan {
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION
  applyPlanId: string
  mutationPackageId?: string
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  sourceExecutionFingerprint?: string
  executionFingerprint?: string
  status: NonCncPromotedQuoteApplicationMutationApplyPlanStatus
  commandCount: number
  committedOutcomeCount: number
  commands: NonCncPromotedQuoteApplicationMutationApplyCommand[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  mutationBoundary: string
}

export function buildNonCncPromotedQuoteApplicationMutationApplyPlan(
  readModel: NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel,
): NonCncPromotedQuoteApplicationMutationApplyPlan {
  const blockerLabels = applyPlanBlockers(readModel)
  const ready = blockerLabels.length === 0
  const targets = ready ? readModel.mutationTargets : defaultMutationTargets()
  const commands = targets.map((target) => buildCommand({ readModel, ready, blockerLabels, target }))

  return {
    applicationId: readModel.applicationId,
    applicationRecordId: readModel.applicationRecordId,
    applyPlanId: buildApplyPlanId(readModel),
    blockerLabels,
    commandCount: commands.length,
    commands,
    committedOutcomeCount: ready ? readModel.committedOutcomeCount : 0,
    executionFingerprint: ready ? readModel.executionFingerprint : undefined,
    mutationBoundary:
      "Application mutation apply plans are deterministic adapter descriptors only; building the plan does not mutate active RFQ quote, offer, or release state.",
    mutationPackageId: readModel.mutationPackageId,
    nextOperatorMessage: ready
      ? "Promoted non-CNC mutation outcome commit is ready for a future adapter to apply active RFQ, offer, and release updates."
      : "Resolve mutation apply plan blockers before applying active RFQ, offer, or release updates.",
    packageId: readModel.packageId,
    planVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION,
    reviewWarnings: [...readModel.reviewWarnings],
    selectedPlanId: readModel.selectedPlanId,
    sourceExecutionFingerprint: readModel.sourceExecutionFingerprint,
    status: ready ? "ready" : "blocked",
    targetRfqId: ready ? readModel.targetRfqId : undefined,
  }
}

function applyPlanBlockers(readModel: NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel): string[] {
  return uniqueLabels([
    ...(readModel.status === "ready_to_apply" ? [] : ["Application mutation outcome commit read model is not ready to apply."]),
    ...(readModel.mutationPackageId ? [] : ["Mutation package id is missing."]),
    ...(readModel.applicationId ? [] : ["Application id is missing."]),
    ...(readModel.applicationRecordId ? [] : ["Application record id is missing."]),
    ...(readModel.packageId ? [] : ["Application package id is missing."]),
    ...(readModel.selectedPlanId ? [] : ["Selected promotion plan id is missing."]),
    ...(readModel.targetRfqId ? [] : ["Target RFQ id is missing."]),
    ...(readModel.executionFingerprint ? [] : ["Mutation outcome commit execution fingerprint is missing."]),
    ...(readModel.committedOutcomeCount > 0 ? [] : ["Mutation outcome commit has no committed outcomes."]),
    ...(readModel.mutationTargets.length > 0 ? [] : ["Mutation outcome commit has no mutation targets."]),
    ...readModel.blockerLabels,
  ])
}

function buildCommand({
  blockerLabels,
  readModel,
  ready,
  target,
}: {
  blockerLabels: string[]
  readModel: NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel
  ready: boolean
  target: NonCncPromotedQuoteApplicationMutationOutcomeCommitMutationTarget
}): NonCncPromotedQuoteApplicationMutationApplyCommand {
  return {
    applicationTargetId:
      ready && readModel.targetRfqId && readModel.executionFingerprint
        ? buildApplicationTargetId(target, readModel.targetRfqId, readModel.executionFingerprint)
        : undefined,
    blockerLabels: ready ? [] : [...blockerLabels],
    key: commandKey(target),
    label: commandLabel(target),
    mutationTarget: target,
    reviewWarnings: [...readModel.reviewWarnings],
    sourceExecutionFingerprint: ready ? readModel.executionFingerprint : undefined,
    status: ready ? "ready" : "blocked",
    targetRfqId: ready ? readModel.targetRfqId : undefined,
  }
}

function buildApplyPlanId(readModel: NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel): string {
  return [
    "non-cnc-promoted-quote-application-mutation-apply-plan",
    readModel.targetRfqId ? toStableIdToken(readModel.targetRfqId, "readModel.targetRfqId") : "unassigned-rfq",
    readModel.mutationPackageId
      ? toStableIdToken(readModel.mutationPackageId, "readModel.mutationPackageId")
      : "unassigned-mutation-package",
  ].join(":")
}

function buildApplicationTargetId(
  target: NonCncPromotedQuoteApplicationMutationOutcomeCommitMutationTarget,
  targetRfqId: string,
  executionFingerprint: string,
): string {
  return [
    "non-cnc-promoted-quote-application-mutation-target",
    commandKey(target),
    toStableIdToken(targetRfqId, "readModel.targetRfqId"),
    toStableIdToken(executionFingerprint, "readModel.executionFingerprint"),
  ].join(":")
}

function commandKey(
  target: NonCncPromotedQuoteApplicationMutationOutcomeCommitMutationTarget,
): NonCncPromotedQuoteApplicationMutationApplyCommandKey {
  switch (target) {
    case "active_rfq_quote":
      return "apply_active_rfq_quote"
    case "offer_workspace":
      return "apply_offer_workspace"
    case "release_state":
      return "apply_release_state"
    default:
      return assertNever(target)
  }
}

function commandLabel(target: NonCncPromotedQuoteApplicationMutationOutcomeCommitMutationTarget): string {
  switch (target) {
    case "active_rfq_quote":
      return "Apply active RFQ quote"
    case "offer_workspace":
      return "Apply offer workspace"
    case "release_state":
      return "Apply release state"
    default:
      return assertNever(target)
  }
}

function defaultMutationTargets(): NonCncPromotedQuoteApplicationMutationOutcomeCommitMutationTarget[] {
  return ["active_rfq_quote", "offer_workspace", "release_state"]
}

function toStableIdToken(value: string, key: string): string {
  const token = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  if (!token) {
    throw new Error(`${key} must contain at least one alphanumeric character`)
  }
  return token
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function assertNever(value: never): never {
  throw new Error(`Unsupported non-CNC application mutation apply target: ${JSON.stringify(value)}`)
}
