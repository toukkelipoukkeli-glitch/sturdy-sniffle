import { describe, expect, it } from "vitest"

import {
  decideNonCncPromotedQuoteOfferExportLiveAdapter,
  type NonCncPromotedQuoteOfferExportLiveAdapterDecision,
} from "./nonCncPromotedQuoteOfferExportLiveAdapterDecision"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness,
} from "./nonCncPromotedQuoteOfferExportPackageProviderCommitReadiness"

const baseReadiness: NonCncPromotedQuoteOfferExportPackageProviderCommitReadiness = {
  artifactOutcomeCount: 4,
  blockerLabels: [],
  latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
  latestPackageId: "non-cnc-export-package:rfq-demo-204:ready",
  latestPlanId: "non-cnc-export-plan:rfq-demo-204:ready",
  latestReleaseExecutionFingerprint: "non-cnc-release-execution:rfq-demo-204:ready",
  latestSourceExecutionFingerprint: "non-cnc-export-source:rfq-demo-204:ready",
  latestStatus: "succeeded",
  nextOperatorMessage: "Provider commit history is ready for a future customer-offer export adapter.",
  persistedRecordCount: 1,
  providerCommitBoundary:
    "Provider commit readiness is deterministic review data only; this helper does not create customer offers, files, release reviews, exports, or connector writes.",
  readinessVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_COMMIT_READINESS_VERSION,
  requestedAt: "2026-08-03T12:40:00.000Z",
  requestedBy: "FactoryBid Operator",
  reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
  status: "ready",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC promoted quote offer export live adapter decision", () => {
  it("keeps live adapters blocked when final readiness is blocked", () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: {
        ...baseReadiness,
        blockerLabels: [
          "No persisted non-CNC offer export provider commit records are available.",
          "Latest provider commit record has no artifact outcomes.",
          "Latest provider commit record is missing an execution fingerprint.",
          "Latest provider commit record is missing a release execution fingerprint.",
        ],
        latestExecutionFingerprint: undefined,
        latestPackageId: undefined,
        latestPlanId: undefined,
        latestReleaseExecutionFingerprint: undefined,
        latestSourceExecutionFingerprint: undefined,
        status: "blocked",
      },
    })

    expect(decision).toMatchObject({
      adapterAction: "keep_review_only",
      canUseLiveAdapter: false,
      enabled: true,
      mode: "review_only",
      status: "blocked",
      targetRfqId: "rfq-demo-204",
    })
    expect("latestExecutionFingerprint" in decision).toBe(false)
    expect("latestPackageId" in decision).toBe(false)
    expect("latestPlanId" in decision).toBe(false)
    expect(decision.operatorSummary).toBe(
      "Live non-CNC customer-offer export adapter is blocked by No persisted non-CNC offer export provider commit records are available., Latest provider commit record has no artifact outcomes., Latest provider commit record is missing an execution fingerprint., and 1 more; review-only local fallback remains active.",
    )
    expect(decision.blockerLabels).toHaveLength(4)
  })

  it("defaults to review-only fallback even when final readiness evidence is ready", () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      readiness: baseReadiness,
    })

    expect(decision).toEqual({
      adapterAction: "keep_review_only",
      adapterBoundary:
        "Live non-CNC customer-offer export adapters remain disabled unless final readiness evidence is ready and the explicit provider-write opt-in is enabled.",
      blockerLabels: ["VITE_FACTORYBID_ENABLE_NON_CNC_EXPORT_PROVIDER_WRITES disabled"],
      canUseLiveAdapter: true,
      enabled: false,
      latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
      latestPackageId: "non-cnc-export-package:rfq-demo-204:ready",
      latestPlanId: "non-cnc-export-plan:rfq-demo-204:ready",
      latestReleaseExecutionFingerprint: "non-cnc-release-execution:rfq-demo-204:ready",
      latestSourceExecutionFingerprint: "non-cnc-export-source:rfq-demo-204:ready",
      mode: "review_only",
      nextActionLabels: [
        "Set VITE_FACTORYBID_ENABLE_NON_CNC_EXPORT_PROVIDER_WRITES=true only after live customer-offer, file, release-review, export, and connector adapters are deployed together.",
        "Keep local/mock fallback active while provider-write opt-in is disabled.",
      ],
      operatorSummary:
        "Final non-CNC export readiness evidence is ready, but provider-write opt-in is disabled; review-only local fallback remains active.",
      reviewWarnings: ["Latest provider commit record has 1 warning(s)."],
      status: "fallback",
      targetRfqId: "rfq-demo-204",
    } satisfies NonCncPromotedQuoteOfferExportLiveAdapterDecision)
  })

  it("allows guarded live adapter execution only when explicitly enabled", () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      enabled: true,
      readiness: baseReadiness,
    })

    expect(decision).toMatchObject({
      adapterAction: "enable_live_adapter",
      blockerLabels: [],
      canUseLiveAdapter: true,
      enabled: true,
      latestExecutionFingerprint: "non-cnc-export-provider-commit:rfq-demo-204:ready",
      mode: "live_adapter",
      status: "ready",
    })
    expect(decision.nextActionLabels).toEqual([
      "Enable the live customer-offer export adapter with idempotent provider-write execution.",
      "Keep local/mock fallback, audit history, and rollback diagnostics attached after enabling live writes.",
    ])
  })

  it("uses the supplied opt-in label and clones returned arrays", () => {
    const decision = decideNonCncPromotedQuoteOfferExportLiveAdapter({
      optInLabel: "VITE_ENABLE_TEST_NON_CNC_EXPORT_WRITES",
      readiness: baseReadiness,
    })

    decision.blockerLabels.push("mutated")
    decision.reviewWarnings.push("mutated warning")
    decision.nextActionLabels.push("mutated action")

    expect(decision.blockerLabels).toContain("mutated")
    expect(baseReadiness.reviewWarnings).toEqual(["Latest provider commit record has 1 warning(s)."])
    expect(
      decideNonCncPromotedQuoteOfferExportLiveAdapter({
        optInLabel: "VITE_ENABLE_TEST_NON_CNC_EXPORT_WRITES",
        readiness: baseReadiness,
      }).blockerLabels,
    ).toEqual(["VITE_ENABLE_TEST_NON_CNC_EXPORT_WRITES disabled"])
  })
})
