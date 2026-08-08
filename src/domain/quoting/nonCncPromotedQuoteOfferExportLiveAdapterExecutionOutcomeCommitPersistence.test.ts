import { describe, expect, it } from "vitest"

import { decideNonCncPromotedQuoteOfferExportLiveAdapter } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import { createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory } from "./nonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommit"
import { buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-04T17:20:00.000Z"
const requestedAt = "2026-08-04T17:15:00.000Z"

describe("non-CNC live-adapter outcome commit persistence", () => {
  it("records blocked outcome commit plans as review-only snapshots", async () => {
    const plan = await fallbackPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(
      buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
        actor,
        executedAt,
        mode: "dry_run",
        plan,
      }),
    )
    const { commitPlan } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft,
      plan,
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      recordedAt: "2026-08-04T17:25:00.000Z",
      recordedBy: actor,
    })

    expect(snapshot).toMatchObject({
      blockedPlanIds: [plan.planId],
      commitReadyPlanIds: [],
      outcomeCount: 0,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_EXECUTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
      recordCount: 1,
      statusCounts: { blocked: 1 },
    })
    expect(snapshot.latestRecord).toMatchObject({
      commandOutcomeCount: 0,
      committedExecutionFingerprint: undefined,
      disposition: "review_only",
      latestExecutionFingerprint: undefined,
      sourceExecutionFingerprint: commitPlan.executionFingerprint,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(snapshot.latestRecord?.blockerLabels).toContain("Live-adapter execution outcome draft must be ready before commit.")
  })

  it("records ready outcome commit plans with committed execution evidence", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))
    const { commitPlan, executionRun } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft,
      plan,
    })
    if (!executionRun) {
      throw new Error("Expected ready live-adapter outcome commit run")
    }
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-08-04T17:30:00.000Z",
      recordedBy: actor,
    })

    expect(snapshot).toMatchObject({
      blockedPlanIds: [],
      committedExecutionFingerprints: [executionRun.executionFingerprint],
      commitReadyPlanIds: [plan.planId],
      outcomeCount: 5,
      recordCount: 1,
      sourceExecutionFingerprints: [commitPlan.executionFingerprint],
      statusCounts: { ready: 1 },
      warningCount: 1,
    })
    expect(snapshot.latestRecord).toMatchObject({
      commandOutcomeCount: 5,
      committedExecutionFingerprint: executionRun.executionFingerprint,
      disposition: "commit_ready",
      latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
      latestPackageId: "non-cnc-export-package:rfq-demo-204:ready",
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(snapshot.latestRecord?.reviewWarnings).toEqual(["Latest provider commit record has 1 warning(s)."])
  })

  it("rejects execution runs that do not match the outcome commit plan", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))
    const { commitPlan, executionRun } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft,
      plan,
    })
    if (!executionRun) {
      throw new Error("Expected ready live-adapter outcome commit run")
    }
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()

    await expect(
      adapter.recordCommit({
        commitPlan,
        recordedAt: "2026-08-04T17:30:00.000Z",
        recordedBy: actor,
      }),
    ).rejects.toThrow("ready live-adapter outcome commit plans require a commit execution run")
    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: { ...executionRun, mode: "dry_run" },
        recordedAt: "2026-08-04T17:30:00.000Z",
        recordedBy: actor,
      }),
    ).rejects.toThrow("live-adapter outcome commit execution run must use commit mode")
    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: { ...executionRun, status: "partial" },
        recordedAt: "2026-08-04T17:30:00.000Z",
        recordedBy: actor,
      }),
    ).rejects.toThrow("ready live-adapter outcome commit records require a succeeded execution run")
    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: { ...executionRun, latestPackageId: "non-cnc-export-package:rfq-demo-204:other" },
        recordedAt: "2026-08-04T17:30:00.000Z",
        recordedBy: actor,
      }),
    ).rejects.toThrow("live-adapter outcome commit execution run does not match commit plan: latestPackageId")
    await expect(
      adapter.recordCommit({
        commitPlan: { ...commitPlan, status: "blocked" },
        executionRun,
        recordedAt: "2026-08-04T17:30:00.000Z",
        recordedBy: actor,
      }),
    ).rejects.toThrow("blocked live-adapter outcome commit plans cannot be recorded with an execution run")
    await expect(
      adapter.recordCommit({
        commitPlan: { ...commitPlan, commandOutcomeCount: commitPlan.commandOutcomeCount + 1 },
        executionRun,
        recordedAt: "2026-08-04T17:30:00.000Z",
        recordedBy: actor,
      }),
    ).rejects.toThrow("commandOutcomeCount must equal commandOutcomes length")
  })

  it("deduplicates seeded records and returns cloned snapshots", async () => {
    const plan = await readyPlan()
    const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(await readyDryRun(plan))
    const { commitPlan, executionRun } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
      actor,
      executedAt,
      outcomeDraft,
      plan,
    })
    if (!executionRun) {
      throw new Error("Expected ready live-adapter outcome commit run")
    }
    const adapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()
    const seededRecord = (
      await adapter.recordCommit({
        commitPlan,
        executionRun,
        recordedAt: "2026-08-04T17:30:00.000Z",
        recordedBy: actor,
      })
    ).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded live-adapter outcome commit record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            recordedAt: "2026-08-04T17:35:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: [],
            warningCount: 0,
          },
        ],
      },
    })
    const reversedSeededAdapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            recordedAt: "2026-08-04T17:35:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: [],
            warningCount: 0,
          },
          seededRecord,
        ],
      },
    })
    const identicalSeededAdapter = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
      initialSnapshot: {
        records: [seededRecord, { ...seededRecord }],
      },
    })
    const snapshot = seededAdapter.snapshot()
    snapshot.records[0]?.reviewWarnings.push("mutated outside adapter")
    snapshot.commitReadyPlanIds.push("mutated-plan")

    expect(seededAdapter.snapshot()).toMatchObject({
      commitReadyPlanIds: [plan.planId],
      outcomeCount: 5,
      recordCount: 1,
      warningCount: 0,
    })
    expect(seededAdapter.snapshot().latestRecord).toMatchObject({
      recordedBy: "Replacement Operator",
      warningCount: 0,
    })
    expect(reversedSeededAdapter.snapshot()).toEqual(seededAdapter.snapshot())
    expect(identicalSeededAdapter.snapshot()).toMatchObject({
      outcomeCount: 5,
      recordCount: 1,
      warningCount: 1,
    })
    await seededAdapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-08-04T17:40:00.000Z",
      recordedBy: "Live Replacement Operator",
    })
    expect(seededAdapter.snapshot()).toMatchObject({
      commitReadyPlanIds: [plan.planId],
      outcomeCount: 5,
      recordCount: 1,
      warningCount: 1,
    })
    expect(seededAdapter.snapshot().latestRecord).toMatchObject({
      recordedBy: "Live Replacement Operator",
      warningCount: 1,
    })
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, recordedAt: "tomorrow" }],
        },
      }),
    ).toThrow("recordedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, warningCount: 0 }],
        },
      }),
    ).toThrow("warningCount must equal reviewWarnings length")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, committedExecutionFingerprint: undefined }],
        },
      }),
    ).toThrow("ready live-adapter outcome commit records require a committedExecutionFingerprint")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
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
    ).toThrow("conflicting live-adapter outcome commit records cannot share commitRecordId and recordedAt")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              committedExecutionFingerprint: "non-cnc-live-adapter-commit:blocked",
              disposition: "review_only",
              latestExecutionFingerprint: undefined,
              latestPackageId: undefined,
              latestPlanId: undefined,
              latestReleaseExecutionFingerprint: undefined,
              latestSourceExecutionFingerprint: undefined,
              status: "blocked",
              targetRfqId: undefined,
            },
          ],
        },
      }),
    ).toThrow("blocked live-adapter outcome commit records cannot include a committedExecutionFingerprint")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              committedExecutionFingerprint: undefined,
              disposition: "review_only",
              latestPackageId: undefined,
              latestPlanId: undefined,
              latestReleaseExecutionFingerprint: undefined,
              latestSourceExecutionFingerprint: undefined,
              status: "blocked",
              targetRfqId: undefined,
            },
          ],
        },
      }),
    ).toThrow("blocked live-adapter outcome commit records cannot include live evidence identifiers")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commitRecordId: `${seededRecord.commitRecordId}:stale` }],
        },
      }),
    ).toThrow("commitRecordId must match planId and sourceExecutionFingerprint")
  })
})

async function readyDryRun(
  plan: NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
) {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
    actor,
    executedAt,
    mode: "dry_run",
    plan,
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
