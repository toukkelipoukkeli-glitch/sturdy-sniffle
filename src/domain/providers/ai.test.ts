import { describe, expect, it } from "vitest"

import {
  createLocalCodexAdapter,
  createMockProviderAdapter,
  createProviderRouter,
  hashProviderInput,
  type ProviderRunRequest,
} from "./ai"

const summarizeRequest: ProviderRunRequest = {
  purpose: "summarize",
  prompt: "Summarize this RFQ for an estimator.",
  input: {
    customer: "North Forge",
    quantity: 25,
    subject: "CNC bracket FB-204-A",
  },
}

describe("AI provider adapters", () => {
  it("hashes provider inputs stably without provider preference", () => {
    const left = hashProviderInput({
      purpose: "summarize",
      prompt: "Summarize",
      preferredProvider: "local_codex",
      input: {
        nested: {
          b: 2,
          a: "first",
        },
        subject: "Bracket",
      },
    })
    const right = hashProviderInput({
      purpose: "summarize",
      prompt: "Summarize",
      preferredProvider: "gemini",
      input: {
        subject: "Bracket",
        nested: {
          a: "first",
          b: 2,
        },
      },
    })

    expect(left).toMatch(/^[0-9a-f]{8}$/)
    expect(left).toBe(right)
  })

  it("returns deterministic mock output without calling external services", async () => {
    const adapter = createMockProviderAdapter()
    const result = await adapter.run(summarizeRequest)

    expect(result).toMatchObject({
      provider: "mock",
      status: "succeeded",
      purpose: "summarize",
      metadata: {
        deterministic: true,
      },
    })
    expect(result.outputText).toContain(`[mock:summarize:${result.inputHash}]`)
    expect(result.outputText).toContain("CNC bracket FB-204-A")
    expect(result.warnings).toContain("Mock provider output; no external AI service was called.")
  })

  it("runs local Codex through an injected server-side invoker", async () => {
    const adapter = createLocalCodexAdapter({
      invoke: async (invocation) => ({
        text: `Local Codex response for ${invocation.inputHash}`,
        model: "local-codex",
        metadata: {
          fixture: true,
        },
      }),
    })

    const result = await adapter.run({
      ...summarizeRequest,
      preferredProvider: "local_codex",
    })

    expect(result).toMatchObject({
      provider: "local_codex",
      status: "succeeded",
      outputText: `Local Codex response for ${result.inputHash}`,
      metadata: {
        fixture: true,
        model: "local-codex",
      },
    })
    expect(result.warnings).toEqual([])
  })

  it("falls back to mock when local Codex is not configured", async () => {
    const router = createProviderRouter({
      adapters: [createLocalCodexAdapter()],
    })

    const result = await router.run({
      ...summarizeRequest,
      preferredProvider: "local_codex",
    })

    expect(result.provider).toBe("mock")
    expect(result.status).toBe("succeeded")
    expect(result.metadata.fallbackReason).toBe("Provider local_codex returned skipped; used mock fallback.")
    expect(result.warnings).toContain("Provider local_codex returned skipped; used mock fallback.")
  })

  it("falls back to mock when a preferred provider has no adapter", async () => {
    const router = createProviderRouter({
      adapters: [],
    })

    const result = await router.run({
      ...summarizeRequest,
      preferredProvider: "gemini",
    })

    expect(result.provider).toBe("mock")
    expect(result.warnings).toContain("Provider gemini is not configured; used mock fallback.")
  })

  it("falls back when local Codex does not support a purpose", async () => {
    const router = createProviderRouter({
      adapters: [
        createLocalCodexAdapter({
          invoke: async () => ({ text: "Should not be called" }),
        }),
      ],
    })

    const result = await router.run({
      purpose: "voice",
      prompt: "Create a voice follow-up script.",
      input: {
        subject: "Offer follow-up",
      },
      preferredProvider: "local_codex",
    })

    expect(result.provider).toBe("mock")
    expect(result.warnings).toContain("Provider local_codex does not support voice; used mock fallback.")
  })

  it("rejects duplicate provider registrations", () => {
    expect(() =>
      createProviderRouter({
        adapters: [createMockProviderAdapter()],
      }),
    ).toThrow("Duplicate provider adapter: mock")
  })

  it("rejects non-finite provider input numbers", async () => {
    const adapter = createMockProviderAdapter()

    await expect(
      adapter.run({
        purpose: "summarize",
        prompt: "Summarize",
        input: {
          quantity: Number.POSITIVE_INFINITY,
        },
      }),
    ).rejects.toThrow("input.quantity must contain only finite numbers")
  })
})
