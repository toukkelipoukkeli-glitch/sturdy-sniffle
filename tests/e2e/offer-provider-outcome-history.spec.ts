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

async function prepareProviderOutcomeBatch(page: Page) {
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
  test.describe(`offer provider outcome history on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("surfaces local provider outcome batch details after reload", async ({ page }) => {
      await prepareProviderOutcomeBatch(page)

      const providerOutcomeHistory = page.getByLabel("Offer provider outcome history")
      await expect(providerOutcomeHistory).toContainText("1 outcome batch")
      await expect(providerOutcomeHistory).toContainText("Provider-ready")
      await expect(providerOutcomeHistory.locator(".metric", { hasText: /^Batches 1$/ })).toBeVisible()
      await expect(providerOutcomeHistory.locator(".metric", { hasText: /^Commands 6$/ })).toBeVisible()
      await expect(providerOutcomeHistory.locator(".metric", { hasText: /^Applied 6$/ })).toBeVisible()
      await expect(providerOutcomeHistory.locator(".metric", { hasText: /^Failed 0$/ })).toBeVisible()
      await expect(providerOutcomeHistory.getByLabel("Provider outcome read source: Local outcomes")).toHaveAttribute(
        "data-status",
        "local",
      )
      await expect(providerOutcomeHistory).toContainText(
        "1 local provider outcome batch available; Convex provider outcome reads are not configured.",
      )
      await expect(providerOutcomeHistory).toContainText("Provider outcomes ready")
      await expect(providerOutcomeHistory).toContainText("6 commands · 2 warnings")

      const commandSummaries = providerOutcomeHistory.getByLabel("Provider outcome command summaries")
      await expect(commandSummaries).toContainText("Email Draft")
      await expect(commandSummaries).toContainText("Calendar Follow Up")
      await expect(commandSummaries).toContainText("1 outcome · applied")
      await assertNoHorizontalOverflow(page)

      await page.reload()
      const restoredProviderOutcomeHistory = page.getByLabel("Offer provider outcome history")
      await expect(restoredProviderOutcomeHistory).toContainText("1 outcome batch")
      await expect(restoredProviderOutcomeHistory).toContainText("Provider-ready")
      await expect(restoredProviderOutcomeHistory.getByLabel("Provider outcome read source: Local outcomes")).toHaveAttribute(
        "data-status",
        "local",
      )
      await expect(restoredProviderOutcomeHistory).toContainText(
        "1 local provider outcome batch available; Convex provider outcome reads are not configured.",
      )
      await expect(restoredProviderOutcomeHistory).toContainText("Provider outcomes ready")
      await expect(restoredProviderOutcomeHistory).toContainText("6 commands · 2 warnings")
      await expect(restoredProviderOutcomeHistory.getByLabel("Provider outcome command summaries")).toContainText("Email Draft")
      await expect(restoredProviderOutcomeHistory.getByLabel("Provider outcome command summaries")).toContainText("Calendar Follow Up")
      await assertNoHorizontalOverflow(page)
    })
  })
}
