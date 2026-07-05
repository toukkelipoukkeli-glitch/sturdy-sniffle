import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import App, { ProcessQuotePreviewCard, pdfPreviewLoadTimeoutMs } from "./App"
import { CNC_CALCULATOR_VERSION } from "./domain/quoting/cnc"
import { aluminumBracketFixture, rushTurnedSpacerFixture } from "./domain/quoting/cnc.fixtures"
import { buildNonCncQuotePromotionActionSummary } from "./domain/quoting/nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage } from "./domain/quoting/nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./domain/quoting/nonCncQuotePromotionDraft"
import { buildNonCncQuotePromotionExecutionOutcomeDraft } from "./domain/quoting/nonCncQuotePromotionExecutionOutcomeDraft"
import { buildNonCncQuotePromotionOutcomeCommitRun } from "./domain/quoting/nonCncQuotePromotionOutcomeCommit"
import { buildNonCncQuotePromotionPlan } from "./domain/quoting/nonCncQuotePromotionPlan"
import { buildNonCncQuotePromotionReadModel } from "./domain/quoting/nonCncQuotePromotionReadModel"
import { buildNonCncPromotedQuoteApplicationPlan } from "./domain/quoting/nonCncPromotedQuoteApplicationPlan"
import { buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft } from "./domain/quoting/nonCncPromotedQuoteApplicationExecutionOutcomeDraft"
import { buildNonCncPromotedQuoteApplicationOutcomeCommitRun } from "./domain/quoting/nonCncPromotedQuoteApplicationOutcomeCommit"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence,
  type NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot,
} from "./domain/quoting/nonCncPromotedQuoteApplicationOutcomeCommitPersistence"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_PACKAGE_VERSION } from "./domain/quoting/nonCncPromotedQuoteApplicationMutationPackage"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION } from "./domain/quoting/nonCncPromotedQuoteApplicationOutcomeCommitReadModel"
import { NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION } from "./domain/quoting/nonCncQuotePromotionExecutionPersistence"
import {
  NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
  type NonCncQuotePromotionOutcomeCommitPersistenceSnapshot,
} from "./domain/quoting/nonCncQuotePromotionOutcomeCommitPersistence"
import { createLocalNonCncQuotePromotionPersistence } from "./domain/quoting/nonCncQuotePromotionPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
  createLocalNonCncPromotedQuoteApplicationPersistence,
  type NonCncPromotedQuoteApplicationPersistenceSnapshot,
} from "./domain/quoting/nonCncPromotedQuoteApplicationPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot,
} from "./domain/quoting/nonCncPromotedQuoteApplicationExecutionPersistence"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationMutationExecutionRecord,
  type NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot,
} from "./domain/quoting/nonCncPromotedQuoteApplicationMutationExecutionPersistence"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION } from "./domain/quoting/nonCncPromotedQuoteApplicationMutationExecution"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION } from "./domain/quoting/nonCncPromotedQuoteApplicationMutationApplyExecution"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot,
} from "./domain/quoting/nonCncPromotedQuoteApplicationMutationApplyExecutionPersistence"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_OUTCOME_DRAFT_VERSION } from "./domain/quoting/nonCncPromotedQuoteApplicationMutationExecutionOutcomeDraft"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION } from "./domain/quoting/nonCncPromotedQuoteApplicationMutationApplyPlan"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot,
} from "./domain/quoting/nonCncPromotedQuoteApplicationMutationApplyPlanPersistence"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION } from "./domain/quoting/nonCncPromotedQuoteApplicationMutationOutcomeCommit"
import { NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION } from "./domain/quoting/nonCncPromotedQuoteApplicationMutationOutcomeCommitReadModel"
import {
  NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot,
} from "./domain/quoting/nonCncPromotedQuoteApplicationMutationOutcomeCommitPersistence"
import { OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION } from "./domain/offers/offerReleaseProviderOutcomeReadiness"
import { buildProcessDemoQuotes } from "./domain/quoting/processDemoQuotes"
import { buildProcessQuotePreview } from "./domain/quoting/processQuotePreview"
import { calculateQuote } from "./domain/quoting/registry"
import { calculateWorkspaceCncQuote } from "./domain/workspace/workspaceCncQuote"

function totalText(container: HTMLElement): string {
  return container.querySelector(".total-box span")?.textContent ?? ""
}

const originalClipboard = navigator.clipboard

function emptyPromotionOutcomeCommitSnapshot(): NonCncQuotePromotionOutcomeCommitPersistenceSnapshot {
  return {
    blockedPackageIds: [],
    commitReadyPackageIds: [],
    outcomeCount: 0,
    persistenceVersion: NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    statusCounts: {},
    warningCount: 0,
  }
}

function emptyPromotedQuoteApplicationSnapshot(): NonCncPromotedQuoteApplicationPersistenceSnapshot {
  return {
    applicationReadyIds: [],
    blockedApplicationIds: [],
    commandCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
    readyCommandCount: 0,
    recordCount: 0,
    records: [],
    statusCounts: {},
    warningCount: 0,
  }
}

function emptyPromotedQuoteApplicationExecutionSnapshot(): NonCncPromotedQuoteApplicationExecutionPersistenceSnapshot {
  return {
    applicationIds: [],
    applicationRecordIds: [],
    pendingActionCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    selectedPlanIds: [],
    statusCounts: {},
    warningCount: 0,
  }
}

function emptyPromotedQuoteApplicationMutationExecutionSnapshot(): NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot {
  return {
    applicationIds: [],
    applicationRecordIds: [],
    mutationPackageIds: [],
    pendingActionCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    selectedPlanIds: [],
    statusCounts: {},
    targetRfqIds: [],
    warningCount: 0,
  }
}

function emptyPromotedQuoteApplicationMutationOutcomeCommitSnapshot(): NonCncPromotedQuoteApplicationMutationOutcomeCommitPersistenceSnapshot {
  return {
    blockedMutationPackageIds: [],
    commitReadyMutationPackageIds: [],
    outcomeCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    statusCounts: {},
    warningCount: 0,
  }
}

function emptyPromotedQuoteApplicationMutationApplyPlanSnapshot(): NonCncPromotedQuoteApplicationMutationApplyPlanPersistenceSnapshot {
  return {
    applyReadyPlanIds: [],
    blockedCommandCount: 0,
    blockedPlanIds: [],
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION,
    readyCommandCount: 0,
    recordCount: 0,
    records: [],
    statusCounts: {},
    warningCount: 0,
  }
}

function emptyPromotedQuoteApplicationMutationApplyExecutionSnapshot(): NonCncPromotedQuoteApplicationMutationApplyExecutionPersistenceSnapshot {
  return {
    applicationIds: [],
    applicationRecordIds: [],
    applyPlanIds: [],
    mutationPackageIds: [],
    pendingActionCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    selectedPlanIds: [],
    sourceExecutionFingerprints: [],
    statusCounts: {},
    targetRfqIds: [],
    warningCount: 0,
  }
}

function stalePromotedQuoteApplicationMutationExecutionSnapshot(): NonCncPromotedQuoteApplicationMutationExecutionPersistenceSnapshot {
  const record = {
    actor: "Stale Operator",
    applicationId: "stale-application",
    applicationRecordId: "stale-application-record",
    appliedCommandCount: 0,
    blockedCommandCount: 0,
    commandCount: 3,
    executedAt: "2026-06-27T13:30:00.000Z",
    executionFingerprint: "non-cnc-promoted-quote-application-mutation-execution-stale",
    executionVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_VERSION,
    failedCommandCount: 0,
    mode: "dry_run" as const,
    mutationPackageId: "stale-mutation-package",
    packageId: "stale-package",
    pendingActionCount: 1,
    pendingCommandCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
    preparedCommandCount: 3,
    selectedPlanId: "stale-plan",
    status: "prepared" as const,
    targetRfqId: "stale-rfq",
    warningCount: 0,
  } satisfies NonCncPromotedQuoteApplicationMutationExecutionRecord
  return {
    applicationIds: [record.applicationId],
    applicationRecordIds: [record.applicationRecordId],
    latestRun: record,
    mutationPackageIds: [record.mutationPackageId],
    pendingActionCount: record.pendingActionCount,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
    recordCount: 1,
    records: [record],
    selectedPlanIds: [record.selectedPlanId],
    statusCounts: { prepared: 1 },
    targetRfqIds: [record.targetRfqId],
    warningCount: 0,
  }
}

function emptyPromotedQuoteApplicationOutcomeCommitSnapshot(): NonCncPromotedQuoteApplicationOutcomeCommitPersistenceSnapshot {
  return {
    blockedApplicationIds: [],
    commitReadyApplicationIds: [],
    outcomeCount: 0,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    recordCount: 0,
    records: [],
    statusCounts: {},
    warningCount: 0,
  }
}

describe("FactoryBid workspace (component)", () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.__FACTORYBID_WORKSPACE_CONVEX__ = undefined
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    })
  })

  it("renders the dense operator workspace with the first RFQ selected and a computed quote", async () => {
    const { container } = render(<App />)
    expect(screen.getByRole("heading", { name: "FactoryBid OS" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "CNC bracket FB-204-A" })).toBeInTheDocument()
    const initialPartPreview = screen.getByLabelText("Part preview")
    expect(initialPartPreview).toHaveTextContent("3D CAD model")
    const geometryPreview = within(initialPartPreview).getByLabelText("FB-204-A.step geometry preview")
    expect(geometryPreview).toHaveTextContent("STEP")
    expect(geometryPreview).toHaveTextContent("ready")
    expect(geometryPreview).toHaveTextContent(/step bounds/i)
    expect(geometryPreview).toHaveTextContent("120 x 80 x 6 mm")
    expect(geometryPreview).toHaveTextContent(/metadata geometry/i)
    const geometryReview = within(geometryPreview).getByLabelText("FB-204-A.step geometry review summary")
    expect(geometryReview).toHaveTextContent("ready")
    expect(geometryReview).toHaveTextContent("5 ready")
    expect(geometryReview).toHaveTextContent("0")
    expect(geometryReview).toHaveTextContent("Geometry descriptor is ready for operator preview.")
    const geometryThumbnail = within(initialPartPreview).getByLabelText("FB-204-A.step geometry thumbnail")
    expect(geometryThumbnail).toHaveTextContent("STEP")
    expect(geometryThumbnail).toHaveTextContent("120 x 80 x 6 mm")
    expect(geometryThumbnail).toHaveTextContent("Bounds")
    expect(geometryThumbnail).toHaveTextContent("ready")
    expect(screen.getByLabelText("Attachments")).toHaveTextContent("3D CAD model")
    expect(screen.getByLabelText("Attachments")).toHaveTextContent("PDF drawing")
    expect(screen.getByLabelText("Attachments")).toHaveTextContent("DXF drawing")
    expect(screen.getByLabelText("Attachments")).toHaveTextContent("Image thumbnail")
    const calendarPlan = screen.getByLabelText("RFQ calendar plan preview")
    expect(calendarPlan).toHaveTextContent("2 drafts")
    expect(calendarPlan).toHaveTextContent("Quote work: CNC bracket FB-204-A")
    expect(calendarPlan).toHaveTextContent("30 Jun, 12.00 - 30 Jun, 14.00")
    expect(calendarPlan).toHaveTextContent("Quote due: CNC bracket FB-204-A")
    expect(calendarPlan).toHaveTextContent("30 Jun, 14.30 - 30 Jun, 15.00")
    const processDemos = screen.getByLabelText("Non-CNC registry demos")
    expect(processDemos).toHaveTextContent("v1")
    expect(processDemos).toHaveTextContent("Sheet metal")
    expect(processDemos).toHaveTextContent("sheet-metal.v1")
    expect(within(processDemos).getByRole("button", { name: /Sheet metal/ })).toHaveTextContent("Best price")
    expect(within(processDemos).getByRole("button", { name: /Sheet metal/ })).toHaveTextContent("Fastest lead")
    expect(within(processDemos).getByRole("button", { name: /Sheet metal/ })).toHaveTextContent("Draft complete")
    expect(within(processDemos).getByRole("button", { name: /Sheet metal/ })).toHaveTextContent("4/4 inputs")
    expect(processDemos).toHaveTextContent("Wire EDM")
    expect(within(processDemos).getByRole("button", { name: /Wire EDM/ })).toHaveTextContent("Draft gaps")
    expect(within(processDemos).getByRole("button", { name: /Wire EDM/ })).toHaveTextContent("4/5 inputs")
    expect(processDemos).toHaveTextContent(
      "Preview-only registry edits are enabled for this process; active RFQ quote, offer, and release paths stay unchanged.",
    )
    expect(within(processDemos).getByLabelText("Non-CNC offer handoff readiness")).toHaveTextContent(
      "Sheet metal can be reviewed as a non-CNC offer candidate",
    )
    expect(within(processDemos).getByLabelText("Non-CNC offer handoff readiness")).toHaveTextContent(
      "Offer builder and release execution still use the active workspace quote.",
    )
    const promotionPlan = within(processDemos).getByLabelText("Non-CNC quote promotion plan")
    expect(promotionPlan).toHaveTextContent("Promotion plan")
    expect(promotionPlan).toHaveTextContent("blocked")
    expect(promotionPlan).toHaveTextContent("non-cnc-promotion:registry-demo:sheet-metal:sm-120-bracket:sheet-metal-v1")
    expect(promotionPlan).toHaveTextContent("Persisted non-CNC quote promotion is not wired to workspace state yet")
    expect(promotionPlan).toHaveTextContent("Offer builder remains guarded until the promoted quote is persisted.")
    await waitFor(() => {
      expect(within(processDemos).getByLabelText("Non-CNC promotion persistence snapshot")).toHaveTextContent(
        "Local promotion history: 1 record, 1 blocked, 0 candidates.",
      )
    })
    const promotionRecord = within(processDemos).getByLabelText("Non-CNC promotion persistence snapshot")
    expect(promotionRecord).toHaveTextContent("Persistence snapshot")
    expect(promotionRecord).toHaveTextContent("review only")
    expect(promotionRecord).toHaveTextContent("non-cnc-quote-promotion-persistence.v1")
    expect(promotionRecord).toHaveTextContent("Blocked: non-cnc-promotion:registry-demo:sheet-metal:sm-120-bracket:sheet-metal-v1")
    const promotionActions = within(processDemos).getByLabelText("Non-CNC promotion actions")
    expect(promotionActions).toHaveTextContent("Promotion actions")
    expect(promotionActions.querySelector(".process-demo-promotion-actions-heading strong")).toHaveTextContent("blocked")
    expect(promotionActions).toHaveTextContent("non-cnc-quote-promotion-actions.v1")
    expect(promotionActions).toHaveTextContent("Quote promotion guarded")
    expect(promotionActions).toHaveTextContent("Clear promotion blockers before updating the active RFQ quote")
    expect(promotionActions).toHaveTextContent("Review-only promotion records cannot update active RFQ quote state.")
    const promotionDraft = within(processDemos).getByLabelText("Non-CNC promotion draft payload")
    expect(promotionDraft).toHaveTextContent("Promotion draft")
    expect(promotionDraft).toHaveTextContent("non-cnc-quote-promotion-draft.v1")
    expect(promotionDraft).toHaveTextContent("Quote payload stays withheld until promotion is ready.")
    expect(promotionDraft).toHaveTextContent("No quote payload")
    const promotionPackage = within(processDemos).getByLabelText("Non-CNC promotion command package")
    expect(promotionPackage).toHaveTextContent("Command package")
    expect(promotionPackage).toHaveTextContent("blocked")
    expect(promotionPackage).toHaveTextContent("non-cnc-quote-promotion-command-package.v1")
    expect(promotionPackage).toHaveTextContent("non-cnc-promotion-command-package:non-cnc-promotion:registry-demo:sheet-metal")
    expect(promotionPackage).toHaveTextContent("0 payloads")
    expect(promotionPackage).toHaveTextContent("Payload withheld")
    const promotionOutcomeDraft = within(processDemos).getByLabelText("Non-CNC promotion outcome draft")
    expect(promotionOutcomeDraft).toHaveTextContent("Outcome draft")
    expect(promotionOutcomeDraft).toHaveTextContent("blocked")
    expect(promotionOutcomeDraft).toHaveTextContent("non-cnc-quote-promotion-execution-outcome-draft.v1")
    expect(promotionOutcomeDraft).toHaveTextContent("0 ready outcomes")
    expect(promotionOutcomeDraft).toHaveTextContent("3 blocked outcomes")
    expect(promotionOutcomeDraft).toHaveTextContent("Outcome withheld")
    const promotionOutcomeCommit = within(processDemos).getByLabelText("Non-CNC promotion commit plan")
    expect(promotionOutcomeCommit).toHaveTextContent("Commit plan")
    expect(promotionOutcomeCommit).toHaveTextContent("blocked")
    expect(promotionOutcomeCommit).toHaveTextContent("non-cnc-quote-promotion-outcome-commit.v1")
    expect(promotionOutcomeCommit).toHaveTextContent("0 outcomes")
    expect(promotionOutcomeCommit).toHaveTextContent("Outcome commit withheld")
    expect(promotionOutcomeCommit).toHaveTextContent("Commit withheld")
    expect(promotionOutcomeCommit).toHaveTextContent("Outcome draft must be ready before commit.")
    const promotionExecution = within(processDemos).getByLabelText("Non-CNC promotion execution audit")
    expect(promotionExecution).toHaveTextContent("Execution audit")
    expect(promotionExecution).toHaveTextContent("blocked")
    expect(promotionExecution).toHaveTextContent("non-cnc-quote-promotion-execution.v1")
    expect(promotionExecution).toHaveTextContent("Dry-run audit only")
    expect(promotionExecution).toHaveTextContent("non-cnc-quote-promotion-execution-")
    expect(promotionExecution).toHaveTextContent("3 commands")
    expect(promotionExecution).toHaveTextContent("Persisted non-CNC quote promotion is not wired to workspace state yet")
    await waitFor(() => {
      expect(within(processDemos).getByLabelText("Non-CNC promotion execution history")).toHaveTextContent(
        "Local execution history: 1 run, 3 pending actions, 0 warnings.",
      )
    })
    const promotionExecutionHistory = within(processDemos).getByLabelText("Non-CNC promotion execution history")
    expect(promotionExecutionHistory).toHaveTextContent("Execution history")
    expect(promotionExecutionHistory).toHaveTextContent("non-cnc-quote-promotion-execution-persistence.v1")
    expect(promotionExecutionHistory).toHaveTextContent("Status counts: blocked 1")
    const promotionCommitHistory = within(processDemos).getByLabelText("Non-CNC promotion commit history")
    expect(promotionCommitHistory).toHaveTextContent("Commit history")
    expect(promotionCommitHistory).toHaveTextContent("non-cnc-quote-promotion-outcome-commit-persistence.v1")
    expect(promotionCommitHistory).toHaveTextContent("Local outcome commit history: 1 record, 0 outcomes, 0 warnings.")
    expect(promotionCommitHistory).toHaveTextContent("review only")
    expect(promotionCommitHistory).toHaveTextContent("Status counts: blocked 1")
    const promotedQuoteReadModel = within(processDemos).getByLabelText("Non-CNC promoted quote read model")
    expect(promotedQuoteReadModel).toHaveTextContent("Promoted quote")
    expect(promotedQuoteReadModel).toHaveTextContent("blocked")
    expect(promotedQuoteReadModel).toHaveTextContent("No promoted quote")
    expect(promotedQuoteReadModel).toHaveTextContent("0 ids")
    expect(promotedQuoteReadModel).toHaveTextContent("Withheld until promoted")
    expect(promotedQuoteReadModel).toHaveTextContent("No committed execution fingerprint")
    const promotedQuoteApplicationPlan = within(processDemos).getByLabelText("Non-CNC promoted quote application plan")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("Application plan")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("blocked")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("Resolve promoted quote blockers before applying a non-CNC quote to the active RFQ.")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("No application payload")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("Promoted quote read model is not ready.")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("External id withheld")
    expect(promotedQuoteApplicationPlan).toHaveTextContent(
      "Application plan is deterministic review data only; it must not mutate active RFQ quote, offer, or release state until an operator commits it.",
    )
    await waitFor(() => {
      expect(within(processDemos).getByLabelText("Non-CNC promoted quote application history")).toHaveTextContent(
        "Local application history: 1 record, 0 ready, 1 blocked.",
      )
    })
    const promotedQuoteApplicationHistory = within(processDemos).getByLabelText("Non-CNC promoted quote application history")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("Application history")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("review only")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("non-cnc-promoted-quote-application-persistence.v1")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("FactoryBid Operator")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("0/3 ready")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("Status counts: blocked 1")
    const promotedQuoteApplicationCommitPlan = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application commit plan",
    )
    expect(promotedQuoteApplicationCommitPlan).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationCommitPlan).toHaveTextContent("Application commit plan")
    expect(promotedQuoteApplicationCommitPlan).toHaveTextContent("Application commit withheld")
    expect(promotedQuoteApplicationCommitPlan).toHaveTextContent("Application outcome draft must be ready before commit.")
    await waitFor(() => {
      expect(within(processDemos).getByLabelText("Non-CNC promoted quote application commit history")).toHaveTextContent(
        "Local application outcome commit history: 1 record, 0 outcomes, 0 warnings.",
      )
    })
    const promotedQuoteApplicationCommitHistory = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application commit history",
    )
    expect(promotedQuoteApplicationCommitHistory).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent("Application commit history")
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    )
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent("review only")
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent("Status counts: blocked 1")
    const promotedQuoteApplicationReadModel = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application read model",
    )
    expect(promotedQuoteApplicationReadModel).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("Application read model")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    )
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("0 outcomes")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("0 targets")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("Withheld until ready")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("Promoted quote application outcome commit record is blocked.")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("active RFQ quote, offer, and release state stay unchanged")
    const promotedQuoteApplicationMutationPackage = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation package",
    )
    expect(promotedQuoteApplicationMutationPackage).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("Application mutation package")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent(NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_PACKAGE_VERSION)
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("3 commands")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("Withheld until ready")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("replace active quote")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("Application outcome commit read model is not ready to apply.")
    const promotedQuoteApplicationMutationExecution = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation execution audit",
    )
    expect(promotedQuoteApplicationMutationExecution).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationExecution).toHaveTextContent("Mutation audit")
    expect(promotedQuoteApplicationMutationExecution).toHaveTextContent("non-cnc-promoted-quote-application-mutation-execution.v1")
    expect(promotedQuoteApplicationMutationExecution).toHaveTextContent("Dry-run mutation audit only")
    expect(promotedQuoteApplicationMutationExecution).toHaveTextContent("3 commands")
    expect(promotedQuoteApplicationMutationExecution).toHaveTextContent("blocked, blocked, blocked")
    expect(promotedQuoteApplicationMutationExecution).toHaveTextContent("Mutation id withheld")
    const promotedQuoteApplicationMutationOutcomeDraft = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation outcome draft",
    )
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveTextContent("Mutation outcome draft")
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_OUTCOME_DRAFT_VERSION,
    )
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveTextContent("0 ready outcomes")
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveTextContent("3 blocked outcomes")
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveTextContent(
      "Application outcome commit read model is not ready to apply.",
    )
    const promotedQuoteApplicationMutationCommitPlan = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation commit plan",
    )
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent("Mutation commit plan")
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION,
    )
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent("0 outcomes")
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent("Mutation commit withheld")
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent(
      "Application mutation outcome draft entry for Apply active RFQ quote is not ready for commit.",
    )
    await waitFor(() => {
      expect(within(processDemos).getByLabelText("Non-CNC promoted quote application mutation commit history")).toHaveTextContent(
        "Local mutation outcome commit history:",
      )
    })
    const promotedQuoteApplicationMutationCommitHistory = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation commit history",
    )
    expect(promotedQuoteApplicationMutationCommitHistory).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationCommitHistory).toHaveTextContent("Mutation commit history")
    expect(promotedQuoteApplicationMutationCommitHistory).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    )
    expect(promotedQuoteApplicationMutationCommitHistory).toHaveTextContent(
      "Local mutation outcome commit history: 3 records, 0 outcomes, 0 warnings.",
    )
    const promotedQuoteApplicationMutationReadModel = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation read model",
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("Mutation read model")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("0 outcomes")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("0 targets")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("Withheld until ready")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent(
      "Promoted quote application mutation outcome commit record is blocked.",
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent(
      "Promoted quote application mutation outcome commit record is review-only.",
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent(
      "Promoted quote application mutation outcome commit execution fingerprint is missing.",
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent(
      "Promoted quote application mutation outcome commit execution status is missing.",
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent(
      "Promoted quote application mutation outcome commit has no committed outcomes.",
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent(
      "Application outcome commit read model is not ready to apply.",
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("102 additional blockers")
    expect(promotedQuoteApplicationMutationReadModel).not.toHaveTextContent("Promoted quote target RFQ is missing.")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("active RFQ quote, offer, and release state stay unchanged")
    const promotedQuoteApplicationMutationApplyPlan = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation apply plan",
    )
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("Mutation apply plan")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION,
    )
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("3 commands")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("0 committed outcomes")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("Withheld until ready")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("Source fingerprint withheld")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("0 warnings")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("None")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("Apply active RFQ quote")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent(
      "Application mutation outcome commit read model is not ready to apply.",
    )
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("active RFQ quote, offer, or release state")
    const promotedQuoteApplicationMutationApplyExecution = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation apply execution audit",
    )
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveTextContent("Mutation apply audit")
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_VERSION,
    )
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveTextContent("Dry-run mutation apply audit only")
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveTextContent("3 commands")
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveTextContent("blocked, blocked, blocked")
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveTextContent("Apply id withheld")
    await waitFor(() => {
      expect(
        within(processDemos).getByLabelText("Non-CNC promoted quote application mutation apply execution history"),
      ).toHaveTextContent("Local mutation apply audit history:")
    })
    const promotedQuoteApplicationMutationApplyExecutionHistory = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation apply execution history",
    )
    expect(promotedQuoteApplicationMutationApplyExecutionHistory).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationApplyExecutionHistory).toHaveTextContent("Mutation apply audit history")
    expect(promotedQuoteApplicationMutationApplyExecutionHistory).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_EXECUTION_PERSISTENCE_VERSION,
    )
    expect(promotedQuoteApplicationMutationApplyExecutionHistory).toHaveTextContent("Local mutation apply audit history: 4 runs")
    expect(promotedQuoteApplicationMutationApplyExecutionHistory).toHaveTextContent("3 commands")
    expect(promotedQuoteApplicationMutationApplyExecutionHistory).toHaveTextContent("Prepared 0, blocked 3, pending 0")
    expect(promotedQuoteApplicationMutationApplyExecutionHistory).toHaveTextContent("Targets: None")
    expect(promotedQuoteApplicationMutationApplyExecutionHistory).toHaveTextContent("Status counts: blocked 4")
    await waitFor(() => {
      expect(within(processDemos).getByLabelText("Non-CNC promoted quote application mutation apply history")).toHaveTextContent(
        "Local mutation apply history:",
      )
    })
    const promotedQuoteApplicationMutationApplyHistory = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation apply history",
    )
    expect(promotedQuoteApplicationMutationApplyHistory).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationApplyHistory).toHaveTextContent("Mutation apply history")
    expect(promotedQuoteApplicationMutationApplyHistory).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_PERSISTENCE_VERSION,
    )
    expect(promotedQuoteApplicationMutationApplyHistory).toHaveTextContent(
      "Local mutation apply history: 2 records, 0 ready commands, 6 blocked commands.",
    )
    expect(promotedQuoteApplicationMutationApplyHistory).toHaveTextContent("0/3 ready")
    expect(promotedQuoteApplicationMutationApplyHistory).toHaveTextContent("Status counts: blocked 2")
    expect(promotedQuoteApplicationMutationCommitHistory).toHaveTextContent("review only")
    expect(promotedQuoteApplicationMutationCommitHistory).toHaveTextContent("Status counts: blocked 3")
    await waitFor(() => {
      expect(within(processDemos).getByLabelText("Non-CNC promoted quote application mutation execution history")).toHaveTextContent(
        "Local mutation execution history:",
      )
    })
    const promotedQuoteApplicationMutationExecutionHistory = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application mutation execution history",
    )
    expect(promotedQuoteApplicationMutationExecutionHistory).toHaveTextContent("Mutation execution history")
    expect(promotedQuoteApplicationMutationExecutionHistory).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_PERSISTENCE_VERSION,
    )
    expect(promotedQuoteApplicationMutationExecutionHistory).toHaveTextContent("Status counts: blocked")
    const promotedQuoteApplicationExecution = within(processDemos).getByLabelText("Non-CNC promoted quote application execution audit")
    expect(promotedQuoteApplicationExecution).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("Application audit")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("blocked")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("non-cnc-promoted-quote-application-execution.v1")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("Dry-run application audit only")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("non-cnc-promoted-quote-application-execution-")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("3 commands")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("blocked, blocked, blocked")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("Execution id withheld")
    await waitFor(() => {
      expect(within(processDemos).getByLabelText("Non-CNC promoted quote application execution history")).toHaveTextContent(
        "Local application execution history:",
      )
    })
    const promotedQuoteApplicationExecutionHistory = within(processDemos).getByLabelText(
      "Non-CNC promoted quote application execution history",
    )
    expect(promotedQuoteApplicationExecutionHistory).toHaveTextContent("Application execution history")
    expect(promotedQuoteApplicationExecutionHistory).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_EXECUTION_PERSISTENCE_VERSION,
    )
    expect(promotedQuoteApplicationExecutionHistory).toHaveTextContent("Status counts: blocked 2")
    // The deterministic engine produces a quote on first render (no AI required).
    expect(totalText(container)).toMatch(/€\d/)
  })

  it("routes provider outcome readiness through the Convex browser bridge", async () => {
    const calls: Array<{ args: Record<string, unknown>; mutationRef: unknown }> = []
    window.__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      offerIdsByLocalId: {
        "offer-204": "convex-offer-204",
      },
      offerProviderOutcomeReadinessMutationRef: "recordOfferProviderOutcomeReadiness",
      rfqIdsByLocalId: {
        "rfq-204": "convex-rfq-204",
      },
      runMutation: async (mutationRef, args) => {
        calls.push({ args, mutationRef })
      },
    }

    render(<App />)

    await waitFor(() => {
      expect(calls.some((call) => call.mutationRef === "recordOfferProviderOutcomeReadiness")).toBe(true)
    })
    const readinessCall = calls.find((call) => call.mutationRef === "recordOfferProviderOutcomeReadiness")
    expect(readinessCall?.args).toMatchObject({
      offerId: "convex-offer-204",
      offerNumber: "OFFER-204",
      readinessKey:
        "offer-provider-outcome-readiness:convex-offer-204:convex-rfq-204:offer-release-provider-outcome-readiness-v1:blocked",
      readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
      status: "blocked",
    })
    expect(readinessCall?.args).not.toHaveProperty("rfqId")
  })

  it("hydrates provider outcome readiness snapshots through the Convex browser bridge", async () => {
    const user = userEvent.setup()
    const mutationCalls: Array<{ args: Record<string, unknown>; mutationRef: unknown }> = []
    const queryCalls: Array<{ args: Record<string, unknown>; queryRef: unknown }> = []
    window.__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      offerIdsByLocalId: {
        "offer-204": "convex-offer-204",
      },
      offerProviderOutcomeReadinessMutationRef: "recordOfferProviderOutcomeReadiness",
      offerProviderOutcomeReadinessQueryRef: "listOfferProviderOutcomeReadiness",
      rfqIdsByLocalId: {
        "rfq-204": "convex-rfq-204",
      },
      runMutation: async (mutationRef, args) => {
        mutationCalls.push({ args, mutationRef })
      },
      runQuery: async (queryRef, args) => {
        queryCalls.push({ args, queryRef })
        return [
          {
            appliedCommandCount: 6,
            blockerLabels: [],
            expectedCommandCount: 6,
            failedCommandCount: 0,
            latestCommandCount: 6,
            missingCommandCount: 0,
            nextActions: ["Provider outcomes are ready for release execution."],
            offerId: "convex-offer-204",
            offerNumber: "OFFER-204",
            readinessKey:
              "offer-provider-outcome-readiness:convex-offer-204:convex-rfq-204:offer-release-provider-outcome-readiness-v1:ready",
            readinessVersion: OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
            rfqId: "convex-rfq-204",
            status: "ready",
          },
        ]
      },
    }

    render(<App />)
    await user.click(screen.getByRole("button", { name: /^Offer$/ }))

    await waitFor(() => {
      expect(queryCalls).toEqual([
        {
          args: {
            limit: 20,
            offerId: "convex-offer-204",
          },
          queryRef: "listOfferProviderOutcomeReadiness",
        },
      ])
      expect(mutationCalls.some((call) => call.mutationRef === "recordOfferProviderOutcomeReadiness")).toBe(true)
    })
    const readinessPersistence = screen.getByLabelText("Readiness persistence history")
    await waitFor(() => {
      expect(readinessPersistence).toHaveTextContent("2 readiness records")
      expect(readinessPersistence).toHaveTextContent("Ready 1")
      expect(readinessPersistence).toHaveTextContent("Blocked 1")
      expect(readinessPersistence).toHaveTextContent("Current readiness needs review")
    })
  })

  it("hydrates offer release execution history through the Convex browser bridge", async () => {
    const user = userEvent.setup()
    const queryCalls: Array<{ args: Record<string, unknown>; queryRef: unknown }> = []
    window.__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      offerIdsByLocalId: {
        "offer-204": "convex-offer-204",
      },
      offerReleaseExecutionsQueryRef: "listOfferReleaseExecutions",
      rfqIdsByLocalId: {
        "rfq-204": "convex-rfq-204",
      },
      runMutation: async () => {},
      runQuery: async (queryRef, args) => {
        queryCalls.push({ args, queryRef })
        return [
          {
            executedAt: "2026-06-20T08:55:00+03:00",
            executionFingerprint: "offer-release-execution-persisted",
            executionKey: "offer-release-execution:convex-offer-204:persisted",
            mode: "commit",
            nextActions: [],
            offerId: "convex-offer-204",
            status: "succeeded",
            warningCount: 0,
          },
        ]
      },
    }

    render(<App />)
    await user.click(screen.getByRole("button", { name: /^Offer$/ }))

    await waitFor(() => {
      expect(queryCalls).toEqual([
        {
          args: {
            limit: 20,
            offerId: "convex-offer-204",
          },
          queryRef: "listOfferReleaseExecutions",
        },
      ])
    })
    const releaseHistory = screen.getByLabelText("Offer release execution history")
    await waitFor(() => {
      expect(releaseHistory).toHaveTextContent("2 recorded runs")
    })

    const releaseGate = screen.getByLabelText("Quote release gate")
    await user.click(within(releaseGate).getByRole("button", { name: "Mark reviewed" }))
    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: "Move to ready" }))
    await user.click(screen.getByRole("button", { name: "Offer" }))
    const executionAudit = screen.getByLabelText("Offer release execution audit")
    await user.click(within(executionAudit).getByRole("button", { name: "Execute release" }))

    await waitFor(() => {
      expect(screen.getByLabelText("Offer release execution history")).toHaveTextContent("3 recorded runs")
      expect(screen.getByLabelText("Offer release execution history")).toHaveTextContent("Latest succeeded")
    })
  })

  it("hydrates offer follow-up activity reads through the Convex browser bridge", async () => {
    const user = userEvent.setup()
    const queryCalls: Array<{ args: Record<string, unknown>; queryRef: unknown }> = []
    window.__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      offerFollowUpActivitiesQueryRef: "listOfferFollowUpActivities",
      offerIdsByLocalId: {
        "offer-204": "convex-offer-204",
      },
      rfqIdsByLocalId: {
        "rfq-204": "convex-rfq-204",
      },
      runMutation: async () => {},
      runQuery: async (queryRef, args) => {
        queryCalls.push({ args, queryRef })
        return [
          {
            _id: "activity-follow-up-2",
            actorName: "Sari",
            createdAt: Date.parse("2026-07-03T07:05:00.000Z"),
            kind: "calendar_event",
            message: "Follow-up calendar hold updated for customer reply.",
            offerId: "convex-offer-204",
            rfqId: "convex-rfq-204",
          },
          {
            _id: "activity-follow-up-1",
            actorName: "Sari",
            createdAt: Date.parse("2026-07-03T07:00:00.000Z"),
            kind: "calendar_event",
            message: "Scheduled offer follow-up follow-up-rfq-204 for OFFER-204 at 2026-07-03T07:00:00.000Z.",
            offerId: "convex-offer-204",
            quoteId: "convex-quote-204",
            rfqId: "convex-rfq-204",
          },
        ]
      },
    }

    render(<App />)
    await user.click(screen.getByRole("button", { name: /^Offer$/ }))

    await waitFor(() => {
      expect(queryCalls).toEqual([
        {
          args: {
            limit: 20,
            offerId: "convex-offer-204",
          },
          queryRef: "listOfferFollowUpActivities",
        },
      ])
    })
    const followUpActivity = screen.getByLabelText("Offer follow-up activity reads")
    await waitFor(() => {
      expect(followUpActivity).toHaveTextContent("2 persisted activities")
      expect(followUpActivity).toHaveTextContent("Review")
      expect(followUpActivity).toHaveTextContent("Task IDs 1")
      expect(followUpActivity).toHaveTextContent("Expected 0")
      expect(followUpActivity).toHaveTextContent("Missing 0")
      expect(followUpActivity).toHaveTextContent("Review 1 persisted follow-up activity message without a recognized task id.")
      expect(followUpActivity).toHaveTextContent("Follow-up calendar hold updated for customer reply.")
      expect(followUpActivity).toHaveTextContent("activity-follow-up-2")
    })
    expect(within(followUpActivity).getByLabelText("Recorded follow-up task ids")).toHaveTextContent("follow-up-rfq-204")
    const readinessHistory = screen.getByLabelText("Follow-up activity readiness history")
    await waitFor(() => {
      expect(readinessHistory).toHaveTextContent("2 readiness snapshots")
      expect(readinessHistory).toHaveTextContent("Current review readiness")
      expect(readinessHistory).toHaveTextContent("1/0 follow-up task IDs recorded")
      expect(readinessHistory).toHaveTextContent("Review 1")
    })
  })

  it("skips duplicate Convex follow-up activity writes after a manual write in the same session", async () => {
    const user = userEvent.setup()
    const mutationCalls: Array<{ args: Record<string, unknown>; mutationRef: unknown }> = []
    const persistedActivities: Array<Record<string, unknown>> = []
    window.__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        createOfferFollowUpActivity: "createOfferFollowUpActivity",
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      offerFollowUpActivitiesQueryRef: "listOfferFollowUpActivities",
      offerIdsByLocalId: {
        "offer-204": "convex-offer-204",
      },
      rfqIdsByLocalId: {
        "rfq-204": "convex-rfq-204",
      },
      runMutation: async (mutationRef, args) => {
        mutationCalls.push({ args, mutationRef })
        if (mutationRef === "createOfferFollowUpActivity") {
          persistedActivities.push({
            _id: `activity-follow-up-${persistedActivities.length + 1}`,
            createdAt: Date.parse("2026-07-03T07:00:00.000Z") + persistedActivities.length,
            kind: "calendar_event",
            ...args,
          })
        }
      },
      runQuery: async () => persistedActivities,
    }

    render(<App />)
    await user.click(screen.getByRole("button", { name: /^Offer$/ }))
    await waitFor(() => {
      expect(screen.getByLabelText("Offer follow-up activity reads")).toHaveTextContent("0 persisted activities")
    })

    const releaseGate = screen.getByLabelText("Quote release gate")
    await user.click(within(releaseGate).getByRole("button", { name: "Mark reviewed" }))
    await user.click(screen.getByRole("button", { name: "Triage" }))
    mutationCalls.length = 0
    await user.click(screen.getByRole("button", { name: "Create follow-up" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Action timeline")).toHaveTextContent("Scheduled offer follow-up follow-up-rfq-204")
    })
    await user.click(screen.getByRole("button", { name: /^Offer$/ }))
    await waitFor(() => {
      expect(screen.getByLabelText("Offer follow-up activity reads")).toHaveTextContent("follow-up-rfq-204")
      expect(screen.getByLabelText("Offer follow-up activity reads")).toHaveTextContent("Expected 1")
      expect(screen.getByLabelText("Offer follow-up activity reads")).toHaveTextContent("Missing 0")
      expect(screen.getByLabelText("Offer follow-up activity reads")).toHaveTextContent(
        "Persisted follow-up activity coverage is complete.",
      )
    })
    expect(mutationCalls.filter((call) => call.mutationRef === "createOfferFollowUpActivity")).toEqual([
      {
        args: {
          actorName: "Sari",
          message: "Scheduled offer follow-up follow-up-rfq-204 for offer-204 at 2026-07-03T07:00:00.000Z.",
          offerId: "convex-offer-204",
          rfqId: "convex-rfq-204",
        },
        mutationRef: "createOfferFollowUpActivity",
      },
    ])
    mutationCalls.length = 0

    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: "Create follow-up" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Action timeline").querySelectorAll(".action-row")).toHaveLength(2)
    })
    expect(mutationCalls.filter((call) => call.mutationRef === "createOfferFollowUpActivity")).toEqual([])

    await user.click(screen.getByRole("button", { name: "Move to ready" }))
    await user.click(screen.getByRole("button", { name: /^Offer$/ }))
    await user.click(within(screen.getByLabelText("Offer release execution audit")).getByRole("button", { name: "Execute release" }))

    await waitFor(() => {
      expect(screen.getByLabelText("Offer release execution history")).toHaveTextContent("Latest succeeded")
    })
    expect(mutationCalls.filter((call) => call.mutationRef === "createOfferFollowUpActivity")).toEqual([])
    expect(mutationCalls.some((call) => call.mutationRef === "transitionRfqStatus")).toBe(true)
  })

  it("surfaces pending follow-up activity reads when no persisted records exist", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /^Offer$/ }))

    const followUpActivity = screen.getByLabelText("Offer follow-up activity reads")
    expect(followUpActivity).toHaveTextContent("0 persisted activities")
    expect(followUpActivity).toHaveTextContent("Pending")
    expect(followUpActivity).toHaveTextContent("Task IDs 0")
    expect(followUpActivity).toHaveTextContent("Expected 0")
    expect(followUpActivity).toHaveTextContent("Missing 0")
    expect(followUpActivity).toHaveTextContent("Latest None")
    expect(followUpActivity).toHaveTextContent("No persisted calendar follow-up activity records are available yet.")
    expect(followUpActivity).toHaveTextContent("No persisted follow-up activities have been recorded yet.")
    expect(followUpActivity).not.toHaveTextContent("activity-follow-up")
    expect(within(followUpActivity).getByText("Pending")).toHaveClass("offer-follow-up-activity-status-pending")
    expect(followUpActivity.querySelector(".offer-follow-up-activity-latest")).not.toBeInTheDocument()
    expect(within(followUpActivity).queryByLabelText("Recorded follow-up task ids")).not.toBeInTheDocument()
    const readinessHistory = screen.getByLabelText("Follow-up activity readiness history")
    await waitFor(() => {
      expect(readinessHistory).toHaveTextContent("1 readiness snapshot")
      expect(readinessHistory).toHaveTextContent("Current pending readiness")
      expect(readinessHistory).toHaveTextContent("0/0 follow-up task IDs recorded")
      expect(readinessHistory).toHaveTextContent("Records 1")
    })
    expect(within(readinessHistory).getByText("Pending")).toHaveClass("offer-follow-up-activity-status-pending")
  })

  it("restores follow-up activity readiness history snapshots from local storage", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole("button", { name: /^Offer$/ }))
    const readinessHistory = screen.getByLabelText("Follow-up activity readiness history")
    await waitFor(() => {
      expect(readinessHistory).toHaveTextContent("1 readiness snapshot")
      const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
      expect(stored.followUpActivityReadinessHistoryById?.[stored.selectedId]?.recordCount).toBe(1)
    })

    const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
    stored.activeView = "offer"
    window.localStorage.setItem("factorybid.workspace.v1", JSON.stringify(stored))
    unmount()

    render(<App />)
    const restoredHistory = screen.getByLabelText("Follow-up activity readiness history")
    expect(restoredHistory).toHaveTextContent("1 readiness snapshot")
    expect(restoredHistory).toHaveTextContent("Current pending readiness")
  })

  it("rejects malformed restored follow-up activity readiness history snapshots", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole("button", { name: /^Offer$/ }))
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
      expect(stored.followUpActivityReadinessHistoryById?.[stored.selectedId]?.recordCount).toBe(1)
    })

    const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
    stored.activeView = "offer"
    stored.followUpActivityReadinessHistoryById[stored.selectedId].records[0].readiness.recordedTaskCount = 99
    window.localStorage.setItem("factorybid.workspace.v1", JSON.stringify(stored))
    unmount()

    render(<App />)
    expect(screen.queryByRole("heading", { name: "Offer draft" })).toBeNull()
    await user.click(screen.getByRole("button", { name: /^Offer$/ }))
    await waitFor(() => {
      expect(screen.getByLabelText("Follow-up activity readiness history")).toHaveTextContent("1 readiness snapshot")
    })
  })

  it("surfaces provider outcome readiness persistence snapshots in the offer workspace", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Offer" }))

    const readinessPersistence = await screen.findByLabelText("Readiness persistence history")
    await waitFor(() => {
      expect(readinessPersistence).toHaveTextContent("1 readiness record")
      expect(readinessPersistence).toHaveTextContent("Current readiness needs review")
    })
    expect(readinessPersistence).toHaveTextContent("Current blocked")
    expect(readinessPersistence).toHaveTextContent("0/0 command outcomes recorded")
    expect(readinessPersistence).toHaveTextContent("offer-204:rfq-204")
  })

  it("previews non-CNC registry process quotes without enabling fake edits", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    render(<App />)

    const processDemos = screen.getByLabelText("Non-CNC registry demos")
    const selector = within(processDemos).getByLabelText("Process quote preview selector")
    expect(within(selector).getByRole("button", { name: /Sheet metal/ })).toHaveAttribute("aria-pressed", "true")
    const sheetMetalPreview = within(processDemos).getByLabelText("Selected non-CNC quote preview")
    expect(sheetMetalPreview).toHaveTextContent("SM-120-BRACKET")
    const sheetMetalEditor = within(sheetMetalPreview).getByLabelText("Sheet metal preview edit controls")
    expect(sheetMetalEditor).toHaveTextContent("Updates this registry preview only")
    fireEvent.change(within(sheetMetalEditor).getByLabelText("Bends"), { target: { value: "5" } })
    expect(sheetMetalEditor).toHaveTextContent("Sheet metal preview quote recalculated through the non-CNC edit registry.")
    expect(sheetMetalPreview).toHaveTextContent("€636.41")
    expect(within(selector).getByRole("button", { name: /Sheet metal/ })).toHaveTextContent("€636.41")
    const [blankLengthInput] = within(sheetMetalEditor).getAllByRole("spinbutton")
    fireEvent.change(blankLengthInput, { target: { value: "" } })
    expect(blankLengthInput).toHaveValue(null)
    expect(sheetMetalEditor).toHaveTextContent("blankLengthMm must be a positive finite number")
    fireEvent.change(blankLengthInput, { target: { value: "250" } })
    expect(blankLengthInput).toHaveValue(250)
    expect(sheetMetalEditor).toHaveTextContent("Sheet metal preview quote recalculated through the non-CNC edit registry.")

    fireEvent.click(within(selector).getByRole("button", { name: /Wire EDM/ }))

    expect(within(selector).getByRole("button", { name: /Wire EDM/ })).toHaveAttribute("aria-pressed", "true")
    const comparison = within(processDemos).getByLabelText("Process quote comparison summary")
    expect(comparison).toHaveTextContent("Best price")
    expect(comparison).toHaveTextContent("Sheet metal")
    expect(comparison).toHaveTextContent("+€5,173.33")
    expect(comparison).toHaveTextContent("+9d lead")
    const selectedPreview = within(processDemos).getByLabelText("Selected non-CNC quote preview")
    expect(selectedPreview).toHaveTextContent("EDM-KEY-077")
    expect(within(selectedPreview).getByLabelText("Process quote assumptions")).toHaveTextContent("stock weight kg per part")
    expect(within(selectedPreview).getByLabelText("Process quote review flags")).toHaveTextContent("No calculator flags")
    const inputReadiness = within(selectedPreview).getByLabelText("Process input readiness")
    expect(inputReadiness).toHaveTextContent("Editable inputs blocked")
    expect(inputReadiness).toHaveTextContent("wire settings")
    const plannedFields = within(inputReadiness).getByLabelText("Planned process input fields")
    expect(plannedFields).toHaveTextContent("Wire diameter")
    expect(plannedFields).toHaveTextContent("Finish passes")
    const adapterStatus = within(inputReadiness).getByLabelText("Non-CNC input edit adapter status")
    expect(adapterStatus).toHaveTextContent("Domain adapter ready")
    expect(adapterStatus).toHaveTextContent("wire-edm-input-edits.v1")
    expect(adapterStatus).toHaveTextContent("6 editable fields mapped")
    expect(adapterStatus).toHaveTextContent("0 read-only fields guarded")
    expect(adapterStatus).toHaveTextContent("Preview controls enabled for supported fields")
    const wireEditor = within(selectedPreview).getByLabelText("Wire EDM preview edit controls")
    expect(wireEditor).toHaveTextContent("Wire EDM only")
    fireEvent.change(within(wireEditor).getByLabelText(/Stock length/), { target: { value: "120" } })
    fireEvent.change(within(wireEditor).getByLabelText(/Stock width/), { target: { value: "70" } })
    fireEvent.change(within(wireEditor).getByLabelText(/Stock height/), { target: { value: "24" } })
    fireEvent.change(within(wireEditor).getByLabelText(/Contour length/), { target: { value: "900" } })
    fireEvent.change(within(wireEditor).getByLabelText("Skim passes"), { target: { value: "3" } })
    fireEvent.change(within(wireEditor).getByLabelText("Inspection level"), { target: { value: " Precision inspection " } })
    expect(wireEditor).toHaveTextContent("Wire EDM preview quote recalculated through the non-CNC edit registry.")
    expect(selectedPreview).toHaveTextContent("€9,338.91")
    expect(within(selector).getByRole("button", { name: /Wire EDM/ })).toHaveTextContent("€9,338.91")
    fireEvent.change(within(wireEditor).getByLabelText("Skim passes"), { target: { value: "1.5" } })
    expect(wireEditor).toHaveTextContent("skimPasses must be a non-negative integer")
    expect(selectedPreview).toHaveTextContent("€5,809.74")
    fireEvent.change(within(wireEditor).getByLabelText("Skim passes"), { target: { value: "3" } })
    expect(wireEditor).toHaveTextContent("Wire EDM preview quote recalculated through the non-CNC edit registry.")
    expect(selectedPreview).toHaveTextContent("€9,338.91")
    const inputDraft = within(inputReadiness).getByLabelText("Read-only process input draft")
    expect(inputDraft).toHaveTextContent("Fixture draft 4/5")
    expect(inputDraft).toHaveTextContent("Wire diameter")
    expect(inputDraft).toHaveTextContent("Missing fixture value")
    expect(inputDraft).toHaveTextContent("2 skim passes")
    expect(within(inputDraft).getByLabelText("Non-CNC quote path gate")).toHaveTextContent(
      "Quote path blocked: Editable controls missing, Missing required values",
    )
    const checklist = within(selectedPreview).getByLabelText("Process quote operator checklist")
    expect(checklist).toHaveTextContent("Calculator ready")
    expect(checklist).toHaveTextContent("Input model read-only")
    expect(checklist).toHaveTextContent("Offer wiring pending")
    expect(checklist).toHaveTextContent("1 calculator flag requires review.")
    const offerHandoff = within(selectedPreview).getByLabelText("Non-CNC offer handoff readiness")
    expect(offerHandoff).toHaveTextContent("Offer candidate")
    expect(offerHandoff).toHaveTextContent("Estimator review")
    expect(offerHandoff).toHaveTextContent("Wire EDM can be reviewed as a non-CNC offer candidate")
    expect(offerHandoff).toHaveTextContent("Process quote: Wire EDM for EDM-KEY-077")
    expect(offerHandoff).toHaveTextContent("Preview total: EUR 9338.91 at 20 days")
    expect(offerHandoff).toHaveTextContent("Non-CNC preview is not promoted into active RFQ quote state.")
    expect(offerHandoff).toHaveTextContent("1 calculator flag must be reviewed before customer offer use.")
    expect(offerHandoff).toHaveTextContent("Persist the selected process quote before enabling offer release.")
    const wirePromotionPlan = within(selectedPreview).getByLabelText("Non-CNC quote promotion plan")
    expect(wirePromotionPlan).toHaveTextContent("blocked")
    expect(wirePromotionPlan).toHaveTextContent("Wire EDM · €9,338.91")
    expect(wirePromotionPlan).toHaveTextContent("Persist quote snapshot")
    expect(wirePromotionPlan).toHaveTextContent("Wait until promotion blockers are cleared before storing a non-CNC quote snapshot.")
    expect(wirePromotionPlan).toHaveTextContent("Review 1 calculator warning")
    await waitFor(() => {
      expect(within(selectedPreview).getByLabelText("Non-CNC promotion persistence snapshot")).toHaveTextContent(
        "Local promotion history: 2 records, 2 blocked, 0 candidates.",
      )
    })
    const wirePromotionRecord = within(selectedPreview).getByLabelText("Non-CNC promotion persistence snapshot")
    expect(wirePromotionRecord).toHaveTextContent("review only")
    expect(wirePromotionRecord).toHaveTextContent("FactoryBid Operator")
    expect(wirePromotionRecord).toHaveTextContent("Blocked: non-cnc-promotion:registry-demo:sheet-metal:sm-120-bracket:sheet-metal-v1")
    expect(wirePromotionRecord).toHaveTextContent("non-cnc-promotion:registry-demo:wire-edm:edm-key-077:wire-edm-v1")
    expect(wirePromotionRecord).toHaveTextContent("Candidate: None")
    const wirePromotionActions = within(selectedPreview).getByLabelText("Non-CNC promotion actions")
    expect(wirePromotionActions).toHaveTextContent("Quote promotion guarded")
    expect(wirePromotionActions).toHaveTextContent("Persist quote snapshot")
    expect(wirePromotionActions).toHaveTextContent("Refresh offer readiness")
    expect(wirePromotionActions).toHaveTextContent("Enable offer builder")
    expect(wirePromotionActions).toHaveTextContent("Review-only promotion records cannot update active RFQ quote state.")
    const wirePromotionDraft = within(selectedPreview).getByLabelText("Non-CNC promotion draft payload")
    expect(wirePromotionDraft).toHaveTextContent("No quote payload")
    expect(wirePromotionDraft).toHaveTextContent("3 commands")
    expect(wirePromotionDraft).toHaveTextContent("1 warning")
    const wirePromotionPackage = within(selectedPreview).getByLabelText("Non-CNC promotion command package")
    expect(wirePromotionPackage).toHaveTextContent("blocked")
    expect(wirePromotionPackage).toHaveTextContent("0 payloads")
    expect(wirePromotionPackage).toHaveTextContent("1 warning")
    expect(wirePromotionPackage).toHaveTextContent("non-cnc-promotion-command-package:non-cnc-promotion:registry-demo:wire-edm")
    const wirePromotionOutcomeDraft = within(selectedPreview).getByLabelText("Non-CNC promotion outcome draft")
    expect(wirePromotionOutcomeDraft).toHaveTextContent("blocked")
    expect(wirePromotionOutcomeDraft).toHaveTextContent("0 ready outcomes")
    expect(wirePromotionOutcomeDraft).toHaveTextContent("3 blocked outcomes")
    expect(wirePromotionOutcomeDraft).toHaveTextContent("Outcome withheld")
    const wirePromotionOutcomeCommit = within(selectedPreview).getByLabelText("Non-CNC promotion commit plan")
    expect(wirePromotionOutcomeCommit).toHaveTextContent("blocked")
    expect(wirePromotionOutcomeCommit).toHaveTextContent("0 outcomes")
    expect(wirePromotionOutcomeCommit).toHaveTextContent("Outcome commit withheld")
    const wirePromotionExecution = within(selectedPreview).getByLabelText("Non-CNC promotion execution audit")
    expect(wirePromotionExecution).toHaveTextContent("blocked")
    expect(wirePromotionExecution).toHaveTextContent("3 commands")
    expect(wirePromotionExecution).toHaveTextContent("1 warning")
    expect(wirePromotionExecution).toHaveTextContent("non-cnc-quote-promotion-execution.v1")
    expect(wirePromotionExecution).toHaveTextContent("non-cnc-quote-promotion-execution-")
    await waitFor(() => {
      expect(within(selectedPreview).getByLabelText("Non-CNC promotion execution history")).toHaveTextContent(
        "Local execution history: 1 run, 4 pending actions, 1 warning.",
      )
    })
    const wirePromotionExecutionHistory = within(selectedPreview).getByLabelText("Non-CNC promotion execution history")
    expect(wirePromotionExecutionHistory).toHaveTextContent("1 record")
    expect(wirePromotionExecutionHistory).toHaveTextContent("Status counts: blocked 1")
    expect(wirePromotionExecutionHistory).toHaveTextContent("non-cnc-promotion-command-package:non-cnc-promotion:registry-demo:wire-edm")
    await user.click(within(selectedPreview).getByRole("button", { name: "Copy summary" }))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const [copiedText] = writeText.mock.calls[0] ?? [""]
    expect(copiedText).toContain("Process: Wire EDM")
    expect(copiedText).toContain("Part: EDM-KEY-077")
    expect(copiedText).toContain("Best price: Sheet metal (EUR 636.41)")
    expect(copiedText).toContain("Selected delta: +EUR 8702.50, +13 days lead")
    expect(copiedText).toContain("Required groups: stock dimensions, cut length, wire settings, inspection scope")
    expect(copiedText).toContain("Planned fields: Stock size, Cut length, Wire diameter, Finish passes, Inspection level")
    expect(copiedText).toContain("Draft coverage: 4/5 required fields populated from registry_fixture")
    expect(copiedText).toContain("Wire diameter: Missing fixture value")
    expect(copiedText).toContain("Promotion gate: blocked")
    expect(copiedText).toContain("Blockers: Editable controls missing, Missing required values")
    expect(copiedText).toContain("Offer handoff:")
    expect(copiedText).toContain("Process quote: Wire EDM for EDM-KEY-077")
    expect(copiedText).toContain("Blocker: Offer builder and release execution still use the active workspace quote.")
    expect(copiedText).toContain("Next: Run offer readiness on the promoted quote after customer-facing terms are confirmed.")
    expect(copiedText).toContain("Input edit adapter:")
    expect(copiedText).toContain("Version: wire-edm-input-edits.v1")
    expect(copiedText).toContain(
      "Editable fields mapped: stockLengthMm, stockWidthMm, stockHeightMm, contourLengthMm, skimPasses, inspectionLevel",
    )
    expect(copiedText).toContain("Read-only fields guarded: None")
    expect(copiedText).toContain("UI controls: preview controls enabled for supported fields")
    const wireActions = within(selectedPreview).getByLabelText("Process quote preview actions")
    await waitFor(() => {
      expect(within(wireActions).getByRole("status")).toHaveTextContent("Process preview summary copied.")
    })
    await user.click(within(selector).getByRole("button", { name: /Plastic machining/ }))
    const plasticPreview = within(processDemos).getByLabelText("Selected non-CNC quote preview")
    const plasticAdapterStatus = within(plasticPreview).getByLabelText("Non-CNC input edit adapter status")
    expect(plasticAdapterStatus).toHaveTextContent("plastics-input-edits.v1")
    expect(plasticAdapterStatus).toHaveTextContent("5 editable fields mapped")
    expect(plasticAdapterStatus).toHaveTextContent("1 read-only field guarded")
    expect(plasticAdapterStatus).toHaveTextContent("Preview controls enabled for supported fields")
    const plasticEditor = within(plasticPreview).getByLabelText("Plastic preview edit controls")
    expect(plasticEditor).toHaveTextContent("Plastic machining only")
    expect(plasticEditor).toHaveTextContent("Derived and read-only until operation-level editing is supported.")
    expect(within(plasticEditor).getByLabelText("Plastic guarded operation count")).toHaveTextContent("5")
    fireEvent.change(within(plasticEditor).getByLabelText("Material family"), { target: { value: " POM-C black " } })
    fireEvent.change(within(plasticEditor).getByLabelText(/Stock length/), { target: { value: "90" } })
    fireEvent.change(within(plasticEditor).getByLabelText(/Stock width/), { target: { value: "45" } })
    fireEvent.change(within(plasticEditor).getByLabelText(/Stock height/), { target: { value: "14" } })
    fireEvent.change(within(plasticEditor).getByLabelText("Surface finish"), { target: { value: " Fine deburr " } })
    expect(plasticEditor).toHaveTextContent("Plastic preview quote recalculated through the non-CNC edit registry.")
    expect(plasticPreview).toHaveTextContent("€981.68")
    expect(within(selector).getByRole("button", { name: /Plastic machining/ })).toHaveTextContent("€981.68")
    fireEvent.change(within(plasticEditor).getByLabelText("Material family"), { target: { value: "   " } })
    expect(plasticEditor).toHaveTextContent("materialFamily must be a non-empty string")
    expect(plasticPreview).toHaveTextContent("€970.96")
    fireEvent.change(within(plasticEditor).getByLabelText("Material family"), { target: { value: "POM-C black" } })
    expect(plasticEditor).toHaveTextContent("Plastic preview quote recalculated through the non-CNC edit registry.")
    expect(plasticPreview).toHaveTextContent("€981.68")
    expect(within(plasticEditor).getByLabelText("Plastic guarded operation count")).toHaveTextContent("5")
    const plasticActions = within(plasticPreview).getByLabelText("Process quote preview actions")
    expect(within(plasticPreview).getByRole("button", { name: "Copy summary" })).toBeInTheDocument()
    expect(within(plasticActions).getByRole("status")).toHaveTextContent("Copy a read-only summary for estimator review.")
    expect(plasticPreview).toHaveTextContent("Updates this registry preview only")
    expect(plasticPreview).toHaveTextContent(
      "Preview-only registry edits are enabled for this process; active RFQ quote, offer, and release paths stay unchanged.",
    )
    await user.click(within(plasticPreview).getByRole("button", { name: "Copy summary" }))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2))
    const [plasticCopiedText] = writeText.mock.calls[1] ?? [""]
    expect(plasticCopiedText).toContain("Version: plastics-input-edits.v1")
    expect(plasticCopiedText).toContain("Read-only fields guarded: operationCount")
    expect(plasticCopiedText).toContain("UI controls: preview controls enabled for supported fields")

    await user.click(within(selector).getByRole("button", { name: /Fabrication/ }))
    const fabricationPreview = within(processDemos).getByLabelText("Selected non-CNC quote preview")
    const fabricationAdapterStatus = within(fabricationPreview).getByLabelText("Non-CNC input edit adapter status")
    expect(fabricationAdapterStatus).toHaveTextContent("fabrication-input-edits.v1")
    expect(fabricationAdapterStatus).toHaveTextContent("6 editable fields mapped")
    expect(fabricationAdapterStatus).toHaveTextContent("0 read-only fields guarded")
    expect(fabricationAdapterStatus).toHaveTextContent("Preview controls enabled for supported fields")
    const fabricationEditor = within(fabricationPreview).getByLabelText("Fabrication preview edit controls")
    expect(fabricationEditor).toHaveTextContent("Fabrication only")
    fireEvent.change(within(fabricationEditor).getByLabelText(/Fabrication minutes/), { target: { value: "52" } })
    fireEvent.change(within(fabricationEditor).getByLabelText(/Welding minutes/), { target: { value: "42" } })
    fireEvent.change(within(fabricationEditor).getByLabelText(/Assembly minutes/), { target: { value: "20" } })
    fireEvent.change(within(fabricationEditor).getByLabelText(/Inspection minutes/), { target: { value: "8" } })
    fireEvent.change(within(fabricationEditor).getByLabelText("Complexity multiplier"), { target: { value: "1.45" } })
    fireEvent.change(within(fabricationEditor).getByLabelText("Finish requirement"), { target: { value: " Powder coated " } })
    expect(fabricationEditor).toHaveTextContent("Fabrication preview quote recalculated through the non-CNC edit registry.")
    expect(fabricationPreview).toHaveTextContent("€1,789.89")
    expect(within(selector).getByRole("button", { name: /Fabrication/ })).toHaveTextContent("€1,789.89")
    fireEvent.change(within(fabricationEditor).getByLabelText("Complexity multiplier"), { target: { value: "0" } })
    expect(fabricationEditor).toHaveTextContent("complexityMultiplier must be a positive finite number")
    expect(fabricationPreview).toHaveTextContent("€1,507.10")
    fireEvent.change(within(fabricationEditor).getByLabelText("Complexity multiplier"), { target: { value: "1.45" } })
    expect(fabricationEditor).toHaveTextContent("Fabrication preview quote recalculated through the non-CNC edit registry.")
    expect(fabricationPreview).toHaveTextContent("€1,789.89")
  }, 10_000)

  it("surfaces non-empty non-CNC preview review flags", () => {
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "fabrication")
    const previewWithFlags = {
      ...preview,
      reviewFlags: ["Requires operator review before release"],
    }
    const promotionPlan = buildNonCncQuotePromotionPlan({
      preview: previewWithFlags,
      requestedAt: "2026-06-27T13:30:00.000Z",
      requestedBy: "FactoryBid Operator",
      targetRfqId: "registry-demo",
    })
    render(
      <ProcessQuotePreviewCard
        preview={previewWithFlags}
        promotionExecutionSnapshot={{
          packageIds: [],
          pendingActionCount: 0,
          persistenceVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION,
          recordCount: 0,
          records: [],
          selectedPlanIds: [],
          statusCounts: {},
          warningCount: 0,
        }}
        promotionOutcomeCommitSnapshot={emptyPromotionOutcomeCommitSnapshot()}
        promotionPlan={promotionPlan}
        promotionApplicationExecutionSnapshot={emptyPromotedQuoteApplicationExecutionSnapshot()}
        promotionApplicationMutationApplyExecutionSnapshot={emptyPromotedQuoteApplicationMutationApplyExecutionSnapshot()}
        promotionApplicationMutationApplyPlanSnapshot={emptyPromotedQuoteApplicationMutationApplyPlanSnapshot()}
        promotionApplicationMutationExecutionSnapshot={emptyPromotedQuoteApplicationMutationExecutionSnapshot()}
        promotionApplicationMutationOutcomeCommitSnapshot={emptyPromotedQuoteApplicationMutationOutcomeCommitSnapshot()}
        promotionApplicationOutcomeCommitSnapshot={emptyPromotedQuoteApplicationOutcomeCommitSnapshot()}
        promotionApplicationSnapshot={emptyPromotedQuoteApplicationSnapshot()}
        recordPromotionApplication={() => () => undefined}
        recordPromotionApplicationExecutionRun={() => () => undefined}
        recordPromotionApplicationMutationApplyExecutionRun={() => () => undefined}
        recordPromotionApplicationMutationApplyPlan={() => () => undefined}
        recordPromotionApplicationMutationExecutionRun={() => () => undefined}
        recordPromotionApplicationMutationOutcomeCommit={() => () => undefined}
        recordPromotionApplicationOutcomeCommit={() => () => undefined}
        recordPromotionOutcomeCommit={() => () => undefined}
        recordPromotionExecutionRun={() => () => undefined}
        promotionSnapshot={{ blockedPlanIds: [], candidatePlanIds: [], recordCount: 0, records: [] }}
      />,
    )

    const selectedPreview = screen.getByLabelText("Selected non-CNC quote preview")
    expect(within(selectedPreview).getByLabelText("Process quote review flags")).toHaveTextContent(
      "Requires operator review before release",
    )
  })

  it("surfaces ready non-CNC promotion outcome drafts for candidate records", async () => {
    const adapter = createLocalNonCncQuotePromotionPersistence()
    const preview = {
      ...buildProcessQuotePreview(buildProcessDemoQuotes(), "sheet_metal"),
      inputPromotionGate: {
        blockerLabels: [],
        blockers: [],
        gateVersion: "process-input-promotion-gate.v1",
        missingRequiredCount: 0,
        nextStep: "Persist the quote snapshot.",
        status: "ready",
      },
      reviewFlags: ["Material certificate required."],
    } satisfies ReturnType<typeof buildProcessQuotePreview>
    const promotionPlan = buildNonCncQuotePromotionPlan({
      preview,
      requestedAt: "2026-06-27T13:30:00.000Z",
      requestedBy: "FactoryBid Operator",
      targetRfqId: "rfq-demo-204",
      workspacePromotionPersistence: "configured",
    })
    const promotionSnapshot = await adapter.recordPlan(promotionPlan)
    const promotionActionSummary = buildNonCncQuotePromotionActionSummary({
      selectedPlanId: promotionPlan.planId,
      snapshot: promotionSnapshot,
    })
    const promotionCommandPackage = buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(promotionActionSummary))
    const generatedPromotionOutcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(promotionCommandPackage)
    const promotionOutcomeCommitResult = buildNonCncQuotePromotionOutcomeCommitRun({
      actor: "FactoryBid Operator",
      commandPackage: promotionCommandPackage,
      executedAt: promotionPlan.requestedAt,
      outcomeDraft: generatedPromotionOutcomeDraft,
    })
    const { commitPlan } = promotionOutcomeCommitResult
    const promotionReadModel = buildNonCncQuotePromotionReadModel({
      commandPackage: promotionCommandPackage,
      executionRun: promotionOutcomeCommitResult.executionRun,
    })
    const promotionApplicationPlan = buildNonCncPromotedQuoteApplicationPlan({
      readModel: promotionReadModel,
      requestedAt: promotionPlan.requestedAt,
      requestedBy: promotionPlan.requestedBy,
      targetRfqId: promotionPlan.targetRfqId,
    })
    const applicationPersistence = createLocalNonCncPromotedQuoteApplicationPersistence()
    const promotionApplicationSnapshot = await applicationPersistence.recordApplication({
      applicationPlan: promotionApplicationPlan,
      recordedAt: promotionPlan.requestedAt,
      recordedBy: "FactoryBid Operator",
    })
    const promotionApplicationRecord = promotionApplicationSnapshot.records[0]
    if (!promotionApplicationRecord) {
      throw new Error("Expected promoted quote application record")
    }
    const promotionApplicationOutcomeDraft =
      buildNonCncPromotedQuoteApplicationExecutionOutcomeDraft(promotionApplicationRecord)
    const promotionApplicationOutcomeCommitRun = buildNonCncPromotedQuoteApplicationOutcomeCommitRun({
      actor: "FactoryBid Operator",
      applicationRecord: promotionApplicationRecord,
      executedAt: promotionPlan.requestedAt,
      outcomeDraft: promotionApplicationOutcomeDraft,
    })
    const promotionApplicationOutcomeCommitAdapter = createLocalNonCncPromotedQuoteApplicationOutcomeCommitPersistence()
    const promotionApplicationOutcomeCommitSnapshot = await promotionApplicationOutcomeCommitAdapter.recordCommit({
      commitPlan: promotionApplicationOutcomeCommitRun.commitPlan,
      executionRun: promotionApplicationOutcomeCommitRun.executionRun,
      recordedAt: "2026-06-27T13:50:00.000Z",
      recordedBy: "Application Operator",
    })
    const promotionApplicationOutcomeCommitRecord = promotionApplicationOutcomeCommitSnapshot.records[0]
    if (!promotionApplicationOutcomeCommitRecord) {
      throw new Error("Expected promoted quote application outcome commit record")
    }
    const staleApplicationOutcomeCommitRecord = {
      ...promotionApplicationOutcomeCommitRecord,
      applicationRecordId: `${promotionApplicationOutcomeCommitRecord.applicationRecordId}:stale`,
      blockerCount: 1,
      blockerLabels: ["Stale blocked application commit record."],
      commandOutcomeCount: 0,
      commitRecordId: `${promotionApplicationOutcomeCommitRecord.commitRecordId}:stale`,
      disposition: "review_only" as const,
      executionFingerprint: undefined,
      recordedBy: "Stale Operator",
      reviewWarnings: [],
      status: "blocked" as const,
      warningCount: 0,
    }
    const promotionApplicationOutcomeCommitSnapshotWithStaleRecord = {
      ...promotionApplicationOutcomeCommitSnapshot,
      blockedApplicationIds: [staleApplicationOutcomeCommitRecord.applicationId],
      outcomeCount: promotionApplicationOutcomeCommitSnapshot.outcomeCount,
      recordCount: 2,
      records: [staleApplicationOutcomeCommitRecord, promotionApplicationOutcomeCommitRecord],
      statusCounts: { blocked: 1, ready: 1 },
      warningCount: promotionApplicationOutcomeCommitSnapshot.warningCount,
    }
    const promotionOutcomeCommitRecords: NonCncQuotePromotionOutcomeCommitPersistenceSnapshot["records"] = [
      {
        blockerCount: 0,
        blockerLabels: [],
        commandOutcomeCount: 3,
        commitRecordId: `non-cnc-outcome-commit:stale:${commitPlan.packageId}`,
        commitVersion: commitPlan.commitVersion,
        disposition: "commit_ready",
        packageId: commitPlan.packageId,
        packageVersion: commitPlan.packageVersion,
        persistenceVersion: NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
        recordedAt: "2026-06-27T13:25:00.000Z",
        recordedBy: "First Operator",
        reviewWarnings: ["Material certificate required."],
        selectedPlanId: commitPlan.selectedPlanId,
        status: "ready",
        targetRfqId: commitPlan.targetRfqId,
        warningCount: 1,
      },
      {
        blockerCount: 0,
        blockerLabels: [],
        commandOutcomeCount: 3,
        commitRecordId: `non-cnc-outcome-commit:newest:${commitPlan.packageId}`,
        commitVersion: commitPlan.commitVersion,
        disposition: "commit_ready",
        packageId: commitPlan.packageId,
        packageVersion: commitPlan.packageVersion,
        persistenceVersion: NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
        recordedAt: "2026-06-27T13:45:00.000Z",
        recordedBy: "Second Operator",
        reviewWarnings: ["Material certificate required."],
        selectedPlanId: commitPlan.selectedPlanId,
        status: "ready",
        targetRfqId: commitPlan.targetRfqId,
        warningCount: 1,
      },
    ]
    const promotionOutcomeCommitStatusCounts = promotionOutcomeCommitRecords.reduce<
      NonCncQuotePromotionOutcomeCommitPersistenceSnapshot["statusCounts"]
    >((counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    }, {})

    render(
      <ProcessQuotePreviewCard
        preview={preview}
        promotionExecutionSnapshot={{
          packageIds: [],
          pendingActionCount: 0,
          persistenceVersion: NON_CNC_QUOTE_PROMOTION_EXECUTION_PERSISTENCE_VERSION,
          recordCount: 0,
          records: [],
          selectedPlanIds: [],
          statusCounts: {},
          warningCount: 0,
        }}
        promotionOutcomeCommitSnapshot={{
          blockedPackageIds: [],
          commitReadyPackageIds: [commitPlan.packageId],
          outcomeCount: promotionOutcomeCommitRecords.reduce((total, record) => total + record.commandOutcomeCount, 0),
          persistenceVersion: NON_CNC_QUOTE_PROMOTION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
          recordCount: promotionOutcomeCommitRecords.length,
          records: promotionOutcomeCommitRecords,
          statusCounts: promotionOutcomeCommitStatusCounts,
          warningCount: promotionOutcomeCommitRecords.reduce((total, record) => total + record.warningCount, 0),
        }}
        promotionPlan={promotionPlan}
        promotionApplicationExecutionSnapshot={emptyPromotedQuoteApplicationExecutionSnapshot()}
        promotionApplicationMutationApplyExecutionSnapshot={emptyPromotedQuoteApplicationMutationApplyExecutionSnapshot()}
        promotionApplicationMutationApplyPlanSnapshot={emptyPromotedQuoteApplicationMutationApplyPlanSnapshot()}
        promotionApplicationMutationExecutionSnapshot={stalePromotedQuoteApplicationMutationExecutionSnapshot()}
        promotionApplicationMutationOutcomeCommitSnapshot={emptyPromotedQuoteApplicationMutationOutcomeCommitSnapshot()}
        promotionApplicationOutcomeCommitSnapshot={promotionApplicationOutcomeCommitSnapshotWithStaleRecord}
        promotionApplicationSnapshot={promotionApplicationSnapshot}
        recordPromotionApplication={() => () => undefined}
        recordPromotionApplicationExecutionRun={() => () => undefined}
        recordPromotionApplicationMutationApplyExecutionRun={() => () => undefined}
        recordPromotionApplicationMutationApplyPlan={() => () => undefined}
        recordPromotionApplicationMutationExecutionRun={() => () => undefined}
        recordPromotionApplicationMutationOutcomeCommit={() => () => undefined}
        recordPromotionApplicationOutcomeCommit={() => () => undefined}
        recordPromotionOutcomeCommit={() => () => undefined}
        recordPromotionExecutionRun={() => () => undefined}
        promotionSnapshot={promotionSnapshot}
      />,
    )

    const selectedPreview = screen.getByLabelText("Selected non-CNC quote preview")
    const promotionOutcomeDraft = within(selectedPreview).getByLabelText("Non-CNC promotion outcome draft")
    expect(promotionOutcomeDraft).toHaveTextContent("ready")
    expect(promotionOutcomeDraft).toHaveTextContent("3 ready outcomes")
    expect(promotionOutcomeDraft).toHaveTextContent("0 blocked outcomes")
    expect(promotionOutcomeDraft).toHaveTextContent("Outcome ready")
    expect(promotionOutcomeDraft).toHaveTextContent("quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1")
    const promotionOutcomeCommit = within(selectedPreview).getByLabelText("Non-CNC promotion commit plan")
    expect(promotionOutcomeCommit).toHaveTextContent("ready")
    expect(promotionOutcomeCommit).toHaveTextContent("3 outcomes")
    expect(promotionOutcomeCommit).toHaveTextContent("Commit run available")
    expect(promotionOutcomeCommit).toHaveTextContent("quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1")
    const promotionOutcomeCommitHistory = within(selectedPreview).getByLabelText("Non-CNC promotion commit history")
    expect(promotionOutcomeCommitHistory).toHaveTextContent("2026-06-27T13:45:00.000Z")
    expect(promotionOutcomeCommitHistory).toHaveTextContent("Status counts: ready 2")
    const promotedQuoteReadModel = within(selectedPreview).getByLabelText("Non-CNC promoted quote read model")
    expect(promotedQuoteReadModel).toHaveTextContent("promoted")
    expect(promotedQuoteReadModel).toHaveTextContent("Non-CNC quote promotion is available as a read-only promoted quote candidate.")
    expect(promotedQuoteReadModel).toHaveTextContent("SM-120-BRACKET")
    expect(promotedQuoteReadModel).toHaveTextContent("Sheet metal · €549.05")
    expect(promotedQuoteReadModel).toHaveTextContent("3 ids")
    expect(promotedQuoteReadModel).toHaveTextContent("quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1")
    expect(promotedQuoteReadModel).toHaveTextContent("offer-readiness:rfq-demo-204:sheet-metal:54905")
    expect(promotedQuoteReadModel).toHaveTextContent("offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal")
    expect(promotedQuoteReadModel).toHaveTextContent("commit ready")
    expect(promotedQuoteReadModel).toHaveTextContent("non-cnc-quote-promotion-execution-")
    const promotedQuoteApplicationPlan = within(selectedPreview).getByLabelText("Non-CNC promoted quote application plan")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("ready")
    expect(promotedQuoteApplicationPlan).toHaveTextContent(
      "Promoted non-CNC quote is ready for an operator-reviewed active RFQ quote application.",
    )
    expect(promotedQuoteApplicationPlan).toHaveTextContent("SM-120-BRACKET")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("Sheet metal · €549.05")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("Apply promoted quote")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("Replace the active RFQ quote with the promoted non-CNC quote snapshot.")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("Open offer builder")
    expect(promotedQuoteApplicationPlan).toHaveTextContent("non-cnc-promoted-quote-application:rfq-demo-204")
    const promotedQuoteApplicationHistory = within(selectedPreview).getByLabelText("Non-CNC promoted quote application history")
    expect(promotedQuoteApplicationHistory).toHaveAttribute("data-status", "ready")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("application ready")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("Local application history: 1 record, 1 ready, 0 blocked.")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("3/3 ready")
    expect(promotedQuoteApplicationHistory).toHaveTextContent("Status counts: ready 1")
    const promotedQuoteApplicationExecution = within(selectedPreview).getByLabelText("Non-CNC promoted quote application execution audit")
    expect(promotedQuoteApplicationExecution).toHaveAttribute("data-status", "prepared")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("prepared")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("non-cnc-promoted-quote-application-execution.v1")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("non-cnc-promoted-quote-application-execution-")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("prepared, prepared, prepared")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("non-cnc-application-execution")
    expect(promotedQuoteApplicationExecution).toHaveTextContent("Execution id withheld")
    const promotedQuoteApplicationOutcomeDraft = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application outcome draft",
    )
    expect(promotedQuoteApplicationOutcomeDraft).toHaveAttribute("data-status", "ready")
    expect(promotedQuoteApplicationOutcomeDraft).toHaveTextContent("non-cnc-promoted-quote-application-execution-outcome-draft.v1")
    expect(promotedQuoteApplicationOutcomeDraft).toHaveTextContent("Review and commit 3 non-CNC application outcomes.")
    expect(promotedQuoteApplicationOutcomeDraft).toHaveTextContent("3 ready outcomes")
    expect(promotedQuoteApplicationOutcomeDraft).toHaveTextContent("0 blocked outcomes")
    expect(promotedQuoteApplicationOutcomeDraft).toHaveTextContent("Prepared active RFQ quote replacement from promoted non-CNC quote.")
    expect(promotedQuoteApplicationOutcomeDraft).toHaveTextContent("quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1")
    expect(promotedQuoteApplicationOutcomeDraft).toHaveTextContent("active RFQ quote, offer, and release state stay unchanged")
    const promotedQuoteApplicationCommitPlan = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application commit plan",
    )
    expect(promotedQuoteApplicationCommitPlan).toHaveAttribute("data-status", "ready")
    expect(promotedQuoteApplicationCommitPlan).toHaveTextContent("non-cnc-promoted-quote-application-outcome-commit.v1")
    expect(promotedQuoteApplicationCommitPlan).toHaveTextContent("Commit run available")
    expect(promotedQuoteApplicationCommitPlan).toHaveTextContent("3 outcomes")
    expect(promotedQuoteApplicationCommitPlan).toHaveTextContent("Reviewed application outcome commit run is ready")
    expect(promotedQuoteApplicationCommitPlan).toHaveTextContent("replace active quote")
    expect(promotedQuoteApplicationCommitPlan).toHaveTextContent("quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1")
    const promotedQuoteApplicationCommitHistory = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application commit history",
    )
    expect(promotedQuoteApplicationCommitHistory).toHaveAttribute("data-status", "ready")
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent("Application commit history")
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_PERSISTENCE_VERSION,
    )
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent(
      "Local application outcome commit history: 2 records, 3 outcomes, 4 warnings.",
    )
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent("commit ready")
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent("Application Operator")
    expect(promotedQuoteApplicationCommitHistory).not.toHaveTextContent("Stale Operator")
    expect(promotedQuoteApplicationCommitHistory).toHaveTextContent("Status counts: blocked 1, ready 1")
    const promotedQuoteApplicationReadModel = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application read model",
    )
    expect(promotedQuoteApplicationReadModel).toHaveAttribute("data-status", "ready_to_apply")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("Application read model")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    )
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("3 outcomes")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("3 targets")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("active rfq quote, offer workspace, release state")
    expect(promotedQuoteApplicationReadModel).toHaveTextContent("non-cnc-promoted-quote-application-execution-")
    const promotedQuoteApplicationMutationPackage = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application mutation package",
    )
    expect(promotedQuoteApplicationMutationPackage).toHaveAttribute("data-status", "ready")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("Application mutation package")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent(NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_PACKAGE_VERSION)
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("3 commands")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("active rfq quote, offer workspace, release state")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("replace active quote")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("open offer builder")
    expect(promotedQuoteApplicationMutationPackage).toHaveTextContent("non-cnc-promoted-quote-application-execution-")
    const promotedQuoteApplicationMutationExecution = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application mutation execution audit",
    )
    expect(promotedQuoteApplicationMutationExecution).toHaveAttribute("data-status", "prepared")
    expect(promotedQuoteApplicationMutationExecution).toHaveTextContent("Mutation audit")
    expect(promotedQuoteApplicationMutationExecution).toHaveTextContent("non-cnc-promoted-quote-application-mutation-execution.v1")
    expect(promotedQuoteApplicationMutationExecution).toHaveTextContent("prepared, prepared, prepared")
    const promotedQuoteApplicationMutationOutcomeDraft = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application mutation outcome draft",
    )
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveAttribute("data-status", "ready")
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_EXECUTION_OUTCOME_DRAFT_VERSION,
    )
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveTextContent("3 ready outcomes")
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveTextContent("0 blocked outcomes")
    expect(promotedQuoteApplicationMutationOutcomeDraft).toHaveTextContent("active RFQ quote")
    const promotedQuoteApplicationMutationCommitPlan = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application mutation commit plan",
    )
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveAttribute("data-status", "ready")
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_VERSION,
    )
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent("3 outcomes")
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent("Commit run available")
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent("active RFQ quote")
    expect(promotedQuoteApplicationMutationCommitPlan).toHaveTextContent("Prepared active RFQ quote mutation")
    const promotedQuoteApplicationMutationReadModel = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application mutation read model",
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("Mutation read model")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_OUTCOME_COMMIT_READ_MODEL_VERSION,
    )
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("0 outcomes")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("0 targets")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent("Withheld until ready")
    expect(promotedQuoteApplicationMutationReadModel).toHaveTextContent(
      "No promoted quote application mutation outcome commit record is available.",
    )
    const promotedQuoteApplicationMutationApplyPlan = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application mutation apply plan",
    )
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("Mutation apply plan")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent(
      NON_CNC_PROMOTED_QUOTE_APPLICATION_MUTATION_APPLY_PLAN_VERSION,
    )
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("3 commands")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("0 committed outcomes")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("Withheld until ready")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("Source fingerprint withheld")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("0 warnings")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("None")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("Application id is missing.")
    expect(promotedQuoteApplicationMutationApplyPlan).toHaveTextContent("+8 more blockers")
    const promotedQuoteApplicationMutationApplyExecution = within(selectedPreview).getByLabelText(
      "Non-CNC promoted quote application mutation apply execution audit",
    )
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveAttribute("data-status", "blocked")
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveTextContent("Mutation apply audit")
    expect(promotedQuoteApplicationMutationApplyExecution).toHaveTextContent("Apply id withheld")
    expect(within(selectedPreview).queryByLabelText("Non-CNC promoted quote application mutation apply execution history")).toBeNull()
    expect(within(selectedPreview).queryByLabelText("Non-CNC promoted quote application mutation apply history")).toBeNull()
    expect(within(selectedPreview).queryByLabelText("Non-CNC promoted quote application mutation execution history")).toBeNull()
  })

  it("requires a valid due date before creating a manual RFQ", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "New RFQ" }))
    const dialog = screen.getByRole("dialog", { name: "Create RFQ" })
    await user.type(within(dialog).getByLabelText("Customer *"), "Acme Manufacturing")
    await user.type(within(dialog).getByLabelText("Part number *"), "ACME-101")
    await user.clear(within(dialog).getByLabelText("Due date"))

    expect(within(dialog).getByRole("button", { name: "Create RFQ" })).toBeDisabled()
  })

  it("stores winter manual RFQ due dates at Helsinki noon for calendar planning", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "New RFQ" }))
    const dialog = screen.getByRole("dialog", { name: "Create RFQ" })
    await user.type(within(dialog).getByLabelText("Customer *"), "Acme Manufacturing")
    await user.type(within(dialog).getByLabelText("Part number *"), "ACME-101")
    fireEvent.change(within(dialog).getByLabelText("Due date"), { target: { value: "2026-01-15" } })
    await user.click(within(dialog).getByRole("button", { name: "Create RFQ" }))

    const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
    expect(stored.workItems.find((item: { id: string }) => item.id === stored.selectedId)?.dueAt).toBe("2026-01-15T10:00:00.000Z")

    const calendarPlan = screen.getByLabelText("RFQ calendar plan preview")
    expect(calendarPlan).toHaveTextContent("Quote work: ACME-101")
    expect(calendarPlan).toHaveTextContent("15 Jan, 09.00 - 15 Jan, 11.00")
    expect(calendarPlan).toHaveTextContent("Quote due: ACME-101")
    expect(calendarPlan).toHaveTextContent("15 Jan, 11.30 - 15 Jan, 12.00")
  })

  it("recomputes the quote deterministically when a costing assumption changes", async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const before = totalText(container)
    const quantity = screen.getByLabelText("Quantity")
    await user.clear(quantity)
    await user.type(quantity, "60")
    expect(totalText(container)).not.toBe(before)
    expect(totalText(container)).toMatch(/€\d/)
  })

  it("recomputes the quote when editable costing rates change", async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const before = totalText(container)

    const margin = screen.getByLabelText("Margin percent")
    await user.clear(margin)
    await user.type(margin, "18.5")

    expect(totalText(container)).not.toBe(before)
    expect(screen.getByText("margin percent").closest(".assumption-row")).toHaveTextContent("18.5")
  })

  it("toggles the Rush queue filter to narrow and restore the queue", async () => {
    const user = userEvent.setup()
    render(<App />)
    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    expect(within(queue).getByRole("button", { name: /North Forge/ })).toBeInTheDocument()

    const rush = within(queue).getByRole("button", { name: "Rush" })
    await user.click(rush)
    expect(rush).toHaveAttribute("aria-pressed", "true")
    expect(within(queue).queryByRole("button", { name: /North Forge/ })).toBeNull()
    expect(within(queue).getByRole("button", { name: /Baltic Hydraulics/ })).toBeInTheDocument()

    await user.click(rush)
    expect(rush).toHaveAttribute("aria-pressed", "false")
    expect(within(queue).getByRole("button", { name: /North Forge/ })).toBeInTheDocument()
  })

  it("switches between triage, costing, and offer views", async () => {
    const user = userEvent.setup()
    render(<App />)
    const tabs = screen.getByRole("navigation", { name: "Workspace views" })
    await user.click(within(tabs).getByRole("button", { name: "Offer" }))
    expect(screen.getByRole("heading", { name: "Offer draft" })).toBeInTheDocument()
    await user.click(within(tabs).getByRole("button", { name: "Triage" }))
    expect(screen.getByRole("heading", { name: "RFQ intake" })).toBeInTheDocument()
  })

  it("records workspace actions with the deterministic local operator context", async () => {
    const user = userEvent.setup()
    render(<App />)

    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    await user.click(within(queue).getByRole("button", { name: /Baltic Hydraulics/ }))
    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: /Move to estimating/i }))

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
      const actions = stored.actionsById?.[stored.selectedId] ?? []
      expect(actions.at(-1)).toMatchObject({
        actor: "Sari",
        kind: "status_change",
        occurredAt: "2026-06-20T06:00:00.000Z",
        toStatus: "estimating",
      })
    })
  })

  it("edits RFQ intake fields and feeds the readiness model", async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole("button", { name: "Triage" }))

    const editor = screen.getByRole("region", { name: "Editable RFQ fields" })
    expect(within(editor).getAllByText("GMAIL 96%").length).toBeGreaterThan(0)

    const subject = within(editor).getByLabelText("RFQ subject")
    await user.clear(subject)
    await user.type(subject, "CNC bracket FB-204-B")
    expect(screen.getByRole("heading", { name: "CNC bracket FB-204-B" })).toBeInTheDocument()

    await user.selectOptions(within(editor).getByLabelText("RFQ process"), "cnc_turning")
    await user.selectOptions(within(editor).getByLabelText("RFQ material"), "aluminum_7075")
    expect(screen.getByLabelText("RFQ tags")).toHaveTextContent("CNC turning")
    expect(screen.getByLabelText("RFQ tags")).toHaveTextContent("Aluminum 7075")

    const customer = within(editor).getByLabelText("RFQ customer")
    await user.clear(customer)
    expect(screen.getByLabelText("RFQ intake readiness")).toHaveTextContent("Customer name is missing")

    await user.type(customer, "North Forge Works")
    expect(screen.getByLabelText("RFQ intake readiness")).not.toHaveTextContent("Customer name is missing")
  }, 10_000)

  it("normalizes edited customer whitespace before approval policy selection", async () => {
    const user = userEvent.setup()
    render(<App />)

    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    await user.click(within(queue).getByRole("button", { name: /Baltic Hydraulics/ }))
    await user.click(screen.getByRole("button", { name: "Triage" }))

    const editor = screen.getByRole("region", { name: "Editable RFQ fields" })
    const customer = within(editor).getByLabelText("RFQ customer")
    await user.clear(customer)
    await user.type(customer, "Baltic Hydraulics ")

    await user.click(screen.getByRole("button", { name: "Offer" }))
    expect(screen.getByLabelText("Quote approval policy")).toHaveTextContent("Payment terms")
  })

  it("acknowledges CAD manufacturability flags with a persistent operator note", async () => {
    const user = userEvent.setup()
    window.localStorage.clear()
    const { unmount } = render(<App />)

    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    await user.click(within(queue).getByRole("button", { name: /Baltic Hydraulics/ }))

    expect(screen.getByLabelText("Manufacturability flags")).toHaveTextContent("metadata only review")
    const override = screen.getByLabelText("CAD review override")
    await user.type(within(override).getByLabelText("CAD review note"), "Drawing is enough for turning setup.")
    await user.click(within(override).getByRole("button", { name: "Acknowledge flags" }))

    expect(screen.queryByLabelText("Manufacturability flags")).toBeNull()
    expect(screen.getByLabelText("CAD review override")).toHaveTextContent("Drawing is enough for turning setup.")
    expect(screen.getByLabelText("CAD review override event history")).toHaveTextContent("Acknowledged flags")

    unmount()
    render(<App />)
    const restoredQueue = screen.getByRole("complementary", { name: "RFQ queue" })
    await user.click(within(restoredQueue).getByRole("button", { name: /Baltic Hydraulics/ }))
    expect(screen.queryByLabelText("Manufacturability flags")).toBeNull()
    const restoredOverride = screen.getByLabelText("CAD review override")
    expect(restoredOverride).toHaveTextContent("Drawing is enough for turning setup.")

    await user.click(within(restoredOverride).getByRole("button", { name: "Reopen flags" }))
    expect(screen.getByLabelText("Manufacturability flags")).toHaveTextContent("metadata only review")
    expect(within(screen.getByLabelText("CAD review override")).getByLabelText("CAD review note")).toHaveValue("")
    expect(screen.getByLabelText("CAD review override event history")).toHaveTextContent("Reopened review")
  }, 10_000)

  it("stores CAD dimension material and process correction notes", () => {
    const { unmount } = render(<App />)

    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    fireEvent.click(within(queue).getByRole("button", { name: /Baltic Hydraulics/ }))

    const override = screen.getByLabelText("CAD review override")
    fireEvent.change(within(override).getByLabelText("Dimension correction note"), { target: { value: "Spacer length is 78 mm on revised drawing." } })
    fireEvent.change(within(override).getByLabelText("Material correction note"), { target: { value: "Use 316L certificate batch from customer note." } })
    fireEvent.change(within(override).getByLabelText("Process correction note"), { target: { value: "Review turning setup with passivation supplier." } })
    fireEvent.click(within(override).getByRole("button", { name: "Save corrections" }))

    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("Spacer length is 78 mm")
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("Use 316L")
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("passivation supplier")
    expect(screen.getByLabelText("CAD review override")).toHaveTextContent("Saved CAD corrections")
    expect(screen.getByLabelText("CAD review override")).not.toHaveTextContent("Acknowledged 0 flags")
    expect(screen.getByText("cad review dimensions")).toBeInTheDocument()
    expect(screen.getByText("cad review material")).toBeInTheDocument()
    expect(screen.getByText("cad review process")).toBeInTheDocument()

    unmount()
    render(<App />)
    const restoredQueue = screen.getByRole("complementary", { name: "RFQ queue" })
    fireEvent.click(within(restoredQueue).getByRole("button", { name: /Baltic Hydraulics/ }))
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("Spacer length is 78 mm")
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("Use 316L")
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("passivation supplier")
    expect(screen.getByText("cad review dimensions")).toBeInTheDocument()
    expect(screen.getByText("cad review material")).toBeInTheDocument()
    expect(screen.getByText("cad review process")).toBeInTheDocument()

    const restoredOverride = screen.getByLabelText("CAD review override")
    fireEvent.change(within(restoredOverride).getByLabelText("Dimension correction note"), { target: { value: "" } })
    fireEvent.change(within(restoredOverride).getByLabelText("Material correction note"), { target: { value: "" } })
    fireEvent.change(within(restoredOverride).getByLabelText("Process correction note"), { target: { value: "" } })
    fireEvent.click(within(restoredOverride).getByRole("button", { name: "Save corrections" }))

    expect(screen.queryByLabelText("CAD correction notes")).toBeNull()
    expect(screen.getByLabelText("CAD review override")).toHaveTextContent("Cleared CAD corrections")
    expect(screen.getByLabelText("CAD review override")).not.toHaveTextContent("Acknowledged 0 flags")
    expect(screen.queryByText("cad review dimensions")).toBeNull()
    expect(screen.queryByText("cad review material")).toBeNull()
    expect(screen.queryByText("cad review process")).toBeNull()
  })

  it("persists an operator-selected primary attachment for part preview", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    const preview = screen.getByLabelText("Part preview")
    expect(preview).toHaveTextContent("FB-204-A.step")

    const attachments = within(preview).getByLabelText("Attachments")
    const drawingRow = within(attachments).getByText("FB-204-A.pdf").closest(".attachment-row")
    expect(drawingRow).not.toBeNull()
    await user.click(within(drawingRow as HTMLElement).getByRole("button", { name: "Set primary" }))

    expect(screen.getByLabelText("Part preview")).toHaveTextContent("FB-204-A.pdf")
    expect(within(screen.getByLabelText("Part preview")).getByTitle("FB-204-A.pdf PDF preview")).toHaveAttribute(
      "src",
      expect.stringMatching(/^data:application\/pdf;base64,/),
    )
    const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
    expect(stored.primaryAttachmentById?.[stored.selectedId]).toBe("FB-204-A.pdf")

    unmount()
    render(<App />)
    expect(screen.getByLabelText("Part preview")).toHaveTextContent("FB-204-A.pdf")
  })

  it("surfaces CAD geometry review action hints for DXF previews that need review", async () => {
    const user = userEvent.setup()
    render(<App />)

    const preview = screen.getByLabelText("Part preview")
    const attachments = within(preview).getByLabelText("Attachments")
    const dxfRow = within(attachments).getByText("FB-204-A-flat.dxf").closest(".attachment-row")
    expect(dxfRow).not.toBeNull()
    await user.click(within(dxfRow as HTMLElement).getByRole("button", { name: "Set primary" }))

    const geometryPreview = within(screen.getByLabelText("Part preview")).getByLabelText("FB-204-A-flat.dxf geometry preview")
    expect(geometryPreview).toHaveTextContent("DXF")
    expect(geometryPreview).toHaveTextContent("250 x 120 mm")
    const geometryReview = within(geometryPreview).getByLabelText("FB-204-A-flat.dxf geometry review summary")
    expect(geometryReview).toHaveTextContent("needs review")
    expect(geometryReview).toHaveTextContent("2 needs review / 3 ready")
    expect(geometryReview).toHaveTextContent("Confirm flat-pattern thickness")
    const actionHints = within(geometryReview).getByLabelText("FB-204-A-flat.dxf geometry review action hints")
    expect(actionHints).toHaveTextContent("Confirm flat-pattern thickness")
    expect(actionHints).toHaveTextContent("Review geometry provider warnings")
    expect(actionHints).toHaveTextContent("Verify thickness from drawing or material metadata before flat-pattern calculations.")
  })

  it("persists CAD geometry review action history with operator corrections", async () => {
    window.localStorage.clear()
    const { unmount } = render(<App />)

    const preview = screen.getByLabelText("Part preview")
    const attachments = within(preview).getByLabelText("Attachments")
    const dxfRow = within(attachments).getByText("FB-204-A-flat.dxf").closest(".attachment-row")
    expect(dxfRow).not.toBeNull()
    fireEvent.click(within(dxfRow as HTMLElement).getByRole("button", { name: "Set primary" }))

    const override = screen.getByLabelText("CAD review override")
    fireEvent.change(within(override).getByLabelText("Dimension correction note"), { target: { value: "Confirm 6 mm plate thickness before quoting." } })
    fireEvent.click(within(override).getByRole("button", { name: "Save corrections" }))

    const history = screen.getByLabelText("CAD geometry review action history")
    expect(history).toHaveTextContent("FB-204-A-flat.dxf")
    expect(history).toHaveTextContent("needs review")
    expect(history).toHaveTextContent("Confirm flat-pattern thickness")
    expect(history).toHaveTextContent("Review geometry provider warnings")
    const eventHistory = screen.getByLabelText("CAD review override event history")
    expect(eventHistory).toHaveTextContent("1 event recorded")
    expect(eventHistory).toHaveTextContent("Saved corrections")
    expect(eventHistory).toHaveTextContent("Corrections: dimensions")
    expect(eventHistory).toHaveTextContent("2 geometry actions")

    const pdfRow = within(screen.getByLabelText("Attachments")).getByText("FB-204-A.pdf").closest(".attachment-row")
    expect(pdfRow).not.toBeNull()
    fireEvent.click(within(pdfRow as HTMLElement).getByRole("button", { name: "Set primary" }))
    const pdfOverride = screen.getByLabelText("CAD review override")
    fireEvent.change(within(pdfOverride).getByLabelText("Material correction note"), { target: { value: "Use the same Al 6082 stock." } })
    fireEvent.click(within(pdfOverride).getByRole("button", { name: "Save corrections" }))
    expect(screen.getByLabelText("CAD geometry review action history")).toHaveTextContent("FB-204-A-flat.dxf")
    expect(screen.getByLabelText("CAD review override event history")).toHaveTextContent("2 events recorded")
    expect(screen.getByLabelText("CAD review override event history")).toHaveTextContent("Corrections: dimensions, material")

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
      const snapshot = stored.cadReviewOverridesById?.[stored.selectedId]?.geometryReviewActionSnapshot
      const events = stored.cadReviewOverrideEventsById?.[stored.selectedId]
      expect(snapshot).toMatchObject({
        attachmentFileName: "FB-204-A-flat.dxf",
        capturedAt: "2026-06-20T09:00:00+03:00",
        reviewStatus: "needs_review",
      })
      expect(snapshot.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "confirm_flat_pattern_thickness", label: "Confirm flat-pattern thickness", priority: "primary" }),
          expect.objectContaining({ key: "review_geometry_provider_warnings", label: "Review geometry provider warnings", priority: "secondary" }),
        ]),
      )
      expect(events).toEqual([
        expect.objectContaining({
          correctionFields: ["dimensions"],
          geometryReviewActionCount: 2,
          kind: "corrections_saved",
        }),
        expect.objectContaining({
          correctionFields: ["dimensions", "material"],
          geometryReviewActionCount: 2,
          kind: "corrections_saved",
        }),
      ])
    })

    unmount()
    render(<App />)
    const restoredHistory = screen.getByLabelText("CAD geometry review action history")
    expect(restoredHistory).toHaveTextContent("FB-204-A-flat.dxf")
    expect(restoredHistory).toHaveTextContent("Confirm flat-pattern thickness")
    const restoredEvents = screen.getByLabelText("CAD review override event history")
    expect(restoredEvents).toHaveTextContent("2 events recorded")
    expect(restoredEvents).toHaveTextContent("Saved corrections")
  })

  it("keeps a browser-native PDF preview after the iframe reports loaded", () => {
    vi.useFakeTimers()
    render(<App />)

    const preview = screen.getByLabelText("Part preview")
    const attachments = within(preview).getByLabelText("Attachments")
    const drawingRow = within(attachments).getByText("FB-204-A.pdf").closest(".attachment-row")
    expect(drawingRow).not.toBeNull()
    fireEvent.click(within(drawingRow as HTMLElement).getByRole("button", { name: "Set primary" }))

    const pdfPreview = within(screen.getByLabelText("Part preview")).getByTitle("FB-204-A.pdf PDF preview")
    fireEvent.load(pdfPreview)

    act(() => {
      vi.advanceTimersByTime(pdfPreviewLoadTimeoutMs + 1)
    })

    expect(within(screen.getByLabelText("Part preview")).getByTitle("FB-204-A.pdf PDF preview")).toBeVisible()
    expect(screen.getByLabelText("Part preview")).toHaveTextContent("PDF drawing preview")
  })

  it("falls back when a browser-native PDF preview never reports loaded", () => {
    vi.useFakeTimers()
    render(<App />)

    const preview = screen.getByLabelText("Part preview")
    const attachments = within(preview).getByLabelText("Attachments")
    const drawingRow = within(attachments).getByText("FB-204-A.pdf").closest(".attachment-row")
    expect(drawingRow).not.toBeNull()
    fireEvent.click(within(drawingRow as HTMLElement).getByRole("button", { name: "Set primary" }))

    expect(within(screen.getByLabelText("Part preview")).getByTitle("FB-204-A.pdf PDF preview")).toBeVisible()

    act(() => {
      vi.advanceTimersByTime(pdfPreviewLoadTimeoutMs + 1)
    })

    const partPreview = screen.getByLabelText("Part preview")
    const primaryPreviewViewport = partPreview.querySelector(".preview-viewport")
    expect(primaryPreviewViewport).not.toBeNull()
    expect(within(partPreview).queryByTitle("FB-204-A.pdf PDF preview")).toBeNull()
    expect(primaryPreviewViewport?.querySelector(".preview-icon")).not.toBeNull()
  })

  it("renders browser-native image attachments when selected as the primary preview", async () => {
    const user = userEvent.setup()
    render(<App />)

    const preview = screen.getByLabelText("Part preview")
    const attachments = within(preview).getByLabelText("Attachments")
    const imageRow = within(attachments).getByText("FB-204-A-fixture.svg").closest(".attachment-row")
    expect(imageRow).not.toBeNull()
    await user.click(within(imageRow as HTMLElement).getByRole("button", { name: "Set primary" }))

    const image = within(screen.getByLabelText("Part preview")).getByRole("img", { name: "FB-204-A-fixture.svg preview" })
    expect(image).toHaveAttribute("src", expect.stringMatching(/^data:image\/svg\+xml;base64,/))
    expect(screen.getByLabelText("Part preview")).toHaveTextContent("Image preview")

    fireEvent.error(image)

    expect(within(screen.getByLabelText("Part preview")).queryByRole("img", { name: "FB-204-A-fixture.svg preview" })).toBeNull()
    expect(screen.getByLabelText("Part preview").querySelector(".preview-icon")).not.toBeNull()
  })

  it("edits offer validity, terms, and notes in the exported draft", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Offer" }))
    fireEvent.change(screen.getByLabelText("Offer valid until"), { target: { value: "2026-07-10" } })
    fireEvent.change(screen.getByLabelText("Offer revision note"), { target: { value: "Buyer requested updated validity." } })
    fireEvent.change(screen.getByLabelText("Offer terms"), { target: { value: "Payment: Net 14 days\nDelivery: FCA Helsinki" } })
    fireEvent.change(screen.getByLabelText("Offer notes"), { target: { value: "Customer-facing note for the revised offer." } })

    const offerText = screen.getByLabelText("Plain text offer") as HTMLTextAreaElement
    expect(offerText.value).toContain("Valid until: 2026-07-10")
    expect(offerText.value).toContain("Payment: Net 14 days")
    expect(offerText.value).toContain("Customer-facing note for the revised offer.")
  })

  it("records manager release review and unlocks the release plan once the RFQ is ready", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Offer" }))
    const releaseGate = screen.getByLabelText("Quote release gate")
    await user.click(within(releaseGate).getByRole("button", { name: "Mark reviewed" }))
    expect(releaseGate).toHaveTextContent("Reviewed by Sari")

    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: "Create follow-up" }))
    await user.click(screen.getByRole("button", { name: "Move to ready" }))

    await user.click(screen.getByRole("button", { name: "Offer" }))
    const releasePlan = screen.getByLabelText("Offer release command plan")
    expect(releasePlan).toHaveTextContent("Release commands ready")
    expect(releasePlan).toHaveTextContent("manager reviewed")
    const sendSummary = within(releasePlan).getByLabelText("Offer release send summary")
    expect(sendSummary).toHaveTextContent("Offer OFFER-204 is ready to send to sari.virtanen@example.test with OFFER-204-rev1.pdf.")
    expect(sendSummary).toHaveTextContent("1 attachment")
    expect(sendSummary).toHaveTextContent("OFFER-204-rev1.pdf")
    expect(sendSummary).toHaveTextContent("Follow-up 2026-07-03T07:00:00.000Z")
    expect(releasePlan).toHaveTextContent("Draft offer email")
    const draftHistory = screen.getByLabelText("Offer email draft package history")
    expect(draftHistory).toHaveTextContent("1 draft package")
    expect(draftHistory).toHaveTextContent("Provider-safe")
    expect(draftHistory).toHaveTextContent("sari.virtanen@example.test")
    expect(draftHistory).toHaveTextContent("1 attachment")
    expect(draftHistory).toHaveTextContent("ready")
    const providerOutcomeHistory = screen.getByLabelText("Offer provider outcome history")
    expect(providerOutcomeHistory).toHaveTextContent("1 outcome batch")
    expect(providerOutcomeHistory).toHaveTextContent("Provider-ready")
    expect(providerOutcomeHistory).toHaveTextContent("6")
    expect(providerOutcomeHistory).toHaveTextContent("0")
    expect(providerOutcomeHistory).toHaveTextContent("Email Draft")
    expect(providerOutcomeHistory).toHaveTextContent("Applied")
    const calendarDrafts = within(releasePlan).getByLabelText("Offer release calendar drafts")
    expect(calendarDrafts).toHaveTextContent("Follow up: OFFER-204")
    expect(calendarDrafts).toHaveTextContent("03 Jul, 10.00 - 03 Jul, 10.30")
    expect(calendarDrafts).toHaveTextContent("Europe/Helsinki")
    expect(calendarDrafts).toHaveTextContent("Follow up with North Forge about offer OFFER-204.")

    const executionAudit = screen.getByLabelText("Offer release execution audit")
    expect(within(executionAudit).getByLabelText("Provider outcome readiness")).toHaveTextContent(
      "Provider outcomes ready: 6 applied commands.",
    )
    await user.click(within(executionAudit).getByRole("button", { name: "Execute release" }))

    expect(executionAudit).toHaveTextContent("Execution completed")
    expect(executionAudit).toHaveTextContent("commit")
    expect(executionAudit).toHaveTextContent("Release execution has been recorded.")
    expect(within(executionAudit).getByRole("button", { name: "Release executed" })).toBeDisabled()
  })

  it("guards local release execution against duplicate clicks", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Offer" }))
    const releaseGate = screen.getByLabelText("Quote release gate")
    await user.click(within(releaseGate).getByRole("button", { name: "Mark reviewed" }))
    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: "Move to ready" }))
    await user.click(screen.getByRole("button", { name: "Offer" }))

    const executionAudit = screen.getByLabelText("Offer release execution audit")
    const execute = within(executionAudit).getByRole("button", { name: "Execute release" })
    fireEvent.click(execute)
    fireEvent.click(execute)

    await waitFor(() => expect(executionAudit).toHaveTextContent("Execution completed"))
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
      expect(stored.releaseExecutionRunsById?.[stored.selectedId]).toHaveLength(1)
    })
  })

  it("rejects restored release executions with malformed calendar events", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole("button", { name: "Offer" }))
    const releaseGate = screen.getByLabelText("Quote release gate")
    await user.click(within(releaseGate).getByRole("button", { name: "Mark reviewed" }))
    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: "Move to ready" }))
    await user.click(screen.getByRole("button", { name: "Offer" }))

    const executionAudit = screen.getByLabelText("Offer release execution audit")
    await user.click(within(executionAudit).getByRole("button", { name: "Execute release" }))
    await waitFor(() => expect(executionAudit).toHaveTextContent("Execution completed"))

    const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
    stored.activeView = "offer"
    const selectedRuns = stored.releaseExecutionRunsById?.[stored.selectedId]
    selectedRuns[0].calendarEvents = [
      {
        endAt: "2026-06-25T10:30:00.000Z",
        kind: "offer_follow_up",
        metadata: { invalid: 42 },
        startAt: "2026-06-25T10:00:00.000Z",
        timezone: "Europe/Helsinki",
        title: "Follow up offer",
      },
    ]
    window.localStorage.setItem("factorybid.workspace.v1", JSON.stringify(stored))
    unmount()

    render(<App />)
    expect(screen.getByRole("heading", { name: "Offer draft" })).toBeInTheDocument()
    const restoredExecutionAudit = screen.getByLabelText("Offer release execution audit")
    expect(restoredExecutionAudit).toHaveTextContent("Blocked before execution")
    expect(within(restoredExecutionAudit).getByText("Mode").closest(".metric")).toHaveTextContent("dry run")
    expect(within(restoredExecutionAudit).queryByRole("button", { name: "Release executed" })).toBeNull()
  })
})

describe("calculateWorkspaceCncQuote", () => {
  it("preserves CNC registry pricing and metadata for milling and turning fixtures", () => {
    for (const input of [aluminumBracketFixture, rushTurnedSpacerFixture]) {
      const registryQuote = calculateQuote({ process: input.process, input })
      const workspaceQuote = calculateWorkspaceCncQuote(input)

      expect(workspaceQuote.totalCents).toBe(registryQuote.totalCents)
      expect(workspaceQuote.unitPriceCents).toBe(registryQuote.unitPriceCents)
      expect(workspaceQuote.unitRemainderCents).toBe(registryQuote.unitRemainderCents)
      expect(workspaceQuote.breakdown).toStrictEqual(registryQuote.breakdown)
      expect(workspaceQuote.assumptions).toStrictEqual(registryQuote.assumptions)
      expect(workspaceQuote.warnings).toStrictEqual(registryQuote.warnings)
      expect(workspaceQuote.process).toBe(input.process)
      expect(workspaceQuote.calculatorVersion).toBe(CNC_CALCULATOR_VERSION)
    }
  })
})
