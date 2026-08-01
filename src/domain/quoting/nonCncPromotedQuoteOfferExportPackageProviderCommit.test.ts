import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportPackagePlan,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  createLocalNonCncPromotedQuoteOfferExportPackageProvider,
} from "./nonCncPromotedQuoteOfferExportPackageProvider"
import {
  buildNonCncPromotedQuoteOfferExportPackageProviderCommitPlan,
  buildNonCncPromotedQuoteOfferExportPackageProviderCommitRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommit"
import {
  buildNonCncPromotedQuoteOfferExportPackageProviderReadModel,
  type NonCncPromotedQuoteOfferExportPackageProviderReadModel,
} from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

const actor = "FactoryBid Operator"
const executedAt = "2026-08-01T16:45:00.000Z"
const providerWarning =
  "Local non-CNC offer export package provider recorded artifact outcomes; no customer-offer, file, release-review, or connector write was made."

describe("non-CNC promoted quote offer export package provider commit boundary", () => {
  it("turns a ready provider read model into a deterministic committed execution audit", async () => {
    const plan = readyPlan()
    const readModel = await readyReadModel(plan)

    const result = buildNonCncPromotedQuoteOfferExportPackageProviderCommitRun({
      actor,
      executedAt,
      plan,
      readModel,
    })

    expect(result.commitPlan).toMatchObject({
      artifactOutcomeCount: 4,
      blockerLabels: [],
      commitVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION,
      mode: "local",
      nextOperatorMessage:
        "Commit 4 reviewed non-CNC offer export package provider outcomes into a deterministic execution audit.",
      planFingerprint: readModel.planFingerprint,
      planId: plan.planId,
      providerStatus: "applied",
      readModelStatus: "ready_to_commit",
      releaseExecutionFingerprint: plan.releaseExecutionFingerprint,
      reviewWarnings: [providerWarning],
      sourceExecutionFingerprint: plan.executionFingerprint,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(result.commitPlan.offerExportBoundary).toContain(
      "active RFQ quote, offer, release, export, and connector state stay unchanged",
    )
    expect(result.executionRun).toMatchObject({
      artifactCount: 4,
      mode: "commit",
      status: "succeeded",
      warnings: ["Offer wiring has a review warning.", providerWarning],
    })
    expect(result.executionRun?.artifacts.map((artifact) => [artifact.key, artifact.status])).toEqual([
      ["customer_offer_draft", "succeeded"],
      ["plain_text_export", "succeeded"],
      ["pdf_export", "succeeded"],
      ["release_review_packet", "succeeded"],
    ])
  })

  it("blocks unreadied provider read models without creating a commit execution", async () => {
    const plan = blockedPlan()
    const readModel = await readyReadModel(plan)

    const result = buildNonCncPromotedQuoteOfferExportPackageProviderCommitRun({
      actor,
      executedAt,
      plan,
      readModel,
    })

    expect(result.commitPlan).toMatchObject({
      artifactOutcomeCount: 0,
      artifactOutcomes: [],
      blockerLabels: expect.arrayContaining([
        "Non-CNC offer export package provider read model must be ready before commit.",
        "Non-CNC offer export package provider commit has no artifact outcomes.",
        "Non-CNC offer export package provider result is blocked; artifact outcomes are withheld.",
      ]),
      releaseExecutionFingerprint: undefined,
      sourceExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(result.executionRun).toBeUndefined()
  })

  it("blocks malformed ready read models that omit or fail provider outcomes", async () => {
    const plan = readyPlan()
    const readModel = await readyReadModel(plan)
    const malformedReadModel: NonCncPromotedQuoteOfferExportPackageProviderReadModel = {
      ...readModel,
      artifactOutcomes: readModel.artifactOutcomes?.map((outcome) =>
        outcome.key === "pdf_export"
          ? {
              ...outcome,
              artifactExternalId: undefined,
              status: "failed",
            }
          : outcome,
      ),
    }

    const commitPlan = buildNonCncPromotedQuoteOfferExportPackageProviderCommitPlan({
      plan,
      readModel: malformedReadModel,
    })

    expect(commitPlan).toMatchObject({
      artifactOutcomeCount: 0,
      artifactOutcomes: [],
      blockerLabels: expect.arrayContaining([
        "Provider artifact outcome for PDF export descriptor is failed; commit is blocked.",
        "Provider artifact outcome for PDF export descriptor is missing an external id.",
      ]),
      status: "blocked",
    })
  })

  it("blocks provider outcome lists that no longer match the export package plan", async () => {
    const plan = readyPlan()
    const readModel = await readyReadModel(plan)

    const commitPlan = buildNonCncPromotedQuoteOfferExportPackageProviderCommitPlan({
      plan,
      readModel: {
        ...readModel,
        artifactOutcomes: readModel.artifactOutcomes?.filter((outcome) => outcome.key !== "release_review_packet"),
      },
    })

    expect(commitPlan).toMatchObject({
      artifactOutcomeCount: 0,
      blockerLabels: expect.arrayContaining([
        "Non-CNC offer export package provider outcome list does not match the export package plan artifacts.",
        "Missing provider artifact outcome for Release review packet descriptor.",
      ]),
      status: "blocked",
    })
  })

  it("rejects provider read models whose identity no longer matches the plan", async () => {
    const plan = readyPlan()
    const readModel = await readyReadModel(plan)

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderCommitPlan({
        plan,
        readModel: {
          ...readModel,
          planId: "non-cnc-promoted-quote-offer-export-package-plan:other",
        },
      }),
    ).toThrow("non-CNC offer export package provider read model does not match plan: planId")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderCommitPlan({
        plan,
        readModel: {
          ...readModel,
          planFingerprint: "non-cnc-promoted-quote-offer-export-package-provider-other",
        },
      }),
    ).toThrow("non-CNC offer export package provider read model does not match plan: planFingerprint")
  })
})

async function readyReadModel(
  plan: NonCncPromotedQuoteOfferExportPackagePlan,
): Promise<NonCncPromotedQuoteOfferExportPackageProviderReadModel> {
  const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
  return buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(await provider.exportPackage(plan))
}

function readyPlan(): NonCncPromotedQuoteOfferExportPackagePlan {
  return buildNonCncPromotedQuoteOfferExportPackagePlan({
    readModel: readyOfferCreationReadModel(),
    requestedAt: "2026-07-31T12:00:00.000Z",
    requestedBy: actor,
  })
}

function blockedPlan(): NonCncPromotedQuoteOfferExportPackagePlan {
  return buildNonCncPromotedQuoteOfferExportPackagePlan({
    readModel: {
      ...readyOfferCreationReadModel(),
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

function readyOfferCreationReadModel(): NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel {
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
