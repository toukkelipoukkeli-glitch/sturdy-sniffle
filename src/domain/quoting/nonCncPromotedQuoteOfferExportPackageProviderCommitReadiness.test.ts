import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportPackagePlan,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import { createLocalNonCncPromotedQuoteOfferExportPackageProvider } from "./nonCncPromotedQuoteOfferExportPackageProvider"
import {
  buildNonCncPromotedQuoteOfferExportPackageProviderCommitRun,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitRunResult,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommit"
import {
  buildNonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"
import { buildNonCncPromotedQuoteOfferExportPackageProviderReadModel } from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"
import {
  buildProviderCommitRecord,
  createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

const actor = "FactoryBid Operator"
const requestedAt = "2026-08-03T10:50:00.000Z"

describe("non-CNC promoted quote offer export package provider commit readiness", () => {
  it("blocks empty provider commit history before future live export adapters", () => {
    const readiness = buildNonCncPromotedQuoteOfferExportPackageProviderCommitReadiness({
      requestedAt,
      requestedBy: actor,
      snapshot: createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence().snapshot(),
      targetRfqId: "rfq-demo-204",
    })

    expect(readiness).toEqual({
      artifactOutcomeCount: 0,
      blockerLabels: ["No persisted non-CNC offer export provider commit records are available."],
      latestExecutionFingerprint: undefined,
      latestPackageId: undefined,
      latestPlanId: undefined,
      latestReleaseExecutionFingerprint: undefined,
      latestSourceExecutionFingerprint: undefined,
      latestStatus: undefined,
      nextOperatorMessage:
        "Keep live customer-offer export adapters disabled until provider commit history has ready local evidence.",
      persistedRecordCount: 0,
      providerCommitBoundary:
        "Provider commit readiness is deterministic review data only; this helper does not create customer offers, files, release reviews, exports, or connector writes.",
      readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
      requestedAt,
      requestedBy: actor,
      reviewWarnings: [],
      status: "blocked",
      targetRfqId: "rfq-demo-204",
    })
  })

  it("marks matching committed provider evidence ready for a future export adapter", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence()
    const run = await readyCommitRun("2026-08-03T10:15:00.000Z")
    const snapshot = await persistence.recordCommitRun(run)

    const readiness = buildNonCncPromotedQuoteOfferExportPackageProviderCommitReadiness({
      requestedAt,
      requestedBy: actor,
      snapshot,
      targetRfqId: "rfq-demo-204",
    })

    expect(readiness).toMatchObject({
      artifactOutcomeCount: 4,
      blockerLabels: [],
      latestExecutionFingerprint: run.executionRun?.executionFingerprint,
      latestPackageId: "non-cnc-promoted-quote-offer-creation-package:rfq-demo-204:ready",
      latestPlanId: run.commitPlan.planId,
      latestReleaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-ready",
      latestSourceExecutionFingerprint: run.commitPlan.sourceExecutionFingerprint,
      latestStatus: "succeeded",
      nextOperatorMessage: "Provider commit history is ready for a future customer-offer export adapter.",
      persistedRecordCount: 1,
      readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
      reviewWarnings: ["Latest provider commit record has 2 warning(s)."],
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(readiness.providerCommitBoundary).toContain("does not create customer offers")
  })

  it("keeps ready evidence withheld when the target RFQ does not match", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence()
    await persistence.recordCommitRun(await readyCommitRun("2026-08-03T10:15:00.000Z"))

    const readiness = buildNonCncPromotedQuoteOfferExportPackageProviderCommitReadiness({
      requestedAt,
      requestedBy: actor,
      snapshot: persistence.snapshot(),
      targetRfqId: "rfq-demo-999",
    })

    expect(readiness).toMatchObject({
      artifactOutcomeCount: 0,
      blockerLabels: ["No persisted non-CNC offer export provider commit record matches active RFQ: rfq-demo-999."],
      latestExecutionFingerprint: undefined,
      latestPackageId: undefined,
      latestPlanId: undefined,
      latestReleaseExecutionFingerprint: undefined,
      latestSourceExecutionFingerprint: undefined,
      persistedRecordCount: 1,
      status: "blocked",
      targetRfqId: "rfq-demo-999",
    })
  })

  it("uses the newest matching provider commit when snapshots contain older records first", async () => {
    const older = buildProviderCommitRecord(await readyCommitRun("2026-08-03T10:15:00.000Z"))
    const newer = buildProviderCommitRecord(await readyCommitRun("2026-08-03T10:45:00.000Z"))
    const snapshot = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence({
      initialSnapshot: { records: [older, newer] },
    }).snapshot()

    const readiness = buildNonCncPromotedQuoteOfferExportPackageProviderCommitReadiness({
      requestedAt,
      requestedBy: actor,
      snapshot: { ...snapshot, latestRun: older },
      targetRfqId: "rfq-demo-204",
    })

    expect(readiness).toMatchObject({
      artifactOutcomeCount: 4,
      latestExecutionFingerprint: newer.executionFingerprint,
      latestPlanId: newer.planId,
      persistedRecordCount: 2,
      status: "ready",
    })
  })

  it("normalizes request metadata and rejects malformed boundaries", () => {
    const snapshot = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderCommitReadiness({
        requestedAt: "not-a-date",
        requestedBy: actor,
        snapshot,
        targetRfqId: "rfq-demo-204",
      }),
    ).toThrow("requestedAt must be a valid ISO timestamp")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderCommitReadiness({
        requestedAt,
        requestedBy: " ",
        snapshot,
        targetRfqId: "rfq-demo-204",
      }),
    ).toThrow("requestedBy is required")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderCommitReadiness({
        requestedAt,
        requestedBy: actor,
        snapshot,
        targetRfqId: " ",
      }),
    ).toThrow("targetRfqId is required")
  })
})

async function readyCommitRun(executedAt: string): Promise<NonCncPromotedQuoteOfferExportPackageProviderCommitRunResult> {
  const plan = readyPlan()
  const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
  const readModel = buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(await provider.exportPackage(plan))
  return buildNonCncPromotedQuoteOfferExportPackageProviderCommitRun({
    actor,
    executedAt,
    plan,
    readModel,
  })
}

function readyPlan(): NonCncPromotedQuoteOfferExportPackagePlan {
  return buildNonCncPromotedQuoteOfferExportPackagePlan({
    readModel: readyOfferCreationReadModel(),
    requestedAt: "2026-08-02T09:00:00.000Z",
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
