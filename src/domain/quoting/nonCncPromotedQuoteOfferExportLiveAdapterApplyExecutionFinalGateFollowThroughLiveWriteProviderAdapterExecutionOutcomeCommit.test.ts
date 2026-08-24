import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan,
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-24T12:00:00.000Z"

describe("non-CNC final-gate provider-adapter execution outcome commits", () => {
  it("commits ready reviewed provider-adapter outcome drafts into deterministic execution audit runs", () => {
    const history = readyHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
        {
          actor,
          executedAt,
          history,
          outcomeDraft,
        },
      )

    expect(result.commitPlan).toMatchObject({
      adapterBoundaryFingerprint: "adapter-boundary-ready:fingerprint",
      adapterBoundaryId: "adapter-boundary-ready",
      blockerLabels: [],
      commandOutcomeCount: 6,
      commitRecordId: "commit-record-1",
      commitVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
      committedExecutionFingerprint: "committed-execution-1",
      executionFingerprint: outcomeDraft.executionFingerprint,
      followThroughId: "follow-through-1",
      liveWriteBoundaryFingerprint: "live-write-boundary-ready:fingerprint",
      liveWriteBoundaryId: "live-write-boundary-ready",
      nextOperatorMessage: "Commit 6 reviewed non-CNC final-gate provider-adapter execution outcomes.",
      pendingWriteIntentCount: 6,
      providerAdapterBoundaryFingerprint: "final-gate-provider-adapter-boundary:ready:fingerprint",
      providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:ready",
      providerAdapterBoundaryVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
      providerReadModelRecordId: "final-gate-live-write-provider-read-model:live-write-boundary-ready",
      readinessRecordId: "readiness-record-1",
      reviewedOutcomeCount: 5,
      status: "ready",
      targetRfqId: "rfq-900",
    })
    expect(result.commitPlan.providerAdapterExecutionOutcomeCommitBoundary).toContain(
      "deterministic review data only",
    )
    expect(result.commitPlan.commandOutcomes.map((outcome) => outcome.key)).toEqual([
      "customer_offer_provider_prepare",
      "file_export_provider_prepare",
      "release_review_provider_prepare",
      "connector_reference_provider_prepare",
      "final_gate_follow_through_provider_prepare",
      "rollback_evidence_provider_prepare",
    ])
    expect(result.executionRun).toMatchObject({
      appliedCommandCount: 6,
      mode: "commit",
      plannedCommandCount: 6,
      status: "succeeded",
      targetRfqId: "rfq-900",
    })
    expect(result.executionRun?.commands.map((command) => command.status)).toEqual([
      "applied",
      "applied",
      "applied",
      "applied",
      "applied",
      "applied",
    ])
  })

  it("blocks non-ready drafts and withholds provider outcomes", () => {
    const history = blockedHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
        {
          actor,
          executedAt,
          history,
          outcomeDraft,
        },
      )

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: expect.arrayContaining([
        "Final-gate provider-adapter execution outcome draft must be ready before commit.",
        "Final-gate provider-adapter execution outcome draft entry for Prepare customer offer provider write is not ready for commit.",
        "Missing suggested final-gate provider-adapter execution outcome for Prepare customer offer provider write.",
      ]),
      commandOutcomeCount: 0,
      commandOutcomes: [],
      pendingWriteIntentCount: 0,
      reviewedOutcomeCount: 0,
      status: "blocked",
    })
    expect(result.commitPlan.nextOperatorMessage).toContain(
      "Final-gate provider-adapter execution outcome draft must be ready",
    )
  })

  it("blocks ready drafts that do not match provider-adapter boundary history identity", () => {
    const history = readyHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )

    const mismatchedReadModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan(
        {
          history,
          outcomeDraft: {
            ...outcomeDraft,
            providerReadModelRecordId: "final-gate-live-write-provider-read-model:other",
          },
        },
      )
    expect(mismatchedReadModel).toMatchObject({
      blockerLabels: [
        "Final-gate provider-adapter execution outcome draft does not match provider-adapter boundary history: providerReadModelRecordId.",
      ],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })

    const mismatchedFingerprint =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan(
        {
          history,
          outcomeDraft: {
            ...outcomeDraft,
            providerAdapterBoundaryFingerprint: "final-gate-provider-adapter-boundary:other:fingerprint",
          },
        },
      )
    expect(mismatchedFingerprint).toMatchObject({
      blockerLabels: [
        "Final-gate provider-adapter execution outcome draft does not match provider-adapter boundary history: providerAdapterBoundaryFingerprint.",
      ],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("blocks unsupported reviewed draft versions before commit execution", () => {
    const history = readyHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
        {
          actor,
          executedAt,
          history,
          outcomeDraft: {
            ...outcomeDraft,
            draftVersion: "unsupported-final-gate-provider-adapter-execution-outcome-draft-version",
          } as unknown as NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
        },
      )

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: ["Unsupported final-gate provider-adapter execution outcome draft version."],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("blocks altered reviewed draft content that otherwise matches provider-adapter identity", () => {
    const history = readyHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
        {
          actor,
          executedAt,
          history,
          outcomeDraft: {
            ...outcomeDraft,
            commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
              index === 0 && command.suggestedOutcome
                ? {
                    ...command,
                    suggestedOutcome: {
                      ...command.suggestedOutcome,
                      externalId: "customer-offer-provider-prepare:rfq-900:forged",
                    },
                  }
                : command,
            ),
          },
        },
      )

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: [
        "Final-gate provider-adapter execution outcome draft does not match provider-adapter boundary history: commandOutcomes (customer_offer_provider_prepare).",
      ],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("blocks reordered command outcomes without passing outcomes to commit execution", () => {
    const history = readyHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )
    const reorderedDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft =
      {
        ...outcomeDraft,
        commandOutcomes: [...outcomeDraft.commandOutcomes].reverse(),
      }

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
        {
          actor,
          executedAt,
          history,
          outcomeDraft: reorderedDraft,
        },
      )

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: [
        "Final-gate provider-adapter execution outcome draft command list does not match provider-adapter execution commands.",
      ],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("blocks forged ready drafts that were not produced from dry-run execution", () => {
    const history = readyHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )
    const forgedCommitDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft =
      {
        ...outcomeDraft,
        mode: "commit",
      }

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
        {
          actor,
          executedAt,
          history,
          outcomeDraft: forgedCommitDraft,
        },
      )

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: ["Final-gate provider-adapter execution outcome commit requires a dry-run outcome draft."],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("blocks non-applied suggested outcomes as altered reviewed draft content", () => {
    const history = readyHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )
    const failedOutcomeDraft: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft =
      {
        ...outcomeDraft,
        commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
          index === 0 && command.suggestedOutcome
            ? {
                ...command,
                suggestedOutcome: {
                  ...command.suggestedOutcome,
                  message: "Provider-adapter preparation failed in fixture review.",
                  status: "failed",
                },
              }
            : command,
        ),
      }

    const result =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRun(
        {
          actor,
          executedAt,
          history,
          outcomeDraft: failedOutcomeDraft,
        },
      )

    expect(result.executionRun).toBeUndefined()
    expect(result.commitPlan).toMatchObject({
      blockerLabels: [
        "Final-gate provider-adapter execution outcome draft does not match provider-adapter boundary history: commandOutcomes (customer_offer_provider_prepare).",
      ],
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
  })

  it("clones command outcomes so draft mutations cannot alter commit plans", () => {
    const history = readyHistory()
    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        readyDryRun(history),
      )

    const commitPlan =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPlan(
        {
          history,
          outcomeDraft,
        },
      )
    outcomeDraft.commandOutcomes[0].suggestedOutcome!.externalId =
      "customer-offer-provider-prepare:rfq-900:mutated"
    outcomeDraft.commandOutcomes[0].suggestedOutcome!.warnings?.push("mutated warning")

    expect(commitPlan.commandOutcomes[0]).toMatchObject({
      externalId: expect.stringMatching(
        /^customer-offer-provider-prepare:rfq-900:non-cnc-promoted-quote-offer-export-live-adapter-final-gate-provider-adapter-execution-[a-f0-9]{32}$/,
      ),
      warnings: [],
    })
  })
})

function readyDryRun(
  history: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
    {
      actor,
      executedAt,
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
