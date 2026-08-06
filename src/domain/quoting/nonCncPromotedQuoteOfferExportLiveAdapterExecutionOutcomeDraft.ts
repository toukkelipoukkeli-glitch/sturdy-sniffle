import type {
  NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution,
  NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput,
  NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-execution-outcome-draft.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraftStatus = "blocked" | "ready"
export type NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeDraftStatus = "blocked" | "ready"

export interface NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeDraft {
  key: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution["key"]
  kind: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution["kind"]
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution["target"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeDraftStatus
  blockerLabels: string[]
  evidenceFingerprints: string[]
  idempotencyKey?: string
  externalId?: string
  suggestedOutcome?: NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeInput
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft {
  draftVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION
  executionFingerprint: string
  mode: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun["mode"]
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraftStatus
  planId: string
  planFingerprint: string
  decisionFingerprint: string
  targetRfqId?: string
  latestExecutionFingerprint?: string
  latestPackageId?: string
  latestPlanId?: string
  latestReleaseExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  readyOutcomeCount: number
  blockedOutcomeCount: number
  commandOutcomes: NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeDraft[]
  nextOperatorMessage: string
  reviewWarnings: string[]
  adapterOutcomeBoundary: string
}

export function buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(
  run: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft {
  const commandOutcomes = run.commands.map((command) => buildCommandOutcomeDraft(run, command))
  const readyOutcomeCount = commandOutcomes.filter((outcome) => outcome.status === "ready").length
  const blockedOutcomeCount = commandOutcomes.length - readyOutcomeCount
  const status = run.mode === "dry_run" && run.status === "prepared" && blockedOutcomeCount === 0 ? "ready" : "blocked"
  const blockerLabels = uniqueLabels(
    status === "ready" ? [] : commandOutcomes.flatMap((outcome) => outcome.blockerLabels).concat(run.nextActions),
  )

  return {
    adapterOutcomeBoundary:
      "Live-adapter execution outcome drafts are deterministic review data only; active customer-offer, file, release-review, export, connector, RFQ quote, offer, and release state stay unchanged until an operator commits them.",
    blockedOutcomeCount,
    commandOutcomes,
    decisionFingerprint: run.decisionFingerprint,
    draftVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION,
    executionFingerprint: run.executionFingerprint,
    latestExecutionFingerprint: status === "ready" ? run.latestExecutionFingerprint : undefined,
    latestPackageId: status === "ready" ? run.latestPackageId : undefined,
    latestPlanId: status === "ready" ? run.latestPlanId : undefined,
    latestReleaseExecutionFingerprint: status === "ready" ? run.latestReleaseExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: status === "ready" ? run.latestSourceExecutionFingerprint : undefined,
    mode: run.mode,
    nextOperatorMessage:
      status === "ready"
        ? `Review and commit ${formatCount(readyOutcomeCount, "live-adapter command outcome")}.`
        : blockerLabels.join(" ") || "Live-adapter execution is not ready for committed outcomes.",
    planFingerprint: run.planFingerprint,
    planId: run.planId,
    readyOutcomeCount,
    reviewWarnings: [...run.warnings],
    status,
    targetRfqId: status === "ready" ? run.targetRfqId : undefined,
  }
}

function buildCommandOutcomeDraft(
  run: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
  command: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution,
): NonCncPromotedQuoteOfferExportLiveAdapterCommandOutcomeDraft {
  const blockerLabels = commandOutcomeBlockerLabels(run, command)
  if (blockerLabels.length > 0) {
    return {
      blockerLabels,
      evidenceFingerprints: [],
      idempotencyKey: command.idempotencyKey,
      key: command.key,
      kind: command.kind,
      label: command.label,
      status: "blocked",
      target: command.target,
    }
  }

  const externalId = outcomeExternalId(command.key, run.targetRfqId, run.executionFingerprint)
  return {
    blockerLabels: [],
    evidenceFingerprints: [...command.evidenceFingerprints],
    externalId,
    idempotencyKey: command.idempotencyKey,
    key: command.key,
    kind: command.kind,
    label: command.label,
    status: "ready",
    suggestedOutcome: {
      externalId,
      key: command.key,
      message: outcomeMessage(command),
      status: "succeeded",
      warnings: [...command.warnings],
    },
    target: command.target,
  }
}

function commandOutcomeBlockerLabels(
  run: NonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
  command: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution,
): string[] {
  if (run.mode !== "dry_run") {
    return ["Live-adapter outcome drafts must be based on a dry-run execution."]
  }
  if (run.status !== "prepared") {
    return run.nextActions.length > 0 ? [...run.nextActions] : ["Live-adapter execution is not prepared."]
  }
  if (command.status !== "prepared") {
    return command.blockerLabels.length > 0 ? [...command.blockerLabels] : [`${command.label} is not prepared.`]
  }
  if (!command.idempotencyKey) {
    return [`${command.label} is missing its idempotency key.`]
  }
  if (!run.targetRfqId) {
    return [`${command.label} is missing the target RFQ id.`]
  }
  if (command.evidenceFingerprints.length === 0) {
    return [`${command.label} is missing live-adapter evidence fingerprints.`]
  }
  return []
}

function outcomeExternalId(
  key: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution["key"],
  targetRfqId: string | undefined,
  executionFingerprint: string,
): string {
  return stableOutcomeId(outcomePrefix(key), targetRfqId ?? "unassigned-rfq", executionFingerprint)
}

function outcomePrefix(key: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution["key"]): string {
  return key.replaceAll("_", "-")
}

function outcomeMessage(command: NonCncPromotedQuoteOfferExportLiveAdapterCommandExecution): string {
  switch (command.key) {
    case "connector_sync":
      return "Prepared connector sync outcome from reviewed non-CNC live-adapter execution evidence."
    case "customer_offer_write":
      return "Prepared customer-offer write outcome from reviewed non-CNC live-adapter execution evidence."
    case "file_export_write":
      return "Prepared file export write outcome from reviewed non-CNC live-adapter execution evidence."
    case "release_review_write":
      return "Prepared release-review write outcome from reviewed non-CNC live-adapter execution evidence."
    case "rollback_diagnostics":
      return "Prepared rollback diagnostics outcome from reviewed non-CNC live-adapter execution evidence."
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
      "Non-CNC live-adapter execution outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
    )
  }
  return token
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function formatCount(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`
}

function assertNever(value: never): never {
  throw new Error(`Unsupported non-CNC live-adapter execution outcome command: ${JSON.stringify(value)}`)
}
