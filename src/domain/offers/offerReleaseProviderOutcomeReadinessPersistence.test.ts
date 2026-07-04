import { describe, expect, it } from "vitest"

import {
  OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
  type OfferReleaseProviderOutcomeReadiness,
} from "./offerReleaseProviderOutcomeReadiness"
import {
  createConvexOfferReleaseProviderOutcomeReadinessPersistence,
  createLocalOfferReleaseProviderOutcomeReadinessPersistence,
} from "./offerReleaseProviderOutcomeReadinessPersistence"

describe("offer release provider outcome readiness persistence", () => {
  it("keeps a deterministic local snapshot and dedupes by readiness key", async () => {
    const adapter = createLocalOfferReleaseProviderOutcomeReadinessPersistence({
      initialSnapshot: {
        records: [
          readinessPayload({
            readinessKey: "readiness:offer-019:ready",
            status: "ready",
          }),
          readinessPayload({
            readinessKey: "readiness:offer-019:ready",
            latestOutcomeFingerprint: "newer",
            status: "ready",
          }),
        ],
      },
    })

    const snapshot = await adapter.recordReadiness(readiness({ status: "blocked" }), {
      readinessKey: "readiness:offer-019:blocked",
    })

    expect(snapshot).toMatchObject({
      blockedReadinessKeys: ["readiness:offer-019:blocked"],
      readyReadinessKeys: ["readiness:offer-019:ready"],
      recordCount: 2,
      statusCounts: {
        blocked: 1,
        ready: 1,
      },
    })
    expect(snapshot.records.map((record) => record.readinessKey)).toEqual([
      "readiness:offer-019:blocked",
      "readiness:offer-019:ready",
    ])
    expect(snapshot.records[1]?.latestOutcomeFingerprint).toBe("newer")
  })

  it("routes readiness payloads through the configured Convex mutation", async () => {
    const calls: Array<{ args: Record<string, unknown>; mutationRef: unknown }> = []
    const adapter = createConvexOfferReleaseProviderOutcomeReadinessPersistence({
      mutationRef: "recordOfferProviderOutcomeReadiness",
      runMutation: async (mutationRef, args) => {
        calls.push({ args, mutationRef })
      },
    })

    const snapshot = await adapter.recordReadiness(readiness({ status: "ready" }), {
      offerId: "convex-offer-019",
      readinessKey: "readiness:convex-offer-019:ready",
    })

    expect(calls).toEqual([
      {
        mutationRef: "recordOfferProviderOutcomeReadiness",
        args: {
          appliedCommandCount: 2,
          blockerLabels: [],
          expectedCommandCount: 2,
          failedCommandCount: 0,
          latestCommandCount: 2,
          latestOutcomeFingerprint: "outcome-ready",
          missingCommandCount: 0,
          nextActions: ["Provider outcomes are ready for release execution."],
          offerId: "convex-offer-019",
          offerNumber: "OFFER-019",
          readinessKey: "readiness:convex-offer-019:ready",
          readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
          status: "ready",
        },
      },
    ])
    expect(snapshot.readyReadinessKeys).toEqual(["readiness:convex-offer-019:ready"])
  })

  it("keeps the local fallback hot when Convex persistence fails", async () => {
    const errors: string[] = []
    const adapter = createConvexOfferReleaseProviderOutcomeReadinessPersistence({
      mutationRef: "recordOfferProviderOutcomeReadiness",
      onPersistError: (error, payload) => {
        errors.push(`${error instanceof Error ? error.message : String(error)}:${payload.readinessKey}`)
      },
      runMutation: async () => {
        throw new Error("Convex unavailable")
      },
    })

    const snapshot = await adapter.recordReadiness(readiness({ status: "blocked" }), {
      readinessKey: "readiness:offer-019:blocked",
    })

    expect(errors).toEqual(["Convex unavailable:readiness:offer-019:blocked"])
    expect(snapshot).toMatchObject({
      blockedReadinessKeys: ["readiness:offer-019:blocked"],
      recordCount: 1,
    })
  })

  it("rejects contradictory ready payloads before local or Convex writes", async () => {
    const calls: Array<{ args: Record<string, unknown>; mutationRef: unknown }> = []
    const adapter = createConvexOfferReleaseProviderOutcomeReadinessPersistence({
      mutationRef: "recordOfferProviderOutcomeReadiness",
      runMutation: async (mutationRef, args) => {
        calls.push({ args, mutationRef })
      },
    })

    await expect(
      adapter.recordReadiness(
        readiness({
          appliedCommandCount: 1,
          failedCommandCount: 1,
          latestCommandCount: 2,
          status: "ready",
        }),
      ),
    ).rejects.toThrow("provider outcome readiness cannot be ready while failed or missing commands remain")
    expect(calls).toEqual([])
    expect(adapter.snapshot().recordCount).toBe(0)
  })
})

function readiness(
  overrides: Partial<OfferReleaseProviderOutcomeReadiness> = {},
): OfferReleaseProviderOutcomeReadiness {
  return {
    appliedCommandCount: 2,
    blockerLabels: [],
    expectedCommandCount: 2,
    failedCommandCount: 0,
    latestCommandCount: 2,
    latestOutcomeFingerprint: "outcome-ready",
    missingCommandCount: 0,
    nextActions: ["Provider outcomes are ready for release execution."],
    offerId: "offer-019",
    offerNumber: "OFFER-019",
    readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
    rfqId: "rfq-019",
    status: "ready",
    ...overrides,
  }
}

function readinessPayload(
  overrides: Partial<ReturnType<typeof createPayload>> = {},
): ReturnType<typeof createPayload> {
  return createPayload(overrides)
}

function createPayload(overrides: Partial<OfferReleaseProviderOutcomeReadiness> & { readinessKey?: string }) {
  const source = readiness(overrides)
  return {
    appliedCommandCount: source.appliedCommandCount,
    blockerLabels: [...source.blockerLabels],
    expectedCommandCount: source.expectedCommandCount,
    failedCommandCount: source.failedCommandCount,
    latestCommandCount: source.latestCommandCount,
    ...(source.latestOutcomeFingerprint ? { latestOutcomeFingerprint: source.latestOutcomeFingerprint } : {}),
    missingCommandCount: source.missingCommandCount,
    nextActions: [...source.nextActions],
    offerId: source.offerId,
    offerNumber: source.offerNumber,
    readinessKey: overrides.readinessKey ?? "readiness:offer-019:ready",
    readinessVersion: source.readinessVersion,
    rfqId: source.rfqId,
    status: source.status,
  }
}
