import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportPackagePlan,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

describe("non-CNC promoted quote offer export package plan", () => {
  it("withholds export artifacts when the customer-offer creation read model is blocked", () => {
    const plan = buildNonCncPromotedQuoteOfferExportPackagePlan({
      readModel: blockedReadModel({
        blockerLabels: ["Customer-offer creation outcome commit record is review-only."],
        creationPlanId: "non-cnc-promoted-quote-offer-creation-plan:rfq-demo-204:package-ready",
        packageId: "non-cnc-promoted-quote-offer-creation-package:rfq-demo-204:ready",
        selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal",
      }),
      requestedAt: "2026-07-29T12:30:00+03:00",
      requestedBy: "FactoryBid Operator",
    })

    expect(plan).toMatchObject({
      artifactCount: 0,
      blockerLabels: [
        "Customer-offer creation outcome commit read model is not ready.",
        "Customer-offer creation read model has no committed outcomes.",
        "Customer-offer creation target RFQ is missing.",
        "Customer-offer creation execution fingerprint is missing.",
        "Customer-offer creation release execution fingerprint is missing.",
        "Customer-offer creation target is missing.",
        "Export package creation target is missing.",
        "Release review target is missing.",
        "Customer-offer creation outcome commit record is review-only.",
      ],
      executionFingerprint: undefined,
      nextOperatorMessage:
        "Resolve customer-offer creation read-model blockers before preparing export package artifacts.",
      planVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION,
      releaseExecutionFingerprint: undefined,
      requestedAt: "2026-07-29T09:30:00.000Z",
      requestedBy: "FactoryBid Operator",
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(plan.artifacts).toHaveLength(4)
    expect(plan.artifacts.every((artifact) => artifact.status === "blocked")).toBe(true)
    expect(plan.artifacts.every((artifact) => artifact.artifactId === undefined && artifact.fileName === undefined)).toBe(
      true,
    )
  })

  it("builds deterministic future-adapter artifact descriptors from a ready read model", () => {
    const firstPlan = buildReadyPlan()
    const repeatedPlan = buildReadyPlan()

    expect(repeatedPlan).toEqual(firstPlan)
    expect(firstPlan).toMatchObject({
      artifactCount: 4,
      blockerLabels: [],
      creationPlanId: readyReadModel().creationPlanId,
      executionFingerprint: readyReadModel().executionFingerprint,
      nextOperatorMessage: "Reviewed non-CNC customer-offer outcomes are ready for a future export package adapter.",
      offerExportBoundary:
        "Non-CNC offer export package plans are deterministic adapter descriptors only; building this plan does not create customer offers, files, release reviews, or connector side effects.",
      packageId: readyReadModel().packageId,
      planVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PLAN_VERSION,
      releaseExecutionFingerprint: readyReadModel().releaseExecutionFingerprint,
      requestedAt: "2026-07-29T09:30:00.000Z",
      reviewWarnings: ["Offer wiring has a review warning."],
      selectedPlanId: readyReadModel().selectedPlanId,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(firstPlan.planId).toMatch(/^non-cnc-promoted-quote-offer-export-package-plan-[a-f0-9]{8}$/)
    expect(firstPlan.artifacts).toEqual([
      {
        artifactId: expect.stringMatching(/^non-cnc-offer-export-artifact:customer_offer_draft:[a-f0-9]{8}$/),
        blockerLabels: [],
        fileName: undefined,
        key: "customer_offer_draft",
        label: "Customer offer draft descriptor",
        sourceTarget: "customer_offer",
        status: "ready",
      },
      {
        artifactId: expect.stringMatching(/^non-cnc-offer-export-artifact:plain_text_export:[a-f0-9]{8}$/),
        blockerLabels: [],
        fileName: "rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready.txt",
        key: "plain_text_export",
        label: "Plain-text export descriptor",
        sourceTarget: "export_package",
        status: "ready",
      },
      {
        artifactId: expect.stringMatching(/^non-cnc-offer-export-artifact:pdf_export:[a-f0-9]{8}$/),
        blockerLabels: [],
        fileName: "rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready.pdf",
        key: "pdf_export",
        label: "PDF export descriptor",
        sourceTarget: "export_package",
        status: "ready",
      },
      {
        artifactId: expect.stringMatching(/^non-cnc-offer-export-artifact:release_review_packet:[a-f0-9]{8}$/),
        blockerLabels: [],
        fileName:
          "rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready-release-review.json",
        key: "release_review_packet",
        label: "Release review packet descriptor",
        sourceTarget: "release_review",
        status: "ready",
      },
    ])
  })

  it("blocks malformed ready read models that omit an expected creation target", () => {
    const plan = buildNonCncPromotedQuoteOfferExportPackagePlan({
      readModel: readyReadModel({
        creationTargets: ["customer_offer", "release_review"],
      }),
      requestedAt: "2026-07-29T09:30:00.000Z",
      requestedBy: "FactoryBid Operator",
    })

    expect(plan).toMatchObject({
      artifactCount: 0,
      blockerLabels: ["Export package creation target is missing."],
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(plan.artifacts.find((artifact) => artifact.key === "plain_text_export")).toMatchObject({
      artifactId: undefined,
      blockerLabels: ["Export package creation target is missing.", "Plain-text export descriptor requires export_package readiness."],
      fileName: undefined,
      status: "blocked",
    })
    expect(plan.artifacts.find((artifact) => artifact.key === "pdf_export")).toMatchObject({
      artifactId: undefined,
      blockerLabels: ["Export package creation target is missing.", "PDF export descriptor requires export_package readiness."],
      fileName: undefined,
      status: "blocked",
    })
  })

  it("rejects invalid request metadata before creating the plan", () => {
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackagePlan({
        readModel: readyReadModel(),
        requestedAt: "not-a-date",
        requestedBy: "FactoryBid Operator",
      }),
    ).toThrow("requestedAt must be a valid ISO timestamp")

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackagePlan({
        readModel: readyReadModel(),
        requestedAt: "2026-07-29T09:30:00.000Z",
        requestedBy: " ",
      }),
    ).toThrow("requestedBy is required")
  })
})

function buildReadyPlan(): NonCncPromotedQuoteOfferExportPackagePlan {
  return buildNonCncPromotedQuoteOfferExportPackagePlan({
    readModel: readyReadModel(),
    requestedAt: "2026-07-29T12:30:00+03:00",
    requestedBy: "FactoryBid Operator",
  })
}

function readyReadModel(
  overrides: Partial<NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel> = {},
): NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel {
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
    ...overrides,
  }
}

function blockedReadModel(
  overrides: Partial<NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel> = {},
): NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel {
  return {
    blockerLabels: ["No customer-offer creation outcome commit record is available."],
    committedOutcomeCount: 0,
    creationTargets: [],
    nextOperatorMessage:
      "Resolve customer-offer creation outcome commit blockers before creating customer offers, export packages, or release reviews.",
    offerCreationBoundary:
      "Customer-offer creation outcome commit read models are deterministic review data only; active RFQ quote, offer, release, export, and connector state stay unchanged until a later adapter applies them.",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: [],
    status: "blocked",
    ...overrides,
  }
}
