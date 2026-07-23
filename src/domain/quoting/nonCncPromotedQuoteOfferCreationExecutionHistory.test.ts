import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferCreationExecutionRun } from "./nonCncPromotedQuoteOfferCreationExecution"
import { buildNonCncPromotedQuoteOfferCreationExecutionHistorySummary } from "./nonCncPromotedQuoteOfferCreationExecutionHistory"
import { createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence } from "./nonCncPromotedQuoteOfferCreationExecutionPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
  type NonCncPromotedQuoteOfferCreationPlan,
} from "./nonCncPromotedQuoteOfferCreationPlan"

const request = {
  actor: "FactoryBid Operator",
  executedAt: "2026-07-23T14:30:00.000Z",
}

describe("non-CNC promoted quote offer creation execution history", () => {
  it("summarizes an empty execution history", () => {
    const summary = buildNonCncPromotedQuoteOfferCreationExecutionHistorySummary(
      createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence().snapshot(),
    )

    expect(summary).toMatchObject({
      actionItems: ["Run a dry-run customer-offer creation audit before enabling live offer adapters."],
      commandCount: 0,
      exportText: expect.stringContaining("Recent runs:\n- none"),
      operatorSummary: "No customer-offer creation execution audits have been recorded yet.",
      severity: "neutral",
      status: "empty",
      title: "No offer creation history",
      totalRuns: 0,
    })
  })

  it("summarizes succeeded offer creation execution evidence", async () => {
    const plan = readyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence()
    const run = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      commandOutcomes: [
        { externalId: "offer-draft:rfq-demo-204", key: "draft_customer_offer", status: "succeeded" },
        { externalId: "offer-export:rfq-demo-204", key: "prepare_export_package", status: "succeeded" },
        { externalId: "release-review:rfq-demo-204", key: "open_release_review", status: "succeeded" },
      ],
      mode: "commit",
      plan,
    })

    const summary = buildNonCncPromotedQuoteOfferCreationExecutionHistorySummary(await adapter.recordRun(run))

    expect(summary).toMatchObject({
      actionItems: [
        "Review succeeded customer-offer creation evidence before wiring active offer state.",
        "Review 1 warning before customer-visible release.",
      ],
      commandCount: 3,
      creationPlanIds: [plan.creationPlanId],
      latestRun: expect.objectContaining({
        executionFingerprint: run.executionFingerprint,
        status: "succeeded",
        succeededCommandCount: 3,
      }),
      operatorSummary: "Latest customer-offer creation execution succeeded with 3 commands recorded for review-only offer wiring.",
      packageIds: [plan.packageId],
      releaseExecutionFingerprints: [plan.releaseExecutionFingerprint],
      selectedPlanIds: [plan.selectedPlanId],
      severity: "success",
      status: "succeeded",
      succeededCommandCount: 3,
      targetRfqIds: [plan.targetRfqId],
      title: "Offer creation history ready",
      totalRuns: 1,
      warningCount: 1,
    })
    expect(summary.exportText).toContain(`Latest run: ${request.executedAt} | succeeded | commit | ${run.executionFingerprint}`)
    expect(summary.exportText).toContain(`Release executions: ${plan.releaseExecutionFingerprint}`)
  })

  it("summarizes partial and pending command histories with newest run first", async () => {
    const plan = readyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence()
    const pendingRun = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      actor: request.actor,
      executedAt: "2026-07-23T14:35:00.000Z",
      mode: "commit",
      plan,
    })
    const partialRun = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      actor: request.actor,
      commandOutcomes: [
        { externalId: "offer-draft:rfq-demo-204", key: "draft_customer_offer", status: "succeeded" },
        { key: "prepare_export_package", message: "PDF renderer unavailable", status: "failed" },
      ],
      executedAt: "2026-07-23T14:40:00.000Z",
      mode: "commit",
      plan,
    })

    await adapter.recordRun(pendingRun)
    const summary = buildNonCncPromotedQuoteOfferCreationExecutionHistorySummary(await adapter.recordRun(partialRun), {
      recentRunLimit: 1,
    })

    expect(summary).toMatchObject({
      actionItems: [
        "Review failed or partial customer-offer creation command outcomes before retrying.",
        "Review 2 warnings before customer-visible release.",
      ],
      commandCount: 6,
      failedCommandCount: 1,
      pendingActionCount: 2,
      pendingCommandCount: 4,
      recentRuns: [expect.objectContaining({ executionFingerprint: partialRun.executionFingerprint })],
      severity: "attention",
      status: "needs_review",
      succeededCommandCount: 1,
      title: "Offer creation history needs review",
      totalRuns: 2,
      warningCount: 2,
    })
    expect(summary.latestRun?.executionFingerprint).toBe(partialRun.executionFingerprint)
    expect(summary.exportText).toContain("Recent runs:")
    expect(summary.exportText).toContain(partialRun.executionFingerprint)
    expect(summary.exportText).not.toContain(pendingRun.executionFingerprint)
  })

  it("withholds blocked ready-only ids from the history summary", async () => {
    const plan = {
      ...readyPlan(),
      blockerLabels: ["Offer-wiring readiness is not ready."],
      quoteSummary: undefined,
      releaseExecutionFingerprint: undefined,
      status: "blocked",
    } satisfies NonCncPromotedQuoteOfferCreationPlan
    const adapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence()
    const run = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      mode: "dry_run",
      plan,
    })

    const summary = buildNonCncPromotedQuoteOfferCreationExecutionHistorySummary(await adapter.recordRun(run))

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve customer-offer creation blockers before recording another execution.",
        "Review 1 warning before customer-visible release.",
      ],
      blockedCommandCount: 3,
      releaseExecutionFingerprints: [],
      severity: "attention",
      status: "blocked",
      targetRfqIds: [],
      title: "Offer creation history blocked",
    })
    expect(summary.latestRun).toMatchObject({
      releaseExecutionFingerprint: undefined,
      targetRfqId: undefined,
    })
    expect(summary.exportText).toContain("Target RFQs: none")
    expect(summary.exportText).toContain("Release executions: none")
  })

  it("rejects invalid recent run limits", () => {
    expect(() =>
      buildNonCncPromotedQuoteOfferCreationExecutionHistorySummary(
        createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence().snapshot(),
        { recentRunLimit: 0 },
      ),
    ).toThrow("recentRunLimit must be a positive safe integer")
  })
})

function readyPlan(): NonCncPromotedQuoteOfferCreationPlan {
  const creationPlanId =
    "non-cnc-promoted-quote-offer-creation-plan:rfq-demo-204:non-cnc-quote-promotion-command-package-rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal"
  return {
    blockerLabels: [],
    commandCount: 3,
    commands: [
      command("draft_customer_offer", "Draft customer offer", creationPlanId),
      command("prepare_export_package", "Prepare export package", creationPlanId),
      command("open_release_review", "Open release review", creationPlanId),
    ],
    creationPlanId,
    nextOperatorMessage: "Non-CNC promoted quote is ready for a future customer-offer creation adapter.",
    offerCreationBoundary:
      "Offer creation plans are deterministic adapter descriptors only; building the plan does not create customer offers, export packages, release plans, or connector side effects.",
    packageId: "non-cnc-quote-promotion-command-package:rfq-demo-204",
    planVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
    quoteSummary: {
      currency: "EUR",
      leadTimeDays: 12,
      partNumber: "SM-120-BRACKET",
      processLabel: "Sheet metal",
      quantity: 20,
      totalCents: 54905,
      unitPriceCents: 2745,
    },
    releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-succeeded",
    requestedAt: "2026-07-23T13:30:00.000Z",
    requestedBy: request.actor,
    reviewWarnings: ["Offer wiring has a review warning."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal",
    status: "ready",
    targetRfqId: "rfq-demo-204",
  }
}

function command(
  key: NonCncPromotedQuoteOfferCreationPlan["commands"][number]["key"],
  label: string,
  creationPlanId: string,
): NonCncPromotedQuoteOfferCreationPlan["commands"][number] {
  return {
    blockerLabels: [],
    idempotencyKey: `${creationPlanId}:${key}`,
    key,
    label,
    offerBuilderExternalId: "offer-builder:rfq-demo-204:package",
    offerReadinessExternalId: "offer-readiness:rfq-demo-204:sheet-metal:54905",
    quoteExternalId: "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
    releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-succeeded",
    reviewWarnings: ["Offer wiring has a review warning."],
    status: "ready",
    targetRfqId: "rfq-demo-204",
  }
}
