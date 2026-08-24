import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-24T12:00:00.000Z"

describe("non-CNC final-gate provider-adapter execution outcome drafts", () => {
  it("builds deterministic applied outcomes for prepared dry-run provider-adapter executions", () => {
    const dryRun = readyDryRun()

    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        dryRun,
      )
    const suggestedOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
      command.suggestedOutcome ? [command.suggestedOutcome] : [],
    )
    const committedRun =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
        {
          actor,
          commandOutcomes: suggestedOutcomes,
          executedAt,
          history: readyHistory(),
          mode: "commit",
        },
      )

    expect(outcomeDraft).toMatchObject({
      adapterBoundaryId: "adapter-boundary-ready",
      blockedOutcomeCount: 0,
      commitRecordId: "commit-record-1",
      committedExecutionFingerprint: "committed-execution-1",
      draftVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_DRAFT_VERSION,
      executionFingerprint: dryRun.executionFingerprint,
      followThroughId: "follow-through-1",
      liveWriteBoundaryId: "live-write-boundary-ready",
      mode: "dry_run",
      pendingWriteIntentCount: 6,
      providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:ready",
      providerReadModelRecordId: "final-gate-live-write-provider-read-model:live-write-boundary-ready",
      readinessRecordId: "readiness-record-1",
      readyOutcomeCount: 6,
      reviewedOutcomeCount: 5,
      status: "ready",
      targetRfqId: "rfq-900",
    })
    expect(outcomeDraft.nextOperatorMessage).toBe(
      "Review and commit 6 final-gate provider-adapter command outcomes.",
    )
    expect(outcomeDraft.reviewWarnings).toEqual(dryRun.warnings)
    expect(outcomeDraft.providerAdapterExecutionOutcomeBoundary).toContain("customer-offer")
    expect(outcomeDraft.commandOutcomes.map((command) => [command.key, command.status, command.target])).toEqual([
      ["customer_offer_provider_prepare", "ready", "customer_offer"],
      ["file_export_provider_prepare", "ready", "file_export"],
      ["release_review_provider_prepare", "ready", "release_review"],
      ["connector_reference_provider_prepare", "ready", "connector"],
      ["final_gate_follow_through_provider_prepare", "ready", "final_gate_follow_through"],
      ["rollback_evidence_provider_prepare", "ready", "diagnostics"],
    ])
    expect(outcomeDraft.commandOutcomes.every((command) => command.evidenceFingerprints.length === 4)).toBe(true)
    expect(suggestedOutcomes).toEqual([
      {
        externalId: `customer-offer-provider-prepare:rfq-900:${dryRun.executionFingerprint}`,
        key: "customer_offer_provider_prepare",
        message: "Prepared customer-offer provider outcome from reviewed final-gate provider-adapter execution evidence.",
        status: "applied",
        warnings: [],
      },
      {
        externalId: `file-export-provider-prepare:rfq-900:${dryRun.executionFingerprint}`,
        key: "file_export_provider_prepare",
        message: "Prepared file export provider outcome from reviewed final-gate provider-adapter execution evidence.",
        status: "applied",
        warnings: [],
      },
      {
        externalId: `release-review-provider-prepare:rfq-900:${dryRun.executionFingerprint}`,
        key: "release_review_provider_prepare",
        message: "Prepared release-review provider outcome from reviewed final-gate provider-adapter execution evidence.",
        status: "applied",
        warnings: [],
      },
      {
        externalId: `connector-reference-provider-prepare:rfq-900:${dryRun.executionFingerprint}`,
        key: "connector_reference_provider_prepare",
        message: "Prepared connector provider outcome from reviewed final-gate provider-adapter execution evidence.",
        status: "applied",
        warnings: [],
      },
      {
        externalId: `final-gate-follow-through-provider-prepare:rfq-900:${dryRun.executionFingerprint}`,
        key: "final_gate_follow_through_provider_prepare",
        message: "Prepared final-gate follow-through provider outcome from reviewed provider-adapter execution evidence.",
        status: "applied",
        warnings: [],
      },
      {
        externalId: `rollback-evidence-provider-prepare:rfq-900:${dryRun.executionFingerprint}`,
        key: "rollback_evidence_provider_prepare",
        message: "Prepared rollback provider evidence outcome from reviewed final-gate provider-adapter execution evidence.",
        status: "applied",
        warnings: [],
      },
    ])
    expect(committedRun.status).toBe("succeeded")
    expect(committedRun.commands.every((command) => command.status === "applied")).toBe(true)
  })

  it("keeps blocked and committed provider-adapter executions outcome-free", () => {
    const blockedRun =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
        {
          actor,
          executedAt,
          history: blockedHistory(),
          mode: "dry_run",
        },
      )
    const committedRun =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
        {
          actor,
          commandOutcomes: readyDryRun().commands.map((command) => ({
            externalId: `external-${command.key}`,
            key: command.key,
            status: "applied",
          })),
          executedAt,
          history: readyHistory(),
          mode: "commit",
        },
      )

    const blockedDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        blockedRun,
      )
    const committedDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        committedRun,
      )

    expect(blockedDraft.status).toBe("blocked")
    expect(blockedDraft.readyOutcomeCount).toBe(0)
    expect(blockedDraft.blockedOutcomeCount).toBe(6)
    expect(blockedDraft.nextOperatorMessage).toContain(
      "Provider-adapter execution requires ready provider-adapter boundary history.",
    )
    expect(blockedDraft.providerAdapterBoundaryId).toBeUndefined()
    expect(blockedDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(blockedDraft.commandOutcomes.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(blockedDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)

    expect(committedDraft.status).toBe("blocked")
    expect(committedDraft.readyOutcomeCount).toBe(0)
    expect(committedDraft.nextOperatorMessage).toContain(
      "Final-gate provider-adapter outcome drafts must be based on a dry-run execution.",
    )
    expect(committedDraft.providerAdapterBoundaryId).toBeUndefined()
    expect(committedDraft.providerAdapterBoundaryFingerprint).toBeUndefined()
    expect(committedDraft.providerReadModelRecordId).toBeUndefined()
    expect(committedDraft.liveWriteBoundaryId).toBeUndefined()
    expect(committedDraft.liveWriteBoundaryFingerprint).toBeUndefined()
    expect(committedDraft.adapterBoundaryId).toBeUndefined()
    expect(committedDraft.adapterBoundaryFingerprint).toBeUndefined()
    expect(committedDraft.commitRecordId).toBeUndefined()
    expect(committedDraft.committedExecutionFingerprint).toBeUndefined()
    expect(committedDraft.followThroughId).toBeUndefined()
    expect(committedDraft.targetRfqId).toBeUndefined()
    expect(committedDraft.readinessRecordId).toBeUndefined()
    expect(committedDraft.commandOutcomes.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(committedDraft.commandOutcomes.every((command) => command.externalId === undefined)).toBe(true)
    expect(committedDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })

  it("blocks every provider command outcome when a prepared dry-run has partial command evidence", () => {
    const dryRun = readyDryRun()
    const partialEvidenceRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun = {
      ...dryRun,
      commands: dryRun.commands.map((command) =>
        command.key === "customer_offer_provider_prepare"
          ? {
              ...command,
              evidenceFingerprints: [],
            }
          : command,
      ),
    }

    const outcomeDraft =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        partialEvidenceRun,
      )

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.readyOutcomeCount).toBe(0)
    expect(outcomeDraft.blockedOutcomeCount).toBe(6)
    expect(outcomeDraft.nextOperatorMessage).toContain(
      "Prepare customer offer provider write is missing final-gate provider-adapter evidence fingerprints.",
    )
    expect(outcomeDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
    expect(
      outcomeDraft.commandOutcomes.find((command) => command.key === "file_export_provider_prepare")?.blockerLabels,
    ).toEqual(["Final-gate provider-adapter execution is not ready for outcome suggestions."])
  })

  it.each(["rfq A", "rfq_A", "RFQ-A", "!!!"])(
    "rejects non-canonical target RFQ id part %s instead of drafting colliding external ids",
    (targetRfqId) => {
      const dryRun = {
        ...readyDryRun(),
        targetRfqId,
      }

      expect(() =>
        buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
          dryRun,
        ),
      ).toThrow(
        "Non-CNC final-gate provider-adapter execution outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
      )
    },
  )

  it("rejects non-canonical execution fingerprints before drafting external ids", () => {
    const dryRun: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun = {
      ...readyDryRun(),
      executionFingerprint: "non canonical fingerprint",
    }

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeDraft(
        dryRun,
      ),
    ).toThrow(
      "Non-CNC final-gate provider-adapter execution outcome ids require canonical lowercase alphanumeric id parts separated by single hyphens.",
    )
  })
})

function readyDryRun(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
    {
      actor,
      executedAt,
      history: readyHistory(),
      mode: "dry_run",
    },
  )
}

function readyHistory() {
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

function blockedHistory() {
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
