import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import type { NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft"
import type { NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-execution-outcome-commit.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan {
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION
  executionFingerprint: string
  planId: string
  planVersion: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan["planVersion"]
  planFingerprint: string
  decisionFingerprint: string
  targetRfqId?: string
  latestExecutionFingerprint?: string
  latestPackageId?: string
  latestPlanId?: string
  latestReleaseExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitStatus
  commandOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  adapterOutcomeBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlanInput {
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft
  plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRunInput
  extends BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlanInput {
  actor: string
  executedAt: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRunResult {
  commitPlan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan({
  outcomeDraft,
  plan,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlanInput): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan {
  assertDraftMatchesPlan(plan, outcomeDraft)
  const commandSetBlockers = commandSetMismatchBlockers(plan, outcomeDraft)
  const invalidCommandLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.status === "ready" && command.blockerLabels.length === 0
      ? []
      : [`Live-adapter execution outcome draft entry for ${command.label} is not ready for commit.`],
  )
  const mismatchedSuggestedOutcomeLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome && command.suggestedOutcome.key !== command.key
      ? [`Suggested live-adapter execution outcome for ${command.label} does not match the execution plan command.`]
      : [],
  )
  const nonSucceededSuggestedOutcomeLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome && command.suggestedOutcome.status !== "succeeded"
      ? [`Suggested live-adapter execution outcome for ${command.label} must have succeeded status.`]
      : [],
  )
  const commandOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome ? [cloneOutcome(command.suggestedOutcome)] : [],
  )
  const missingOutcomeLabels = outcomeDraft.commandOutcomes
    .filter((command) => !command.suggestedOutcome)
    .map((command) => `Missing suggested live-adapter execution outcome for ${command.label}.`)
  const modeBlockers =
    outcomeDraft.mode === "dry_run"
      ? []
      : ["Live-adapter execution outcome commit requires a dry-run outcome draft."]
  const blockerLabels = uniqueLabels([
    ...commandSetBlockers,
    ...mismatchedSuggestedOutcomeLabels,
    ...nonSucceededSuggestedOutcomeLabels,
    ...outcomeDraft.commandOutcomes.flatMap((command) => command.blockerLabels),
    ...invalidCommandLabels,
    ...missingOutcomeLabels,
    ...modeBlockers,
    ...(outcomeDraft.status === "ready" ? [] : ["Live-adapter execution outcome draft must be ready before commit."]),
  ])
  const status =
    outcomeDraft.status === "ready" &&
    commandOutcomes.length > 0 &&
    commandSetBlockers.length === 0 &&
    mismatchedSuggestedOutcomeLabels.length === 0 &&
    nonSucceededSuggestedOutcomeLabels.length === 0 &&
    invalidCommandLabels.length === 0 &&
    missingOutcomeLabels.length === 0 &&
    modeBlockers.length === 0
      ? "ready"
      : "blocked"

  return {
    adapterOutcomeBoundary:
      "Live-adapter execution outcome commit plans are deterministic review data only; active customer-offer, file, release-review, export, connector, RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commandOutcomeCount: status === "ready" ? commandOutcomes.length : 0,
    commandOutcomes: status === "ready" ? commandOutcomes : [],
    commitVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
    decisionFingerprint: outcomeDraft.decisionFingerprint,
    executionFingerprint: outcomeDraft.executionFingerprint,
    latestExecutionFingerprint: status === "ready" ? outcomeDraft.latestExecutionFingerprint : undefined,
    latestPackageId: status === "ready" ? outcomeDraft.latestPackageId : undefined,
    latestPlanId: status === "ready" ? outcomeDraft.latestPlanId : undefined,
    latestReleaseExecutionFingerprint: status === "ready" ? outcomeDraft.latestReleaseExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: status === "ready" ? outcomeDraft.latestSourceExecutionFingerprint : undefined,
    nextOperatorMessage:
      status === "ready"
        ? `Commit ${commandOutcomes.length} reviewed non-CNC live-adapter execution outcome${commandOutcomes.length === 1 ? "" : "s"}.`
        : blockerLabels.join(" ") ||
          "Live-adapter execution outcome commit is blocked until the reviewed draft fully matches the execution plan.",
    planFingerprint: outcomeDraft.planFingerprint,
    planId: outcomeDraft.planId,
    planVersion: plan.planVersion,
    reviewWarnings: [...outcomeDraft.reviewWarnings],
    status,
    targetRfqId: status === "ready" ? outcomeDraft.targetRfqId : undefined,
  }
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun(
  input: BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRunInput,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRunResult {
  const commitPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPlan(input)
  if (commitPlan.status !== "ready") {
    return { commitPlan }
  }

  return {
    commitPlan,
    executionRun: buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor: input.actor,
      commandOutcomes: commitPlan.commandOutcomes,
      executedAt: input.executedAt,
      mode: "commit",
      plan: input.plan,
    }),
  }
}

function assertDraftMatchesPlan(
  plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft,
): void {
  const mismatches = [
    plan.planId === outcomeDraft.planId ? undefined : "planId",
    plan.planFingerprint === outcomeDraft.planFingerprint ? undefined : "planFingerprint",
    plan.decisionFingerprint === outcomeDraft.decisionFingerprint ? undefined : "decisionFingerprint",
    outcomeDraft.status !== "ready" || plan.targetRfqId === outcomeDraft.targetRfqId ? undefined : "targetRfqId",
    outcomeDraft.status !== "ready" || plan.latestExecutionFingerprint === outcomeDraft.latestExecutionFingerprint
      ? undefined
      : "latestExecutionFingerprint",
    outcomeDraft.status !== "ready" || plan.latestPackageId === outcomeDraft.latestPackageId ? undefined : "latestPackageId",
    outcomeDraft.status !== "ready" || plan.latestPlanId === outcomeDraft.latestPlanId ? undefined : "latestPlanId",
    outcomeDraft.status !== "ready" ||
    plan.latestReleaseExecutionFingerprint === outcomeDraft.latestReleaseExecutionFingerprint
      ? undefined
      : "latestReleaseExecutionFingerprint",
    outcomeDraft.status !== "ready" ||
    plan.latestSourceExecutionFingerprint === outcomeDraft.latestSourceExecutionFingerprint
      ? undefined
      : "latestSourceExecutionFingerprint",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`live-adapter execution outcome draft does not match execution plan: ${mismatches.join(", ")}`)
  }
}

function commandSetMismatchBlockers(
  plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft,
): string[] {
  const planKeys = plan.commands.map((command) => command.key)
  const draftKeys = outcomeDraft.commandOutcomes.map((command) => command.key)
  if (planKeys.length !== draftKeys.length || planKeys.some((key, index) => key !== draftKeys[index])) {
    return ["Live-adapter execution outcome draft command list does not match execution plan commands."]
  }
  return []
}

function cloneOutcome(
  outcome: NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput,
): NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput {
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
