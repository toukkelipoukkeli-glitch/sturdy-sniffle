import { describe, expect, it } from "vitest"

import { summarizeOfferFollowUpActivities, type ConvexOfferFollowUpActivityRecord } from "./offerFollowUpActivityReadPersistence"
import {
  buildOfferFollowUpActivityReadiness,
  type OfferFollowUpActivityReadiness,
} from "./offerFollowUpActivityReadiness"
import type { OfferFollowUpActivityReadinessHistoryRecord } from "./offerFollowUpActivityReadinessHistory"
import { createLocalOfferFollowUpActivityReadinessHistoryPersistence } from "./offerFollowUpActivityReadinessHistoryPersistence"

describe("offer follow-up activity readiness history persistence", () => {
  it("keeps a deterministic local snapshot and dedupes records by readiness key", async () => {
    const adapter = createLocalOfferFollowUpActivityReadinessHistoryPersistence({
      initialSnapshot: {
        records: [
          historyRecord({
            readiness: readinessPartial(),
            readinessKey: "readiness:offer-204:coverage",
            recordedAt: "2026-07-03T07:05:00.000Z",
          }),
          historyRecord({
            readiness: readinessRecorded(),
            readinessKey: "readiness:offer-204:coverage",
            recordedAt: "2026-07-03T07:10:00.000Z",
          }),
        ],
      },
    })

    const snapshot = await adapter.recordReadiness(
      historyRecord({
        readiness: readinessReview(),
        readinessKey: "readiness:offer-204:review",
        recordedAt: "2026-07-03T07:08:00.000Z",
      }),
    )

    expect(snapshot).toMatchObject({
      currentReadinessKey: "readiness:offer-204:review",
      recordCount: 2,
      summary: {
        currentReadiness: {
          readinessKey: "readiness:offer-204:review",
          status: "review",
        },
        recordedRecordCount: 1,
        reviewRecordCount: 1,
        totalReadinessRecords: 2,
      },
    })
    expect(snapshot.records.map((record) => record.readinessKey)).toEqual([
      "readiness:offer-204:coverage",
      "readiness:offer-204:review",
    ])
    expect(snapshot.records[0]?.readiness.status).toBe("recorded")
  })

  it("normalizes a stale current readiness key to the newest valid record", () => {
    const adapter = createLocalOfferFollowUpActivityReadinessHistoryPersistence({
      initialSnapshot: {
        currentReadinessKey: "readiness:missing",
        records: [
          historyRecord({
            readiness: readinessPartial(),
            readinessKey: "readiness:offer-204:partial",
            recordedAt: "2026-07-03T07:05:00.000Z",
          }),
          historyRecord({
            readiness: readinessRecorded(),
            readinessKey: "readiness:offer-204:recorded",
            recordedAt: "2026-07-03T07:10:00.000Z",
          }),
        ],
      },
    })

    expect(adapter.snapshot()).toMatchObject({
      currentReadinessKey: "readiness:offer-204:recorded",
      summary: {
        currentReadiness: {
          readinessKey: "readiness:offer-204:recorded",
          status: "recorded",
        },
      },
    })
  })

  it("returns cloned snapshots so callers cannot mutate persisted records", async () => {
    const adapter = createLocalOfferFollowUpActivityReadinessHistoryPersistence()
    const snapshot = await adapter.recordReadiness(historyRecord())

    snapshot.records[0]?.readiness.nextActions.push("Mutated outside persistence.")

    expect(adapter.snapshot().records[0]?.readiness.nextActions).toEqual([
      "Persisted follow-up activity coverage is complete.",
    ])
  })

  it("rejects malformed seeded readiness records", () => {
    expect(() =>
      createLocalOfferFollowUpActivityReadinessHistoryPersistence({
        initialSnapshot: {
          records: [
            historyRecord({
              readiness: {
                ...readinessRecorded(),
                recordedTaskCount: 99,
              },
            }),
          ],
        },
      }),
    ).toThrow("readiness.recordedFollowUpTaskIds length must match its count")

    expect(() =>
      createLocalOfferFollowUpActivityReadinessHistoryPersistence({
        initialSnapshot: {
          records: [
            historyRecord({
              readiness: {
                ...readinessRecorded(),
                readinessVersion: "unsupported" as never,
              },
            }),
          ],
        },
      }),
    ).toThrow("follow-up activity readiness history version is not supported")
  })
})

function historyRecord(
  overrides: Partial<OfferFollowUpActivityReadinessHistoryRecord> = {},
): OfferFollowUpActivityReadinessHistoryRecord {
  return {
    offerId: "offer-204",
    readiness: readinessRecorded(),
    readinessKey: "readiness:offer-204:recorded",
    recordedAt: "2026-07-03T07:10:00.000Z",
    rfqId: "rfq-204",
    ...overrides,
  }
}

function readinessPartial(): OfferFollowUpActivityReadiness {
  return buildOfferFollowUpActivityReadiness({
    expectedFollowUpTaskIds: ["follow-first", "follow-later"],
    summary: followUpSummary([
      followUpRecord({
        message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
      }),
    ]),
  })
}

function readinessReview(): OfferFollowUpActivityReadiness {
  return buildOfferFollowUpActivityReadiness({
    expectedFollowUpTaskIds: ["follow-first"],
    summary: followUpSummary([
      followUpRecord({
        message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
      }),
      followUpRecord({
        _id: "activity-extra",
        createdAt: 200,
        message: "Scheduled offer follow-up follow-extra for OFFER-204 at 2026-07-04T07:00:00.000Z.",
      }),
    ]),
  })
}

function readinessRecorded(): OfferFollowUpActivityReadiness {
  return buildOfferFollowUpActivityReadiness({
    expectedFollowUpTaskIds: ["follow-first", "follow-later"],
    summary: followUpSummary([
      followUpRecord({
        message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
      }),
      followUpRecord({
        _id: "activity-later",
        createdAt: 200,
        message: "Scheduled offer follow-up follow-later for OFFER-204 at 2026-07-03T07:00:00.000Z.",
      }),
    ]),
  })
}

function followUpSummary(records: ConvexOfferFollowUpActivityRecord[]) {
  return summarizeOfferFollowUpActivities(records, { offerId: "convex-offer-204" })
}

function followUpRecord(overrides: Partial<ConvexOfferFollowUpActivityRecord> = {}): ConvexOfferFollowUpActivityRecord {
  return {
    _id: "activity-follow-up",
    createdAt: 100,
    kind: "calendar_event",
    message: "Scheduled offer follow-up follow-first for OFFER-204 at 2026-07-02T07:00:00.000Z.",
    offerId: "convex-offer-204",
    ...overrides,
  }
}
