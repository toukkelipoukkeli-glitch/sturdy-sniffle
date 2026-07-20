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
  test.describe(`release gate review persistence on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("restores manager review before release execution planning", async ({ page }) => {
      await page.goto("/")
      await page.getByRole("button", { exact: true, name: "Offer" }).click()

      const releaseGate = page.getByLabel("Quote release gate")
      await expect(releaseGate).toContainText("Needs release review")
      await expect(releaseGate.locator(".metric", { hasText: "Warnings" })).toContainText("1")
      await expect(releaseGate).toContainText("Offer send readiness needs review.")
      await releaseGate.getByRole("button", { name: "Mark reviewed" }).click()
      await expect(releaseGate).toContainText("Reviewed by Sari")
      await expect(releaseGate.getByRole("button", { name: "Review recorded" })).toBeDisabled()

      await page.reload()
      await page.getByRole("button", { exact: true, name: "Offer" }).click()

      const restoredReleaseGate = page.getByLabel("Quote release gate")
      await expect(restoredReleaseGate).toContainText("Reviewed by Sari")
      await expect(restoredReleaseGate.getByRole("button", { name: "Review recorded" })).toBeDisabled()
      await expect(page.getByLabel("Offer release command plan")).toContainText("Blocked before release")
      await expect(page.getByLabel("Offer release execution audit")).toContainText("Blocked before execution")

      await page.getByRole("button", { exact: true, name: "Triage" }).click()
      await page.getByRole("button", { name: "Create follow-up" }).click()
      await page.getByRole("button", { name: "Move to ready" }).click()
      await page.getByRole("button", { exact: true, name: "Offer" }).click()

      await expect(page.getByLabel("Quote release gate")).toContainText("Reviewed by Sari")
      await expect(page.getByLabel("Offer release command plan")).toContainText("Release commands ready")
      await expect(page.getByLabel("Offer release execution audit")).toContainText("Dry-run prepared")

      await assertNoHorizontalOverflow(page)
    })
  })
}
