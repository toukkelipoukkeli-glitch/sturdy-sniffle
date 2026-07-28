import { describe, expect, it } from "vitest"

import { NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION } from "./nonCncPromotedQuoteOfferCreationOutcomeCommit"
import {
  buildNonCncPromotedQuoteOfferCreationOutcomeCommitReadModel,
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  sortOfferCreationOutcomeCommitRecordsNewestFirst,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitReadModel"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot,
  type NonCncPromotedQuoteOfferCreationOutcomeCommitRecord,
} from "./nonCncPromotedQuoteOfferCreationOutcomeCommitPersistence"

describe("non-CNC promoted quote offer creation outcome commit read model", () => {
  it("blocks when no persisted customer-offer creation outcome commit is available", () => {
    const readModel = buildNonCncPromotedQuoteOfferCreationOutcomeCommitReadModel({
      snapshot: emptySnapshot(),
    })

    expect(readModel).toEqual({
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
    })
  })

  it("echoes the requested creation plan id when a persisted record is missing", () => {
    const readModel = buildNonCncPromotedQuoteOfferCreationOutcomeCommitReadModel({
      creationPlanId: "non-cnc-promoted-quote-offer-creation-plan:missing",
      snapshot: emptySnapshot(),
    })

    expect(readModel).toMatchObject({
      blockerLabels: ["No customer-offer creation outcome commit record is available."],
      creationPlanId: "non-cnc-promoted-quote-offer-creation-plan:missing",
      status: "blocked",
    })
  })

  it("keeps review-only customer-offer creation outcome commits blocked and withholds creation targets", () => {
    const blockedRecord = offerCreationOutcomeCommitRecord({
      blockerLabels: ["Customer-offer creation outcome draft must be ready before commit."],
      blockerCount: 1,
      commandOutcomeCount: 0,
      disposition: "review_only",
      executionFingerprint: undefined,
      releaseExecutionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })

    const readModel = buildNonCncPromotedQuoteOfferCreationOutcomeCommitReadModel({
      snapshot: snapshotWithRecords([blockedRecord]),
    })

    expect(readModel).toMatchObject({
      blockerLabels: [
        "Customer-offer creation outcome commit record is blocked.",
        "Customer-offer creation outcome commit record is review-only.",
        "Customer-offer creation outcome commit execution fingerprint is missing.",
        "Customer-offer creation outcome commit has no committed outcomes.",
        "Customer-offer creation outcome commit target RFQ is missing.",
        "Customer-offer creation outcome commit release execution fingerprint is missing.",
        "Customer-offer creation outcome draft must be ready before commit.",
      ],
      committedOutcomeCount: 0,
      creationPlanId: blockedRecord.creationPlanId,
      creationTargets: [],
      disposition: "review_only",
      executionFingerprint: undefined,
      releaseExecutionFingerprint: undefined,
      reviewWarnings: ["Operator must review customer-offer creation commit."],
      status: "blocked",
      targetRfqId: undefined,
    })
  })

  it("builds a ready-to-create boundary from committed customer-offer creation outcome records", () => {
    const readyRecord = offerCreationOutcomeCommitRecord({
      commandOutcomeCount: 3,
      disposition: "commit_ready",
      executionFingerprint: "non-cnc-promoted-quote-offer-creation-execution-ready",
      recordedAt: "2026-07-23T14:40:00.000Z",
      reviewWarnings: ["Offer wiring has a review warning."],
      status: "ready",
      warningCount: 1,
    })
    const staleBlockedRecord = offerCreationOutcomeCommitRecord({
      blockerLabels: ["Stale blocked customer-offer creation commit."],
      blockerCount: 1,
      commandOutcomeCount: 0,
      commitRecordId: `${readyRecord.commitRecordId}:stale`,
      disposition: "review_only",
      executionFingerprint: undefined,
      recordedAt: "2026-07-23T14:30:00.000Z",
      status: "blocked",
    })

    const readModel = buildNonCncPromotedQuoteOfferCreationOutcomeCommitReadModel({
      creationPlanId: readyRecord.creationPlanId,
      snapshot: snapshotWithRecords([staleBlockedRecord, readyRecord]),
    })

    expect(readModel).toMatchObject({
      blockerLabels: [],
      committedOutcomeCount: 3,
      creationPlanId: readyRecord.creationPlanId,
      creationTargets: ["customer_offer", "export_package", "release_review"],
      disposition: "commit_ready",
      executionFingerprint: "non-cnc-promoted-quote-offer-creation-execution-ready",
      packageId: readyRecord.packageId,
      readModelVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
      releaseExecutionFingerprint: readyRecord.releaseExecutionFingerprint,
      reviewWarnings: ["Offer wiring has a review warning."],
      selectedPlanId: readyRecord.selectedPlanId,
      status: "ready_to_create",
      targetRfqId: readyRecord.targetRfqId,
    })
    expect(readModel.nextOperatorMessage).toContain("future customer-offer adapter")
  })
})

function emptySnapshot(): NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot {
  return {
    blockedCreationPlanIds: [],
    commitReadyCreationPlanIds: [],
    outcomeCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    releaseExecutionFingerprints: [],
    statusCounts: {},
    targetRfqIds: [],
    warningCount: 0,
  }
}

function snapshotWithRecords(
  records: NonCncPromotedQuoteOfferCreationOutcomeCommitRecord[],
): NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot {
  const sortedRecords = [...records].sort(sortOfferCreationOutcomeCommitRecordsNewestFirst)
  return {
    blockedCreationPlanIds: records.filter((record) => record.status === "blocked").map((record) => record.creationPlanId),
    commitReadyCreationPlanIds: records.filter((record) => record.status === "ready").map((record) => record.creationPlanId),
    latestRecord: sortedRecords[0],
    outcomeCount: records.reduce((total, record) => total + record.commandOutcomeCount, 0),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: records.length,
    records,
    releaseExecutionFingerprints: records.flatMap((record) =>
      record.releaseExecutionFingerprint ? [record.releaseExecutionFingerprint] : [],
    ),
    statusCounts: records.reduce<NonCncPromotedQuoteOfferCreationOutcomeCommitPersistenceSnapshot["statusCounts"]>(
      (counts, record) => {
        counts[record.status] = (counts[record.status] ?? 0) + 1
        return counts
      },
      {},
    ),
    targetRfqIds: records.flatMap((record) => (record.targetRfqId ? [record.targetRfqId] : [])),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function offerCreationOutcomeCommitRecord(
  overrides: Partial<NonCncPromotedQuoteOfferCreationOutcomeCommitRecord> = {},
): NonCncPromotedQuoteOfferCreationOutcomeCommitRecord {
  return {
    blockerCount: 0,
    blockerLabels: [],
    commandOutcomeCount: 3,
    commitRecordId:
      "non-cnc-offer-creation-outcome-commit:non-cnc-promoted-quote-offer-creation-plan:rfq-demo-204:package-ready",
    commitVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_VERSION,
    creationPlanId: "non-cnc-promoted-quote-offer-creation-plan:rfq-demo-204:package-ready",
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-offer-creation-execution-ready",
    packageId: "non-cnc-promoted-quote-offer-creation-package:rfq-demo-204:ready",
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_CREATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordedAt: "2026-07-23T14:40:00.000Z",
    recordedBy: "FactoryBid Operator",
    releaseExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-apply-execution-ready",
    reviewWarnings: ["Operator must review customer-offer creation commit."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    status: "ready",
    targetRfqId: "rfq-demo-204",
    warningCount: 1,
    ...overrides,
  }
}
