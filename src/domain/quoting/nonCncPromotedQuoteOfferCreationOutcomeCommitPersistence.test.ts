import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferCreationExecutionRun } from "./nonCncPromotedQuoteOfferCreationExecution"
import { buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft } from "./nonCncPromotedQuoteOfferCreationExecutionOutcomeDraft"
import { buildNonCncPromotedQuoteOfferCreationOutcomeCommitRun } from "./nonCncPromotedQuoteOfferCreationOutcomeCommit"
import {
  createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
  type NonCncPromotedQuoteOfferCreationPlan,
} from "./nonCncPromotedQuoteOfferCreationPlan"

const request = {
  actor: "FactoryBid Operator",
  executedAt: "2026-07-23T14:30:00.000Z",
}

describe("non-CNC promoted quote offer creation outcome commit persistence", () => {
  it("records blocked customer-offer creation commit plans as review-only snapshots", async () => {
    const plan = blockedPlan()
    const { commitPlan } = buildCommitRun(plan)
    const adapter = createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      recordedAt: "2026-07-23T14:35:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      blockedCreationPlanIds: [plan.creationPlanId],
      commitReadyCreationPlanIds: [],
      outcomeCount: 0,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
      recordCount: 1,
      releaseExecutionFingerprints: [],
      statusCounts: { blocked: 1 },
      targetRfqIds: [],
    })
    expect(snapshot.latestRecord).toMatchObject({
      commandOutcomeCount: 0,
      disposition: "review_only",
      executionFingerprint: undefined,
      releaseExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(snapshot.latestRecord?.blockerLabels).toContain("Customer-offer creation outcome draft must be ready before commit.")
  })

  it("records ready customer-offer creation commit plans with the committed execution fingerprint", async () => {
    const plan = readyPlan()
    const { commitPlan, executionRun } = buildCommitRun(plan)
    if (!executionRun) {
      throw new Error("Expected ready customer-offer creation commit execution run")
    }
    const adapter = createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence()

    const snapshot = await adapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-07-23T14:40:00.000Z",
      recordedBy: "FactoryBid Operator",
    })

    expect(snapshot).toMatchObject({
      blockedCreationPlanIds: [],
      commitReadyCreationPlanIds: [plan.creationPlanId],
      outcomeCount: 3,
      recordCount: 1,
      releaseExecutionFingerprints: [plan.releaseExecutionFingerprint],
      statusCounts: { ready: 1 },
      targetRfqIds: [plan.targetRfqId],
      warningCount: 1,
    })
    expect(snapshot.latestRecord).toMatchObject({
      commandOutcomeCount: 3,
      creationPlanId: plan.creationPlanId,
      disposition: "commit_ready",
      executionFingerprint: executionRun.executionFingerprint,
      packageId: plan.packageId,
      releaseExecutionFingerprint: plan.releaseExecutionFingerprint,
      status: "ready",
      targetRfqId: plan.targetRfqId,
    })
    expect(snapshot.latestRecord?.reviewWarnings).toEqual(["Offer wiring has a review warning."])
  })

  it("rejects execution runs that do not match the customer-offer creation commit plan", async () => {
    const plan = readyPlan()
    const { commitPlan, executionRun } = buildCommitRun(plan)
    if (!executionRun) {
      throw new Error("Expected ready customer-offer creation commit execution run")
    }
    const adapter = createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence()

    await expect(
      adapter.recordCommit({
        commitPlan,
        recordedAt: "2026-07-23T14:40:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("ready customer-offer creation outcome commit plans require a commit execution run")

    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: { ...executionRun, mode: "dry_run" },
        recordedAt: "2026-07-23T14:40:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("customer-offer creation outcome commit execution run must use commit mode")

    await expect(
      adapter.recordCommit({
        commitPlan,
        executionRun: { ...executionRun, status: "partial" },
        recordedAt: "2026-07-23T14:40:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("customer-offer creation outcome commit execution run must have succeeded status")

    await expectMismatchedExecution(adapter, commitPlan, { creationPlanId: "other-creation-plan" }, "creationPlanId")
    await expectMismatchedExecution(
      adapter,
      commitPlan,
      { planVersion: "unsupported-plan-version" as never },
      "planVersion",
    )
    await expectMismatchedExecution(adapter, commitPlan, { packageId: "other-package" }, "packageId")
    await expectMismatchedExecution(
      adapter,
      commitPlan,
      { selectedPlanId: "non-cnc-promotion:other" },
      "selectedPlanId",
    )
    await expectMismatchedExecution(adapter, commitPlan, { targetRfqId: "rfq-other" }, "targetRfqId")
    await expectMismatchedExecution(
      adapter,
      commitPlan,
      { releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-other" },
      "releaseExecutionFingerprint",
    )

    await expect(
      adapter.recordCommit({
        commitPlan: {
          ...commitPlan,
          status: "blocked",
        },
        executionRun,
        recordedAt: "2026-07-23T14:40:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("blocked customer-offer creation outcome commit plans cannot be recorded with an execution run")

    await expect(
      adapter.recordCommit({
        commitPlan: {
          ...commitPlan,
          commandOutcomeCount: commitPlan.commandOutcomeCount + 1,
        },
        executionRun,
        recordedAt: "2026-07-23T14:40:00.000Z",
        recordedBy: "FactoryBid Operator",
      }),
    ).rejects.toThrow("commandOutcomeCount must equal commandOutcomes length")
  })

  it("deduplicates seeded records by commit id and returns cloned snapshots", async () => {
    const plan = readyPlan()
    const { commitPlan, executionRun } = buildCommitRun(plan)
    if (!executionRun) {
      throw new Error("Expected ready customer-offer creation commit execution run")
    }
    const adapter = createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence()
    const seededRecord = (
      await adapter.recordCommit({
        commitPlan,
        executionRun,
        recordedAt: "2026-07-23T14:40:00.000Z",
        recordedBy: "FactoryBid Operator",
      })
    ).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded customer-offer creation commit record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            recordedAt: "2026-07-23T14:45:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: [],
            warningCount: 0,
          },
        ],
      },
    })
    const reversedSeededAdapter = createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            recordedAt: "2026-07-23T14:45:00.000Z",
            recordedBy: "Replacement Operator",
            reviewWarnings: [],
            warningCount: 0,
          },
          seededRecord,
        ],
      },
    })

    const snapshot = seededAdapter.snapshot()
    snapshot.records[0]?.reviewWarnings.push("mutated outside adapter")
    snapshot.commitReadyCreationPlanIds.push("mutated-plan")

    expect(seededAdapter.snapshot()).toMatchObject({
      commitReadyCreationPlanIds: [plan.creationPlanId],
      outcomeCount: 3,
      recordCount: 1,
      warningCount: 0,
    })
    expect(seededAdapter.snapshot().latestRecord).toMatchObject({
      recordedBy: "Replacement Operator",
      warningCount: 0,
    })
    expect(reversedSeededAdapter.snapshot()).toEqual(seededAdapter.snapshot())

    await seededAdapter.recordCommit({
      commitPlan,
      executionRun,
      recordedAt: "2026-07-23T14:50:00.000Z",
      recordedBy: "Live Replacement Operator",
    })
    expect(seededAdapter.snapshot()).toMatchObject({
      commitReadyCreationPlanIds: [plan.creationPlanId],
      outcomeCount: 3,
      recordCount: 1,
      warningCount: 1,
    })
    expect(seededAdapter.snapshot().latestRecord).toMatchObject({
      recordedBy: "Live Replacement Operator",
      warningCount: 1,
    })
  })

  it("rejects invalid seeded customer-offer creation commit records", async () => {
    const plan = readyPlan()
    const { commitPlan, executionRun } = buildCommitRun(plan)
    if (!executionRun) {
      throw new Error("Expected ready customer-offer creation commit execution run")
    }
    const adapter = createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence()
    const seededRecord = (
      await adapter.recordCommit({
        commitPlan,
        executionRun,
        recordedAt: "2026-07-23T14:40:00.000Z",
        recordedBy: "FactoryBid Operator",
      })
    ).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded customer-offer creation commit record")
    }

    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, recordedAt: "tomorrow" }],
        },
      }),
    ).toThrow("recordedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, blockerCount: 1 }],
        },
      }),
    ).toThrow("blockerCount must equal blockerLabels length")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executionFingerprint: undefined }],
        },
      }),
    ).toThrow("ready customer-offer creation outcome commit records require an executionFingerprint")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              commitRecordId: "non-cnc-offer-creation-outcome-commit:other-plan",
            },
          ],
        },
      }),
    ).toThrow("commitRecordId must match creationPlanId")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              disposition: "review_only",
            },
          ],
        },
      }),
    ).toThrow("ready customer-offer creation outcome commit records must use commit_ready disposition")
  })
})

function buildCommitRun(plan: NonCncPromotedQuoteOfferCreationPlan) {
  const outcomeDraft = buildNonCncPromotedQuoteOfferCreationExecutionOutcomeDraft(
    buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      mode: "dry_run",
      plan,
    }),
  )
  return buildNonCncPromotedQuoteOfferCreationOutcomeCommitRun({
    ...request,
    outcomeDraft,
    plan,
  })
}

async function expectMismatchedExecution(
  adapter: ReturnType<typeof createLocalNonCncPromotedQuoteOfferCreationOutcomeCommitPersistence>,
  commitPlan: ReturnType<typeof buildCommitRun>["commitPlan"],
  executionPatch: Partial<ReturnType<typeof buildCommitRun>["executionRun"]>,
  fieldName: string,
) {
  const { executionRun } = buildCommitRun(readyPlan())
  if (!executionRun) {
    throw new Error("Expected ready customer-offer creation commit execution run")
  }

  await expect(
    adapter.recordCommit({
      commitPlan,
      executionRun: {
        ...executionRun,
        ...executionPatch,
      },
      recordedAt: "2026-07-23T14:40:00.000Z",
      recordedBy: "FactoryBid Operator",
    }),
  ).rejects.toThrow(`customer-offer creation outcome commit execution run does not match commit plan: ${fieldName}`)
}

function blockedPlan(): NonCncPromotedQuoteOfferCreationPlan {
  return {
    ...readyPlan(),
    blockerLabels: ["Offer-wiring readiness is not ready."],
    quoteSummary: undefined,
    releaseExecutionFingerprint: undefined,
    status: "blocked",
  }
}

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
