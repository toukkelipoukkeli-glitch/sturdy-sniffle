import type { NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import {
  buildNonCncQuotePromotionExecutionRun,
  type NonCncQuotePromotionCommandOutcomeInput,
  type NonCncQuotePromotionExecutionRun,
} from "./nonCncQuotePromotionExecution"
import type { NonCncQuotePromotionExecutionOutcomeDraft } from "./nonCncQuotePromotionExecutionOutcomeDraft"

export const NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_VERSION = "non-cnc-quote-promotion-outcome-commit.v1"

export type NonCncQuotePromotionOutcomeCommitStatus = "blocked" | "ready"

export interface NonCncQuotePromotionOutcomeCommitPlan {
  commitVersion: typeof NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_VERSION
  packageId: string
  packageVersion: NonCncQuotePromotionCommandPackage["packageVersion"]
  selectedPlanId: string
  targetRfqId?: string
  status: NonCncQuotePromotionOutcomeCommitStatus
  commandOutcomeCount: number
  commandOutcomes: NonCncQuotePromotionCommandOutcomeInput[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
}

export interface BuildNonCncQuotePromotionOutcomeCommitPlanInput {
  commandPackage: NonCncQuotePromotionCommandPackage
  outcomeDraft: NonCncQuotePromotionExecutionOutcomeDraft
}

export interface BuildNonCncQuotePromotionOutcomeCommitRunInput extends BuildNonCncQuotePromotionOutcomeCommitPlanInput {
  actor: string
  executedAt: string
}

export interface NonCncQuotePromotionOutcomeCommitRunResult {
  commitPlan: NonCncQuotePromotionOutcomeCommitPlan
  executionRun?: NonCncQuotePromotionExecutionRun
}

export function buildNonCncQuotePromotionOutcomeCommitPlan({
  commandPackage,
  outcomeDraft,
}: BuildNonCncQuotePromotionOutcomeCommitPlanInput): NonCncQuotePromotionOutcomeCommitPlan {
  assertDraftMatchesPackage(commandPackage, outcomeDraft)
  const commandOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome ? [cloneOutcome(command.suggestedOutcome)] : [],
  )
  const missingOutcomeLabels = outcomeDraft.commandOutcomes
    .filter((command) => !command.suggestedOutcome)
    .map((command) => `Missing suggested outcome for ${command.label}.`)
  const blockerLabels = uniqueLabels([
    ...outcomeDraft.commandOutcomes.flatMap((command) => command.blockerLabels),
    ...missingOutcomeLabels,
    ...(outcomeDraft.status === "ready" ? [] : ["Outcome draft must be ready before commit."]),
  ])
  const status =
    outcomeDraft.status === "ready" && commandOutcomes.length > 0 && missingOutcomeLabels.length === 0 ? "ready" : "blocked"

  return {
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commandOutcomeCount: status === "ready" ? commandOutcomes.length : 0,
    commandOutcomes: status === "ready" ? commandOutcomes : [],
    commitVersion: NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_VERSION,
    nextOperatorMessage:
      status === "ready"
        ? `Commit ${commandOutcomes.length} reviewed non-CNC promotion outcome${commandOutcomes.length === 1 ? "" : "s"}.`
        : outcomeDraft.nextOperatorMessage,
    packageId: outcomeDraft.packageId,
    packageVersion: outcomeDraft.packageVersion,
    reviewWarnings: [...outcomeDraft.reviewWarnings],
    selectedPlanId: outcomeDraft.selectedPlanId,
    status,
    targetRfqId: outcomeDraft.targetRfqId,
  }
}

export function buildNonCncQuotePromotionOutcomeCommitRun(
  input: BuildNonCncQuotePromotionOutcomeCommitRunInput,
): NonCncQuotePromotionOutcomeCommitRunResult {
  const commitPlan = buildNonCncQuotePromotionOutcomeCommitPlan(input)
  if (commitPlan.status !== "ready") {
    return { commitPlan }
  }

  return {
    commitPlan,
    executionRun: buildNonCncQuotePromotionExecutionRun({
      actor: input.actor,
      commandOutcomes: commitPlan.commandOutcomes,
      commandPackage: input.commandPackage,
      executedAt: input.executedAt,
      mode: "commit",
    }),
  }
}

function assertDraftMatchesPackage(
  commandPackage: NonCncQuotePromotionCommandPackage,
  outcomeDraft: NonCncQuotePromotionExecutionOutcomeDraft,
): void {
  const mismatches = [
    commandPackage.packageId === outcomeDraft.packageId ? undefined : "packageId",
    commandPackage.packageVersion === outcomeDraft.packageVersion ? undefined : "packageVersion",
    commandPackage.selectedPlanId === outcomeDraft.selectedPlanId ? undefined : "selectedPlanId",
    commandPackage.targetRfqId === outcomeDraft.targetRfqId ? undefined : "targetRfqId",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`outcome draft does not match command package: ${mismatches.join(", ")}`)
  }
}

function cloneOutcome(outcome: NonCncQuotePromotionCommandOutcomeInput): NonCncQuotePromotionCommandOutcomeInput {
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
