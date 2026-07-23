import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferCreationExecutionRun } from "./nonCncPromotedQuoteOfferCreationExecution"
import {
  createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteOfferCreationExecutionPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_PLAN_VERSION,
  type NonCncPromotedQuoteOfferCreationPlan,
} from "./nonCncPromotedQuoteOfferCreationPlan"

const request = {
  actor: "FactoryBid Operator",
  executedAt: "2026-07-23T14:30:00.000Z",
}

describe("non-CNC promoted quote offer creation execution persistence", () => {
  it("records dry-run offer creation execution summaries without storing command payloads", async () => {
    const plan = readyPlan()
    const run = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      ...request,
      executedAt: "2026-07-23T17:30:00+03:00",
      mode: "dry_run",
      plan,
    })
    const adapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      creationPlanIds: [plan.creationPlanId],
      packageIds: [plan.packageId],
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION,
      recordCount: 1,
      releaseExecutionFingerprints: [plan.releaseExecutionFingerprint],
      selectedPlanIds: [plan.selectedPlanId],
      statusCounts: { prepared: 1 },
      targetRfqIds: [plan.targetRfqId],
      warningCount: 1,
    })
    expect(snapshot.latestRun).toMatchObject({
      actor: "FactoryBid Operator",
      commandCount: 3,
      creationPlanId: plan.creationPlanId,
      executedAt: request.executedAt,
      executionFingerprint: run.executionFingerprint,
      executionVersion: run.executionVersion,
      mode: "dry_run",
      packageId: plan.packageId,
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_EXECUTION_PERSISTENCE_VERSION,
      preparedCommandCount: 3,
      releaseExecutionFingerprint: plan.releaseExecutionFingerprint,
      selectedPlanId: plan.selectedPlanId,
      status: "prepared",
      targetRfqId: plan.targetRfqId,
      warningCount: 1,
    })
    expect(snapshot.records[0]).not.toHaveProperty("commands")
  })

  it("records committed offer creation outcome counts and sorts newest first", async () => {
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
    const snapshot = await adapter.recordRun(partialRun)

    expect(snapshot.recordCount).toBe(2)
    expect(snapshot.records.map((record) => record.executionFingerprint)).toEqual([
      partialRun.executionFingerprint,
      pendingRun.executionFingerprint,
    ])
    expect(snapshot.statusCounts).toEqual({ partial: 1, pending: 1 })
    expect(snapshot.latestRun).toMatchObject({
      failedCommandCount: 1,
      pendingCommandCount: 1,
      status: "partial",
      succeededCommandCount: 1,
      warningCount: 1,
    })
    expect(snapshot.pendingActionCount).toBe(2)
    expect(snapshot.warningCount).toBe(2)
  })

  it("keeps blocked creation plan ids while withholding ready-only source and target ids", async () => {
    const plan = {
      ...readyPlan(),
      blockerLabels: ["Offer-wiring readiness is not ready."],
      quoteSummary: undefined,
      releaseExecutionFingerprint: undefined,
      status: "blocked",
    } satisfies NonCncPromotedQuoteOfferCreationPlan
    const run = buildNonCncPromotedQuoteOfferCreationExecutionRun({
      actor: request.actor,
      executedAt: "2026-07-23T14:45:00.000Z",
      mode: "dry_run",
      plan,
    })
    const adapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.creationPlanIds).toEqual([plan.creationPlanId])
    expect(snapshot.releaseExecutionFingerprints).toEqual([])
    expect(snapshot.targetRfqIds).toEqual([])
    expect(snapshot.latestRun).toMatchObject({
      blockedCommandCount: 3,
      releaseExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
  })

  it("deduplicates seeded offer creation execution records by fingerprint using the newest record", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded offer creation execution record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-07-23T14:45:00.000Z",
            pendingActionCount: 0,
            warningCount: 0,
          },
        ],
      },
    })

    const snapshot = seededAdapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.pendingActionCount).toBe(0)
    expect(snapshot.warningCount).toBe(0)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-07-23T14:45:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      warningCount: 0,
    })
  })

  it("keeps a newer seeded offer creation execution when an older duplicate run is recorded", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded offer creation execution record")
    }
    const seededAdapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-07-23T14:45:00.000Z",
            pendingActionCount: 0,
          },
        ],
      },
    })

    const snapshot = await seededAdapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-07-23T14:45:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      pendingActionCount: 0,
    })
  })

  it("returns cloned offer creation execution snapshots", async () => {
    const run = buildReadyDryRun()
    const adapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence()

    const snapshot = await adapter.recordRun(run)
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.creationPlanIds.push("mutated-creation-plan")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.actor).toBe("FactoryBid Operator")
    expect(clonedSnapshot.creationPlanIds).toEqual([run.creationPlanId])
  })

  it("rejects invalid seeded offer creation execution records", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded offer creation execution record")
    }

    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executedAt: "tomorrow" }],
        },
      }),
    ).toThrow("executedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, pendingActionCount: Number.MAX_SAFE_INTEGER + 1 }],
        },
      }),
    ).toThrow("pendingActionCount must be a non-negative safe integer")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, commandCount: 4 }],
        },
      }),
    ).toThrow("commandCount must equal the sum of per-status command counts")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              preparedCommandCount: 0,
              status: "succeeded",
              succeededCommandCount: 3,
            },
          ],
        },
      }),
    ).toThrow("succeeded offer creation execution records must be commit records with only succeeded commands")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferCreationExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              blockedCommandCount: 3,
              preparedCommandCount: 0,
              releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-succeeded",
              status: "blocked",
              targetRfqId: "rfq-demo-204",
            },
          ],
        },
      }),
    ).toThrow("blocked offer creation execution records cannot include a targetRfqId")
  })
})

function buildReadyDryRun() {
  return buildNonCncPromotedQuoteOfferCreationExecutionRun({
    ...request,
    mode: "dry_run",
    plan: readyPlan(),
  })
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
