import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportPackageExecutionRun,
} from "./nonCncPromotedQuoteOfferExportPackageExecution"
import {
  buildNonCncPromotedQuoteOfferExportPackagePlan,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  createLocalNonCncPromotedQuoteOfferExportPackageProvider,
  fingerprintNonCncPromotedQuoteOfferExportPackageProviderPlan,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION,
} from "./nonCncPromotedQuoteOfferExportPackageProvider"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

const actor = "FactoryBid Operator"
const providerWarning =
  "Local non-CNC offer export package provider recorded artifact outcomes; no customer-offer, file, release-review, or connector write was made."

describe("non-CNC promoted quote offer export package provider", () => {
  it("turns a ready export package plan into deterministic local artifact outcomes", async () => {
    const plan = readyPlan()
    const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()

    const result = await provider.exportPackage(plan)

    expect(result).toMatchObject({
      blockerLabels: [],
      mode: "local",
      planFingerprint: fingerprintNonCncPromotedQuoteOfferExportPackageProviderPlan(plan),
      planId: plan.planId,
      providerVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION,
      status: "applied",
      warnings: [providerWarning],
    })
    expect(result.artifactOutcomes?.map((outcome) => [outcome.key, outcome.status, outcome.fileName])).toEqual([
      ["customer_offer_draft", "succeeded", undefined],
      [
        "plain_text_export",
        "succeeded",
        "rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready.txt",
      ],
      [
        "pdf_export",
        "succeeded",
        "rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready.pdf",
      ],
      [
        "release_review_packet",
        "succeeded",
        "rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready-release-review.json",
      ],
    ])
    expect(result.artifactOutcomes?.map((outcome) => outcome.artifactExternalId)).toEqual([
      expect.stringMatching(/^local-non-cnc-offer-export:customer_offer_draft:[a-f0-9]{32}$/),
      expect.stringMatching(/^local-non-cnc-offer-export:plain_text_export:[a-f0-9]{32}$/),
      expect.stringMatching(/^local-non-cnc-offer-export:pdf_export:[a-f0-9]{32}$/),
      expect.stringMatching(/^local-non-cnc-offer-export:release_review_packet:[a-f0-9]{32}$/),
    ])

    const run = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      actor,
      artifactOutcomes: result.artifactOutcomes,
      executedAt: "2026-08-01T12:30:00+03:00",
      mode: "commit",
      plan,
    })

    expect(run.status).toBe("succeeded")
    expect(run.warnings).toEqual(["Offer wiring has a review warning.", providerWarning])
    expect(run.artifacts.map((artifact) => [artifact.key, artifact.status, artifact.message])).toEqual([
      ["customer_offer_draft", "succeeded", "Customer offer draft recorded locally for rfq-demo-204."],
      [
        "plain_text_export",
        "succeeded",
        "Plain-text offer export recorded locally as rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready.txt.",
      ],
      [
        "pdf_export",
        "succeeded",
        "PDF offer export recorded locally as rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready.pdf.",
      ],
      [
        "release_review_packet",
        "succeeded",
        "Release review packet recorded locally as rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready-release-review.json.",
      ],
    ])
  })

  it("supports mock mode and custom external ids without changing plan identity", async () => {
    const plan = readyPlan()
    const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider({
      externalIdPrefix: "mock-non-cnc-offer-export",
      mode: "mock",
    })

    const result = await provider.exportPackage(plan)

    expect(result).toMatchObject({
      mode: "mock",
      planFingerprint: fingerprintNonCncPromotedQuoteOfferExportPackageProviderPlan(plan),
      status: "applied",
    })
    expect(result.artifactOutcomes?.[0]).toMatchObject({
      artifactExternalId: expect.stringMatching(/^mock-non-cnc-offer-export:customer_offer_draft:[a-f0-9]{32}$/),
      key: "customer_offer_draft",
      warnings: [providerWarning],
    })
  })

  it("blocks non-ready export package plans without producing artifact outcomes", async () => {
    const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
    const result = await provider.exportPackage(blockedPlan())

    expect(result).toMatchObject({
      blockerLabels: [
        "Customer-offer creation outcome commit read model is not ready.",
        "Customer-offer creation read model has no committed outcomes.",
        "Customer-offer creation target RFQ is missing.",
        "Customer-offer creation execution fingerprint is missing.",
        "Customer-offer creation release execution fingerprint is missing.",
        "Customer-offer creation target is missing.",
        "Export package creation target is missing.",
        "Release review target is missing.",
        "No customer-offer creation outcome commit record is available.",
        "Non-CNC offer export package plan is blocked; local provider export is blocked.",
        "Non-CNC offer export package plan has no provider-ready artifacts.",
        "Non-CNC offer export package plan is missing a target RFQ.",
        "Non-CNC offer export package plan is missing release execution evidence.",
        "Non-CNC offer export package plan is missing source customer-offer execution evidence.",
        "Customer offer draft descriptor is blocked; local provider export is blocked.",
        "Customer offer draft descriptor is missing an artifact id.",
        "Plain-text export descriptor is blocked; local provider export is blocked.",
        "Plain-text export descriptor is missing an artifact id.",
        "PDF export descriptor is blocked; local provider export is blocked.",
        "PDF export descriptor is missing an artifact id.",
        "Release review packet descriptor is blocked; local provider export is blocked.",
        "Release review packet descriptor is missing an artifact id.",
      ],
      status: "blocked",
      warnings: [],
    })
    expect(result).not.toHaveProperty("artifactOutcomes")
  })

  it("blocks malformed ready plans at the provider boundary", async () => {
    const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
    const malformedPlan: NonCncPromotedQuoteOfferExportPackagePlan = {
      ...readyPlan(),
      artifacts: readyPlan().artifacts.map((artifact, index) =>
        index === 0
          ? {
              ...artifact,
              artifactId: undefined,
            }
          : artifact,
      ),
    }

    await expect(provider.exportPackage(malformedPlan)).resolves.toMatchObject({
      blockerLabels: ["Customer offer draft descriptor is missing an artifact id."],
      status: "blocked",
    })
    await expect(provider.exportPackage(malformedPlan)).resolves.not.toHaveProperty("artifactOutcomes")
  })

  it("rejects invalid provider configuration", () => {
    expect(() => createLocalNonCncPromotedQuoteOfferExportPackageProvider({ externalIdPrefix: " " })).toThrow(
      "externalIdPrefix is required",
    )
    expect(() => createLocalNonCncPromotedQuoteOfferExportPackageProvider({ mode: "remote" as never })).toThrow(
      "non-CNC offer export package provider mode must be local or mock",
    )
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
