import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistory"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-adapter-execution-outcome-commit.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitStatus =
  | "blocked"
  | "ready"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan {
  commitVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION
  executionFingerprint: string
  providerAdapterBoundaryId?: string
  providerAdapterBoundaryFingerprint?: string
  providerAdapterBoundaryVersion?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord["providerAdapterBoundaryVersion"]
  providerReadModelRecordId?: string
  liveWriteBoundaryId?: string
  liveWriteBoundaryFingerprint?: string
  adapterBoundaryId?: string
  adapterBoundaryFingerprint?: string
  commitRecordId?: string
  committedExecutionFingerprint?: string
  followThroughId?: string
  targetRfqId?: string
  readinessRecordId?: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitStatus
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  commandOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
  providerAdapterExecutionOutcomeCommitBoundary: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlanInput {
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRunInput
  extends BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlanInput {
  actor: string
  executedAt: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRunResult {
  commitPlan: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan
  executionRun?: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun
}

const commandDefinitions = [
  {
    key: "customer_offer_provider_prepare",
    label: "Prepare customer offer provider write",
    message: "Prepared customer-offer provider outcome from reviewed final-gate provider-adapter execution evidence.",
    sourceIdempotencySuffix: "customer_offer_follow_through",
    target: "customer_offer",
  },
  {
    key: "file_export_provider_prepare",
    label: "Prepare file export provider write",
    message: "Prepared file export provider outcome from reviewed final-gate provider-adapter execution evidence.",
    sourceIdempotencySuffix: "file_export_follow_through",
    target: "file_export",
  },
  {
    key: "release_review_provider_prepare",
    label: "Prepare release review provider write",
    message: "Prepared release-review provider outcome from reviewed final-gate provider-adapter execution evidence.",
    sourceIdempotencySuffix: "release_review_follow_through",
    target: "release_review",
  },
  {
    key: "connector_reference_provider_prepare",
    label: "Prepare connector provider write",
    message: "Prepared connector provider outcome from reviewed final-gate provider-adapter execution evidence.",
    sourceIdempotencySuffix: "connector_reference_follow_through",
    target: "connector",
  },
  {
    key: "final_gate_follow_through_provider_prepare",
    label: "Prepare final gate provider write",
    message: "Prepared final-gate follow-through provider outcome from reviewed provider-adapter execution evidence.",
    sourceIdempotencySuffix: "final_gate_follow_through",
    target: "final_gate_follow_through",
  },
  {
    key: "rollback_evidence_provider_prepare",
    label: "Prepare rollback evidence",
    message: "Prepared rollback provider evidence outcome from reviewed final-gate provider-adapter execution evidence.",
    sourceIdempotencySuffix: "rollback_evidence_follow_through",
    target: "diagnostics",
  },
] as const satisfies ReadonlyArray<{
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft["key"]
  label: string
  message: string
  sourceIdempotencySuffix: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft["target"]
}>

const trustedProviderAdapterExecutionDraftActor = "FactoryBid Operator"

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan({
  history,
  outcomeDraft,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlanInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan {
  const validationBlockers = draftValidationBlockerLabels(history, outcomeDraft)
  if (validationBlockers.length > 0) {
    return buildBlockedCommitPlan(outcomeDraft, validationBlockers)
  }
  const historyBlockers = providerAdapterExecutionOutcomeCommitHistoryBlockers(history)
  const commandSetBlockers = commandSetMismatchBlockers(outcomeDraft)
  const invalidCommandLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.status === "ready" && command.blockerLabels.length === 0
      ? []
      : [`Final-gate provider-adapter execution outcome draft entry for ${command.label} is not ready for commit.`],
  )
  const mismatchedSuggestedOutcomeLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome && command.suggestedOutcome.key !== command.key
      ? [`Suggested final-gate provider-adapter execution outcome for ${command.label} does not match the provider-adapter command.`]
      : [],
  )
  const nonAppliedSuggestedOutcomeLabels = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome && command.suggestedOutcome.status !== "applied"
      ? [`Suggested final-gate provider-adapter execution outcome for ${command.label} must have applied status.`]
      : [],
  )
  const commandOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
    command.suggestedOutcome ? [cloneOutcome(command.suggestedOutcome)] : [],
  )
  const missingOutcomeLabels = outcomeDraft.commandOutcomes
    .filter((command) => !command.suggestedOutcome)
    .map((command) => `Missing suggested final-gate provider-adapter execution outcome for ${command.label}.`)
  const modeBlockers =
    outcomeDraft.mode === "dry_run"
      ? []
      : ["Final-gate provider-adapter execution outcome commit requires a dry-run outcome draft."]
  const blockerLabels = uniqueLabels([
    ...historyBlockers,
    ...commandSetBlockers,
    ...mismatchedSuggestedOutcomeLabels,
    ...nonAppliedSuggestedOutcomeLabels,
    ...outcomeDraft.commandOutcomes.flatMap((command) => command.blockerLabels),
    ...invalidCommandLabels,
    ...missingOutcomeLabels,
    ...modeBlockers,
    ...(outcomeDraft.status === "ready"
      ? []
      : ["Final-gate provider-adapter execution outcome draft must be ready before commit."]),
  ])
  const status =
    outcomeDraft.status === "ready" &&
    commandOutcomes.length > 0 &&
    historyBlockers.length === 0 &&
    commandSetBlockers.length === 0 &&
    mismatchedSuggestedOutcomeLabels.length === 0 &&
    nonAppliedSuggestedOutcomeLabels.length === 0 &&
    invalidCommandLabels.length === 0 &&
    missingOutcomeLabels.length === 0 &&
    modeBlockers.length === 0
      ? "ready"
      : "blocked"
  if (status !== "ready") {
    return buildBlockedCommitPlan(outcomeDraft, blockerLabels)
  }
  const latestRecord = history.latestRecord

  return {
    adapterBoundaryFingerprint: outcomeDraft.adapterBoundaryFingerprint,
    adapterBoundaryId: outcomeDraft.adapterBoundaryId,
    blockerLabels: [],
    commandOutcomeCount: commandOutcomes.length,
    commandOutcomes,
    committedExecutionFingerprint: outcomeDraft.committedExecutionFingerprint,
    commitRecordId: outcomeDraft.commitRecordId,
    commitVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
    executionFingerprint: outcomeDraft.executionFingerprint,
    followThroughId: outcomeDraft.followThroughId,
    liveWriteBoundaryFingerprint: outcomeDraft.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: outcomeDraft.liveWriteBoundaryId,
    nextOperatorMessage:
      `Commit ${formatCount(commandOutcomes.length, "reviewed non-CNC final-gate provider-adapter execution outcome")}.`,
    pendingWriteIntentCount: outcomeDraft.pendingWriteIntentCount,
    providerAdapterBoundaryFingerprint: outcomeDraft.providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: outcomeDraft.providerAdapterBoundaryId,
    providerAdapterBoundaryVersion: latestRecord?.providerAdapterBoundaryVersion,
    providerAdapterExecutionOutcomeCommitBoundary:
      "Final-gate provider-adapter execution outcome commit plans are deterministic review data only; customer-offer, file, release-review, export, connector, final-gate follow-through, RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
    providerReadModelRecordId: outcomeDraft.providerReadModelRecordId,
    readinessRecordId: outcomeDraft.readinessRecordId,
    reviewedOutcomeCount: outcomeDraft.reviewedOutcomeCount,
    reviewWarnings: [...outcomeDraft.reviewWarnings],
    status,
    targetRfqId: outcomeDraft.targetRfqId,
  }
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
  input: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRunInput,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRunResult {
  const commitPlan =
    buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan(
      input,
    )
  if (commitPlan.status !== "ready") {
    return { commitPlan }
  }

  return {
    commitPlan,
    executionRun:
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
        {
          actor: input.actor,
          commandOutcomes: commitPlan.commandOutcomes,
          executedAt: input.executedAt,
          history: input.history,
          mode: "commit",
        },
      ),
  }
}

function assertDraftVersion(
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
): void {
  if (
    outcomeDraft.draftVersion !==
    NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION
  ) {
    throw new Error("unsupported final-gate provider-adapter execution outcome draft version")
  }
}

function draftValidationBlockerLabels(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
): string[] {
  try {
    assertDraftVersion(outcomeDraft)
    assertReadyDraftMatchesHistory(history, outcomeDraft)
    return []
  } catch (error) {
    return [formatValidationBlockerLabel(error)]
  }
}

function buildBlockedCommitPlan(
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
  blockerLabels: string[],
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan {
  const blockers = uniqueLabels(blockerLabels)
  return {
    blockerLabels: blockers,
    commandOutcomeCount: 0,
    commandOutcomes: [],
    commitVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
    executionFingerprint: outcomeDraft.executionFingerprint,
    nextOperatorMessage:
      blockers.join(" ") ||
      "Final-gate provider-adapter execution outcome commit is blocked until the reviewed draft fully matches ready provider-adapter boundary history.",
    pendingWriteIntentCount: 0,
    providerAdapterExecutionOutcomeCommitBoundary:
      "Final-gate provider-adapter execution outcome commit plans are deterministic review data only; customer-offer, file, release-review, export, connector, final-gate follow-through, RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
    reviewedOutcomeCount: 0,
    reviewWarnings: [...outcomeDraft.reviewWarnings],
    status: "blocked",
  }
}

function assertReadyDraftMatchesHistory(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
): void {
  if (outcomeDraft.status !== "ready") {
    return
  }
  const latestRecord = history.latestRecord
  if (!latestRecord) {
    throw new Error(
      "final-gate provider-adapter execution outcome draft does not match provider-adapter boundary history: latestRecord",
    )
  }
  const expectedExecutionFingerprint = trustedProviderAdapterExecutionFingerprint(history, latestRecord)
  const mismatches = [
    history.status === "ready" ? undefined : "historyStatus",
    latestRecord.status === "ready" ? undefined : "recordStatus",
    latestRecord.disposition === "provider_adapter_ready" ? undefined : "disposition",
    expectedExecutionFingerprint === outcomeDraft.executionFingerprint ? undefined : "executionFingerprint",
    includesValue(history.readyBoundaryIds, latestRecord.providerAdapterBoundaryId) ? undefined : "readyBoundaryIds",
    latestRecord.commandIdempotencyKeys.every((key) => includesValue(history.commandIdempotencyKeys, key))
      ? undefined
      : "commandIdempotencyKeys",
    latestRecord.evidenceFingerprints.every((fingerprint) => includesValue(history.evidenceFingerprints, fingerprint))
      ? undefined
      : "evidenceFingerprints",
    latestRecord.providerAdapterBoundaryId === outcomeDraft.providerAdapterBoundaryId
      ? undefined
      : "providerAdapterBoundaryId",
    latestRecord.providerAdapterBoundaryFingerprint === outcomeDraft.providerAdapterBoundaryFingerprint
      ? undefined
      : "providerAdapterBoundaryFingerprint",
    latestRecord.providerReadModelRecordId === outcomeDraft.providerReadModelRecordId
      ? undefined
      : "providerReadModelRecordId",
    latestRecord.liveWriteBoundaryId === outcomeDraft.liveWriteBoundaryId ? undefined : "liveWriteBoundaryId",
    latestRecord.liveWriteBoundaryFingerprint === outcomeDraft.liveWriteBoundaryFingerprint
      ? undefined
      : "liveWriteBoundaryFingerprint",
    latestRecord.adapterBoundaryId === outcomeDraft.adapterBoundaryId ? undefined : "adapterBoundaryId",
    latestRecord.adapterBoundaryFingerprint === outcomeDraft.adapterBoundaryFingerprint
      ? undefined
      : "adapterBoundaryFingerprint",
    latestRecord.commitRecordId === outcomeDraft.commitRecordId ? undefined : "commitRecordId",
    latestRecord.committedExecutionFingerprint === outcomeDraft.committedExecutionFingerprint
      ? undefined
      : "committedExecutionFingerprint",
    latestRecord.followThroughId === outcomeDraft.followThroughId ? undefined : "followThroughId",
    latestRecord.targetRfqId === outcomeDraft.targetRfqId ? undefined : "targetRfqId",
    latestRecord.readinessRecordId === outcomeDraft.readinessRecordId ? undefined : "readinessRecordId",
    latestRecord.pendingWriteIntentCount === outcomeDraft.pendingWriteIntentCount
      ? undefined
      : "pendingWriteIntentCount",
    latestRecord.reviewedOutcomeCount === outcomeDraft.reviewedOutcomeCount ? undefined : "reviewedOutcomeCount",
  ].filter((field): field is string => Boolean(field))
  if (mismatches.length > 0) {
    throw new Error(
      `final-gate provider-adapter execution outcome draft does not match provider-adapter boundary history: ${mismatches.join(", ")}`,
    )
  }
  const commandSetBlockers = commandSetMismatchBlockers(outcomeDraft)
  if (commandSetBlockers.length > 0) {
    return
  }
  const commandMismatches = commandDefinitions.flatMap((command, index) =>
    commandDraftMatchesProviderAdapterCommand(
      command,
      outcomeDraft.commandOutcomes[index],
      outcomeDraft,
      latestRecord,
      expectedExecutionFingerprint,
    )
      ? []
      : [command.key],
  )
  if (commandMismatches.length > 0) {
    throw new Error(
      `final-gate provider-adapter execution outcome draft does not match provider-adapter boundary history: commandOutcomes (${commandMismatches.join(", ")})`,
    )
  }
}

function providerAdapterExecutionOutcomeCommitHistoryBlockers(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
): string[] {
  const latestRecord = history.latestRecord
  if (!latestRecord) {
    return [
      "Persist a final-gate provider-adapter boundary history record before committing provider-adapter execution outcomes.",
    ]
  }
  return uniqueLabels([
    history.status === "ready"
      ? ""
      : "Final-gate provider-adapter execution outcome commit requires ready provider-adapter boundary history.",
    latestRecord.status === "ready"
      ? ""
      : "Latest final-gate provider-adapter boundary must be ready before committing execution outcomes.",
    latestRecord.disposition === "provider_adapter_ready"
      ? ""
      : "Latest final-gate provider-adapter boundary must be provider-adapter ready before committing execution outcomes.",
    includesValue(history.readyBoundaryIds, latestRecord.providerAdapterBoundaryId)
      ? ""
      : "Latest provider-adapter boundary must be present in the ready boundary history index.",
    latestRecord.commandIdempotencyKeys.length > 0 &&
    latestRecord.commandIdempotencyKeys.every((key) => includesValue(history.commandIdempotencyKeys, key))
      ? ""
      : "Latest provider-adapter command idempotency keys must be present in the history index.",
    latestRecord.evidenceFingerprints.length > 0 &&
    latestRecord.evidenceFingerprints.every((fingerprint) => includesValue(history.evidenceFingerprints, fingerprint))
      ? ""
      : "Latest provider-adapter evidence fingerprints must be present in the history index.",
  ])
}

function commandSetMismatchBlockers(
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
): string[] {
  const expectedKeys = commandDefinitions.map((command) => command.key)
  const draftKeys = outcomeDraft.commandOutcomes.map((command) => command.key)
  if (expectedKeys.length !== draftKeys.length || expectedKeys.some((key, index) => key !== draftKeys[index])) {
    return [
      "Final-gate provider-adapter execution outcome draft command list does not match provider-adapter execution commands.",
    ]
  }
  return []
}

function cloneOutcome(
  outcome: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeInput {
  return {
    externalId: outcome.externalId,
    key: outcome.key,
    message: outcome.message,
    status: outcome.status,
    warnings: outcome.warnings ? [...outcome.warnings] : undefined,
  }
}

function commandDraftMatchesProviderAdapterCommand(
  command: (typeof commandDefinitions)[number],
  outcome:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft
    | undefined,
  outcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
  record: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
  expectedExecutionFingerprint: string,
): boolean {
  if (!outcome || !outcomeDraft.targetRfqId) {
    return false
  }
  const expectedIdempotencyKey = commandIdempotencyKeyForSuffix(
    record.commandIdempotencyKeys,
    command.sourceIdempotencySuffix,
  )
  if (!expectedIdempotencyKey) {
    return false
  }
  const expectedExternalId = stableOutcomeId(
    outcomePrefix(command.key),
    outcomeDraft.targetRfqId,
    expectedExecutionFingerprint,
  )
  return (
    outcome.key === command.key &&
    outcome.label === command.label &&
    outcome.target === command.target &&
    outcome.status === "ready" &&
    outcome.idempotencyKey === expectedIdempotencyKey &&
    sameArray(outcome.blockerLabels, []) &&
    sameArray(outcome.evidenceFingerprints, record.evidenceFingerprints) &&
    outcome.externalId === expectedExternalId &&
    outcome.suggestedOutcome?.externalId === expectedExternalId &&
    outcome.suggestedOutcome.key === command.key &&
    outcome.suggestedOutcome.message === command.message &&
    outcome.suggestedOutcome.status === "applied" &&
    sameArray(outcome.suggestedOutcome.warnings ?? [], [])
  )
}

function trustedProviderAdapterExecutionFingerprint(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
  latestRecord: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
): string {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
    {
      actor: trustedProviderAdapterExecutionDraftActor,
      executedAt: latestRecord.requestedAt,
      history,
      mode: "dry_run",
    },
  ).executionFingerprint
}

function commandIdempotencyKeyForSuffix(commandIdempotencyKeys: string[], suffix: string): string | undefined {
  return commandIdempotencyKeys.find((key) => key.endsWith(`:${suffix}`))
}

function outcomePrefix(
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandOutcomeDraft["key"],
): string {
  return key.replaceAll("_", "-")
}

function stableOutcomeId(...parts: string[]): string {
  return parts.map((part) => canonicalKeyPart(part)).join(":")
}

function canonicalKeyPart(value: string): string {
  const token = value.trim()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(token)) {
    throw new Error(
      "Non-CNC final-gate provider-adapter execution outcome commit ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
    )
  }
  return token
}

function includesValue(values: string[], value: string | undefined): boolean {
  return !!value && values.includes(value)
}

function sameArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function formatValidationBlockerLabel(error: unknown): string {
  const message = error instanceof Error ? error.message : "Invalid final-gate provider-adapter execution outcome draft"
  const trimmed = message.trim()
  if (!trimmed) {
    return "Invalid final-gate provider-adapter execution outcome draft."
  }
  const capitalized = `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}
