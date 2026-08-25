import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-24T12:00:00.000Z"
const recordedAt = "2026-08-24T12:10:00.000Z"

describe("non-CNC final-gate provider-adapter execution outcome commit persistence", () => {
  it("records ready provider-adapter outcome commits into clone-safe local snapshots", async () => {
    const { commitPlan, executionRun } = readyCommitResult()
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence()

    const snapshot = await persistence.recordCommit({
      commitPlan,
      executionRun,
      recordedAt,
      recordedBy: actor,
    })

    const commitRecordId = `non-cnc-final-gate-provider-adapter-execution-outcome-commit:${commitPlan.executionFingerprint}`
    expect(snapshot.persistenceVersion).toBe(
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    )
    expect(snapshot).toMatchObject({
      blockedCommitRecordIds: [],
      commandOutcomeCount: 6,
      commandStatusCounts: { applied: 6 },
      commitReadyRecordIds: [commitRecordId],
      externalIds: expect.arrayContaining([
        expect.stringMatching(/^customer-offer-provider-prepare:rfq-900:/),
        expect.stringMatching(/^rollback-evidence-provider-prepare:rfq-900:/),
      ]),
      latestRecord: {
        commandOutcomeCount: 6,
        disposition: "provider_adapter_commit_ready",
        providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:ready",
        providerAdapterExecutionFingerprint: executionRun!.executionFingerprint,
        providerAdapterExecutionStatus: "succeeded",
        status: "ready",
        targetRfqId: "rfq-900",
      },
      providerAdapterBoundaryIds: ["final-gate-provider-adapter-boundary:ready"],
      providerAdapterExecutionFingerprints: [executionRun!.executionFingerprint],
      providerReadModelRecordIds: ["final-gate-live-write-provider-read-model:live-write-boundary-ready"],
      recordCount: 1,
      reviewedOutcomeCount: 5,
      statusCounts: { ready: 1 },
    })
    expect(snapshot.commandIdempotencyKeys).toHaveLength(6)
    expect(snapshot.evidenceFingerprints).toContain("commit-record-1")

    snapshot.records[0]!.reviewWarnings.push("mutated warning")
    snapshot.latestRecord!.targetRfqId = "mutated-rfq"
    snapshot.externalIds.push("mutated-external")
    const restored = persistence.snapshot()
    expect(restored.records[0]?.reviewWarnings).toEqual(["Review provider rollback evidence."])
    expect(restored.latestRecord?.targetRfqId).toBe("rfq-900")
    expect(restored.externalIds).not.toContain("mutated-external")
  })

  it("records blocked provider-adapter outcome commits without provider evidence identifiers", async () => {
    const { commitPlan } = blockedCommitResult()
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence()

    const snapshot = await persistence.recordCommit({
      commitPlan,
      recordedAt,
      recordedBy: actor,
    })

    expect(snapshot).toMatchObject({
      blockedCommitRecordIds: [
        `non-cnc-final-gate-provider-adapter-execution-outcome-commit:${commitPlan.executionFingerprint}`,
      ],
      blockerCount: commitPlan.blockerLabels.length,
      commandIdempotencyKeys: [],
      commandOutcomeCount: 0,
      commandOutcomeKeys: [],
      commitReadyRecordIds: [],
      evidenceFingerprints: [],
      externalIds: [],
      providerAdapterBoundaryIds: [],
      providerAdapterExecutionFingerprints: [],
      providerReadModelRecordIds: [],
      recordCount: 1,
      statusCounts: { blocked: 1 },
      targetRfqIds: [],
    })
  })

  it("records later-blocked provider-adapter outcome commits with zeroed draft fields", async () => {
    const history = readyHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )
    const { commitPlan, executionRun } =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
        {
          actor,
          executedAt,
          history,
          outcomeDraft: {
            ...outcomeDraft,
            mode: "commit",
          },
        },
      )
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence()

    const snapshot = await persistence.recordCommit({
      commitPlan,
      recordedAt,
      recordedBy: actor,
    })

    expect(executionRun).toBeUndefined()
    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      pendingWriteIntentCount: 0,
      reviewedOutcomeCount: 0,
      status: "blocked",
    })
    expect(snapshot).toMatchObject({
      commandOutcomeCount: 0,
      latestRecord: {
        commandOutcomeCount: 0,
        pendingWriteIntentCount: 0,
        reviewedOutcomeCount: 0,
        status: "blocked",
      },
      pendingWriteIntentCount: 0,
      reviewedOutcomeCount: 0,
      statusCounts: { blocked: 1 },
    })
  })

  it("rejects ready plans without matching provider-adapter commit execution runs", async () => {
    const { commitPlan, executionRun } = readyCommitResult()
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence()

    await expect(persistence.recordCommit({ commitPlan, recordedAt, recordedBy: actor })).rejects.toThrow(
      "ready final-gate provider-adapter execution outcome commit plans require a commit execution run",
    )
    await expect(
      persistence.recordCommit({
        commitPlan,
        executionRun: {
          ...executionRun!,
          providerReadModelRecordId: "final-gate-live-write-provider-read-model:other",
        },
        recordedAt,
        recordedBy: actor,
      }),
    ).rejects.toThrow("providerReadModelRecordId")
    await expect(
      persistence.recordCommit({
        commitPlan,
        executionRun: {
          ...executionRun!,
          executionFingerprint: `${executionRun!.executionFingerprint}-forged`,
        },
        recordedAt,
        recordedBy: actor,
      }),
    ).rejects.toThrow("providerAdapterExecutionFingerprint")
  })

  it("normalizes seeded snapshots and keeps newest records for a commit record id", async () => {
    const { commitPlan, executionRun } = readyCommitResult()
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence()
    const oldRecord = (await persistence.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-08-24T12:05:00+00:00",
      recordedBy: "Earlier Operator",
    })).records[0]!
    const newRecord = {
      ...oldRecord,
      recordedAt,
      recordedBy: actor,
    }

    const snapshot =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence({
        initialSnapshot: { records: [newRecord, oldRecord, { ...newRecord }] },
      }).snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.latestRecord).toMatchObject({
      recordedAt,
      recordedBy: actor,
    })
  })

  it("rejects conflicting seeded records with the same id and timestamp", async () => {
    const { commitPlan, executionRun } = readyCommitResult()
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence()
    const record = (await persistence.recordCommit({
      commitPlan,
      executionRun,
      recordedAt,
      recordedBy: actor,
    })).records[0]!

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            record,
            {
              ...record,
              reviewWarnings: ["Conflicting warning."],
            },
          ],
        },
      }),
    ).toThrow(
      "conflicting final-gate provider-adapter execution outcome commit records cannot share providerAdapterExecutionOutcomeCommitRecordId and recordedAt",
    )
  })

  it("rejects malformed blocked seeded records that expose provider evidence", async () => {
    const { commitPlan } = blockedCommitResult()
    const persistence =
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence()
    const blockedRecord = (await persistence.recordCommit({
      commitPlan,
      recordedAt,
      recordedBy: actor,
    })).records[0]!

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...blockedRecord,
              commandIdempotencyKeys: ["provider-adapter-ready:forged"],
              providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:forged",
            },
          ],
        },
      }),
    ).toThrow("blocked final-gate provider-adapter execution outcome commit records cannot include provider evidence identifiers")
  })
})

function readyCommitResult() {
  const history = readyHistory()
  const outcomeDraft =
    buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
      readyDryRun(history),
    )
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
    {
      actor,
      executedAt,
      history,
      outcomeDraft,
    },
  )
}

function blockedCommitResult() {
  const history = blockedHistory()
  const outcomeDraft =
    buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
      readyDryRun(history),
    )
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
    {
      actor,
      executedAt,
      history,
      outcomeDraft,
    },
  )
}

function readyDryRun(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
    {
      actor,
      executedAt: history.latestRecord?.requestedAt ?? executedAt,
      history,
      mode: "dry_run",
    },
  )
}

function readyHistory(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence(
      {
        initialSnapshot: {
          records: [readyRecord()],
        },
      },
    ).snapshot(),
  )
}

function blockedHistory(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence(
      {
        initialSnapshot: {
          records: [blockedRecord()],
        },
      },
    ).snapshot(),
  )
}

function readyRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  return {
    adapterBoundaryFingerprint: "adapter-boundary-ready:fingerprint",
    adapterBoundaryId: "adapter-boundary-ready",
    blockedCommandCount: 0,
    blockedReadModelCount: 0,
    blockerCount: 0,
    blockerLabels: [],
    commandCount: 6,
    commandIdempotencyKeys: [
      "provider-adapter-ready:connector_reference_follow_through",
      "provider-adapter-ready:customer_offer_follow_through",
      "provider-adapter-ready:file_export_follow_through",
      "provider-adapter-ready:final_gate_follow_through",
      "provider-adapter-ready:release_review_follow_through",
      "provider-adapter-ready:rollback_evidence_follow_through",
    ],
    commandStatuses: [
      "planned",
      "planned",
      "planned",
      "planned",
      "planned",
      "planned",
    ],
    committedExecutionFingerprint: "committed-execution-1",
    commitRecordId: "commit-record-1",
    disposition: "provider_adapter_ready",
    evidenceFingerprints: [
      "adapter-boundary-ready:fingerprint",
      "commit-record-1",
      "committed-execution-1",
      "live-write-boundary-ready:fingerprint",
    ],
    followThroughId: "follow-through-1",
    liveWriteBoundaryFingerprint: "live-write-boundary-ready:fingerprint",
    liveWriteBoundaryId: "live-write-boundary-ready",
    nextActionCount: 1,
    nextActionLabels: ["Review provider-preparation command descriptors before enabling live writes."],
    operatorSummary: "Review 6 provider-preparation command descriptors before enabling live writes.",
    pendingWriteIntentCount: 6,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: 6,
    providerAdapterBoundaryFingerprint: "final-gate-provider-adapter-boundary:ready:fingerprint",
    providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:ready",
    providerAdapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    providerBoundary:
      "Final-gate follow-through provider-adapter boundaries are deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until an explicit provider adapter is enabled.",
    providerReadyCount: 1,
    providerReadModelRecordId: "final-gate-live-write-provider-read-model:live-write-boundary-ready",
    readinessRecordId: "readiness-record-1",
    recordedAt: "2026-08-22T11:15:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-22T10:30:00Z",
    requestedBy: "Sari",
    reviewedOutcomeCount: 5,
    reviewWarnings: ["Review provider rollback evidence."],
    sourceCommandIdempotencyKeys: [
      "source:connector_reference_follow_through",
      "source:customer_offer_follow_through",
      "source:file_export_follow_through",
      "source:final_gate_follow_through",
      "source:release_review_follow_through",
      "source:rollback_evidence_follow_through",
    ],
    sourceHistoryStatus: "ready_to_prepare",
    status: "ready",
    targetRfqId: "rfq-900",
    totalRecords: 1,
    warningCount: 1,
  }
}

function blockedRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
  return {
    adapterBoundaryFingerprint: undefined,
    adapterBoundaryId: undefined,
    blockedCommandCount: 6,
    blockedReadModelCount: 1,
    blockerCount: 1,
    blockerLabels: ["Provider-adapter boundary requires a ready provider read-model history record."],
    commandCount: 6,
    commandIdempotencyKeys: [],
    commandStatuses: [
      "blocked",
      "blocked",
      "blocked",
      "blocked",
      "blocked",
      "blocked",
    ],
    committedExecutionFingerprint: undefined,
    commitRecordId: undefined,
    disposition: "review_only",
    evidenceFingerprints: [],
    followThroughId: undefined,
    liveWriteBoundaryFingerprint: undefined,
    liveWriteBoundaryId: undefined,
    nextActionCount: 1,
    nextActionLabels: ["Resolve provider-adapter boundary blockers before enabling live writes."],
    operatorSummary: "Provider-adapter boundary requires ready provider read-model evidence.",
    pendingWriteIntentCount: 0,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
    plannedCommandCount: 0,
    providerAdapterBoundaryFingerprint: "final-gate-provider-adapter-boundary:blocked:fingerprint",
    providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:blocked",
    providerAdapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    providerBoundary:
      "Final-gate follow-through provider-adapter boundaries are deterministic review data only; customer-offer, file, release-review, export, connector, and final-gate follow-through writes stay disabled until an explicit provider adapter is enabled.",
    providerReadyCount: 0,
    providerReadModelRecordId: undefined,
    readinessRecordId: undefined,
    recordedAt: "2026-08-22T10:45:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-22T10:30:00Z",
    requestedBy: "Sari",
    reviewedOutcomeCount: 0,
    reviewWarnings: [],
    sourceCommandIdempotencyKeys: [],
    sourceHistoryStatus: "blocked",
    status: "blocked",
    targetRfqId: undefined,
    totalRecords: 0,
    warningCount: 0,
  }
}
