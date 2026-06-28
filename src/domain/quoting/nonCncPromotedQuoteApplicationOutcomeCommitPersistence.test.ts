import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft } from "./nonCncPromotedQuoteApplicationExecutionOutcomeDraft"
import { buildNonCncPromotedQuoteApplicationOutcomeCommitRun } from "./nonCncPromotedQuoteApplicationOutcomeCommit"
import {
  createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationRecord,
} from "./nonCncPromotedQuoteApplicationPersistence"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION } from "./nonCncPromotedQuoteApplicationPlan"

describe("non-CNC promoted quote application outcome commit persistence", () => {
  it("records blocked application commit plans as review-only snapshots", async () => {
    const applicationRecord = blockedApplicationRecord()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)
    const { commitPlan } = buildNonCncPromotedQuoteApplicationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      executedAt: "2026-06-28T11:00:00.000Z",
      outcomeDraft,
    })
    const adapter = createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      recordedAt: "2026-06-28T11:05:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      blockedApplicationIds: [applicationRecord.applicationId],
      commitReadyApplicationIds: [],
      outcomeCount: 0,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
      recordCount: 1,
      statusCounts: { blocked: 1 },
    })
    expect(snapshot.latestRecord).toMatchObject({
      applicationId: applicationRecord.applicationId,
      commandOutcomeCount: 0,
      disposition: "review_only",
      executionFingerprint: undefined,
      status: "blocked",
    })
    expect(snapshot.latestRecord?.blockerLabels).toContain("Application outcome draft must be ready before commit.")
  })

  it("records ready application commit plans with their committed execution fingerprint", async () => {
    const applicationRecord = readyApplicationRecord()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)
    const { commitPlan, executionRun } = buildNonCncPromotedQuoteApplicationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      executedAt: "2026-06-28T11:00:00.000Z",
      outcomeDraft,
    })
    if (!executionRun) {
      throw new Error("Expected ready application outcome commit run")
    }
    const adapter = createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-06-28T11:10:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      blockedApplicationIds: [],
      commitReadyApplicationIds: [applicationRecord.applicationId],
      outcomeCount: 3,
      recordCount: 1,
      statusCounts: { ready: 1 },
      warningCount: 1,
    })
    expect(snapshot.latestRecord).toMatchObject({
      applicationRecordId: applicationRecord.applicationRecordId,
      commandOutcomeCount: 3,
      disposition: "commit_ready",
      executionFingerprint: executionRun.executionFingerprint,
      status: "ready",
      targetRfqId: applicationRecord.targetRfqId,
    })
    expect(snapshot.latestRecord?.reviewWarnings).toEqual(["Material certificate required."])
  })

  it("rejects execution runs that do not match the commit plan", async () => {
    const applicationRecord = readyApplicationRecord()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)
    const { commitPlan, executionRun } = buildNonCncPromotedQuoteApplicationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      executedAt: "2026-06-28T11:00:00.000Z",
      outcomeDraft,
    })
    if (!executionRun) {
      throw new Error("Expected ready application outcome commit run")
    }
    const adapter = createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence()

    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: { ...executionRun, selectedPlanId: "non-cnc-promotion:other" },
        recordedAt: "2026-06-28T11:10:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("application outcome commit execution run does not match commit plan: selectedPlanId")

    await expect(
      adapter.recordCommit({
        commitPlan: {
          ...commitPlan,
          status: "blocked",
        },
        executionRun,
        recordedAt: "2026-06-28T11:10:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("blocked application outcome commit plans cannot be recorded with an execution run")

    await expect(
      adapter.recordCommit({
        commitPlan: {
          ...commitPlan,
          commandOutcomeCount: commitPlan.commandOutcomeCount + 1,
        },
        recordedAt: "2026-06-28T11:10:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("commandOutcomeCount must equal commandOutcomes length")
  })

  it("deduplicates seeded records and returns cloned snapshots", async () => {
    const applicationRecord = readyApplicationRecord()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)
    const { commitPlan, executionRun } = buildNonCncPromotedQuoteApplicationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      executedAt: "2026-06-28T11:00:00.000Z",
      outcomeDraft,
    })
    if (!executionRun) {
      throw new Error("Expected ready application outcome commit run")
    }
    const adapter = createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence()
    const seededRecord = (
      await adapter.recordCommit({
        commitPlan,
        executionRun,
        recordedAt: "2026-06-28T11:10:00.000Z",
        recordedBy: "FactoryBid Operator",
      })
    ).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded application commit record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            recordedAt: "2026-06-28T11:20:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: [],
            warningCount: 0,
          },
        ],
      },
    })
    const snapshot = seededAdapter.snapshot()
    snapshot.records[0]?.reviewWarnings.push("mutated outside adapter")
    snapshot.commitReadyApplicationIds.push("mutated-application")

    expect(seededAdapter.snapshot()).toMatchObject({
      commitReadyApplicationIds: [applicationRecord.applicationId],
      outcomeCount: 3,
      recordCount: 1,
      warningCount: 0,
    })
    expect(seededAdapter.snapshot().latestRecord).toMatchObject({
      recordedBy: "Replacement Operator",
      warningCount: 0,
    })
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, recordedAt: "tomorrow" }],
        },
      }),
    ).toThrow("recordedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: 0 }],
        },
      }),
    ).toThrow("warningCount must equal reviewWarnings length")
    expect(() =>
      createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              commitRecordId: "non-cnc-application-outcome-commit:stale-application-record",
            },
          ],
        },
      }),
    ).toThrow("commitRecordId must match applicationRecordId")
  })
})

function blockedApplicationRecord(): NonCncPromotedQuoteApplicationRecord {
  return {
    applicationId: "non-cnc-promoted-quote-application:registry-demo:package-blocked",
    applicationRecordId: "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:registry-demo:package-blocked",
    blockerCount: 1,
    blockerLabels: ["Promoted quote read model is not ready."],
    commandCount: 3,
    commands: baseCommands("blocked"),
    disposition: "review_only",
    packageId: "package-blocked",
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
    planVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION,
    readyCommandCount: 0,
    recordedAt: "2026-06-28T08:55:00.000Z",
    recordedBy: "FactoryBid Operator",
    reviewWarnings: [],
    selectedPlanId: "non-cnc-promotion:registry-demo:sheet-metal:sm-120-bracket:sheet-metal-v1",
    status: "blocked",
    targetRfqId: "registry-demo",
    warningCount: 0,
  }
}

function readyApplicationRecord(): NonCncPromotedQuoteApplicationRecord {
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId: "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    blockerCount: 0,
    blockerLabels: [],
    commandCount: 3,
    commands: baseCommands("ready"),
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

function baseCommands(status: "blocked" | "ready"): NonCncPromotedQuoteApplicationRecord["commands"] {
  const ready = status === "ready"
  return [
    {
      detail: ready ? "Replace the active RFQ quote with the promoted non-CNC quote snapshot." : "Keep active RFQ quote unchanged.",
      externalId: ready ? "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1" : undefined,
      key: "replace_active_quote",
      label: "Apply promoted quote",
      status,
    },
    {
      detail: ready ? "Refresh offer readiness from the promoted non-CNC quote." : "Offer readiness remains guarded.",
      externalId: ready ? "offer-readiness:rfq-demo-204:sheet-metal:54905" : undefined,
      key: "refresh_offer_workspace",
      label: "Refresh offer workspace",
      status,
    },
    {
      detail: ready ? "Open the offer builder with the promoted non-CNC quote candidate." : "Offer builder stays guarded.",
      externalId: ready ? "offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal" : undefined,
      key: "open_offer_builder",
      label: "Open offer builder",
      status,
    },
  ]
}
