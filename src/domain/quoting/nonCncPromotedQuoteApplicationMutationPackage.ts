import type {
  NonCncPromotedQuoteApplicationOutcomeCommitMutationTarget,
  NonCncPromotedQuoteApplicationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitReadModel"
import type { NonCncPromotedQuoteApplicationCommand } from "./nonCncPromotedQuoteApplicationPlan"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_PACKAGE_VERSION =
  "non-cnc-promoted-quote-application-mutation-package.v1"

export type NonCncPromotedQuoteApplicationMutationPackageStatus = "blocked" | "ready"
export type NonCncPromotedQuoteApplicationMutationCommandStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteApplicationMutationCommand {
  key: NonCncPromotedQuoteApplicationCommand["key"]
  mutationTarget: NonCncPromotedQuoteApplicationOutcomeCommitMutationTarget
  label: string
  status: NonCncPromotedQuoteApplicationMutationCommandStatus
  blockerLabels: string[]
  reviewWarnings: string[]
  sourceExecutionFingerprint?: string
  targetRfqId?: string
}

export interface NonCncPromotedQuoteApplicationMutationPackage {
  packageVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_PACKAGE_VERSION
  mutationPackageId: string
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  status: NonCncPromotedQuoteApplicationMutationPackageStatus
  commandCount: number
  commands: NonCncPromotedQuoteApplicationMutationCommand[]
  blockerLabels: string[]
  reviewWarnings: string[]
  sourceExecutionFingerprint?: string
  nextOperatorMessage: string
  mutationBoundary: string
}

export function buildNonCncPromotedQuoteApplicationMutationPackage(
  readModel: NonCncPromotedQuoteApplicationOutcomeCommitReadModel,
): NonCncPromotedQuoteApplicationMutationPackage {
  const blockerLabels = mutationPackageBlockers(readModel)
  const ready = blockerLabels.length === 0
  const commandTargets = ready ? readModel.mutationTargets : defaultMutationTargets()
  const commands = commandTargets.map((target) =>
    buildCommand({
      blockerLabels,
      readModel,
      ready,
      target,
    }),
  )

  return {
    applicationId: readModel.applicationId,
    applicationRecordId: readModel.applicationRecordId,
    blockerLabels,
    commandCount: commands.length,
    commands,
    mutationBoundary:
      "Application mutation packages are deterministic adapter inputs only; building the package does not mutate active RFQ quote, offer, or release state.",
    mutationPackageId: buildMutationPackageId(readModel),
    nextOperatorMessage: ready
      ? "Application mutation package is ready for a future adapter to apply active RFQ, offer, and release updates."
      : "Resolve application mutation package blockers before applying active RFQ, offer, or release updates.",
    packageId: readModel.packageId,
    packageVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_PACKAGE_VERSION,
    reviewWarnings: [...readModel.reviewWarnings],
    selectedPlanId: readModel.selectedPlanId,
    sourceExecutionFingerprint: ready ? readModel.executionFingerprint : undefined,
    status: ready ? "ready" : "blocked",
    targetRfqId: ready ? readModel.targetRfqId : undefined,
  }
}

function buildCommand({
  blockerLabels,
  readModel,
  ready,
  target,
}: {
  blockerLabels: string[]
  readModel: NonCncPromotedQuoteApplicationOutcomeCommitReadModel
  ready: boolean
  target: NonCncPromotedQuoteApplicationOutcomeCommitMutationTarget
}): NonCncPromotedQuoteApplicationMutationCommand {
  return {
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

function mutationPackageBlockers(readModel: NonCncPromotedQuoteApplicationOutcomeCommitReadModel): string[] {
  return uniqueLabels([
    ...(readModel.status === "ready_to_apply" ? [] : ["Application outcome commit read model is not ready to apply."]),
    ...(readModel.applicationId ? [] : ["Application id is missing."]),
    ...(readModel.applicationRecordId ? [] : ["Application record id is missing."]),
    ...(readModel.packageId ? [] : ["Application package id is missing."]),
    ...(readModel.selectedPlanId ? [] : ["Selected promotion plan id is missing."]),
    ...(readModel.targetRfqId ? [] : ["Target RFQ id is missing."]),
    ...(readModel.executionFingerprint ? [] : ["Application outcome commit execution fingerprint is missing."]),
    ...(readModel.committedOutcomeCount > 0 ? [] : ["Application outcome commit has no committed outcomes."]),
    ...(readModel.mutationTargets.length > 0 ? [] : ["Application outcome commit has no mutation targets."]),
    ...readModel.blockerLabels,
  ])
}

function buildMutationPackageId(readModel: NonCncPromotedQuoteApplicationOutcomeCommitReadModel): string {
  return [
    "non-cnc-promoted-quote-application-mutation-package",
    readModel.targetRfqId ? toStableIdToken(readModel.targetRfqId, "readModel.targetRfqId") : "unassigned-rfq",
    readModel.applicationId ? toStableIdToken(readModel.applicationId, "readModel.applicationId") : "unassigned-application",
  ].join(":")
}

function commandKey(
  target: NonCncPromotedQuoteApplicationOutcomeCommitMutationTarget,
): NonCncPromotedQuoteApplicationCommand["key"] {
  switch (target) {
    case "active_rfq_quote":
      return "replace_active_quote"
    case "offer_workspace":
      return "refresh_offer_workspace"
    case "release_state":
      return "open_offer_builder"
    default:
      return assertNever(target)
  }
}

function commandLabel(target: NonCncPromotedQuoteApplicationOutcomeCommitMutationTarget): string {
  switch (target) {
    case "active_rfq_quote":
      return "Apply active RFQ quote"
    case "offer_workspace":
      return "Refresh offer workspace"
    case "release_state":
      return "Refresh release state"
    default:
      return assertNever(target)
  }
}

function defaultMutationTargets(): NonCncPromotedQuoteApplicationOutcomeCommitMutationTarget[] {
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
  throw new Error(`Unsupported non-CNC application mutation target: ${JSON.stringify(value)}`)
}
