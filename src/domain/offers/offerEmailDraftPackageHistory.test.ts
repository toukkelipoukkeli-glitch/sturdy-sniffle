import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import type { QuoteReleaseGateDecision } from "../workspace/quoteReleaseGate"
import { QUOTE_RELEASE_GATE_VERSION } from "../workspace/quoteReleaseGate"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import { buildOfferEmailDraftPackage } from "./offerEmailDraftPackage"
import { summarizeOfferEmailDraftPackageHistory } from "./offerEmailDraftPackageHistory"
import { createLocalOfferEmailDraftPackagePersistence } from "./offerEmailDraftPackagePersistence"
import { buildOfferReleasePlan, type OfferReleasePlan } from "./offerReleasePlan"

describe("offer email draft package history", () => {
  it("summarizes persisted draft package records for operator history views", async () => {
    const adapter = createLocalOfferEmailDraftPackagePersistence()
    await adapter.recordPackage({
      emailPackage: readyEmailPackage(),
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "Sari",
    })
    await adapter.recordPackage({
      emailPackage: blockedEmailPackage(),
      recordedAt: "2026-06-20T09:10:00+03:00",
      recordedBy: "Mika",
    })

    const summary = summarizeOfferEmailDraftPackageHistory(adapter.snapshot())

    expect(summary).toEqual({
      attachmentCount: 1,
      blockedPackageCount: 1,
      blockerCount: 3,
      historyVersion: "offer-email-draft-package-history.v1",
      latestPackage: expect.objectContaining({
        attachmentCount: 0,
        blockerCount: 3,
        nextActionCount: 2,
        offerId: "offer-204",
        offerNumber: "OFFER-204",
        recordedAt: "2026-06-20T06:10:00.000Z",
        recordedBy: "Mika",
        releaseAt: "2026-06-20T06:00:00.000Z",
        rfqId: "rfq-204",
        status: "blocked",
        warningCount: 0,
      }),
      readyPackageCount: 1,
      recipientSummaries: [
        {
          latestRecordedAt: "2026-06-20T06:05:00.000Z",
          packageCount: 1,
          recipient: "nora@example.test",
          statuses: ["ready"],
        },
      ],
      statusCounts: {
        blocked: 1,
        ready: 1,
      },
      totalPackages: 2,
      warningCount: 0,
    })
  })

  it("returns an empty deterministic summary for an empty snapshot", () => {
    expect(summarizeOfferEmailDraftPackageHistory({ records: [] })).toEqual({
      attachmentCount: 0,
      blockedPackageCount: 0,
      blockerCount: 0,
      historyVersion: "offer-email-draft-package-history.v1",
      latestPackage: undefined,
      readyPackageCount: 0,
      recipientSummaries: [],
      statusCounts: {},
      totalPackages: 0,
      warningCount: 0,
    })
  })

  it("normalizes seeded record fields and rejects unsupported statuses", async () => {
    const adapter = createLocalOfferEmailDraftPackagePersistence()
    const snapshot = await adapter.recordPackage({
      emailPackage: readyEmailPackage(),
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "Sari",
    })
    const persistedRecord = snapshot.records[0]
    if (!persistedRecord) {
      throw new Error("test fixture expected a persisted record")
    }
    const record = {
      ...persistedRecord,
      commandKey: "  email-draft  ",
      recipient: "  nora@example.test  ",
      status: "queued" as never,
    }

    expect(() => summarizeOfferEmailDraftPackageHistory({ records: [record] })).toThrow(
      "email draft package history status must be blocked or ready",
    )

    expect(
      summarizeOfferEmailDraftPackageHistory({
        records: [
          {
            ...record,
            status: "ready",
          },
        ],
      }).latestPackage,
    ).toMatchObject({
      commandKey: "email-draft",
      recipient: "nora@example.test",
      status: "ready",
    })
  })
})

function readyEmailPackage() {
  return buildOfferEmailDraftPackage(readyReleasePlan())
}

function blockedEmailPackage() {
  const offerWithoutEmail = {
    ...offerDraft(),
    customer: {
      contactName: "Nora Buyer",
      name: "North Forge",
    },
  }
  return buildOfferEmailDraftPackage(
    buildOfferReleasePlan({
      actor: "sales",
      currentRfqStatus: "estimating",
      exportPackage: offerExportPackage(offerWithoutEmail),
      offer: offerWithoutEmail,
      offerId: "offer-204",
      releaseGate: releaseGate(),
      rfqId: "rfq-204",
      timezone: "Europe/Helsinki",
    }),
  )
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
