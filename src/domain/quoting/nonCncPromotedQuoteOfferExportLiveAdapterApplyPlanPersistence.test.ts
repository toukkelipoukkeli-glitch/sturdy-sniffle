import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan } from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlan"
import { decideNonCncPromotedQuoteOfferExportLiveAdapter } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import { createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistory"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft"
import { createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"
const requestedAt = "2026-08-08T09:20:00.000Z"

describe("non-CNC live-adapter apply plan persistence", () => {
  it("records ready apply plan summaries without storing command payloads", async () => {
    const applyPlan = await readyApplyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence()

    const snapshot = await adapter.recordApplyPlan({
      applyPlan,
      recordedAt: "2026-08-08T09:25:00.000Z",
      recordedBy: actor,
    })

    expect(snapshot).toMatchObject({
      applyReadyPlanIds: [applyPlan.applyPlanId],
      blockedCommandCount: 0,
      blockedPlanIds: [],
      committedOutcomeCount: 5,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_PLAN_PERSISTENCE_VERSION,
      plannedCommandCount: 5,
      recordCount: 1,
      statusCounts: { ready: 1 },
      warningCount: 1,
    })
    expect(snapshot.latestRecord).toMatchObject({
      applyPlanFingerprint: applyPlan.applyPlanFingerprint,
      applyPlanId: applyPlan.applyPlanId,
      commandCount: 5,
      disposition: "apply_ready",
      latestCommitRecordId: applyPlan.latestCommitRecordId,
      latestCommittedExecutionFingerprint: applyPlan.latestCommittedExecutionFingerprint,
      plannedCommandCount: 5,
      recordedAt: "2026-08-08T09:25:00.000Z",
      recordedBy: actor,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
    expect(snapshot.records[0]).not.toHaveProperty("exportText")
  })

  it("records blocked apply plans as review-only while withholding ready evidence", async () => {
    const history = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence().snapshot(),
    )
    const applyPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
      outcomeCommitHistory: history,
      requestedAt,
      requestedBy: actor,
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence()

    const snapshot = await adapter.recordApplyPlan({
      applyPlan,
      recordedAt: "2026-08-08T09:26:00.000Z",
      recordedBy: actor,
    })

    expect(snapshot).toMatchObject({
      applyReadyPlanIds: [],
      blockedCommandCount: 5,
      blockedPlanIds: [applyPlan.applyPlanId],
      committedOutcomeCount: 0,
      plannedCommandCount: 0,
      recordCount: 1,
      statusCounts: { blocked: 1 },
    })
    expect(snapshot.latestRecord).toMatchObject({
      disposition: "review_only",
      latestCommitRecordId: undefined,
      latestCommittedExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(snapshot.latestRecord?.blockerLabels).toEqual([
      "Persist a committed live-adapter outcome history record before planning live apply commands.",
    ])
  })

  it("derives command counts from command descriptors instead of stale summary fields", async () => {
    const applyPlan = await readyApplyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence()

    const snapshot = await adapter.recordApplyPlan({
      applyPlan: { ...applyPlan, commandCount: 99, plannedCommandCount: 99 },
      recordedAt: "2026-08-08T09:25:00.000Z",
      recordedBy: actor,
    })

    expect(snapshot.latestRecord).toMatchObject({
      blockedCommandCount: 0,
      commandCount: 5,
      plannedCommandCount: 5,
    })
  })

  it("deduplicates seeded apply plan records by applyPlanId using the newest record", async () => {
    const seededRecord = await seedReadyApplyPlanRecord()

    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            recordedAt: "2026-08-08T09:35:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: ["Replacement warning."],
            warningCount: 1,
          },
        ],
      },
    })
    const snapshot = adapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.warningCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      applyPlanId: seededRecord.applyPlanId,
      recordedAt: "2026-08-08T09:35:00.000Z",
      recordedBy: "Replacement Operator",
      reviewWarnings: ["Replacement warning."],
    })
  })

  it("rejects conflicting seeded duplicates with the same applyPlanId and recordedAt", async () => {
    const seededRecord = await seedReadyApplyPlanRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence({
        initialSnapshot: {
          records: [
            seededRecord,
            {
              ...seededRecord,
              recordedBy: "Conflicting Operator",
            },
          ],
        },
      }),
    ).toThrow("conflicting live-adapter apply plan records cannot share applyPlanId and recordedAt")
  })

  it("returns cloned apply plan snapshots", async () => {
    const applyPlan = await readyApplyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence()

    const snapshot = await adapter.recordApplyPlan({
      applyPlan,
      recordedAt: "2026-08-08T09:25:00.000Z",
      recordedBy: actor,
    })
    snapshot.records[0]!.recordedBy = "Mutated Operator"
    snapshot.applyReadyPlanIds.push("mutated-plan")
    snapshot.records[0]!.reviewWarnings.push("Mutated warning.")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.recordedBy).toBe(actor)
    expect(clonedSnapshot.records[0]?.reviewWarnings).toEqual(["Latest provider commit record has 1 warning(s)."])
    expect(clonedSnapshot.applyReadyPlanIds).toEqual([applyPlan.applyPlanId])
  })

  it("rejects seeded records with inconsistent command counts", async () => {
    const seededRecord = await seedReadyApplyPlanRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 4 }],
        },
      }),
    ).toThrow("commandCount must equal plannedCommandCount plus blockedCommandCount")
  })

  it("rejects blocked seeded records with ready evidence identifiers", async () => {
    const seededRecord = await seedReadyApplyPlanRecord()

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              disposition: "review_only",
              latestCommittedExecutionFingerprint: "live-adapter-commit:ready",
              status: "blocked",
              targetRfqId: undefined,
            },
          ],
        },
      }),
    ).toThrow("blocked live-adapter apply plan records cannot include ready evidence identifiers")
  })
})

async function seedReadyApplyPlanRecord(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlanRecord> {
  const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyPlanPersistence()
  const seededRecord = (
    await adapter.recordApplyPlan({
      applyPlan: await readyApplyPlan(),
      recordedAt: "2026-08-08T09:25:00.000Z",
      recordedBy: actor,
    })
  ).records[0]
  if (!seededRecord) {
    throw new Error("Expected seeded apply plan record")
  }
  return seededRecord
}

async function readyApplyPlan() {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: readyReadiness,
  })
  const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const decisionHistory = await history.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-08T09:10:00.000Z",
  })
  const executionPlan = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory,
    requestedAt: "2026-08-08T09:12:00.000Z",
    requestedBy: actor,
  })
  const dryRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
    actor,
    executedAt: "2026-08-08T09:15:00.000Z",
    mode: "dry_run",
    plan: executionPlan,
  })
  const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(dryRun)
  const { commitPlan, executionRun } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
    actor,
    executedAt: "2026-08-08T09:16:00.000Z",
    outcomeDraft,
    plan: executionPlan,
  })
  if (!executionRun) {
    throw new Error("Expected committed live-adapter outcome execution run")
  }
  const outcomeCommitPersistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()
  const outcomeCommitSnapshot = await outcomeCommitPersistence.recordCommit({
    commitPlan,
    executionRun,
    recordedAt: "2026-08-08T09:18:00.000Z",
    recordedBy: actor,
  })
  const outcomeCommitHistory =
    buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(outcomeCommitSnapshot)
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
    outcomeCommitHistory,
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
  requestedAt: "2026-08-08T09:00:00.000Z",
  requestedBy: actor,
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}
