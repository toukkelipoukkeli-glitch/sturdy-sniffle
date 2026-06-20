import { describe, expect, it } from "vitest"

import type { OfferReleaseExecutionRun } from "./offerReleaseExecution"
import { summarizeOfferReleaseExecutionHistory } from "./offerReleaseExecutionHistory"

describe("offer release execution history", () => {
  it("summarizes an empty release execution history", () => {
    expect(summarizeOfferReleaseExecutionHistory([])).toEqual({
      historyVersion: "offer-release-execution-history.v1",
      latestRun: undefined,
      pendingActionCount: 0,
      repeatedFingerprints: [],
      statusCounts: {},
      totalRuns: 0,
      warningCount: 0,
    })
  })

  it("orders runs by execution time and aggregates status/action counts", () => {
    const summary = summarizeOfferReleaseExecutionHistory([
      releaseRun({
        executedAt: "2026-06-20T09:00:00+03:00",
        executionFingerprint: "offer-release-execution-aaaabbbb",
        nextActions: ["Record execution outcome for release command: Mark offer sent."],
        status: "pending",
      }),
      releaseRun({
        executedAt: "2026-06-20T09:05:00+03:00",
        executionFingerprint: "offer-release-execution-ccccdddd",
        status: "succeeded",
        warnings: ["Calendar provider returned duplicate event id."],
      }),
    ])

    expect(summary).toMatchObject({
      latestRun: {
        executedAt: "2026-06-20T06:05:00.000Z",
        executionFingerprint: "offer-release-execution-ccccdddd",
        status: "succeeded",
      },
      pendingActionCount: 1,
      statusCounts: {
        pending: 1,
        succeeded: 1,
      },
      totalRuns: 2,
      warningCount: 1,
    })
  })

  it("detects repeated fingerprints for retry/audit review", () => {
    const summary = summarizeOfferReleaseExecutionHistory([
      releaseRun({
        executedAt: "2026-06-20T09:00:00+03:00",
        executionFingerprint: "offer-release-execution-repeat",
        status: "pending",
      }),
      releaseRun({
        executedAt: "2026-06-20T09:03:00+03:00",
        executionFingerprint: "offer-release-execution-unique",
        status: "failed",
      }),
      releaseRun({
        executedAt: "2026-06-20T09:05:00+03:00",
        executionFingerprint: "offer-release-execution-repeat",
        status: "succeeded",
      }),
    ])

    expect(summary.repeatedFingerprints).toEqual([
      {
        count: 2,
        executionFingerprint: "offer-release-execution-repeat",
        latestExecutedAt: "2026-06-20T06:05:00.000Z",
        statuses: ["pending", "succeeded"],
      },
    ])
  })

  it("rejects runs with invalid audit identifiers", () => {
    expect(() =>
      summarizeOfferReleaseExecutionHistory([
        releaseRun({
          executionFingerprint: " ",
        }),
      ]),
    ).toThrow("executionFingerprint is required")
  })
})

function releaseRun(overrides: Partial<OfferReleaseExecutionRun> = {}): OfferReleaseExecutionRun {
  return {
    actor: "Sari",
    calendarEvents: [],
    commands: [
      {
        detail: "Create Gmail draft.",
        idempotencyKey: "offer-release:offer-204:email-draft",
        key: "email-draft",
        kind: "email_draft",
        label: "Draft offer email",
        status: "pending",
        warnings: [],
      },
    ],
    executedAt: "2026-06-20T09:00:00+03:00",
    executionFingerprint: "offer-release-execution-aaaabbbb",
    executionVersion: "offer-release-execution.v1",
    lifecycleEvents: [],
    mode: "commit",
    nextActions: [],
    offerId: "offer-204",
    offerNumber: "OFFER-204",
    planVersion: "offer-release-plan.v1",
    releaseAt: "2026-06-20T09:00:00+03:00",
    rfqId: "rfq-204",
    status: "pending",
    warnings: [],
    workspaceActions: [],
    ...overrides,
  }
}
