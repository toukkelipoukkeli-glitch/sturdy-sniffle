import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundary"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence"

describe("non-CNC final-gate provider-adapter execution outcome commit read model", () => {
  it("blocks empty provider-adapter outcome commit history without live evidence", () => {
    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel({
        snapshot: snapshot(),
      })

    expect(readModel).toMatchObject({
      blockedCount: 0,
      blockerCount: 0,
      blockerLabels: ["No final-gate provider-adapter execution outcome commit record is available."],
      commandIdempotencyKeys: [],
      commandOutcomeCount: 0,
      commandOutcomeKeys: [],
      commandOutcomeStatuses: [],
      committedCount: 0,
      evidenceFingerprints: [],
      externalIds: [],
      liveWriteTargets: [],
      pendingWriteIntentCount: 0,
      readModelVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_READ_MODEL_VERSION,
      reviewedOutcomeCount: 0,
      status: "blocked",
      totalRecords: 0,
      warningCount: 0,
    })
    expect(readModel.liveWriteBoundary).toContain("live customer-offer, file, release-review, export, connector")
  })

  it("exposes ready live-write planning evidence for indexed provider-adapter outcome commits", () => {
    const record = readyRecord()
    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel({
        snapshot: snapshot(record),
      })

    expect(readModel).toMatchObject({
      adapterBoundaryFingerprint: "adapter-boundary-ready:fingerprint",
      adapterBoundaryId: "adapter-boundary-ready",
      blockedCount: 0,
      blockerLabels: [],
      commandOutcomeCount: 6,
      committedCount: 1,
      committedExecutionFingerprint: "committed-execution-ready",
      commitRecordId: "commit-record-ready",
      executionFingerprint: record.executionFingerprint,
      followThroughId: "follow-through-ready",
      liveWriteBoundaryFingerprint: "live-write-boundary-ready:fingerprint",
      liveWriteBoundaryId: "live-write-boundary-ready",
      pendingWriteIntentCount: 6,
      providerAdapterBoundaryFingerprint: "final-gate-provider-adapter-boundary:ready:fingerprint",
      providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:ready",
      providerAdapterExecutionFingerprint: "provider-adapter-execution-ready:fingerprint",
      providerAdapterExecutionOutcomeCommitRecordId: record.providerAdapterExecutionOutcomeCommitRecordId,
      providerAdapterExecutionStatus: "succeeded",
      providerReadModelRecordId: "final-gate-live-write-provider-read-model:ready",
      readinessRecordId: "readiness-record-ready",
      reviewedOutcomeCount: 5,
      reviewWarnings: ["Review provider rollback evidence."],
      status: "ready_for_live_writes",
      targetRfqId: "rfq-900",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(readModel.commandIdempotencyKeys).toHaveLength(6)
    expect(readModel.evidenceFingerprints).toEqual([
      "adapter-boundary-ready:fingerprint",
      "commit-record-ready",
      "committed-execution-ready",
      "final-gate-provider-adapter-boundary:ready:fingerprint",
      "provider-adapter-execution-ready:fingerprint",
    ])
    expect(readModel.externalIds).toHaveLength(6)
    expect(readModel.liveWriteTargets).toEqual([
      "connector_reference",
      "customer_offer",
      "file_export",
      "final_gate_follow_through",
      "release_review",
      "rollback_evidence",
    ])
    expect(readModel.nextOperatorMessage).toBe(
      "Reviewed final-gate provider-adapter execution outcome commits are ready for guarded live-write planning.",
    )
  })

  it("withholds live-write evidence for blocked provider-adapter outcome commits", () => {
    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel({
        snapshot: snapshot(blockedRecord()),
      })

    expect(readModel).toMatchObject({
      commandIdempotencyKeys: [],
      commandOutcomeKeys: [],
      commandOutcomeStatuses: [],
      evidenceFingerprints: [],
      externalIds: [],
      liveWriteTargets: [],
      status: "blocked",
    })
    expect(readModel.providerAdapterExecutionOutcomeCommitRecordId).toBeUndefined()
    expect(readModel.providerAdapterExecutionFingerprint).toBeUndefined()
    expect(readModel.providerAdapterBoundaryId).toBeUndefined()
    expect(readModel.targetRfqId).toBeUndefined()
    expect(readModel.blockerLabels).toEqual(
      expect.arrayContaining([
        "Final-gate provider-adapter execution outcome commit record is blocked.",
        "Final-gate provider-adapter execution outcome commit record is review-only.",
        "Final-gate provider-adapter execution outcome commit has no command outcomes.",
        "Provider-adapter outcome draft is blocked in fixture review.",
      ]),
    )
  })

  it("blocks ready-looking provider-adapter outcome commits whose indexes are stale", () => {
    const validSnapshot = snapshot(readyRecord())
    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel({
        snapshot: {
          ...validSnapshot,
          externalIds: [],
          providerAdapterBoundaryIds: [],
          providerAdapterExecutionFingerprints: [],
        },
      })

    expect(readModel).toMatchObject({
      commandIdempotencyKeys: [],
      evidenceFingerprints: [],
      externalIds: [],
      liveWriteTargets: [],
      status: "blocked",
    })
    expect(readModel.blockerLabels).toEqual(
      expect.arrayContaining([
        "Final-gate provider-adapter execution outcome commit provider-adapter commit execution fingerprint is missing from the snapshot index.",
        "Final-gate provider-adapter execution outcome commit provider-adapter boundary is missing from the snapshot index.",
        "Final-gate provider-adapter execution outcome commit external ID evidence is missing from the snapshot index.",
      ]),
    )
  })

  it("blocks provider-adapter outcome commits that are indexed as both ready and blocked", () => {
    const validSnapshot = snapshot(readyRecord())
    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel({
        snapshot: {
          ...validSnapshot,
          blockedCommitRecordIds: [...validSnapshot.commitReadyRecordIds],
        },
      })

    expect(readModel).toMatchObject({
      commandIdempotencyKeys: [],
      commandOutcomeKeys: [],
      evidenceFingerprints: [],
      externalIds: [],
      liveWriteTargets: [],
      status: "blocked",
    })
    expect(readModel.providerAdapterExecutionOutcomeCommitRecordId).toBeUndefined()
    expect(readModel.blockerLabels).toContain(
      "Final-gate provider-adapter execution outcome commit provider-adapter execution outcome commit record is present in the blocked snapshot index.",
    )
  })

  it("selects the latest matching target RFQ while ignoring newer unrelated records", () => {
    const olderMatch = readyRecord({
      recordedAt: "2026-08-24T12:00:00Z",
      suffix: "older-match",
      targetRfqId: "rfq-901",
    })
    const newerUnrelated = readyRecord({
      recordedAt: "2026-08-24T12:10:00Z",
      suffix: "newer-unrelated",
      targetRfqId: "rfq-902",
    })
    const readModel =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitReadModel({
        snapshot: snapshot([olderMatch, newerUnrelated]),
        targetRfqId: "rfq-901",
      })

    expect(readModel).toMatchObject({
      providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:older-match",
      status: "ready_for_live_writes",
      targetRfqId: "rfq-901",
    })
  })
})

function snapshot(
  records?:
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord
    | NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord[],
) {
  return createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitPersistence({
    initialSnapshot: records
      ? {
          records: Array.isArray(records) ? records : [records],
        }
      : undefined,
  }).snapshot()
}

function readyRecord({
  recordedAt = "2026-08-24T12:10:00Z",
  suffix = "ready",
  targetRfqId = "rfq-900",
}: {
  recordedAt?: string
  suffix?: string
  targetRfqId?: string
} = {}): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord {
  const executionFingerprint = `provider-adapter-outcome-draft-execution:${suffix}`
  const providerAdapterExecutionOutcomeCommitRecordId =
    `non-cnc-final-gate-provider-adapter-execution-outcome-commit:${executionFingerprint}`
  const commandOutcomeKeys = [
    "customer_offer_provider_prepare",
    "file_export_provider_prepare",
    "release_review_provider_prepare",
    "connector_reference_provider_prepare",
    "final_gate_follow_through_provider_prepare",
    "rollback_evidence_provider_prepare",
  ]

  return {
    adapterBoundaryFingerprint: `adapter-boundary-${suffix}:fingerprint`,
    adapterBoundaryId: `adapter-boundary-${suffix}`,
    blockerCount: 0,
    blockerLabels: [],
    commandIdempotencyKeys: commandOutcomeKeys.map((key) => `provider-adapter-${suffix}:${key}`),
    commandOutcomeCount: commandOutcomeKeys.length,
    commandOutcomeKeys,
    commandOutcomeStatuses: ["applied", "applied", "applied", "applied", "applied", "applied"],
    committedExecutionFingerprint: `committed-execution-${suffix}`,
    commitRecordId: `commit-record-${suffix}`,
    commitVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
    disposition: "provider_adapter_commit_ready",
    evidenceFingerprints: [
      `adapter-boundary-${suffix}:fingerprint`,
      `commit-record-${suffix}`,
      `committed-execution-${suffix}`,
      `final-gate-provider-adapter-boundary:${suffix}:fingerprint`,
      `provider-adapter-execution-${suffix}:fingerprint`,
    ],
    executionFingerprint,
    externalIds: commandOutcomeKeys.map((key) => `${key.replaceAll("_", "-")}:${targetRfqId}:${suffix}`),
    followThroughId: `follow-through-${suffix}`,
    liveWriteBoundaryFingerprint: `live-write-boundary-${suffix}:fingerprint`,
    liveWriteBoundaryId: `live-write-boundary-${suffix}`,
    pendingWriteIntentCount: 6,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    providerAdapterBoundaryFingerprint: `final-gate-provider-adapter-boundary:${suffix}:fingerprint`,
    providerAdapterBoundaryId: `final-gate-provider-adapter-boundary:${suffix}`,
    providerAdapterBoundaryVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    providerAdapterExecutionFingerprint: `provider-adapter-execution-${suffix}:fingerprint`,
    providerAdapterExecutionOutcomeCommitRecordId,
    providerAdapterExecutionStatus: "succeeded",
    providerAdapterExecutionVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
    providerReadModelRecordId: `final-gate-live-write-provider-read-model:${suffix}`,
    readinessRecordId: `readiness-record-${suffix}`,
    recordedAt,
    recordedBy: "FactoryBid Operator",
    reviewedOutcomeCount: 5,
    reviewWarnings: ["Review provider rollback evidence."],
    status: "ready",
    targetRfqId,
    warningCount: 1,
  }
}

function blockedRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionOutcomeCommitRecord {
  const executionFingerprint = "provider-adapter-outcome-draft-execution:blocked"

  return {
    blockerCount: 1,
    blockerLabels: ["Provider-adapter outcome draft is blocked in fixture review."],
    commandIdempotencyKeys: [],
    commandOutcomeCount: 0,
    commandOutcomeKeys: [],
    commandOutcomeStatuses: [],
    commitVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_VERSION,
    disposition: "review_only",
    evidenceFingerprints: [],
    executionFingerprint,
    externalIds: [],
    pendingWriteIntentCount: 0,
    persistenceVersion:
      NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    providerAdapterExecutionOutcomeCommitRecordId:
      `non-cnc-final-gate-provider-adapter-execution-outcome-commit:${executionFingerprint}`,
    recordedAt: "2026-08-24T12:05:00Z",
    recordedBy: "FactoryBid Operator",
    reviewedOutcomeCount: 0,
    reviewWarnings: [],
    status: "blocked",
    warningCount: 0,
  }
}
