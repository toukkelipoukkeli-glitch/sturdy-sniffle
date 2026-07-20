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
  test.describe(`provider run history filters on ${viewport.label}`, () => {
    test.use({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: viewport.size,
    })

    test("filters provider-run review history and empty recovery states", async ({ page }) => {
      await page.goto("/")
      await page.getByLabel("RFQ queue").getByRole("button", { name: /North Forge/ }).click()

      const providerReview = page.getByLabel("Provider review")
      await expect(providerReview.getByLabel("Provider run history summary")).toContainText("Runs")
      await expect(providerReview.getByLabel("Provider run history summary")).toContainText("2")
      await expect(providerReview.getByLabel("Provider run history summary")).toContainText("Warnings")
      await expect(providerReview.getByLabel("Provider run history summary")).toContainText("3")
      await expect(providerReview.getByLabel("Provider run history filters")).toContainText("All 2")
      await expect(providerReview.getByLabel("Provider run history filters")).toContainText("Warnings 3")
      await expect(providerReview.getByLabel("Provider run history filters")).toContainText("Fallbacks 2")
      await expect(providerReview.getByLabel("Provider run history filters")).toContainText("Failed 0")
      await expect(providerReview.getByLabel("Provider run history filters")).toContainText("Skipped 0")
      await expect(providerReview.getByLabel("Provider run history filters")).toContainText("Succeeded 2")
      await expect(providerReview.getByRole("button", { name: "All 2" })).toHaveAttribute("aria-pressed", "true")
      await expect(providerReview).toContainText("Provider read Local")
      await expect(providerReview).toContainText("No recovery action needed")
      await expect(providerReview).toContainText("Summarize RFQ notes for North Forge")
      await expect(providerReview).toContainText("[redacted-email]")
      await expect(providerReview).toContainText("[redacted-token]")

      await providerReview.getByRole("button", { name: "Failed 0" }).click()
      await expect(providerReview.getByRole("button", { name: "Failed 0" })).toHaveAttribute("aria-pressed", "true")
      await expect(providerReview).toContainText("No provider runs match failed.")
      await expect(providerReview).not.toContainText("Summarize RFQ notes for North Forge")

      await providerReview.getByRole("button", { name: "Skipped 0" }).click()
      await expect(providerReview.getByRole("button", { name: "Skipped 0" })).toHaveAttribute("aria-pressed", "true")
      await expect(providerReview).toContainText("No provider runs match skipped.")

      await providerReview.getByRole("button", { name: "Warnings 3" }).click()
      await expect(providerReview.getByRole("button", { name: "Warnings 3" })).toHaveAttribute("aria-pressed", "true")
      await expect(providerReview).toContainText("Provider gemini is not configured; used mock fallback.")
      await expect(providerReview).toContainText("Mock provider output; no external AI service was called.")

      await providerReview.getByRole("button", { name: "Succeeded 2" }).click()
      await expect(providerReview.getByRole("button", { name: "Succeeded 2" })).toHaveAttribute("aria-pressed", "true")
      await expect(providerReview).toContainText("Summarize")
      await expect(providerReview).toContainText("Extract")

      await assertNoHorizontalOverflow(page)
    })
  })
}
