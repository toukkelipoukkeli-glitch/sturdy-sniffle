import { describe, expect, it } from "vitest"

import {
  buildNonCncPromotedQuoteApplicationMutationApplyPlan,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION,
} from "./nonCncPromotedQuoteApplicationMutationApplyPlan"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
  type NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel,
} from "./nonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel"

describe("non-CNC promoted quote application mutation apply plan", () => {
  it("builds ready adapter descriptors from a ready mutation outcome commit read model", () => {
    const plan = buildNonCncPromotedQuoteApplicationMutationApplyPlan(readyReadModel())

    expect(plan).toMatchObject({
      applyPlanId:
        "non-cnc-promoted-quote-application-mutation-apply-plan:rfq-demo-204:non-cnc-promoted-quote-application-mutation-package-rfq-demo-204-ready",
      blockerLabels: [],
      commandCount: 3,
      committedOutcomeCount: 3,
      executionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
      mutationBoundary:
        "Application mutation apply plans are deterministic adapter descriptors only; building the plan does not mutate active RFQ quote, offer, or release state.",
      nextOperatorMessage:
        "Promoted non-CNC mutation outcome commit is ready for a future adapter to apply active RFQ, offer, and release updates.",
      planVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION,
      status: "ready",
      targetRfqId: "rfq-demo-204",
    })
    expect(plan.commands).toEqual([
      {
        applicationTargetId:
          "non-cnc-promoted-quote-application-mutation-target:apply_active_rfq_quote:rfq-demo-204:non-cnc-promoted-quote-application-mutation-execution-ready",
        blockerLabels: [],
        key: "apply_active_rfq_quote",
        label: "Apply active RFQ quote",
        mutationTarget: "active_rfq_quote",
        reviewWarnings: ["Material certificate required."],
        sourceExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
        status: "ready",
        targetRfqId: "rfq-demo-204",
      },
      {
        applicationTargetId:
          "non-cnc-promoted-quote-application-mutation-target:apply_offer_workspace:rfq-demo-204:non-cnc-promoted-quote-application-mutation-execution-ready",
        blockerLabels: [],
        key: "apply_offer_workspace",
        label: "Apply offer workspace",
        mutationTarget: "offer_workspace",
        reviewWarnings: ["Material certificate required."],
        sourceExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
        status: "ready",
        targetRfqId: "rfq-demo-204",
      },
      {
        applicationTargetId:
          "non-cnc-promoted-quote-application-mutation-target:apply_release_state:rfq-demo-204:non-cnc-promoted-quote-application-mutation-execution-ready",
        blockerLabels: [],
        key: "apply_release_state",
        label: "Apply release state",
        mutationTarget: "release_state",
        reviewWarnings: ["Material certificate required."],
        sourceExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
        status: "ready",
        targetRfqId: "rfq-demo-204",
      },
    ])
  })

  it("keeps blocked read models review-only and withholds target ids", () => {
    const plan = buildNonCncPromotedQuoteApplicationMutationApplyPlan({
      ...readyReadModel(),
      blockerLabels: ["Mutation commit must be reviewed."],
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      mutationTargets: [],
      status: "blocked",
    })

    expect(plan).toMatchObject({
      blockerLabels: [
        "Application mutation outcome commit read model is not ready to apply.",
        "Mutation outcome commit execution fingerprint is missing.",
        "Mutation outcome commit has no committed outcomes.",
        "Mutation outcome commit has no mutation targets.",
        "Mutation commit must be reviewed.",
      ],
      committedOutcomeCount: 0,
      executionFingerprint: undefined,
      status: "blocked",
      targetRfqId: undefined,
    })
    expect(plan.commands).toHaveLength(3)
    expect(plan.commands.every((command) => command.status === "blocked")).toBe(true)
    expect(plan.commands.every((command) => command.applicationTargetId === undefined)).toBe(true)
  })

  it("rejects unsluggable ready read model identifiers before building shared ids", () => {
    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationApplyPlan({
        ...readyReadModel(),
        targetRfqId: "!!!",
      }),
    ).toThrow("readModel.targetRfqId must contain at least one alphanumeric character")

    expect(() =>
      buildNonCncPromotedQuoteApplicationMutationApplyPlan({
        ...readyReadModel(),
        mutationPackageId: ":::",
      }),
    ).toThrow("readModel.mutationPackageId must contain at least one alphanumeric character")
  })
})

function readyReadModel(): NonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel {
  return {
    applicationId: "non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    applicationRecordId:
      "non-cnc-promoted-quote-application-record:non-cnc-promoted-quote-application:rfq-demo-204:package-ready",
    blockerLabels: [],
    committedOutcomeCount: 3,
    disposition: "commit_ready",
    executionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-ready",
    executionStatus: "succeeded",
    mutationBoundary:
      "Application mutation outcome commit read models are deterministic review data only; active RFQ quote, offer, and release state stay unchanged until a later adapter applies them.",
    mutationPackageId: "non-cnc-promoted-quote-application-mutation-package:rfq-demo-204:ready",
    mutationTargets: ["active_rfq_quote", "offer_workspace", "release_state"],
    nextOperatorMessage:
      "Promoted non-CNC application mutation outcome commit is ready for a future active RFQ, offer, and release mutation adapter.",
    packageId: "package-ready",
    readModelVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    reviewWarnings: ["Material certificate required."],
    selectedPlanId: "non-cnc-promotion:rfq-demo-204:sheet-metal:sm-120-bracket:sheet-metal-v1",
    sourceExecutionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-dry-run-ready",
    status: "ready_to_apply",
    targetRfqId: "rfq-demo-204",
  }
}
