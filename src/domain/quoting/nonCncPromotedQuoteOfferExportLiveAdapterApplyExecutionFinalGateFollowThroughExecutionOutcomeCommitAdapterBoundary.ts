import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel,
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModelTarget,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-execution-outcome-commit-adapter-boundary.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus =
  | "blocked"
  | "ready"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandStatus =
  | "blocked"
  | "planned"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandKind =
  | "customer_offer_follow_through"
  | "file_export_follow_through"
  | "release_review_follow_through"
  | "connector_reference_follow_through"
  | "final_gate_follow_through"
  | "rollback_evidence_follow_through"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterTarget =
  | "connector"
  | "customer_offer"
  | "diagnostics"
  | "file_export"
  | "final_gate_follow_through"
  | "release_review"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommand {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterTarget
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandStatus
  detail: string
  blockerLabels: string[]
  evidenceFingerprints: string[]
  idempotencyKey?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary {
  adapterBoundaryVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION
  adapterBoundaryId: string
  adapterBoundaryFingerprint: string
  requestedAt: string
  requestedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus
  readModelStatus: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel["status"]
  commitRecordId?: string
  committedExecutionFingerprint?: string
  executionFingerprint?: string
  followThroughId?: string
  followThroughFingerprint?: string
  targetRfqId?: string
  readinessRecordId?: string
  latestExecutionFingerprint?: string
  latestApplyPlanId?: string
  latestCommitRecordId?: string
  latestCommittedExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  committedOutcomeCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommand[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  operatorSummary: string
  liveWriteBoundary: string
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryInput {
  readModel: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel
  requestedAt: string
  requestedBy: string
}

const commandDefinitions = [
  {
    detail: "Prepare the reviewed final-gate outcome commit for the future customer-offer follow-through adapter.",
    key: "customer_offer_follow_through",
    label: "Follow through customer offer",
    readModelTarget: "customer_offer",
    target: "customer_offer",
  },
  {
    detail: "Prepare reviewed text, PDF, and release-review artifact evidence for the future export adapter.",
    key: "file_export_follow_through",
    label: "Follow through export files",
    readModelTarget: "file_export",
    target: "file_export",
  },
  {
    detail: "Prepare reviewed release-review packet evidence for the future release adapter.",
    key: "release_review_follow_through",
    label: "Follow through release review",
    readModelTarget: "release_review",
    target: "release_review",
  },
  {
    detail: "Prepare connector reference evidence for a future connector synchronization boundary.",
    key: "connector_reference_follow_through",
    label: "Follow through connector references",
    readModelTarget: "connector_reference",
    target: "connector",
  },
  {
    detail: "Prepare the final-gate follow-through marker for later live execution review.",
    key: "final_gate_follow_through",
    label: "Follow through final gate",
    readModelTarget: "final_gate_follow_through",
    target: "final_gate_follow_through",
  },
  {
    detail: "Attach rollback diagnostics so local/mock fallback remains authoritative until live writes are enabled.",
    key: "rollback_evidence_follow_through",
    label: "Follow through rollback evidence",
    readModelTarget: undefined,
    target: "diagnostics",
  },
] as const satisfies ReadonlyArray<{
  detail: string
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandKind
  label: string
  readModelTarget: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModelTarget | undefined
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterTarget
}>

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary({
  readModel,
  requestedAt,
  requestedBy,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary {
  const normalizedRequestedAt = normalizeIsoTimestamp(requestedAt, "requestedAt")
  const normalizedRequestedBy = nonBlank(requestedBy, "requestedBy")
  const blockerLabels = adapterBoundaryBlockers(readModel)
  const status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus =
    blockerLabels.length === 0 ? "ready" : "blocked"
  const evidenceFingerprints = readyEvidenceFingerprints(readModel, status)
  const commands = commandDefinitions.map((command) =>
    buildAdapterCommand({
      blockerLabels,
      command,
      evidenceFingerprints,
      readModel,
      status,
    }),
  )
  const plannedCommandCount = commands.filter((command) => command.status === "planned").length
  const blockedCommandCount = commands.filter((command) => command.status === "blocked").length
  const baseBoundary = {
    blockedCommandCount,
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commandCount: commands.length,
    commands,
    committedOutcomeCount: status === "ready" ? readModel.committedOutcomeCount : 0,
    latestApplyPlanId: status === "ready" ? readModel.latestApplyPlanId : undefined,
    latestCommitRecordId: status === "ready" ? readModel.latestCommitRecordId : undefined,
    latestCommittedExecutionFingerprint: status === "ready" ? readModel.latestCommittedExecutionFingerprint : undefined,
    latestExecutionFingerprint: status === "ready" ? readModel.latestExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint: status === "ready" ? readModel.latestSourceExecutionFingerprint : undefined,
    plannedCommandCount,
    readModelStatus: readModel.status,
    readinessRecordId: status === "ready" ? readModel.readinessRecordId : undefined,
    requestedAt: normalizedRequestedAt,
    requestedBy: normalizedRequestedBy,
    reviewWarnings: [...readModel.reviewWarnings],
    status,
    targetRfqId: status === "ready" ? readModel.targetRfqId : undefined,
  }
  const adapterBoundaryFingerprint = fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stableJson(baseBoundary))
  const boundary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary,
    "exportText"
  > = {
    ...baseBoundary,
    adapterBoundaryFingerprint,
    adapterBoundaryId: `non-cnc-final-gate-follow-through-outcome-commit-adapter-boundary-${adapterBoundaryFingerprint}`,
    adapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_OUTCOME_COMMIT_ADAPTER_BOUNDARY_VERSION,
    commitRecordId: status === "ready" ? readModel.commitRecordId : undefined,
    committedExecutionFingerprint: status === "ready" ? readModel.committedExecutionFingerprint : undefined,
    executionFingerprint: status === "ready" ? readModel.executionFingerprint : undefined,
    followThroughFingerprint: status === "ready" ? readModel.followThroughFingerprint : undefined,
    followThroughId: status === "ready" ? readModel.followThroughId : undefined,
    liveWriteBoundary:
      "Final-gate follow-through adapter boundaries are deterministic review data only; this helper does not create customer offers, files, release reviews, exports, connector records, final-gate follow-through writes, or external side effects.",
    nextActionLabels: nextActionLabels(status, blockerLabels, commands.length),
    operatorSummary: operatorSummary(status, readModel.targetRfqId, commands.length, blockerLabels),
  }

  return {
    ...boundary,
    exportText: buildExportText(boundary),
  }
}

function adapterBoundaryBlockers(
  readModel: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel,
): string[] {
  return uniqueLabels([
    readModel.status === "ready_to_follow_through"
      ? ""
      : "Final-gate follow-through outcome commit read model must be ready before adapter boundary planning.",
    ...readModel.blockerLabels,
    hasNonBlankEvidence(readModel.commitRecordId)
      ? ""
      : "Final-gate follow-through adapter boundary requires a commit record ID.",
    hasNonBlankEvidence(readModel.committedExecutionFingerprint)
      ? ""
      : "Final-gate follow-through adapter boundary requires committed execution evidence.",
    hasNonBlankEvidence(readModel.executionFingerprint)
      ? ""
      : "Final-gate follow-through adapter boundary requires source outcome draft execution evidence.",
    hasNonBlankEvidence(readModel.followThroughId)
      ? ""
      : "Final-gate follow-through adapter boundary requires a follow-through ID.",
    hasNonBlankEvidence(readModel.followThroughFingerprint)
      ? ""
      : "Final-gate follow-through adapter boundary requires follow-through fingerprint evidence.",
    hasNonBlankEvidence(readModel.targetRfqId)
      ? ""
      : "Final-gate follow-through adapter boundary requires a target RFQ.",
    hasNonBlankEvidence(readModel.readinessRecordId)
      ? ""
      : "Final-gate follow-through adapter boundary requires readiness record evidence.",
    readModel.committedOutcomeCount > 0
      ? ""
      : "Final-gate follow-through adapter boundary requires committed outcome evidence.",
    ...commandDefinitions.flatMap((command) =>
      command.readModelTarget && !readModel.followThroughTargets.includes(command.readModelTarget)
        ? [`Final-gate follow-through adapter boundary is missing ${command.label} target evidence.`]
        : [],
    ),
  ])
}

function buildAdapterCommand({
  blockerLabels,
  command,
  evidenceFingerprints,
  readModel,
  status,
}: {
  blockerLabels: string[]
  command: (typeof commandDefinitions)[number]
  evidenceFingerprints: string[]
  readModel: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommand {
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
      commitRecordId: readModel.commitRecordId ?? "",
      key: command.key,
      targetRfqId: readModel.targetRfqId ?? "",
    }),
    key: command.key,
    label: command.label,
    status: "planned",
    target: command.target,
  }
}

function readyEvidenceFingerprints(
  readModel: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitReadModel,
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus,
): string[] {
  if (status !== "ready") {
    return []
  }
  return uniqueSorted([
    readModel.commitRecordId,
    readModel.committedExecutionFingerprint,
    readModel.executionFingerprint,
    readModel.followThroughFingerprint,
    readModel.followThroughId,
    readModel.latestApplyPlanId,
    readModel.latestCommitRecordId,
    readModel.latestCommittedExecutionFingerprint,
    readModel.latestExecutionFingerprint,
    readModel.latestSourceExecutionFingerprint,
    readModel.readinessRecordId,
    readModel.targetRfqId,
  ].filter(hasNonBlankEvidence))
}

function buildIdempotencyKey({
  commitRecordId,
  key,
  targetRfqId,
}: {
  commitRecordId: string
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterCommandKind
  targetRfqId: string
}): string {
  return `non-cnc-final-gate-follow-through-adapter:${targetRfqId}:${key}:${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({ commitRecordId, key, targetRfqId }),
  ).slice(0, 16)}`
}

function nextActionLabels(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus,
  blockerLabels: string[],
  commandCount: number,
): string[] {
  if (status === "ready") {
    return [
      `Review ${formatCount(commandCount, "final-gate follow-through adapter command")} before enabling live writes.`,
      "Keep live customer-offer, file, release-review, export, connector, and final-gate follow-through writes disabled until an explicit provider adapter applies this boundary.",
    ]
  }
  return uniqueLabels([
    ...blockerLabels,
    "Keep local/mock fallback authoritative until final-gate follow-through adapter evidence is complete.",
  ])
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundaryStatus,
  targetRfqId: string | undefined,
  commandCount: number,
  blockerLabels: string[],
): string {
  if (status === "ready") {
    return `Prepared ${formatCount(commandCount, "review-only final-gate follow-through adapter command")} for ${targetRfqId}; live writes remain disabled.`
  }
  return blockerLabels.join(" ") || "Final-gate follow-through adapter boundary is blocked until read-model evidence is ready."
}

function buildExportText(
  boundary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionOutcomeCommitAdapterBoundary,
    "exportText"
  >,
): string {
  return [
    "Non-CNC final-gate follow-through adapter boundary",
    `Status: ${boundary.status}`,
    `Target RFQ: ${boundary.targetRfqId ?? "withheld"}`,
    `Commit record: ${boundary.commitRecordId ?? "withheld"}`,
    `Committed execution: ${boundary.committedExecutionFingerprint ?? "withheld"}`,
    `Commands: ${boundary.commandCount}`,
    `Planned commands: ${boundary.plannedCommandCount}`,
    `Blocked commands: ${boundary.blockedCommandCount}`,
    `Committed outcomes: ${boundary.committedOutcomeCount}`,
    `Blockers: ${boundary.blockerLabels.join("; ") || "none"}`,
    `Warnings: ${boundary.reviewWarnings.join("; ") || "none"}`,
    "Adapter commands:",
    ...boundary.commands.map(
      (command) =>
        `- ${command.status} | ${command.label} | ${command.target} | evidence ${command.evidenceFingerprints.join(", ") || "withheld"}`,
    ),
    `Boundary: ${boundary.liveWriteBoundary}`,
  ].join("\n")
}

function hasNonBlankEvidence(value: string | undefined): value is string {
  return Boolean(value?.trim())
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

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))]
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
