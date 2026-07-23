import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION,
  type NonCncPromotedQuoteApplicationMutationApplyExecutionStatus,
} from "./nonCncPromotedQuoteApplicationMutationApplyExecution"
import {
  createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationMutationApplyExecutionRecord,
} from "./nonCncPromotedQuoteApplicationMutationApplyExecutionPersistence"
import {
  buildNonCncPromotedQuoteReleaseReadiness,
  NON_CNC_PROMOTED_QUOTE_RELEASE_READINESS_VERSION,
} from "./nonCncPromotedQuoteReleaseReadiness"

const request = {
  requestedAt: "2026-07-23T09:15:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC promoted quote release readiness", () => {
  it("blocks customer release when no persisted apply execution exists", () => {
    const snapshot = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence().snapshot()

    const readiness = buildNonCncPromotedQuoteReleaseReadiness({ ...request, snapshot })

    expect(readiness).toMatchObject({
      appliedCommandCount: 0,
      blockerLabels: ["No persisted non-CNC application apply execution records are available."],
      commandCount: 0,
      nextOperatorMessage:
        "Keep customer release on the active workspace quote until the non-CNC quote promotion is persisted and applied.",
      persistedRecordCount: 0,
      readinessVersion: NON_CNC_PROMOTED_QUOTE_RELEASE_READINESS_VERSION,
      status: "blocked",
      targetRfqId: request.targetRfqId,
    })
  })

  it("blocks customer release when persisted executions belong to a different RFQ", () => {
    const snapshot = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
      initialSnapshot: {
        records: [buildRecord({ targetRfqId: "rfq-other-001" })],
      },
    }).snapshot()

    const readiness = buildNonCncPromotedQuoteReleaseReadiness({ ...request, snapshot })

    expect(readiness).toMatchObject({
      blockerLabels: [`No persisted non-CNC application apply execution matches active RFQ: ${request.targetRfqId}.`],
      latestExecutionFingerprint: undefined,
      persistedRecordCount: 1,
      status: "blocked",
    })
  })

  it("uses the latest matching RFQ record so stale successes cannot unlock release", () => {
    const staleSuccess = buildRecord({ executedAt: "2026-07-23T09:00:00.000Z" })
    const latestFailure = buildRecord({
      appliedCommandCount: 1,
      executedAt: "2026-07-23T09:05:00.000Z",
      executionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-failed",
      failedCommandCount: 2,
      status: "partial",
    })
    const normalizedSnapshot = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
      initialSnapshot: {
        records: [latestFailure, staleSuccess],
      },
    }).snapshot()
    const snapshot = {
      ...normalizedSnapshot,
      latestRun: staleSuccess,
      records: [staleSuccess, latestFailure],
    }

    const readiness = buildNonCncPromotedQuoteReleaseReadiness({ ...request, snapshot })

    expect(readiness).toMatchObject({
      appliedCommandCount: 1,
      blockerLabels: [
        "Latest persisted non-CNC application apply execution status is partial.",
        "Latest persisted non-CNC application apply execution has unapplied commands.",
      ],
      latestExecutionFingerprint: latestFailure.executionFingerprint,
      latestStatus: "partial",
      persistedRecordCount: 2,
      status: "blocked",
    })
  })

  it("marks release ready from a persisted successful apply execution without mutating the active quote", () => {
    const record = buildRecord({ warningCount: 1 })
    const snapshot = createLocalNonCncPromotedQuoteApplicationMutationApplyExecutionPersistence({
      initialSnapshot: {
        records: [record],
      },
    }).snapshot()

    const readiness = buildNonCncPromotedQuoteReleaseReadiness({ ...request, snapshot })

    expect(readiness).toMatchObject({
      appliedCommandCount: 3,
      blockerLabels: [],
      commandCount: 3,
      latestApplyPlanId: record.applyPlanId,
      latestExecutionFingerprint: record.executionFingerprint,
      latestStatus: "succeeded",
      nextOperatorMessage: "Persisted non-CNC quote promotion is ready for a future customer-release adapter.",
      persistedRecordCount: 1,
      releaseBoundary:
        "Release readiness is deterministic review data only; this helper does not mutate active RFQ quote, offer, release, or connector state.",
      reviewWarnings: ["Latest persisted apply execution has 1 warning(s)."],
      status: "ready",
    })
  })
})

function buildRecord({
  appliedCommandCount = 3,
  executedAt = request.requestedAt,
  executionFingerprint = "non-cnc-promoted-quote-application-mutation-apply-execution-succeeded",
  failedCommandCount = 0,
  status = "succeeded",
  targetRfqId = request.targetRfqId,
  warningCount = 0,
}: {
  appliedCommandCount?: number
  executedAt?: string
  executionFingerprint?: string
  failedCommandCount?: number
  status?: NonCncPromotedQuoteApplicationMutationApplyExecutionStatus
  targetRfqId?: string
  warningCount?: number
} = {}): NonCncPromotedQuoteApplicationMutationApplyExecutionRecord {
  return {
    actor: request.requestedBy,
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package",
    applicationRecordId: "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package",
    appliedCommandCount,
    applyPlanId: "non-cnc-promoted-quote-application-mutation-apply-plan:rfq-demo-204:package",
    blockedCommandCount: 0,
    commandCount: 3,
    executedAt,
    executionFingerprint,
    executionVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION,
    failedCommandCount,
    mode: "commit",
    mutationPackageId: "non-cnc-promoted-quote-application-mutation-package:rfq-demo-204:package",
    packageId: "non-cnc-quote-promotion-command-package:rfq-demo-204",
    pendingActionCount: status === "succeeded" ? 1 : 2,
    pendingCommandCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
    preparedCommandCount: 0,
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal",
    sourceExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-outcome-commit-execution-source",
    status,
    targetRfqId,
    warningCount,
  }
}
