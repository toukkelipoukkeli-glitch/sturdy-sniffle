import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteApplicationExecutionRun } from "./nonCncPromotedQuoteApplicationExecution"
import {
  createLocalNonCncPromotedQuoteApplicationExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteApplicationExecutionPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationRecord,
} from "./nonCncPromotedQuoteApplicationPersistence"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION } from "./nonCncPromotedQuoteApplicationPlan"

describe("non-CNC promoted quote application execution persistence", () => {
  it("records dry-run application execution summaries without storing command payloads", async () => {
    const applicationRecord = readyApplicationRecord()
    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      executedAt: "2026-06-28T09:00:00.000Z",
      mode: "dry_run",
    })
    const adapter = createLocalNonCncPromotedQuoteApplicationExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      applicationIds: [applicationRecord.applicationId],
      applicationRecordIds: [applicationRecord.applicationRecordId],
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION,
      recordCount: 1,
      selectedPlanIds: [applicationRecord.selectedPlanId],
      statusCounts: { prepared: 1 },
      warningCount: 1,
    })
    expect(snapshot.latestRun).toMatchObject({
      actor: "FactoryBid Operator",
      applicationId: applicationRecord.applicationId,
      applicationRecordId: applicationRecord.applicationRecordId,
      commandCount: 3,
      executedAt: "2026-06-28T09:00:00.000Z",
      executionFingerprint: run.executionFingerprint,
      executionVersion: run.executionVersion,
      mode: "dry_run",
      packageId: applicationRecord.packageId,
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION,
      preparedCommandCount: 3,
      selectedPlanId: applicationRecord.selectedPlanId,
      status: "prepared",
      targetRfqId: applicationRecord.targetRfqId,
      warningCount: 1,
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
  })

  it("records committed application execution outcome counts and sorts newest first", async () => {
    const applicationRecord = readyApplicationRecord()
    const adapter = createLocalNonCncPromotedQuoteApplicationExecutionPersistence()

    const pendingRun = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      executedAt: "2026-06-28T09:00:00.000Z",
      mode: "commit",
    })
    const partialRun = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      commandOutcomes: [
        { externalId: "execution:quote-snapshot:123", key: "replace_active_quote", status: "applied" },
        { key: "refresh_offer_workspace", message: "Offer readiness adapter unavailable.", status: "failed" },
      ],
      executedAt: "2026-06-28T09:10:00.000Z",
      mode: "commit",
    })

    await adapter.recordRun(pendingRun)
    const snapshot = await adapter.recordRun(partialRun)

    expect(snapshot.recordCount).toBe(2)
    expect(snapshot.records.map((record) => record.executionFingerprint)).toEqual([
      partialRun.executionFingerprint,
      pendingRun.executionFingerprint,
    ])
    expect(snapshot.statusCounts).toEqual({ partial: 1, pending: 1 })
    expect(snapshot.latestRun).toMatchObject({
      appliedCommandCount: 1,
      failedCommandCount: 1,
      pendingCommandCount: 1,
      status: "partial",
      warningCount: 2,
    })
    expect(snapshot.pendingActionCount).toBe(3)
    expect(snapshot.warningCount).toBe(3)
  })

  it("deduplicates seeded application execution records by fingerprint using the newest record", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationExecutionPersistence()
    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord: readyApplicationRecord(),
      executedAt: "2026-06-28T09:00:00.000Z",
      mode: "dry_run",
    })
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded application execution record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-06-28T09:05:00.000Z",
            pendingActionCount: 0,
            warningCount: 2,
          },
        ],
      },
    })

    const snapshot = seededAdapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.pendingActionCount).toBe(0)
    expect(snapshot.warningCount).toBe(2)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-06-28T09:05:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      warningCount: 2,
    })
  })

  it("keeps a newer seeded execution when an older duplicate run is recorded", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationExecutionPersistence()
    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord: readyApplicationRecord(),
      executedAt: "2026-06-28T09:00:00.000Z",
      mode: "dry_run",
    })
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded application execution record")
    }
    const seededAdapter = createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-06-28T09:05:00.000Z",
            pendingActionCount: 0,
          },
        ],
      },
    })

    const snapshot = await seededAdapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-06-28T09:05:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      pendingActionCount: 0,
    })
  })

  it("uses a total-order tie-breaker for same-fingerprint seeded records", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationExecutionPersistence()
    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord: readyApplicationRecord(),
      executedAt: "2026-06-28T09:00:00.000Z",
      mode: "dry_run",
    })
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded application execution record")
    }

    const leftFirst = createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
      initialSnapshot: {
        records: [
          { ...seededRecord, actor: "Zulu Operator" },
          { ...seededRecord, actor: "Alpha Operator" },
        ],
      },
    }).snapshot()
    const rightFirst = createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
      initialSnapshot: {
        records: [
          { ...seededRecord, actor: "Alpha Operator" },
          { ...seededRecord, actor: "Zulu Operator" },
        ],
      },
    }).snapshot()

    expect(leftFirst.records[0]?.actor).toBe("Alpha Operator")
    expect(rightFirst.records[0]?.actor).toBe("Alpha Operator")
  })

  it("returns cloned snapshots", async () => {
    const applicationRecord = readyApplicationRecord()
    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      executedAt: "2026-06-28T09:00:00.000Z",
      mode: "dry_run",
    })
    const adapter = createLocalNonCncPromotedQuoteApplicationExecutionPersistence()

    const snapshot = await adapter.recordRun(run)
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.applicationIds.push("mutated-application")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.actor).toBe("FactoryBid Operator")
    expect(clonedSnapshot.applicationIds).toEqual([applicationRecord.applicationId])
  })

  it("rejects invalid seeded application execution records", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationExecutionPersistence()
    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord: readyApplicationRecord(),
      executedAt: "2026-06-28T09:00:00.000Z",
      mode: "dry_run",
    })
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded application execution record")
    }

    expect(() =>
      createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executedAt: "tomorrow" }],
        },
      }),
    ).toThrow("executedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: -1 }],
        },
      }),
    ).toThrow("warningCount must be a non-negative integer")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 4 }],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status command counts")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, targetRfqId: "" }],
        },
      }),
    ).toThrow("targetRfqId is required")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, applicationId: "" }],
        },
      }),
    ).toThrow("applicationId is required")
  })
})

function readyApplicationRecord(): NonCncPromotedQuoteApplicationRecord {
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId: "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    blockerCount: 0,
    blockerLabels: [],
    commandCount: 3,
    commands: baseCommands(),
    disposition: "application_ready",
    packageId: "package-ready",
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
    planVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION,
    quoteSnapshot: {
      calculatorVersion: "sheet-metal.v1",
      currency: "EUR",
      leadTimeDays: 7,
      partNumber: "SM-120-BRACKET",
      process: "sheet_metal",
      processLabel: "Sheet metal",
      quantity: 1,
      totalCents: 54905,
      unitPriceCents: 54905,
    },
    readyCommandCount: 3,
    recordedAt: "2026-06-28T08:55:00.000Z",
    recordedBy: "FactoryBid Operator",
    reviewWarnings: ["Material certificate required."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    sourceExecutionFingerprint: "non-cnc-quote-promotion-execution-ready",
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
  }
}

function baseCommands(): NonCncPromotedQuoteApplicationRecord["commands"] {
  return [
    {
      detail: "Replace the active RFQ quote with the promoted non-CNC quote snapshot.",
      externalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
      key: "replace_active_quote",
      label: "Apply promoted quote",
      status: "ready",
    },
    {
      detail: "Refresh offer readiness from the promoted non-CNC quote.",
      externalId: "offer-readiness:rfq-demo-204:sheet-metal:54905",
      key: "refresh_offer_workspace",
      label: "Refresh offer workspace",
      status: "ready",
    },
    {
      detail: "Open the offer builder with the promoted non-CNC quote candidate.",
      externalId: "offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal",
      key: "open_offer_builder",
      label: "Open offer builder",
      status: "ready",
    },
  ]
}
