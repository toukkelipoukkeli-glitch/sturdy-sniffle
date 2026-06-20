import { normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { AiProviderKey, ProviderPurpose, ProviderRunStatus } from "./ai"
import type { ProviderRunAudit } from "./providerRunAudit"

export interface ConvexProviderRunPayload {
  provider: AiProviderKey
  adapterVersion: string
  purpose: ProviderPurpose
  status: ProviderRunStatus
  inputHash: string
  startedAt: number
  completedAt: number
  outputSummary?: string
  errorMessage?: string
  rfqId?: string
  quoteId?: string
  offerId?: string
}

export interface BuildConvexProviderRunPayloadOptions {
  rfqId?: string
  quoteId?: string
  offerId?: string
}

export function buildConvexProviderRunPayload(
  audit: ProviderRunAudit,
  options: BuildConvexProviderRunPayloadOptions = {},
): ConvexProviderRunPayload {
  const startedAt = isoTimestampMillis(audit.startedAt, "audit.startedAt")
  const completedAt = isoTimestampMillis(audit.completedAt, "audit.completedAt")
  if (completedAt < startedAt) {
    throw new Error("audit.completedAt must be on or after audit.startedAt")
  }

  const rfqId = optionalTrim(options.rfqId) ?? optionalTrim(audit.trace?.rfqId)
  const quoteId = optionalTrim(options.quoteId) ?? optionalTrim(audit.trace?.quoteId)
  const offerId = optionalTrim(options.offerId) ?? optionalTrim(audit.trace?.offerId)
  const outputSummary = optionalTrim(audit.outputSummary)
  const errorMessage = optionalTrim(audit.errorMessage)

  return {
    adapterVersion: nonBlank(audit.adapterVersion, "audit.adapterVersion"),
    completedAt,
    ...(errorMessage ? { errorMessage } : {}),
    inputHash: nonBlank(audit.inputHash, "audit.inputHash"),
    ...(offerId ? { offerId } : {}),
    ...(outputSummary ? { outputSummary } : {}),
    provider: normalizeProvider(audit.provider),
    purpose: normalizePurpose(audit.purpose),
    ...(quoteId ? { quoteId } : {}),
    ...(rfqId ? { rfqId } : {}),
    startedAt,
    status: normalizeStatus(audit.status),
  }
}

function isoTimestampMillis(value: string, key: string): number {
  return Date.parse(normalizeIsoTimestamp(value, key))
}

function normalizeProvider(provider: AiProviderKey): AiProviderKey {
  if (
    provider !== "elevenlabs" &&
    provider !== "gemini" &&
    provider !== "local_codex" &&
    provider !== "mock" &&
    provider !== "tavily"
  ) {
    throw new Error("audit.provider is not a supported provider")
  }
  return provider
}

function normalizePurpose(purpose: ProviderPurpose): ProviderPurpose {
  if (purpose !== "draft" && purpose !== "extract" && purpose !== "scout" && purpose !== "summarize" && purpose !== "voice") {
    throw new Error("audit.purpose is not a supported provider purpose")
  }
  return purpose
}

function normalizeStatus(status: ProviderRunStatus): ProviderRunStatus {
  if (status !== "failed" && status !== "skipped" && status !== "succeeded") {
    throw new Error("audit.status is not a supported provider run status")
  }
  return status
}
