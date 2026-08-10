import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
  fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecution"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThrough"
import {
  buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistory"
import {
  createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_READINESS_VERSION,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadiness"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-10T15:45:00.000Z"
const requestedAt = "2026-08-10T15:40:00.000Z"

describe("non-CNC live-adapter final-gate follow-through execution", () => {
  it("blocks empty follow-through plans without exposing live evidence", () => {
    const plan = blockedFollowThroughPlan()

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      executedAt,
      followThrough: plan,
      mode: "commit",
    })

    expect(run).toMatchObject({
      appliedCommandCount: 0,
      blockedCommandCount: 5,
      blockedRecordCount: 0,
      commandCount: 5,
      executionVersion:
        NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_LIVE_ADAPTER_APPLY_EXECUTION_FINAL_GATE_FOLLOW_THROUGH_EXECUTION_VERSION,
      followThroughFingerprint: plan.followThroughFingerprint,
      followThroughId: plan.followThroughId,
      historyRecordCount: 0,
      latestApplyPlanId: undefined,
      latestCommitRecordId: undefined,
      latestCommittedExecutionFingerprint: undefined,
      latestExecutionFingerprint: undefined,
      latestSourceExecutionFingerprint: undefined,
      mode: "commit",
      plannedCommandCount: 0,
      readinessRecordId: undefined,
      readyRecordCount: 0,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(run.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(run.commands.every((command) => command.evidenceFingerprints.length === 0)).toBe(true)
    expect(run.commands.every((command) => command.idempotencyKey === undefined)).toBe(true)
    expect(run.nextActions).toContain(
      "Resolve final-gate follow-through blockers before recording execution outcomes.",
    )
    expect(run.adapterFinalGateFollowThroughExecutionBoundary).toContain("does not create customer offers")
    expect(fingerprintNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun(run)).toBe(
      run.executionFingerprint,
    )
  })

  it("prepares ready final-gate follow-through commands in dry-run mode", () => {
    const plan = readyFollowThroughPlan()

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      executedAt,
      followThrough: plan,
      mode: "dry_run",
    })

    expect(run).toMatchObject({
      appliedCommandCount: 0,
      blockedCommandCount: 0,
      commandCount: 5,
      latestApplyPlanId: plan.latestApplyPlanId,
      latestCommitRecordId: plan.latestCommitRecordId,
      latestCommittedExecutionFingerprint: plan.latestCommittedExecutionFingerprint,
      latestExecutionFingerprint: plan.latestExecutionFingerprint,
      latestSourceExecutionFingerprint: plan.latestSourceExecutionFingerprint,
      mode: "dry_run",
      plannedCommandCount: 5,
      readinessRecordId: plan.readinessRecordId,
      status: "prepared",
      targetRfqId: "rfq-demo-204",
    })
    expect(run.commands.every((command) => command.status === "prepared")).toBe(true)
    expect(run.commands.every((command) => command.evidenceFingerprints.length > 0)).toBe(true)
    expect(run.commands.every((command) => command.idempotencyKey?.startsWith("non-cnc-live-adapter-final-gate:"))).toBe(
      true,
    )
    expect(run.commands.every((command) => command.externalId === undefined)).toBe(true)
    expect(run.nextActions).toEqual(["Review 5 prepared final-gate follow-through commands before committing."])
  })

  it("records deterministic commit outcomes while preserving pending and failed command actions", () => {
    const plan = readyFollowThroughPlan()
    const [first, second, ...remainingCommands] = plan.commands

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      commandOutcomes: [
        {
          externalId: " final-gate-offer-204 ",
          key: first!.key,
          status: "applied",
          warnings: [" copied to local audit ", "copied to local audit"],
        },
        {
          key: second!.key,
          message: "Release packet checksum did not match.",
          status: "failed",
        },
      ],
      executedAt,
      followThrough: plan,
      mode: "commit",
    })

    expect(run.status).toBe("partial")
    expect(run.commands.map((command) => command.status)).toEqual(["applied", "failed", "pending", "pending", "pending"])
    expect(run.appliedCommandCount).toBe(1)
    expect(run.plannedCommandCount).toBe(5)
    expect(run.commands[0]?.externalId).toBe("final-gate-offer-204")
    expect(run.commands[0]?.warnings).toEqual(["copied to local audit"])
    expect(run.commands[1]?.message).toBe("Release packet checksum did not match.")
    expect(run.nextActions).toEqual([
      `Resolve failed final-gate follow-through command: ${second!.label}.`,
      ...remainingCommands.map((command) => `Record final-gate follow-through outcome for command: ${command.label}.`),
    ])
    expect(run.warnings).toContain(`${first!.label}: copied to local audit`)
    expect(run.warnings).toContain(`${second!.label} failed: Release packet checksum did not match.`)
  })

  it("marks complete applied command outcomes as succeeded", () => {
    const plan = readyFollowThroughPlan()

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      commandOutcomes: plan.commands.map((command) => ({
        externalId: `external-${command.key}`,
        key: command.key,
        status: "applied",
      })),
      executedAt,
      followThrough: plan,
      mode: "commit",
    })

    expect(run.status).toBe("succeeded")
    expect(run.appliedCommandCount).toBe(5)
    expect(run.commands.every((command) => command.status === "applied")).toBe(true)
    expect(run.nextActions).toEqual([
      "Review the recorded final-gate follow-through execution audit before enabling live write adapters.",
    ])
  })

  it("rejects impossible command outcomes", () => {
    const readyPlan = readyFollowThroughPlan()
    const blockedPlan = blockedFollowThroughPlan()
    const key = readyPlan.commands[0]!.key

    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        commandOutcomes: [{ key, status: "applied" }],
        executedAt,
        followThrough: readyPlan,
        mode: "dry_run",
      }),
    ).toThrow("cannot be recorded for a dry-run final-gate follow-through execution")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        commandOutcomes: [{ key: "unknown_command", status: "applied" }],
        executedAt,
        followThrough: readyPlan,
        mode: "commit",
      }),
    ).toThrow("does not match a final-gate follow-through command")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        commandOutcomes: [{ key: blockedPlan.commands[0]!.key, status: "applied" }],
        executedAt,
        followThrough: blockedPlan,
        mode: "commit",
      }),
    ).toThrow("cannot be recorded for a blocked final-gate follow-through command")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
        actor,
        commandOutcomes: [
          { key, status: "applied" },
          { key, status: "failed" },
        ],
        executedAt,
        followThrough: readyPlan,
        mode: "commit",
      }),
    ).toThrow(`duplicate command outcome ${key}`)
  })

  it("keeps fingerprints stable for reordered outcomes and returns cloned command data", () => {
    const plan = readyFollowThroughPlan()
    const outcomes = plan.commands.map((command) => ({
      externalId: `external-${command.key}`,
      key: command.key,
      status: "applied" as const,
    }))

    const run = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      commandOutcomes: outcomes,
      executedAt,
      followThrough: plan,
      mode: "commit",
    })
    run.commands[0]!.evidenceFingerprints.push("mutated evidence")
    run.commands[0]!.warnings.push("mutated warning")

    const reordered = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughExecutionRun({
      actor,
      commandOutcomes: [...outcomes].reverse(),
      executedAt,
      followThrough: plan,
      mode: "commit",
    })

    expect(reordered.executionFingerprint).toBe(run.executionFingerprint)
    expect(reordered.commands[0]?.evidenceFingerprints).not.toContain("mutated evidence")
    expect(reordered.commands[0]?.warnings).not.toContain("mutated warning")
  })
})

function blockedFollowThroughPlan(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  const history = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence().snapshot(),
  )
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: history,
    requestedAt,
    requestedBy: actor,
  })
}

function readyFollowThroughPlan(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan {
  const ready = readyRecord()
  const history = buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessHistorySummary(
    createLocalNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessPersistence({
      initialSnapshot: { records: [ready] },
    }).snapshot(),
  )
  return buildNonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionFinalGateFollowThroughPlan({
    readinessHistory: history,
    requestedAt,
    requestedBy: actor,
  })
}

function readyRecord(): NonCncPromotedQuoteOfferExportLiveAdapterApplyExecutionReadinessRecord {
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
    recordedAt: "2026-08-10T15:30:00.000Z",
    recordedBy: actor,
    requestedAt: "2026-08-10T15:25:00.000Z",
    requestedBy: actor,
    reviewWarnings: ["Latest apply execution record has 1 warning(s)."],
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
  }
}
