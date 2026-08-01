import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportPackagePlan,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  createLocalNonCncPromotedQuoteOfferExportPackageProvider,
  type NonCncPromotedQuoteOfferExportPackageProviderResult,
} from "./nonCncPromotedQuoteOfferExportPackageProvider"
import { buildNonCncPromotedQuoteOfferExportPackageProviderReadModel } from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"
import {
  buildProviderReadModelRecord,
  createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

const actor = "FactoryBid Operator"

describe("non-CNC promoted quote offer export package provider read-model persistence", () => {
  it("records compact ready provider read-model snapshots without artifact payloads", async () => {
    const plan = readyPlan()
    const readModel = await readyProviderReadModel(plan)
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()

    const snapshot = await adapter.recordReadModel(readModel, {
      actor,
      recordedAt: "2026-08-01T15:30:00+03:00",
    })

    expect(snapshot).toMatchObject({
      artifactOutcomeCount: 4,
      artifactOutcomeKeys: ["customer_offer_draft", "pdf_export", "plain_text_export", "release_review_packet"],
      blockedOutcomeCount: 0,
      blockerCount: 0,
      modeCounts: { local: 1 },
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
      planFingerprints: [readModel.planFingerprint],
      planIds: [plan.planId],
      providerStatusCounts: { applied: 1 },
      readyOutcomeCount: 4,
      readModelFingerprints: [snapshot.records[0]?.readModelFingerprint],
      recordCount: 1,
      statusCounts: { ready_to_commit: 1 },
      warningCount: 1,
    })
    expect(snapshot.latestReadModel).toMatchObject({
      actor,
      artifactOutcomeCount: 4,
      blockedOutcomeCount: 0,
      mode: "local",
      planFingerprint: readModel.planFingerprint,
      planId: plan.planId,
      providerStatus: "applied",
      readyOutcomeCount: 4,
      recordedAt: "2026-08-01T12:30:00.000Z",
      status: "ready_to_commit",
      warningCount: 1,
    })
    expect(snapshot.records[0]).not.toHaveProperty("artifactOutcomes")
  })

  it("records blocked provider read models with withheld outcomes", async () => {
    const readModel = await blockedProviderReadModel()
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()

    const snapshot = await adapter.recordReadModel(readModel, {
      actor,
      recordedAt: "2026-08-01T12:35:00.000Z",
    })

    expect(snapshot).toMatchObject({
      artifactOutcomeCount: 0,
      artifactOutcomeKeys: [],
      blockedOutcomeCount: 0,
      blockerCount: readModel.blockerLabels.length,
      modeCounts: { local: 1 },
      providerStatusCounts: { blocked: 1 },
      readyOutcomeCount: 0,
      statusCounts: { blocked: 1 },
      warningCount: 0,
    })
    expect(snapshot.latestReadModel).toMatchObject({
      providerStatus: "blocked",
      status: "blocked",
    })
  })

  it("keeps distinct retry outcomes for the same provider plan fingerprint", async () => {
    const plan = readyPlan()
    const readyReadModel = await readyProviderReadModel(plan)
    const failedReadModel = await failedProviderReadModel(plan)
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()

    await adapter.recordReadModel(failedReadModel, {
      actor,
      recordedAt: "2026-08-01T12:35:00.000Z",
    })
    const snapshot = await adapter.recordReadModel(readyReadModel, {
      actor,
      recordedAt: "2026-08-01T12:40:00.000Z",
    })

    expect(snapshot.recordCount).toBe(2)
    expect(snapshot.planFingerprints).toEqual([readyReadModel.planFingerprint])
    expect(snapshot.readModelFingerprints).toHaveLength(2)
    expect(snapshot.records.map((record) => record.status)).toEqual(["ready_to_commit", "blocked"])
    expect(snapshot.statusCounts).toEqual({ blocked: 1, ready_to_commit: 1 })
    expect(snapshot.blockedOutcomeCount).toBe(1)
    expect(snapshot.readyOutcomeCount).toBe(4)
  })

  it("deduplicates seeded provider read-model records by fingerprint using the newest record", async () => {
    const record = buildProviderReadModelRecord(await readyProviderReadModel(readyPlan()), {
      actor,
      recordedAt: "2026-08-01T12:30:00.000Z",
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence({
      initialSnapshot: {
        records: [
          record,
          {
            ...record,
            actor: "Replacement Operator",
            recordedAt: "2026-08-01T12:45:00.000Z",
            warningCount: 0,
          },
        ],
      },
    })

    const snapshot = adapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.warningCount).toBe(0)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      readModelFingerprint: record.readModelFingerprint,
      recordedAt: "2026-08-01T12:45:00.000Z",
      warningCount: 0,
    })
  })

  it("returns cloned provider read-model persistence snapshots", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()
    const snapshot = await adapter.recordReadModel(await readyProviderReadModel(readyPlan()), {
      actor,
      recordedAt: "2026-08-01T12:30:00.000Z",
    })

    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.records[0]!.artifactOutcomeKeys.push("pdf_export")
    snapshot.latestReadModel!.actor = "Mutated Latest Operator"
    snapshot.planIds.push("mutated-plan")
    snapshot.statusCounts.ready_to_commit = 99

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.actor).toBe(actor)
    expect(clonedSnapshot.latestReadModel?.actor).toBe(actor)
    expect(clonedSnapshot.records[0]?.artifactOutcomeKeys).toEqual([
      "customer_offer_draft",
      "plain_text_export",
      "pdf_export",
      "release_review_packet",
    ])
    expect(clonedSnapshot.planIds).not.toContain("mutated-plan")
    expect(clonedSnapshot.statusCounts).toEqual({ ready_to_commit: 1 })
  })

  it("rejects malformed seeded provider read-model persistence records", async () => {
    const record = buildProviderReadModelRecord(await readyProviderReadModel(readyPlan()), {
      actor,
      recordedAt: "2026-08-01T12:30:00.000Z",
    })

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence({
        initialSnapshot: {
          records: [{ ...record, recordedAt: "tomorrow" }],
        },
      }),
    ).toThrow("recordedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence({
        initialSnapshot: {
          records: [{ ...record, artifactOutcomeCount: 5 }],
        },
      }),
    ).toThrow("artifactOutcomeCount must match artifactOutcomeKeys length")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence({
        initialSnapshot: {
          records: [
            {
              ...record,
              artifactOutcomeCount: 2,
              artifactOutcomeKeys: ["plain_text_export", "plain_text_export"],
              readyOutcomeCount: 2,
            },
          ],
        },
      }),
    ).toThrow("artifactOutcomeKeys must be unique")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence({
        initialSnapshot: {
          records: [
            {
              ...record,
              artifactOutcomeCount: 1,
              artifactOutcomeKeys: ["unknown" as never],
              readyOutcomeCount: 1,
            },
          ],
        },
      }),
    ).toThrow("artifactOutcomeKeys[0] must be a valid offer export package artifact key")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence({
        initialSnapshot: {
          records: [{ ...record, blockerCount: 1 }],
        },
      }),
    ).toThrow("ready provider read-model records cannot include blockers")
  })
})

async function readyProviderReadModel(plan: NonCncPromotedQuoteOfferExportPackagePlan) {
  const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
  return buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(await provider.exportPackage(plan))
}

async function blockedProviderReadModel() {
  const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
  return buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(await provider.exportPackage(blockedPlan()))
}

async function failedProviderReadModel(plan: NonCncPromotedQuoteOfferExportPackagePlan) {
  const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
  const providerResult = await provider.exportPackage(plan)
  const artifactOutcomes = providerResult.artifactOutcomes?.map((outcome) =>
    outcome.key === "pdf_export"
      ? {
          ...outcome,
          message: "PDF export provider failed locally.",
          status: "failed" as const,
        }
      : outcome,
  )
  return buildNonCncPromotedQuoteOfferExportPackageProviderReadModel({
    ...providerResult,
    artifactOutcomes,
  } satisfies NonCncPromotedQuoteOfferExportPackageProviderResult)
}

function readyPlan(): NonCncPromotedQuoteOfferExportPackagePlan {
  return buildNonCncPromotedQuoteOfferExportPackagePlan({
    readModel: readyReadModel(),
    requestedAt: "2026-07-31T12:00:00.000Z",
    requestedBy: actor,
  })
}

function blockedPlan(): NonCncPromotedQuoteOfferExportPackagePlan {
  return buildNonCncPromotedQuoteOfferExportPackagePlan({
    readModel: {
      ...readyReadModel(),
      blockerLabels: ["No customer-offer creation outcome commit record is available."],
      committedOutcomeCount: 0,
      creationTargets: [],
      executionFingerprint: undefined,
      releaseExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    },
    requestedAt: "2026-07-31T12:00:00.000Z",
    requestedBy: actor,
  })
}

function readyReadModel(): NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel {
  return {
    blockerLabels: [],
    committedOutcomeCount: 3,
    creationPlanId: "non-cnc-promoted-quote-offer-creation-plan:rfq-demo-204:package-ready",
    creationTargets: ["customer_offer", "export_package", "release_review"],
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-offer-creation-execution-ready",
    nextOperatorMessage: "Reviewed non-CNC customer-offer creation outcomes are ready for a future customer-offer adapter.",
    offerCreationBoundary:
      "Customer-offer creation outcome commit read models are deterministic review data only; active RFQ quote, offer, release, export, and connector state stay unchanged until a later adapter applies them.",
    packageId: "non-cnc-promoted-quote-offer-creation-package:rfq-demo-204:ready",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-ready",
    reviewWarnings: ["Offer wiring has a review warning."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal",
    status: "ready_to_create",
    targetRfqId: "rfq-demo-204",
  }
}
