import { expect, test, type Locator, type Page } from "@playwright/test"

const operatorViewports = [
  { label: "desktop", size: { width: 1440, height: 1000 } },
  { label: "mobile", size: { width: 390, height: 900 } },
]

const processPreviews = [
  {
    buttonName: /Sheet metal/,
    editorLabel: "Sheet metal preview edit controls",
    editorStatus: "Sheet metal preview quote recalculated through the non-CNC edit registry.",
    partNumber: "SM-120-BRACKET",
  },
  {
    buttonName: /Plastic machining/,
    editorLabel: "Plastic preview edit controls",
    editorStatus: "Plastic preview quote recalculated through the non-CNC edit registry.",
    partNumber: "POM-GUIDE-042",
  },
  {
    buttonName: /Wire EDM/,
    editorLabel: "Wire EDM preview edit controls",
    editorStatus: "Wire EDM preview quote recalculated through the non-CNC edit registry.",
    partNumber: "EDM-KEY-077",
  },
  {
    buttonName: /Fabrication/,
    editorLabel: "Fabrication preview edit controls",
    editorStatus: "Fabrication preview quote recalculated through the non-CNC edit registry.",
    partNumber: "FAB-FRAME-508",
  },
]

const fabricationMutationApplyPlanId =
  "non-cnc-promoted-quote-application-mutation-apply-plan:unassigned-rfq:non-cnc-promoted-quote-application-mutation-package-registry-demo-non-cnc-promoted-quote-application-registry-demo-non-cnc-promotion-command-package-non-cnc-promotion-registry-demo-fabrication-fab-frame-508-fabrication-v1-unassigned-rfq-persist-quote-snapshot-refresh-offer-readiness-enable-offer-builder"

async function assertNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
}

async function assertMutationApplyHistory(nonCncDemos: Locator, page: Page) {
  const mutationPackage = nonCncDemos.getByLabel("Non-CNC promoted quote application mutation package")
  await expect(mutationPackage).toContainText("Application mutation package")
  await expect(mutationPackage).toContainText("Mutation targets")

  const mutationExecution = nonCncDemos.getByLabel("Non-CNC promoted quote application mutation execution audit")
  await expect(mutationExecution).toContainText(
    "Dry-run mutation audit only; active RFQ quote, offer, and release state stay unchanged.",
  )
  await expect(mutationExecution).toContainText("Mutation audit")

  const mutationCommitPlan = nonCncDemos.getByLabel("Non-CNC promoted quote application mutation commit plan")
  await expect(mutationCommitPlan).toContainText("Application outcome commit read model is not ready to apply.")
  await expect(mutationCommitPlan).toContainText("Mutation commit withheld")
  await expect(mutationCommitPlan).toContainText("Commit outcomes")

  const mutationApplyPlan = nonCncDemos.getByLabel("Non-CNC promoted quote application mutation apply plan")
  await expect(mutationApplyPlan).toContainText("Mutation apply plan")
  await expect(mutationApplyPlan).toContainText("Apply commands")
  await expect(mutationApplyPlan).toContainText("Review-only")

  const mutationApplyAudit = nonCncDemos.getByLabel("Non-CNC promoted quote application mutation apply execution audit")
  await expect(mutationApplyAudit).toContainText(
    "Dry-run mutation apply audit only; active RFQ quote, offer, and release state stay unchanged.",
  )
  await expect(mutationApplyAudit).toContainText("Mutation apply audit")

  const mutationApplyHistory = nonCncDemos.getByLabel("Non-CNC promoted quote application mutation apply history")
  await expect(mutationApplyHistory).toContainText("Local mutation apply history")
  await expect(mutationApplyHistory).toContainText("5 records")
  await expect(mutationApplyHistory).toContainText(fabricationMutationApplyPlanId)
  await expect(mutationApplyHistory).toContainText("Active RFQ quote, offer, and release state stay unchanged.")
  await expect(mutationApplyHistory).toContainText("Status counts: blocked 5")

  const mutationApplyExecutionHistory = nonCncDemos.getByLabel(
    "Non-CNC promoted quote application mutation apply execution history",
  )
  await expect(mutationApplyExecutionHistory).toContainText("Local mutation apply audit history")
  await expect(mutationApplyExecutionHistory).toContainText("11 records")
  await expect(mutationApplyExecutionHistory).toContainText(fabricationMutationApplyPlanId)
  await expect(mutationApplyExecutionHistory).toContainText("Active RFQ quote, offer, and release state stay unchanged.")
  await expect(mutationApplyExecutionHistory).toContainText("Status counts: blocked 11")

  await assertNoHorizontalOverflow(page)
}

async function assertOfferWiringReadiness(nonCncDemos: Locator, page: Page) {
  const offerWiringReadiness = nonCncDemos.getByLabel("Non-CNC promoted quote offer wiring readiness")

  await expect(offerWiringReadiness).toBeVisible()
  await expect(offerWiringReadiness).toHaveAttribute("data-status", "blocked")
  await expect(offerWiringReadiness).toContainText("Offer wiring readiness")
  await expect(offerWiringReadiness).toContainText("Keep non-CNC offer wiring blocked")
  await expect(offerWiringReadiness).toContainText("Offer candidate waits for promoted quote and release evidence.")
  await expect(offerWiringReadiness).toContainText("Quote id withheld")
  await expect(offerWiringReadiness).toContainText("Offer builder id withheld")
  await expect(offerWiringReadiness).toContainText("Promoted quote read model is not ready.")
  await expect(offerWiringReadiness).toContainText("Persisted non-CNC release readiness is not ready.")
  await expect(offerWiringReadiness).toContainText(
    "Offer wiring readiness is deterministic review data only; this helper does not create customer offers, mutate release state, or call connectors.",
  )
  await assertNoHorizontalOverflow(page)
}

async function assertOfferCreationHistory(nonCncDemos: Locator, page: Page) {
  const offerCreationHistory = nonCncDemos.getByLabel("Non-CNC promoted quote offer creation execution history")

  await expect(offerCreationHistory).toBeVisible()
  await expect(offerCreationHistory).toHaveAttribute("data-status", "blocked")
  await expect(offerCreationHistory).toContainText("Offer creation history")
  await expect(offerCreationHistory).toContainText("Offer creation history blocked")
  await expect(offerCreationHistory).toContainText("Latest customer-offer creation execution is blocked")
  await expect(offerCreationHistory).toContainText("live offer/export/release writes remain disabled.")
  await expect(offerCreationHistory).toContainText("Local runs")
  await expect(offerCreationHistory).toContainText("Command totals")
  await expect(offerCreationHistory).toContainText("Succeeded 0, prepared 0, blocked")
  await expect(offerCreationHistory).toContainText(
    "Offer creation history is deterministic review data only; active RFQ quote, offer, release, and connector state stay unchanged.",
  )
  await expect(offerCreationHistory).toContainText("Resolve customer-offer creation blockers")
  await expect(offerCreationHistory).toContainText("Release executions: None")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferCreationOutcomeCommitHistory(nonCncDemos: Locator, page: Page) {
  const offerCreationOutcomeCommitHistory = nonCncDemos.getByLabel(
    "Non-CNC promoted quote offer creation outcome commit history",
  )

  await expect(offerCreationOutcomeCommitHistory).toBeVisible()
  await expect(offerCreationOutcomeCommitHistory).toHaveAttribute("data-status", "blocked")
  await expect(offerCreationOutcomeCommitHistory).toContainText("Offer creation outcome commit history")
  await expect(offerCreationOutcomeCommitHistory).toContainText("Local customer-offer creation outcome commit history")
  await expect(offerCreationOutcomeCommitHistory).toContainText("0 outcomes")
  await expect(offerCreationOutcomeCommitHistory).toContainText("review only")
  await expect(offerCreationOutcomeCommitHistory).toContainText("Status counts: blocked")
  await expect(offerCreationOutcomeCommitHistory).toContainText(
    "Active RFQ quote, offer, release, export, and connector state stay unchanged.",
  )
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportPackageExecutionHistory(nonCncDemos: Locator, page: Page) {
  const exportPackageExecutionHistory = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export execution history",
    { exact: true },
  )

  await expect(exportPackageExecutionHistory).toBeVisible()
  await expect(exportPackageExecutionHistory).toHaveAttribute("data-status", "blocked")
  await expect(exportPackageExecutionHistory).toContainText("Offer export package execution history")
  await expect(exportPackageExecutionHistory).toContainText("Offer export package history blocked")
  await expect(exportPackageExecutionHistory).toContainText("Latest non-CNC offer export package execution is blocked")
  await expect(exportPackageExecutionHistory).toContainText("live customer-offer, file, release-review, and connector writes remain disabled.")
  await expect(exportPackageExecutionHistory).toContainText("Artifact outcomes")
  await expect(exportPackageExecutionHistory).toContainText("Succeeded 0, prepared 0, blocked")
  await expect(exportPackageExecutionHistory).toContainText("Resolve non-CNC offer export package blockers")
  await expect(exportPackageExecutionHistory).toContainText("Release executions: None")
  await expect(exportPackageExecutionHistory).toContainText("Source executions: None")
  await expect(exportPackageExecutionHistory).toContainText("Non-CNC offer export package execution history")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportPackageProviderCommitHistory(nonCncDemos: Locator, page: Page) {
  const providerCommitHistory = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export provider commit history",
    { exact: true },
  )

  await expect(providerCommitHistory).toBeVisible()
  await expect(providerCommitHistory).toHaveAttribute("data-status", "empty")
  await expect(providerCommitHistory).toContainText("Offer export provider commit history")
  await expect(providerCommitHistory).toContainText("No provider commit history")
  await expect(providerCommitHistory).toContainText("0 runs")
  await expect(providerCommitHistory).toContainText("0 artifact outcomes")
  await expect(providerCommitHistory).toContainText("Persist a ready provider commit run before wiring live customer-offer export adapters.")
  await expect(providerCommitHistory).toContainText(
    "Provider commit history is deterministic review data only; active RFQ quote, customer offer, file, release-review, export, and connector state stay unchanged.",
  )
  await expect(providerCommitHistory).toContainText("Status: empty")
  await expect(providerCommitHistory).toContainText("Recent commits:")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportPackageProviderFinalReadiness(nonCncDemos: Locator, page: Page) {
  const providerFinalReadiness = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export provider final readiness",
    { exact: true },
  )

  await expect(providerFinalReadiness).toBeVisible()
  await expect(providerFinalReadiness).toHaveAttribute("data-status", "blocked")
  await expect(providerFinalReadiness).toContainText("Offer export provider final readiness")
  await expect(providerFinalReadiness).toContainText("0 records")
  await expect(providerFinalReadiness).toContainText("0 artifact outcomes")
  await expect(providerFinalReadiness).toContainText("Provider commit execution withheld")
  await expect(providerFinalReadiness).toContainText("Withheld until ready")
  await expect(providerFinalReadiness).toContainText(
    "Keep live customer-offer export adapters disabled until provider commit history has ready local evidence.",
  )
  await expect(providerFinalReadiness).toContainText(
    "No persisted non-CNC offer export provider commit records are available.",
  )
  await expect(providerFinalReadiness).toContainText(
    "Provider commit readiness is deterministic review data only; this helper does not create customer offers, files, release reviews, exports, or connector writes.",
  )
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterDecision(nonCncDemos: Locator, page: Page) {
  const liveAdapterDecision = nonCncDemos.getByLabel("Non-CNC promoted quote customer export live adapter decision", {
    exact: true,
  })

  await expect(liveAdapterDecision).toBeVisible()
  await expect(liveAdapterDecision).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterDecision).toContainText("Offer export live adapter")
  await expect(liveAdapterDecision).toContainText("review only")
  await expect(liveAdapterDecision).toContainText("Provider-write opt-in")
  await expect(liveAdapterDecision).toContainText("Disabled")
  await expect(liveAdapterDecision).toContainText("Readiness blocked")
  await expect(liveAdapterDecision).toContainText("Review-only fallback")
  await expect(liveAdapterDecision).toContainText("Live adapter target withheld")
  await expect(liveAdapterDecision).toContainText(
    "Live non-CNC customer-offer export adapter is blocked by No persisted non-CNC offer export provider commit records are available.",
  )
  await expect(liveAdapterDecision).toContainText(
    "Keep local/mock export provider output as the authoritative operator review surface.",
  )
  await expect(liveAdapterDecision).toContainText(
    "Persist ready provider commit evidence before enabling live customer-offer export writes.",
  )
  await expect(liveAdapterDecision).toContainText(
    "Live non-CNC customer-offer export adapters remain disabled unless final readiness evidence is ready and the explicit provider-write opt-in is enabled.",
  )
  await expect(liveAdapterDecision).toContainText("live writes remain disabled")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterDecisionHistory(nonCncDemos: Locator, page: Page) {
  const liveAdapterDecisionHistory = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter decision history",
    { exact: true },
  )

  await expect(liveAdapterDecisionHistory).toBeVisible()
  await expect(liveAdapterDecisionHistory).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterDecisionHistory).toContainText("Offer export live adapter decision history")
  await expect(liveAdapterDecisionHistory).toContainText("Live-adapter decision blocked")
  await expect(liveAdapterDecisionHistory).toContainText("1 decision")
  await expect(liveAdapterDecisionHistory).toContainText("1 blocker")
  await expect(liveAdapterDecisionHistory).toContainText("2 next actions")
  await expect(liveAdapterDecisionHistory).toContainText("Target RFQs: registry-demo")
  await expect(liveAdapterDecisionHistory).toContainText("Release executions: None")
  await expect(liveAdapterDecisionHistory).toContainText(
    "Live-adapter decision history is deterministic review data only; active RFQ quote, customer offer, file, release-review, export, and connector state stay unchanged.",
  )
  await expect(liveAdapterDecisionHistory).toContainText("Non-CNC offer export live adapter decision history")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterExecutionPlan(nonCncDemos: Locator, page: Page) {
  const liveAdapterExecutionPlan = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter execution plan",
    { exact: true },
  )

  await expect(liveAdapterExecutionPlan).toBeVisible()
  await expect(liveAdapterExecutionPlan).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterExecutionPlan).toContainText("Offer export live adapter execution plan")
  await expect(liveAdapterExecutionPlan).toContainText("Live-adapter execution plan is blocked")
  await expect(liveAdapterExecutionPlan).toContainText("5 commands")
  await expect(liveAdapterExecutionPlan).toContainText("0 planned commands")
  await expect(liveAdapterExecutionPlan).toContainText("0 withheld commands")
  await expect(liveAdapterExecutionPlan).toContainText("5 blocked commands")
  await expect(liveAdapterExecutionPlan).toContainText("Provider commit evidence withheld")
  await expect(liveAdapterExecutionPlan).toContainText("Live adapter target withheld")
  await expect(liveAdapterExecutionPlan).toContainText(
    "Live-adapter execution plans are deterministic provider inputs only; this helper does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
  )
  await expect(liveAdapterExecutionPlan).toContainText("Customer-offer export write")
  await expect(liveAdapterExecutionPlan).toContainText("blocked · customer offer")
  await expect(liveAdapterExecutionPlan).toContainText("No live adapter idempotency key")
  await expect(liveAdapterExecutionPlan).toContainText(
    "No persisted non-CNC offer export provider commit records are available.",
  )
  await expect(liveAdapterExecutionPlan).toContainText(
    "Do not run live customer-offer export adapters from this plan.",
  )
  await expect(liveAdapterExecutionPlan).toContainText("decision history 1 record")
  await expect(liveAdapterExecutionPlan).toContainText("Non-CNC offer export live adapter execution plan")
  await expect(liveAdapterExecutionPlan).toContainText("- customer_offer_write | blocked | customer_offer | withheld")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterExecutionOutcomeDraft(nonCncDemos: Locator, page: Page) {
  const liveAdapterExecutionOutcomeDraft = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter execution outcome draft",
    { exact: true },
  )

  await expect(liveAdapterExecutionOutcomeDraft).toBeVisible()
  await expect(liveAdapterExecutionOutcomeDraft).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterExecutionOutcomeDraft).toContainText("Offer export live adapter execution outcome draft")
  await expect(liveAdapterExecutionOutcomeDraft).toContainText(
    "No persisted non-CNC offer export provider commit records are available.",
  )
  await expect(liveAdapterExecutionOutcomeDraft).toContainText(
    "Live-adapter execution is not ready for outcome suggestions.",
  )
  await expect(liveAdapterExecutionOutcomeDraft).toContainText("0 ready outcomes")
  await expect(liveAdapterExecutionOutcomeDraft).toContainText("5 blocked outcomes")
  await expect(liveAdapterExecutionOutcomeDraft).toContainText("Provider commit evidence withheld")
  await expect(liveAdapterExecutionOutcomeDraft).toContainText("Release execution evidence withheld")
  await expect(liveAdapterExecutionOutcomeDraft).toContainText("Customer-offer export write")
  await expect(liveAdapterExecutionOutcomeDraft).toContainText("blocked · customer offer")
  await expect(liveAdapterExecutionOutcomeDraft).toContainText("Outcome external id withheld")
  await expect(liveAdapterExecutionOutcomeDraft).toContainText(
    "Live-adapter execution outcome drafts are deterministic review data only",
  )
  await expect(liveAdapterExecutionOutcomeDraft).toContainText("Target RFQ: Live adapter target withheld")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterApplyPlan(nonCncDemos: Locator, page: Page) {
  const liveAdapterApplyPlan = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter apply plan",
    { exact: true },
  )

  await expect(liveAdapterApplyPlan).toBeVisible()
  await expect(liveAdapterApplyPlan).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterApplyPlan).toContainText("Offer export live adapter apply plan")
  await expect(liveAdapterApplyPlan).toContainText("Live-adapter apply plan is blocked")
  await expect(liveAdapterApplyPlan).toContainText("5 commands")
  await expect(liveAdapterApplyPlan).toContainText("Planned 0, blocked 5")
  await expect(liveAdapterApplyPlan).toContainText("0 committed outcomes")
  await expect(liveAdapterApplyPlan).toContainText("Live adapter target withheld")
  await expect(liveAdapterApplyPlan).toContainText("Committed execution withheld")
  await expect(liveAdapterApplyPlan).toContainText(
    "Live-adapter apply plans are deterministic review data only; this helper does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
  )
  await expect(liveAdapterApplyPlan).toContainText("Apply customer-offer draft")
  await expect(liveAdapterApplyPlan).toContainText("blocked · customer offer")
  await expect(liveAdapterApplyPlan).toContainText("No live adapter apply idempotency key")
  await expect(liveAdapterApplyPlan).toContainText(
    "Latest live-adapter outcome commit history must be committed.",
  )
  await expect(liveAdapterApplyPlan).toContainText("Non-CNC offer export live adapter apply plan")
  await expect(liveAdapterApplyPlan).toContainText("Planned commands: 0")
  await expect(liveAdapterApplyPlan).toContainText(
    "Do not apply live customer-offer export state from blocked outcome history.",
  )
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterApplyPlanHistory(nonCncDemos: Locator, page: Page) {
  const liveAdapterApplyPlanHistory = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter apply plan history",
    { exact: true },
  )

  await expect(liveAdapterApplyPlanHistory).toBeVisible()
  await expect(liveAdapterApplyPlanHistory).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterApplyPlanHistory).toContainText("Offer export live adapter apply plan history")
  await expect(liveAdapterApplyPlanHistory).toContainText("Live-adapter apply plan history blocked")
  await expect(liveAdapterApplyPlanHistory).toContainText("Latest non-CNC live-adapter apply plan is blocked")
  await expect(liveAdapterApplyPlanHistory).toContainText(
    "live customer-offer, file, release-review, export, and connector writes remain disabled.",
  )
  await expect(liveAdapterApplyPlanHistory).toContainText("Ready 0, blocked 2")
  await expect(liveAdapterApplyPlanHistory).toContainText("10 blocked commands")
  await expect(liveAdapterApplyPlanHistory).toContainText("No committed execution evidence")
  await expect(liveAdapterApplyPlanHistory).toContainText(
    "Resolve apply-plan blockers before retrying live-adapter export wiring.",
  )
  await expect(liveAdapterApplyPlanHistory).toContainText("Apply-ready plans: None")
  await expect(liveAdapterApplyPlanHistory).toContainText("Committed executions: None")
  await expect(liveAdapterApplyPlanHistory).toContainText("Non-CNC live adapter apply plan history")
  await expect(liveAdapterApplyPlanHistory).toContainText("Status counts: blocked 2")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterApplyExecutionHistory(nonCncDemos: Locator, page: Page) {
  const liveAdapterApplyExecutionHistory = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter apply execution history",
    { exact: true },
  )

  await expect(liveAdapterApplyExecutionHistory).toBeVisible()
  await expect(liveAdapterApplyExecutionHistory).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterApplyExecutionHistory).toContainText("Offer export live adapter apply execution history")
  await expect(liveAdapterApplyExecutionHistory).toContainText("Live-adapter apply execution history blocked")
  await expect(liveAdapterApplyExecutionHistory).toContainText("Latest non-CNC live-adapter apply execution is blocked")
  await expect(liveAdapterApplyExecutionHistory).toContainText(
    "live customer-offer, file, release-review, export, and connector writes remain disabled.",
  )
  await expect(liveAdapterApplyExecutionHistory).toContainText("10 commands")
  await expect(liveAdapterApplyExecutionHistory).toContainText("blocked 10")
  await expect(liveAdapterApplyExecutionHistory).toContainText(
    "Resolve live-adapter apply execution blockers before recording another execution.",
  )
  await expect(liveAdapterApplyExecutionHistory).toContainText("Target RFQs: None")
  await expect(liveAdapterApplyExecutionHistory).toContainText("Committed executions: None")
  await expect(liveAdapterApplyExecutionHistory).toContainText(
    "Non-CNC offer export live adapter apply execution history",
  )
  await expect(liveAdapterApplyExecutionHistory).toContainText("Status counts: blocked 2")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterApplyExecutionReadiness(nonCncDemos: Locator, page: Page) {
  const liveAdapterApplyExecutionReadiness = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter apply execution readiness",
    { exact: true },
  )

  await expect(liveAdapterApplyExecutionReadiness).toBeVisible()
  await expect(liveAdapterApplyExecutionReadiness).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("Offer export live adapter apply execution readiness")
  await expect(liveAdapterApplyExecutionReadiness).toContainText(
    "Keep live customer-offer, file, release-review, export, and connector writes disabled until apply execution history has ready local evidence.",
  )
  await expect(liveAdapterApplyExecutionReadiness).toContainText("2 runs")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("0 applied commands")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("Apply execution evidence withheld")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("Latest apply execution status is blocked.")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("Latest apply execution mode is dry_run.")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("Apply plan: Withheld")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("Commit plan: Withheld")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("Committed execution: Withheld")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("Source execution: Withheld")
  await expect(liveAdapterApplyExecutionReadiness).toContainText("Commit record withheld until ready")
  await expect(liveAdapterApplyExecutionReadiness).toContainText(
    "Apply execution readiness is deterministic review data only; this helper does not create customer offers, files, release reviews, exports, connector records, or external side effects.",
  )
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterApplyExecutionReadinessHistory(nonCncDemos: Locator, page: Page) {
  const liveAdapterApplyExecutionReadinessHistory = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter apply execution readiness history",
    { exact: true },
  )

  await expect(liveAdapterApplyExecutionReadinessHistory).toBeVisible()
  await expect(liveAdapterApplyExecutionReadinessHistory).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText(
    "Offer export live adapter apply execution readiness history",
  )
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText(
    "Live-adapter apply readiness history blocked",
  )
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText(
    "Latest non-CNC live-adapter apply execution readiness is blocked",
  )
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText(
    "Apply-execution readiness history is deterministic review data only",
  )
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText("Ready 0, blocked 1")
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText("0 applied commands")
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText(
    "Resolve apply-execution readiness blockers before using final-gate evidence.",
  )
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText("Ready records: None")
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText("Blocked records: non-cnc-promoted-quote-offer-export-live-adapter-apply-execution-readiness-")
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText(
    "Non-CNC live adapter apply execution readiness history",
  )
  await expect(liveAdapterApplyExecutionReadinessHistory).toContainText("Status counts: blocked")
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterFinalGateFollowThrough(nonCncDemos: Locator, page: Page) {
  const liveAdapterFinalGateFollowThrough = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter final gate follow-through",
    { exact: true },
  )

  await expect(liveAdapterFinalGateFollowThrough).toBeVisible()
  await expect(liveAdapterFinalGateFollowThrough).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Offer export live adapter final gate follow-through")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Final-gate follow-through is blocked by")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("5 commands")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Planned 0, blocked 5")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Ready 0, blocked 1")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Readiness evidence withheld")
  await expect(liveAdapterFinalGateFollowThrough).toContainText(
    "Apply-execution final-gate follow-through plans are deterministic review data only",
  )
  await expect(liveAdapterFinalGateFollowThrough).toContainText(
    "Latest apply-execution readiness history status is blocked.",
  )
  await expect(liveAdapterFinalGateFollowThrough).toContainText(
    "Do not follow through to live customer-offer export state from blocked readiness history.",
  )
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Apply plan: Withheld")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Commit record: Withheld")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Latest execution: Withheld")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Review customer-offer final gate: blocked")
  await expect(liveAdapterFinalGateFollowThrough).toContainText("Review export artifact final gate: blocked")
  await expect(liveAdapterFinalGateFollowThrough).toContainText(
    "Non-CNC live adapter apply execution final-gate follow-through",
  )
  await assertNoHorizontalOverflow(page)
}

async function assertOfferExportLiveAdapterExecutionHistory(nonCncDemos: Locator, page: Page) {
  const liveAdapterExecutionHistory = nonCncDemos.getByLabel(
    "Non-CNC promoted quote customer export live adapter execution history",
    { exact: true },
  )

  await expect(liveAdapterExecutionHistory).toBeVisible()
  await expect(liveAdapterExecutionHistory).toHaveAttribute("data-status", "blocked")
  await expect(liveAdapterExecutionHistory).toContainText("Offer export live adapter execution history")
  await expect(liveAdapterExecutionHistory).toContainText("Live-adapter execution history blocked")
  await expect(liveAdapterExecutionHistory).toContainText("Latest non-CNC live-adapter execution is blocked")
  await expect(liveAdapterExecutionHistory).toContainText(
    "live customer-offer, file, release-review, export, and connector writes remain disabled.",
  )
  await expect(liveAdapterExecutionHistory).toContainText("Command outcomes")
  await expect(liveAdapterExecutionHistory).toContainText("Prepared 0, pending 0, blocked 5, withheld 0")
  await expect(liveAdapterExecutionHistory).toContainText(
    "Resolve live-adapter execution blockers before recording another execution.",
  )
  await expect(liveAdapterExecutionHistory).toContainText("Release executions: None")
  await expect(liveAdapterExecutionHistory).toContainText("Source executions: None")
  await expect(liveAdapterExecutionHistory).toContainText("Non-CNC offer export live adapter execution history")
  await expect(liveAdapterExecutionHistory).toContainText("Status counts: blocked")
  await assertNoHorizontalOverflow(page)
}

for (const viewport of operatorViewports) {
  test.describe(`guarded non-CNC process previews on ${viewport.label}`, () => {
    test.use({ permissions: ["clipboard-read", "clipboard-write"], viewport: viewport.size })

    test("reviews previews and copies the estimator summary", async ({ page }) => {
      await page.goto("/")
      await page.getByRole("button", { exact: true, name: "Costing" }).click()

      const nonCncDemos = page.getByLabel("Non-CNC registry demos")
      await expect(nonCncDemos.getByLabel("Process quote preview selector")).toBeVisible()

      for (const processPreview of processPreviews) {
        await nonCncDemos.getByRole("button", { name: processPreview.buttonName }).click()
        await expect(nonCncDemos.getByLabel("Selected non-CNC quote preview")).toContainText(processPreview.partNumber)
        await expect(nonCncDemos.getByLabel(processPreview.editorLabel)).toContainText(processPreview.editorStatus)
        await expect(nonCncDemos.getByLabel("Non-CNC input edit adapter status")).toContainText("Preview controls enabled")
        await expect(nonCncDemos.getByLabel("Read-only process input draft")).toContainText("Fixture draft")
        await expect(nonCncDemos.getByLabel("Non-CNC quote path gate")).toContainText("Quote path")
        await expect(nonCncDemos.getByLabel("Non-CNC offer handoff readiness")).toContainText("Offer candidate")
        await expect(nonCncDemos.getByLabel("Non-CNC quote promotion plan")).toContainText("Promotion")
        await expect(nonCncDemos.getByLabel("Process quote operator checklist")).toContainText("Offer wiring pending")
        await assertNoHorizontalOverflow(page)
      }

      await nonCncDemos.getByRole("button", { name: "Copy summary" }).click()
      await expect(nonCncDemos.getByLabel("Process quote preview actions").getByRole("status")).toContainText(
        "Process preview summary copied.",
      )
      const copiedSummary = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedSummary).toContain("FAB-FRAME-508")
      expect(copiedSummary).toContain("Input edit adapter:")
      expect(copiedSummary).toContain("- UI controls: preview controls enabled for supported fields")
      await assertOfferWiringReadiness(nonCncDemos, page)
      await assertOfferCreationHistory(nonCncDemos, page)
      await assertOfferCreationOutcomeCommitHistory(nonCncDemos, page)
      await assertOfferExportPackageProviderCommitHistory(nonCncDemos, page)
      await assertOfferExportPackageProviderFinalReadiness(nonCncDemos, page)
      await assertOfferExportLiveAdapterDecision(nonCncDemos, page)
      await assertOfferExportLiveAdapterDecisionHistory(nonCncDemos, page)
      await assertOfferExportLiveAdapterExecutionPlan(nonCncDemos, page)
      await assertOfferExportLiveAdapterExecutionOutcomeDraft(nonCncDemos, page)
      await assertOfferExportLiveAdapterApplyPlan(nonCncDemos, page)
      await assertOfferExportLiveAdapterApplyPlanHistory(nonCncDemos, page)
      await assertOfferExportLiveAdapterApplyExecutionHistory(nonCncDemos, page)
      await assertOfferExportLiveAdapterApplyExecutionReadiness(nonCncDemos, page)
      await assertOfferExportLiveAdapterApplyExecutionReadinessHistory(nonCncDemos, page)
      await assertOfferExportLiveAdapterFinalGateFollowThrough(nonCncDemos, page)
      await assertOfferExportLiveAdapterExecutionHistory(nonCncDemos, page)
      await assertOfferExportPackageExecutionHistory(nonCncDemos, page)
      await assertMutationApplyHistory(nonCncDemos, page)
      await assertNoHorizontalOverflow(page)
    })
  })
}
