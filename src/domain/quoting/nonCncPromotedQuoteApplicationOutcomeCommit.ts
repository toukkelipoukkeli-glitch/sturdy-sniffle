import {
  buildNonCncPromotedQuoteApplicationExecutionRun,
  type NonCncPromotedQuoteApplicationCommandOutcomeInput,
  type NonCncPromotedQuoteApplicationExecutionRun,
} from "./nonCncPromotedQuoteApplicationExecution"
import type { NonCncPromotedQuoteApplicationExecutionOutcomeDraft } from "./nonCncPromotedQuoteApplicationExecutionOutcomeDraft"
import type { NonCncPromotedQuoteApplicationRecord } from "./nonCncPromotedQuoteApplicationPersistence"

export const NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION =
  "non-cnc-promoted-quote-application-outcome-commit.v1"

export type NonCncPromotedQuoteApplicationOutcomeCommitStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteApplicationOutcomeCommitPlan {
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION
  applicationId: string
  applicationRecordId: string
  packageId: string
  selectedPlanId: string
  targetRfqId: string
  status: NonCncPromotedQuoteApplicationOutcomeCommitStatus
  commandOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteApplicationCommandOutcomeInput[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  mutationBoundary: string
}

export interface BuildNonCncPromotedQuoteApplicationOutcomeCommitPlanInput {
  applicationRecord: NonCncPromotedQuoteApplicationRecord
  outcomeDraft: NonCncPromotedQuoteApplicationExecutionOutcomeDraft
}

export interface BuildNonCncPromotedQuoteApplicationOutcomeCommitRunInput
  extends BuildNonCncPromotedQuoteApplicationOutcomeCommitPlanInput {
  actor: string
  executedAt: string
}

export interface NonCncPromotedQuoteApplicationOutcomeCommitRunResult {
  commitPlan: NonCncPromotedQuoteApplicationOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteApplicationExecutionRun
}

export function buildNonCncPromotedQuoteApplicationOutcomeCommitPlan({
  applicationRecord,
  outcomeDraft,
}: BuildNonCncPromotedQuoteApplicationOutcomeCommitPlanInput): NonCncPromotedQuoteApplicationOutcomeCommitPlan {
  assertDraftMatchesRecord(applicationRecord, outcomeDraft)
  const commandSetBlockers = commandSetMismatchBlockers(applicationRecord, outcomeDraft)
  const invalidCommandLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.status === "ready" && command.blockerLabels.length === 0
      ? []
      : [`Application outcome draft entry for ${command.label} is not ready for commit.`],
  )
  const mismatchedSuggestedOutcomeLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome && command.suggestedOutcome.key !== command.key
      ? [`Suggested application outcome for ${command.label} does not match the application record command.`]
      : [],
  )
  const commandOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome ? [cloneOutcome(command.suggestedOutcome)] : [],
  )
  const missingOutcomeLabels = outcomeDraft.commandOutcomes
    .filter((command) => !command.suggestedOutcome)
    .map((command) => `Missing suggested application outcome for ${command.label}.`)
  const blockerLabels = uniqueLabels([
    ...commandSetBlockers,
    ...mismatchedSuggestedOutcomeLabels,
    ...outcomeDraft.commandOutcomes.flatMap((command) => command.blockerLabels),
    ...invalidCommandLabels,
    ...missingOutcomeLabels,
    ...(outcomeDraft.status === "ready" ? [] : ["Application outcome draft must be ready before commit."]),
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
    applicationId: outcomeDraft.applicationId,
    applicationRecordId: outcomeDraft.applicationRecordId,
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commandOutcomeCount: status === "ready" ? commandOutcomes.length : 0,
    commandOutcomes: status === "ready" ? commandOutcomes : [],
    commitVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION,
    mutationBoundary:
      "Application outcome commit plans are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later mutation adapter applies them.",
    nextOperatorMessage:
      status === "ready"
        ? `Commit ${commandOutcomes.length} reviewed non-CNC application outcome${commandOutcomes.length === 1 ? "" : "s"}.`
        : blockerLabels.join(" ") ||
          "Application outcome commit is blocked until the reviewed draft fully matches the application record.",
    packageId: outcomeDraft.packageId,
    reviewWarnings: [...outcomeDraft.reviewWarnings],
    selectedPlanId: outcomeDraft.selectedPlanId,
    status,
    targetRfqId: outcomeDraft.targetRfqId,
  }
}

export function buildNonCncPromotedQuoteApplicationOutcomeCommitRun(
  input: BuildNonCncPromotedQuoteApplicationOutcomeCommitRunInput,
): NonCncPromotedQuoteApplicationOutcomeCommitRunResult {
  const commitPlan = buildNonCncPromotedQuoteApplicationOutcomeCommitPlan(input)
  if (commitPlan.status !== "ready") {
    return { commitPlan }
  }

  return {
    commitPlan,
    executionRun: buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: input.actor,
      applicationRecord: input.applicationRecord,
      commandOutcomes: commitPlan.commandOutcomes,
      executedAt: input.executedAt,
      mode: "commit",
    }),
  }
}

function assertDraftMatchesRecord(
  applicationRecord: NonCncPromotedQuoteApplicationRecord,
  outcomeDraft: NonCncPromotedQuoteApplicationExecutionOutcomeDraft,
): void {
  const mismatches = [
    applicationRecord.applicationId === outcomeDraft.applicationId ? undefined : "applicationId",
    applicationRecord.applicationRecordId === outcomeDraft.applicationRecordId ? undefined : "applicationRecordId",
    applicationRecord.packageId === outcomeDraft.packageId ? undefined : "packageId",
    applicationRecord.selectedPlanId === outcomeDraft.selectedPlanId ? undefined : "selectedPlanId",
    applicationRecord.targetRfqId === outcomeDraft.targetRfqId ? undefined : "targetRfqId",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`application outcome draft does not match application record: ${mismatches.join(", ")}`)
  }
}

function commandSetMismatchBlockers(
  applicationRecord: NonCncPromotedQuoteApplicationRecord,
  outcomeDraft: NonCncPromotedQuoteApplicationExecutionOutcomeDraft,
): string[] {
  const recordKeys = applicationRecord.commands.map((command) => command.key)
  const draftKeys = outcomeDraft.commandOutcomes.map((command) => command.key)
  if (recordKeys.length !== draftKeys.length || recordKeys.some((key, index) => key !== draftKeys[index])) {
    return ["Application outcome draft command list does not match application record commands."]
  }
  return []
}

function cloneOutcome(
  outcome: NonCncPromotedQuoteApplicationCommandOutcomeInput,
): NonCncPromotedQuoteApplicationCommandOutcomeInput {
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
