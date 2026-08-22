import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistory"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelPersistence"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-final-gate-follow-through-live-write-provider-adapter-boundary.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus =
  | "blocked"
  | "ready"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandStatus =
  | "blocked"
  | "planned"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandKind =
  | "connector_reference_provider_prepare"
  | "customer_offer_provider_prepare"
  | "file_export_provider_prepare"
  | "final_gate_follow_through_provider_prepare"
  | "release_review_provider_prepare"
  | "rollback_evidence_provider_prepare"
export type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterTarget =
  | "connector"
  | "customer_offer"
  | "diagnostics"
  | "file_export"
  | "final_gate_follow_through"
  | "release_review"

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommand {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterTarget
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandStatus
  detail: string
  blockerLabels: string[]
  sourceCommandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  idempotencyKey?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary {
  providerAdapterBoundaryVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION
  providerAdapterBoundaryId: string
  providerAdapterBoundaryFingerprint: string
  requestedAt: string
  requestedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus
  sourceHistoryStatus: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary["status"]
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
  totalRecords: number
  providerReadyCount: number
  blockedReadModelCount: number
  pendingWriteIntentCount: number
  reviewedOutcomeCount: number
  commandCount: number
  plannedCommandCount: number
  blockedCommandCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommand[]
  sourceCommandIdempotencyKeys: string[]
  evidenceFingerprints: string[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  operatorSummary: string
  providerBoundary: string
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryInput {
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary
  requestedAt: string
  requestedBy: string
}

const commandDefinitions = [
  {
    detail: "Prepare customer-offer follow-through payload evidence for a future provider adapter.",
    key: "customer_offer_provider_prepare",
    label: "Prepare customer offer provider write",
    target: "customer_offer",
  },
  {
    detail: "Prepare file export follow-through payload evidence for a future provider adapter.",
    key: "file_export_provider_prepare",
    label: "Prepare file export provider write",
    target: "file_export",
  },
  {
    detail: "Prepare release-review follow-through payload evidence for a future provider adapter.",
    key: "release_review_provider_prepare",
    label: "Prepare release review provider write",
    target: "release_review",
  },
  {
    detail: "Prepare connector reference evidence for a future synchronization adapter.",
    key: "connector_reference_provider_prepare",
    label: "Prepare connector provider write",
    target: "connector",
  },
  {
    detail: "Prepare the final-gate follow-through marker for a future provider adapter.",
    key: "final_gate_follow_through_provider_prepare",
    label: "Prepare final gate provider write",
    target: "final_gate_follow_through",
  },
  {
    detail: "Attach rollback diagnostics so local/mock fallback remains authoritative until live writes are enabled.",
    key: "rollback_evidence_provider_prepare",
    label: "Prepare rollback evidence",
    target: "diagnostics",
  },
] as const satisfies ReadonlyArray<{
  detail: string
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterTarget
}>

export function buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary({
  history,
  requestedAt,
  requestedBy,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryInput): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary {
  const normalizedRequestedAt = normalizeIsoTimestamp(requestedAt, "requestedAt")
  const normalizedRequestedBy = nonBlank(requestedBy, "requestedBy")
  const latestRecord = history.latestRecord
  const blockerLabels = providerAdapterBoundaryBlockers(history, latestRecord)
  const status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus =
    blockerLabels.length === 0 ? "ready" : "blocked"
  const readyRecord = status === "ready" ? latestRecord : undefined
  const sourceCommandIdempotencyKeys = readyRecord ? uniqueSorted(readyRecord.commandIdempotencyKeys) : []
  const evidenceFingerprints = readyRecord ? uniqueSorted(readyRecord.evidenceFingerprints) : []
  const commands = commandDefinitions.map((command) =>
    buildProviderAdapterCommand({
      blockerLabels,
      command,
      evidenceFingerprints,
      readyRecord,
      sourceCommandIdempotencyKeys,
      status,
    }),
  )
  const plannedCommandCount = commands.filter((command) => command.status === "planned").length
  const blockedCommandCount = commands.filter((command) => command.status === "blocked").length
  const baseBoundary = {
    blockedCommandCount,
    blockedReadModelCount: history.blockedCount,
    blockerLabels: status === "ready" ? [] : blockerLabels,
    commandCount: commands.length,
    commands,
    evidenceFingerprints,
    pendingWriteIntentCount: readyRecord ? readyRecord.pendingWriteIntentCount : 0,
    plannedCommandCount,
    providerReadyCount: history.providerReadyCount,
    requestedAt: normalizedRequestedAt,
    requestedBy: normalizedRequestedBy,
    reviewedOutcomeCount: readyRecord ? readyRecord.reviewedOutcomeCount : 0,
    reviewWarnings: readyRecord ? [...readyRecord.reviewWarnings] : [],
    sourceCommandIdempotencyKeys,
    sourceHistoryStatus: history.status,
    status,
    totalRecords: history.totalRecords,
  }
  const providerAdapterBoundaryFingerprint = fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson(baseBoundary),
  )
  const boundary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary,
    "exportText"
  > = {
    ...baseBoundary,
    adapterBoundaryFingerprint: readyRecord?.adapterBoundaryFingerprint,
    adapterBoundaryId: readyRecord?.adapterBoundaryId,
    commitRecordId: readyRecord?.commitRecordId,
    committedExecutionFingerprint: readyRecord?.committedExecutionFingerprint,
    followThroughId: readyRecord?.followThroughId,
    liveWriteBoundaryFingerprint: readyRecord?.liveWriteBoundaryFingerprint,
    liveWriteBoundaryId: readyRecord?.liveWriteBoundaryId,
    nextActionLabels: nextActionLabels(status, blockerLabels, commands.length),
    operatorSummary: operatorSummary(status, readyRecord, blockerLabels, commands.length),
    providerAdapterBoundaryFingerprint,
    providerAdapterBoundaryId: `non-cnc-final-gate-follow-through-live-write-provider-adapter-boundary-${providerAdapterBoundaryFingerprint}`,
    providerAdapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    providerBoundary:
      "Final-gate follow-through provider-adapter boundaries are deterministic review data only; this helper does not create customer offers, files, release reviews, exports, connector records, final-gate follow-through writes, or external side effects.",
    providerReadModelRecordId: readyRecord?.providerReadModelRecordId,
    readinessRecordId: readyRecord?.readinessRecordId,
    targetRfqId: readyRecord?.targetRfqId,
  }

  return {
    ...boundary,
    exportText: buildExportText(boundary),
  }
}

function providerAdapterBoundaryBlockers(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelHistorySummary,
  latestRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord
    | undefined,
): string[] {
  if (!latestRecord) {
    return [
      "Persist a final-gate follow-through provider read-model history record before preparing provider-adapter writes.",
    ]
  }
  return uniqueLabels([
    history.status === "ready_to_prepare"
      ? ""
      : "Final-gate follow-through provider-adapter boundary requires ready provider read-model history.",
    latestRecord.status === "ready_to_prepare"
      ? ""
      : "Latest final-gate follow-through provider read model must be ready before provider-adapter preparation.",
    latestRecord.disposition === "provider_prepare_ready"
      ? ""
      : "Latest final-gate follow-through provider read model must be provider-preparation ready.",
    includesValue(history.providerReadyRecordIds, latestRecord.providerReadModelRecordId)
      ? ""
      : "Latest provider read-model record must be present in the provider-ready history index.",
    latestRecord.pendingWriteIntentCount > 0
      ? ""
      : "Provider-adapter boundary requires at least one pending write intent.",
    hasNonBlankEvidence(latestRecord.liveWriteBoundaryId) &&
    includesValue(history.liveWriteBoundaryIds, latestRecord.liveWriteBoundaryId)
      ? ""
      : "Latest provider read model must have indexed live-write boundary evidence.",
    hasNonBlankEvidence(latestRecord.liveWriteBoundaryFingerprint) &&
    includesValue(history.liveWriteBoundaryFingerprints, latestRecord.liveWriteBoundaryFingerprint)
      ? ""
      : "Latest provider read model must have indexed live-write boundary fingerprint evidence.",
    hasNonBlankEvidence(latestRecord.adapterBoundaryId) &&
    includesValue(history.adapterBoundaryIds, latestRecord.adapterBoundaryId)
      ? ""
      : "Latest provider read model must have indexed adapter boundary evidence.",
    hasNonBlankEvidence(latestRecord.adapterBoundaryFingerprint) &&
    includesValue(history.adapterBoundaryFingerprints, latestRecord.adapterBoundaryFingerprint)
      ? ""
      : "Latest provider read model must have indexed adapter boundary fingerprint evidence.",
    hasNonBlankEvidence(latestRecord.commitRecordId) && includesValue(history.commitRecordIds, latestRecord.commitRecordId)
      ? ""
      : "Latest provider read model must have indexed commit record evidence.",
    hasNonBlankEvidence(latestRecord.committedExecutionFingerprint) &&
    includesValue(history.committedExecutionFingerprints, latestRecord.committedExecutionFingerprint)
      ? ""
      : "Latest provider read model must have indexed committed execution evidence.",
    hasNonBlankEvidence(latestRecord.followThroughId) && includesValue(history.followThroughIds, latestRecord.followThroughId)
      ? ""
      : "Latest provider read model must have indexed follow-through evidence.",
    hasNonBlankEvidence(latestRecord.targetRfqId) && includesValue(history.targetRfqIds, latestRecord.targetRfqId)
      ? ""
      : "Latest provider read model must have indexed target RFQ evidence.",
    hasNonBlankEvidence(latestRecord.readinessRecordId) &&
    includesValue(history.readinessRecordIds, latestRecord.readinessRecordId)
      ? ""
      : "Latest provider read model must have indexed readiness record evidence.",
    latestRecord.commandIdempotencyKeys.length > 0 &&
    latestRecord.commandIdempotencyKeys.every((key) => includesValue(history.commandIdempotencyKeys, key))
      ? ""
      : "Latest provider read model command idempotency keys must be present in the history index.",
    latestRecord.evidenceFingerprints.length > 0 &&
    latestRecord.evidenceFingerprints.every((fingerprint) => includesValue(history.evidenceFingerprints, fingerprint))
      ? ""
      : "Latest provider read model evidence fingerprints must be present in the history index.",
    ...latestRecord.blockerLabels,
  ])
}

function buildProviderAdapterCommand({
  blockerLabels,
  command,
  evidenceFingerprints,
  readyRecord,
  sourceCommandIdempotencyKeys,
  status,
}: {
  blockerLabels: string[]
  command: (typeof commandDefinitions)[number]
  evidenceFingerprints: string[]
  readyRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord
    | undefined
  sourceCommandIdempotencyKeys: string[]
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus
}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommand {
  if (status === "blocked" || !readyRecord) {
    return {
      blockerLabels: [...blockerLabels],
      detail: command.detail,
      evidenceFingerprints: [],
      key: command.key,
      label: command.label,
      sourceCommandIdempotencyKeys: [],
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
      providerReadModelRecordId: readyRecord.providerReadModelRecordId,
      targetRfqId: readyRecord.targetRfqId ?? "",
    }),
    key: command.key,
    label: command.label,
    sourceCommandIdempotencyKeys: [...sourceCommandIdempotencyKeys],
    status: "planned",
    target: command.target,
  }
}

function buildIdempotencyKey({
  key,
  providerReadModelRecordId,
  targetRfqId,
}: {
  key: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterCommandKind
  providerReadModelRecordId: string
  targetRfqId: string
}): string {
  return `non-cnc-final-gate-provider-adapter:${targetRfqId}:${key}:${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({ key, providerReadModelRecordId, targetRfqId }),
  ).slice(0, 16)}`
}

function nextActionLabels(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus,
  blockerLabels: string[],
  commandCount: number,
): string[] {
  if (status === "ready") {
    return [
      `Review ${formatCount(commandCount, "provider-adapter preparation command")} before enabling live provider writes.`,
      "Keep customer-offer, file, release-review, export, connector, and final-gate follow-through writes disabled until an explicit provider adapter applies this boundary.",
    ]
  }
  return uniqueLabels([
    ...blockerLabels,
    "Keep local/mock fallback authoritative until final-gate provider-adapter evidence is complete.",
  ])
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryStatus,
  readyRecord:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderReadModelRecord
    | undefined,
  blockerLabels: string[],
  commandCount: number,
): string {
  if (status === "ready" && readyRecord) {
    return `Prepared ${formatCount(commandCount, "review-only final-gate provider-adapter command")} for ${readyRecord.targetRfqId}; live writes remain disabled.`
  }
  return blockerLabels.join(" ") || "Final-gate provider-adapter boundary is blocked until provider read-model evidence is ready."
}

function buildExportText(
  boundary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary,
    "exportText"
  >,
): string {
  return [
    "Non-CNC final-gate follow-through live-write provider adapter boundary",
    `Status: ${boundary.status}`,
    `Target RFQ: ${boundary.targetRfqId ?? "withheld"}`,
    `Provider read model: ${boundary.providerReadModelRecordId ?? "withheld"}`,
    `Live-write boundary: ${boundary.liveWriteBoundaryId ?? "withheld"}`,
    `Adapter boundary: ${boundary.adapterBoundaryId ?? "withheld"}`,
    `Commit record: ${boundary.commitRecordId ?? "withheld"}`,
    `Committed execution: ${boundary.committedExecutionFingerprint ?? "withheld"}`,
    `Commands: ${boundary.commandCount}`,
    `Planned commands: ${boundary.plannedCommandCount}`,
    `Blocked commands: ${boundary.blockedCommandCount}`,
    `Pending write intents: ${boundary.pendingWriteIntentCount}`,
    `Reviewed outcomes: ${boundary.reviewedOutcomeCount}`,
    `Blockers: ${boundary.blockerLabels.join("; ") || "none"}`,
    `Warnings: ${boundary.reviewWarnings.join("; ") || "none"}`,
    `Source command idempotency keys: ${boundary.sourceCommandIdempotencyKeys.join(", ") || "withheld"}`,
    `Evidence fingerprints: ${boundary.evidenceFingerprints.join(", ") || "withheld"}`,
    "Provider adapter commands:",
    ...boundary.commands.map(
      (command) =>
        `- ${command.status} | ${command.label} | ${command.target} | source keys ${command.sourceCommandIdempotencyKeys.join(", ") || "withheld"} | evidence ${command.evidenceFingerprints.join(", ") || "withheld"}`,
    ),
    `Boundary: ${boundary.providerBoundary}`,
  ].join("\n")
}

function hasNonBlankEvidence(value: string | undefined): value is string {
  return Boolean(value?.trim())
}

function includesValue(values: string[], value: string | undefined): boolean {
  return hasNonBlankEvidence(value) && values.includes(value)
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
