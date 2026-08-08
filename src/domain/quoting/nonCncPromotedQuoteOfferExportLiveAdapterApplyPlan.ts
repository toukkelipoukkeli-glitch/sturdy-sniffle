import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistory"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-plan.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus = "blocked" | "ready"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandStatus = "blocked" | "planned"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind =
  | "customer_offer_apply"
  | "file_export_apply"
  | "release_review_apply"
  | "connector_reference_apply"
  | "rollback_evidence_apply"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyCommand {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind
  label: string
  target: "connector" | "customer_offer" | "diagnostics" | "file_export" | "release_review"
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandStatus
  detail: string
  blockerLabels: string[]
  evidenceFingerprints: string[]
  idempotencyKey?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan {
  applyPlanVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION
  applyPlanId: string
  applyPlanFingerprint: string
  requestedAt: string
  requestedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus
  targetRfqId?: string
  latestCommitRecordId?: string
  latestCommitPlanId?: string
  latestSourceExecutionFingerprint?: string
  latestCommittedExecutionFingerprint?: string
  committedOutcomeCount: number
  historyRecordCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommand[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  operatorSummary: string
  adapterApplyBoundary: string
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanInput {
  outcomeCommitHistory: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary
  requestedAt: string
  requestedBy: string
}

const applyCommandDefinitions = [
  {
    detail: "Apply the reviewed non-CNC outcome commit to the future customer-offer draft adapter.",
    key: "customer_offer_apply",
    label: "Apply customer-offer draft",
    target: "customer_offer",
  },
  {
    detail: "Apply the reviewed text, PDF, and release-review artifact references to the future export adapter.",
    key: "file_export_apply",
    label: "Apply export artifacts",
    target: "file_export",
  },
  {
    detail: "Apply the reviewed release-review evidence to the future release adapter.",
    key: "release_review_apply",
    label: "Apply release-review packet",
    target: "release_review",
  },
  {
    detail: "Apply connector reference evidence after the future provider adapter confirms the customer offer and files.",
    key: "connector_reference_apply",
    label: "Apply connector references",
    target: "connector",
  },
  {
    detail: "Attach rollback diagnostics so local/mock fallback remains authoritative until live writes are enabled.",
    key: "rollback_evidence_apply",
    label: "Apply rollback evidence",
    target: "diagnostics",
  },
] as const satisfies ReadonlyArray<{
  detail: string
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommand["target"]
}>

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
  outcomeCommitHistory,
  requestedAt,
  requestedBy,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan {
  const normalizedRequestedAt = normalizeIsoTimestamp(requestedAt, "requestedAt")
  const normalizedRequestedBy = nonBlank(requestedBy, "requestedBy")
  const latestRecord = outcomeCommitHistory.latestRecord
  const blockerLabels = applyBlockers(outcomeCommitHistory)
  const status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus =
    blockerLabels.length === 0 ? "ready" : "blocked"
  const evidenceFingerprints = uniqueSorted([
    latestRecord?.commitRecordId,
    latestRecord?.sourceExecutionFingerprint,
    latestRecord?.committedExecutionFingerprint,
    latestRecord?.latestExecutionFingerprint,
    latestRecord?.latestReleaseExecutionFingerprint,
    latestRecord?.latestSourceExecutionFingerprint,
  ].filter(hasNonBlankEvidence))
  const commands = applyCommandDefinitions.map((command) =>
    buildApplyCommand({
      blockerLabels,
      command,
      evidenceFingerprints,
      latestCommittedExecutionFingerprint: latestRecord?.committedExecutionFingerprint,
      status,
      targetRfqId: latestRecord?.targetRfqId,
    }),
  )
  const plannedCommandCount = commands.filter((command) => command.status === "planned").length
  const blockedCommandCount = commands.filter((command) => command.status === "blocked").length
  const basePlan = {
    blockerLabels,
    blockedCommandCount,
    commandCount: commands.length,
    commands,
    committedOutcomeCount: status === "ready" ? latestRecord?.commandOutcomeCount ?? 0 : 0,
    historyRecordCount: outcomeCommitHistory.totalRecords,
    latestCommitPlanId: status === "ready" ? latestRecord?.planId : undefined,
    latestCommitRecordId: status === "ready" ? latestRecord?.commitRecordId : undefined,
    latestCommittedExecutionFingerprint: status === "ready" ? latestRecord?.committedExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: status === "ready" ? latestRecord?.sourceExecutionFingerprint : undefined,
    plannedCommandCount,
    requestedAt: normalizedRequestedAt,
    requestedBy: normalizedRequestedBy,
    reviewWarnings: [...outcomeCommitHistory.latestRecord?.reviewWarnings ?? []],
    status,
    targetRfqId: status === "ready" ? latestRecord?.targetRfqId : undefined,
  }
  const applyPlanFingerprint = fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stableJson(basePlan))
  const plan: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan, "exportText"> = {
    ...basePlan,
    adapterApplyBoundary:
      "Live-adapter apply plans are deterministic review data only; this helper does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
    applyPlanFingerprint,
    applyPlanId: `non-cnc-promoted-quote-offer-export-live-adapter-apply-plan-${applyPlanFingerprint}`,
    applyPlanVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_VERSION,
    nextActionLabels: nextActionLabels(status, blockerLabels, commands.length),
    operatorSummary: operatorSummary(status, latestRecord?.targetRfqId, commands.length, blockerLabels),
  }

  return {
    ...plan,
    exportText: buildExportText(plan),
  }
}

function applyBlockers(
  history: NonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary,
): string[] {
  const latestRecord = history.latestRecord
  if (!latestRecord) {
    return ["Persist a committed live-adapter outcome history record before planning live apply commands."]
  }

  return uniqueLabels([
    history.status === "committed" ? "" : "Latest live-adapter outcome commit history must be committed.",
    latestRecord.status === "ready" ? "" : "Latest live-adapter outcome commit record must be ready.",
    latestRecord.disposition === "commit_ready" ? "" : "Latest live-adapter outcome commit record must be commit-ready.",
    hasNonBlankEvidence(latestRecord.targetRfqId)
      ? ""
      : "Latest live-adapter outcome commit record must include target RFQ evidence.",
    hasNonBlankEvidence(latestRecord.committedExecutionFingerprint)
      ? ""
      : "Latest live-adapter outcome commit record must include committed execution evidence.",
    history.committedExecutionFingerprints.includes(latestRecord.committedExecutionFingerprint ?? "")
      ? ""
      : "Outcome commit history summary does not include the latest committed execution evidence.",
    history.commitReadyPlanIds.includes(latestRecord.planId)
      ? ""
      : "Outcome commit history summary does not include the latest commit-ready plan.",
    latestRecord.commandOutcomeCount > 0
      ? ""
      : "Latest live-adapter outcome commit record must include at least one reviewed command outcome.",
  ])
}

function buildApplyCommand({
  blockerLabels,
  command,
  evidenceFingerprints,
  latestCommittedExecutionFingerprint,
  status,
  targetRfqId,
}: {
  blockerLabels: string[]
  command: (typeof applyCommandDefinitions)[number]
  evidenceFingerprints: string[]
  latestCommittedExecutionFingerprint: string | undefined
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus
  targetRfqId: string | undefined
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyCommand {
  if (status === "blocked") {
    return {
      blockerLabels: [...blockerLabels],
      detail: command.detail,
      evidenceFingerprints: [],
      key: command.key,
      label: command.label,
      status: "blocked",
      target: command.target,
    }
  }

  return {
    blockerLabels: [],
    detail: command.detail,
    evidenceFingerprints: [...evidenceFingerprints],
    idempotencyKey: buildApplyIdempotencyKey({
      key: command.key,
      latestCommittedExecutionFingerprint: latestCommittedExecutionFingerprint ?? "",
      targetRfqId: targetRfqId ?? "",
    }),
    key: command.key,
    label: command.label,
    status: "planned",
    target: command.target,
  }
}

function buildApplyIdempotencyKey({
  key,
  latestCommittedExecutionFingerprint,
  targetRfqId,
}: {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyCommandKind
  latestCommittedExecutionFingerprint: string
  targetRfqId: string
}): string {
  return `non-cnc-live-adapter-apply:${targetRfqId}:${key}:${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({ key, latestCommittedExecutionFingerprint, targetRfqId }),
  ).slice(0, 16)}`
}

function nextActionLabels(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus,
  blockerLabels: string[],
  commandCount: number,
): string[] {
  if (status === "ready") {
    return [
      `Review ${formatCount(commandCount, "planned live-adapter apply command")} before connecting provider writes.`,
      "Keep local/mock fallback authoritative until the live adapter records execution outcomes.",
    ]
  }
  return uniqueLabels([
    ...blockerLabels,
    "Do not apply live customer-offer export state from blocked outcome history.",
  ])
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanStatus,
  targetRfqId: string | undefined,
  commandCount: number,
  blockerLabels: string[],
): string {
  if (status === "ready") {
    return `Ready live-adapter apply plan prepares ${formatCount(
      commandCount,
      "review-only apply command",
    )} for ${targetRfqId}; live customer-offer, file, release-review, export, and connector writes remain disabled.`
  }
  return `Live-adapter apply plan is blocked by ${formatCount(
    blockerLabels.length,
    "blocker",
  )}; persist committed outcome history before wiring live customer-offer export state.`
}

function buildExportText(plan: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan, "exportText">): string {
  return [
    "Non-CNC offer export live adapter apply plan",
    `Status: ${plan.status}`,
    `Target RFQ: ${plan.targetRfqId ?? "none"}`,
    `History records: ${plan.historyRecordCount}`,
    `Committed outcomes: ${plan.committedOutcomeCount}`,
    `Commands: ${plan.commandCount}`,
    `Planned commands: ${plan.plannedCommandCount}`,
    `Blocked commands: ${plan.blockedCommandCount}`,
    `Latest commit record: ${plan.latestCommitRecordId ?? "none"}`,
    `Latest committed execution: ${plan.latestCommittedExecutionFingerprint ?? "none"}`,
    `Blockers: ${plan.blockerLabels.join("; ") || "none"}`,
    `Warnings: ${plan.reviewWarnings.join("; ") || "none"}`,
    "Command plan:",
    ...plan.commands.map(
      (command) =>
        `- ${command.key} | ${command.status} | ${command.target} | ${command.idempotencyKey ?? "blocked"}`,
    ),
    `Boundary: ${plan.adapterApplyBoundary}`,
  ].join("\n")
}

function hasNonBlankEvidence(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort()
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}
