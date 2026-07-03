import { buildOfferFollowUpCalendarPlan, type CalendarRfqPlan } from "../integrations/calendarRfq"
import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { QuoteQueueStatus } from "../workspace/quoteQueue"
import type { QuoteReleaseGateDecision } from "../workspace/quoteReleaseGate"
import { buildWorkspaceAction, type WorkspaceActionRecord } from "../workspace/workspaceActions"
import { renderOfferText, type OfferDraft } from "./offer"
import type { OfferExportPackage } from "./offerExportPackage"
import { buildOfferLifecycleTimeline, type OfferLifecycleEventInput, type OfferLifecycleTimeline } from "./offerLifecycle"

export const OFFER_RELEASE_PLAN_VERSION = "offer-release-plan.v1"
export const OFFER_RELEASE_SEND_SUMMARY_VERSION = "offer-release-send-summary.v1"

export type OfferReleasePlanStatus = "blocked" | "needs_review" | "ready"
export type OfferReleasePlanMode = "automatic" | "blocked" | "manager_review_required" | "manager_reviewed"
export type OfferReleaseCommandKind =
  | "calendar_follow_up"
  | "email_draft"
  | "lifecycle_follow_up"
  | "lifecycle_sent"
  | "manager_review"
  | "workspace_follow_up"
  | "workspace_status"
export type OfferReleaseCommandStatus = "blocked" | "ready" | "requires_review"
export type OfferReleaseCommandPayloadValue = boolean | number | string | string[]

export interface OfferReleaseCommand {
  key: string
  kind: OfferReleaseCommandKind
  status: OfferReleaseCommandStatus
  label: string
  detail: string
  payload?: Record<string, OfferReleaseCommandPayloadValue>
}

export interface BuildOfferReleasePlanInput {
  actor: string
  currentRfqStatus: QuoteQueueStatus
  exportPackage: OfferExportPackage
  offer: OfferDraft
  offerId: string
  releaseGate: QuoteReleaseGateDecision
  rfqId: string
  timezone: string
  followUpDueAt?: string
  followUpTaskId?: string
  quoteId?: string
  releaseAt?: string
  reviewedBy?: string
  reviewNote?: string
}

export interface OfferReleasePlan {
  planVersion: typeof OFFER_RELEASE_PLAN_VERSION
  offerId: string
  offerNumber: string
  rfqId: string
  status: OfferReleasePlanStatus
  mode: OfferReleasePlanMode
  releaseAt: string
  commands: OfferReleaseCommand[]
  lifecycleEvents: OfferLifecycleEventInput[]
  workspaceActions: WorkspaceActionRecord[]
  nextActions: string[]
  sendSummary: OfferReleaseSendSummary
  warnings: string[]
  calendarPlan?: CalendarRfqPlan
  lifecyclePreview?: OfferLifecycleTimeline
}

export interface OfferReleaseSendSummary {
  summaryVersion: typeof OFFER_RELEASE_SEND_SUMMARY_VERSION
  status: OfferReleasePlanStatus
  headline: string
  commandLabels: string[]
  blockerLabels: string[]
  warningLabels: string[]
  attachmentFileName?: string
  followUpDueAt?: string
  recipient?: string
}

export function buildOfferReleasePlan(input: BuildOfferReleasePlanInput): OfferReleasePlan {
  const actor = nonBlank(input.actor, "actor")
  const offerId = nonBlank(input.offerId, "offerId")
  const rfqId = nonBlank(input.rfqId, "rfqId")
  const timezone = nonBlank(input.timezone, "timezone")
  const releaseAt = normalizeIsoTimestamp(input.releaseAt ?? input.releaseGate.checkedAt, "releaseAt")
  validateReleaseReferences(input, rfqId)

  const directBlockers = releasePreflightBlockers(input)
  if (input.releaseGate.status === "blocked" || directBlockers.length > 0) {
    return basePlan({
      commands: [
        {
          detail: [...input.releaseGate.nextActions, ...directBlockers].join(" "),
          key: "manager-review:blockers",
          kind: "manager_review",
          label: "Resolve release blockers",
          status: "blocked",
        },
      ],
      input,
      mode: "blocked",
      nextActions: [...input.releaseGate.nextActions, ...directBlockers],
      releaseAt,
      status: "blocked",
    })
  }

  const reviewedBy = optionalTrim(input.reviewedBy)
  const reviewNote = optionalTrim(input.reviewNote)
  if (input.releaseGate.status === "needs_review" && !reviewedBy) {
    return basePlan({
      commands: [
        {
          detail: input.releaseGate.nextActions.join(" "),
          key: "manager-review:warnings",
          kind: "manager_review",
          label: "Manager release review",
          status: "requires_review",
        },
      ],
      input,
      mode: "manager_review_required",
      nextActions: input.releaseGate.nextActions,
      releaseAt,
      status: "needs_review",
      warnings: input.releaseGate.nextActions,
    })
  }

  const lifecycleEvents = buildLifecycleEvents({
    actor,
    followUpDueAt: input.followUpDueAt,
    followUpTaskId: input.followUpTaskId,
    offer: input.offer,
    releaseAt,
    releaseGate: input.releaseGate,
    reviewNote,
    reviewedBy,
  })
  const lifecyclePreview = buildOfferLifecycleTimeline(input.offer, lifecycleEvents)
  const workspaceActions = buildReleaseWorkspaceActions({
    actor,
    currentRfqStatus: input.currentRfqStatus,
    followUpDueAt: input.followUpDueAt,
    followUpTaskId: input.followUpTaskId,
    offerId,
    quoteId: input.quoteId,
    releaseAt,
    rfqId,
  })
  const calendarPlan = input.followUpDueAt
    ? buildOfferFollowUpCalendarPlan({
        customerName: input.offer.customer.name,
        durationMinutes: 30,
        offerId,
        timeline: lifecyclePreview,
        timezone,
      })
    : undefined
  const commands = buildReleaseCommands({
    calendarPlan,
    exportPackage: input.exportPackage,
    lifecycleEvents,
    offer: input.offer,
    offerId,
    releaseAt,
    rfqId,
    workspaceActions,
  })

  return {
    ...basePlan({
      commands,
      input,
      mode: reviewedBy ? "manager_reviewed" : "automatic",
      nextActions: commands.map((item) => item.label),
      releaseAt,
      status: "ready",
      warnings: reviewedBy ? input.releaseGate.nextActions : [],
    }),
    calendarPlan,
    lifecycleEvents,
    lifecyclePreview,
    workspaceActions,
  }
}

function basePlan(input: {
  commands: OfferReleaseCommand[]
  input: BuildOfferReleasePlanInput
  mode: OfferReleasePlanMode
  nextActions: string[]
  releaseAt: string
  status: OfferReleasePlanStatus
  warnings?: string[]
}): OfferReleasePlan {
  return {
    planVersion: OFFER_RELEASE_PLAN_VERSION,
    commands: input.commands,
    lifecycleEvents: [],
    mode: input.mode,
    nextActions: input.nextActions,
    offerId: input.input.offerId.trim(),
    offerNumber: input.input.offer.offerNumber,
    releaseAt: input.releaseAt,
    rfqId: input.input.rfqId.trim(),
    sendSummary: buildOfferReleaseSendSummary({
      commands: input.commands,
      followUpDueAt: input.input.followUpDueAt,
      nextActions: input.nextActions,
      offer: input.input.offer,
      status: input.status,
      warnings: input.warnings ?? [],
    }),
    status: input.status,
    warnings: input.warnings ?? [],
    workspaceActions: [],
  }
}

export function buildOfferReleaseSendSummary(input: {
  commands: OfferReleaseCommand[]
  offer: OfferDraft
  status: OfferReleasePlanStatus
  followUpDueAt?: string
  nextActions?: string[]
  warnings?: string[]
}): OfferReleaseSendSummary {
  const offerNumber = nonBlank(input.offer.offerNumber, "offer.offerNumber")
  const emailCommand = input.commands.find((command) => command.kind === "email_draft")
  const recipient = stringPayload(emailCommand, "to") ?? optionalTrim(input.offer.customer.email)
  const attachmentFileName = firstStringPayload(emailCommand, "attachments")
  const followUpDueAt = input.followUpDueAt ? normalizeIsoTimestamp(input.followUpDueAt, "followUpDueAt") : undefined
  const commandLabels = input.commands.map((command) => nonBlank(command.label, "command.label"))
  const blockerLabels = input.status === "blocked" ? uniqueNonBlank(input.nextActions ?? []) : []
  const warningLabels = input.status === "needs_review" || input.status === "ready" ? uniqueNonBlank(input.warnings ?? []) : []

  return {
    summaryVersion: OFFER_RELEASE_SEND_SUMMARY_VERSION,
    blockerLabels,
    commandLabels,
    headline: releaseSendHeadline({
      attachmentFileName,
      blockerLabels,
      followUpDueAt,
      offerNumber,
      recipient,
      status: input.status,
      warningLabels,
    }),
    status: input.status,
    warningLabels,
    ...(attachmentFileName ? { attachmentFileName } : {}),
    ...(followUpDueAt ? { followUpDueAt } : {}),
    ...(recipient ? { recipient } : {}),
  }
}

function releaseSendHeadline(input: {
  offerNumber: string
  status: OfferReleasePlanStatus
  attachmentFileName?: string
  blockerLabels: string[]
  followUpDueAt?: string
  recipient?: string
  warningLabels: string[]
}): string {
  if (input.status === "blocked") {
    return `Offer ${input.offerNumber} release is blocked: ${input.blockerLabels.join(" ") || "resolve release blockers."}`
  }
  if (input.status === "needs_review") {
    return `Offer ${input.offerNumber} needs manager review before sending: ${input.warningLabels.join(" ") || "review release warnings."}`
  }

  const recipient = input.recipient ?? "the customer"
  const attachment = input.attachmentFileName ? ` with ${input.attachmentFileName}` : ""
  const followUp = input.followUpDueAt ? ` Follow-up is scheduled for ${input.followUpDueAt}.` : ""
  return `Offer ${input.offerNumber} is ready to send to ${recipient}${attachment}.${followUp}`.trim()
}

function stringPayload(command: OfferReleaseCommand | undefined, key: string): string | undefined {
  const value = command?.payload?.[key]
  return typeof value === "string" ? optionalTrim(value) : undefined
}

function firstStringPayload(command: OfferReleaseCommand | undefined, key: string): string | undefined {
  const value = command?.payload?.[key]
  return Array.isArray(value) && typeof value[0] === "string" ? optionalTrim(value[0]) : undefined
}

function uniqueNonBlank(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function validateReleaseReferences(input: BuildOfferReleasePlanInput, rfqId: string) {
  const offerNumber = nonBlank(input.offer.offerNumber, "offer.offerNumber")
  if (input.releaseGate.offerNumber !== offerNumber) {
    throw new Error(`release gate offerNumber ${input.releaseGate.offerNumber} does not match offer ${offerNumber}`)
  }
  if (input.releaseGate.rfqId !== rfqId) {
    throw new Error(`release gate rfqId ${input.releaseGate.rfqId} does not match RFQ ${rfqId}`)
  }
  if (input.exportPackage.offerNumber !== offerNumber) {
    throw new Error(`export package offerNumber ${input.exportPackage.offerNumber} does not match offer ${offerNumber}`)
  }
}

function releasePreflightBlockers(input: BuildOfferReleasePlanInput): string[] {
  const blockers: string[] = []
  if (!optionalTrim(input.offer.customer.email)) {
    blockers.push("Customer email is required before offer release.")
  }
  if (input.exportPackage.pdf.status !== "ready") {
    blockers.push(`PDF export must be ready before offer release: ${input.exportPackage.pdf.warnings.join(" ") || "review required"}`)
  }
  if (input.currentRfqStatus !== "ready") {
    blockers.push(`RFQ status must be ready before offer release; current status is ${input.currentRfqStatus}.`)
  }
  return blockers
}

function buildLifecycleEvents(input: {
  actor: string
  offer: OfferDraft
  releaseAt: string
  releaseGate: QuoteReleaseGateDecision
  followUpDueAt?: string
  followUpTaskId?: string
  reviewedBy?: string
  reviewNote?: string
}): OfferLifecycleEventInput[] {
  const followUpDueAt = optionalTrim(input.followUpDueAt)
  const events: OfferLifecycleEventInput[] = [
    {
      actor: input.actor,
      kind: "sent",
      note: sentNote(input.releaseGate, input.reviewedBy, input.reviewNote),
      occurredAt: input.releaseAt,
    },
  ]

  if (followUpDueAt) {
    events.push({
      actor: input.actor,
      followUpDueAt,
      followUpTaskId: offerFollowUpTaskId(input.offer, input.followUpTaskId),
      kind: "follow_up_scheduled",
      occurredAt: input.releaseAt,
    })
  }

  return events
}

function buildReleaseWorkspaceActions(input: {
  actor: string
  currentRfqStatus: QuoteQueueStatus
  offerId: string
  releaseAt: string
  rfqId: string
  followUpDueAt?: string
  followUpTaskId?: string
  quoteId?: string
}): WorkspaceActionRecord[] {
  const actions = [
    buildWorkspaceAction({
      actor: input.actor,
      fromStatus: input.currentRfqStatus,
      kind: "status_change",
      note: "Offer released to customer.",
      occurredAt: input.releaseAt,
      quoteId: input.quoteId,
      rfqId: input.rfqId,
      toStatus: "sent",
    }),
  ]

  const followUpDueAt = optionalTrim(input.followUpDueAt)
  if (followUpDueAt) {
    actions.push(
      buildWorkspaceAction({
        actor: input.actor,
        followUpDueAt,
        kind: "follow_up_created",
        note: input.followUpTaskId,
        occurredAt: input.releaseAt,
        offerId: input.offerId,
        quoteId: input.quoteId,
        rfqId: input.rfqId,
      }),
    )
  }

  return actions
}

function buildReleaseCommands(input: {
  calendarPlan?: CalendarRfqPlan
  exportPackage: OfferExportPackage
  lifecycleEvents: OfferLifecycleEventInput[]
  offer: OfferDraft
  offerId: string
  releaseAt: string
  rfqId: string
  workspaceActions: WorkspaceActionRecord[]
}): OfferReleaseCommand[] {
  const customerEmail = nonBlank(input.offer.customer.email ?? "", "offer.customer.email")
  const commands: OfferReleaseCommand[] = [
    {
      detail: `Draft customer email to ${customerEmail}.`,
      key: "email-draft",
      kind: "email_draft",
      label: "Draft offer email",
      payload: {
        attachments: [input.exportPackage.pdf.targetFileName],
        body: input.exportPackage.plainText || renderOfferText(input.offer),
        subject: emailSubject(input.offer),
        to: customerEmail,
      },
      status: "ready",
    },
    {
      detail: `Apply sent lifecycle event at ${input.releaseAt}.`,
      key: "lifecycle-sent",
      kind: "lifecycle_sent",
      label: "Mark offer sent",
      payload: {
        eventKind: "sent",
        offerId: input.offerId,
        offerNumber: input.offer.offerNumber,
      },
      status: "ready",
    },
    {
      detail: `Move RFQ ${input.rfqId} to sent.`,
      key: "workspace-status",
      kind: "workspace_status",
      label: "Move RFQ to sent",
      payload: {
        actionKey: input.workspaceActions[0]?.key ?? "",
        rfqId: input.rfqId,
      },
      status: "ready",
    },
  ]

  const followUpEvent = input.lifecycleEvents.find((event) => event.kind === "follow_up_scheduled")
  if (followUpEvent) {
    commands.push(
      {
        detail: `Create lifecycle follow-up task ${followUpEvent.followUpTaskId}.`,
        key: "lifecycle-follow-up",
        kind: "lifecycle_follow_up",
        label: "Track offer follow-up",
        payload: {
          dueAt: followUpEvent.followUpDueAt ?? "",
          followUpTaskId: followUpEvent.followUpTaskId ?? "",
          offerId: input.offerId,
        },
        status: "ready",
      },
    )
  }

  if (input.calendarPlan && input.calendarPlan.events.length > 0) {
    commands.push(
      {
        detail: `Create ${input.calendarPlan.events.length} calendar follow-up event${input.calendarPlan.events.length === 1 ? "" : "s"}.`,
        key: "calendar-follow-up",
        kind: "calendar_follow_up",
        label: "Create follow-up calendar event",
        payload: {
          eventKinds: input.calendarPlan.events.map((event) => event.kind),
          timezone: input.calendarPlan.events[0]?.timezone ?? "",
        },
        status: "ready",
      },
    )
  }

  const followUpAction = input.workspaceActions.find((action) => action.kind === "follow_up_created")
  if (followUpAction) {
    commands.push(
      {
        detail: followUpAction.activityMessage,
        key: "workspace-follow-up",
        kind: "workspace_follow_up",
        label: "Record workspace follow-up",
        payload: {
          actionKey: followUpAction.key,
          followUpDueAt: followUpAction.followUpDueAt ?? "",
        },
        status: "ready",
      },
    )
  }

  return commands
}

function sentNote(releaseGate: QuoteReleaseGateDecision, reviewedBy: string | undefined, reviewNote: string | undefined): string {
  if (releaseGate.status === "ready") {
    return `Release gate passed for ${releaseGate.offerNumber}.`
  }
  return [`Release gate warnings reviewed by ${reviewedBy}.`, reviewNote].filter(Boolean).join(" ")
}

function offerFollowUpTaskId(offer: OfferDraft, value: string | undefined): string {
  return optionalTrim(value) ?? `${offer.offerNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-follow-up`
}

function emailSubject(offer: OfferDraft): string {
  return `Offer ${offer.offerNumber}: ${offer.subject ?? offer.rfqReference ?? offer.items[0]?.partNumber ?? "quotation"}`
}
