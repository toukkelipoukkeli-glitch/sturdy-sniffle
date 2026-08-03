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
import { buildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary } from "./nonCncPromotedQuoteOfferExportPackageProviderCommitHistory"
import { buildNonCncPromotedQuoteOfferExportPackageProviderReadModel } from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"
import { createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence } from "./nonCncPromotedQuoteOfferExportPackageProviderCommitPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"

const actor = "FactoryBid Operator"

describe("non-CNC promoted quote offer export package provider commit history", () => {
  it("summarizes empty provider commit history", () => {
    const summary = buildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary(
      createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence().snapshot(),
    )

    expect(summary).toMatchObject({
      actionItems: ["Persist a ready provider commit run before wiring live customer-offer export adapters."],
      artifactOutcomeCount: 0,
      executionFingerprints: [],
      exportText: expect.stringContaining("Recent commits:\n- none"),
      operatorSummary: "No non-CNC offer export provider commit runs have been recorded yet.",
      severity: "neutral",
      status: "empty",
      title: "No provider commit history",
      totalRuns: 0,
      warningCount: 0,
    })
  })

  it("summarizes committed provider runs with export text", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence()
    const run = await readyCommitRun("2026-08-02T09:15:00.000Z")

    const summary = buildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary(
      await persistence.recordCommitRun(run),
    )

    expect(summary).toMatchObject({
      actionItems: [
        "Review committed provider evidence before enabling active export state.",
        "Review 2 warnings before customer-visible release.",
      ],
      artifactOutcomeCount: 4,
      executionFingerprints: [run.executionRun?.executionFingerprint],
      latestRun: expect.objectContaining({
        artifactOutcomeCount: 4,
        executionFingerprint: run.executionRun?.executionFingerprint,
        executionStatus: "succeeded",
        providerStatus: "applied",
        readModelStatus: "ready_to_commit",
      }),
      operatorSummary:
        "Latest non-CNC offer export provider commit recorded 4 artifact outcomes across 1 run for review-only export wiring.",
      packageIds: ["non-cnc-promoted-quote-offer-creation-package:rfq-demo-204:ready"],
      planIds: [run.commitPlan.planId],
      releaseExecutionFingerprints: ["non-cnc-promoted-quote-application-mutation-apply-execution-ready"],
      severity: "success",
      sourceExecutionFingerprints: [run.commitPlan.sourceExecutionFingerprint],
      status: "committed",
      targetRfqIds: ["rfq-demo-204"],
      title: "Provider commit history ready",
      totalRuns: 1,
      warningCount: 2,
    })
    expect(summary.exportText).toContain("Status: committed")
    expect(summary.exportText).toContain(`Latest commit: 2026-08-02T09:15:00.000Z | succeeded | applied | ready_to_commit | ${run.executionRun?.executionFingerprint}`)
    expect(summary.exportText).toContain("Boundary: provider commit history is deterministic review data only")
  })

  it("limits recent committed runs with newest run first", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence()
    const olderRun = await readyCommitRun("2026-08-02T09:15:00.000Z")
    const newerRun = await readyCommitRun("2026-08-02T09:30:00.000Z")
    await persistence.recordCommitRun(olderRun)

    const summary = buildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary(
      await persistence.recordCommitRun(newerRun),
      { recentRunLimit: 1 },
    )

    expect(summary).toMatchObject({
      artifactOutcomeCount: 8,
      recentRuns: [expect.objectContaining({ executionFingerprint: newerRun.executionRun?.executionFingerprint })],
      totalRuns: 2,
      warningCount: 4,
    })
    expect(summary.latestRun?.executionFingerprint).toBe(newerRun.executionRun?.executionFingerprint)
    expect(summary.executionFingerprints).toEqual(
      expect.arrayContaining([
        olderRun.executionRun!.executionFingerprint,
        newerRun.executionRun!.executionFingerprint,
      ]),
    )
    expect(summary.recentRuns).toHaveLength(1)
    expect(summary.exportText).toContain("Runs: 2")
    expect(summary.exportText).toContain("Artifact outcomes: 8")
    expect(summary.exportText).toContain(newerRun.executionRun!.executionFingerprint)
    expect(summary.recentRuns.map((run) => run.executionFingerprint)).not.toContain(
      olderRun.executionRun!.executionFingerprint,
    )
    expect(summary.exportText.slice(summary.exportText.indexOf("Recent commits:"))).not.toContain(
      olderRun.executionRun!.executionFingerprint,
    )
  })

  it("returns cloned commit history records and collections", async () => {
    const persistence = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence()
    await persistence.recordCommitRun(await readyCommitRun("2026-08-02T09:15:00.000Z"))

    const summary = buildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary(persistence.snapshot())
    summary.recentRuns[0]!.actor = "Mutated Operator"
    summary.latestRun!.actor = "Mutated Latest Operator"
    summary.executionFingerprints.push("mutated-fingerprint")
    summary.packageIds.push("mutated-package")

    const restored = buildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary(persistence.snapshot())

    expect(restored.recentRuns[0]?.actor).toBe(actor)
    expect(restored.latestRun?.actor).toBe(actor)
    expect(restored.executionFingerprints).not.toContain("mutated-fingerprint")
    expect(restored.packageIds).not.toContain("mutated-package")
  })

  it("rejects invalid recent run limits", () => {
    const snapshot = createLocalNonCncPromotedQuoteOfferExportPackageProviderCommitPersistence().snapshot()

    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary(snapshot, {
        recentRunLimit: 0,
      }),
    ).toThrow("recentRunLimit must be a positive safe integer")
    expect(() =>
      buildNonCncPromotedQuoteOfferExportPackageProviderCommitHistorySummary(snapshot, {
        recentRunLimit: 1.5,
      }),
    ).toThrow("recentRunLimit must be a positive safe integer")
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
