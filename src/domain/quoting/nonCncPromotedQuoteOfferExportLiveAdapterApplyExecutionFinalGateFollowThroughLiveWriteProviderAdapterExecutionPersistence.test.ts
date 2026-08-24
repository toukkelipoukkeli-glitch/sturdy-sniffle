import { describe, expect, it } from "vitest"

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
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-24T14:30:00.000Z"

describe("non-CNC final-gate provider-adapter execution persistence", () => {
  it("records prepared dry-run executions with provider evidence aggregates", async () => {
    const run = preparedRun()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      commandCount: 6,
      commandStatusCounts: { prepared: 6 },
      evidenceFingerprints: [
        "adapter-boundary-ready:fingerprint",
        "commit-record-1",
        "committed-execution-1",
        "live-write-boundary-ready:fingerprint",
      ],
      pendingWriteIntentCount: 6,
      plannedCommandCount: 6,
      providerAdapterBoundaryIds: ["final-gate-provider-adapter-boundary:ready"],
      recordCount: 1,
      statusCounts: { prepared: 1 },
      targetRfqIds: ["RFQ-900"],
    })
    expect(snapshot.latestRun).toMatchObject({
      executionFingerprint: run.executionFingerprint,
      persistenceVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
      preparedCommandCount: 6,
      status: "prepared",
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
  })

  it("records blocked executions while withholding provider identifiers", async () => {
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
      actor,
      executedAt,
      history: historySummary([blockedBoundaryRecord()]),
      mode: "commit",
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      commandIdempotencyKeys: [],
      commandStatusCounts: { blocked: 6 },
      evidenceFingerprints: [],
      externalIds: [],
      providerAdapterBoundaryIds: [],
      recordCount: 1,
      statusCounts: { blocked: 1 },
      targetRfqIds: [],
    })
    expect(snapshot.latestRun).toMatchObject({
      blockedCommandCount: 6,
      providerAdapterBoundaryId: undefined,
      providerReadModelRecordId: undefined,
      readinessRecordId: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
  })

  it("aggregates commit outcome statuses deterministically", async () => {
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
      actor,
      commandOutcomes: [
        { externalId: "customer-offer-draft-1", key: "customer_offer_provider_prepare", status: "applied" },
        { key: "file_export_provider_prepare", message: "File adapter disabled.", status: "failed" },
      ],
      executedAt,
      history: readyHistory(),
      mode: "commit",
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      commandStatusCounts: { applied: 1, failed: 1, pending: 4 },
      externalIds: ["customer-offer-draft-1"],
      failedCommandCount: 1,
      nextActionCount: 5,
      pendingCommandCount: 4,
      statusCounts: { partial: 1 },
      warningCount: 2,
    })
    expect(snapshot.latestRun).toMatchObject({
      appliedCommandCount: 1,
      failedCommandCount: 1,
      pendingCommandCount: 4,
      status: "partial",
    })
  })

  it("deduplicates repeated recordRun writes by execution fingerprint", async () => {
    const run = preparedRun()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence()

    await adapter.recordRun(run)
    const snapshot = await adapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.records[0]?.executionFingerprint).toBe(run.executionFingerprint)
  })

  it("rejects conflicting seeded records sharing an execution fingerprint", async () => {
    const seededRecord = await seedPreparedRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence({
        initialSnapshot: {
          records: [
            seededRecord,
            {
              ...seededRecord,
              actor: "Conflicting Operator",
            },
          ],
        },
      }),
    ).toThrow("conflicting final-gate follow-through provider-adapter execution records cannot share executionFingerprint")
  })

  it("returns cloned execution snapshots", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence()
    const snapshot = await adapter.recordRun(preparedRun())
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.latestRun!.commandIdempotencyKeys.push("mutated-key")
    snapshot.statusCounts.prepared = 99

    const restored = adapter.snapshot()

    expect(restored.recordCount).toBe(1)
    expect(restored.records[0]?.actor).toBe(actor)
    expect(restored.latestRun?.commandIdempotencyKeys).not.toContain("mutated-key")
    expect(restored.statusCounts).toEqual({ prepared: 1 })
  })

  it("rejects seeded records with inconsistent command counts", async () => {
    const seededRecord = await seedPreparedRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 5 }],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status final-gate provider-adapter execution command counts")
  })

  it("rejects blocked seeded records with provider evidence identifiers", async () => {
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
      actor,
      executedAt,
      history: historySummary([blockedBoundaryRecord()]),
      mode: "commit",
    })
    const blockedRecord = (
      await createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence().recordRun(
        run,
      )
    ).records[0]
    if (!blockedRecord) {
      throw new Error("Expected blocked provider-adapter execution record")
    }

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...blockedRecord,
              providerAdapterBoundaryId: "forged-provider-adapter-boundary",
            },
          ],
        },
      }),
    ).toThrow("blocked final-gate provider-adapter execution records cannot include provider evidence identifiers")
  })
})

async function seedPreparedRecord(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRecord> {
  const record = (
    await createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionPersistence().recordRun(
      preparedRun(),
    )
  ).records[0]
  if (!record) {
    throw new Error("Expected prepared provider-adapter execution record")
  }
  return record
}

function preparedRun() {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
    actor,
    executedAt,
    history: readyHistory(),
    mode: "dry_run",
  })
}

function readyHistory() {
  return historySummary([readyBoundaryRecord()])
}

function historySummary(records: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord[]) {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence({
      initialSnapshot: { records },
    }).snapshot(),
  )
}

function readyBoundaryRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
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
    recordedAt: "2026-08-24T11:00:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-24T10:30:00Z",
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
    targetRfqId: "RFQ-900",
    totalRecords: 1,
    warningCount: 1,
  }
}

function blockedBoundaryRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryRecord {
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
    recordedAt: "2026-08-24T10:45:00Z",
    recordedBy: "Sari",
    requestedAt: "2026-08-24T10:30:00Z",
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
