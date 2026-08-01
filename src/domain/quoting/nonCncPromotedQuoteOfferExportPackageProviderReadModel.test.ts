import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferExportPackageExecutionRun } from "./nonCncPromotedQuoteOfferExportPackageExecution"
import {
  buildNonCncPromotedQuoteOfferExportPackagePlan,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  createLocalNonCncPromotedQuoteOfferExportPackageProvider,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderResult,
} from "./nonCncPromotedQuoteOfferExportPackageProvider"
import {
  buildNonCncPromotedQuoteOfferExportPackageProviderReadModel,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION,
} from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

const actor = "FactoryBid Operator"
const providerWarning =
  "Local non-CNC offer export package provider recorded artifact outcomes; no customer-offer, file, release-review, or connector write was made."

describe("non-CNC promoted quote offer export package provider read model", () => {
  it("turns applied local provider outcomes into a reviewable execution commit input", async () => {
    const plan = readyPlan()
    const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
    const providerResult = await provider.exportPackage(plan)

    const readModel = buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(providerResult)
    const committedRun = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      actor,
      artifactOutcomes: readModel.artifactOutcomes,
      executedAt: "2026-08-01T12:30:00.000Z",
      mode: "commit",
      plan,
    })

    expect(readModel).toMatchObject({
      artifactOutcomeCount: 4,
      artifactOutcomeKeys: ["customer_offer_draft", "plain_text_export", "pdf_export", "release_review_packet"],
      blockedOutcomeCount: 0,
      blockerLabels: [],
      mode: "local",
      nextOperatorMessage: "Review and commit 4 non-CNC offer export package provider outcomes.",
      planFingerprint: providerResult.planFingerprint,
      planId: plan.planId,
      providerStatus: "applied",
      providerVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION,
      readModelVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION,
      readyOutcomeCount: 4,
      reviewWarnings: [providerWarning],
      status: "ready_to_commit",
    })
    expect(readModel.offerExportBoundary).toContain("active RFQ quote, offer, release, export, and connector state stay unchanged")
    expect(readModel.artifactOutcomes).toEqual(providerResult.artifactOutcomes)
    expect(committedRun.status).toBe("succeeded")
    expect(committedRun.artifacts.map((artifact) => artifact.status)).toEqual([
      "succeeded",
      "succeeded",
      "succeeded",
      "succeeded",
    ])
  })

  it("keeps blocked provider results outcome-free", async () => {
    const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
    const providerResult = await provider.exportPackage(blockedPlan())

    const readModel = buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(providerResult)

    expect(readModel).toMatchObject({
      artifactOutcomeCount: 0,
      artifactOutcomeKeys: [],
      blockedOutcomeCount: 0,
      mode: "local",
      providerStatus: "blocked",
      readyOutcomeCount: 0,
      reviewWarnings: [],
      status: "blocked",
    })
    expect(readModel.blockerLabels).toContain(
      "Non-CNC offer export package provider result is blocked; artifact outcomes are withheld.",
    )
    expect(readModel.nextOperatorMessage).toContain(
      "Non-CNC offer export package provider result is blocked; artifact outcomes are withheld.",
    )
    expect(readModel.artifactOutcomes).toBeUndefined()
  })

  it("blocks applied provider results that do not include artifact outcomes", () => {
    const result = {
      blockerLabels: [],
      mode: "mock",
      planFingerprint: "non-cnc-promoted-quote-offer-export-package-provider-ready",
      planId: "non-cnc-promoted-quote-offer-export-package-plan-ready",
      providerVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION,
      status: "applied",
      warnings: [],
    } satisfies NonCncPromotedQuoteOfferExportPackageProviderResult

    const readModel = buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(result)

    expect(readModel).toMatchObject({
      artifactOutcomeCount: 0,
      artifactOutcomeKeys: [],
      artifactOutcomes: undefined,
      blockedOutcomeCount: 1,
      blockerLabels: ["Applied non-CNC offer export package provider result did not include artifact outcomes."],
      mode: "mock",
      readyOutcomeCount: 0,
      status: "blocked",
    })
  })

  it("rejects malformed provider result identity and artifact outcomes", async () => {
    const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
    const providerResult = await provider.exportPackage(readyPlan())

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderReadModel({
        ...providerResult,
        providerVersion: "unsupported" as never,
      }),
    ).toThrow("providerVersion is not a supported non-CNC offer export package provider version")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderReadModel({
        ...providerResult,
        mode: "remote" as never,
      }),
    ).toThrow("provider mode must be local or mock")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderReadModel({
        ...providerResult,
        status: "pending" as never,
      }),
    ).toThrow("provider status must be applied or blocked")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderReadModel({
        ...providerResult,
        artifactOutcomes: [
          { key: "plain_text_export", status: "succeeded" },
          { key: "plain_text_export", status: "failed" },
        ],
      }),
    ).toThrow("artifactOutcomes[1].key is duplicated")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderReadModel({
        ...providerResult,
        artifactOutcomes: [{ key: "unknown", status: "succeeded" }],
      }),
    ).toThrow("artifactOutcomes[0].key must be a valid offer export package artifact key")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderReadModel({
        ...providerResult,
        artifactOutcomes: [{ key: "plain_text_export", status: "ready" as never }],
      }),
    ).toThrow("artifactOutcomes[0].status must be failed or succeeded")
  })
})

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
