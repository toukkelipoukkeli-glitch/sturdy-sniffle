import { expect, test, type BrowserContext, type Page } from "@playwright/test"

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

async function grantClipboard(context: BrowserContext) {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
}

for (const viewport of operatorViewports) {
  test(`surfaces the demo seed import review without workspace writes on ${viewport.label}`, async ({
    context,
    page,
  }) => {
    await grantClipboard(context)
    await page.setViewportSize(viewport.size)
    await page.goto("/")

    const integrationHealth = page.getByLabel("Integration health")
    const demoImportReview = integrationHealth.getByLabel("Demo workspace import review")

    await expect(demoImportReview).toBeVisible()
    await expect(demoImportReview).toHaveAttribute("data-status", "ready")
    await expect(demoImportReview).toContainText("Review 11 deterministic demo import operations")
    await expect(demoImportReview).toContainText("Operations 11")
    await expect(demoImportReview).toContainText("Customers 3")
    await expect(demoImportReview).toContainText("RFQs 3")
    await expect(demoImportReview).toContainText("Activities 2")
    await expect(demoImportReview).toContainText("demo-import-1eb52340")
    await expect(demoImportReview).toContainText("Review-only seed plan ready; workspace writes remain deferred.")

    await demoImportReview.getByRole("button", { name: "Copy import review" }).click()
    await expect(demoImportReview).toContainText("Demo import review copied.")
    const copiedReview = await page.evaluate(() => navigator.clipboard.readText())
    expect(copiedReview).toContain("FactoryBid demo workspace import demo-workspace-import-plan.v1")
    expect(copiedReview).toContain("Operations: 11")
    expect(copiedReview).toContain("- upsert_customer: 3")

    await assertNoHorizontalOverflow(page)
  })
}
