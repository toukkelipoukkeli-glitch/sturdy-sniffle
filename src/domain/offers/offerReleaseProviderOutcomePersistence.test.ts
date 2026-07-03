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
import {
  buildOfferReleaseProviderOutcomePersistenceRecord,
  createLocalOfferReleaseProviderOutcomePersistence,
  fingerprintOfferReleaseProviderOutcomes,
  OFFER_RELEASE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
  type OfferReleaseProviderOutcomePersistenceRecord,
} from "./offerReleaseProviderOutcomePersistence"
import { buildOfferReleaseProviderCommandOutcomes } from "./offerReleaseProviderOutcomes"

describe("offer release provider outcome persistence", () => {
  it("records normalized provider outcome batches with deterministic status counts", async () => {
    const releasePlan = readyReleasePlan()
    const commandOutcomes = await readyCommandOutcomes(releasePlan)

    const record = buildOfferReleaseProviderOutcomePersistenceRecord({
      commandOutcomes,
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "sales",
      releasePlan,
    })

    expect(record).toMatchObject({
      appliedCommandCount: 6,
      commandCount: 6,
      failedCommandCount: 0,
      offerId: "offer-204",
      offerNumber: "OFFER-204",
      persistenceVersion: OFFER_RELEASE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
      recordedAt: "2026-06-20T06:05:00.000Z",
      recordedBy: "sales",
      rfqId: "rfq-204",
    })
    expect(record.outcomeFingerprint).toBe(
      fingerprintOfferReleaseProviderOutcomes({
        commandOutcomes,
        releasePlan,
      }),
    )
    expect(record.commandOutcomes.map((outcome) => outcome.key)).toEqual([
      "calendar-follow-up",
      "email-draft",
      "lifecycle-follow-up",
      "lifecycle-sent",
      "workspace-follow-up",
      "workspace-status",
    ])

    const adapter = createLocalOfferReleaseProviderOutcomePersistence()
    const snapshot = await adapter.recordOutcomes({
      commandOutcomes,
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "sales",
      releasePlan,
    })

    expect(snapshot).toMatchObject({
      appliedOutcomeFingerprints: [record.outcomeFingerprint],
      failedOutcomeFingerprints: [],
      outcomeCount: 1,
      statusCounts: { applied: 6 },
    })
  })

  it("isolates snapshots from later release plan and outcome mutations", async () => {
    const releasePlan = readyReleasePlan()
    const commandOutcomes = await readyCommandOutcomes(releasePlan)
    const adapter = createLocalOfferReleaseProviderOutcomePersistence()

    await adapter.recordOutcomes({
      commandOutcomes,
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "sales",
      releasePlan,
    })

    releasePlan.commands[0].label = "Mutated email command"
    commandOutcomes[0].warnings?.push("Mutated warning")
    const firstSnapshot = adapter.snapshot()
    firstSnapshot.records[0]?.commandOutcomes[0]?.warnings?.push("Snapshot mutation")

    const secondSnapshot = adapter.snapshot()
    expect(secondSnapshot.records[0].releasePlan.commands[0].label).toBe("Draft offer email")
    expect(secondSnapshot.records[0].commandOutcomes.flatMap((outcome) => outcome.warnings ?? [])).not.toContain(
      "Mutated warning",
    )
    expect(secondSnapshot.records[0].commandOutcomes.flatMap((outcome) => outcome.warnings ?? [])).not.toContain(
      "Snapshot mutation",
    )
  })

  it("dedupes seeded records by outcome fingerprint and reports failed batches", async () => {
    const releasePlan = readyReleasePlan()
    const failedCommandOutcomes = await blockedEmailCommandOutcomes(releasePlan)
    const firstRecord = buildOfferReleaseProviderOutcomePersistenceRecord({
      commandOutcomes: failedCommandOutcomes,
      recordedAt: "2026-06-20T09:05:00+03:00",
      recordedBy: "sales",
      releasePlan,
    })
    const duplicateRecord = {
      ...firstRecord,
      recordedAt: "2026-06-20T09:10:00+03:00",
    } satisfies OfferReleaseProviderOutcomePersistenceRecord

    const adapter = createLocalOfferReleaseProviderOutcomePersistence({
      initialSnapshot: {
        records: [firstRecord, duplicateRecord],
      },
    })

    expect(adapter.snapshot()).toMatchObject({
      appliedOutcomeFingerprints: [],
      failedOutcomeFingerprints: [firstRecord.outcomeFingerprint],
      outcomeCount: 1,
      statusCounts: { applied: 5, failed: 1 },
    })
  })

  it("rejects malformed command outcomes and seeded records", async () => {
    const releasePlan = readyReleasePlan()
    const commandOutcomes = await readyCommandOutcomes(releasePlan)

    expect(() =>
      buildOfferReleaseProviderOutcomePersistenceRecord({
        commandOutcomes: [commandOutcomes[0], commandOutcomes[0]],
        recordedBy: "sales",
        releasePlan,
      }),
    ).toThrow("duplicate provider command outcome")

    expect(() =>
      createLocalOfferReleaseProviderOutcomePersistence({
        initialSnapshot: {
          records: [
            ({
              ...buildOfferReleaseProviderOutcomePersistenceRecord({
                commandOutcomes,
                recordedBy: "sales",
                releasePlan,
              }),
              persistenceVersion: "unsupported",
            } as unknown as OfferReleaseProviderOutcomePersistenceRecord),
          ],
        },
      }),
    ).toThrow("offer release provider outcome persistence version is not supported")
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
