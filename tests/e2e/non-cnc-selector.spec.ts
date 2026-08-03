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
      await assertOfferExportPackageExecutionHistory(nonCncDemos, page)
      await assertOfferExportPackageProviderCommitHistory(nonCncDemos, page)
      await assertOfferExportPackageProviderFinalReadiness(nonCncDemos, page)
      await assertMutationApplyHistory(nonCncDemos, page)
      await assertNoHorizontalOverflow(page)
    })
  })
}
