import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistory"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus =
  | "blocked"
  | "ready"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandStatus =
  | "blocked"
  | "planned"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind =
  | "customer_offer_final_gate"
  | "file_export_final_gate"
  | "release_review_final_gate"
  | "connector_reference_final_gate"
  | "rollback_evidence_final_gate"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughTarget =
  | "connector"
  | "customer_offer"
  | "diagnostics"
  | "file_export"
  | "release_review"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughTarget
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandStatus
  detail: string
  blockerLabels: string[]
  evidenceFingerprints: string[]
  idempotencyKey?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  followThroughVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_VERSION
  followThroughId: string
  followThroughFingerprint: string
  requestedAt: string
  requestedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus
  targetRfqId?: string
  readinessRecordId?: string
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  historyRecordCount: number
  readyRecordCount: number
  blockedRecordCount: number
  appliedCommandCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  operatorSummary: string
  finalGateBoundary: string
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlanInput {
  readinessHistory: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary
  requestedAt: string
  requestedBy: string
}

const commandDefinitions = [
  {
    detail: "Review the final-gate evidence for the future customer-offer draft adapter.",
    key: "customer_offer_final_gate",
    label: "Review customer-offer final gate",
    target: "customer_offer",
  },
  {
    detail: "Review text, PDF, and release-review artifact readiness before future export writes.",
    key: "file_export_final_gate",
    label: "Review export artifact final gate",
    target: "file_export",
  },
  {
    detail: "Review release-review packet readiness before future release adapter writes.",
    key: "release_review_final_gate",
    label: "Review release-review final gate",
    target: "release_review",
  },
  {
    detail: "Review connector reference readiness before future connector synchronization.",
    key: "connector_reference_final_gate",
    label: "Review connector final gate",
    target: "connector",
  },
  {
    detail: "Preserve rollback diagnostics and local/mock fallback evidence before any live write path is enabled.",
    key: "rollback_evidence_final_gate",
    label: "Review rollback final gate",
    target: "diagnostics",
  },
] as const satisfies ReadonlyArray<{
  detail: string
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughTarget
}>

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
  readinessHistory,
  requestedAt,
  requestedBy,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlanInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  const normalizedRequestedAt = normalizeIsoTimestamp(requestedAt, "requestedAt")
  const normalizedRequestedBy = nonBlank(requestedBy, "requestedBy")
  const blockerLabels = followThroughBlockers(readinessHistory)
  const status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus =
    blockerLabels.length === 0 ? "ready" : "blocked"
  const latestRecord = readinessHistory.latestRecord
  const evidenceFingerprints =
    status === "ready" && latestRecord
      ? uniqueSorted([
          latestRecord.latestExecutionFingerprint,
          latestRecord.latestApplyPlanFingerprint,
          latestRecord.latestApplyPlanId,
          latestRecord.latestCommitPlanId,
          latestRecord.latestCommitRecordId,
          latestRecord.latestCommittedExecutionFingerprint,
          latestRecord.latestSourceExecutionFingerprint,
          latestRecord.readinessRecordId,
        ].filter(hasNonBlankEvidence))
      : []
  const commands = commandDefinitions.map((command) =>
    buildCommand({
      blockerLabels,
      command,
      evidenceFingerprints,
      readinessRecordId: latestRecord?.readinessRecordId,
      status,
      targetRfqId: latestRecord?.targetRfqId,
    }),
  )
  const plannedCommandCount = commands.filter((command) => command.status === "planned").length
  const blockedCommandCount = commands.filter((command) => command.status === "blocked").length
  const basePlan = {
    appliedCommandCount: status === "ready" ? latestRecord?.appliedCommandCount ?? 0 : 0,
    blockedCommandCount,
    blockedRecordCount: readinessHistory.blockedCount,
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commandCount: commands.length,
    commands,
    historyRecordCount: readinessHistory.totalRecords,
    latestApplyPlanId: status === "ready" ? latestRecord?.latestApplyPlanId : undefined,
    latestCommitRecordId: status === "ready" ? latestRecord?.latestCommitRecordId : undefined,
    latestCommittedExecutionFingerprint: status === "ready" ? latestRecord?.latestCommittedExecutionFingerprint : undefined,
    latestExecutionFingerprint: status === "ready" ? latestRecord?.latestExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: status === "ready" ? latestRecord?.latestSourceExecutionFingerprint : undefined,
    plannedCommandCount,
    readinessRecordId: status === "ready" ? latestRecord?.readinessRecordId : undefined,
    readyRecordCount: readinessHistory.readyCount,
    requestedAt: normalizedRequestedAt,
    requestedBy: normalizedRequestedBy,
    reviewWarnings: latestRecord ? [...latestRecord.reviewWarnings] : [],
    status,
    targetRfqId: status === "ready" ? latestRecord?.targetRfqId : undefined,
  }
  const followThroughFingerprint = fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stableJson(basePlan))
  const plan: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
    "exportText"
  > = {
    ...basePlan,
    finalGateBoundary:
      "Apply-execution final-gate follow-through plans are deterministic review data only; this helper does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
    followThroughFingerprint,
    followThroughId: `non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-${followThroughFingerprint}`,
    followThroughVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_VERSION,
    nextActionLabels: nextActionLabels(status, blockerLabels, commands.length),
    operatorSummary: operatorSummary(status, latestRecord?.targetRfqId, commands.length, blockerLabels),
  }

  return {
    ...plan,
    exportText: buildExportText(plan),
  }
}

function followThroughBlockers(
  readinessHistory: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary,
): string[] {
  const latestRecord = readinessHistory.latestRecord
  if (!latestRecord) {
    return ["Persist ready apply-execution readiness history before final-gate follow-through."]
  }

  return uniqueLabels([
    readinessHistory.status === "ready" ? "" : `Latest apply-execution readiness history status is ${readinessHistory.status}.`,
    latestRecord.status === "ready" ? "" : "Latest apply-execution readiness record must be ready.",
    latestRecord.appliedCommandCount > 0 ? "" : "Latest readiness record must include applied command evidence.",
    hasNonBlankEvidence(latestRecord.readinessRecordId)
      ? ""
      : "Latest readiness record is missing readiness record evidence.",
    readinessHistory.readyRecordIds.includes(latestRecord.readinessRecordId)
      ? ""
      : "Readiness history summary does not include the latest ready readiness record.",
    hasNonBlankEvidence(latestRecord.targetRfqId) ? "" : "Latest readiness record is missing target RFQ evidence.",
    readinessHistory.targetRfqIds.includes(latestRecord.targetRfqId)
      ? ""
      : "Readiness history summary does not include the latest target RFQ evidence.",
    hasNonBlankEvidence(latestRecord.latestExecutionFingerprint)
      ? ""
      : "Latest readiness record is missing apply execution evidence.",
    hasNonBlankEvidence(latestRecord.latestApplyPlanId) ? "" : "Latest readiness record is missing apply plan evidence.",
    hasNonBlankEvidence(latestRecord.latestCommitRecordId)
      ? ""
      : "Latest readiness record is missing commit record evidence.",
    hasNonBlankEvidence(latestRecord.latestCommittedExecutionFingerprint)
      ? ""
      : "Latest readiness record is missing committed execution evidence.",
    hasNonBlankEvidence(latestRecord.latestSourceExecutionFingerprint)
      ? ""
      : "Latest readiness record is missing source execution evidence.",
    readinessHistory.latestExecutionFingerprints.includes(latestRecord.latestExecutionFingerprint ?? "")
      ? ""
      : "Readiness history summary does not include the latest apply execution evidence.",
    readinessHistory.latestApplyPlanIds.includes(latestRecord.latestApplyPlanId ?? "")
      ? ""
      : "Readiness history summary does not include the latest apply plan evidence.",
    readinessHistory.latestCommitRecordIds.includes(latestRecord.latestCommitRecordId ?? "")
      ? ""
      : "Readiness history summary does not include the latest commit record evidence.",
    readinessHistory.latestCommittedExecutionFingerprints.includes(latestRecord.latestCommittedExecutionFingerprint ?? "")
      ? ""
      : "Readiness history summary does not include the latest committed execution evidence.",
    readinessHistory.latestSourceExecutionFingerprints.includes(latestRecord.latestSourceExecutionFingerprint ?? "")
      ? ""
      : "Readiness history summary does not include the latest source execution evidence.",
  ])
}

function buildCommand({
  blockerLabels,
  command,
  evidenceFingerprints,
  readinessRecordId,
  status,
  targetRfqId,
}: {
  blockerLabels: string[]
  command: (typeof commandDefinitions)[number]
  evidenceFingerprints: string[]
  readinessRecordId: string | undefined
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus
  targetRfqId: string | undefined
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommand {
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
    idempotencyKey: buildIdempotencyKey({
      key: command.key,
      readinessRecordId: readinessRecordId ?? "",
      targetRfqId: targetRfqId ?? "",
    }),
    key: command.key,
    label: command.label,
    status: "planned",
    target: command.target,
  }
}

function buildIdempotencyKey({
  key,
  readinessRecordId,
  targetRfqId,
}: {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughCommandKind
  readinessRecordId: string
  targetRfqId: string
}): string {
  return `non-cnc-live-adapter-final-gate:${targetRfqId}:${key}:${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({ key, readinessRecordId, targetRfqId }),
  ).slice(0, 16)}`
}

function nextActionLabels(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus,
  blockerLabels: string[],
  commandCount: number,
): string[] {
  if (status === "ready") {
    return [
      `Review ${formatCount(commandCount, "final-gate follow-through command")} before enabling live adapters.`,
      "Keep live customer-offer, file, release-review, export, and connector writes disabled until a later adapter consumes this plan.",
    ]
  }
  return uniqueLabels([
    ...blockerLabels,
    "Do not follow through to live customer-offer export state from blocked readiness history.",
  ])
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughStatus,
  targetRfqId: string | undefined,
  commandCount: number,
  blockerLabels: string[],
): string {
  if (status === "ready") {
    return `Ready final-gate follow-through prepares ${formatCount(
      commandCount,
      "review-only command",
    )} for ${targetRfqId}; live customer-offer, file, release-review, export, and connector writes remain disabled.`
  }
  return `Final-gate follow-through is blocked by ${formatCount(
    blockerLabels.length,
    "blocker",
  )}; keep local/mock fallback authoritative.`
}

function buildExportText(
  plan: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan, "exportText">,
): string {
  return [
    "Non-CNC live adapter apply execution final-gate follow-through",
    `Status: ${plan.status}`,
    `Target RFQ: ${plan.targetRfqId ?? "none"}`,
    `Readiness record: ${plan.readinessRecordId ?? "none"}`,
    `History records: ${plan.historyRecordCount}`,
    `Ready records: ${plan.readyRecordCount}`,
    `Blocked records: ${plan.blockedRecordCount}`,
    `Applied commands: ${plan.appliedCommandCount}`,
    `Commands: ${plan.commandCount}`,
    `Planned commands: ${plan.plannedCommandCount}`,
    `Blocked commands: ${plan.blockedCommandCount}`,
    `Latest apply execution: ${plan.latestExecutionFingerprint ?? "none"}`,
    `Latest apply plan: ${plan.latestApplyPlanId ?? "none"}`,
    `Latest commit record: ${plan.latestCommitRecordId ?? "none"}`,
    `Latest committed execution: ${plan.latestCommittedExecutionFingerprint ?? "none"}`,
    `Latest source execution: ${plan.latestSourceExecutionFingerprint ?? "none"}`,
    `Blockers: ${plan.blockerLabels.join("; ") || "none"}`,
    `Warnings: ${plan.reviewWarnings.join("; ") || "none"}`,
    "Command plan:",
    ...plan.commands.map(
      (command) =>
        `- ${command.key} | ${command.status} | ${command.target} | ${command.idempotencyKey ?? "blocked"}`,
    ),
    `Boundary: ${plan.finalGateBoundary}`,
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
