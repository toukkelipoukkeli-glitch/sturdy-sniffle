import { describe, expect, it } from "vitest"

import type { ProviderRunAudit } from "./providerRunAudit"
import { buildProviderRunHistorySummary } from "./providerRunHistory"

describe("provider run history summary", () => {
  it("summarizes provider runs in newest-first deterministic order", () => {
    expect(buildProviderRunHistorySummary(audits())).toEqual({
      events: [
        {
          provider: "gemini",
          purpose: "draft",
          runKey: "draft:gemini:hash-2:2026-06-20T08:00:00.000Z",
          status: "failed",
          summary: "Gemini quota exceeded.",
          usedFallback: false,
          warningCount: 1,
        },
        {
          provider: "mock",
          purpose: "summarize",
          runKey: "summarize:mock:hash-1:2026-06-20T07:00:00.000Z",
          status: "succeeded",
          summary: "Fallback summary ready.",
          usedFallback: true,
          warningCount: 1,
        },
        {
          provider: "local_codex",
          purpose: "extract",
          runKey: "extract:local_codex:hash-0:2026-06-20T06:00:00.000Z",
          status: "skipped",
          summary: "Skipped because deterministic parser was sufficient.",
          usedFallback: false,
          warningCount: 0,
        },
      ],
      failedCount: 1,
      fallbackCount: 1,
      filter: "all",
      skippedCount: 1,
      succeededCount: 1,
      totalRuns: 3,
      warningCount: 2,
    })
  })

  it("filters failures, fallbacks, skipped runs, successes, and warnings without changing counts", () => {
    expect(buildProviderRunHistorySummary(audits(), { filter: "failed" })).toMatchObject({
      events: [
        {
          provider: "gemini",
          status: "failed",
        },
      ],
      failedCount: 1,
      filter: "failed",
      totalRuns: 3,
    })
    expect(buildProviderRunHistorySummary(audits(), { filter: "fallbacks" }).events.map((event) => event.provider)).toEqual(["mock"])
    expect(buildProviderRunHistorySummary(audits(), { filter: "skipped" }).events.map((event) => event.status)).toEqual(["skipped"])
    expect(buildProviderRunHistorySummary(audits(), { filter: "succeeded" }).events.map((event) => event.status)).toEqual(["succeeded"])
    expect(buildProviderRunHistorySummary(audits(), { filter: "warnings" }).events.map((event) => event.warningCount)).toEqual([1, 1])
  })
})

function audits(): ProviderRunAudit[] {
  return [
    audit({
      outputSummary: "Fallback summary ready.",
      provider: "mock",
      purpose: "summarize",
      startedAt: "2026-06-20T07:00:00.000Z",
      status: "succeeded",
      warnings: ["Used mock fallback."],
    }),
    audit({
      errorMessage: "Gemini quota exceeded.",
      provider: "gemini",
      purpose: "draft",
      startedAt: "2026-06-20T08:00:00.000Z",
      status: "failed",
      warnings: ["Retry after quota reset."],
    }),
    audit({
      outputSummary: "Skipped because deterministic parser was sufficient.",
      provider: "local_codex",
      purpose: "extract",
      startedAt: "2026-06-20T06:00:00.000Z",
      status: "skipped",
      warnings: [],
    }),
  ]
}

function audit(overrides: Partial<ProviderRunAudit>): ProviderRunAudit {
  const provider = overrides.provider ?? "mock"
  const purpose = overrides.purpose ?? "summarize"
  const startedAt = overrides.startedAt ?? "2026-06-20T07:00:00.000Z"
  const hash = overrides.inputHash ?? `hash-${Number(startedAt.slice(11, 13)) - 6}`
  return {
    adapterVersion: `provider-adapter.v1.${provider}`,
    auditVersion: "provider-run-audit.v1",
    completedAt: startedAt,
    durationMs: 1000,
    inputHash: hash,
    metadata: {},
    promptExcerpt: "Summarize fixture RFQ.",
    provider,
    purpose,
    runKey: `${purpose}:${provider}:${hash}:${startedAt}`,
    startedAt,
    status: overrides.status ?? "succeeded",
    warnings: overrides.warnings ?? [],
    ...overrides,
  }
}
