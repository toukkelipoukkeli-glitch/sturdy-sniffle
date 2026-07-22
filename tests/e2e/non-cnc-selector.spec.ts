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
      await assertMutationApplyHistory(nonCncDemos, page)
      await assertNoHorizontalOverflow(page)
    })
  })
}
