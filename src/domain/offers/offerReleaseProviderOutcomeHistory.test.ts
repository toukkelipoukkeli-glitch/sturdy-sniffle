import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import type { QuoteReleaseGateDecision } from "../workspace/quoteReleaseGate"
import { QUOTE_RELEASE_GATE_VERSION } from "../workspace/quoteReleaseGate"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferEmailDraftPackage, type OfferEmailDraftPackage } from "./offerEmailDraftPackage"
import { createLocalOfferEmailDraftProvider } from "./offerEmailDraftProvider"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import { buildOfferReleasePlan, type OfferReleasePlan } from "./offerReleasePlan"
import { summarizeOfferReleaseProviderOutcomeHistory } from "./offerReleaseProviderOutcomeHistory"
import {
  buildOfferReleaseProviderOutcomePersistenceRecord,
  createLocalOfferReleaseProviderOutcomePersistence,
  type OfferReleaseProviderOutcomePersistenceRecord,
} from "./offerReleaseProviderOutcomePersistence"
import { buildOfferReleaseProviderCommandOutcomes } from "./offerReleaseProviderOutcomes"

describe("offer release provider outcome history", () => {
  it("summarizes provider outcome batches for operator history views", async () => {
    const releasePlan = readyReleasePlan()
    const adapter = createLocalOfferReleaseProviderOutcomePersistence()
    await adapter.recordOutcomes({
      commandOutcomes: await readyCommandOutcomes(releasePlan),
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "Sari",
      releasePlan,
    })
    await adapter.recordOutcomes({
      commandOutcomes: await blockedEmailCommandOutcomes(releasePlan),
      recordedAt: "2026-06-20T09:10:00+03:00",
      recordedBy: "Mika",
      releasePlan,
    })

    const summary = summarizeOfferReleaseProviderOutcomeHistory(adapter.snapshot())

    expect(summary).toEqual({
      appliedCommandCount: 11,
      commandCount: 12,
      commandSummaries: [
        {
          commandKey: "calendar-follow-up",
          latestRecordedAt: "2026-06-20T06:10:00.000Z",
          outcomeCount: 2,
          statuses: ["applied"],
        },
        {
          commandKey: "email-draft",
          latestRecordedAt: "2026-06-20T06:10:00.000Z",
          outcomeCount: 2,
          statuses: ["applied", "failed"],
        },
        {
          commandKey: "lifecycle-follow-up",
          latestRecordedAt: "2026-06-20T06:10:00.000Z",
          outcomeCount: 2,
          statuses: ["applied"],
        },
        {
          commandKey: "lifecycle-sent",
          latestRecordedAt: "2026-06-20T06:10:00.000Z",
          outcomeCount: 2,
          statuses: ["applied"],
        },
        {
          commandKey: "workspace-follow-up",
          latestRecordedAt: "2026-06-20T06:10:00.000Z",
          outcomeCount: 2,
          statuses: ["applied"],
        },
        {
          commandKey: "workspace-status",
          latestRecordedAt: "2026-06-20T06:10:00.000Z",
          outcomeCount: 2,
          statuses: ["applied"],
        },
      ],
      failedCommandCount: 1,
      historyVersion: "offer-release-provider-outcome-history.v1",
      latestOutcomeBatch: expect.objectContaining({
        appliedCommandCount: 5,
        commandCount: 6,
        failedCommandCount: 1,
        failedCommandKeys: ["email-draft"],
        offerId: "offer-204",
        offerNumber: "OFFER-204",
        recordedAt: "2026-06-20T06:10:00.000Z",
        recordedBy: "Mika",
        releaseAt: "2026-06-20T06:00:00.000Z",
        rfqId: "rfq-204",
        warningCount: 1,
      }),
      statusCounts: {
        applied: 11,
        failed: 1,
      },
      totalOutcomeBatches: 2,
      warningCount: 3,
    })
  })

  it("returns an empty deterministic summary for an empty snapshot", () => {
    expect(summarizeOfferReleaseProviderOutcomeHistory({ records: [] })).toEqual({
      appliedCommandCount: 0,
      commandCount: 0,
      commandSummaries: [],
      failedCommandCount: 0,
      historyVersion: "offer-release-provider-outcome-history.v1",
      latestOutcomeBatch: undefined,
      statusCounts: {},
      totalOutcomeBatches: 0,
      warningCount: 0,
    })
  })

  it("normalizes seeded record fields and rejects unsupported statuses", async () => {
    const releasePlan = readyReleasePlan()
    const record = buildOfferReleaseProviderOutcomePersistenceRecord({
      commandOutcomes: await readyCommandOutcomes(releasePlan),
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "Sari",
      releasePlan,
    })
    const invalidRecord = {
      ...record,
      commandOutcomes: [
        {
          ...record.commandOutcomes[0],
          status: "queued",
        },
      ],
    } as unknown as OfferReleaseProviderOutcomePersistenceRecord

    expect(() => summarizeOfferReleaseProviderOutcomeHistory({ records: [invalidRecord] })).toThrow(
      "provider outcome history status must be applied or failed",
    )

    expect(
      summarizeOfferReleaseProviderOutcomeHistory({
        records: [
          {
            ...record,
            recordedAt: "2026-06-20T09:05:00+03:00",
            recordedBy: "  Sari  ",
          },
        ],
      }).latestOutcomeBatch,
    ).toMatchObject({
      recordedAt: "2026-06-20T06:05:00.000Z",
      recordedBy: "Sari",
    })
  })
})

async function readyCommandOutcomes(releasePlan: OfferReleasePlan) {
  const emailPackage = buildOfferEmailDraftPackage(releasePlan)
  const emailDraftResult = await createLocalOfferEmailDraftProvider().draftEmail(emailPackage)
  return buildOfferReleaseProviderCommandOutcomes({ emailDraftResult, releasePlan })
}

async function blockedEmailCommandOutcomes(releasePlan: OfferReleasePlan) {
  const blockedPackage: OfferEmailDraftPackage = {
    ...buildOfferEmailDraftPackage(releasePlan),
    attachmentFileNames: [],
    body: " ",
    commandKey: "email-draft",
    recipient: " ",
    status: "ready",
  }
  const emailDraftResult = await createLocalOfferEmailDraftProvider().draftEmail(blockedPackage)
  return buildOfferReleaseProviderCommandOutcomes({ emailDraftResult, releasePlan })
}

function readyReleasePlan(): OfferReleasePlan {
  const offer = offerDraft()
  return buildOfferReleasePlan({
    actor: "sales",
    currentRfqStatus: "ready",
    exportPackage: offerExportPackage(offer),
    followUpDueAt: "2026-06-24T09:00:00+03:00",
    followUpTaskId: "fu-204",
    offer,
    offerId: "offer-204",
    releaseGate: releaseGate(),
    rfqId: "rfq-204",
    timezone: "Europe/Helsinki",
  })
}

function offerDraft(): OfferDraft {
  return buildCncOfferDraft({
    customer: {
      contactName: "Nora Buyer",
      email: "nora@example.test",
      name: "North Forge",
    },
    issuedAt: "2026-06-20",
    offerNumber: "OFFER-204",
    quote: calculateCncQuote(aluminumBracketFixture),
    rfqReference: "rfq-204",
    subject: "Aluminum bracket production batch",
    validUntil: "2026-07-04",
  })
}

function offerExportPackage(offer: OfferDraft): OfferExportPackage {
  return buildOfferExportPackage({ offer })
}

function releaseGate(overrides: Partial<QuoteReleaseGateDecision> = {}): QuoteReleaseGateDecision {
  return {
    blockerCount: 0,
    checkedAt: "2026-06-20T09:00:00+03:00",
    checks: [],
    issues: [],
    nextActions: [],
    offerNumber: "OFFER-204",
    releaseGateVersion: QUOTE_RELEASE_GATE_VERSION,
    rfqId: "rfq-204",
    status: "ready",
    warningCount: 0,
    ...overrides,
  }
}
