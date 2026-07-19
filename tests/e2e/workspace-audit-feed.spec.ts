import { expect, test, type Page } from "@playwright/test"

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

for (const viewport of operatorViewports) {
  test(`surfaces the selected RFQ workspace audit feed on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize(viewport.size)
    await page.goto("/")

    await page.getByRole("button", { name: "Triage", exact: true }).click()
    const auditFeed = page.getByLabel("Workspace audit feed")

    await expect(auditFeed).toBeVisible()
    await expect(auditFeed).toContainText("workspace-audit-feed.v1")
    await expect(auditFeed).toContainText("Events 2")
    await expect(auditFeed).toContainText("Attention 2")
    await expect(auditFeed).toContainText("Blocked 0")
    await expect(auditFeed).toContainText("mock summarize")
    await expect(auditFeed).toContainText("mock extract")
    await expect(auditFeed).toContainText(
      "Summarized customer constraints and highlighted deburr requirement for estimator review.",
    )
    await expect(auditFeed).toContainText("Detected CNC milling RFQ, 25 pcs, aluminum 6082, STEP and drawing attached.")

    await assertNoHorizontalOverflow(page)
  })
}
