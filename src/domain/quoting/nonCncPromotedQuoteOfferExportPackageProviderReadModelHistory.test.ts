import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferExportPackagePlan } from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  createLocalNonCncPromotedQuoteOfferExportPackageProvider,
  type NonCncPromotedQuoteOfferExportPackageProviderResult,
} from "./nonCncPromotedQuoteOfferExportPackageProvider"
import { buildNonCncPromotedQuoteOfferExportPackageProviderReadModel } from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"
import { buildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary } from "./nonCncPromotedQuoteOfferExportPackageProviderReadModelHistory"
import { createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence } from "./nonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

const actor = "FactoryBid Operator"

describe("non-CNC promoted quote offer export package provider read-model history", () => {
  it("summarizes empty provider read-model history", () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()

    const summary = buildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary(adapter.snapshot())

    expect(summary).toMatchObject({
      actionItems: ["Record a local/mock provider read model before enabling live export adapters."],
      artifactOutcomeCount: 0,
      blockedOutcomeCount: 0,
      blockerCount: 0,
      operatorSummary: "No non-CNC offer export package provider read-model snapshots have been recorded yet.",
      readyOutcomeCount: 0,
      severity: "neutral",
      status: "empty",
      title: "No provider read-model history",
      totalRecords: 0,
      warningCount: 0,
    })
    expect(summary.exportText).toContain("Status: empty")
    expect(summary.exportText).toContain("- none")
  })

  it("summarizes ready provider read-model snapshots with export text", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()
    const readModel = await readyProviderReadModel()
    await adapter.recordReadModel(readModel, {
      actor,
      recordedAt: "2026-08-01T12:30:00.000Z",
    })

    const summary = buildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary(adapter.snapshot())

    expect(summary).toMatchObject({
      actionItems: [
        "Review ready provider read-model evidence before wiring active export state.",
        "Review 1 warning before customer-visible release.",
      ],
      artifactOutcomeCount: 4,
      blockedOutcomeCount: 0,
      blockerCount: 0,
      planIds: [readModel.planId],
      readyOutcomeCount: 4,
      severity: "ready",
      status: "ready_to_commit",
      title: "Provider read-model history ready",
      totalRecords: 1,
      warningCount: 1,
    })
    expect(summary.operatorSummary).toBe(
      "Latest non-CNC offer export provider read model is ready with 4 artifact outcomes available for guarded execution commit.",
    )
    expect(summary.exportText).toContain("Status: ready_to_commit")
    expect(summary.exportText).toContain("Ready outcomes: 4")
    expect(summary.exportText).toContain("Boundary: provider read-model history is deterministic review data only")
  })

  it("summarizes blocked provider read-model snapshots with withheld outcomes", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()
    const readModel = await blockedProviderReadModel()
    await adapter.recordReadModel(readModel, {
      actor,
      recordedAt: "2026-08-01T12:35:00.000Z",
    })

    const summary = buildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary(adapter.snapshot())

    expect(summary).toMatchObject({
      artifactOutcomeCount: 0,
      blockedOutcomeCount: 0,
      blockerCount: readModel.blockerLabels.length,
      readyOutcomeCount: 0,
      severity: "attention",
      status: "blocked",
      title: "Provider read-model history blocked",
      totalRecords: 1,
      warningCount: 0,
    })
    expect(summary.actionItems).toContain("Resolve provider read-model blockers before committing artifact outcomes.")
    expect(summary.operatorSummary).toBe(
      "Latest non-CNC offer export provider read model is blocked after 1 snapshot; artifact outcomes remain withheld from commit inputs.",
    )
    expect(summary.exportText).toContain("Artifact keys: none")
  })

  it("summarizes mixed retry history and limits recent snapshots", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()
    const readyReadModel = await readyProviderReadModel()
    const failedReadModel = await failedProviderReadModel()
    await adapter.recordReadModel(failedReadModel, {
      actor,
      recordedAt: "2026-08-01T12:35:00.000Z",
    })
    await adapter.recordReadModel(readyReadModel, {
      actor,
      recordedAt: "2026-08-01T12:40:00.000Z",
    })

    const summary = buildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary(adapter.snapshot(), {
      recentReadModelLimit: 1,
    })

    expect(summary).toMatchObject({
      blockedOutcomeCount: 1,
      readyOutcomeCount: 4,
      severity: "review",
      status: "mixed",
      title: "Provider read-model history needs review",
      totalRecords: 2,
    })
    expect(summary.recentReadModels).toHaveLength(1)
    expect(summary.recentReadModels[0]?.readModelFingerprint).toMatch(
      /^non-cnc-promoted-quote-offer-export-provider-read-model-[a-f0-9]{32}$/,
    )
    expect(summary.recentReadModels[0]?.status).toBe("ready_to_commit")
    expect(summary.operatorSummary).toBe(
      "Non-CNC offer export provider read-model history contains ready and blocked snapshots; review blockers before committing provider outcomes.",
    )
    expect(summary.exportText).toContain("Status: mixed")
    expect(summary.exportText).toContain("Recent snapshots:")
  })

  it("returns cloned history records", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()
    await adapter.recordReadModel(await readyProviderReadModel(), {
      actor,
      recordedAt: "2026-08-01T12:30:00.000Z",
    })

    const summary = buildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary(adapter.snapshot())
    summary.recentReadModels[0]!.actor = "Mutated Operator"
    summary.recentReadModels[0]!.artifactOutcomeKeys.push("pdf_export")
    summary.latestReadModel!.actor = "Mutated Latest Operator"
    summary.planIds.push("mutated-plan")

    const clonedSummary = buildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary(adapter.snapshot())

    expect(clonedSummary.recentReadModels[0]?.actor).toBe(actor)
    expect(clonedSummary.latestReadModel?.actor).toBe(actor)
    expect(clonedSummary.recentReadModels[0]?.artifactOutcomeKeys).toEqual([
      "customer_offer_draft",
      "plain_text_export",
      "pdf_export",
      "release_review_packet",
    ])
    expect(clonedSummary.planIds).not.toContain("mutated-plan")
  })

  it("rejects invalid recent read-model limits", () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderReadModelHistorySummary(adapter.snapshot(), {
        recentReadModelLimit: 0,
      }),
    ).toThrow("recentReadModelLimit must be a positive safe integer")
  })
})

async function readyProviderReadModel() {
  const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
  return buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(await provider.exportPackage(readyPlan()))
}

async function blockedProviderReadModel() {
  const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
  return buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(await provider.exportPackage(blockedPlan()))
}

async function failedProviderReadModel() {
  const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
  const providerResult = await provider.exportPackage(readyPlan())
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

function readyPlan() {
  return buildNonCncPromotedQuoteOfferExportPackagePlan({
    readModel: readyReadModel(),
    requestedAt: "2026-07-31T12:00:00.000Z",
    requestedBy: actor,
  })
}

function blockedPlan() {
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
