import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft } from "./nonCncPromotedQuoteApplicationExecutionOutcomeDraft"
import {
  buildNonCncPromotedQuoteApplicationOutcomeCommitPlan,
  buildNonCncPromotedQuoteApplicationOutcomeCommitRun,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION,
} from "./nonCncPromotedQuoteApplicationOutcomeCommit"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationRecord,
} from "./nonCncPromotedQuoteApplicationPersistence"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_PLAN_VERSION } from "./nonCncPromotedQuoteApplicationPlan"

describe("non-CNC promoted quote application outcome commit adapter", () => {
  it("builds a ready commit plan and committed execution run from reviewed application outcome drafts", () => {
    const applicationRecord = readyApplicationRecord()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)

    const result = buildNonCncPromotedQuoteApplicationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      executedAt: "2026-06-28T10:15:00.000Z",
      outcomeDraft,
    })

    expect(result.commitPlan).toMatchObject({
      applicationId: applicationRecord.applicationId,
      applicationRecordId: applicationRecord.applicationRecordId,
      blockerLabels: [],
      commandOutcomeCount: 3,
      commitVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION,
      packageId: applicationRecord.packageId,
      selectedPlanId: applicationRecord.selectedPlanId,
      status: "ready",
      targetRfqId: applicationRecord.targetRfqId,
    })
    expect(result.commitPlan.nextOperatorMessage).toBe("Commit 3 reviewed non-CNC application outcomes.")
    expect(result.commitPlan.mutationBoundary).toContain("active RFQ quote, offer, and release state stay unchanged")
    expect(result.commitPlan.commandOutcomes.map((outcome) => outcome.key)).toEqual([
      "replace_active_quote",
      "refresh_offer_workspace",
      "open_offer_builder",
    ])
    expect(result.executionRun).toMatchObject({
      applicationId: applicationRecord.applicationId,
      applicationRecordId: applicationRecord.applicationRecordId,
      mode: "commit",
      packageId: applicationRecord.packageId,
      status: "succeeded",
      targetRfqId: applicationRecord.targetRfqId,
    })
    expect(result.executionRun?.commands.map((command) => command.status)).toEqual(["applied", "applied", "applied"])
  })

  it("keeps blocked drafts outcome-free and commit-run-free", () => {
    const applicationRecord = blockedApplicationRecord()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)

    const result = buildNonCncPromotedQuoteApplicationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      applicationRecord,
      executedAt: "2026-06-28T10:15:00.000Z",
      outcomeDraft,
    })

    expect(result.commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      packageId: applicationRecord.packageId,
      status: "blocked",
    })
    expect(result.commitPlan.blockerLabels).toContain("Application outcome draft must be ready before commit.")
    expect(result.executionRun).toBeUndefined()
  })

  it("rejects outcome drafts from a different application record", () => {
    const applicationRecord = readyApplicationRecord()
    const outcomeDraft = {
      ...buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord),
      applicationRecordId: "non-cnc-promoted-quote-application-record:other",
    }

    expect(() =>
      buildNonCncPromotedQuoteApplicationOutcomeCommitPlan({
        applicationRecord,
        outcomeDraft,
      }),
    ).toThrow("application outcome draft does not match application record: applicationRecordId")
  })

  it("blocks malformed ready drafts that are missing a suggested outcome", () => {
    const applicationRecord = readyApplicationRecord()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)
    const malformedDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.map((command, index) =>
        index === 0 ? { ...command, suggestedOutcome: undefined } : command,
      ),
    }

    const commitPlan = buildNonCncPromotedQuoteApplicationOutcomeCommitPlan({
      applicationRecord,
      outcomeDraft: malformedDraft,
    })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain("Missing suggested application outcome for Apply promoted quote.")
  })

  it("blocks ready drafts with missing application record commands", () => {
    const applicationRecord = readyApplicationRecord()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)
    const staleDraft = {
      ...outcomeDraft,
      commandOutcomes: outcomeDraft.commandOutcomes.slice(0, -1),
    }

    const commitPlan = buildNonCncPromotedQuoteApplicationOutcomeCommitPlan({
      applicationRecord,
      outcomeDraft: staleDraft,
    })

    expect(commitPlan).toMatchObject({
      commandOutcomeCount: 0,
      commandOutcomes: [],
      status: "blocked",
    })
    expect(commitPlan.blockerLabels).toContain("Application outcome draft command list does not match application record commands.")
  })

  it("clones suggested outcomes so later draft mutation cannot change commit inputs", () => {
    const applicationRecord = readyApplicationRecord()
    const outcomeDraft = buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(applicationRecord)
    const commitPlan = buildNonCncPromotedQuoteApplicationOutcomeCommitPlan({ applicationRecord, outcomeDraft })

    const firstOutcome = outcomeDraft.commandOutcomes[0]?.suggestedOutcome
    if (!firstOutcome) {
      throw new Error("Expected ready application outcome draft")
    }
    firstOutcome.externalId = "mutated-after-plan"
    firstOutcome.warnings?.push("mutated warning")

    expect(commitPlan.commandOutcomes[0]).toMatchObject({
      externalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
      key: "replace_active_quote",
      warnings: ["Material certificate required."],
    })
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
