import { describe, expect, it } from "vitest"

import { buildNonCncPromotedQuoteOfferExportPackageExecutionRun } from "./nonCncPromotedQuoteOfferExportPackageExecution"
import {
  createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence,
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION,
} from "./nonCncPromotedQuoteOfferExportPackageExecutionPersistence"
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

describe("non-CNC promoted quote offer export package execution persistence", () => {
  it("records dry-run export package execution summaries without storing artifact payloads", async () => {
    const plan = readyPlan()
    const run = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      ...request,
      executedAt: "2026-07-31T15:30:00+03:00",
      mode: "dry_run",
      plan,
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot).toMatchObject({
      creationPlanIds: [plan.creationPlanId],
      packageIds: [plan.packageId],
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION,
      planIds: [plan.planId],
      planVersions: [plan.planVersion],
      recordCount: 1,
      releaseExecutionFingerprints: [plan.releaseExecutionFingerprint],
      selectedPlanIds: [plan.selectedPlanId],
      sourceExecutionFingerprints: [plan.executionFingerprint],
      statusCounts: { prepared: 1 },
      targetRfqIds: [plan.targetRfqId],
      warningCount: 1,
    })
    expect(snapshot.latestRun).toMatchObject({
      actor: "FactoryBid Operator",
      artifactCount: 4,
      creationPlanId: plan.creationPlanId,
      executedAt: request.executedAt,
      executionFingerprint: run.executionFingerprint,
      executionVersion: run.executionVersion,
      mode: "dry_run",
      packageId: plan.packageId,
      pendingActionCount: 1,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_EXECUTION_PERSISTENCE_VERSION,
      planId: plan.planId,
      planVersion: plan.planVersion,
      preparedArtifactCount: 4,
      releaseExecutionFingerprint: plan.releaseExecutionFingerprint,
      selectedPlanId: plan.selectedPlanId,
      sourceExecutionFingerprint: plan.executionFingerprint,
      status: "prepared",
      targetRfqId: plan.targetRfqId,
      warningCount: 1,
    })
    expect(snapshot.records[0]).not.toHaveProperty("artifacts")
  })

  it("records committed export package outcome counts and sorts newest first", async () => {
    const plan = readyPlan()
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()
    const pendingRun = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      actor: request.actor,
      executedAt: "2026-07-31T12:35:00.000Z",
      mode: "commit",
      plan,
    })
    const partialRun = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      actor: request.actor,
      artifactOutcomes: [
        { artifactExternalId: "offer-draft:rfq-demo-204", key: "customer_offer_draft", status: "succeeded" },
        { key: "pdf_export", message: "PDF renderer unavailable", status: "failed" },
      ],
      executedAt: "2026-07-31T12:40:00.000Z",
      mode: "commit",
      plan,
    })

    await adapter.recordRun(pendingRun)
    const snapshot = await adapter.recordRun(partialRun)

    expect(snapshot.recordCount).toBe(2)
    expect(snapshot.records.map((record) => record.executionFingerprint)).toEqual([
      partialRun.executionFingerprint,
      pendingRun.executionFingerprint,
    ])
    expect(snapshot.statusCounts).toEqual({ partial: 1, pending: 1 })
    expect(snapshot.latestRun).toMatchObject({
      failedArtifactCount: 1,
      pendingArtifactCount: 2,
      status: "partial",
      succeededArtifactCount: 1,
      warningCount: 1,
    })
    expect(snapshot.pendingActionCount).toBe(2)
    expect(snapshot.warningCount).toBe(2)
  })

  it("keeps blocked plan ids while withholding ready-only source and target ids", async () => {
    const plan = blockedPlan()
    const run = buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
      actor: request.actor,
      executedAt: "2026-07-31T12:45:00.000Z",
      mode: "commit",
      plan,
    })
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()

    const snapshot = await adapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.planIds).toEqual([plan.planId])
    expect(snapshot.releaseExecutionFingerprints).toEqual([])
    expect(snapshot.sourceExecutionFingerprints).toEqual([])
    expect(snapshot.targetRfqIds).toEqual([])
    expect(snapshot.latestRun).toMatchObject({
      artifactCount: 4,
      blockedArtifactCount: 4,
      releaseExecutionFingerprint: undefined,
      sourceExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
  })

  it("deduplicates seeded export package execution records by fingerprint using the newest record", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded offer export package execution record")
    }

    const seededAdapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence({
      initialSnapshot: {
        records: [
          seededRecord,
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-07-31T12:45:00.000Z",
            pendingActionCount: 0,
            warningCount: 0,
          },
        ],
      },
    })

    const snapshot = seededAdapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.pendingActionCount).toBe(0)
    expect(snapshot.warningCount).toBe(0)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-07-31T12:45:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      warningCount: 0,
    })
  })

  it("keeps a newer seeded export package execution when an older duplicate run is recorded", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded offer export package execution record")
    }
    const seededAdapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence({
      initialSnapshot: {
        records: [
          {
            ...seededRecord,
            actor: "Replacement Operator",
            executedAt: "2026-07-31T12:45:00.000Z",
            pendingActionCount: 0,
          },
        ],
      },
    })

    const snapshot = await seededAdapter.recordRun(run)

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      actor: "Replacement Operator",
      executedAt: "2026-07-31T12:45:00.000Z",
      executionFingerprint: seededRecord.executionFingerprint,
      pendingActionCount: 0,
    })
  })

  it("returns cloned export package execution snapshots", async () => {
    const run = buildReadyDryRun()
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()

    const snapshot = await adapter.recordRun(run)
    snapshot.records[0]!.actor = "Mutated Operator"
    snapshot.planIds.push("mutated-plan")

    const clonedSnapshot = adapter.snapshot()

    expect(clonedSnapshot.recordCount).toBe(1)
    expect(clonedSnapshot.records[0]?.actor).toBe("FactoryBid Operator")
    expect(clonedSnapshot.planIds).toEqual([run.planId])
  })

  it("rejects invalid seeded export package execution records", async () => {
    const adapter = createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence()
    const run = buildReadyDryRun()
    const seededRecord = (await adapter.recordRun(run)).records[0]
    if (!seededRecord) {
      throw new Error("Expected seeded offer export package execution record")
    }

    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, executedAt: "tomorrow" }],
        },
      }),
    ).toThrow("executedAt must be a valid ISO timestamp")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, artifactCount: 5 }],
        },
      }),
    ).toThrow("artifactCount must equal the sum of per-status artifact counts")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence({
        initialSnapshot: {
          records: [{ ...seededRecord, artifactCount: 0, preparedArtifactCount: 0 }],
        },
      }),
    ).toThrow("artifactCount must be greater than zero for offer export package execution records")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              preparedArtifactCount: 0,
              status: "succeeded",
              succeededArtifactCount: 4,
            },
          ],
        },
      }),
    ).toThrow("succeeded offer export package execution records must be commit records with only succeeded artifacts")
    expect(() =>
      createLocalNonCncPromotedQuoteOfferExportPackageExecutionPersistence({
        initialSnapshot: {
          records: [
            {
              ...seededRecord,
              blockedArtifactCount: 4,
              preparedArtifactCount: 0,
              releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-succeeded",
              sourceExecutionFingerprint: "non-cnc-promoted-quote-offer-creation-execution-succeeded",
              status: "blocked",
              targetRfqId: "rfq-demo-204",
            },
          ],
        },
      }),
    ).toThrow("blocked offer export package execution records cannot include a targetRfqId")
  })
})

function buildReadyDryRun() {
  return buildNonCncPromotedQuoteOfferExportPackageExecutionRun({
    ...request,
    mode: "dry_run",
    plan: readyPlan(),
  })
}

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
