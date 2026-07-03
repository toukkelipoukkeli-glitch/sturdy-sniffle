import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { OfferReleaseCommand, OfferReleaseCommandPayloadValue, OfferReleasePlan } from "./offerReleasePlan"

export const OFFER_EMAIL_DRAFT_PACKAGE_VERSION = "offer-email-draft-package.v1"

export type OfferEmailDraftPackageStatus = "blocked" | "ready"

export interface OfferEmailDraftPackage {
  packageVersion: typeof OFFER_EMAIL_DRAFT_PACKAGE_VERSION
  status: OfferEmailDraftPackageStatus
  offerId: string
  offerNumber: string
  rfqId: string
  releaseAt: string
  commandKey?: string
  recipient?: string
  subject?: string
  body?: string
  bodyPreview?: string
  attachmentFileNames: string[]
  summaryHeadline: string
  blockerLabels: string[]
  warningLabels: string[]
  nextActions: string[]
}

export function buildOfferEmailDraftPackage(plan: OfferReleasePlan): OfferEmailDraftPackage {
  const releaseAt = normalizeIsoTimestamp(plan.releaseAt, "plan.releaseAt")
  const base = {
    attachmentFileNames: [],
    blockerLabels: [],
    nextActions: uniqueNonBlank(plan.nextActions),
    offerId: nonBlank(plan.offerId, "plan.offerId"),
    offerNumber: nonBlank(plan.offerNumber, "plan.offerNumber"),
    packageVersion: OFFER_EMAIL_DRAFT_PACKAGE_VERSION,
    releaseAt,
    rfqId: nonBlank(plan.rfqId, "plan.rfqId"),
    summaryHeadline: nonBlank(plan.sendSummary.headline, "plan.sendSummary.headline"),
    warningLabels: uniqueNonBlank([...plan.warnings, ...plan.sendSummary.warningLabels]),
  } satisfies Omit<OfferEmailDraftPackage, "status">

  if (plan.status !== "ready") {
    return blockedPackage(base, plan.sendSummary.blockerLabels, [
      `Offer release plan is ${plan.status}; email draft package is not provider-ready.`,
    ])
  }

  const emailCommand = plan.commands.find((command) => command.kind === "email_draft")
  if (!emailCommand) {
    return blockedPackage(base, [], ["Ready release plan is missing an email draft command."])
  }
  if (emailCommand.status !== "ready") {
    return blockedPackage(base, [], [`Email draft command is ${emailCommand.status}.`], emailCommand)
  }

  const validation = validateEmailCommandPayload(emailCommand)
  if (validation.blockerLabels.length > 0) {
    return blockedPackage(base, validation.blockerLabels, [], emailCommand)
  }

  return {
    ...base,
    attachmentFileNames: validation.attachmentFileNames,
    body: validation.body,
    bodyPreview: bodyPreview(validation.body),
    commandKey: emailCommand.key,
    recipient: validation.recipient,
    status: "ready",
    subject: validation.subject,
  }
}

function blockedPackage(
  base: Omit<OfferEmailDraftPackage, "status">,
  primaryBlockers: string[],
  fallbackBlockers: string[],
  command?: OfferReleaseCommand,
): OfferEmailDraftPackage {
  return {
    ...base,
    attachmentFileNames: command ? stringArrayPayload(command.payload, "attachments") : base.attachmentFileNames,
    blockerLabels: uniqueNonBlank([...primaryBlockers, ...fallbackBlockers]),
    commandKey: command?.key,
    status: "blocked",
  }
}

function validateEmailCommandPayload(command: OfferReleaseCommand): {
  attachmentFileNames: string[]
  blockerLabels: string[]
  body: string
  recipient: string
  subject: string
} {
  const blockerLabels: string[] = []
  const recipient = stringPayload(command.payload, "to")
  const subject = stringPayload(command.payload, "subject")
  const body = stringPayload(command.payload, "body")
  const attachmentFileNames = stringArrayPayload(command.payload, "attachments")

  if (!recipient) {
    blockerLabels.push("Email draft command is missing a recipient.")
  }
  if (!subject) {
    blockerLabels.push("Email draft command is missing a subject.")
  }
  if (!body) {
    blockerLabels.push("Email draft command is missing body copy.")
  }
  if (attachmentFileNames.length === 0) {
    blockerLabels.push("Email draft command must include at least one attachment.")
  }

  return {
    attachmentFileNames,
    blockerLabels,
    body: body ?? "",
    recipient: recipient ?? "",
    subject: subject ?? "",
  }
}

function stringPayload(payload: Record<string, OfferReleaseCommandPayloadValue> | undefined, key: string): string | undefined {
  const value = payload?.[key]
  return typeof value === "string" ? optionalTrim(value) : undefined
}

function stringArrayPayload(payload: Record<string, OfferReleaseCommandPayloadValue> | undefined, key: string): string[] {
  const value = payload?.[key]
  return Array.isArray(value) ? uniqueNonBlank(value) : []
}

function bodyPreview(body: string): string {
  const normalized = body.replace(/\s+/g, " ").trim()
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized
}

function uniqueNonBlank(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}
