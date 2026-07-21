import { expect, test, type Locator, type Page } from "@playwright/test"

const operatorViewports = [
  { label: "desktop", size: { width: 1440, height: 1000 } },
  { label: "mobile", size: { width: 390, height: 900 } },
]

async function assertNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
}

async function expectDemoImportReviewReady(demoImportReview: Locator) {
  await expect(demoImportReview).toBeVisible()
  await expect(demoImportReview).toHaveAttribute("data-status", "ready")
  await expect(demoImportReview).toContainText("Review 11 deterministic demo import operations")
  await expect(demoImportReview).toContainText("Operations 11")
  await expect(demoImportReview).toContainText("Customers 3")
  await expect(demoImportReview).toContainText("RFQs 3")
  await expect(demoImportReview).toContainText("Activities 2")
  await expect(demoImportReview).toContainText("demo-import-1eb52340")
  await expect(demoImportReview).toContainText("Review-only seed plan ready; workspace writes remain deferred.")
}

for (const viewport of operatorViewports) {
  test.describe(`demo seed import review on ${viewport.label}`, () => {
    test.use({ permissions: ["clipboard-read", "clipboard-write"], viewport: viewport.size })

    test("surfaces the review without workspace writes and restores it after reload", async ({ page }) => {
      await page.goto("/")

      const integrationHealth = page.getByLabel("Integration health")
      const demoImportReview = integrationHealth.getByLabel("Demo workspace import review")

      await expectDemoImportReviewReady(demoImportReview)

      await demoImportReview.getByRole("button", { name: "Copy import review" }).click()
      await expect(demoImportReview).toContainText("Demo import review copied.")
      const copiedReview = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedReview).toContain("FactoryBid demo workspace import demo-workspace-import-plan.v1")
      expect(copiedReview).toContain("Operations: 11")
      expect(copiedReview).toContain("- upsert_customer: 3")

      await page.reload()

      const restoredReview = page.getByLabel("Integration health").getByLabel("Demo workspace import review")
      await expectDemoImportReviewReady(restoredReview)
      await expect(restoredReview).not.toContainText("Demo import review copied.")
      await assertNoHorizontalOverflow(page)
    })
  })
}
