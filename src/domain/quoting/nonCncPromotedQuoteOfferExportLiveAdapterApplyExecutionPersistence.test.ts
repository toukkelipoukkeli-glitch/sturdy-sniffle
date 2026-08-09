import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecution"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyPlan"
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
  type NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-09T10:05:00.000Z"
const requestedAt = "2026-08-09T10:00:00.000Z"

describe("non-CNC live-adapter apply execution persistence", () => {
  it("records and aggregates ready apply execution runs without live side effects", async () => {
    const plan = await readyApplyPlan()
    const dryRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      executedAt,
      mode: "dry_run",
    })
    const commitRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      commandOutcomes: plan.commands.map((command) => ({
        externalId: `external-${command.key}`,
        key: command.key,
        status: "applied",
      })),
      executedAt: "2026-08-09T10:06:00.000Z",
      mode: "commit",
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence()

    await persistence.recordRun(dryRun)
    const snapshot = await persistence.recordRun(commitRun)

    expect(snapshot).toMatchObject({
      applyPlanFingerprints: [plan.applyPlanFingerprint],
      applyPlanIds: [plan.applyPlanId],
      commandStatusCounts: {
        applied: 5,
        prepared: 5,
      },
      latestRun: {
        executionFingerprint: commitRun.executionFingerprint,
        status: "succeeded",
      },
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION,
      recordCount: 2,
      statusCounts: {
        prepared: 1,
        succeeded: 1,
      },
      targetRfqIds: ["rfq-demo-204"],
    })
    expect(snapshot.latestCommittedExecutionFingerprints).toEqual([plan.latestCommittedExecutionFingerprint])
    expect(snapshot.warningCount).toBe(commitRun.warnings.length + dryRun.warnings.length)
    expect(snapshot.pendingActionCount).toBe(commitRun.nextActions.length + dryRun.nextActions.length)
  })

  it("dedupes identical seeded records by execution fingerprint", async () => {
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: await readyApplyPlan(),
      executedAt,
      mode: "dry_run",
    })
    const record = recordFromRun(run)

    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence({
      initialSnapshot: {
        records: [record, { ...record }],
      },
    })

    expect(persistence.snapshot()).toMatchObject({
      recordCount: 1,
      records: [{ executionFingerprint: run.executionFingerprint }],
      statusCounts: { prepared: 1 },
    })
  })

  it("rejects conflicting seeded records that share execution fingerprint", async () => {
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: await readyApplyPlan(),
      executedAt,
      mode: "dry_run",
    })
    const record = recordFromRun(run)

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence({
        initialSnapshot: {
          records: [
            record,
            {
              ...record,
              warningCount: record.warningCount + 1,
            },
          ],
        },
      }),
    ).toThrow("conflicting live-adapter apply execution records cannot share executionFingerprint")
  })

  it("withholds ready evidence from blocked apply execution records", () => {
    const blockedRun = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: blockedApplyPlan(),
      executedAt,
      mode: "commit",
    })
    const blockedRecord = recordFromRun(blockedRun)

    expect(blockedRecord.targetRfqId).toBeUndefined()
    expect(blockedRecord.latestCommittedExecutionFingerprint).toBeUndefined()
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...blockedRecord,
              latestCommitRecordId: "forged-live-evidence",
            },
          ],
        },
      }),
    ).toThrow("blocked live-adapter apply execution records cannot include ready evidence identifiers")
  })

  it("validates seeded aggregate command status counts", async () => {
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: await readyApplyPlan(),
      executedAt,
      mode: "dry_run",
    })
    const record = recordFromRun(run)

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...record,
              pendingCommandCount: 1,
            },
          ],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status live-adapter apply command counts")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...record,
              mode: "commit",
            },
          ],
        },
      }),
    ).toThrow("prepared live-adapter apply execution records must be dry-run records with only prepared commands")
  })

  it("returns clone-safe snapshots", async () => {
    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: await readyApplyPlan(),
      executedAt,
      mode: "dry_run",
    })
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence()
    const snapshot = await persistence.recordRun(run)
    snapshot.records[0]!.actor = "mutated"
    snapshot.applyPlanIds.push("mutated-plan")
    snapshot.statusCounts.prepared = 99
    if (snapshot.latestRun) {
      snapshot.latestRun.actor = "mutated latest"
    }

    const fresh = persistence.snapshot()

    expect(fresh.records[0]?.actor).toBe(actor)
    expect(fresh.latestRun?.actor).toBe(actor)
    expect(fresh.applyPlanIds).not.toContain("mutated-plan")
    expect(fresh.statusCounts.prepared).toBe(1)
  })
})

function recordFromRun(
  run: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRecord {
  const statusCounts = run.commands.reduce<Record<string, number>>((counts, command) => {
    counts[command.status] = (counts[command.status] ?? 0) + 1
    return counts
  }, {})
  return {
    actor: run.actor,
    appliedCommandCount: statusCounts.applied ?? 0,
    applyPlanFingerprint: run.applyPlanFingerprint,
    applyPlanId: run.applyPlanId,
    applyPlanVersion: run.applyPlanVersion,
    blockedCommandCount: statusCounts.blocked ?? 0,
    commandCount: run.commandCount,
    executedAt: run.executedAt,
    executionFingerprint: run.executionFingerprint,
    executionVersion: run.executionVersion,
    failedCommandCount: statusCounts.failed ?? 0,
    latestCommitPlanId: run.latestCommitPlanId,
    latestCommitRecordId: run.latestCommitRecordId,
    latestCommittedExecutionFingerprint: run.latestCommittedExecutionFingerprint,
    latestSourceExecutionFingerprint: run.latestSourceExecutionFingerprint,
    mode: run.mode,
    pendingActionCount: run.nextActions.length,
    pendingCommandCount: statusCounts.pending ?? 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_PERSISTENCE_VERSION,
    preparedCommandCount: statusCounts.prepared ?? 0,
    status: run.status,
    targetRfqId: run.targetRfqId,
    warningCount: run.warnings.length,
  }
}

function blockedApplyPlan(): NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan {
  const history = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence().snapshot(),
  )
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
    outcomeCommitHistory: history,
    requestedAt,
    requestedBy: actor,
  })
}

async function readyApplyPlan(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterApplyPlan> {
  const plan = await readyExecutionPlan()
  const dryRun = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionRun({
    actor,
    executedAt,
    mode: "dry_run",
    plan,
  })
  const outcomeDraft = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeDraft(dryRun)
  const { commitPlan, executionRun } = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitRun({
    actor,
    executedAt,
    outcomeDraft,
    plan,
  })
  if (!executionRun) {
    throw new Error("Expected committed live-adapter outcome execution run")
  }
  const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitPersistence()
  const snapshot = await persistence.recordCommit({
    commitPlan,
    executionRun,
    recordedAt: "2026-08-09T09:58:00.000Z",
    recordedBy: actor,
  })
  const history = buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionOutcomeCommitHistorySummary(snapshot)
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyPlan({
    outcomeCommitHistory: history,
    requestedAt,
    requestedBy: actor,
  })
}

async function readyExecutionPlan(): Promise<NonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan> {
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: readyReadiness,
  })
  const history = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const snapshot = await history.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-09T09:50:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt: "2026-08-09T09:55:00.000Z",
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
  requestedAt: "2026-08-09T09:45:00.000Z",
  requestedBy: actor,
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}
