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

async function prepareEmailDraftPackage(page: Page) {
  await page.goto("/")
  await page.getByRole("button", { exact: true, name: "Offer" }).click()
  await page.getByLabel("Quote release gate").getByRole("button", { name: "Mark reviewed" }).click()
  await expect(page.getByLabel("Quote release gate")).toContainText("Reviewed by Sari")

  await page.getByRole("button", { exact: true, name: "Triage" }).click()
  await page.getByRole("button", { name: "Create follow-up" }).click()
  await page.getByRole("button", { name: "Move to ready" }).click()
  await page.getByRole("button", { exact: true, name: "Offer" }).click()
}

for (const viewport of operatorViewports) {
  test.describe(`offer email draft history on ${viewport.label}`, () => {
    test.use({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: viewport.size,
    })

    test("surfaces provider-safe draft package details after reload", async ({ page }) => {
      await prepareEmailDraftPackage(page)

      const releasePlan = page.getByLabel("Offer release command plan")
      await expect(releasePlan).toContainText("Release commands ready")
      await expect(releasePlan).toContainText("Draft offer email")

      const draftHistory = page.getByLabel("Offer email draft package history")
      await expect(draftHistory).toContainText("1 draft package")
      await expect(draftHistory).toContainText("Provider-safe")
      await expect(draftHistory.getByLabel("Email draft package read source: Local drafts")).toHaveAttribute(
        "data-status",
        "local",
      )
      await expect(draftHistory).toContainText(
        "1 local email draft package available; Convex email draft package reads are not configured.",
      )
      await expect(draftHistory.locator(".metric", { hasText: /^Packages 1$/ })).toBeVisible()
      await expect(draftHistory.locator(".metric", { hasText: /^Latest ready$/i })).toBeVisible()
      await expect(draftHistory.locator(".metric", { hasText: /^Ready 1$/ })).toBeVisible()
      await expect(draftHistory.locator(".metric", { hasText: /^Blocked 0$/ })).toBeVisible()
      await expect(draftHistory).toContainText("sari.virtanen@example.test")
      await expect(draftHistory).toContainText("1 attachment · 6 next actions")
      await expect(draftHistory.getByLabel("Email draft package recipients")).toContainText(
        "sari.virtanen@example.test · 1 package · ready",
      )
      const integrationHealth = page.getByLabel("Integration health")
      const draftReadSource = integrationHealth.locator(".integration-source-row", {
        hasText: "Email draft package reads",
      })
      await expect(draftReadSource).toContainText(
        "1 local email draft package available; Convex email draft package reads are not configured.",
      )
      await expect(draftReadSource.getByLabel("Email draft package reads recovery actions")).toContainText(
        "Configure Convex read",
      )
      await draftReadSource.getByRole("button", { name: "Copy diagnostics" }).click()
      await expect(draftReadSource).toContainText("Email draft package reads diagnostics copied.")
      const copiedDraftDiagnostics = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedDraftDiagnostics).toContain("Email draft package read diagnostics")
      expect(copiedDraftDiagnostics).toContain("Status: local")
      expect(copiedDraftDiagnostics).toContain("Draft packages: persisted 0, local 1, fallback 0")
      expect(copiedDraftDiagnostics).toContain("Configure Convex read")
      await assertNoHorizontalOverflow(page)

      await page.reload()
      const restoredDraftHistory = page.getByLabel("Offer email draft package history")
      await expect(restoredDraftHistory).toContainText("1 draft package")
      await expect(restoredDraftHistory).toContainText("Provider-safe")
      await expect(restoredDraftHistory.getByLabel("Email draft package read source: Local drafts")).toHaveAttribute(
        "data-status",
        "local",
      )
      await expect(restoredDraftHistory).toContainText(
        "1 local email draft package available; Convex email draft package reads are not configured.",
      )
      await expect(restoredDraftHistory).toContainText("sari.virtanen@example.test")
      await expect(restoredDraftHistory).toContainText("1 attachment · 6 next actions")
      await expect(restoredDraftHistory.getByLabel("Email draft package recipients")).toContainText(
        "sari.virtanen@example.test · 1 package · ready",
      )
      await assertNoHorizontalOverflow(page)
    })
  })
}
