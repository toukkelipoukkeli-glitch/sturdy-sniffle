import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportPackageExecutionRun,
  fingerprintNonCncPromotedQuoteOfferExportPackageExecutionRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION,
} from "./nonCncPromotedQuoteOfferExportPackageExecution"
import {
  buildNonCncPromotedQuoteOfferExportPackagePlan,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

const request = {
  actor: "FactoryBid Operator",
  executedAt: "2026-07-31T12:30:00.000Z",
}

describe("non-CNC promoted quote offer export package execution", () => {
  it("blocks execution for blocked export package plans and withholds artifact evidence", () => {
    const run = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      mode: "commit",
      plan: blockedPlan(),
    })

    expect(run).toMatchObject({
      artifactCount: 4,
      executionVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_VERSION,
      mode: "commit",
      nextActions: [
        "Resolve non-CNC offer export package blockers before running the adapter.",
        "Customer-offer creation outcome commit read model is not ready.",
        "Customer-offer creation read model has no committed outcomes.",
        "Customer-offer creation target RFQ is missing.",
        "Customer-offer creation execution fingerprint is missing.",
        "Customer-offer creation release execution fingerprint is missing.",
        "Customer-offer creation target is missing.",
        "Export package creation target is missing.",
        "Release review target is missing.",
        "No customer-offer creation outcome commit record is available.",
        "Customer offer draft descriptor requires customer_offer readiness.",
        "Plain-text export descriptor requires export_package readiness.",
        "PDF export descriptor requires export_package readiness.",
        "Release review packet descriptor requires release_review readiness.",
      ],
      releaseExecutionFingerprint: undefined,
      sourceExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
      warnings: ["Offer wiring has a review warning."],
    })
    expect(run.artifacts.every((artifact) => artifact.status === "blocked")).toBe(true)
    expect(
      run.artifacts.every(
        (artifact) =>
          artifact.artifactExternalId === undefined &&
          artifact.artifactId === undefined &&
          artifact.fileName === undefined &&
          artifact.message === undefined &&
          artifact.plannedFileName === undefined &&
          artifact.warnings.length === 0,
      ),
    ).toBe(true)
  })

  it("prepares ready artifacts in dry-run mode without retaining outcomes", () => {
    const plan = readyPlan()
    const run = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      executedAt: "2026-07-31T15:30:00+03:00",
      mode: "dry_run",
      plan,
    })
    const repeatedRun = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      executedAt: "2026-07-31T12:30:00.000Z",
      mode: "dry_run",
      plan,
    })

    expect(repeatedRun).toEqual(run)
    expect(run).toMatchObject({
      executedAt: request.executedAt,
      nextActions: ["Review 4 prepared non-CNC offer export artifact descriptors before committing."],
      releaseExecutionFingerprint: plan.releaseExecutionFingerprint,
      sourceExecutionFingerprint: plan.executionFingerprint,
      status: "prepared",
      targetRfqId: "rfq-demo-204",
      warnings: ["Offer wiring has a review warning."],
    })
    expect(run.artifacts.map((artifact) => [artifact.key, artifact.status])).toEqual([
      ["customer_offer_draft", "prepared"],
      ["plain_text_export", "prepared"],
      ["pdf_export", "prepared"],
      ["release_review_packet", "prepared"],
    ])
    expect(run.artifacts.every((artifact) => artifact.artifactExternalId === undefined && artifact.message === undefined)).toBe(
      true,
    )
    expect(run.artifacts.find((artifact) => artifact.key === "pdf_export")).toMatchObject({
      artifactId: expect.stringMatching(/^non-cnc-offer-export-artifact:pdf_export:[a-f0-9]{32}$/),
      plannedFileName: "rfq-demo-204-non-cnc-promoted-quote-offer-creation-package-rfq-demo-204-ready.pdf",
    })
  })

  it("records committed artifact outcomes with a stable execution fingerprint", () => {
    const plan = readyPlan()
    const run = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      artifactOutcomes: [
        {
          artifactExternalId: "offer-draft:rfq-demo-204",
          key: "customer_offer_draft",
          message: "Draft package ready",
          status: "succeeded",
        },
        {
          artifactExternalId: "offer-export:rfq-demo-204:txt",
          fileName: "rfq-demo-204-offer.txt",
          key: "plain_text_export",
          status: "succeeded",
        },
        {
          artifactExternalId: "offer-export:rfq-demo-204:pdf",
          fileName: "rfq-demo-204-offer.pdf",
          key: "pdf_export",
          status: "succeeded",
        },
        {
          artifactExternalId: "release-review:rfq-demo-204",
          key: "release_review_packet",
          status: "succeeded",
          warnings: ["Release review still needs manager approval."],
        },
      ],
      mode: "commit",
      plan,
    })

    expect(run.executionFingerprint).toBe(fingerprintNonCncPromotedQuoteOfferExportPackageExecutionRun(run))
    expect(run.executionFingerprint).toMatch(/^non-cnc-promoted-quote-offer-export-package-execution-[a-f0-9]{32}$/)
    expect(run.status).toBe("succeeded")
    expect(run.nextActions).toEqual([
      "Review the recorded non-CNC offer export package audit before wiring live customer export state.",
    ])
    expect(run.warnings).toEqual(["Offer wiring has a review warning.", "Release review still needs manager approval."])
    expect(run.artifacts.map((artifact) => [artifact.key, artifact.status, artifact.artifactExternalId])).toEqual([
      ["customer_offer_draft", "succeeded", "offer-draft:rfq-demo-204"],
      ["plain_text_export", "succeeded", "offer-export:rfq-demo-204:txt"],
      ["pdf_export", "succeeded", "offer-export:rfq-demo-204:pdf"],
      ["release_review_packet", "succeeded", "release-review:rfq-demo-204"],
    ])
  })

  it("keeps pending and partial commit runs deterministic", () => {
    const pendingRun = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      mode: "commit",
      plan: readyPlan(),
    })
    const partialRun = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      artifactOutcomes: [
        { artifactExternalId: "offer-draft:rfq-demo-204", key: "customer_offer_draft", status: "succeeded" },
        { key: "pdf_export", message: "PDF renderer unavailable", status: "failed" },
      ],
      mode: "commit",
      plan: readyPlan(),
    })

    expect(pendingRun).toMatchObject({
      nextActions: ["Record export outcomes for 4 non-CNC offer export artifacts."],
      status: "pending",
    })
    expect(pendingRun.artifacts.map((artifact) => artifact.status)).toEqual(["pending", "pending", "pending", "pending"])
    expect(partialRun).toMatchObject({
      nextActions: ["Review failed or partial non-CNC offer export package artifact outcomes before retrying."],
      status: "partial",
    })
    expect(partialRun.artifacts.map((artifact) => artifact.status)).toEqual(["succeeded", "pending", "failed", "pending"])
  })

  it("rejects dry-run, duplicate, unknown, invalid, and blocked artifact outcomes", () => {
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
        ...request,
        artifactOutcomes: [{ key: "plain_text_export", status: "succeeded" }],
        mode: "dry_run",
        plan: readyPlan(),
      }),
    ).toThrow("artifact outcome plain_text_export cannot be recorded for a dry-run non-CNC offer export package execution")

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
        ...request,
        artifactOutcomes: [
          { key: "plain_text_export", status: "succeeded" },
          { key: "plain_text_export", status: "failed" },
        ],
        mode: "commit",
        plan: readyPlan(),
      }),
    ).toThrow("artifactOutcomes[1].key is duplicated")

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
        ...request,
        artifactOutcomes: [{ key: "unknown", status: "succeeded" }],
        mode: "commit",
        plan: readyPlan(),
      }),
    ).toThrow("artifactOutcomes[0].key must be a valid offer export package artifact key")

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
        ...request,
        // @ts-expect-error invalid outcome status regression coverage.
        artifactOutcomes: [{ key: "plain_text_export", status: "ready" }],
        mode: "commit",
        plan: readyPlan(),
      }),
    ).toThrow("artifactOutcomes[0].status must be failed or succeeded")

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
        ...request,
        artifactOutcomes: [{ key: "plain_text_export", status: "succeeded" }],
        mode: "commit",
        plan: blockedPlan(),
      }),
    ).toThrow("artifact outcome plain_text_export cannot be recorded for a blocked non-CNC offer export package artifact")
  })
})

function readyPlan(): NonCncPromotedQuoteOfferExportPackagePlan {
  return buildNonCncPromotedQuoteOfferExportPackagePlan({
    readModel: readyReadModel(),
    requestedAt: "2026-07-31T12:00:00.000Z",
    requestedBy: request.actor,
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
    requestedBy: request.actor,
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
