import { describe, expect, it } from "vitest"

import { createMockProviderAdapter, hashProviderInput, type ProviderRunRequest, type ProviderRunResult } from "./ai"
import { buildProviderRunAudit } from "./providerRunAudit"

const request: ProviderRunRequest = {
  purpose: "summarize",
  prompt: "Summarize RFQ from buyer@example.test. Use key sk-testsecret12345 only in local fixtures.",
  input: {
    customer: "North Forge",
    subject: "CNC bracket FB-204-A",
  },
  trace: {
    quoteId: "quote-204",
    rfqId: "rfq-204",
  },
}

describe("provider run audit", () => {
  it("builds a redacted deterministic audit record from provider results", async () => {
    const result = await createMockProviderAdapter({
      cannedTextByPurpose: {
        summarize: "Summary sent to buyer@example.test with sk-testsecret12345 removed.",
      },
    }).run(request)

    const audit = buildProviderRunAudit({
      completedAt: "2026-06-20T10:00:02+03:00",
      request,
      result,
      startedAt: "2026-06-20T10:00:00+03:00",
    })

    expect(audit).toMatchObject({
      adapterVersion: "provider-adapter.v1.mock",
      auditVersion: "provider-run-audit.v1",
      completedAt: "2026-06-20T07:00:02.000Z",
      durationMs: 2000,
      inputHash: result.inputHash,
      provider: "mock",
      purpose: "summarize",
      startedAt: "2026-06-20T07:00:00.000Z",
      status: "succeeded",
      trace: {
        quoteId: "quote-204",
        rfqId: "rfq-204",
      },
    })
    expect(audit.runKey).toBe(`summarize:mock:${result.inputHash}:2026-06-20T07:00:00.000Z`)
    expect(audit.promptExcerpt).toBe("Summarize RFQ from [redacted-email]. Use key [redacted-token] only in local fixtures.")
    expect(audit.outputSummary).toBe("Summary sent to [redacted-email] with [redacted-token] removed.")
    expect(audit.warnings).toEqual(["Mock provider output; no external AI service was called."])
  })

  it("captures failed provider runs without output summaries", () => {
    const result: ProviderRunResult = {
      adapterVersion: "provider-adapter.v1.local_codex",
      errorMessage: "Gemini key AIzaExampleSecret123456 failed.",
      inputHash: hashProviderInput(request),
      metadata: {
        retryable: false,
      },
      provider: "local_codex",
      purpose: "summarize",
      status: "failed",
      warnings: ["Do not expose ghp_exampleSecretToken in logs."],
    }

    const audit = buildProviderRunAudit({
      completedAt: "2026-06-20T07:00:01.000Z",
      request,
      result,
      startedAt: "2026-06-20T07:00:00.000Z",
    })

    expect(audit.outputSummary).toBeUndefined()
    expect(audit.errorMessage).toBe("Gemini key [redacted-token] failed.")
    expect(audit.warnings).toEqual(["Do not expose [redacted-token] in logs."])
    expect(audit.metadata).toEqual({ retryable: false })
  })

  it("rejects mismatched hashes and impossible timestamps", () => {
    const result: ProviderRunResult = {
      adapterVersion: "provider-adapter.v1.mock",
      inputHash: "deadbeef",
      metadata: {},
      outputText: "Nope",
      provider: "mock",
      purpose: "summarize",
      status: "succeeded",
      warnings: [],
    }

    expect(() =>
      buildProviderRunAudit({
        completedAt: "2026-06-20T07:00:00.000Z",
        request,
        result,
        startedAt: "2026-06-20T07:00:01.000Z",
      }),
    ).toThrow("completedAt must be on or after startedAt")

    expect(() =>
      buildProviderRunAudit({
        completedAt: "2026-06-20T07:00:01.000Z",
        request,
        result,
        startedAt: "2026-06-20T07:00:00.000Z",
      }),
    ).toThrow("provider result inputHash must match request input hash")
  })
})
