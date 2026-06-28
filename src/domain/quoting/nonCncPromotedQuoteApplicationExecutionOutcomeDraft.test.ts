import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteApplicationExecutionRun } from "./nonCncPromotedQuoteApplicationExecution"
import {
  buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_OUTCOME_DRAFT_VERSION,
} from "./nonCncPromotedQuoteApplicationExecutionOutcomeDraft"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationRecord,
} from "./nonCncPromotedQuoteApplicationPersistence"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION } from "./nonCncPromotedQuoteApplicationPlan"

describe("non-CNC promoted quote application execution outcome drafts", () => {
  it("builds deterministic applied outcomes for ready application records", () => {
    const applicationRecord = readyApplicationRecord()

    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)
    const suggestedOutcomes = outcomeDraft.commandOutcomes.flatMap((command) =>
      command.suggestedOutcome ? [command.suggestedOutcome] : [],
    )
    const committedRun = buildNonCncPromotedQuoteApplicationExecutionRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      commandOutcomes: suggestedOutcomes,
      executedAt: "2026-06-28T09:05:00.000Z",
      mode: "commit",
    })

    expect(outcomeDraft).toMatchObject({
      applicationId: applicationRecord.applicationId,
      applicationRecordId: applicationRecord.applicationRecordId,
      blockedOutcomeCount: 0,
      draftVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_OUTCOME_DRAFT_VERSION,
      packageId: applicationRecord.packageId,
      readyOutcomeCount: 3,
      selectedPlanId: applicationRecord.selectedPlanId,
      status: "ready",
      targetRfqId: applicationRecord.targetRfqId,
    })
    expect(outcomeDraft.nextOperatorMessage).toBe("Review and commit 3 non-CNC application outcomes.")
    expect(outcomeDraft.mutationBoundary).toContain("active RFQ quote, offer, and release state stay unchanged")
    expect(outcomeDraft.commandOutcomes.map((command) => command.key)).toEqual([
      "replace_active_quote",
      "refresh_offer_workspace",
      "open_offer_builder",
    ])
    expect(outcomeDraft.commandOutcomes.map((command) => command.externalId)).toEqual([
      "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
      "offer-readiness:rfq-demo-204:sheet-metal:54905",
      "offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal",
    ])
    expect(suggestedOutcomes).toEqual([
      {
        externalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
        key: "replace_active_quote",
        message: "Prepared active RFQ quote replacement from promoted non-CNC quote.",
        status: "applied",
        warnings: ["Material certificate required."],
      },
      {
        externalId: "offer-readiness:rfq-demo-204:sheet-metal:54905",
        key: "refresh_offer_workspace",
        message: "Prepared offer workspace refresh from promoted non-CNC quote.",
        status: "applied",
        warnings: ["Material certificate required."],
      },
      {
        externalId: "offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal",
        key: "open_offer_builder",
        message: "Prepared offer builder handoff from promoted non-CNC quote.",
        status: "applied",
        warnings: ["Material certificate required."],
      },
    ])
    expect(committedRun.status).toBe("succeeded")
    expect(committedRun.commands.map((command) => command.status)).toEqual(["applied", "applied", "applied"])
    expect(committedRun.warnings).toEqual([
      "Material certificate required.",
      "Apply promoted quote: Material certificate required.",
      "Refresh offer workspace: Material certificate required.",
      "Open offer builder: Material certificate required.",
    ])
  })

  it("keeps blocked application records outcome-free", () => {
    const applicationRecord = blockedApplicationRecord()

    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)

    expect(outcomeDraft).toMatchObject({
      applicationId: applicationRecord.applicationId,
      blockedOutcomeCount: 3,
      draftVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_OUTCOME_DRAFT_VERSION,
      packageId: applicationRecord.packageId,
      readyOutcomeCount: 0,
      status: "blocked",
      targetRfqId: applicationRecord.targetRfqId,
    })
    expect(outcomeDraft.nextOperatorMessage).toBe("Promoted quote read model is not ready.")
    expect(outcomeDraft.commandOutcomes).toHaveLength(3)
    expect(outcomeDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.externalId === undefined)).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })

  it("suppresses suggested outcomes when the record is blocked even if commands carry external ids", () => {
    const readyRecord = readyApplicationRecord()
    const applicationRecord: NonCncPromotedQuoteApplicationRecord = {
      ...readyRecord,
      blockerCount: 1,
      blockerLabels: ["Manager review required."],
      disposition: "review_only",
      quoteSnapshot: undefined,
      readyCommandCount: 0,
      status: "blocked",
    }

    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.readyOutcomeCount).toBe(0)
    expect(outcomeDraft.blockedOutcomeCount).toBe(3)
    expect(outcomeDraft.nextOperatorMessage).toBe("Manager review required.")
    expect(outcomeDraft.commandOutcomes.every((command) => command.status === "blocked")).toBe(true)
    expect(outcomeDraft.commandOutcomes.every((command) => command.suggestedOutcome === undefined)).toBe(true)
  })

  it("keeps command-level blocker copy for ready records with a blocked command", () => {
    const readyRecord = readyApplicationRecord()
    const applicationRecord: NonCncPromotedQuoteApplicationRecord = {
      ...readyRecord,
      commands: readyRecord.commands.map((command) =>
        command.key === "refresh_offer_workspace"
          ? {
              ...command,
              status: "blocked",
            }
          : command,
      ),
      readyCommandCount: 2,
    }

    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.readyOutcomeCount).toBe(2)
    expect(outcomeDraft.blockedOutcomeCount).toBe(1)
    expect(outcomeDraft.nextOperatorMessage).toBe("Refresh offer workspace is not ready.")
    expect(outcomeDraft.commandOutcomes.map((command) => command.status)).toEqual(["ready", "blocked", "ready"])
    expect(outcomeDraft.commandOutcomes.map((command) => command.blockerLabels)).toEqual([
      [],
      ["Refresh offer workspace is not ready."],
      [],
    ])
    expect(outcomeDraft.commandOutcomes.map((command) => command.suggestedOutcome?.status)).toEqual([
      "applied",
      undefined,
      "applied",
    ])
  })

  it("keeps command-level blocker copy for ready records with a missing external id", () => {
    const readyRecord = readyApplicationRecord()
    const applicationRecord: NonCncPromotedQuoteApplicationRecord = {
      ...readyRecord,
      commands: readyRecord.commands.map((command) =>
        command.key === "open_offer_builder"
          ? {
              ...command,
              externalId: undefined,
            }
          : command,
      ),
      readyCommandCount: 2,
    }

    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)

    expect(outcomeDraft.status).toBe("blocked")
    expect(outcomeDraft.readyOutcomeCount).toBe(2)
    expect(outcomeDraft.blockedOutcomeCount).toBe(1)
    expect(outcomeDraft.nextOperatorMessage).toBe("Open offer builder is missing its external id.")
    expect(outcomeDraft.commandOutcomes.map((command) => command.status)).toEqual(["ready", "ready", "blocked"])
    expect(outcomeDraft.commandOutcomes.map((command) => command.blockerLabels)).toEqual([
      [],
      [],
      ["Open offer builder is missing its external id."],
    ])
    expect(outcomeDraft.commandOutcomes.map((command) => command.suggestedOutcome?.status)).toEqual([
      "applied",
      "applied",
      undefined,
    ])
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
