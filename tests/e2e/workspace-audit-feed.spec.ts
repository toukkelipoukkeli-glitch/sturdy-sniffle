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
  test(`surfaces and copies the selected RFQ workspace audit feed on ${viewport.label}`, async ({ context, page }) => {
    await grantClipboard(context)
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

    await auditFeed.getByRole("button", { name: "Copy audit feed" }).click()
    await expect(auditFeed).toContainText("Workspace audit feed copied for review.")
    const copiedAuditFeed = await page.evaluate(() => navigator.clipboard.readText())
    expect(copiedAuditFeed).toContain("FactoryBid workspace audit feed workspace-audit-feed.v1")
    expect(copiedAuditFeed).toContain("Events: 2")
    expect(copiedAuditFeed).toContain("Attention: 2")
    expect(copiedAuditFeed).toContain("Blocked: 0")
    expect(copiedAuditFeed).toContain("[attention] 2026-06-20T05:31:02.000Z provider_run/succeeded: mock summarize")

    await assertNoHorizontalOverflow(page)
  })
}
