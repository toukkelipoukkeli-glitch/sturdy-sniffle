import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferExportPackageExecutionRun } from "./nonCncPromotedQuoteOfferExportPackageExecution"
import { buildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummary } from "./nonCncPromotedQuoteOfferExportPackageExecutionHistory"
import { createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence } from "./nonCncPromotedQuoteOfferExportPackageExecutionPersistence"
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
  executedAt: "2026-08-01T06:30:00.000Z",
}

describe("non-CNC promoted quote offer export package execution history", () => {
  it("summarizes an empty export package execution history", () => {
    const summary = buildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence().snapshot(),
    )

    expect(summary).toMatchObject({
      actionItems: ["Run a dry-run non-CNC offer export package audit before enabling live export adapters."],
      artifactCount: 0,
      exportText: expect.stringContaining("Recent runs:\n- none"),
      operatorSummary: "No non-CNC offer export package execution audits have been recorded yet.",
      severity: "neutral",
      status: "empty",
      title: "No offer export package history",
      totalRuns: 0,
    })
  })

  it("summarizes succeeded export package execution evidence", async () => {
    const plan = readyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()
    const run = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      artifactOutcomes: [
        { artifactExternalId: "offer-draft:rfq-demo-204", key: "customer_offer_draft", status: "succeeded" },
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

    const summary = buildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummary(await adapter.recordRun(run))

    expect(summary).toMatchObject({
      actionItems: [
        "Review succeeded non-CNC offer export package evidence before wiring active export state.",
        "Review 2 warnings before customer-visible release.",
      ],
      artifactCount: 4,
      creationPlanIds: [plan.creationPlanId],
      latestRun: expect.objectContaining({
        executionFingerprint: run.executionFingerprint,
        status: "succeeded",
        succeededArtifactCount: 4,
      }),
      operatorSummary:
        "Latest non-CNC offer export package execution succeeded with 4 artifacts recorded for review-only export wiring.",
      packageIds: [plan.packageId],
      planIds: [plan.planId],
      releaseExecutionFingerprints: [plan.releaseExecutionFingerprint],
      selectedPlanIds: [plan.selectedPlanId],
      severity: "success",
      sourceExecutionFingerprints: [plan.executionFingerprint],
      status: "succeeded",
      succeededArtifactCount: 4,
      targetRfqIds: [plan.targetRfqId],
      title: "Offer export package history ready",
      totalRuns: 1,
      warningCount: 2,
    })
    expect(summary.exportText).toContain(`Latest run: ${request.executedAt} | succeeded | commit | ${run.executionFingerprint}`)
    expect(summary.exportText).toContain(`Release executions: ${plan.releaseExecutionFingerprint}`)
    expect(summary.exportText).toContain(`Source executions: ${plan.executionFingerprint}`)
  })

  it("summarizes prepared dry-run export package execution evidence", async () => {
    const plan = readyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()
    const run = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      mode: "dry_run",
      plan,
    })

    const summary = buildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummary(await adapter.recordRun(run))

    expect(summary).toMatchObject({
      actionItems: [
        "Review prepared non-CNC offer export package artifacts before committing provider side effects.",
        "Review 1 warning before customer-visible release.",
      ],
      artifactCount: 4,
      operatorSummary:
        "Latest non-CNC offer export package dry-run prepared 4 artifacts for review before any provider side effects.",
      preparedArtifactCount: 4,
      severity: "ready",
      status: "prepared",
      title: "Offer export package dry-run prepared",
    })
  })

  it("summarizes partial and pending artifact histories with newest run first", async () => {
    const plan = readyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()
    const pendingRun = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      actor: request.actor,
      executedAt: "2026-08-01T06:35:00.000Z",
      mode: "commit",
      plan,
    })
    const partialRun = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      actor: request.actor,
      artifactOutcomes: [
        { artifactExternalId: "offer-draft:rfq-demo-204", key: "customer_offer_draft", status: "succeeded" },
        { key: "pdf_export", message: "PDF renderer unavailable", status: "failed" },
      ],
      executedAt: "2026-08-01T06:40:00.000Z",
      mode: "commit",
      plan,
    })

    await adapter.recordRun(pendingRun)
    const summary = buildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummary(await adapter.recordRun(partialRun), {
      recentRunLimit: 1,
    })

    expect(summary).toMatchObject({
      actionItems: [
        "Review failed or partial non-CNC offer export package artifact outcomes before retrying.",
        "Review 2 warnings before customer-visible release.",
      ],
      artifactCount: 8,
      failedArtifactCount: 1,
      pendingActionCount: 2,
      pendingArtifactCount: 6,
      recentRuns: [expect.objectContaining({ executionFingerprint: partialRun.executionFingerprint })],
      severity: "attention",
      status: "needs_review",
      succeededArtifactCount: 1,
      title: "Offer export package history needs review",
      totalRuns: 2,
      warningCount: 2,
    })
    expect(summary.latestRun?.executionFingerprint).toBe(partialRun.executionFingerprint)
    expect(summary.exportText).toContain("Recent runs:")
    expect(summary.exportText).toContain(partialRun.executionFingerprint)
    expect(summary.exportText).not.toContain(pendingRun.executionFingerprint)
  })

  it("withholds blocked ready-only ids from the history summary", async () => {
    const plan = blockedPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()
    const run = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      mode: "dry_run",
      plan,
    })

    const summary = buildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummary(await adapter.recordRun(run))

    expect(summary).toMatchObject({
      actionItems: [
        "Resolve non-CNC offer export package blockers before recording another execution.",
        "Review 1 warning before customer-visible release.",
      ],
      blockedArtifactCount: 4,
      releaseExecutionFingerprints: [],
      severity: "attention",
      sourceExecutionFingerprints: [],
      status: "blocked",
      targetRfqIds: [],
      title: "Offer export package history blocked",
    })
    expect(summary.latestRun).toMatchObject({
      releaseExecutionFingerprint: undefined,
      sourceExecutionFingerprint: undefined,
      targetRfqId: undefined,
    })
    expect(summary.exportText).toContain("Target RFQs: none")
    expect(summary.exportText).toContain("Release executions: none")
    expect(summary.exportText).toContain("Source executions: none")
  })

  it("rejects invalid recent run limits", () => {
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageExecutionHistorySummary(
        createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence().snapshot(),
        { recentRunLimit: 0 },
      ),
    ).toThrow("recentRunLimit must be a positive safe integer")
  })
})

function readyPlan(): NonCncPromotedQuoteOfferExportPackagePlan {
  return buildNonCncPromotedQuoteOfferExportPackagePlan({
    readModel: readyReadModel(),
    requestedAt: "2026-08-01T06:00:00.000Z",
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
    requestedAt: "2026-08-01T06:00:00.000Z",
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
