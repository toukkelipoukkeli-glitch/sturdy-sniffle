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
  test.describe(`offer lifecycle persistence on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("restores follow-up actions and keeps terminal offer states guarded", async ({ page }) => {
      await page.goto("/")
      await page.getByRole("button", { exact: true, name: "Offer" }).click()

      const lifecycle = page.getByRole("region", { name: "Offer lifecycle" })
      await expect(lifecycle).toContainText("Draft not sent")
      await lifecycle.getByRole("button", { name: "Mark sent" }).click()
      await expect(lifecycle).toContainText("Sent and awaiting decision")
      await lifecycle.getByRole("button", { name: "Schedule follow-up" }).click()
      await expect(lifecycle).toContainText("Follow-up scheduled")
      await expect(lifecycle.locator(".metric", { hasText: "Open follow-ups" })).toContainText("1")
      await expect(lifecycle.getByRole("button", { name: "Schedule follow-up" })).toBeDisabled()

      await page.reload()
      await page.getByRole("button", { exact: true, name: "Offer" }).click()

      const restoredLifecycle = page.getByRole("region", { name: "Offer lifecycle" })
      await expect(restoredLifecycle).toContainText("Sent and awaiting decision")
      await expect(restoredLifecycle).toContainText("Follow-up scheduled")
      await expect(restoredLifecycle.locator(".metric", { hasText: "Events" })).toContainText("2")
      await expect(restoredLifecycle.locator(".metric", { hasText: "Open follow-ups" })).toContainText("1")
      await expect(restoredLifecycle.getByRole("button", { name: "Mark sent" })).toBeDisabled()

      await restoredLifecycle.getByRole("button", { name: "Complete follow-up" }).click()
      await expect(restoredLifecycle).toContainText("Follow-up completed")
      await expect(restoredLifecycle.locator(".metric", { hasText: "Open follow-ups" })).toContainText("0")
      await restoredLifecycle.getByRole("button", { name: "Mark declined" }).click()
      await expect(restoredLifecycle).toContainText("Offer declined")
      await expect(restoredLifecycle.getByRole("button", { name: "Complete follow-up" })).toBeDisabled()
      await expect(restoredLifecycle.getByRole("button", { name: "Mark accepted" })).toBeDisabled()

      await page.reload()
      await page.getByRole("button", { exact: true, name: "Offer" }).click()

      const terminalLifecycle = page.getByRole("region", { name: "Offer lifecycle" })
      await expect(terminalLifecycle).toContainText("Offer declined")
      await expect(terminalLifecycle).toContainText("Follow-up completed")
      await expect(terminalLifecycle.locator(".metric", { hasText: "Events" })).toContainText("4")
      await expect(terminalLifecycle.locator(".metric", { hasText: "Open follow-ups" })).toContainText("0")
      await expect(terminalLifecycle.getByRole("button", { name: "Complete follow-up" })).toBeDisabled()
      await expect(terminalLifecycle.getByRole("button", { name: "Mark accepted" })).toBeDisabled()
      await expect(terminalLifecycle.getByRole("button", { name: "Mark declined" })).toBeDisabled()

      await assertNoHorizontalOverflow(page)
    })
  })
}
