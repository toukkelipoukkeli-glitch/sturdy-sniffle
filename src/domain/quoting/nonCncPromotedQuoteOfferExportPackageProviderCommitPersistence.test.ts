import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteOfferExportPackagePlan,
  type NonCncPromotedQuoteOfferExportPackagePlan,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import { createLocalNonCncPromotedQuoteOfferExportPackageProvider } from "./nonCncPromotedQuoteOfferExportPackageProvider"
import {
  buildNonCncPromotedQuoteOfferExportPackageProviderCommitRun,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitRunResult,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommit"
import { buildNonCncPromotedQuoteOfferExportPackageProviderReadModel } from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"
import {
  buildProviderCommitRecord,
  createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

const actor = "FactoryBid Operator"

describe("non-CNC promoted quote offer export package provider commit persistence", () => {
  it("records ready provider commit execution runs into deterministic snapshots", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence()
    const run = await readyCommitRun("2026-08-02T09:15:00.000Z")

    const snapshot = await persistence.recordCommitRun(run)

    expect(snapshot).toMatchObject({
      artifactOutcomeCount: 4,
      executionFingerprints: [run.executionRun?.executionFingerprint],
      executionStatusCounts: { succeeded: 1 },
      packageIds: ["non-cnc-promoted-quote-offer-creation-package:rfq-demo-204:ready"],
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_PERSISTENCE_VERSION,
      planIds: [run.commitPlan.planId],
      providerStatusCounts: { applied: 1 },
      readModelStatusCounts: { ready_to_commit: 1 },
      recordCount: 1,
      releaseExecutionFingerprints: ["non-cnc-promoted-quote-application-mutation-apply-execution-ready"],
      sourceExecutionFingerprints: [run.commitPlan.sourceExecutionFingerprint],
      targetRfqIds: ["rfq-demo-204"],
      warningCount: 2,
    })
    expect(snapshot.latestRun).toMatchObject({
      artifactOutcomeCount: 4,
      commitVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_VERSION,
      executionFingerprint: run.executionRun?.executionFingerprint,
      executionStatus: "succeeded",
      providerStatus: "applied",
      readModelStatus: "ready_to_commit",
      targetRfqId: "rfq-demo-204",
    })
  })

  it("rejects blocked commit plans before persistence", async () => {
    const plan = blockedPlan()
    const provider = createLocalNonCncPromotedQuoteOfferExportPackageProvider()
    const readModel = buildNonCncPromotedQuoteOfferExportPackageProviderReadModel(await provider.exportPackage(plan))
    const result = buildNonCncPromotedQuoteOfferExportPackageProviderCommitRun({
      actor,
      executedAt: "2026-08-02T09:20:00.000Z",
      plan,
      readModel,
    })

    expect(() => buildProviderCommitRecord(result)).toThrow(
      "only ready non-CNC offer export package provider commit runs can be persisted",
    )
    await expect(
      createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence().recordCommitRun(result),
    ).rejects.toThrow("only ready non-CNC offer export package provider commit runs can be persisted")
  })

  it("dedupes seeded records by execution fingerprint and keeps the newest record", async () => {
    const older = buildProviderCommitRecord(await readyCommitRun("2026-08-02T09:15:00.000Z"))
    const newer = {
      ...older,
      actor: "FactoryBid Supervisor",
      executedAt: "2026-08-02T09:30:00.000Z",
      warningCount: 3,
    }
    const snapshot = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence({
      initialSnapshot: {
        records: [older, newer],
      },
    }).snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.latestRun).toMatchObject({
      actor: "FactoryBid Supervisor",
      executedAt: "2026-08-02T09:30:00.000Z",
      warningCount: 3,
    })
    expect(snapshot.warningCount).toBe(3)
  })

  it("returns clone-safe snapshots", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence()
    const snapshot = await persistence.recordCommitRun(await readyCommitRun("2026-08-02T09:15:00.000Z"))

    snapshot.records[0].actor = "Mutated"
    snapshot.executionFingerprints.push("mutated")
    snapshot.executionStatusCounts.succeeded = 99

    const restored = persistence.snapshot()
    expect(restored.records[0].actor).toBe(actor)
    expect(restored.executionFingerprints).not.toContain("mutated")
    expect(restored.executionStatusCounts.succeeded).toBe(1)
  })

  it("rejects malformed seeded records that leak blocked or non-ready commit state", async () => {
    const record = buildProviderCommitRecord(await readyCommitRun("2026-08-02T09:15:00.000Z"))

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...record,
              executionStatus: "blocked",
            },
          ],
        },
      }),
    ).toThrow("provider commit records must be succeeded execution records")

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence({
        initialSnapshot: {
          records: [
            {
              ...record,
              readModelStatus: "blocked",
            },
          ],
        },
      }),
    ).toThrow("provider commit records must come from a ready read model")
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
