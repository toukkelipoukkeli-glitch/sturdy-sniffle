import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecution"
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

describe("non-CNC final-gate provider-adapter execution audit", () => {
  it("blocks empty provider-adapter history without exposing live evidence", () => {
    const history =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterBoundaryPersistence().snapshot(),
      )

    const run =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        executedAt,
        history,
        mode: "commit",
      })

    expect(run).toMatchObject({
      appliedCommandCount: 0,
      blockedCommandCount: 6,
      blockedRecordCount: 0,
      commandCount: 6,
      executionVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_LIVE_WRITE_PROVIDER_ADAPTER_EXECUTION_VERSION,
      historyRecordCount: 0,
      mode: "commit",
      pendingWriteIntentCount: 0,
      plannedCommandCount: 0,
      providerAdapterBoundaryId: undefined,
      providerReadModelRecordId: undefined,
      readyRecordCount: 0,
      reviewedOutcomeCount: 0,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(run.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(run.commands.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(run.commands.every((command) => command.idempotencyKey === undefined)).toBe(true)
    expect(run.nextActions).toContain(
      "Resolve final-gate provider-adapter blockers before recording execution outcomes.",
    )
    expect(run.providerAdapterExecutionBoundary).toContain("does not create customer offers")
    expect(
      fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun(
        run,
      ),
    ).toBe(run.executionFingerprint)
  })

  it("prepares ready provider-adapter commands in dry-run mode", () => {
    const history = readyHistory()

    const run =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        executedAt,
        history,
        mode: "dry_run",
      })

    expect(run).toMatchObject({
      appliedCommandCount: 0,
      blockedCommandCount: 0,
      commandCount: 6,
      commitRecordId: "commit-record-1",
      committedExecutionFingerprint: "committed-execution-1",
      liveWriteBoundaryId: "live-write-boundary-ready",
      mode: "dry_run",
      pendingWriteIntentCount: 6,
      plannedCommandCount: 6,
      providerAdapterBoundaryId: "final-gate-provider-adapter-boundary:ready",
      providerReadModelRecordId: "final-gate-live-write-provider-read-model:live-write-boundary-ready",
      readinessRecordId: "readiness-record-1",
      reviewedOutcomeCount: 5,
      status: "prepared",
      targetRfqId: "RFQ-900",
    })
    expect(run.commands.every((command) => command.status === "prepared")).toBe(true)
    expect(run.commands.every((command) => command.evidenceFingerprints.length > 0)).toBe(true)
    expect(run.commands.every((command) => command.idempotencyKey?.startsWith("provider-adapter-ready:"))).toBe(true)
    expect(run.commands.every((command) => command.externalId === undefined)).toBe(true)
    expect(run.nextActions).toEqual(["Review 6 prepared provider-adapter commands before committing."])
  })

  it("records deterministic commit outcomes while preserving pending and failed command actions", () => {
    const history = readyHistory()
    const [first, second, ...remainingCommands] =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        executedAt,
        history,
        mode: "dry_run",
      }).commands

    const run =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        commandOutcomes: [
          {
            externalId: " customer-offer-provider-900 ",
            key: first!.key,
            status: "applied",
            warnings: [" copied to local provider audit ", "copied to local provider audit"],
          },
          {
            key: second!.key,
            message: "Provider artifact checksum did not match.",
            status: "failed",
          },
        ],
        executedAt,
        history,
        mode: "commit",
      })

    expect(run.status).toBe("partial")
    expect(run.commands.map((command) => command.status)).toEqual([
      "applied",
      "failed",
      "pending",
      "pending",
      "pending",
      "pending",
    ])
    expect(run.appliedCommandCount).toBe(1)
    expect(run.plannedCommandCount).toBe(6)
    expect(run.commands[0]?.externalId).toBe("customer-offer-provider-900")
    expect(run.commands[0]?.warnings).toEqual(["copied to local provider audit"])
    expect(run.commands[1]?.message).toBe("Provider artifact checksum did not match.")
    expect(run.nextActions).toEqual([
      `Resolve failed provider-adapter command: ${second!.label}.`,
      ...remainingCommands.map((command) => `Record provider-adapter outcome for command: ${command.label}.`),
    ])
    expect(run.warnings).toContain(`${first!.label}: copied to local provider audit`)
    expect(run.warnings).toContain(`${second!.label} failed: Provider artifact checksum did not match.`)
  })

  it("marks complete applied outcomes as succeeded", () => {
    const history = readyHistory()
    const prepared =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        executedAt,
        history,
        mode: "dry_run",
      })

    const run =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        commandOutcomes: prepared.commands.map((command) => ({
          externalId: `external-${command.key}`,
          key: command.key,
          status: "applied",
        })),
        executedAt,
        history,
        mode: "commit",
      })

    expect(run.status).toBe("succeeded")
    expect(run.appliedCommandCount).toBe(6)
    expect(run.commands.every((command) => command.status === "applied")).toBe(true)
    expect(run.nextActions).toEqual([
      "Review the recorded provider-adapter execution audit before enabling live provider adapters.",
    ])
  })

  it("rejects impossible command outcomes", () => {
    const history = readyHistory()
    const key = "customer_offer_provider_prepare"

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        commandOutcomes: [{ key, status: "applied" }],
        executedAt,
        history,
        mode: "dry_run",
      }),
    ).toThrow("cannot be recorded for a dry-run provider-adapter execution")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        commandOutcomes: [{ key: "unknown_command", status: "applied" }],
        executedAt,
        history,
        mode: "commit",
      }),
    ).toThrow("does not match a final-gate provider-adapter command")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        commandOutcomes: [{ key, status: "applied" }],
        executedAt,
        history: blockedHistory(),
        mode: "commit",
      }),
    ).toThrow("cannot be recorded for a blocked provider-adapter execution")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        commandOutcomes: [
          { key, status: "applied" },
          { key, status: "failed" },
        ],
        executedAt,
        history,
        mode: "commit",
      }),
    ).toThrow(`duplicate command outcome ${key}`)
  })

  it("blocks stale history indexes and withholds older provider evidence", () => {
    const history = readyHistory()
    history.readyBoundaryIds = []
    history.commandIdempotencyKeys = []

    const run =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        executedAt,
        history,
        mode: "commit",
      })

    expect(run.status).toBe("blocked")
    expect(run.providerAdapterBoundaryId).toBeUndefined()
    expect(run.commands.every((command) => command.idempotencyKey === undefined)).toBe(true)
    expect(run.nextActions).toContain(
      "Latest provider-adapter boundary must be present in the ready boundary history index.",
    )
    expect(run.nextActions).toContain(
      "Latest provider-adapter command idempotency keys must be present in the history index.",
    )
  })

  it("keeps fingerprints stable for reordered outcomes and returns cloned command data", () => {
    const history = readyHistory()
    const prepared =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        executedAt,
        history,
        mode: "dry_run",
      })
    const outcomes = prepared.commands.map((command) => ({
      externalId: `external-${command.key}`,
      key: command.key,
      status: "applied" as const,
    }))

    const run =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        commandOutcomes: outcomes,
        executedAt,
        history,
        mode: "commit",
      })
    run.commands[0]!.evidenceFingerprints.push("mutated evidence")
    run.commands[0]!.warnings.push("mutated warning")

    const reordered =
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughLiveWriteProviderAdapterExecutionRun({
        actor,
        commandOutcomes: [...outcomes].reverse(),
        executedAt,
        history,
        mode: "commit",
      })

    expect(reordered.executionFingerprint).toBe(run.executionFingerprint)
    expect(reordered.commands[0]?.evidenceFingerprints).not.toContain("mutated evidence")
    expect(reordered.commands[0]?.warnings).not.toContain("mutated warning")
  })
})

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
    targetRfqId: "RFQ-900",
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
