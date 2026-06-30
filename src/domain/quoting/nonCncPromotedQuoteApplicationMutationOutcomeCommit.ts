import {
  buildNonCncPromotedQuoteApplicationMutationExecutionRun,
  type NonCncPromotedQuoteApplicationMutationCommandOutcomeInput,
  type NonCncPromotedQuoteApplicationMutationExecutionRun,
} from "./nonCncPromotedQuoteApplicationMutationExecution"
import type { NonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft } from "./nonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft"
import type { NonCncPromotedQuoteApplicationMutationPackage } from "./nonCncPromotedQuoteApplicationMutationPackage"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION =
  "non-cnc-promoted-quote-application-mutation-outcome-commit.v1"

export type NonCncPromotedQuoteApplicationMutationOutcomeCommitStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteApplicationMutationOutcomeCommitPlan {
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION
  mutationPackageId: string
  applicationId?: string
  applicationRecordId?: string
  packageId?: string
  selectedPlanId?: string
  targetRfqId?: string
  sourceExecutionFingerprint: string
  status: NonCncPromotedQuoteApplicationMutationOutcomeCommitStatus
  commandOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  mutationBoundary: string
}

export interface BuildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlanInput {
  mutationPackage: NonCncPromotedQuoteApplicationMutationPackage
  outcomeDraft: NonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft
}

export interface BuildNonCncPromotedQuoteApplicationMutationOutcomeCommitRunInput
  extends BuildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlanInput {
  actor: string
  executedAt: string
}

export interface NonCncPromotedQuoteApplicationMutationOutcomeCommitRunResult {
  commitPlan: NonCncPromotedQuoteApplicationMutationOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteApplicationMutationExecutionRun
}

export function buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan({
  mutationPackage,
  outcomeDraft,
}: BuildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlanInput): NonCncPromotedQuoteApplicationMutationOutcomeCommitPlan {
  assertDraftMatchesPackage(mutationPackage, outcomeDraft)
  const modeBlockers =
    outcomeDraft.mode === "dry_run"
      ? []
      : ["Application mutation outcome draft must come from a dry run before commit."]
  const commandSetBlockers = commandSetMismatchBlockers(mutationPackage, outcomeDraft)
  const invalidCommandLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.status === "ready" && command.blockerLabels.length === 0
      ? []
      : [`Application mutation outcome draft entry for ${command.label} is not ready for commit.`],
  )
  const mismatchedSuggestedOutcomeLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome && command.suggestedOutcome.key !== command.key
      ? [`Suggested application mutation outcome for ${command.label} does not match the mutation package command.`]
      : [],
  )
  const commandOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome ? [cloneOutcome(command.suggestedOutcome)] : [],
  )
  const missingOutcomeLabels = outcomeDraft.commandOutcomes
    .filter((command) => !command.suggestedOutcome)
    .map((command) => `Missing suggested application mutation outcome for ${command.label}.`)
  const blockerLabels = uniqueLabels([
    ...modeBlockers,
    ...commandSetBlockers,
    ...mismatchedSuggestedOutcomeLabels,
    ...outcomeDraft.commandOutcomes.flatMap((command) => command.blockerLabels),
    ...invalidCommandLabels,
    ...missingOutcomeLabels,
    ...(outcomeDraft.status === "ready" ? [] : ["Application mutation outcome draft must be ready before commit."]),
  ])
  const status =
    outcomeDraft.status === "ready" &&
    modeBlockers.length === 0 &&
    commandOutcomes.length > 0 &&
    commandSetBlockers.length === 0 &&
    mismatchedSuggestedOutcomeLabels.length === 0 &&
    invalidCommandLabels.length === 0 &&
    missingOutcomeLabels.length === 0
      ? "ready"
      : "blocked"

  return {
    applicationId: outcomeDraft.applicationId,
    applicationRecordId: outcomeDraft.applicationRecordId,
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commandOutcomeCount: status === "ready" ? commandOutcomes.length : 0,
    commandOutcomes: status === "ready" ? commandOutcomes : [],
    commitVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION,
    mutationBoundary:
      "Application mutation outcome commit plans are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until an operator executes the commit.",
    mutationPackageId: outcomeDraft.mutationPackageId,
    nextOperatorMessage:
      status === "ready"
        ? `Commit ${commandOutcomes.length} reviewed non-CNC application mutation outcome${commandOutcomes.length === 1 ? "" : "s"}.`
        : blockerLabels.join(" ") ||
          "Application mutation outcome commit is blocked until the reviewed draft fully matches the mutation package.",
    packageId: outcomeDraft.packageId,
    reviewWarnings: [...outcomeDraft.reviewWarnings],
    selectedPlanId: outcomeDraft.selectedPlanId,
    sourceExecutionFingerprint: outcomeDraft.executionFingerprint,
    status,
    targetRfqId: outcomeDraft.targetRfqId,
  }
}

export function buildNonCncPromotedQuoteApplicationMutationOutcomeCommitRun(
  input: BuildNonCncPromotedQuoteApplicationMutationOutcomeCommitRunInput,
): NonCncPromotedQuoteApplicationMutationOutcomeCommitRunResult {
  const commitPlan = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitPlan(input)
  if (commitPlan.status !== "ready") {
    return { commitPlan }
  }

  return {
    commitPlan,
    executionRun: buildNonCncPromotedQuoteApplicationMutationExecutionRun({
      actor: input.actor,
      commandOutcomes: commitPlan.commandOutcomes,
      executedAt: input.executedAt,
      mode: "commit",
      mutationPackage: input.mutationPackage,
    }),
  }
}

function assertDraftMatchesPackage(
  mutationPackage: NonCncPromotedQuoteApplicationMutationPackage,
  outcomeDraft: NonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft,
): void {
  const mismatches = [
    mutationPackage.mutationPackageId === outcomeDraft.mutationPackageId ? undefined : "mutationPackageId",
    mutationPackage.applicationId === outcomeDraft.applicationId ? undefined : "applicationId",
    mutationPackage.applicationRecordId === outcomeDraft.applicationRecordId ? undefined : "applicationRecordId",
    mutationPackage.packageId === outcomeDraft.packageId ? undefined : "packageId",
    mutationPackage.selectedPlanId === outcomeDraft.selectedPlanId ? undefined : "selectedPlanId",
    mutationPackage.targetRfqId === outcomeDraft.targetRfqId ? undefined : "targetRfqId",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`application mutation outcome draft does not match mutation package: ${mismatches.join(", ")}`)
  }
}

function commandSetMismatchBlockers(
  mutationPackage: NonCncPromotedQuoteApplicationMutationPackage,
  outcomeDraft: NonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft,
): string[] {
  if (
    mutationPackage.commands.length !== outcomeDraft.commandOutcomes.length ||
    mutationPackage.commands.some((command, index) => {
      const draftCommand = outcomeDraft.commandOutcomes[index]
      return !draftCommand || command.key !== draftCommand.key || command.mutationTarget !== draftCommand.mutationTarget
    })
  ) {
    return ["Application mutation outcome draft command list does not match mutation package commands."]
  }
  return []
}

function cloneOutcome(
  outcome: NonCncPromotedQuoteApplicationMutationCommandOutcomeInput,
): NonCncPromotedQuoteApplicationMutationCommandOutcomeInput {
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
