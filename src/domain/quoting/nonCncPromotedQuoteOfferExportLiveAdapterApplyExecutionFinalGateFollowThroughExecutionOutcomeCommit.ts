import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_DRAFT_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeDraft,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-execution-outcome-commit.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan {
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_VERSION
  executionFingerprint: string
  followThroughId: string
  followThroughVersion: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan["followThroughVersion"]
  followThroughFingerprint: string
  targetRfqId?: string
  readinessRecordId?: string
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitStatus
  commandOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  adapterOutcomeBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlanInput {
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft
  followThrough: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRunInput
  extends BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlanInput {
  actor: string
  executedAt: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRunResult {
  commitPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan({
  outcomeDraft,
  followThrough,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlanInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan {
  assertDraftMatchesFollowThrough(followThrough, outcomeDraft)
  const commandSetBlockers = commandSetMismatchBlockers(followThrough, outcomeDraft)
  const invalidCommandLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.status === "ready" && command.blockerLabels.length === 0
      ? []
      : [`Final-gate follow-through execution outcome draft entry for ${command.label} is not ready for commit.`],
  )
  const mismatchedSuggestedOutcomeLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome && command.suggestedOutcome.key !== command.key
      ? [`Suggested final-gate follow-through outcome for ${command.label} does not match the follow-through command.`]
      : [],
  )
  const nonAppliedSuggestedOutcomeLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome && command.suggestedOutcome.status !== "applied"
      ? [`Suggested final-gate follow-through outcome for ${command.label} must have applied status.`]
      : [],
  )
  const commandOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome ? [cloneOutcome(command.suggestedOutcome)] : [],
  )
  const missingOutcomeLabels = outcomeDraft.commandOutcomes
    .filter((command) => !command.suggestedOutcome)
    .map((command) => `Missing suggested final-gate follow-through outcome for ${command.label}.`)
  const modeBlockers =
    outcomeDraft.mode === "dry_run"
      ? []
      : ["Final-gate follow-through execution outcome commit requires a dry-run outcome draft."]
  const blockerLabels = uniqueLabels([
    ...commandSetBlockers,
    ...mismatchedSuggestedOutcomeLabels,
    ...nonAppliedSuggestedOutcomeLabels,
    ...outcomeDraft.commandOutcomes.flatMap((command) => command.blockerLabels),
    ...invalidCommandLabels,
    ...missingOutcomeLabels,
    ...modeBlockers,
    ...(outcomeDraft.status === "ready" ? [] : ["Final-gate follow-through execution outcome draft must be ready before commit."]),
  ])
  const status =
    outcomeDraft.status === "ready" &&
    commandOutcomes.length > 0 &&
    commandSetBlockers.length === 0 &&
    mismatchedSuggestedOutcomeLabels.length === 0 &&
    nonAppliedSuggestedOutcomeLabels.length === 0 &&
    invalidCommandLabels.length === 0 &&
    missingOutcomeLabels.length === 0 &&
    modeBlockers.length === 0
      ? "ready"
      : "blocked"

  return {
    adapterOutcomeBoundary:
      "Final-gate follow-through execution outcome commit plans are deterministic review data only; active customer-offer, file, release-review, export, connector, final-gate follow-through, RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commandOutcomeCount: status === "ready" ? commandOutcomes.length : 0,
    commandOutcomes: status === "ready" ? commandOutcomes : [],
    commitVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_VERSION,
    executionFingerprint: outcomeDraft.executionFingerprint,
    followThroughFingerprint: outcomeDraft.followThroughFingerprint,
    followThroughId: outcomeDraft.followThroughId,
    followThroughVersion: followThrough.followThroughVersion,
    latestApplyPlanId: status === "ready" ? outcomeDraft.latestApplyPlanId : undefined,
    latestCommitRecordId: status === "ready" ? outcomeDraft.latestCommitRecordId : undefined,
    latestCommittedExecutionFingerprint: status === "ready" ? outcomeDraft.latestCommittedExecutionFingerprint : undefined,
    latestExecutionFingerprint: status === "ready" ? outcomeDraft.latestExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: status === "ready" ? outcomeDraft.latestSourceExecutionFingerprint : undefined,
    nextOperatorMessage:
      status === "ready"
        ? `Commit ${commandOutcomes.length} reviewed non-CNC final-gate follow-through outcome${commandOutcomes.length === 1 ? "" : "s"}.`
        : blockerLabels.join(" ") ||
          "Final-gate follow-through execution outcome commit is blocked until the reviewed draft fully matches the follow-through plan.",
    readinessRecordId: status === "ready" ? outcomeDraft.readinessRecordId : undefined,
    reviewWarnings: [...outcomeDraft.reviewWarnings],
    status,
    targetRfqId: status === "ready" ? outcomeDraft.targetRfqId : undefined,
  }
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRun(
  input: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRunInput,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitRunResult {
  const commitPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitPlan(input)
  if (commitPlan.status !== "ready") {
    return { commitPlan }
  }

  return {
    commitPlan,
    executionRun: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor: input.actor,
      commandOutcomes: commitPlan.commandOutcomes,
      executedAt: input.executedAt,
      followThrough: input.followThrough,
      mode: "commit",
    }),
  }
}

function assertDraftMatchesFollowThrough(
  followThrough: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft,
): void {
  if (
    outcomeDraft.draftVersion !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_DRAFT_VERSION
  ) {
    throw new Error("unsupported final-gate follow-through execution outcome draft version")
  }
  const mismatches = [
    followThrough.followThroughId === outcomeDraft.followThroughId ? undefined : "followThroughId",
    followThrough.followThroughFingerprint === outcomeDraft.followThroughFingerprint ? undefined : "followThroughFingerprint",
    outcomeDraft.status !== "ready" || followThrough.targetRfqId === outcomeDraft.targetRfqId ? undefined : "targetRfqId",
    outcomeDraft.status !== "ready" || followThrough.readinessRecordId === outcomeDraft.readinessRecordId
      ? undefined
      : "readinessRecordId",
    outcomeDraft.status !== "ready" || followThrough.latestExecutionFingerprint === outcomeDraft.latestExecutionFingerprint
      ? undefined
      : "latestExecutionFingerprint",
    outcomeDraft.status !== "ready" || followThrough.latestApplyPlanId === outcomeDraft.latestApplyPlanId
      ? undefined
      : "latestApplyPlanId",
    outcomeDraft.status !== "ready" || followThrough.latestCommitRecordId === outcomeDraft.latestCommitRecordId
      ? undefined
      : "latestCommitRecordId",
    outcomeDraft.status !== "ready" ||
    followThrough.latestCommittedExecutionFingerprint === outcomeDraft.latestCommittedExecutionFingerprint
      ? undefined
      : "latestCommittedExecutionFingerprint",
    outcomeDraft.status !== "ready" ||
    followThrough.latestSourceExecutionFingerprint === outcomeDraft.latestSourceExecutionFingerprint
      ? undefined
      : "latestSourceExecutionFingerprint",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(`final-gate follow-through execution outcome draft does not match follow-through plan: ${mismatches.join(", ")}`)
  }
  const commandKeysMatch =
    followThrough.commands.length === outcomeDraft.commandOutcomes.length &&
    followThrough.commands.every((command, index) => command.key === outcomeDraft.commandOutcomes[index]?.key)
  const commandMismatches =
    outcomeDraft.status === "ready" && commandKeysMatch
      ? followThrough.commands.flatMap((command, index) =>
          commandDraftMatchesFollowThroughCommand(command, outcomeDraft.commandOutcomes[index], outcomeDraft)
            ? []
            : [command.key],
        )
      : []
  if (commandMismatches.length > 0) {
    throw new Error(
      `final-gate follow-through execution outcome draft does not match follow-through plan: commandOutcomes (${commandMismatches.join(", ")})`,
    )
  }
}

function commandSetMismatchBlockers(
  followThrough: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft,
): string[] {
  const planKeys = followThrough.commands.map((command) => command.key)
  const draftKeys = outcomeDraft.commandOutcomes.map((command) => command.key)
  if (planKeys.length !== draftKeys.length || planKeys.some((key, index) => key !== draftKeys[index])) {
    return ["Final-gate follow-through execution outcome draft command list does not match follow-through commands."]
  }
  return []
}

function cloneOutcome(
  outcome: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeInput {
  return {
    externalId: outcome.externalId,
    key: outcome.key,
    message: outcome.message,
    status: outcome.status,
    warnings: outcome.warnings ? [...outcome.warnings] : undefined,
  }
}

function commandDraftMatchesFollowThroughCommand(
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand,
  outcome: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandOutcomeDraft | undefined,
  draft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeDraft,
): boolean {
  if (!outcome || !draft.targetRfqId) {
    return false
  }
  const expectedExternalId = stableOutcomeId(outcomePrefix(command.key), draft.targetRfqId, draft.executionFingerprint)
  return (
    outcome.key === command.key &&
    outcome.label === command.label &&
    outcome.target === command.target &&
    outcome.status === "ready" &&
    outcome.idempotencyKey === command.idempotencyKey &&
    sameArray(outcome.blockerLabels, []) &&
    sameArray(outcome.evidenceFingerprints, command.evidenceFingerprints) &&
    outcome.externalId === expectedExternalId &&
    outcome.suggestedOutcome?.externalId === expectedExternalId &&
    outcome.suggestedOutcome.key === command.key &&
    outcome.suggestedOutcome.message === outcomeMessage(command) &&
    outcome.suggestedOutcome.status === "applied" &&
    sameArray(outcome.suggestedOutcome.warnings ?? [], [])
  )
}

function outcomePrefix(
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand["key"],
): string {
  return key.replaceAll("_", "-")
}

function outcomeMessage(
  command: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand,
): string {
  switch (command.key) {
    case "connector_reference_final_gate":
      return "Prepared connector reference final-gate outcome from reviewed follow-through execution evidence."
    case "customer_offer_final_gate":
      return "Prepared customer-offer final-gate outcome from reviewed follow-through execution evidence."
    case "file_export_final_gate":
      return "Prepared file export final-gate outcome from reviewed follow-through execution evidence."
    case "release_review_final_gate":
      return "Prepared release-review final-gate outcome from reviewed follow-through execution evidence."
    case "rollback_evidence_final_gate":
      return "Prepared rollback evidence final-gate outcome from reviewed follow-through execution evidence."
    default:
      return assertNever(command.key)
  }
}

function stableOutcomeId(...parts: string[]): string {
  return parts.map((part) => canonicalKeyPart(part)).join(":")
}

function canonicalKeyPart(value: string): string {
  const token = value.trim()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(token)) {
    throw new Error(
      "Non-CNC live-adapter final-gate follow-through outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
    )
  }
  return token
}

function sameArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function assertNever(value: never): never {
  throw new Error(`Unhandled final-gate follow-through command kind: ${String(value)}`)
}
