import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterDecision,
  NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode,
  NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import type {
  NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot,
  NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PLAN_VERSION =
  "non-cnc-promoted-quote-offer-export-live-adapter-execution-plan.v1"

export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlanStatus =
  | "blocked"
  | "fallback"
  | "ready"
export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandStatus =
  | "blocked"
  | "planned"
  | "withheld"
export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind =
  | "connector_sync"
  | "customer_offer_write"
  | "file_export_write"
  | "release_review_write"
  | "rollback_diagnostics"
export type NonCncPromotedQuoteOfferExportLiveAdapterExecutionTarget =
  | "connector"
  | "customer_offer"
  | "diagnostics"
  | "file_export"
  | "release_review"

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommand {
  key: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind
  kind: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterExecutionTarget
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandStatus
  detail: string
  blockerLabels: string[]
  evidenceFingerprints: string[]
  idempotencyKey?: string
}

export interface NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan {
  planVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PLAN_VERSION
  planId: string
  planFingerprint: string
  requestedAt: string
  requestedBy: string
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlanStatus
  mode: NonCncPromotedQuoteOfferExportLiveAdapterDecisionMode
  decisionStatus: NonCncPromotedQuoteOfferExportLiveAdapterDecisionStatus
  adapterAction: NonCncPromotedQuoteOfferExportLiveAdapterDecision["adapterAction"]
  enabled: boolean
  canUseLiveAdapter: boolean
  targetRfqId: string
  decisionFingerprint: string
  historyRecordCount: number
  latestHistoryDecisionFingerprint?: string
  latestExecutionFingerprint?: string
  latestPlanId?: string
  latestPackageId?: string
  latestReleaseExecutionFingerprint?: string
  latestSourceExecutionFingerprint?: string
  commandCount: number
  plannedCommandCount: number
  withheldCommandCount: number
  blockedCommandCount: number
  commands: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommand[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextActionLabels: string[]
  operatorSummary: string
  adapterExecutionBoundary: string
  exportText: string
}

export interface BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlanInput {
  decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision
  decisionHistory?: NonCncPromotedQuoteOfferExportLiveAdapterDecisionHistorySnapshot
  requestedAt: string
  requestedBy: string
}

const commandDefinitions = [
  {
    detail: "Create or update the customer-offer export record from the ready non-CNC provider evidence.",
    key: "customer_offer_write",
    label: "Customer-offer export write",
    target: "customer_offer",
  },
  {
    detail: "Write the plain-text, PDF, and release-review export artifacts through the live file adapter.",
    key: "file_export_write",
    label: "Customer offer file exports",
    target: "file_export",
  },
  {
    detail: "Attach the release-review packet to the customer-visible offer workflow.",
    key: "release_review_write",
    label: "Release-review packet write",
    target: "release_review",
  },
  {
    detail: "Sync connector references for the customer offer, files, and release-review packet.",
    key: "connector_sync",
    label: "Connector reference sync",
    target: "connector",
  },
  {
    detail: "Record rollback diagnostics and keep local/mock fallback evidence attached after live execution.",
    key: "rollback_diagnostics",
    label: "Fallback rollback diagnostics",
    target: "diagnostics",
  },
] as const satisfies Array<{
  detail: string
  key: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind
  label: string
  target: NonCncPromotedQuoteOfferExportLiveAdapterExecutionTarget
}>

export function buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
  decision,
  decisionHistory,
  requestedAt,
  requestedBy,
}: BuildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlanInput): NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan {
  const normalizedRequestedAt = normalizeIsoTimestamp(requestedAt, "requestedAt")
  const normalizedRequestedBy = nonBlank(requestedBy, "requestedBy")
  const targetRfqId = nonBlank(decision.targetRfqId, "decision.targetRfqId")
  const decisionFingerprint = fingerprintLiveAdapterDecision(decision)
  const latestHistoryDecision = decisionHistory?.latestDecision ?? decisionHistory?.records[0]
  const latestHistoryDecisionFingerprint = latestHistoryDecision?.decisionFingerprint
  const blockerLabels = executionBlockers({
    decision,
    decisionFingerprint,
    latestHistoryDecision,
  })
  const status = planStatus(decision, blockerLabels)
  const evidenceFingerprints = readyEvidenceFingerprints(decision)
  const commands = commandDefinitions.map((command) =>
    buildCommand({
      blockerLabels,
      command,
      decisionFingerprint,
      evidenceFingerprints,
      status,
      targetRfqId,
    }),
  )
  const plannedCommandCount = commands.filter((command) => command.status === "planned").length
  const withheldCommandCount = commands.filter((command) => command.status === "withheld").length
  const blockedCommandCount = commands.filter((command) => command.status === "blocked").length
  const basePlan = {
    adapterAction: decision.adapterAction,
    blockerLabels,
    canUseLiveAdapter: decision.canUseLiveAdapter,
    commandCount: commands.length,
    commands,
    decisionFingerprint,
    decisionStatus: decision.status,
    enabled: decision.enabled,
    historyRecordCount: decisionHistory?.recordCount ?? 0,
    latestHistoryDecisionFingerprint,
    mode: decision.mode,
    requestedAt: normalizedRequestedAt,
    requestedBy: normalizedRequestedBy,
    reviewWarnings: [...decision.reviewWarnings],
    status,
    targetRfqId,
  }
  const planFingerprint = fingerprintNonCncPromotedQuoteOfferExportPackagePayload(stableJson(basePlan))
  const summary: Omit<
    NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
    "adapterExecutionBoundary" | "exportText" | "planFingerprint" | "planId" | "planVersion"
  > = {
    ...basePlan,
    blockedCommandCount,
    latestExecutionFingerprint: status === "ready" || status === "fallback" ? decision.latestExecutionFingerprint : undefined,
    latestPackageId: status === "ready" || status === "fallback" ? decision.latestPackageId : undefined,
    latestPlanId: status === "ready" || status === "fallback" ? decision.latestPlanId : undefined,
    latestReleaseExecutionFingerprint:
      status === "ready" || status === "fallback" ? decision.latestReleaseExecutionFingerprint : undefined,
    latestSourceExecutionFingerprint:
      status === "ready" || status === "fallback" ? decision.latestSourceExecutionFingerprint : undefined,
    nextActionLabels: nextActionLabels(decision, status, blockerLabels),
    operatorSummary: operatorSummary(status, targetRfqId, commands.length, blockerLabels),
    plannedCommandCount,
    withheldCommandCount,
  }
  const plan: Omit<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan, "exportText"> = {
    ...summary,
    adapterExecutionBoundary:
      "Live-adapter execution plans are deterministic provider inputs only; this helper does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
    planFingerprint,
    planId: `non-cnc-promoted-quote-offer-export-live-adapter-execution-plan-${planFingerprint}`,
    planVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PLAN_VERSION,
  }

  return {
    ...plan,
    exportText: buildExportText(plan),
  }
}

function executionBlockers({
  decision,
  decisionFingerprint,
  latestHistoryDecision,
}: {
  decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision
  decisionFingerprint: string
  latestHistoryDecision: NonCncPromotedQuoteOfferExportLiveAdapterDecisionRecord | undefined
}): string[] {
  const readyHistoryBlockers =
    decision.status !== "ready"
      ? []
      : !latestHistoryDecision
        ? ["No recorded live-adapter decision history is available for execution planning."]
        : latestHistoryDecision.decisionFingerprint === decisionFingerprint
          ? []
          : ["Latest live-adapter decision history does not match the requested execution decision."]

  return uniqueLabels([
    ...decision.blockerLabels,
    ...readyEvidenceBlockers(decision),
    ...readyHistoryBlockers,
  ])
}

function readyEvidenceBlockers(decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision): string[] {
  if (decision.status !== "ready") {
    return []
  }

  return uniqueLabels([
    decision.mode === "live_adapter" ? "" : "Ready live-adapter execution requires live-adapter mode.",
    decision.adapterAction === "enable_live_adapter"
      ? ""
      : "Ready live-adapter execution requires enable-live-adapter action.",
    decision.enabled ? "" : "Ready live-adapter execution requires provider-write opt-in to be enabled.",
    decision.canUseLiveAdapter ? "" : "Ready live-adapter execution requires usable live-adapter readiness evidence.",
    decision.latestExecutionFingerprint ? "" : "Ready live-adapter execution requires provider commit evidence.",
    decision.latestPlanId ? "" : "Ready live-adapter execution requires provider export plan evidence.",
    decision.latestPackageId ? "" : "Ready live-adapter execution requires package evidence.",
    decision.latestReleaseExecutionFingerprint ? "" : "Ready live-adapter execution requires release execution evidence.",
    decision.latestSourceExecutionFingerprint ? "" : "Ready live-adapter execution requires source execution evidence.",
  ])
}

function planStatus(
  decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision,
  blockerLabels: string[],
): NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlanStatus {
  if (decision.status === "ready" && blockerLabels.length === 0) {
    return "ready"
  }
  if (decision.status === "fallback") {
    return "fallback"
  }
  return "blocked"
}

function buildCommand({
  blockerLabels,
  command,
  decisionFingerprint,
  evidenceFingerprints,
  status,
  targetRfqId,
}: {
  blockerLabels: string[]
  command: (typeof commandDefinitions)[number]
  decisionFingerprint: string
  evidenceFingerprints: string[]
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlanStatus
  targetRfqId: string
}): NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommand {
  const commandStatus =
    status === "ready" ? "planned" : status === "fallback" ? "withheld" : "blocked"
  return {
    blockerLabels: commandStatus === "planned" ? [] : [...blockerLabels],
    detail: command.detail,
    evidenceFingerprints: commandStatus === "planned" ? [...evidenceFingerprints] : [],
    idempotencyKey:
      commandStatus === "planned"
        ? buildCommandIdempotencyKey({
            decisionFingerprint,
            key: command.key,
            targetRfqId,
          })
        : undefined,
    key: command.key,
    kind: command.key,
    label: command.label,
    status: commandStatus,
    target: command.target,
  }
}

function buildCommandIdempotencyKey({
  decisionFingerprint,
  key,
  targetRfqId,
}: {
  decisionFingerprint: string
  key: NonCncPromotedQuoteOfferExportLiveAdapterExecutionCommandKind
  targetRfqId: string
}): string {
  return `non-cnc-live-adapter:${targetRfqId}:${key}:${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({ decisionFingerprint, key, targetRfqId }),
  ).slice(0, 16)}`
}

function readyEvidenceFingerprints(decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision): string[] {
  return uniqueSorted(
    [
      decision.latestExecutionFingerprint,
      decision.latestReleaseExecutionFingerprint,
      decision.latestSourceExecutionFingerprint,
    ].filter((value): value is string => Boolean(value)),
  )
}

function nextActionLabels(
  decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision,
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlanStatus,
  blockerLabels: string[],
): string[] {
  if (status === "ready") {
    return [
      "Review the planned live-adapter command bundle before connecting the provider executor.",
      "Verify local/mock fallback and rollback diagnostics remain attached after execution.",
    ]
  }
  return uniqueLabels([
    ...decision.nextActionLabels,
    ...(blockerLabels.length > 0
      ? [`Resolve ${formatCount(blockerLabels.length, "live-adapter execution blocker")}.`]
      : []),
    "Do not run live customer-offer export adapters from this plan.",
  ])
}

function operatorSummary(
  status: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlanStatus,
  targetRfqId: string,
  commandCount: number,
  blockerLabels: string[],
): string {
  if (status === "ready") {
    return `Ready live-adapter execution plan schedules ${formatCount(
      commandCount,
      "idempotent provider-write command",
    )} for ${targetRfqId}; execution still requires a separate live adapter to consume this plan.`
  }
  if (status === "fallback") {
    return `Live-adapter execution is withheld for ${targetRfqId} while provider-write opt-in remains disabled; local/mock fallback stays authoritative.`
  }
  return `Live-adapter execution plan is blocked for ${targetRfqId} by ${formatCount(
    blockerLabels.length,
    "blocker",
  )}; live customer-offer export writes remain disabled.`
}

function buildExportText(plan: Omit<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan, "exportText">): string {
  return [
    "Non-CNC offer export live adapter execution plan",
    `Status: ${plan.status}`,
    `Mode: ${plan.mode}`,
    `Decision: ${plan.decisionStatus} | ${plan.adapterAction} | ${plan.decisionFingerprint}`,
    `Target RFQ: ${plan.targetRfqId}`,
    `Commands: ${plan.commandCount}`,
    `Planned commands: ${plan.plannedCommandCount}`,
    `Withheld commands: ${plan.withheldCommandCount}`,
    `Blocked commands: ${plan.blockedCommandCount}`,
    `Blockers: ${plan.blockerLabels.join("; ") || "none"}`,
    `Warnings: ${plan.reviewWarnings.join("; ") || "none"}`,
    `Latest execution: ${plan.latestExecutionFingerprint ?? "none"}`,
    `Latest release execution: ${plan.latestReleaseExecutionFingerprint ?? "none"}`,
    "Command plan:",
    ...plan.commands.map(
      (command) =>
        `- ${command.key} | ${command.status} | ${command.target} | ${command.idempotencyKey ?? "withheld"}`,
    ),
    `Boundary: ${plan.adapterExecutionBoundary}`,
  ].join("\n")
}

function fingerprintLiveAdapterDecision(decision: NonCncPromotedQuoteOfferExportLiveAdapterDecision): string {
  return `non-cnc-promoted-quote-offer-export-live-adapter-decision-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({
      adapterAction: decision.adapterAction,
      blockerLabels: decision.blockerLabels,
      canUseLiveAdapter: decision.canUseLiveAdapter,
      enabled: decision.enabled,
      latestExecutionFingerprint: decision.latestExecutionFingerprint,
      latestPackageId: decision.latestPackageId,
      latestPlanId: decision.latestPlanId,
      latestReleaseExecutionFingerprint: decision.latestReleaseExecutionFingerprint,
      latestSourceExecutionFingerprint: decision.latestSourceExecutionFingerprint,
      mode: decision.mode,
      nextActionLabels: decision.nextActionLabels,
      reviewWarnings: decision.reviewWarnings,
      status: decision.status,
      targetRfqId: decision.targetRfqId,
    }),
  )}`
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
  return [...new Set(values)].sort()
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}
