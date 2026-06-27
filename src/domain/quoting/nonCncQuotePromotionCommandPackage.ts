import type { NonCncQuotePromotionActionKey } from "./nonCncQuotePromotionActions"
import type { NonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import type { NonCncQuotePromotionQuoteSnapshot } from "./nonCncQuotePromotionPlan"

export const NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION = "non-cnc-quote-promotion-command-package.v1"

export type NonCncQuotePromotionCommandPackageStatus = "blocked" | "ready"
export type NonCncQuotePromotionCommandPackageCommandStatus = "blocked" | "ready"

export type NonCncQuotePromotionCommandPackagePayload =
  | {
      kind: "quote_snapshot"
      quoteSnapshot: NonCncQuotePromotionQuoteSnapshot
      targetRfqId: string
    }
  | {
      kind: "offer_readiness_refresh"
      currency: string
      promotedProcess: string
      reviewWarningCount: number
      targetRfqId: string
      totalCents: number
    }
  | {
      kind: "offer_builder_enablement"
      offerBuilderState: "eligible"
      sourcePlanId: string
      targetRfqId: string
    }

export interface NonCncQuotePromotionCommandPackageCommand {
  key: NonCncQuotePromotionActionKey
  label: string
  status: NonCncQuotePromotionCommandPackageCommandStatus
  blockerLabels: string[]
  reviewWarnings: string[]
  payload?: NonCncQuotePromotionCommandPackagePayload
}

export interface NonCncQuotePromotionCommandPackage {
  packageVersion: typeof NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION
  packageId: string
  selectedPlanId: string
  status: NonCncQuotePromotionCommandPackageStatus
  targetRfqId?: string
  commandCount: number
  commands: NonCncQuotePromotionCommandPackageCommand[]
  blockerLabels: string[]
  reviewWarnings: string[]
  nextOperatorMessage: string
}

export function buildNonCncQuotePromotionCommandPackage(
  draft: NonCncQuotePromotionDraft,
): NonCncQuotePromotionCommandPackage {
  const actionKeys = uniqueActionKeys(draft.actionKeys)
  const isReady = draft.status === "ready" && Boolean(draft.quoteSnapshot && draft.targetRfqId)
  const blockerLabels = isReady ? [] : uniqueLabels(buildBlockedLabels(draft))
  const commands = actionKeys.map((key) =>
    buildCommand({
      blockerLabels,
      draft,
      key,
      ready: isReady,
    }),
  )

  return {
    blockerLabels,
    commandCount: commands.length,
    commands,
    nextOperatorMessage: draft.nextOperatorMessage,
    packageId: buildPackageId(draft, actionKeys),
    packageVersion: NON_CNC_QUOTE_PROMOTION_COMMAND_PACKAGE_VERSION,
    reviewWarnings: [...draft.reviewWarnings],
    selectedPlanId: draft.selectedPlanId,
    status: isReady ? "ready" : "blocked",
    targetRfqId: isReady ? draft.targetRfqId : undefined,
  }
}

function buildCommand({
  blockerLabels,
  draft,
  key,
  ready,
}: {
  blockerLabels: string[]
  draft: NonCncQuotePromotionDraft
  key: NonCncQuotePromotionActionKey
  ready: boolean
}): NonCncQuotePromotionCommandPackageCommand {
  return {
    blockerLabels: ready ? [] : [...blockerLabels],
    key,
    label: commandLabel(key),
    payload: ready ? buildPayload(key, draft) : undefined,
    reviewWarnings: [...draft.reviewWarnings],
    status: ready ? "ready" : "blocked",
  }
}

function buildPayload(
  key: NonCncQuotePromotionActionKey,
  draft: NonCncQuotePromotionDraft,
): NonCncQuotePromotionCommandPackagePayload | undefined {
  if (!draft.quoteSnapshot || !draft.targetRfqId) {
    return undefined
  }
  if (key === "persist_quote_snapshot") {
    return {
      kind: "quote_snapshot",
      quoteSnapshot: { ...draft.quoteSnapshot },
      targetRfqId: draft.targetRfqId,
    }
  }
  if (key === "refresh_offer_readiness") {
    return {
      currency: draft.quoteSnapshot.currency,
      kind: "offer_readiness_refresh",
      promotedProcess: draft.quoteSnapshot.process,
      reviewWarningCount: draft.reviewWarnings.length,
      targetRfqId: draft.targetRfqId,
      totalCents: draft.quoteSnapshot.totalCents,
    }
  }
  if (key === "enable_offer_builder") {
    return {
      kind: "offer_builder_enablement",
      offerBuilderState: "eligible",
      sourcePlanId: draft.selectedPlanId,
      targetRfqId: draft.targetRfqId,
    }
  }
  return undefined
}

function buildBlockedLabels(draft: NonCncQuotePromotionDraft): string[] {
  if (draft.blockerLabels.length > 0) {
    return draft.blockerLabels
  }
  return ["Promotion draft is not ready to package for workspace commands."]
}

function buildPackageId(draft: NonCncQuotePromotionDraft, actionKeys: NonCncQuotePromotionActionKey[]): string {
  return [
    "non-cnc-promotion-command-package",
    draft.selectedPlanId,
    draft.targetRfqId ?? "unassigned-rfq",
    actionKeys.join("+") || "no-actions",
  ].join(":")
}

function commandLabel(key: NonCncQuotePromotionActionKey): string {
  if (key === "persist_quote_snapshot") {
    return "Persist quote snapshot"
  }
  if (key === "refresh_offer_readiness") {
    return "Refresh offer readiness"
  }
  if (key === "enable_offer_builder") {
    return "Enable offer builder"
  }
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ")
}

function uniqueActionKeys(actionKeys: NonCncQuotePromotionActionKey[]): NonCncQuotePromotionActionKey[] {
  return [...new Set(actionKeys)]
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels)]
}
