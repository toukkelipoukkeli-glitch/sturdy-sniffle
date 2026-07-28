import {
  buildNonCncPromotedQuoteOfferCreationExecutionRun,
  type NonCncPromotedQuoteOfferCreationCommandOutcomeInput,
  type NonCncPromotedQuoteOfferCreationExecutionRun,
} from "./nonCncPromotedQuoteOfferCreationExecution"
import type { NonCncPromotedQuoteOfferCreationExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferCreationExecutionOutcomeDraft"
import type { NonCncPromotedQuoteOfferCreationPlan } from "./nonCncPromotedQuoteOfferCreationPlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION =
  "non-cnc-promoted-quote-offer-creation-outcome-commit.v1"

export type NonCncPromotedQuoteOfferCreationOutcomeCommitStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteOfferCreationOutcomeCommitPlan {
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION
  creationPlanId: string
  planVersion: NonCncPromotedQuoteOfferCreationPlan["planVersion"]
  packageId: string
  selectedPlanId: string
  targetRfqId?: string
  releaseExecutionFingerprint?: string
  status: NonCncPromotedQuoteOfferCreationOutcomeCommitStatus
  commandOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteOfferCreationCommandOutcomeInput[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  offerCreationBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferCreationOutcomeCommitPlanInput {
  outcomeDraft: NonCncPromotedQuoteOfferCreationExecutionOutcomeDraft
  plan: NonCncPromotedQuoteOfferCreationPlan
}

export interface BuildNonCncPromotedQuoteOfferCreationOutcomeCommitRunInput
  extends BuildNonCncPromotedQuoteOfferCreationOutcomeCommitPlanInput {
  actor: string
  executedAt: string
}

export interface NonCncPromotedQuoteOfferCreationOutcomeCommitRunResult {
  commitPlan: NonCncPromotedQuoteOfferCreationOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteOfferCreationExecutionRun
}

export function buildNonCncPromotedQuoteOfferCreationOutcomeCommitPlan({
  outcomeDraft,
  plan,
}: BuildNonCncPromotedQuoteOfferCreationOutcomeCommitPlanInput): NonCncPromotedQuoteOfferCreationOutcomeCommitPlan {
  assertDraftMatchesPlan(plan, outcomeDraft)
  const commandSetBlockers = commandSetMismatchBlockers(plan, outcomeDraft)
  const invalidCommandLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.status === "ready" && command.blockerLabels.length === 0
      ? []
      : [`Customer-offer creation outcome draft entry for ${command.label} is not ready for commit.`],
  )
  const mismatchedSuggestedOutcomeLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome && command.suggestedOutcome.key !== command.key
      ? [`Suggested customer-offer creation outcome for ${command.label} does not match the creation plan command.`]
      : [],
  )
  const commandOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome ? [cloneOutcome(command.suggestedOutcome)] : [],
  )
  const missingOutcomeLabels = outcomeDraft.commandOutcomes
    .filter((command) => !command.suggestedOutcome)
    .map((command) => `Missing suggested customer-offer creation outcome for ${command.label}.`)
  const blockerLabels = uniqueLabels([
    ...commandSetBlockers,
    ...mismatchedSuggestedOutcomeLabels,
    ...outcomeDraft.commandOutcomes.flatMap((command) => command.blockerLabels),
    ...invalidCommandLabels,
    ...missingOutcomeLabels,
    ...(outcomeDraft.status === "ready" ? [] : ["Customer-offer creation outcome draft must be ready before commit."]),
  ])
  const status =
    outcomeDraft.status === "ready" &&
    commandOutcomes.length > 0 &&
    commandSetBlockers.length === 0 &&
    mismatchedSuggestedOutcomeLabels.length === 0 &&
    invalidCommandLabels.length === 0 &&
    missingOutcomeLabels.length === 0
      ? "ready"
      : "blocked"

  return {
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commandOutcomeCount: status === "ready" ? commandOutcomes.length : 0,
    commandOutcomes: status === "ready" ? commandOutcomes : [],
    commitVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION,
    creationPlanId: outcomeDraft.creationPlanId,
    nextOperatorMessage:
      status === "ready"
        ? `Commit ${commandOutcomes.length} reviewed non-CNC customer-offer creation outcome${commandOutcomes.length === 1 ? "" : "s"}.`
        : blockerLabels.join(" ") ||
          "Customer-offer creation outcome commit is blocked until the reviewed draft fully matches the creation plan.",
    offerCreationBoundary:
      "Customer-offer creation outcome commit plans are deterministic review data only; active RFQ quote, offer, release, export, and connector state stay unchanged until a later adapter applies them.",
    packageId: outcomeDraft.packageId,
    planVersion: plan.planVersion,
    releaseExecutionFingerprint: outcomeDraft.releaseExecutionFingerprint,
    reviewWarnings: [...outcomeDraft.reviewWarnings],
    selectedPlanId: outcomeDraft.selectedPlanId,
    status,
    targetRfqId: outcomeDraft.targetRfqId,
  }
}

export function buildNonCncPromotedQuoteOfferCreationOutcomeCommitRun(
  input: BuildNonCncPromotedQuoteOfferCreationOutcomeCommitRunInput,
): NonCncPromotedQuoteOfferCreationOutcomeCommitRunResult {
  const commitPlan = buildNonCncPromotedQuoteOfferCreationOutcomeCommitPlan(input)
  if (commitPlan.status !== "ready") {
    return { commitPlan }
  }

  return {
    commitPlan,
    executionRun: buildNonCncPromotedQuoteOfferCreationExecutionRun({
      actor: input.actor,
      commandOutcomes: commitPlan.commandOutcomes,
      executedAt: input.executedAt,
      mode: "commit",
      plan: input.plan,
    }),
  }
}

function assertDraftMatchesPlan(
  plan: NonCncPromotedQuoteOfferCreationPlan,
  outcomeDraft: NonCncPromotedQuoteOfferCreationExecutionOutcomeDraft,
): void {
  const mismatches = [
    plan.creationPlanId === outcomeDraft.creationPlanId ? undefined : "creationPlanId",
    plan.packageId === outcomeDraft.packageId ? undefined : "packageId",
    plan.selectedPlanId === outcomeDraft.selectedPlanId ? undefined : "selectedPlanId",
    outcomeDraft.status !== "ready" || plan.targetRfqId === outcomeDraft.targetRfqId ? undefined : "targetRfqId",
    outcomeDraft.status !== "ready" || plan.releaseExecutionFingerprint === outcomeDraft.releaseExecutionFingerprint
      ? undefined
      : "releaseExecutionFingerprint",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`customer-offer creation outcome draft does not match creation plan: ${mismatches.join(", ")}`)
  }
}

function commandSetMismatchBlockers(
  plan: NonCncPromotedQuoteOfferCreationPlan,
  outcomeDraft: NonCncPromotedQuoteOfferCreationExecutionOutcomeDraft,
): string[] {
  const planKeys = plan.commands.map((command) => command.key)
  const draftKeys = outcomeDraft.commandOutcomes.map((command) => command.key)
  if (planKeys.length !== draftKeys.length || planKeys.some((key, index) => key !== draftKeys[index])) {
    return ["Customer-offer creation outcome draft command list does not match creation plan commands."]
  }
  return []
}

function cloneOutcome(
  outcome: NonCncPromotedQuoteOfferCreationCommandOutcomeInput,
): NonCncPromotedQuoteOfferCreationCommandOutcomeInput {
  return {
    externalId: outcome.externalId,
    key: outcome.key,
    message: outcome.message,
    status: outcome.status,
    warnings: outcome.warnings ? [...outcome.warnings] : undefined,
  }
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}
