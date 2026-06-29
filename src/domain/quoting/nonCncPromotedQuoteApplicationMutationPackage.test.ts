import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteApplicationMutationPackage,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_PACKAGE_VERSION,
} from "./nonCncPromotedQuoteApplicationMutationPackage"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation package", () => {
  it("builds ready command descriptors from a ready application outcome read model", () => {
    const packagePlan = buildNonCncPromotedQuoteApplicationMutationPackage(readyReadModel())

    expect(packagePlan).toEqual({
      applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
      applicationRecordId:
        "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
      blockerLabels: [],
      commandCount: 3,
      commands: [
        {
          blockerLabels: [],
          key: "replace_active_quote",
          label: "Apply active RFQ quote",
          mutationTarget: "active_rfq_quote",
          reviewWarnings: ["Material certificate required."],
          sourceExecutionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
          status: "ready",
          targetRfqId: "rfq-demo-204",
        },
        {
          blockerLabels: [],
          key: "refresh_offer_workspace",
          label: "Refresh offer workspace",
          mutationTarget: "offer_workspace",
          reviewWarnings: ["Material certificate required."],
          sourceExecutionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
          status: "ready",
          targetRfqId: "rfq-demo-204",
        },
        {
          blockerLabels: [],
          key: "open_offer_builder",
          label: "Refresh release state",
          mutationTarget: "release_state",
          reviewWarnings: ["Material certificate required."],
          sourceExecutionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
          status: "ready",
          targetRfqId: "rfq-demo-204",
        },
      ],
      mutationBoundary:
        "Application mutation packages are deterministic adapter inputs only; building the package does not mutate active RFQ quote, offer, or release state.",
      mutationPackageId:
        "non-cnc-promoted-quote-application-mutation-package:rfq-demo-204:non-cnc-promoted-quote-application-rfq-demo-204-package-ready",
      nextOperatorMessage:
        "Application mutation package is ready for a future adapter to apply active RFQ, offer, and release updates.",
      packageId: "package-ready",
      packageVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_PACKAGE_VERSION,
      reviewWarnings: ["Material certificate required."],
      selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
      sourceExecutionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
  })

  it("keeps blocked read models as review-only command descriptors", () => {
    const packagePlan = buildNonCncPromotedQuoteApplicationMutationPackage({
      ...readyReadModel(),
      blockerLabels: ["Application outcome commit execution fingerprint is missing."],
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      mutationTargets: [],
      status: "blocked",
    })

    expect(packagePlan.status).toBe("blocked")
    expect(packagePlan.targetRfqId).toBeUndefined()
    expect(packagePlan.sourceExecutionFingerprint).toBeUndefined()
    expect(packagePlan.blockerLabels).toEqual([
      "Application outcome commit read model is not ready to apply.",
      "Application outcome commit execution fingerprint is missing.",
      "Application outcome commit has no committed outcomes.",
      "Application outcome commit has no mutation targets.",
    ])
    expect(packagePlan.commands).toHaveLength(3)
    expect(packagePlan.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(packagePlan.commands.every((command) => command.targetRfqId === undefined)).toBe(true)
    expect(packagePlan.commands[0]?.blockerLabels).toEqual(packagePlan.blockerLabels)
  })

  it("rejects unsluggable ready package ids before constructing shared mutation ids", () => {
    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationPackage({
        ...readyReadModel(),
        applicationId: "!!!",
      }),
    ).toThrow("readModel.applicationId must contain at least one alphanumeric character")
  })
})

function readyReadModel(): NonCncPromotedQuoteApplicationOutcomeCommitReadModel {
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId:
      "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    blockerLabels: [],
    committedOutcomeCount: 3,
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-application-execution-ready",
    mutationBoundary:
      "Application outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later mutation adapter applies them.",
    mutationTargets: ["active_rfq_quote", "offer_workspace", "release_state"],
    nextOperatorMessage: "Promoted non-CNC application outcome commit is ready for a future active RFQ, offer, and release mutation adapter.",
    packageId: "package-ready",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: ["Material certificate required."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    status: "ready_to_apply",
    targetRfqId: "rfq-demo-204",
  }
}
