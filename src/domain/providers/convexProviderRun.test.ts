import { describe, expect, it } from "vitest"

import { createMockProviderAdapter, hashProviderInput, type ProviderRunRequest, type ProviderRunResult } from "./ai"
import { buildConvexProviderRunPayload, type ConvexProviderRunPayload } from "./convexProviderRun"
import { buildProviderRunAudit } from "./providerRunAudit"

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
  })
})
