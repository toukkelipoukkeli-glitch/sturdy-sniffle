import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import type { QuoteReleaseGateDecision } from "../workspace/quoteReleaseGate"
import { QUOTE_RELEASE_GATE_VERSION } from "../workspace/quoteReleaseGate"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import { buildOfferEmailDraftPackage, type OfferEmailDraftPackage } from "./offerEmailDraftPackage"
import {
  buildOfferEmailDraftPackagePersistenceRecord,
  createLocalOfferEmailDraftPackagePersistence,
  fingerprintOfferEmailDraftPackage,
  OFFER_EMAIL_DRAFT_PACKAGE_PERSISTENCE_VERSION,
  type OfferEmailDraftPackagePersistenceRecord,
} from "./offerEmailDraftPackagePersistence"
import { buildOfferReleasePlan, type OfferReleasePlan } from "./offerReleasePlan"

describe("offer email draft package persistence", () => {
  it("records ready email draft packages with deterministic status summaries", async () => {
    const emailPackage = readyEmailPackage()
    const adapter = createLocalOfferEmailDraftPackagePersistence()

    const snapshot = await adapter.recordPackage({
      emailPackage,
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "Sari",
    })

    expect(snapshot).toMatchObject({
      blockedPackageFingerprints: [],
      packageCount: 1,
      readyPackageFingerprints: [fingerprintOfferEmailDraftPackage(emailPackage)],
      statusCounts: { ready: 1 },
    })
    expect(snapshot.records[0]).toMatchObject({
      attachmentFileNames: ["OFFER-204-rev1.pdf"],
      commandKey: "email-draft",
      offerId: "offer-204",
      offerNumber: "OFFER-204",
      packageFingerprint: fingerprintOfferEmailDraftPackage(emailPackage),
      persistenceVersion: OFFER_EMAIL_DRAFT_PACKAGE_PERSISTENCE_VERSION,
      recipient: "nora@example.test",
      recordedAt: "2026-06-20T06:05:00.000Z",
      recordedBy: "Sari",
      releaseAt: "2026-06-20T06:00:00.000Z",
      status: "ready",
    })
    expect(snapshot.records[0]?.emailPackage).toMatchObject({
      body: expect.stringContaining("Offer OFFER-204"),
      recipient: "nora@example.test",
      status: "ready",
    })
  })

  it("replaces packages with the same fingerprint instead of duplicating history rows", async () => {
    const adapter = createLocalOfferEmailDraftPackagePersistence()
    const readyPackage = readyEmailPackage()
    const blockedPackage = nonReadyCommandPackage()

    await adapter.recordPackage({
      emailPackage: readyPackage,
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "Sari",
    })
    const snapshot = await adapter.recordPackage({
      emailPackage: blockedPackage,
      recordedAt: "2026-06-20T09:10:00+03:00",
      recordedBy: "Sari",
    })

    expect(fingerprintOfferEmailDraftPackage(blockedPackage)).toBe(fingerprintOfferEmailDraftPackage(readyPackage))
    expect(snapshot.packageCount).toBe(1)
    expect(snapshot.readyPackageFingerprints).toEqual([])
    expect(snapshot.blockedPackageFingerprints).toEqual([fingerprintOfferEmailDraftPackage(blockedPackage)])
    expect(snapshot.statusCounts).toEqual({ blocked: 1 })
    expect(snapshot.records[0]).toMatchObject({
      attachmentFileNames: [],
      blockerLabels: ["Email draft command is requires_review."],
      recordedAt: "2026-06-20T06:10:00.000Z",
      status: "blocked",
    })
  })

  it("normalizes and dedupes seeded records by fingerprint", async () => {
    const emailPackage = readyEmailPackage()
    const firstRecord = recordFixture(emailPackage, "2026-06-20T09:05:00+03:00", "Sari")
    const secondRecord = recordFixture(emailPackage, "2026-06-20T09:10:00+03:00", "Mika")

    const adapter = createLocalOfferEmailDraftPackagePersistence({
      initialSnapshot: {
        records: [firstRecord, secondRecord],
      },
    })
    const snapshot = adapter.snapshot()

    expect(snapshot.packageCount).toBe(1)
    expect(snapshot.records[0]).toMatchObject({
      recordedAt: "2026-06-20T06:10:00.000Z",
      recordedBy: "Mika",
      status: "ready",
    })
  })

  it("normalizes optional package text before storing seeded records", () => {
    const emailPackage = {
      ...readyEmailPackage(),
      body: "  Customer body  ",
      bodyPreview: "  Customer body  ",
      commandKey: "  email-draft  ",
      recipient: "  nora@example.test  ",
      subject: "  Offer OFFER-204  ",
    }

    const adapter = createLocalOfferEmailDraftPackagePersistence({
      initialSnapshot: {
        records: [recordFixture(emailPackage, "2026-06-20T09:05:00+03:00", "Sari")],
      },
    })

    expect(adapter.snapshot().records[0]).toMatchObject({
      commandKey: "email-draft",
      emailPackage: {
        body: "Customer body",
        bodyPreview: "Customer body",
        commandKey: "email-draft",
        recipient: "nora@example.test",
        subject: "Offer OFFER-204",
      },
      recipient: "nora@example.test",
    })
  })

  it("omits whitespace-only optional package text from seeded records", () => {
    const emailPackage = {
      ...readyEmailPackage(),
      commandKey: " ",
      recipient: " ",
      subject: " ",
    }

    const adapter = createLocalOfferEmailDraftPackagePersistence({
      initialSnapshot: {
        records: [recordFixture(emailPackage, "2026-06-20T09:05:00+03:00", "Sari")],
      },
    })
    const record = adapter.snapshot().records[0]

    expect(record).not.toHaveProperty("commandKey")
    expect(record).not.toHaveProperty("recipient")
    expect(record?.emailPackage).not.toHaveProperty("commandKey")
    expect(record?.emailPackage).not.toHaveProperty("recipient")
    expect(record?.emailPackage).not.toHaveProperty("subject")
  })

  it("returns cloned snapshots so callers cannot mutate persistence state", async () => {
    const adapter = createLocalOfferEmailDraftPackagePersistence()
    const emailPackage = readyEmailPackage()
    const snapshot = await adapter.recordPackage({
      emailPackage,
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "Sari",
    })

    snapshot.records[0]?.attachmentFileNames.push("mutated.pdf")
    snapshot.records[0]?.emailPackage.blockerLabels.push("mutated blocker")
    snapshot.readyPackageFingerprints.push("mutated")

    expect(adapter.snapshot()).toMatchObject({
      packageCount: 1,
      readyPackageFingerprints: [fingerprintOfferEmailDraftPackage(emailPackage)],
      records: [
        {
          attachmentFileNames: ["OFFER-204-rev1.pdf"],
          emailPackage: {
            blockerLabels: [],
          },
        },
      ],
    })
  })

  it("rejects unsupported seeded records before local state is used", () => {
    const emailPackage = readyEmailPackage()

    expect(() =>
      createLocalOfferEmailDraftPackagePersistence({
        initialSnapshot: {
          records: [
            {
              ...recordFixture(emailPackage, "2026-06-20T09:05:00+03:00", "Sari"),
              persistenceVersion: "old-version" as never,
            },
          ],
        },
      }),
    ).toThrow("offer email draft package persistence version is not supported")

    expect(() =>
      createLocalOfferEmailDraftPackagePersistence({
        initialSnapshot: {
          records: [
            {
              ...recordFixture(emailPackage, "not-a-date", "Sari"),
            },
          ],
        },
      }),
    ).toThrow("recordedAt must be a valid ISO timestamp")

    expect(() =>
      createLocalOfferEmailDraftPackagePersistence({
        initialSnapshot: {
          records: [
            recordFixture(
              {
                ...emailPackage,
                status: "queued" as never,
              },
              "2026-06-20T09:05:00+03:00",
              "Sari",
            ),
          ],
        },
      }),
    ).toThrow("email package status must be blocked or ready")
  })
})

function readyEmailPackage(): OfferEmailDraftPackage {
  return buildOfferEmailDraftPackage(readyReleasePlan())
}

function nonReadyCommandPackage(): OfferEmailDraftPackage {
  const plan = readyReleasePlan()
  const emailCommand = plan.commands.find((command) => command.kind === "email_draft")
  if (!emailCommand?.payload) {
    throw new Error("test fixture expected an email command")
  }
  emailCommand.status = "requires_review"
  emailCommand.payload.attachments = ["OFFER-204-rev1.pdf"]
  return buildOfferEmailDraftPackage(plan)
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

function recordFixture(
  emailPackage: OfferEmailDraftPackage,
  recordedAt: string,
  recordedBy: string,
): OfferEmailDraftPackagePersistenceRecord {
  return buildOfferEmailDraftPackagePersistenceRecord({
    emailPackage,
    recordedAt,
    recordedBy,
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
