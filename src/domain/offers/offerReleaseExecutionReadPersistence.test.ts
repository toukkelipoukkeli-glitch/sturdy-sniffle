import { describe, expect, it } from "vitest"

import {
  createConvexOfferReleaseExecutionReader,
  createLocalOfferReleaseExecutionReader,
} from "./offerReleaseExecutionReadPersistence"

describe("offer release execution read persistence", () => {
  it("lists release execution history through the configured Convex query", async () => {
    const calls: Array<{ args: Record<string, unknown>; queryRef: unknown }> = []
    const reader = createConvexOfferReleaseExecutionReader({
      queryRef: "listOfferReleaseExecutions",
      runQuery: async (queryRef, args) => {
        calls.push({ args, queryRef })
        return [
          releaseExecutionRecord({
            executedAt: "2026-06-20T09:05:00+03:00",
            executionFingerprint: "offer-release-execution-ready",
            mode: "commit",
            status: "succeeded",
            warningCount: 0,
          }),
          releaseExecutionRecord({
            executionFingerprint: "offer-release-execution-blocked",
            status: "blocked",
            warningCount: 2,
          }),
        ]
      },
    })

    const summary = await reader.listExecutions({
      limit: 10,
      offerId: "convex-offer-204",
      offerNumber: "OFFER-204",
    })

    expect(calls).toEqual([
      {
        args: {
          limit: 10,
          offerId: "convex-offer-204",
        },
        queryRef: "listOfferReleaseExecutions",
      },
    ])
    expect(summary).toMatchObject({
      latestRun: {
        executedAt: "2026-06-20T06:05:00.000Z",
        executionFingerprint: "offer-release-execution-ready",
        mode: "commit",
        offerNumber: "OFFER-204",
        status: "succeeded",
      },
      statusCounts: {
        blocked: 1,
        succeeded: 1,
      },
      totalRuns: 2,
      warningCount: 2,
    })
  })

  it("falls back to local release execution records when the Convex query fails", async () => {
    const errors: string[] = []
    const fallback = createLocalOfferReleaseExecutionReader({
      records: [releaseExecutionRecord({ executionFingerprint: "local-release-execution", status: "failed" })],
    })
    const reader = createConvexOfferReleaseExecutionReader({
      fallback,
      onQueryError: (error, args) => {
        errors.push(`${error instanceof Error ? error.message : String(error)}:${args.offerId}`)
      },
      queryRef: "listOfferReleaseExecutions",
      runQuery: async () => {
        throw new Error("Convex execution query unavailable")
      },
    })

    const summary = await reader.listExecutions({ offerId: "convex-offer-204", offerNumber: "OFFER-204" })

    expect(errors).toEqual(["Convex execution query unavailable:convex-offer-204"])
    expect(summary).toMatchObject({
      latestRun: {
        executionFingerprint: "local-release-execution",
        offerNumber: "OFFER-204",
        status: "failed",
      },
      statusCounts: {
        failed: 1,
      },
      totalRuns: 1,
    })
  })
})

function releaseExecutionRecord(
  overrides: {
    executedAt?: string
    executionFingerprint?: string
    mode?: "commit" | "dry_run"
    status?: "blocked" | "failed" | "needs_review" | "partial" | "pending" | "prepared" | "succeeded"
    warningCount?: number
  } = {},
) {
  return {
    executedAt: overrides.executedAt ?? "2026-06-20T09:00:00+03:00",
    executionFingerprint: overrides.executionFingerprint ?? "offer-release-execution-blocked",
    executionKey: "offer-release-execution:convex-offer-204:blocked",
    mode: overrides.mode ?? "dry_run",
    nextActions: ["Resolve release blockers."],
    offerId: "convex-offer-204",
    status: overrides.status ?? "blocked",
    warningCount: overrides.warningCount ?? 1,
    warnings: ["Manager review required."],
  }
}
