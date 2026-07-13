import { describe, expect, it } from "vitest"

import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
  type OfferFollowUpActivityReadinessHistorySummary,
  type OfferFollowUpActivityReadinessRecordSummary,
  type OfferFollowUpActivityReadinessSyncSummary,
} from "./offerFollowUpActivityReadinessHistory"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
  type OfferFollowUpActivityReadinessSyncHealthSummary,
} from "./offerFollowUpActivityReadinessSyncHealth"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READINESS_READ_MODEL_VERSION,
  buildOfferFollowUpActivityReadinessReadModel,
} from "./offerFollowUpActivityReadinessReadModel"

describe("offer follow-up activity readiness read model", () => {
  it("marks recorded persisted readiness ready when sync health is clean", () => {
    const model = buildOfferFollowUpActivityReadinessReadModel({
      history: historySummary({ currentReadiness: recordSummary({ status: "recorded" }) }),
      sync: syncSummary({ currentSource: "convex", mode: "convex" }),
      syncHealth: syncHealthSummary({ status: "healthy" }),
    })

    expect(model).toMatchObject({
      blockerLabels: [],
      canUsePersistedRead: true,
      nextActionLabels: ["Use persisted follow-up readiness to avoid duplicate follow-up activity writes."],
      operatorSummary: "Current follow-up readiness is recorded from convex; persisted read coverage is ready.",
      readModelVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_READ_MODEL_VERSION,
      source: "convex",
      status: "ready",
      syncHealthStatus: "healthy",
      totalReadinessRecords: 1,
      warningLabels: [],
    })
  })

  it("keeps missing current readiness pending even when historical records exist", () => {
    const model = buildOfferFollowUpActivityReadinessReadModel({
      history: historySummary({ currentReadiness: undefined, totalReadinessRecords: 2 }),
      sync: syncSummary({ currentSource: "none", mode: "mixed", totalReadinessRecords: 2 }),
      syncHealth: syncHealthSummary({ status: "healthy" }),
    })

    expect(model).toMatchObject({
      canUsePersistedRead: false,
      currentReadiness: undefined,
      nextActionLabels: ["Read or record follow-up readiness before relying on persisted follow-up coverage."],
      operatorSummary: "No current follow-up readiness record is available across 2 persisted record(s).",
      source: "none",
      status: "pending",
      warningLabels: ["Follow-up readiness records are split across Convex/local/other sources."],
    })
  })

  it("reports partial readiness blockers from the current record", () => {
    const model = buildOfferFollowUpActivityReadinessReadModel({
      history: historySummary({
        currentReadiness: recordSummary({
          missingTaskCount: 2,
          nextActionCount: 1,
          status: "partial",
        }),
        missingTaskTotal: 2,
        partialRecordCount: 1,
      }),
      sync: syncSummary({ currentSource: "local", mode: "local" }),
      syncHealth: syncHealthSummary({ status: "healthy" }),
    })

    expect(model).toMatchObject({
      blockerLabels: ["2 expected follow-up task(s) are missing persisted activity."],
      canUsePersistedRead: false,
      nextActionLabels: ["Record 2 missing follow-up activity task(s)."],
      operatorSummary: "Current follow-up readiness is partial from local; 2 expected task(s) are missing.",
      source: "local",
      status: "partial",
    })
  })

  it("surfaces review warnings for unexpected and unmatched activity", () => {
    const model = buildOfferFollowUpActivityReadinessReadModel({
      history: historySummary({
        currentReadiness: recordSummary({
          status: "review",
          unexpectedTaskCount: 1,
          unmatchedActivityCount: 2,
        }),
        reviewRecordCount: 1,
        unexpectedTaskTotal: 1,
        unmatchedActivityTotal: 2,
      }),
      sync: syncSummary({ currentSource: "convex", mode: "other" }),
      syncHealth: syncHealthSummary({ status: "healthy" }),
    })

    expect(model.status).toBe("review")
    expect(model.warningLabels).toEqual([
      "Follow-up readiness records do not match the selected local or Convex identifiers.",
      "1 unexpected follow-up task id(s) need review.",
      "2 unmatched follow-up activity message(s) need review.",
    ])
    expect(model.nextActionLabels).toEqual(["Review persisted follow-up readiness before writing more activity records."])
  })

  it("blocks stale fallback reads before trusting recorded readiness", () => {
    const model = buildOfferFollowUpActivityReadinessReadModel({
      history: historySummary({ currentReadiness: recordSummary({ status: "recorded" }) }),
      sync: syncSummary({ currentSource: "convex", mode: "convex" }),
      syncHealth: syncHealthSummary({
        latestFallbackRecency: "stale",
        operatorSummary: "Follow-up readiness persistence used 1 fallback (read 1, write 0); latest fallback is stale.",
        recoveryActionLabels: ["Check Convex readiness reads before trusting remote follow-up history."],
        readFallbackCount: 1,
        severity: "critical",
        status: "read_fallback",
        totalFallbackCount: 1,
      }),
    })

    expect(model).toMatchObject({
      blockerLabels: ["Follow-up readiness persisted reads are stale or unavailable."],
      canUsePersistedRead: false,
      nextActionLabels: [
        "Check Convex readiness reads before trusting remote follow-up history.",
        "Keep local readiness history visible until persisted reads recover.",
      ],
      status: "fallback",
      syncHealthStatus: "read_fallback",
    })
  })

  it("keeps recorded readiness in fallback when recent fallback health is warning", () => {
    const model = buildOfferFollowUpActivityReadinessReadModel({
      history: historySummary({ currentReadiness: recordSummary({ status: "recorded" }) }),
      sync: syncSummary({ currentSource: "local", mode: "mixed" }),
      syncHealth: syncHealthSummary({
        operatorSummary: "Follow-up readiness persistence used 1 fallback (read 0, write 1); latest fallback is current.",
        recoveryActionLabels: ["Retry readiness writes after Convex persistence recovers."],
        severity: "warning",
        status: "write_fallback",
        totalFallbackCount: 1,
        writeFallbackCount: 1,
      }),
    })

    expect(model.status).toBe("fallback")
    expect(model.warningLabels).toEqual([
      "Follow-up readiness records are split across Convex/local/other sources.",
      "Follow-up readiness persistence used 1 fallback (read 0, write 1); latest fallback is current.",
    ])
    expect(model.blockerLabels).toEqual(["Follow-up readiness persisted reads are using local fallback."])
  })

  it("rejects unsupported summary versions", () => {
    expect(() =>
      buildOfferFollowUpActivityReadinessReadModel({
        history: {
          ...historySummary(),
          historyVersion: "wrong",
        } as unknown as OfferFollowUpActivityReadinessHistorySummary,
        sync: syncSummary(),
        syncHealth: syncHealthSummary(),
      }),
    ).toThrow("follow-up readiness history version is not supported")

    expect(() =>
      buildOfferFollowUpActivityReadinessReadModel({
        history: historySummary(),
        sync: syncSummary(),
        syncHealth: {
          ...syncHealthSummary(),
          healthVersion: "wrong",
        } as unknown as OfferFollowUpActivityReadinessSyncHealthSummary,
      }),
    ).toThrow("follow-up readiness sync health version is not supported")
  })

  it("clones current readiness before returning it", () => {
    const currentReadiness = recordSummary({ status: "recorded" })
    const model = buildOfferFollowUpActivityReadinessReadModel({
      history: historySummary({ currentReadiness }),
      sync: syncSummary({ currentSource: "convex", mode: "convex" }),
      syncHealth: syncHealthSummary({ status: "healthy" }),
    })

    expect(model.currentReadiness).toEqual(currentReadiness)
    expect(model.currentReadiness).not.toBe(currentReadiness)
  })
})

function historySummary(
  overrides: Partial<OfferFollowUpActivityReadinessHistorySummary> = {},
): OfferFollowUpActivityReadinessHistorySummary {
  return {
    currentReadiness: recordSummary(),
    historyVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_HISTORY_VERSION,
    latestRecordedAt: "2026-06-20T09:00:00.000Z",
    missingTaskTotal: 0,
    partialRecordCount: 0,
    pendingRecordCount: 0,
    recordedRecordCount: 1,
    reviewRecordCount: 0,
    statusCounts: { recorded: 1 },
    totalReadinessRecords: 1,
    unexpectedTaskTotal: 0,
    unmatchedActivityTotal: 0,
    ...overrides,
  }
}

function recordSummary(
  overrides: Partial<OfferFollowUpActivityReadinessRecordSummary> = {},
): OfferFollowUpActivityReadinessRecordSummary {
  return {
    expectedTaskCount: 2,
    missingTaskCount: 0,
    nextActionCount: 1,
    offerId: "offer-204",
    readinessKey: "readiness:offer-204:recorded",
    readinessVersion: "offer-follow-up-activity-readiness.v1",
    recordedAt: "2026-06-20T09:00:00.000Z",
    recordedTaskCount: 2,
    rfqId: "rfq-204",
    status: "recorded",
    totalActivities: 2,
    unexpectedTaskCount: 0,
    unmatchedActivityCount: 0,
    ...overrides,
  }
}

function syncSummary(overrides: Partial<OfferFollowUpActivityReadinessSyncSummary> = {}): OfferFollowUpActivityReadinessSyncSummary {
  return {
    convexRecordCount: 1,
    currentSource: "convex",
    localRecordCount: 0,
    mode: "convex",
    otherRecordCount: 0,
    totalReadinessRecords: 1,
    ...overrides,
  }
}

function syncHealthSummary(
  overrides: Partial<OfferFollowUpActivityReadinessSyncHealthSummary> = {},
): OfferFollowUpActivityReadinessSyncHealthSummary {
  return {
    healthVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_SYNC_HEALTH_VERSION,
    latestFallbackRecency: "none",
    operatorSummary: "Follow-up readiness persistence is healthy with no local fallback operations recorded.",
    recentFallbacks: [],
    recoveryActionLabels: [],
    readFallbackCount: 0,
    severity: "healthy",
    status: "healthy",
    totalFallbackCount: 0,
    writeFallbackCount: 0,
    ...overrides,
  }
}
