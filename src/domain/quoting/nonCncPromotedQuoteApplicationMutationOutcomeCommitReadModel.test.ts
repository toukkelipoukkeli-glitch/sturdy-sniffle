import { describe, expect, it } from "vitest"

import { NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION } from "./nonCncPromotedQuoteApplicationMutationOutcomeCommit"
import {
  buildNonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  sortMutationOutcomeCommitRecordsNewestFirst,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot,
  type NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence"

describe("non-CNC promoted quote application mutation outcome commit read model", () => {
  it("blocks when no persisted application mutation outcome commit is available", () => {
    const readModel = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel({
      snapshot: emptySnapshot(),
    })

    expect(readModel).toEqual({
      blockerLabels: ["No promoted quote application mutation outcome commit record is available."],
      committedOutcomeCount: 0,
      mutationBoundary:
        "Application mutation outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
      mutationTargets: [],
      nextOperatorMessage:
        "Resolve promoted quote application mutation outcome commit blockers before applying it to active RFQ, offer, or release state.",
      readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
      reviewWarnings: [],
      status: "blocked",
    })
  })

  it("echoes the requested mutation package id when a persisted record is missing", () => {
    const readModel = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel({
      mutationPackageId: "non-cnc-promoted-quote-application-mutation-package:missing",
      snapshot: emptySnapshot(),
    })

    expect(readModel).toMatchObject({
      blockerLabels: ["No promoted quote application mutation outcome commit record is available."],
      mutationPackageId: "non-cnc-promoted-quote-application-mutation-package:missing",
      status: "blocked",
    })
  })

  it("keeps review-only mutation outcome commits blocked and withholds mutation targets", () => {
    const blockedRecord = mutationOutcomeCommitRecord({
      blockerLabels: ["Application mutation outcome draft must be ready before commit."],
      blockerCount: 1,
      commandOutcomeCount: 0,
      commandOutcomes: [],
      disposition: "review_only",
      executionFingerprint: undefined,
      executionStatus: undefined,
      status: "blocked",
    })
    const readModel = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel({
      snapshot: snapshotWithRecords([blockedRecord]),
    })

    expect(readModel).toMatchObject({
      blockerLabels: [
        "Promoted quote application mutation outcome commit record is blocked.",
        "Promoted quote application mutation outcome commit record is review-only.",
        "Promoted quote application mutation outcome commit execution fingerprint is missing.",
        "Promoted quote application mutation outcome commit execution status is missing.",
        "Promoted quote application mutation outcome commit has no committed outcomes.",
        "Application mutation outcome draft must be ready before commit.",
      ],
      committedOutcomeCount: 0,
      disposition: "review_only",
      executionFingerprint: undefined,
      executionStatus: undefined,
      mutationPackageId: blockedRecord.mutationPackageId,
      mutationTargets: [],
      reviewWarnings: ["Operator must resolve blocked mutation commit."],
      status: "blocked",
    })
  })

  it("builds a ready-to-apply boundary from committed mutation outcome records", () => {
    const readyRecord = mutationOutcomeCommitRecord({
      commandOutcomeCount: 3,
      disposition: "commit_ready",
      executionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
      executionStatus: "succeeded",
      recordedAt: "2026-06-29T12:20:00.000Z",
      reviewWarnings: ["Material certificate required."],
      status: "ready",
      warningCount: 1,
    })
    const staleBlockedRecord = mutationOutcomeCommitRecord({
      blockerLabels: ["Stale blocked mutation commit."],
      blockerCount: 1,
      commandOutcomeCount: 0,
      commandOutcomes: [],
      commitRecordId: `${readyRecord.commitRecordId}:stale`,
      disposition: "review_only",
      executionFingerprint: undefined,
      executionStatus: undefined,
      mutationPackageId: readyRecord.mutationPackageId,
      recordedAt: "2026-06-29T12:10:00.000Z",
      status: "blocked",
    })
    const readModel = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel({
      mutationPackageId: readyRecord.mutationPackageId,
      snapshot: snapshotWithRecords([staleBlockedRecord, readyRecord]),
    })

    expect(readModel).toMatchObject({
      applicationId: readyRecord.applicationId,
      applicationRecordId: readyRecord.applicationRecordId,
      blockerLabels: [],
      committedOutcomeCount: 3,
      disposition: "commit_ready",
      executionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
      executionStatus: "succeeded",
      mutationPackageId: readyRecord.mutationPackageId,
      mutationTargets: ["active_rfq_quote", "offer_workspace", "release_state"],
      packageId: readyRecord.packageId,
      readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
      reviewWarnings: ["Material certificate required."],
      selectedPlanId: readyRecord.selectedPlanId,
      sourceExecutionFingerprint: readyRecord.sourceExecutionFingerprint,
      status: "ready_to_apply",
      targetRfqId: readyRecord.targetRfqId,
    })
    expect(readModel.nextOperatorMessage).toContain("active RFQ, offer, and release mutation adapter")
  })

  it("blocks ready records whose committed execution did not fully succeed", () => {
    const partialRecord = mutationOutcomeCommitRecord({
      executionStatus: "partial",
    })

    const readModel = buildNonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel({
      snapshot: snapshotWithRecords([partialRecord]),
    })

    expect(readModel).toMatchObject({
      blockerLabels: ["Promoted quote application mutation outcome commit execution status is partial."],
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      mutationTargets: [],
      status: "blocked",
    })
  })
})

function emptySnapshot(): NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot {
  return {
    blockedMutationPackageIds: [],
    commitReadyMutationPackageIds: [],
    outcomeCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    statusCounts: {},
    warningCount: 0,
  }
}

function snapshotWithRecords(
  records: NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord[],
): NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot {
  const sortedRecords = [...records].sort(sortMutationOutcomeCommitRecordsNewestFirst)
  return {
    blockedMutationPackageIds: records.filter((record) => record.status === "blocked").map((record) => record.mutationPackageId),
    commitReadyMutationPackageIds: records.filter((record) => record.status === "ready").map((record) => record.mutationPackageId),
    latestRecord: sortedRecords[0],
    outcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    statusCounts: records.reduce<NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot["statusCounts"]>(
      (counts, record) => {
        counts[record.status] = (counts[record.status] ?? 0) + 1
        return counts
      },
      {},
    ),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function mutationOutcomeCommitRecord(
  overrides: Partial<NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord> = {},
): NonCncPromotedQuoteApplicationMutationOutcomeCommitRecord {
  const sourceExecutionFingerprint =
    overrides.sourceExecutionFingerprint ?? "non-cnc-promoted-quote-application-mutation-execution-dry-run-ready"
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId:
      "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    blockerCount: 0,
    blockerLabels: [],
    commandOutcomeCount: 3,
    commandOutcomes: [
      {
        externalId: "active-rfq-quote:rfq-demo-204:ready",
        key: "replace_active_quote",
        message: "Prepared active RFQ quote mutation.",
        status: "applied",
      },
      {
        externalId: "offer-workspace:rfq-demo-204:ready",
        key: "refresh_offer_workspace",
        message: "Prepared offer workspace mutation.",
        status: "applied",
      },
      {
        externalId: "release-state:rfq-demo-204:ready",
        key: "open_offer_builder",
        message: "Prepared release-state mutation.",
        status: "applied",
      },
    ],
    commitRecordId: `non-cnc-application-mutation-outcome-commit:${sourceExecutionFingerprint}`,
    commitVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION,
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
    executionStatus: "succeeded",
    mutationPackageId:
      "non-cnc-promoted-quote-application-mutation-package:rfq-demo-204:non-cnc-promoted-quote-application-rfq-demo-204-package-ready",
    packageId: "package-ready",
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordedAt: "2026-06-29T12:20:00.000Z",
    recordedBy: "FactoryBid Operator",
    reviewWarnings: ["Operator must resolve blocked mutation commit."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    sourceExecutionFingerprint,
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
    ...overrides,
  }
}
