import { describe, expect, it } from "vitest"

import { createMockProviderAdapter, hashProviderInput, type ProviderRunRequest, type ProviderRunResult } from "./ai"
import {
  buildConvexProviderRunPayload,
  buildProviderRunAuditFromConvex,
  createConvexProviderRunReader,
  createLocalProviderRunReader,
  type ConvexProviderRunPayload,
} from "./convexProviderRun"
import { buildProviderRunAudit, type ProviderRunAudit } from "./providerRunAudit"

const request: ProviderRunRequest = {
  input: {
    customer: "North Forge",
    subject: "CNC bracket FB-204-A",
  },
  prompt: "Summarize the RFQ for the estimator.",
  purpose: "summarize",
  trace: {
    offerId: "offer-204",
    quoteId: "quote-204",
    rfqId: "rfq-204",
  },
}

describe("Convex provider run persistence payload", () => {
  it("maps a provider run audit to a compact Convex payload", async () => {
    const result = await createMockProviderAdapter({
      cannedTextByPurpose: {
        summarize: "Buyer needs CNC bracket pricing.",
      },
    }).run(request)
    const audit = buildProviderRunAudit({
      completedAt: "2026-06-20T10:00:02+03:00",
      request,
      result,
      startedAt: "2026-06-20T10:00:00+03:00",
    })

    expect(
      buildConvexProviderRunPayload(audit, {
        quoteId: " convex-quote-204 ",
      }),
    ).toEqual<ConvexProviderRunPayload>({
      adapterVersion: "provider-adapter.v1.mock",
      completedAt: 1_781_938_802_000,
      inputHash: result.inputHash,
      offerId: "offer-204",
      outputSummary: "Buyer needs CNC bracket pricing.",
      provider: "mock",
      purpose: "summarize",
      quoteId: "convex-quote-204",
      rfqId: "rfq-204",
      startedAt: 1_781_938_800_000,
      status: "succeeded",
    })
  })

  it("compacts optional fields for failed runs while preserving trace overrides", () => {
    const failedRequest: ProviderRunRequest = {
      input: { offerNumber: "OFFER-204" },
      prompt: "Draft an offer reply.",
      purpose: "draft",
    }
    const result: ProviderRunResult = {
      adapterVersion: "provider-adapter.v1.gemini",
      errorMessage: "Gemini quota exhausted.",
      inputHash: hashProviderInput(failedRequest),
      metadata: {},
      provider: "gemini",
      purpose: "draft",
      status: "failed",
      warnings: [],
    }
    const audit = buildProviderRunAudit({
      completedAt: "2026-06-20T07:00:01.000Z",
      request: failedRequest,
      result,
      startedAt: "2026-06-20T07:00:00.000Z",
    })

    expect(
      buildConvexProviderRunPayload(audit, {
        offerId: "convex-offer-204",
        rfqId: "convex-rfq-204",
      }),
    ).toEqual({
      adapterVersion: "provider-adapter.v1.gemini",
      completedAt: 1_781_938_801_000,
      errorMessage: "Gemini quota exhausted.",
      inputHash: result.inputHash,
      offerId: "convex-offer-204",
      provider: "gemini",
      purpose: "draft",
      rfqId: "convex-rfq-204",
      startedAt: 1_781_938_800_000,
      status: "failed",
    })
  })

  it("rejects unsupported runtime values and invalid timestamps", async () => {
    const audit = buildProviderRunAudit({
      completedAt: "2026-06-20T10:00:02+03:00",
      request,
      result: await createMockProviderAdapter().run(request),
      startedAt: "2026-06-20T10:00:00+03:00",
    })

    expect(() =>
      buildConvexProviderRunPayload({
        ...audit,
        provider: "anthropic" as never,
      }),
    ).toThrow("audit.provider is not a supported provider")

    expect(() =>
      buildConvexProviderRunPayload({
        ...audit,
        status: "running" as never,
      }),
    ).toThrow("audit.status is not a supported provider run status")

    expect(() =>
      buildConvexProviderRunPayload({
        ...audit,
        startedAt: "not-a-date",
      }),
    ).toThrow("audit.startedAt must be a valid ISO timestamp")

    expect(() =>
      buildConvexProviderRunPayload({
        ...audit,
        completedAt: "2026-06-20T10:00:02+03:00",
        startedAt: "2026-06-20T10:00:03+03:00",
      }),
    ).toThrow("audit.completedAt must be on or after audit.startedAt")
  })

  it("hydrates terminal provider run audits from Convex read records", () => {
    expect(
      buildProviderRunAuditFromConvex({
        _id: "provider-run-1",
        adapterVersion: "provider-adapter.v1.gemini",
        completedAt: 1_781_938_802_000,
        createdAt: 1_781_938_803_000,
        errorMessage: "Gemini quota exhausted.",
        inputHash: "input-hash-1",
        offerId: "convex-offer-204",
        provider: "gemini",
        purpose: "draft",
        rfqId: "convex-rfq-204",
        startedAt: 1_781_938_800_000,
        status: "failed",
      }),
    ).toEqual<ProviderRunAudit>({
      adapterVersion: "provider-adapter.v1.gemini",
      auditVersion: "provider-run-audit.v1",
      completedAt: "2026-06-20T07:00:02.000Z",
      durationMs: 2000,
      errorMessage: "Gemini quota exhausted.",
      inputHash: "input-hash-1",
      metadata: {},
      promptExcerpt: "Persisted provider run read from Convex.",
      provider: "gemini",
      purpose: "draft",
      runKey: "draft:gemini:input-hash-1:2026-06-20T07:00:00.000Z",
      startedAt: "2026-06-20T07:00:00.000Z",
      status: "failed",
      trace: {
        offerId: "convex-offer-204",
        rfqId: "convex-rfq-204",
      },
      warnings: [],
    })
  })

  it("lists terminal provider run audits through the configured Convex query", async () => {
    const calls: Array<{ args: Record<string, unknown>; queryRef: unknown }> = []
    const reader = createConvexProviderRunReader({
      queryRef: "listProviderRuns",
      runQuery: async (queryRef, args) => {
        calls.push({ args, queryRef })
        return [
          providerRunRecord({
            completedAt: 1_781_938_805_000,
            inputHash: "input-hash-new",
            startedAt: 1_781_938_804_000,
          }),
          providerRunRecord({
            completedAt: 1_781_938_802_000,
            inputHash: "input-hash-old",
            startedAt: 1_781_938_800_000,
          }),
        ]
      },
    })

    const audits = await reader.listRuns({ limit: 1, rfqId: "convex-rfq-204", status: "succeeded" })

    expect(calls).toEqual([
      {
        args: {
          limit: 1,
          rfqId: "convex-rfq-204",
          status: "succeeded",
        },
        queryRef: "listProviderRuns",
      },
    ])
    expect(audits).toHaveLength(1)
    expect(audits[0]).toMatchObject({
      completedAt: "2026-06-20T07:00:05.000Z",
      inputHash: "input-hash-new",
      outputSummary: "Provider run completed.",
      provider: "mock",
      runKey: "summarize:mock:input-hash-new:2026-06-20T07:00:04.000Z",
      status: "succeeded",
    })
  })

  it("falls back to local provider run audits when Convex reads fail or return malformed rows", async () => {
    const errors: string[] = []
    const fallback = createLocalProviderRunReader({
      audits: [
        providerAudit({
          inputHash: "local-hash",
          startedAt: "2026-06-20T07:30:00.000Z",
        }),
      ],
    })
    const reader = createConvexProviderRunReader({
      fallback,
      onQueryError: (error, args) => {
        errors.push(`${error instanceof Error ? error.message : String(error)}:${args.status ?? "all"}`)
      },
      queryRef: "listProviderRuns",
      runQuery: async () => [
        providerRunRecord({
          status: "running",
        }),
      ],
    })

    const audits = await reader.listRuns()

    expect(errors).toEqual(["record.status is not a completed provider run status:all"])
    expect(audits).toHaveLength(1)
    expect(audits[0]).toMatchObject({
      inputHash: "local-hash",
      runKey: "summarize:mock:local-hash:2026-06-20T07:30:00.000Z",
    })
    audits[0]?.warnings.push("mutated by caller")
    expect((await fallback.listRuns())[0]?.warnings).toEqual([])
  })
})

function providerRunRecord(
  overrides: Partial<{
    adapterVersion: string
    completedAt: number
    createdAt: number
    errorMessage: string
    inputHash: string
    offerId: string
    outputSummary: string
    provider: "elevenlabs" | "gemini" | "local_codex" | "mock" | "tavily"
    purpose: "draft" | "extract" | "scout" | "summarize" | "voice"
    quoteId: string
    rfqId: string
    startedAt: number
    status: "failed" | "queued" | "running" | "skipped" | "succeeded"
  }> = {},
) {
  return {
    _id: "provider-run-1",
    adapterVersion: overrides.adapterVersion ?? "provider-adapter.v1.mock",
    completedAt: overrides.completedAt ?? 1_781_938_802_000,
    createdAt: overrides.createdAt ?? 1_781_938_803_000,
    inputHash: overrides.inputHash ?? "input-hash-1",
    offerId: overrides.offerId,
    outputSummary: overrides.outputSummary ?? "Provider run completed.",
    provider: overrides.provider ?? "mock",
    purpose: overrides.purpose ?? "summarize",
    quoteId: overrides.quoteId,
    rfqId: overrides.rfqId,
    startedAt: overrides.startedAt ?? 1_781_938_800_000,
    status: overrides.status ?? "succeeded",
    ...(overrides.errorMessage ? { errorMessage: overrides.errorMessage } : {}),
  }
}

function providerAudit(overrides: Partial<ProviderRunAudit> = {}): ProviderRunAudit {
  const provider = overrides.provider ?? "mock"
  const purpose = overrides.purpose ?? "summarize"
  const inputHash = overrides.inputHash ?? "input-hash-local"
  const startedAt = overrides.startedAt ?? "2026-06-20T07:00:00.000Z"
  const completedAt = overrides.completedAt ?? startedAt
  return {
    adapterVersion: `provider-adapter.v1.${provider}`,
    auditVersion: "provider-run-audit.v1",
    completedAt,
    durationMs: Date.parse(completedAt) - Date.parse(startedAt),
    inputHash,
    metadata: {},
    promptExcerpt: "Local provider audit.",
    provider,
    purpose,
    runKey: `${purpose}:${provider}:${inputHash}:${startedAt}`,
    startedAt,
    status: overrides.status ?? "succeeded",
    trace: overrides.trace,
    warnings: overrides.warnings ?? [],
    ...overrides,
  }
}
