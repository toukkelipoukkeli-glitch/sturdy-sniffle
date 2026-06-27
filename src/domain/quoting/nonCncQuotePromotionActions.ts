import type {
  NonCncQuotePromotionCommandRecord,
  NonCncQuotePromotionPersistenceSnapshot,
  NonCncQuotePromotionRecord,
} from "./nonCncQuotePromotionPersistence"

export const NON_CNC_QUOTE_PROMOTION_ACTIONS_VERSION = "non-cnc-quote-promotion-actions.v1"

export type NonCncQuotePromotionActionKey = NonCncQuotePromotionCommandRecord["key"]
export type NonCncQuotePromotionActionState = "blocked" | "ready"
export type NonCncQuotePromotionActionSummaryStatus = "blocked" | "not_recorded" | "ready"

export interface NonCncQuotePromotionAction {
  key: NonCncQuotePromotionActionKey
  label: string
  detail: string
  state: NonCncQuotePromotionActionState
  blockerLabels: string[]
  reviewWarnings: string[]
}

export interface NonCncQuotePromotionActionSummary {
  actionVersion: typeof NON_CNC_QUOTE_PROMOTION_ACTIONS_VERSION
  selectedPlanId: string
  status: NonCncQuotePromotionActionSummaryStatus
  canPromoteQuote: boolean
  record?: NonCncQuotePromotionRecord
  actions: NonCncQuotePromotionAction[]
  nextOperatorMessage: string
}

export interface BuildNonCncQuotePromotionActionSummaryInput {
  selectedPlanId: string
  snapshot: NonCncQuotePromotionPersistenceSnapshot
}

export function buildNonCncQuotePromotionActionSummary({
  selectedPlanId,
  snapshot,
}: BuildNonCncQuotePromotionActionSummaryInput): NonCncQuotePromotionActionSummary {
  const record = snapshot.records.find((candidate) => candidate.planId === selectedPlanId)
  if (!record) {
    return {
      actionVersion: NON_CNC_QUOTE_PROMOTION_ACTIONS_VERSION,
      actions: buildMissingRecordActions(),
      canPromoteQuote: false,
      nextOperatorMessage: "Record the selected non-CNC promotion plan before enabling quote promotion actions.",
      selectedPlanId,
      status: "not_recorded",
    }
  }

  const actions = record.commands.map((command) => buildAction(command, record))
  const canPromoteQuote = actions.every((action) => action.state === "ready")
  return {
    actionVersion: NON_CNC_QUOTE_PROMOTION_ACTIONS_VERSION,
    actions,
    canPromoteQuote,
    nextOperatorMessage: buildNextOperatorMessage(record, canPromoteQuote),
    record: cloneRecord(record),
    selectedPlanId,
    status: canPromoteQuote ? "ready" : "blocked",
  }
}

function buildAction(command: NonCncQuotePromotionCommandRecord, record: NonCncQuotePromotionRecord): NonCncQuotePromotionAction {
  const blockerLabels = buildActionBlockers(command, record)
  return {
    blockerLabels,
    detail: command.detail,
    key: command.key,
    label: command.label,
    reviewWarnings: [...record.reviewWarnings],
    state: blockerLabels.length > 0 ? "blocked" : "ready",
  }
}

function buildActionBlockers(command: NonCncQuotePromotionCommandRecord, record: NonCncQuotePromotionRecord): string[] {
  const blockerLabels = command.status === "blocked" ? [...record.blockers] : []
  if (record.disposition === "review_only") {
    blockerLabels.push("Review-only promotion records cannot update active RFQ quote state.")
  }
  return blockerLabels
}

function buildMissingRecordActions(): NonCncQuotePromotionAction[] {
  const blockerLabels = ["Selected promotion plan has not been recorded in the local snapshot."]
  return [
    {
      blockerLabels,
      detail: "Store the selected non-CNC quote snapshot against the RFQ.",
      key: "persist_quote_snapshot",
      label: "Persist quote snapshot",
      reviewWarnings: [],
      state: "blocked",
    },
    {
      blockerLabels,
      detail: "Recompute customer-facing offer readiness from the promoted quote.",
      key: "refresh_offer_readiness",
      label: "Refresh offer readiness",
      reviewWarnings: [],
      state: "blocked",
    },
    {
      blockerLabels,
      detail: "Allow offer drafting from the promoted non-CNC quote.",
      key: "enable_offer_builder",
      label: "Enable offer builder",
      reviewWarnings: [],
      state: "blocked",
    },
  ]
}

function buildNextOperatorMessage(record: NonCncQuotePromotionRecord, canPromoteQuote: boolean): string {
  if (canPromoteQuote) {
    return record.reviewWarnings.length > 0
      ? "Promotion actions are ready after estimator review of the recorded calculator warnings."
      : "Promotion actions are ready for the selected non-CNC quote snapshot."
  }
  return "Clear promotion blockers before updating the active RFQ quote, offer readiness, or offer builder."
}

function cloneRecord(record: NonCncQuotePromotionRecord): NonCncQuotePromotionRecord {
  return {
    blockers: [...record.blockers],
    commands: record.commands.map((command) => ({ ...command })),
    disposition: record.disposition,
    persistenceVersion: record.persistenceVersion,
    planId: record.planId,
    planVersion: record.planVersion,
    quoteSnapshot: { ...record.quoteSnapshot },
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewWarnings: [...record.reviewWarnings],
    status: record.status,
    targetRfqId: record.targetRfqId,
  }
}
