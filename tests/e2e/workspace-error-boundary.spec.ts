import { expect, test, type Page } from "@playwright/test"

const recoveryFixtureKey = "factorybid.forceWorkspaceRenderErrorOnce"

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
  test.describe(`workspace error boundary on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("recovers from a one-shot render failure without losing local workspace shell", async ({ page }) => {
      await page.addInitScript((storageKey) => {
        const armedKey = `${storageKey}.armed`
        if (window.sessionStorage.getItem(armedKey) === "true") {
          return
        }
        window.sessionStorage.setItem(storageKey, "true")
        window.sessionStorage.setItem(armedKey, "true")
      }, recoveryFixtureKey)

      await page.goto("/")

      const recoveryPanel = page.getByRole("alert", { name: "Workspace error" })
      await expect(recoveryPanel).toContainText("Workspace recovery")
      await expect(recoveryPanel).toContainText("FactoryBid OS needs a refresh")
      await expect(recoveryPanel).toContainText("Current RFQ data is kept in the local workspace store")
      await expect(recoveryPanel).toContainText("Workspace render failed. Please reload and contact support if the issue persists.")
      await assertNoHorizontalOverflow(page)

      await recoveryPanel.getByRole("button", { name: "Reload workspace" }).click()
      await expect(page.getByRole("button", { exact: true, name: "Triage" })).toBeVisible()
      await expect(recoveryPanel).toBeHidden()

      await page.reload()
      await expect(page.getByRole("button", { exact: true, name: "Triage" })).toBeVisible()
      await expect(page.getByRole("alert", { name: "Workspace error" })).toHaveCount(0)
      await assertNoHorizontalOverflow(page)
    })
  })
}
