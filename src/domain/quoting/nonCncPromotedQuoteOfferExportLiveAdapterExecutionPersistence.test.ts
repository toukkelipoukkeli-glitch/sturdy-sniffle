import { describe, expect, it } from "vitest"

import {
  decideNonCncPromotedQuoteOfferExportLiveAdapter,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-04T17:20:00.000Z"
const requestedAt = "2026-08-04T17:15:00.000Z"

describe("non-CNC promoted quote offer export live-adapter execution persistence", () => {
  it("records dry-run live-adapter execution summaries without storing command payloads", async () => {
    const plan = await readyPlan()
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt: "2026-08-04T20:20:00+03:00",
      mode: "dry_run",
      plan,
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      commandStatusCounts: { prepared: 5 },
      decisionFingerprints: [plan.decisionFingerprint],
      latestExecutionFingerprints: [plan.latestExecutionFingerprint],
      latestPackageIds: [plan.latestPackageId],
      latestPlanIds: [plan.latestPlanId],
      latestReleaseExecutionFingerprints: [plan.latestReleaseExecutionFingerprint],
      latestSourceExecutionFingerprints: [plan.latestSourceExecutionFingerprint],
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_PERSISTENCE_VERSION,
      planFingerprints: [plan.planFingerprint],
      planIds: [plan.planId],
      recordCount: 1,
      statusCounts: { prepared: 1 },
      targetRfqIds: [plan.targetRfqId],
      warningCount: 1,
    })
    expect(snapshot.latestRun).toMatchObject({
      actor,
      adapterAction: "enable_live_adapter",
      commandCount: 5,
      decisionFingerprint: plan.decisionFingerprint,
      executedAt,
      executionFingerprint: run.executionFingerprint,
      mode: "dry_run",
      pendingActionCount: 1,
      plannedCommandCount: 5,
      preparedCommandCount: 5,
      status: "prepared",
      targetRfqId: "rfq-demo-204",
      warningCount: 1,
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
    expect(snapshot.records[0]).not.toHaveProperty("adapterExecutionBoundary")
  })

  it("records committed live-adapter outcome counts and sorts newest first", async () => {
    const plan = await readyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence()
    const pendingRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt: "2026-08-04T17:25:00.000Z",
      mode: "commit",
      plan,
    })
    const partialRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      commandOutcomes: [
        { key: "customer_offer_write", message: "Customer offer write succeeded", status: "succeeded" },
        { key: "file_export_write", message: "PDF adapter timed out", status: "failed" },
      ],
      executedAt: "2026-08-04T17:30:00.000Z",
      mode: "commit",
      plan,
    })

    await adapter.recordRun(pendingRun)
    const snapshot = await adapter.recordRun(partialRun)

    expect(snapshot.recordCount).toBe(2)
    expect(snapshot.records.map((record) => record.executionFingerprint)).toEqual([
      partialRun.executionFingerprint,
      pendingRun.executionFingerprint,
    ])
    expect(snapshot.commandStatusCounts).toEqual({ failed: 1, pending: 8, succeeded: 1 })
    expect(snapshot.statusCounts).toEqual({ partial: 1, pending: 1 })
    expect(snapshot.latestRun).toMatchObject({
      failedCommandCount: 1,
      pendingCommandCount: 3,
      status: "partial",
      succeededCommandCount: 1,
      warningCount: 2,
    })
    expect(snapshot.pendingActionCount).toBe(5)
    expect(snapshot.warningCount).toBe(3)
  })

  it("keeps withheld and blocked records from exposing live evidence ids", async () => {
    const fallbackRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt: "2026-08-04T17:35:00.000Z",
      mode: "dry_run",
      plan: await fallbackPlan(),
    })
    const blockedRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
      actor,
      executedAt: "2026-08-04T17:40:00.000Z",
      mode: "commit",
      plan: blockedPlan(),
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence()

    await adapter.recordRun(fallbackRun)
    const snapshot = await adapter.recordRun(blockedRun)

    expect(snapshot.recordCount).toBe(2)
    expect(snapshot.commandStatusCounts).toEqual({ blocked: 5, withheld: 5 })
    expect(snapshot.latestExecutionFingerprints).toEqual([])
    expect(snapshot.latestPackageIds).toEqual([])
    expect(snapshot.latestPlanIds).toEqual([])
    expect(snapshot.latestReleaseExecutionFingerprints).toEqual([])
    expect(snapshot.latestSourceExecutionFingerprints).toEqual([])
    expect(snapshot.statusCounts).toEqual({ blocked: 1, withheld: 1 })
    expect(snapshot.targetRfqIds).toEqual([])
    expect(snapshot.records.every((record) => record.targetRfqId === undefined)).toBe(true)
  })

  it("deduplicates seeded live-adapter execution records by fingerprint using the newest record", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence()
    const run = await buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded live-adapter execution record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-08-04T17:45:00.000Z",
            pendingActionCount: 0,
            warningCount: 0,
          },
        ],
      },
    })

    const snapshot = seededAdapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.pendingActionCount).toBe(0)
    expect(snapshot.warningCount).toBe(0)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-08-04T17:45:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      warningCount: 0,
    })
  })

  it("returns cloned live-adapter execution snapshots", async () => {
    const run = await buildReadyDryRun()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence()

    const snapshot = await adapter.recordRun(run)
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.planIds.push("mutated-plan")
    snapshot.commandStatusCounts.prepared = 99
    snapshot.latestRun!.actor = "Mutated Latest Operator"

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.actor).toBe(actor)
    expect(clonedSnapshot.latestRun?.actor).toBe(actor)
    expect(clonedSnapshot.planIds).toEqual([run.planId])
    expect(clonedSnapshot.commandStatusCounts).toEqual({ prepared: 5 })
  })

  it("records non-blocked live-adapter executions with incomplete evidence", async () => {
    const run = await buildReadyDryRun()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded live-adapter execution record")
    }

    const restoredAdapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            latestPackageId: undefined,
            targetRfqId: undefined,
          },
        ],
      },
    })

    const snapshot = restoredAdapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.records[0]?.latestPackageId).toBeUndefined()
    expect(snapshot.records[0]?.targetRfqId).toBeUndefined()
    expect(snapshot.latestPackageIds).toEqual([])
    expect(snapshot.targetRfqIds).toEqual([])
  })

  it("rejects invalid seeded live-adapter execution records", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence()
    const run = await buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded live-adapter execution record")
    }

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executedAt: "tomorrow" }],
        },
      }),
    ).toThrow("executedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 6 }],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status live-adapter command counts")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, plannedCommandCount: 4 }],
        },
      }),
    ).toThrow("plannedCommandCount must equal prepared pending failed and succeeded live-adapter command counts")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, mode: "commit" }],
        },
      }),
    ).toThrow("prepared live-adapter execution records must be dry-run records with only prepared commands")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 0, plannedCommandCount: 0, preparedCommandCount: 0 }],
        },
      }),
    ).toThrow("commandCount must be greater than zero for live-adapter execution records")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              persistenceVersion: "unsupported-persistence-version" as typeof seededRecord.persistenceVersion,
            },
          ],
        },
      }),
    ).toThrow("persistenceVersion is not a supported non-CNC live-adapter execution persistence version")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              executionVersion: "unsupported-execution-version" as typeof seededRecord.executionVersion,
            },
          ],
        },
      }),
    ).toThrow("executionVersion is not a supported non-CNC live-adapter execution version")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              planVersion: "unsupported-plan-version" as typeof seededRecord.planVersion,
            },
          ],
        },
      }),
    ).toThrow("planVersion is not a supported non-CNC live-adapter execution plan version")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: -1 }],
        },
      }),
    ).toThrow("warningCount must be a non-negative safe integer")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, pendingActionCount: 1.5 }],
        },
      }),
    ).toThrow("pendingActionCount must be a non-negative safe integer")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              mode: "commit",
              pendingCommandCount: 5,
              preparedCommandCount: 0,
              status: "partial",
            },
          ],
        },
      }),
    ).toThrow(
      "partial live-adapter execution records must be commit records with a mixed succeeded failed or pending command state",
    )
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              blockedCommandCount: 5,
              latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
              plannedCommandCount: 0,
              preparedCommandCount: 0,
              status: "blocked",
            },
          ],
        },
      }),
    ).toThrow("blocked and withheld live-adapter execution records cannot include live evidence identifiers")
  })
})

async function buildReadyDryRun() {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
    actor,
    executedAt,
    mode: "dry_run",
    plan: await readyPlan(),
  })
}

async function readyPlan(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan> {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: readyReadiness,
  })
  const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const snapshot = await history.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-04T17:10:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt,
    requestedBy: actor,
  })
}

async function fallbackPlan(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan> {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    readiness: readyReadiness,
  })
  const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const snapshot = await history.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-04T17:10:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt,
    requestedBy: actor,
  })
}

function blockedPlan(): NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: blockedReadiness,
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    requestedAt,
    requestedBy: actor,
  })
}

const readyReadiness: NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness = {
  artifactOutcomeCount: 4,
  blockerLabels: [],
  latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
  latestPackageId: "non-cnc-export-package:rfq-demo-204:ready",
  latestPlanId: "non-cnc-export-plan:rfq-demo-204:ready",
  latestReleaseExecutionFingerprint: "non-cnc-release-execution:rfq-demo-204:ready",
  latestSourceExecutionFingerprint: "non-cnc-export-source:rfq-demo-204:ready",
  latestStatus: "succeeded",
  nextOperatorMessage: "Provider commit history is ready for a future customer-offer export adapter.",
  persistedRecordCount: 1,
  providerCommitBoundary:
    "Provider commit readiness is deterministic review data only; this helper does not create customer offers, files, release reviews, exports, or connector writes.",
  readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  requestedAt: "2026-08-03T12:40:00.000Z",
  requestedBy: actor,
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}

const blockedReadiness: NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness = {
  ...readyReadiness,
  artifactOutcomeCount: 0,
  blockerLabels: ["No persisted non-CNC offer export provider commit records are available."],
  latestExecutionFingerprint: undefined,
  latestPackageId: undefined,
  latestPlanId: undefined,
  latestReleaseExecutionFingerprint: undefined,
  latestSourceExecutionFingerprint: undefined,
  latestStatus: undefined,
  persistedRecordCount: 0,
  reviewWarnings: [],
  status: "blocked",
}
