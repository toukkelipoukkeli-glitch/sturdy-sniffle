import { describe, expect, it } from "vitest"

import { NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION } from "./nonCncPromotedQuoteApplicationOutcomeCommit"
import {
  buildNonCncPromotedQuoteApplicationOutcomeCommitReadModel,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitReadModel"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot,
  type NonCncPromotedQuoteApplicationOutcomeCommitRecord,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitPersistence"

describe("non-CNC promoted quote application outcome commit read model", () => {
  it("blocks when no persisted application outcome commit is available", () => {
    const readModel = buildNonCncPromotedQuoteApplicationOutcomeCommitReadModel({
      snapshot: emptySnapshot(),
    })

    expect(readModel).toEqual({
      blockerLabels: ["No promoted quote application outcome commit record is available."],
      committedOutcomeCount: 0,
      mutationBoundary:
        "Application outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later mutation adapter applies them.",
      mutationTargets: [],
      nextOperatorMessage: "Resolve promoted quote application outcome commit blockers before applying it to active RFQ, offer, or release state.",
      readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
      reviewWarnings: [],
      status: "blocked",
    })
  })

  it("keeps review-only application outcome commits blocked and withholds mutation targets", () => {
    const blockedRecord = applicationOutcomeCommitRecord({
      blockerLabels: ["Application outcome draft must be ready before commit."],
      blockerCount: 1,
      commandOutcomeCount: 0,
      disposition: "review_only",
      executionFingerprint: undefined,
      status: "blocked",
    })
    const readModel = buildNonCncPromotedQuoteApplicationOutcomeCommitReadModel({
      snapshot: snapshotWithRecords([blockedRecord]),
    })

    expect(readModel).toMatchObject({
      applicationId: blockedRecord.applicationId,
      blockerLabels: [
        "Promoted quote application outcome commit record is blocked.",
        "Promoted quote application outcome commit record is review-only.",
        "Promoted quote application outcome commit execution fingerprint is missing.",
        "Promoted quote application outcome commit has no committed outcomes.",
        "Application outcome draft must be ready before commit.",
      ],
      committedOutcomeCount: 0,
      disposition: "review_only",
      executionFingerprint: undefined,
      mutationTargets: [],
      reviewWarnings: ["Operator must resolve blocked application commit."],
      status: "blocked",
    })
  })

  it("builds a ready-to-apply boundary from committed application outcome records", () => {
    const staleBlockedRecord = applicationOutcomeCommitRecord({
      applicationId: "non-cnc-promoted-quote-application:stale",
      blockerLabels: ["Stale blocked record."],
      blockerCount: 1,
      commandOutcomeCount: 0,
      disposition: "review_only",
      executionFingerprint: undefined,
      status: "blocked",
    })
    const readyRecord = applicationOutcomeCommitRecord({
      commandOutcomeCount: 3,
      disposition: "commit_ready",
      executionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
      reviewWarnings: ["Material certificate required."],
      status: "ready",
      warningCount: 1,
    })
    const readModel = buildNonCncPromotedQuoteApplicationOutcomeCommitReadModel({
      applicationId: readyRecord.applicationId,
      snapshot: snapshotWithRecords([staleBlockedRecord, readyRecord]),
    })

    expect(readModel).toMatchObject({
      applicationId: readyRecord.applicationId,
      applicationRecordId: readyRecord.applicationRecordId,
      blockerLabels: [],
      committedOutcomeCount: 3,
      disposition: "commit_ready",
      executionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
      mutationTargets: ["active_rfq_quote", "offer_workspace", "release_state"],
      packageId: readyRecord.packageId,
      readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
      reviewWarnings: ["Material certificate required."],
      selectedPlanId: readyRecord.selectedPlanId,
      status: "ready_to_apply",
      targetRfqId: readyRecord.targetRfqId,
    })
    expect(readModel.nextOperatorMessage).toContain("active RFQ, offer, and release mutation adapter")
  })
})

function emptySnapshot(): NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot {
  return {
    blockedApplicationIds: [],
    commitReadyApplicationIds: [],
    outcomeCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    statusCounts: {},
    warningCount: 0,
  }
}

function snapshotWithRecords(
  records: NonCncPromotedQuoteApplicationOutcomeCommitRecord[],
): NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot {
  return {
    blockedApplicationIds: records.filter((record) => record.status === "blocked").map((record) => record.applicationId),
    commitReadyApplicationIds: records.filter((record) => record.status === "ready").map((record) => record.applicationId),
    latestRecord: records[0],
    outcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    statusCounts: records.reduce<NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot["statusCounts"]>((counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    }, {}),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function applicationOutcomeCommitRecord(
  overrides: Partial<NonCncPromotedQuoteApplicationOutcomeCommitRecord> = {},
): NonCncPromotedQuoteApplicationOutcomeCommitRecord {
  const applicationRecordId =
    overrides.applicationRecordId ??
    "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready"
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId,
    blockerCount: 0,
    blockerLabels: [],
    commandOutcomeCount: 3,
    commitRecordId: `non-cnc-application-outcome-commit:${applicationRecordId}`,
    commitVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_VERSION,
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
    packageId: "package-ready",
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordedAt: "2026-06-28T11:10:00.000Z",
    recordedBy: "FactoryBid Operator",
    reviewWarnings: ["Operator must resolve blocked application commit."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
    ...overrides,
  }
}
