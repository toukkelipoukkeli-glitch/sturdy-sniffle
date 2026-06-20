import { compareLex } from "../shared/deterministic"

export const PROVIDER_ADAPTER_VERSION = "provider-adapter.v1"

export type AiProviderKey = "local_codex" | "gemini" | "tavily" | "elevenlabs" | "mock"
export type ProviderPurpose = "extract" | "summarize" | "draft" | "scout" | "voice"
export type ProviderRunStatus = "succeeded" | "failed" | "skipped"

export type ProviderJsonValue =
  | string
  | number
  | boolean
  | null
  | ProviderJsonValue[]
  | ProviderJsonObject

export interface ProviderJsonObject {
  readonly [key: string]: ProviderJsonValue | undefined
}

export type ProviderRunMetadata = Record<string, string | number | boolean>

export interface ProviderRunRequest {
  purpose: ProviderPurpose
  prompt: string
  input: ProviderJsonObject
  preferredProvider?: AiProviderKey
  trace?: {
    rfqId?: string
    quoteId?: string
    offerId?: string
  }
}

export interface ProviderRunResult {
  provider: AiProviderKey
  adapterVersion: string
  purpose: ProviderPurpose
  status: ProviderRunStatus
  inputHash: string
  outputText?: string
  outputSummary?: string
  errorMessage?: string
  warnings: string[]
  metadata: ProviderRunMetadata
}

export interface AiProviderAdapter {
  provider: AiProviderKey
  adapterVersion: string
  supportedPurposes: readonly ProviderPurpose[]
  run(request: ProviderRunRequest): Promise<ProviderRunResult>
}

export interface ProviderRouter {
  adapterFor(provider: AiProviderKey): AiProviderAdapter | undefined
  run(request: ProviderRunRequest): Promise<ProviderRunResult>
}

export interface ProviderRouterOptions {
  adapters: AiProviderAdapter[]
  fallbackAdapter?: AiProviderAdapter
}

export interface MockProviderAdapterOptions {
  adapterVersion?: string
  cannedTextByPurpose?: Partial<Record<ProviderPurpose, string>>
}

export interface LocalCodexInvocation {
  purpose: ProviderPurpose
  prompt: string
  input: ProviderJsonObject
  inputHash: string
}

export interface LocalCodexInvocationResult {
  text: string
  model?: string
  metadata?: ProviderRunMetadata
}

export interface LocalCodexAdapterOptions {
  adapterVersion?: string
  invoke?: (invocation: LocalCodexInvocation) => Promise<LocalCodexInvocationResult>
  supportedPurposes?: readonly ProviderPurpose[]
}

const allProviderPurposes: readonly ProviderPurpose[] = ["extract", "summarize", "draft", "scout", "voice"]
const localCodexPurposes: readonly ProviderPurpose[] = ["extract", "summarize", "draft", "scout"]

export function createProviderRouter(options: ProviderRouterOptions): ProviderRouter {
  const fallbackAdapter = options.fallbackAdapter ?? createMockProviderAdapter()
  const adapters = new Map<AiProviderKey, AiProviderAdapter>()
  addAdapter(adapters, fallbackAdapter)
  for (const adapter of options.adapters) {
    addAdapter(adapters, adapter)
  }

  return {
    adapterFor(provider) {
      return adapters.get(provider)
    },

    async run(request) {
      validateRequest(request)
      const preferredProvider = request.preferredProvider ?? fallbackAdapter.provider
      const adapter = adapters.get(preferredProvider)

      if (!adapter) {
        return runFallback(fallbackAdapter, request, `Provider ${preferredProvider} is not configured; used ${fallbackAdapter.provider} fallback.`)
      }

      if (!supportsPurpose(adapter, request.purpose)) {
        return runFallback(
          fallbackAdapter,
          request,
          `Provider ${preferredProvider} does not support ${request.purpose}; used ${fallbackAdapter.provider} fallback.`,
        )
      }

      try {
        const result = await adapter.run(request)
        validateResult(result, request)
        if (result.status === "succeeded") {
          return result
        }
        return runFallback(
          fallbackAdapter,
          request,
          `Provider ${preferredProvider} returned ${result.status}; used ${fallbackAdapter.provider} fallback.`,
        )
      } catch (error) {
        return runFallback(
          fallbackAdapter,
          request,
          `Provider ${preferredProvider} failed: ${errorToMessage(error)}; used ${fallbackAdapter.provider} fallback.`,
        )
      }
    },
  }
}

export function createMockProviderAdapter(options: MockProviderAdapterOptions = {}): AiProviderAdapter {
  const adapterVersion = options.adapterVersion ?? `${PROVIDER_ADAPTER_VERSION}.mock`

  return {
    provider: "mock",
    adapterVersion,
    supportedPurposes: allProviderPurposes,
    async run(request) {
      validateRequest(request)
      const inputHash = hashProviderInput(request)
      const outputText = options.cannedTextByPurpose?.[request.purpose] ?? buildMockText(request, inputHash)

      return {
        provider: "mock",
        adapterVersion,
        purpose: request.purpose,
        status: "succeeded",
        inputHash,
        outputText,
        outputSummary: summarizeText(outputText),
        warnings: ["Mock provider output; no external AI service was called."],
        metadata: {
          deterministic: true,
        },
      }
    },
  }
}

export function createLocalCodexAdapter(options: LocalCodexAdapterOptions = {}): AiProviderAdapter {
  const adapterVersion = options.adapterVersion ?? `${PROVIDER_ADAPTER_VERSION}.local_codex`
  const supportedPurposes = options.supportedPurposes ?? localCodexPurposes

  return {
    provider: "local_codex",
    adapterVersion,
    supportedPurposes,
    async run(request) {
      validateRequest(request)
      const inputHash = hashProviderInput(request)
      if (!supportedPurposes.includes(request.purpose)) {
        return buildSkippedResult("local_codex", adapterVersion, request, inputHash, `Local Codex does not support ${request.purpose}.`)
      }

      if (!options.invoke) {
        return buildSkippedResult("local_codex", adapterVersion, request, inputHash, "Local Codex invoker is not configured.")
      }

      try {
        const response = await options.invoke({
          purpose: request.purpose,
          prompt: request.prompt,
          input: request.input,
          inputHash,
        })
        const outputText = nonBlank(response.text, "localCodex.text")
        const metadata = normalizeMetadata(response.metadata)
        if (response.model?.trim()) {
          metadata.model = response.model.trim()
        }

        return {
          provider: "local_codex",
          adapterVersion,
          purpose: request.purpose,
          status: "succeeded",
          inputHash,
          outputText,
          outputSummary: summarizeText(outputText),
          warnings: [],
          metadata,
        }
      } catch (error) {
        return {
          provider: "local_codex",
          adapterVersion,
          purpose: request.purpose,
          status: "failed",
          inputHash,
          errorMessage: errorToMessage(error),
          warnings: [],
          metadata: {},
        }
      }
    },
  }
}

export function hashProviderInput(request: ProviderRunRequest): string {
  validateRequest(request)
  const stablePayload = stableStringify({
    input: request.input,
    prompt: request.prompt,
    purpose: request.purpose,
  })
  let hash = 0x811c9dc5
  for (let index = 0; index < stablePayload.length; index += 1) {
    hash ^= stablePayload.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}

function addAdapter(adapters: Map<AiProviderKey, AiProviderAdapter>, adapter: AiProviderAdapter) {
  if (adapters.has(adapter.provider)) {
    throw new Error(`Duplicate provider adapter: ${adapter.provider}`)
  }
  adapters.set(adapter.provider, adapter)
}

async function runFallback(
  fallbackAdapter: AiProviderAdapter,
  request: ProviderRunRequest,
  warning: string,
): Promise<ProviderRunResult> {
  try {
    const fallbackResult = await fallbackAdapter.run({
      ...request,
      preferredProvider: fallbackAdapter.provider,
    })
    validateResult(fallbackResult, request)
    return {
      ...fallbackResult,
      warnings: [...fallbackResult.warnings, warning],
      metadata: {
        ...fallbackResult.metadata,
        fallbackReason: warning,
      },
    }
  } catch (error) {
    return {
      provider: fallbackAdapter.provider,
      adapterVersion: fallbackAdapter.adapterVersion,
      purpose: request.purpose,
      status: "failed",
      inputHash: hashProviderInput(request),
      errorMessage: errorToMessage(error),
      warnings: [warning],
      metadata: {
        fallbackReason: warning,
      },
    }
  }
}

function validateRequest(request: ProviderRunRequest) {
  if (!allProviderPurposes.includes(request.purpose)) {
    throw new Error(`Unsupported provider purpose: ${request.purpose}`)
  }
  nonBlank(request.prompt, "prompt")
  validateJsonValue(request.input, "input")
}

function validateResult(result: ProviderRunResult, request: ProviderRunRequest) {
  if (result.purpose !== request.purpose) {
    throw new Error("provider result purpose must match request purpose")
  }
  nonBlank(result.adapterVersion, "adapterVersion")
  nonBlank(result.inputHash, "inputHash")
  if (result.status === "succeeded") {
    nonBlank(result.outputText ?? "", "outputText")
  }
}

function supportsPurpose(adapter: Pick<AiProviderAdapter, "supportedPurposes">, purpose: ProviderPurpose): boolean {
  return adapter.supportedPurposes.includes(purpose)
}

function buildSkippedResult(
  provider: AiProviderKey,
  adapterVersion: string,
  request: ProviderRunRequest,
  inputHash: string,
  reason: string,
): ProviderRunResult {
  return {
    provider,
    adapterVersion,
    purpose: request.purpose,
    status: "skipped",
    inputHash,
    errorMessage: reason,
    warnings: [reason],
    metadata: {},
  }
}

function buildMockText(request: ProviderRunRequest, inputHash: string): string {
  const subject = stringField(request.input, "subject") ?? stringField(request.input, "title") ?? `${request.purpose} request`
  const promptExcerpt = summarizeText(request.prompt)
  return `[mock:${request.purpose}:${inputHash}] ${purposeVerb(request.purpose)} for ${subject}. Prompt: ${promptExcerpt}`
}

function purposeVerb(purpose: ProviderPurpose): string {
  switch (purpose) {
    case "extract":
      return "Extracted fields"
    case "summarize":
      return "Summary"
    case "draft":
      return "Draft"
    case "scout":
      return "Scout notes"
    case "voice":
      return "Voice script"
  }
}

function stringField(input: ProviderJsonObject, key: string): string | undefined {
  const value = input[key]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function summarizeText(value: string): string {
  const compacted = value.replace(/\s+/g, " ").trim()
  return compacted.length > 160 ? `${compacted.slice(0, 157)}...` : compacted
}

function stableStringify(value: ProviderJsonValue | undefined): string {
  if (value === undefined) {
    return "undefined"
  }
  if (value === null) {
    return "null"
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Provider JSON numbers must be finite")
    }
    return JSON.stringify(value)
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`
  }

  return `{${Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => compareLex(left, right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`
}

function validateJsonValue(value: ProviderJsonValue | undefined, path: string) {
  if (value === undefined || value === null || typeof value === "string" || typeof value === "boolean") {
    return
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} must contain only finite numbers`)
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateJsonValue(item, `${path}[${index}]`))
    return
  }
  Object.entries(value).forEach(([key, item]) => validateJsonValue(item, `${path}.${key}`))
}

function normalizeMetadata(metadata: ProviderRunMetadata | undefined): ProviderRunMetadata {
  return metadata ? { ...metadata } : {}
}

function nonBlank(value: string | undefined, key: string): string {
  if (typeof value !== "string") {
    throw new Error(`${key} is required`)
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown provider error"
}
