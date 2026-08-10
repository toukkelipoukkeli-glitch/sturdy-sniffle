import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecution"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistory"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-10T17:30:00.000Z"
const requestedAt = "2026-08-10T17:25:00.000Z"

describe("non-CNC live-adapter final-gate follow-through execution persistence", () => {
  it("records prepared dry-run executions without storing command payloads", async () => {
    const followThrough = readyFollowThroughPlan()
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      executedAt,
      followThrough,
      mode: "dry_run",
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      commandStatusCounts: { prepared: 5 },
      followThroughFingerprints: [followThrough.followThroughFingerprint],
      followThroughIds: [followThrough.followThroughId],
      latestApplyPlanIds: [followThrough.latestApplyPlanId],
      latestCommitRecordIds: [followThrough.latestCommitRecordId],
      latestExecutionFingerprints: [followThrough.latestExecutionFingerprint],
      pendingActionCount: 1,
      readinessRecordIds: [followThrough.readinessRecordId],
      recordCount: 1,
      statusCounts: { prepared: 1 },
      targetRfqIds: ["rfq-demo-204"],
    })
    expect(snapshot.latestRun).toMatchObject({
      commandCount: 5,
      executionFingerprint: run.executionFingerprint,
      persistenceVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_PERSISTENCE_VERSION,
      preparedCommandCount: 5,
      status: "prepared",
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
    expect(snapshot.records[0]).not.toHaveProperty("exportText")
  })

  it("records blocked executions while withholding all ready evidence", async () => {
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      executedAt,
      followThrough: blockedFollowThroughPlan(),
      mode: "commit",
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      commandStatusCounts: { blocked: 5 },
      latestApplyPlanIds: [],
      latestCommitRecordIds: [],
      latestExecutionFingerprints: [],
      readinessRecordIds: [],
      recordCount: 1,
      statusCounts: { blocked: 1 },
      targetRfqIds: [],
    })
    expect(snapshot.latestRun).toMatchObject({
      blockedCommandCount: 5,
      latestApplyPlanId: undefined,
      latestCommitRecordId: undefined,
      latestCommittedExecutionFingerprint: undefined,
      latestExecutionFingerprint: undefined,
      latestSourceExecutionFingerprint: undefined,
      readinessRecordId: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
  })

  it("aggregates commit outcome statuses deterministically", async () => {
    const followThrough = readyFollowThroughPlan()
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      commandOutcomes: [
        { key: followThrough.commands[0]!.key, status: "applied" },
        { key: followThrough.commands[1]!.key, status: "failed" },
      ],
      executedAt,
      followThrough,
      mode: "commit",
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      commandStatusCounts: { applied: 1, failed: 1, pending: 3 },
      pendingActionCount: 4,
      statusCounts: { partial: 1 },
      warningCount: 2,
    })
    expect(snapshot.latestRun).toMatchObject({
      appliedCommandCount: 1,
      failedCommandCount: 1,
      pendingCommandCount: 3,
      status: "partial",
    })
  })

  it("deduplicates identical seeded records by execution fingerprint", async () => {
    const seededRecord = await seedPreparedRecord()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          { ...seededRecord },
        ],
      },
    })

    expect(adapter.snapshot().recordCount).toBe(1)
  })

  it("rejects conflicting seeded records with the same execution fingerprint", async () => {
    const seededRecord = await seedPreparedRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence({
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
    ).toThrow("conflicting live-adapter final-gate follow-through execution records cannot share executionFingerprint")
  })

  it("returns cloned execution snapshots", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence()
    const snapshot = await adapter.recordRun(
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        executedAt,
        followThrough: readyFollowThroughPlan(),
        mode: "dry_run",
      }),
    )
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.followThroughIds.push("mutated-follow-through")
    snapshot.statusCounts.prepared = 99

    const restored = adapter.snapshot()

    expect(restored.recordCount).toBe(1)
    expect(restored.records[0]?.actor).toBe(actor)
    expect(restored.followThroughIds).not.toContain("mutated-follow-through")
    expect(restored.statusCounts).toEqual({ prepared: 1 })
  })

  it("rejects seeded records with inconsistent command counts", async () => {
    const seededRecord = await seedPreparedRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 4 }],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status live-adapter final-gate follow-through command counts")
  })

  it("rejects blocked seeded records with ready evidence identifiers", async () => {
    const blockedRecord = await seedBlockedRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...blockedRecord,
              readinessRecordId: "non-cnc-apply-readiness:rfq-demo-204:ready",
            },
          ],
        },
      }),
    ).toThrow("blocked live-adapter final-gate follow-through execution records cannot include ready evidence identifiers")
  })
})

async function seedPreparedRecord(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord> {
  const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
    actor,
    executedAt,
    followThrough: readyFollowThroughPlan(),
    mode: "dry_run",
  })
  const record = (
    await createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence().recordRun(run)
  ).records[0]
  if (!record) {
    throw new Error("Expected prepared execution record")
  }
  return record
}

async function seedBlockedRecord(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRecord> {
  const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
    actor,
    executedAt,
    followThrough: blockedFollowThroughPlan(),
    mode: "commit",
  })
  const record = (
    await createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionPersistence().recordRun(run)
  ).records[0]
  if (!record) {
    throw new Error("Expected blocked execution record")
  }
  return record
}

function readyFollowThroughPlan(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
        initialSnapshot: { records: [readyReadinessRecord()] },
      }).snapshot(),
    ),
    requestedAt,
    requestedBy: actor,
  })
}

function blockedFollowThroughPlan(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence().snapshot(),
    ),
    requestedAt,
    requestedBy: actor,
  })
}

function readyReadinessRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
  return {
    appliedCommandCount: 5,
    blockerCount: 0,
    blockerLabels: [],
    latestApplyPlanFingerprint: "non-cnc-apply-plan-fingerprint:rfq-demo-204:ready",
    latestApplyPlanId: "non-cnc-apply-plan:rfq-demo-204:ready",
    latestCommitPlanId: "non-cnc-outcome-commit-plan:rfq-demo-204:ready",
    latestCommitRecordId: "non-cnc-outcome-commit-record:rfq-demo-204:ready",
    latestCommittedExecutionFingerprint: "non-cnc-outcome-commit-execution:rfq-demo-204:ready",
    latestExecutionFingerprint: "non-cnc-apply-execution:rfq-demo-204:ready",
    latestSourceExecutionFingerprint: "non-cnc-live-adapter-source-execution:rfq-demo-204:ready",
    latestStatus: "succeeded",
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
    persistedRunCount: 1,
    readinessRecordId: "non-cnc-apply-readiness:rfq-demo-204:ready",
    readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
    recordedAt: "2026-08-10T17:20:00.000Z",
    recordedBy: actor,
    requestedAt: "2026-08-10T17:15:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest readiness warning."],
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
  }
}
