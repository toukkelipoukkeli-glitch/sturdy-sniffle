import { describe, expect, it } from "vitest"

import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_VERSION,
  buildNonCncPromotedQuoteApplicationExecutionRun,
  fingerprintNonCncPromotedQuoteApplicationExecutionRun,
  type NonCncPromotedQuoteApplicationCommandOutcomeInput,
} from "./nonCncPromotedQuoteApplicationExecution"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationRecord,
} from "./nonCncPromotedQuoteApplicationPersistence"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION } from "./nonCncPromotedQuoteApplicationPlan"

describe("non-CNC promoted quote application execution", () => {
  it("builds blocked dry-run audits without leaking external command ids", () => {
    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord: blockedApplicationRecord(),
      executedAt: "2026-06-28T09:00:00.000Z",
      mode: "dry_run",
    })

    expect(run.executionVersion).toBe(NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_VERSION)
    expect(run.status).toBe("blocked")
    expect(run.mode).toBe("dry_run")
    expect(run.commands).toHaveLength(3)
    expect(run.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(run.commands.every((command) => command.externalId === undefined)).toBe(true)
    expect(run.nextActions).toEqual(["Promoted quote read model is not ready."])
    expect(run.executionFingerprint).toBe(fingerprintNonCncPromotedQuoteApplicationExecutionRun(run))
  })

  it("prepares ready dry-runs with deterministic command idempotency keys", () => {
    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord: readyApplicationRecord(),
      executedAt: "2026-06-28T09:00:00.000Z",
      mode: "dry_run",
    })

    expect(run.status).toBe("prepared")
    expect(run.commands.map((command) => command.status)).toEqual(["prepared", "prepared", "prepared"])
    expect(run.commands.every((command) => command.externalId === undefined)).toBe(true)
    expect(run.commands.map((command) => command.idempotencyKey)).toEqual([
      "non-cnc-application-execution:non-cnc-promoted-quote-application-rfq-demo-204-package-ready:replace-active-quote",
      "non-cnc-application-execution:non-cnc-promoted-quote-application-rfq-demo-204-package-ready:refresh-offer-workspace",
      "non-cnc-application-execution:non-cnc-promoted-quote-application-rfq-demo-204-package-ready:open-offer-builder",
    ])
    expect(run.nextActions).toEqual(["Review 3 prepared non-CNC application commands before committing."])
  })

  it("builds succeeded commit audits from applied outcomes", () => {
    const outcomes: NonCncPromotedQuoteApplicationCommandOutcomeInput[] = [
      {
        externalId: "execution:quote-snapshot:123",
        key: "replace_active_quote",
        message: "Quote snapshot applied.",
        status: "applied",
      },
      {
        externalId: "execution:offer-readiness:123",
        key: "refresh_offer_workspace",
        message: "Offer readiness refreshed.",
        status: "applied",
      },
      {
        externalId: "execution:offer-builder:123",
        key: "open_offer_builder",
        message: "Offer builder opened.",
        status: "applied",
      },
    ]

    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord: readyApplicationRecord(),
      commandOutcomes: outcomes,
      executedAt: "2026-06-28T09:05:00.000Z",
      mode: "commit",
    })

    expect(run.status).toBe("succeeded")
    expect(run.commands.map((command) => command.status)).toEqual(["applied", "applied", "applied"])
    expect(run.commands.map((command) => command.externalId)).toEqual([
      "execution:quote-snapshot:123",
      "execution:offer-readiness:123",
      "execution:offer-builder:123",
    ])
    expect(run.nextActions).toEqual(["Non-CNC promoted quote application completed."])
    expect(run.warnings).toEqual(["Material certificate required."])
  })

  it("keeps failed and pending commit commands explicit", () => {
    const run = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord: readyApplicationRecord(),
      commandOutcomes: [
        { key: "replace_active_quote", status: "applied" },
        { key: "refresh_offer_workspace", status: "failed", message: "Offer readiness adapter unavailable.", warnings: ["Retry queued."] },
      ],
      executedAt: "2026-06-28T09:10:00.000Z",
      mode: "commit",
    })

    expect(run.status).toBe("partial")
    expect(run.commands.map((command) => command.status)).toEqual(["applied", "failed", "pending"])
    expect(run.nextActions).toEqual([
      "Resolve failed non-CNC application command: Refresh offer workspace.",
      "Record application outcome for non-CNC application command: Open offer builder.",
    ])
    expect(run.warnings).toContain("Refresh offer workspace: Retry queued.")
    expect(run.warnings).toContain("Refresh offer workspace failed: Offer readiness adapter unavailable.")
  })

  it("rejects impossible or duplicate command outcomes", () => {
    expect(() =>
      buildNonCncPromotedQuoteApplicationExecutionRun({
        actor: "FactoryBid Operator",
        applicationRecord: readyApplicationRecord(),
        commandOutcomes: [{ key: "replace_active_quote", status: "applied" }],
        executedAt: "2026-06-28T09:15:00.000Z",
        mode: "dry_run",
      }),
    ).toThrow("cannot be recorded for a dry-run")
    expect(() =>
      buildNonCncPromotedQuoteApplicationExecutionRun({
        actor: "FactoryBid Operator",
        applicationRecord: blockedApplicationRecord(),
        commandOutcomes: [{ key: "replace_active_quote", status: "applied" }],
        executedAt: "2026-06-28T09:15:00.000Z",
        mode: "commit",
      }),
    ).toThrow("cannot be recorded for a blocked non-CNC application command")
    expect(() =>
      buildNonCncPromotedQuoteApplicationExecutionRun({
        actor: "FactoryBid Operator",
        applicationRecord: readyApplicationRecord(),
        commandOutcomes: [
          { key: "replace_active_quote", status: "applied" },
          { key: "replace_active_quote", status: "failed" },
        ],
        executedAt: "2026-06-28T09:15:00.000Z",
        mode: "commit",
      }),
    ).toThrow("duplicate command outcome replace_active_quote")
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
