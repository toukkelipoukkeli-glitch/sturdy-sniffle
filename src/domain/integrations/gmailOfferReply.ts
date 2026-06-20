import type { OfferLifecycleEventInput, OfferLifecycleEventKind } from "../offers/offerLifecycle"
import { normalizeIsoTimestamp } from "../shared/deterministic"
import type { GmailRfqMessage } from "./gmailRfq"

export const GMAIL_OFFER_REPLY_ADAPTER_VERSION = "gmail-offer-reply.v1"

export type GmailOfferReplySignal = "accepted" | "declined" | "follow_up_completed" | "note_added"

export interface GmailOfferReplyParseRequest {
  message: GmailRfqMessage
  offerNumber: string
  followUpTaskIds?: string[]
}

export interface GmailOfferReplyParseResult {
  adapterVersion: typeof GMAIL_OFFER_REPLY_ADAPTER_VERSION
  messageId: string
  threadId?: string
  offerNumber: string
  matched: boolean
  signal?: GmailOfferReplySignal
  event?: OfferLifecycleEventInput
  warnings: string[]
}

const acceptedPatterns = [
  /\baccept(?:ed|s)?\b/,
  /\bapproved\b/,
  /\bgo ahead\b/,
  /\bplease proceed\b/,
  /\bwe confirm\b/,
  /\bok(?:ay)? to proceed\b/,
]

const declinedPatterns = [
  /\bdeclin(?:e|ed|es|ing)\b/,
  /\breject(?:ed|s)?\b/,
  /\bnot proceeding\b/,
  /\bno thanks\b/,
  /\btoo expensive\b/,
  /\bbudget (?:moved|cancelled|canceled)\b/,
]

const followUpCompletedPatterns = [
  /\breceived\b/,
  /\bgot it\b/,
  /\bthanks for (?:the )?(?:offer|quote|quotation)\b/,
  /\bwe will review\b/,
  /\bunder review\b/,
]

export function parseGmailOfferReply(request: GmailOfferReplyParseRequest): GmailOfferReplyParseResult {
  const messageId = nonBlank(request.message.id, "message.id")
  const offerNumber = nonBlank(request.offerNumber, "offerNumber")
  const occurredAt = normalizeIsoTimestamp(request.message.receivedAt, "message.receivedAt")
  const searchableText = normalizeSearchableText(request.message)
  const warnings: string[] = []

  if (!containsOfferNumber(searchableText, offerNumber)) {
    return {
      adapterVersion: GMAIL_OFFER_REPLY_ADAPTER_VERSION,
      messageId,
      threadId: optionalTrim(request.message.threadId),
      offerNumber,
      matched: false,
      warnings: [`Message ${messageId} does not mention offer ${offerNumber}.`],
    }
  }

  const signal = classifyReplySignal(searchableText)
  const actor = senderActor(request.message)
  const followUpTaskId = findFollowUpTaskId(searchableText, request.followUpTaskIds ?? [])
  if (signal === "follow_up_completed" && !followUpTaskId) {
    warnings.push("Follow-up completion signal found, but no matching follow-up task id was present.")
  }

  const eventKind = toEventKind(signal, followUpTaskId)
  const event: OfferLifecycleEventInput = {
    actor,
    kind: eventKind,
    occurredAt,
    note: buildReplyNote(request.message, signal),
  }
  if (eventKind === "follow_up_completed") {
    event.followUpTaskId = followUpTaskId
  }

  return {
    adapterVersion: GMAIL_OFFER_REPLY_ADAPTER_VERSION,
    messageId,
    threadId: optionalTrim(request.message.threadId),
    offerNumber,
    matched: true,
    signal,
    event,
    warnings,
  }
}

export function parseGmailOfferReplies(requests: GmailOfferReplyParseRequest[]): GmailOfferReplyParseResult[] {
  return requests.map((request) => parseGmailOfferReply(request))
}

function classifyReplySignal(text: string): GmailOfferReplySignal {
  if (matchesAny(text, declinedPatterns)) {
    return "declined"
  }
  if (matchesAny(text, acceptedPatterns)) {
    return "accepted"
  }
  if (matchesAny(text, followUpCompletedPatterns)) {
    return "follow_up_completed"
  }
  return "note_added"
}

function toEventKind(signal: GmailOfferReplySignal, followUpTaskId: string | undefined): OfferLifecycleEventKind {
  if (signal === "follow_up_completed" && !followUpTaskId) {
    return "note_added"
  }
  return signal
}

function normalizeSearchableText(message: GmailRfqMessage): string {
  return [
    message.subject,
    message.snippet,
    message.plainText,
    stripHtml(message.htmlText),
    message.fromHeader,
    message.senderEmail,
    message.senderName,
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function containsOfferNumber(text: string, offerNumber: string): boolean {
  return text.includes(offerNumber.toLowerCase())
}

function findFollowUpTaskId(text: string, followUpTaskIds: string[]): string | undefined {
  return followUpTaskIds.map((id) => id.trim()).find((id) => id && text.includes(id.toLowerCase()))
}

function senderActor(message: GmailRfqMessage): string {
  return optionalTrim(message.senderEmail) ?? parseEmail(message.fromHeader) ?? optionalTrim(message.senderName) ?? "customer"
}

function buildReplyNote(message: GmailRfqMessage, signal: GmailOfferReplySignal): string {
  const preview = optionalTrim(message.plainText) ?? optionalTrim(stripHtml(message.htmlText)) ?? optionalTrim(message.snippet)
  const prefix = signal === "note_added" ? "Customer reply" : `Customer ${signal.replaceAll("_", " ")} reply`
  return preview ? `${prefix}: ${preview}` : prefix
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function parseEmail(value: string | undefined): string | undefined {
  const header = optionalTrim(value)
  if (!header) {
    return undefined
  }
  return /<([^>]+)>/.exec(header)?.[1]?.trim().toLowerCase() ?? header.match(/[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/)?.[0]?.toLowerCase()
}

function stripHtml(value: string | undefined): string | undefined {
  return value
    ?.replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
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
