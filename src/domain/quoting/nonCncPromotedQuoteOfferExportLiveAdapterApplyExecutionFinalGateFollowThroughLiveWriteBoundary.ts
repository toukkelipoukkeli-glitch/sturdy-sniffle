import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistory"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-boundary.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus =
  | "blocked"
  | "review_ready"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandStatus =
  | "blocked"
  | "pending_enablement"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandKind =
  | "customer_offer_follow_through_write"
  | "file_export_follow_through_write"
  | "release_review_follow_through_write"
  | "connector_reference_follow_through_write"
  | "final_gate_follow_through_write"
  | "rollback_evidence_follow_through_write"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteTarget =
  | "connector"
  | "customer_offer"
  | "diagnostics"
  | "file_export"
  | "final_gate_follow_through"
  | "release_review"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommand {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteTarget
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandStatus
  detail: string
  blockerLabels: string[]
  evidenceFingerprints: string[]
  idempotencyKey?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary {
  liveWriteBoundaryVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION
  liveWriteBoundaryId: string
  liveWriteBoundaryFingerprint: string
  requestedAt: string
  requestedBy: string
  operatorReviewApproved: boolean
  operatorReviewNote?: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus
  historyStatus: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary["status"]
  adapterBoundaryId?: string
  adapterBoundaryFingerprint?: string
  commitRecordId?: string
  committedExecutionFingerprint?: string
  followThroughId?: string
  targetRfqId?: string
  readinessRecordId?: string
  commandCount: number
  pendingCommandCount: number
  blockedCommandCount: number
  reviewedOutcomeCount: number
  historyRecordCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommand[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  operatorSummary: string
  liveWriteBoundary: string
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryInput {
  adapterBoundaryHistory: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary
  operatorReviewApproved?: boolean
  operatorReviewNote?: string
  requestedAt: string
  requestedBy: string
}

const commandDefinitions = [
  {
    detail: "Hold the reviewed final-gate outcome commit for a future customer-offer follow-through write adapter.",
    key: "customer_offer_follow_through_write",
    label: "Customer-offer follow-through write",
    sourceCommandKey: "customer_offer_follow_through",
    target: "customer_offer",
  },
  {
    detail: "Hold reviewed text, PDF, and release-review artifact evidence for a future file export write adapter.",
    key: "file_export_follow_through_write",
    label: "File export follow-through write",
    sourceCommandKey: "file_export_follow_through",
    target: "file_export",
  },
  {
    detail: "Hold reviewed release-review packet evidence for a future release-review write adapter.",
    key: "release_review_follow_through_write",
    label: "Release-review follow-through write",
    sourceCommandKey: "release_review_follow_through",
    target: "release_review",
  },
  {
    detail: "Hold connector reference evidence until a future connector write adapter is explicitly enabled.",
    key: "connector_reference_follow_through_write",
    label: "Connector follow-through write",
    sourceCommandKey: "connector_reference_follow_through",
    target: "connector",
  },
  {
    detail: "Hold the final-gate follow-through marker until a future provider adapter records live execution.",
    key: "final_gate_follow_through_write",
    label: "Final-gate follow-through write",
    sourceCommandKey: "final_gate_follow_through",
    target: "final_gate_follow_through",
  },
  {
    detail: "Carry rollback diagnostics so local/mock fallback stays authoritative when live writes are still disabled.",
    key: "rollback_evidence_follow_through_write",
    label: "Rollback evidence follow-through write",
    sourceCommandKey: "rollback_evidence_follow_through",
    target: "diagnostics",
  },
] as const satisfies ReadonlyArray<{
  detail: string
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandKind
  label: string
  sourceCommandKey: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteTarget
}>

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary({
  adapterBoundaryHistory,
  operatorReviewApproved = false,
  operatorReviewNote,
  requestedAt,
  requestedBy,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary {
  const normalizedRequestedAt = normalizeIsoTimestamp(requestedAt, "requestedAt")
  const normalizedRequestedBy = nonBlank(requestedBy, "requestedBy")
  const normalizedOperatorReviewNote = optionalTrim(operatorReviewNote)
  const latestRecord = adapterBoundaryHistory.latestRecord
  const blockerLabels = liveWriteBlockers(adapterBoundaryHistory, operatorReviewApproved)
  const status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus =
    blockerLabels.length === 0 ? "review_ready" : "blocked"
  const evidenceFingerprints = status === "review_ready"
    ? uniqueSorted([
        latestRecord?.adapterBoundaryFingerprint,
        latestRecord?.commitRecordId,
        latestRecord?.committedExecutionFingerprint,
        latestRecord?.executionFingerprint,
        latestRecord?.followThroughFingerprint,
        latestRecord?.followThroughId,
        latestRecord?.readinessRecordId,
        latestRecord?.targetRfqId,
        ...adapterBoundaryHistory.evidenceFingerprints,
      ].filter(hasNonBlankEvidence))
    : []
  const commands = commandDefinitions.map((command) =>
    buildLiveWriteCommand({
      blockerLabels,
      command,
      evidenceFingerprints,
      latestAdapterBoundaryFingerprint: latestRecord?.adapterBoundaryFingerprint,
      status,
      targetRfqId: latestRecord?.targetRfqId,
    }),
  )
  const pendingCommandCount = commands.filter((command) => command.status === "pending_enablement").length
  const blockedCommandCount = commands.filter((command) => command.status === "blocked").length
  const exposesEvidence = status === "review_ready"
  const baseBoundary = {
    adapterBoundaryFingerprint: exposesEvidence ? latestRecord?.adapterBoundaryFingerprint : undefined,
    adapterBoundaryId: exposesEvidence ? latestRecord?.adapterBoundaryId : undefined,
    blockedCommandCount,
    blockerLabels,
    commandCount: commands.length,
    commands,
    committedExecutionFingerprint: exposesEvidence ? latestRecord?.committedExecutionFingerprint : undefined,
    commitRecordId: exposesEvidence ? latestRecord?.commitRecordId : undefined,
    followThroughId: exposesEvidence ? latestRecord?.followThroughId : undefined,
    historyRecordCount: adapterBoundaryHistory.totalRecords,
    historyStatus: adapterBoundaryHistory.status,
    operatorReviewApproved,
    operatorReviewNote: normalizedOperatorReviewNote,
    pendingCommandCount,
    readinessRecordId: exposesEvidence ? latestRecord?.readinessRecordId : undefined,
    requestedAt: normalizedRequestedAt,
    requestedBy: normalizedRequestedBy,
    reviewedOutcomeCount: exposesEvidence ? latestRecord?.committedOutcomeCount ?? 0 : 0,
    reviewWarnings: [...adapterBoundaryHistory.latestRecord?.reviewWarnings ?? []],
    status,
    targetRfqId: exposesEvidence ? latestRecord?.targetRfqId : undefined,
  }
  const liveWriteBoundaryFingerprint = fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stableJson(baseBoundary))
  const boundary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary,
    "exportText"
  > = {
    ...baseBoundary,
    liveWriteBoundary:
      "Final-gate follow-through live-write boundaries are deterministic review data only; this helper does not create customer offers, files, release reviews, exports, connector records, final-gate follow-through writes, or external side effects.",
    liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: `non-cnc-final-gate-follow-through-live-write-boundary-${liveWriteBoundaryFingerprint}`,
    liveWriteBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_BOUNDARY_VERSION,
    nextActionLabels: nextActionLabels(status, blockerLabels, commands.length),
    operatorSummary: operatorSummary(status, latestRecord?.targetRfqId, commands.length, blockerLabels),
  }

  return {
    ...boundary,
    exportText: buildExportText(boundary),
  }
}

function liveWriteBlockers(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryHistorySummary,
  operatorReviewApproved: boolean,
): string[] {
  const latestRecord = history.latestRecord
  if (!latestRecord) {
    return ["Persist final-gate follow-through adapter-boundary history before preparing live-write follow-through boundaries."]
  }

  return uniqueLabels([
    history.status === "ready" ? "" : "Latest final-gate follow-through adapter-boundary history must be ready.",
    latestRecord.status === "ready" ? "" : "Latest final-gate follow-through adapter-boundary record must be ready.",
    latestRecord.disposition === "follow_through_ready"
      ? ""
      : "Latest final-gate follow-through adapter-boundary record must be follow-through ready.",
    operatorReviewApproved ? "" : "Operator review must explicitly approve the final-gate follow-through live-write boundary.",
    hasNonBlankEvidence(latestRecord.adapterBoundaryId)
      ? ""
      : "Final-gate follow-through live-write boundary requires adapter-boundary ID evidence.",
    hasNonBlankEvidence(latestRecord.adapterBoundaryFingerprint)
      ? ""
      : "Final-gate follow-through live-write boundary requires adapter-boundary fingerprint evidence.",
    hasNonBlankEvidence(latestRecord.commitRecordId)
      ? ""
      : "Final-gate follow-through live-write boundary requires commit record evidence.",
    hasNonBlankEvidence(latestRecord.committedExecutionFingerprint)
      ? ""
      : "Final-gate follow-through live-write boundary requires committed execution evidence.",
    hasNonBlankEvidence(latestRecord.followThroughId)
      ? ""
      : "Final-gate follow-through live-write boundary requires follow-through ID evidence.",
    hasNonBlankEvidence(latestRecord.targetRfqId)
      ? ""
      : "Final-gate follow-through live-write boundary requires target RFQ evidence.",
    hasNonBlankEvidence(latestRecord.readinessRecordId)
      ? ""
      : "Final-gate follow-through live-write boundary requires readiness record evidence.",
    history.readyBoundaryIds.includes(latestRecord.adapterBoundaryId)
      ? ""
      : "Final-gate follow-through history summary does not index the latest ready adapter-boundary ID.",
    history.adapterBoundaryFingerprints.includes(latestRecord.adapterBoundaryFingerprint)
      ? ""
      : "Final-gate follow-through history summary does not index the latest adapter-boundary fingerprint.",
    history.commitRecordIds.includes(latestRecord.commitRecordId ?? "")
      ? ""
      : "Final-gate follow-through history summary does not index the latest commit record.",
    history.committedExecutionFingerprints.includes(latestRecord.committedExecutionFingerprint ?? "")
      ? ""
      : "Final-gate follow-through history summary does not index the latest committed execution evidence.",
    history.targetRfqIds.includes(latestRecord.targetRfqId ?? "")
      ? ""
      : "Final-gate follow-through history summary does not index the latest target RFQ.",
    latestRecord.plannedCommandCount > 0 && history.plannedCommandCount >= latestRecord.plannedCommandCount
      ? ""
      : "Final-gate follow-through live-write boundary requires planned command descriptors.",
    commandDefinitions.every((command) =>
      latestRecord.commandIdempotencyKeys.some((key) => key.includes(command.sourceCommandKey))
    )
      ? ""
      : "Final-gate follow-through live-write boundary requires all source command idempotency evidence.",
  ])
}

function buildLiveWriteCommand({
  blockerLabels,
  command,
  evidenceFingerprints,
  latestAdapterBoundaryFingerprint,
  status,
  targetRfqId,
}: {
  blockerLabels: string[]
  command: (typeof commandDefinitions)[number]
  evidenceFingerprints: string[]
  latestAdapterBoundaryFingerprint: string | undefined
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus
  targetRfqId: string | undefined
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommand {
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
      latestAdapterBoundaryFingerprint: latestAdapterBoundaryFingerprint ?? "",
      targetRfqId: targetRfqId ?? "",
    }),
    key: command.key,
    label: command.label,
    status: "pending_enablement",
    target: command.target,
  }
}

function buildIdempotencyKey({
  key,
  latestAdapterBoundaryFingerprint,
  targetRfqId,
}: {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteCommandKind
  latestAdapterBoundaryFingerprint: string
  targetRfqId: string
}): string {
  return `non-cnc-final-gate-follow-through-live-write:${targetRfqId}:${key}:${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({ key, latestAdapterBoundaryFingerprint, targetRfqId }),
  ).slice(0, 16)}`
}

function nextActionLabels(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus,
  blockerLabels: string[],
  commandCount: number,
): string[] {
  if (status === "review_ready") {
    return [
      `Review ${formatCount(commandCount, "pending final-gate follow-through live-write command")} before any provider adapter is enabled.`,
      "Keep customer-offer, file, release-review, export, connector, and final-gate follow-through writes disabled until a later provider adapter applies this boundary.",
    ]
  }
  return uniqueLabels([
    ...blockerLabels,
    "Keep local/mock fallback authoritative until final-gate follow-through live-write evidence is operator-approved.",
  ])
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundaryStatus,
  targetRfqId: string | undefined,
  commandCount: number,
  blockerLabels: string[],
): string {
  if (status === "review_ready") {
    return `Final-gate follow-through live-write boundary is review-ready for ${targetRfqId} with ${formatCount(
      commandCount,
      "pending command",
    )}; live writes remain disabled.`
  }
  return blockerLabels.join(" ") || "Final-gate follow-through live-write boundary is blocked until reviewed adapter-boundary history is ready."
}

function buildExportText(
  boundary: Omit<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteBoundary, "exportText">,
): string {
  return [
    "Non-CNC final-gate follow-through live-write boundary",
    `Status: ${boundary.status}`,
    `Target RFQ: ${boundary.targetRfqId ?? "withheld"}`,
    `Operator review approved: ${boundary.operatorReviewApproved ? "yes" : "no"}`,
    `Operator review note: ${boundary.operatorReviewNote ?? "none"}`,
    `Adapter boundary: ${boundary.adapterBoundaryId ?? "withheld"}`,
    `Adapter fingerprint: ${boundary.adapterBoundaryFingerprint ?? "withheld"}`,
    `Commit record: ${boundary.commitRecordId ?? "withheld"}`,
    `Committed execution: ${boundary.committedExecutionFingerprint ?? "withheld"}`,
    `History records: ${boundary.historyRecordCount}`,
    `Reviewed outcomes: ${boundary.reviewedOutcomeCount}`,
    `Commands: ${boundary.commandCount}`,
    `Pending commands: ${boundary.pendingCommandCount}`,
    `Blocked commands: ${boundary.blockedCommandCount}`,
    `Blockers: ${boundary.blockerLabels.join("; ") || "none"}`,
    `Warnings: ${boundary.reviewWarnings.join("; ") || "none"}`,
    "Live-write commands:",
    ...boundary.commands.map(
      (command) =>
        `- ${command.key} | ${command.status} | ${command.target} | evidence ${command.evidenceFingerprints.join(", ") || "withheld"} | ${command.idempotencyKey ?? "blocked"}`,
    ),
    `Boundary: ${boundary.liveWriteBoundary}`,
  ].join("\n")
}

function hasNonBlankEvidence(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => compareLex(left, right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareLex)
}

function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
