import { parseRfqIntake, type ParsedRfqIntake, type RfqAttachmentInput, type RfqIntakeInput } from "../rfq/intake"
import { normalizeIsoTimestamp } from "../shared/deterministic"

export const GMAIL_RFQ_ADAPTER_VERSION = "gmail-rfq.v1"

export type GmailRfqProviderKey = "gmail" | "mock"
export type GmailRfqIngestStatus = "succeeded" | "fallback" | "failed"

export interface GmailRfqAttachment {
  id?: string
  fileName: string
  mimeType?: string
  sizeBytes?: number
  extractedText?: string
}

export interface GmailRfqMessage {
  id: string
  threadId?: string
  subject: string
  receivedAt: string
  fromHeader?: string
  senderEmail?: string
  senderName?: string
  snippet?: string
  plainText?: string
  htmlText?: string
  labelIds?: string[]
  attachments?: GmailRfqAttachment[]
}

export interface GmailRfqSearchRequest {
  query: string
  maxResults?: number
}

export interface GmailRfqMessageProvider {
  provider: GmailRfqProviderKey
  adapterVersion: string
  search(request: GmailRfqSearchRequest): Promise<GmailRfqMessage[]>
}

export interface GmailRfqIntakeRecord {
  messageId: string
  threadId?: string
  intakeInput: RfqIntakeInput
  parsed: ParsedRfqIntake
}

export interface GmailRfqIngestResult {
  provider: GmailRfqProviderKey
  adapterVersion: string
  status: GmailRfqIngestStatus
  query: string
  records: GmailRfqIntakeRecord[]
  warnings: string[]
}

export interface GmailRfqIntakeAdapter {
  adapterVersion: string
  ingest(request: GmailRfqSearchRequest): Promise<GmailRfqIngestResult>
}

export interface GmailRfqIntakeAdapterOptions {
  provider?: GmailRfqMessageProvider
  fallbackProvider?: GmailRfqMessageProvider
}

export interface MockGmailRfqProviderOptions {
  messages?: GmailRfqMessage[]
  adapterVersion?: string
  shouldFail?: boolean
}

export function createGmailRfqIntakeAdapter(options: GmailRfqIntakeAdapterOptions = {}): GmailRfqIntakeAdapter {
  const fallbackProvider = options.fallbackProvider ?? createMockGmailRfqProvider()
  const provider = options.provider ?? fallbackProvider

  return {
    adapterVersion: GMAIL_RFQ_ADAPTER_VERSION,
    async ingest(request) {
      validateSearchRequest(request)

      try {
        const messages = await provider.search(request)
        return buildIngestResult("succeeded", provider, request, messages, [])
      } catch (error) {
        const primaryWarning = `Gmail RFQ provider ${provider.provider} failed: ${errorToMessage(error)}.`
        try {
          const fallbackMessages = await fallbackProvider.search(request)
          return buildIngestResult("fallback", fallbackProvider, request, fallbackMessages, [
            primaryWarning,
            `Used ${fallbackProvider.provider} RFQ intake fallback.`,
          ])
        } catch (fallbackError) {
          return {
            provider: fallbackProvider.provider,
            adapterVersion: fallbackProvider.adapterVersion,
            status: "failed",
            query: request.query.trim(),
            records: [],
            warnings: [
              primaryWarning,
              `Fallback RFQ provider ${fallbackProvider.provider} failed: ${errorToMessage(fallbackError)}.`,
            ],
          }
        }
      }
    },
  }
}

export function createMockGmailRfqProvider(options: MockGmailRfqProviderOptions = {}): GmailRfqMessageProvider {
  const messages = options.messages ?? []
  const adapterVersion = options.adapterVersion ?? `${GMAIL_RFQ_ADAPTER_VERSION}.mock`

  return {
    provider: "mock",
    adapterVersion,
    async search(request) {
      validateSearchRequest(request)
      if (options.shouldFail) {
        throw new Error("Mock Gmail RFQ provider failure")
      }

      return filterMessages(messages, request).map((message) => ({ ...message }))
    },
  }
}

export function buildRfqIntakeFromGmailMessage(
  message: GmailRfqMessage,
  provider: GmailRfqProviderKey = "gmail",
): RfqIntakeInput {
  const id = nonBlank(message.id, "message.id")
  const subject = nonBlank(message.subject, "message.subject")
  const receivedAt = parseRequiredDate(message.receivedAt, "message.receivedAt")
  const sender = normalizeSender(message)
  const label = normalizeLabels(message.labelIds)

  return {
    subject,
    bodyText: normalizeBody(message),
    senderEmail: sender.email,
    senderName: sender.name,
    receivedAt,
    source: {
      provider,
      externalId: message.threadId?.trim() ? `${message.threadId.trim()}:${id}` : id,
      label,
    },
    attachments: normalizeAttachments(message.attachments ?? []),
  }
}

export function parseGmailRfqMessage(
  message: GmailRfqMessage,
  provider: GmailRfqProviderKey = "gmail",
): ParsedRfqIntake {
  return parseRfqIntake(buildRfqIntakeFromGmailMessage(message, provider))
}

function buildIngestResult(
  status: GmailRfqIngestStatus,
  provider: GmailRfqMessageProvider,
  request: GmailRfqSearchRequest,
  messages: GmailRfqMessage[],
  warnings: string[],
): GmailRfqIngestResult {
  return {
    provider: provider.provider,
    adapterVersion: provider.adapterVersion,
    status,
    query: request.query.trim(),
    records: messages.map((message) => {
      const intakeInput = buildRfqIntakeFromGmailMessage(message, provider.provider)
      return {
        messageId: message.id.trim(),
        threadId: optionalTrim(message.threadId),
        intakeInput,
        parsed: parseRfqIntake(intakeInput),
      }
    }),
    warnings,
  }
}

function filterMessages(messages: GmailRfqMessage[], request: GmailRfqSearchRequest): GmailRfqMessage[] {
  const tokens = queryTokens(request.query)
  const matchingMessages = tokens.length === 0
    ? messages
    : messages.filter((message) => {
        const haystack = [
          message.subject,
          message.fromHeader,
          message.senderEmail,
          message.senderName,
          message.snippet,
          message.plainText,
          stripHtml(message.htmlText),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return tokens.every((token) => haystack.includes(token))
      })

  return matchingMessages.slice(0, request.maxResults ?? matchingMessages.length)
}

function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[a-z_]+:/, "").replace(/["()]/g, "").trim())
    .filter(Boolean)
}

function normalizeSender(message: GmailRfqMessage): { email?: string; name?: string } {
  const parsed = parseFromHeader(message.fromHeader)
  return {
    email: normalizeEmail(message.senderEmail) ?? parsed.email,
    name: optionalTrim(message.senderName) ?? parsed.name,
  }
}

function parseFromHeader(value: string | undefined): { email?: string; name?: string } {
  const header = optionalTrim(value)
  if (!header) {
    return {}
  }

  const bracketMatch = /^"?([^"<]*)"?\s*<([^>]+)>$/.exec(header)
  if (bracketMatch?.[2]) {
    return {
      name: optionalTrim(bracketMatch[1]),
      email: normalizeEmail(bracketMatch[2]),
    }
  }

  return {
    email: normalizeEmail(header),
  }
}

function normalizeBody(message: GmailRfqMessage): string | undefined {
  return optionalTrim(message.plainText) ?? optionalTrim(stripHtml(message.htmlText)) ?? optionalTrim(message.snippet)
}

function normalizeAttachments(attachments: GmailRfqAttachment[]): RfqAttachmentInput[] {
  return attachments.map((attachment, index) => {
    const normalized: RfqAttachmentInput = {
      fileName: nonBlank(attachment.fileName, `attachments[${index}].fileName`),
    }

    const contentType = optionalTrim(attachment.mimeType)
    const extractedText = optionalTrim(attachment.extractedText)
    if (contentType) {
      normalized.contentType = contentType
    }
    if (attachment.sizeBytes !== undefined) {
      if (!Number.isInteger(attachment.sizeBytes) || attachment.sizeBytes < 0) {
        throw new Error(`attachments[${index}].sizeBytes must be a non-negative integer`)
      }
      normalized.sizeBytes = attachment.sizeBytes
    }
    if (extractedText) {
      normalized.extractedText = extractedText
    }

    return normalized
  })
}

function normalizeLabels(labels: string[] | undefined): string | undefined {
  const normalized = (labels ?? []).map((label) => label.trim()).filter(Boolean)
  return normalized.length > 0 ? normalized.join(",") : undefined
}

function normalizeEmail(value: string | undefined): string | undefined {
  const trimmed = optionalTrim(value)?.toLowerCase()
  if (!trimmed) {
    return undefined
  }
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(trimmed) ? trimmed : undefined
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

function validateSearchRequest(request: GmailRfqSearchRequest) {
  nonBlank(request.query, "query")
  if (request.maxResults !== undefined && (!Number.isInteger(request.maxResults) || request.maxResults <= 0)) {
    throw new Error("maxResults must be a positive integer")
  }
}

function parseRequiredDate(value: string, fieldName: string): string {
  return normalizeIsoTimestamp(value, fieldName)
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

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
