import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import type { QuoteQueueStatus } from "./quoteQueue"

export const WORKSPACE_ACTION_VERSION = "workspace-action.v1"

export type WorkspaceActionKind = "status_change" | "scenario_saved" | "follow_up_created" | "handoff_note"

export interface WorkspaceActionInput {
  actor: string
  kind: WorkspaceActionKind
  occurredAt: string
  rfqId: string
  quoteId?: string
  offerId?: string
  fromStatus?: QuoteQueueStatus
  toStatus?: QuoteQueueStatus
  scenarioId?: string
  followUpDueAt?: string
  followUpTaskId?: string
  note?: string
}

export interface WorkspaceActionRecord {
  actionVersion: typeof WORKSPACE_ACTION_VERSION
  key: string
  actor: string
  kind: WorkspaceActionKind
  occurredAt: string
  rfqId: string
  quoteId?: string
  offerId?: string
  fromStatus?: QuoteQueueStatus
  toStatus?: QuoteQueueStatus
  scenarioId?: string
  followUpDueAt?: string
  followUpTaskId?: string
  note?: string
  activityKind: "status_change" | "quote_update" | "calendar_event" | "note"
  activityMessage: string
}

const allowedStatusTransitions: Record<QuoteQueueStatus, QuoteQueueStatus[]> = {
  new: ["triage", "estimating", "lost"],
  triage: ["new", "estimating", "lost"],
  estimating: ["triage", "ready", "lost"],
  ready: ["estimating", "sent", "lost"],
  sent: ["won", "lost"],
  won: [],
  lost: [],
}

export function buildWorkspaceAction(input: WorkspaceActionInput): WorkspaceActionRecord {
  const actor = nonBlank(input.actor, "actor")
  const rfqId = nonBlank(input.rfqId, "rfqId")
  const occurredAt = normalizeIsoTimestamp(input.occurredAt, "occurredAt")
  const note = optionalTrim(input.note)
  const base = {
    actionVersion: WORKSPACE_ACTION_VERSION,
    actor,
    kind: input.kind,
    occurredAt,
    rfqId,
    note,
  }

  switch (input.kind) {
    case "status_change":
      return buildStatusChangeAction(base, input)
    case "scenario_saved":
      return buildScenarioSavedAction(base, input)
    case "follow_up_created":
      return buildFollowUpCreatedAction(base, input)
    case "handoff_note":
      return buildHandoffNoteAction(base)
  }
}

export function buildWorkspaceActionTimeline(actions: WorkspaceActionInput[]): WorkspaceActionRecord[] {
  return actions
    .map(buildWorkspaceAction)
    .sort((left, right) => compareLex(left.occurredAt, right.occurredAt) || compareLex(left.key, right.key))
}

function buildStatusChangeAction(
  base: ActionBase,
  input: WorkspaceActionInput,
): WorkspaceActionRecord {
  const fromStatus = requireStatus(input.fromStatus, "fromStatus")
  const toStatus = requireStatus(input.toStatus, "toStatus")
  if (fromStatus === toStatus) {
    throw new Error("toStatus must differ from fromStatus")
  }
  if (!allowedStatusTransitions[fromStatus].includes(toStatus)) {
    throw new Error(`cannot transition RFQ from ${fromStatus} to ${toStatus}`)
  }

  return finalizeAction({
    ...base,
    activityKind: "status_change",
    activityMessage: `Moved RFQ from ${fromStatus} to ${toStatus}.`,
    fromStatus,
    toStatus,
  })
}

function buildScenarioSavedAction(base: ActionBase, input: WorkspaceActionInput): WorkspaceActionRecord {
  const quoteId = nonBlank(optionalTrim(input.quoteId) ?? "", "quoteId")
  const scenarioId = nonBlank(input.scenarioId ?? "", "scenarioId")
  return finalizeAction({
    ...base,
    activityKind: "quote_update",
    activityMessage: `Saved quote scenario ${scenarioId}.`,
    quoteId,
    scenarioId,
  })
}

function buildFollowUpCreatedAction(base: ActionBase, input: WorkspaceActionInput): WorkspaceActionRecord {
  const offerId = nonBlank(optionalTrim(input.offerId) ?? "", "offerId")
  const followUpDueAt = normalizeIsoTimestamp(input.followUpDueAt ?? "", "followUpDueAt")
  const followUpTaskId = optionalTrim(input.followUpTaskId)
  const quoteId = optionalTrim(input.quoteId)
  return finalizeAction({
    ...base,
    activityKind: "calendar_event",
    activityMessage: followUpTaskId
      ? `Scheduled offer follow-up ${followUpTaskId} for ${offerId} at ${followUpDueAt}.`
      : `Created offer follow-up for ${offerId}.`,
    offerId,
    followUpDueAt,
    followUpTaskId,
    quoteId,
  })
}

function buildHandoffNoteAction(base: ActionBase): WorkspaceActionRecord {
  const note = nonBlank(base.note ?? "", "note")
  return finalizeAction({
    ...base,
    activityKind: "note",
    activityMessage: note,
    note,
  })
}

function finalizeAction(action: Omit<WorkspaceActionRecord, "actionVersion" | "key"> & { actionVersion?: never; key?: never }): WorkspaceActionRecord {
  const keyParts = [
    action.rfqId,
    action.kind,
    action.quoteId,
    action.offerId,
    action.scenarioId,
    action.toStatus,
    action.followUpDueAt,
    action.followUpTaskId,
    action.occurredAt,
  ].filter((part): part is string => Boolean(part))

  return {
    ...action,
    actionVersion: WORKSPACE_ACTION_VERSION,
    key: keyParts.join(":"),
  }
}

type ActionBase = Pick<WorkspaceActionRecord, "actor" | "kind" | "occurredAt" | "rfqId" | "note">

function requireStatus(status: QuoteQueueStatus | undefined, key: string): QuoteQueueStatus {
  if (!status) {
    throw new Error(`${key} is required`)
  }
  return status
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
