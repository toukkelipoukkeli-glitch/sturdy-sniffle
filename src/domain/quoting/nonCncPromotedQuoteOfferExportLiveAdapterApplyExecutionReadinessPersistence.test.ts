import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistory"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"
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
const executedAt = "2026-08-09T13:05:00.000Z"
const requestedAt = "2026-08-09T13:10:00.000Z"
const recordedAt = "2026-08-09T13:15:00.000Z"

describe("non-CNC live-adapter apply execution readiness persistence", () => {
  it("records blocked readiness snapshots while withholding ready evidence", async () => {
    const readiness = blockedReadiness()
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence()

    const snapshot = await persistence.recordReadiness({ readiness, recordedAt, recordedBy: actor })

    expect(snapshot).toMatchObject({
      blockedRecordIds: [snapshot.records[0].readinessRecordId],
      blockerCount: 1,
      latestApplyPlanIds: [],
      latestCommitRecordIds: [],
      latestCommittedExecutionFingerprints: [],
      latestExecutionFingerprints: [],
      latestSourceExecutionFingerprints: [],
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
      readyRecordIds: [],
      recordCount: 1,
      statusCounts: { blocked: 1 },
      targetRfqIds: ["rfq-demo-204"],
      warningCount: 0,
    })
    expect(snapshot.latestRecord).toEqual(snapshot.records[0])
    expect(snapshot.records[0]).toMatchObject({
      appliedCommandCount: 0,
      blockerLabels: ["No persisted non-CNC live-adapter apply execution records are available."],
      latestApplyPlanId: undefined,
      latestCommitPlanId: undefined,
      latestCommitRecordId: undefined,
      latestCommittedExecutionFingerprint: undefined,
      latestExecutionFingerprint: undefined,
      latestSourceExecutionFingerprint: undefined,
      recordedAt,
      recordedBy: actor,
      status: "blocked",
    })
  })

  it("records ready readiness evidence and returns cloned snapshots", async () => {
    const readiness = await readyReadiness()
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence()

    const snapshot = await persistence.recordReadiness({ readiness, recordedAt, recordedBy: actor })

    expect(snapshot).toMatchObject({
      blockedRecordIds: [],
      blockerCount: 0,
      latestApplyPlanIds: [readiness.latestApplyPlanId],
      latestCommitRecordIds: [readiness.latestCommitRecordId],
      latestCommittedExecutionFingerprints: [readiness.latestCommittedExecutionFingerprint],
      latestExecutionFingerprints: [readiness.latestExecutionFingerprint],
      latestSourceExecutionFingerprints: [readiness.latestSourceExecutionFingerprint],
      readyRecordIds: [snapshot.records[0].readinessRecordId],
      recordCount: 1,
      statusCounts: { ready: 1 },
      warningCount: 1,
    })
    expect(snapshot.records[0]).toMatchObject({
      appliedCommandCount: 5,
      latestApplyPlanFingerprint: readiness.latestApplyPlanFingerprint,
      latestApplyPlanId: readiness.latestApplyPlanId,
      latestCommitPlanId: readiness.latestCommitPlanId,
      latestCommitRecordId: readiness.latestCommitRecordId,
      latestCommittedExecutionFingerprint: readiness.latestCommittedExecutionFingerprint,
      latestExecutionFingerprint: readiness.latestExecutionFingerprint,
      latestSourceExecutionFingerprint: readiness.latestSourceExecutionFingerprint,
      reviewWarnings: ["Latest apply execution record has 1 warning(s)."],
      status: "ready",
    })

    snapshot.records[0].reviewWarnings.push("mutated")
    snapshot.readyRecordIds.push("mutated-id")
    if (snapshot.latestRecord) {
      snapshot.latestRecord.latestExecutionFingerprint = "mutated-fingerprint"
    }

    const restored = persistence.snapshot()
    expect(restored.records[0].reviewWarnings).not.toContain("mutated")
    expect(restored.readyRecordIds).not.toContain("mutated-id")
    expect(restored.latestRecord?.latestExecutionFingerprint).toBe(readiness.latestExecutionFingerprint)
  })

  it("dedupes seeded records by canonical readiness id and keeps the newest record", async () => {
    const readiness = blockedReadiness()
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence()
    const snapshot = await persistence.recordReadiness({ readiness, recordedAt, recordedBy: actor })
    const equivalentTimestampSnapshot = await persistence.recordReadiness({
      readiness: {
        ...readiness,
        requestedAt: "2026-08-09T13:10:00+00:00",
      },
      recordedAt: "2026-08-09T13:20:00.000Z",
      recordedBy: "Timestamp Operator",
    })
    const olderRecord = {
      ...snapshot.records[0],
      recordedAt: "2026-08-09T13:00:00.000Z",
      recordedBy: "Earlier Operator",
    }
    const duplicate = { ...snapshot.records[0], blockerLabels: [...snapshot.records[0].blockerLabels], reviewWarnings: [] }

    const restored = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
      initialSnapshot: {
        records: [olderRecord, duplicate, snapshot.records[0]],
      },
    }).snapshot()

    expect(equivalentTimestampSnapshot.recordCount).toBe(1)
    expect(equivalentTimestampSnapshot.records[0].requestedAt).toBe(requestedAt)
    expect(equivalentTimestampSnapshot.records[0].recordedBy).toBe("Timestamp Operator")
    expect(restored.recordCount).toBe(1)
    expect(restored.records[0].recordedAt).toBe(recordedAt)
    expect(restored.records[0].recordedBy).toBe(actor)
  })

  it("rejects conflicting duplicate and malformed seeded readiness records", async () => {
    const readiness = blockedReadiness()
    const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence()
    const snapshot = await persistence.recordReadiness({ readiness, recordedAt, recordedBy: actor })
    const blockedWithEvidence: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord = {
      ...snapshot.records[0],
      latestExecutionFingerprint: "leaked-execution",
    }
    const readyWithoutEvidence: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord = {
      ...snapshot.records[0],
      appliedCommandCount: 5,
      blockerCount: 0,
      blockerLabels: [],
      status: "ready",
    }
    const conflictingDuplicate: NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord = {
      ...snapshot.records[0],
      recordedBy: "Different Operator",
    }
    const invalidLatestStatus = {
      ...snapshot.records[0],
      latestStatus: "applied",
    } as unknown as NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
        initialSnapshot: { records: [blockedWithEvidence] },
      }),
    ).toThrow("blocked live-adapter apply execution readiness records cannot include ready evidence identifiers")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
        initialSnapshot: { records: [readyWithoutEvidence] },
      }),
    ).toThrow("ready live-adapter apply execution readiness records require complete evidence identifiers")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
        initialSnapshot: { records: [snapshot.records[0], conflictingDuplicate] },
      }),
    ).toThrow("conflicting live-adapter apply execution readiness records cannot share readinessRecordId and recordedAt")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
        initialSnapshot: { records: [invalidLatestStatus] },
      }),
    ).toThrow("latestStatus is not a supported non-CNC live-adapter apply execution status")
  })
})

function blockedReadiness() {
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
    history: buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence().snapshot(),
    ),
    requestedAt,
    requestedBy: actor,
    targetRfqId: "rfq-demo-204",
  })
}

async function readyReadiness() {
  const plan = await readyApplyPlan()
  const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
    actor,
    applyPlan: plan,
    commandOutcomes: plan.commands.map((command) => ({
      externalId: `external-${command.key}`,
      key: command.key,
      status: "applied",
    })),
    executedAt,
    mode: "commit",
  })
  const persistence = createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionPersistence()
  const history = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionHistorySummary(
    await persistence.recordRun(run),
  )
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness({
    history,
    requestedAt,
    requestedBy: actor,
    targetRfqId: "rfq-demo-204",
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
    recordedAt: "2026-08-09T12:58:00.000Z",
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
  const decisionHistory = createLocalNonCncPromotedQuoteOfferExportLiveAdapterDecisionHistory()
  const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
    enabled: true,
    readiness: readyProviderCommitReadiness(),
  })
  const snapshot = await decisionHistory.recordDecision(decision, {
    actor,
    recordedAt: "2026-08-09T12:50:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt: "2026-08-09T12:55:00.000Z",
    requestedBy: actor,
  })
}

function readyProviderCommitReadiness(): NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness {
  return {
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
    requestedAt: "2026-08-09T12:45:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
    status: "ready",
    targetRfqId: "rfq-demo-204",
  }
}
