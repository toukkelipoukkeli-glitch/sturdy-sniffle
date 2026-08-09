import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
  fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecution"
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
const executedAt = "2026-08-09T08:15:00.000Z"
const requestedAt = "2026-08-09T08:10:00.000Z"

describe("non-CNC live-adapter apply execution", () => {
  it("blocks empty apply plans without exposing live evidence", () => {
    const plan = blockedApplyPlan()

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      executedAt,
      mode: "commit",
    })

    expect(run).toMatchObject({
      applyPlanFingerprint: plan.applyPlanFingerprint,
      applyPlanId: plan.applyPlanId,
      blockedCommandCount: 5,
      commandCount: 5,
      committedOutcomeCount: 0,
      executionVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_VERSION,
      historyRecordCount: 0,
      latestCommitPlanId: undefined,
      latestCommitRecordId: undefined,
      latestCommittedExecutionFingerprint: undefined,
      latestSourceExecutionFingerprint: undefined,
      mode: "commit",
      plannedCommandCount: 0,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(run.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(run.commands.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(run.commands.every((command) => command.idempotencyKey === undefined)).toBe(true)
    expect(run.nextActions).toContain("Resolve live-adapter apply blockers before recording apply outcomes.")
    expect(run.adapterApplyExecutionBoundary).toContain("does not create customer offers")
    expect(fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun(run)).toBe(
      run.executionFingerprint,
    )
  })

  it("prepares ready apply commands in dry-run mode without command outcomes", async () => {
    const plan = await readyApplyPlan()

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      executedAt,
      mode: "dry_run",
    })

    expect(run).toMatchObject({
      blockedCommandCount: 0,
      commandCount: 5,
      latestCommitPlanId: plan.latestCommitPlanId,
      latestCommitRecordId: plan.latestCommitRecordId,
      latestCommittedExecutionFingerprint: plan.latestCommittedExecutionFingerprint,
      latestSourceExecutionFingerprint: plan.latestSourceExecutionFingerprint,
      mode: "dry_run",
      plannedCommandCount: 5,
      status: "prepared",
      targetRfqId: "rfq-demo-204",
    })
    expect(run.commands.every((command) => command.status === "prepared")).toBe(true)
    expect(run.commands.every((command) => command.idempotencyKey?.startsWith("non-cnc-live-adapter-apply:"))).toBe(
      true,
    )
    expect(run.commands.every((command) => command.evidenceFingerprints.length > 0)).toBe(true)
    expect(run.commands.every((command) => command.externalId === undefined)).toBe(true)
    expect(run.nextActions).toEqual(["Review 5 prepared live-adapter apply commands before committing."])
  })

  it("records deterministic commit outcomes while preserving pending and failed command actions", async () => {
    const plan = await readyApplyPlan()
    const [first, second, ...remainingCommands] = plan.commands

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      commandOutcomes: [
        {
          externalId: " live-offer-204 ",
          key: first!.key,
          status: "applied",
          warnings: [" copied to local audit ", "copied to local audit"],
        },
        {
          key: second!.key,
          message: "Provider artifact checksum did not match.",
          status: "failed",
        },
      ],
      executedAt,
      mode: "commit",
    })

    expect(run.status).toBe("partial")
    expect(run.commands.map((command) => command.status)).toEqual(["applied", "failed", "pending", "pending", "pending"])
    expect(run.commands[0]?.externalId).toBe("live-offer-204")
    expect(run.commands[0]?.warnings).toEqual(["copied to local audit"])
    expect(run.commands[1]?.message).toBe("Provider artifact checksum did not match.")
    expect(run.nextActions).toEqual([
      `Resolve failed live-adapter apply command: ${second!.label}.`,
      ...remainingCommands.map((command) => `Record live-adapter apply outcome for command: ${command.label}.`),
    ])
    expect(run.warnings).toContain(`${first!.label}: copied to local audit`)
    expect(run.warnings).toContain(`${second!.label} failed: Provider artifact checksum did not match.`)
  })

  it("marks complete applied command outcomes as succeeded", async () => {
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

    expect(run.status).toBe("succeeded")
    expect(run.commands.every((command) => command.status === "applied")).toBe(true)
    expect(run.nextActions).toEqual([
      "Review the recorded live-adapter apply audit before wiring live customer-offer export state.",
    ])
  })

  it("rejects impossible command outcomes", async () => {
    const readyPlan = await readyApplyPlan()
    const blockedPlan = blockedApplyPlan()
    const key = readyPlan.commands[0]!.key

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
        actor,
        applyPlan: readyPlan,
        commandOutcomes: [{ key, status: "applied" }],
        executedAt,
        mode: "dry_run",
      }),
    ).toThrow("cannot be recorded for a dry-run live-adapter apply execution")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
        actor,
        applyPlan: readyPlan,
        commandOutcomes: [{ key: "unknown_command", status: "applied" }],
        executedAt,
        mode: "commit",
      }),
    ).toThrow("does not match a live-adapter apply command")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
        actor,
        applyPlan: blockedPlan,
        commandOutcomes: [{ key: blockedPlan.commands[0]!.key, status: "applied" }],
        executedAt,
        mode: "commit",
      }),
    ).toThrow("cannot be recorded for a blocked live-adapter apply command")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
        actor,
        applyPlan: readyPlan,
        commandOutcomes: [
          { key, status: "applied" },
          { key, status: "failed" },
        ],
        executedAt,
        mode: "commit",
      }),
    ).toThrow(`duplicate command outcome ${key}`)
  })

  it("keeps fingerprints stable for reordered outcomes and returns cloned command data", async () => {
    const plan = await readyApplyPlan()
    const outcomes = plan.commands.map((command) => ({
      externalId: `external-${command.key}`,
      key: command.key,
      status: "applied" as const,
    }))

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      commandOutcomes: outcomes,
      executedAt,
      mode: "commit",
    })
    run.commands[0]!.evidenceFingerprints.push("mutated evidence")
    run.commands[0]!.warnings.push("mutated warning")

    const reordered = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionRun({
      actor,
      applyPlan: plan,
      commandOutcomes: [...outcomes].reverse(),
      executedAt,
      mode: "commit",
    })

    expect(reordered.executionFingerprint).toBe(run.executionFingerprint)
    expect(reordered.commands[0]?.evidenceFingerprints).not.toContain("mutated evidence")
    expect(reordered.commands[0]?.warnings).not.toContain("mutated warning")
  })
})

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
    recordedAt: "2026-08-09T08:08:00.000Z",
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
    recordedAt: "2026-08-09T08:00:00.000Z",
  })
  return buildNonCncPromotedQuoteOfferExportLiveAdapterExecutionPlan({
    decision,
    decisionHistory: snapshot,
    requestedAt: "2026-08-09T08:05:00.000Z",
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
  requestedAt: "2026-08-09T07:55:00.000Z",
  requestedBy: actor,
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}
