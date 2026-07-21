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
  test.describe(`RFQ sync import reload on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("restores imported Gmail RFQs after reload", async ({ page }) => {
      await page.goto("/")

      const integrationHealth = page.getByLabel("Integration health")
      await integrationHealth.getByRole("button", { name: "RFQ sync" }).click()
      await expect(integrationHealth).toContainText("3 Gmail/calendar links attached")

      const queue = page.getByLabel("RFQ queue")
      const importedRfq = queue.getByRole("button", { name: /Tampere Robotics/ })
      await expect(importedRfq).toBeVisible()
      await importedRfq.click()
      await expect(page.getByRole("heading", { name: "RFQ: CNC fixture PN TR-301" })).toBeVisible()

      await page.getByRole("button", { exact: true, name: "Triage" }).click()
      await expect(page.getByLabel("RFQ intake readiness")).toContainText("Ready for costing")
      await expect(page.getByLabel("Selected RFQ")).toContainText("Imported from Gmail RFQ sync")
      await expect(page.getByLabel("Selected RFQ")).toContainText("Imported 20 Jun")

      await page.reload()
      const restoredQueue = page.getByLabel("RFQ queue")
      await expect(restoredQueue.getByRole("button", { name: /Tampere Robotics/ })).toBeVisible()
      await expect(page.getByRole("heading", { name: "RFQ: CNC fixture PN TR-301" })).toBeVisible()
      await page.getByRole("button", { exact: true, name: "Triage" }).click()
      await expect(page.getByLabel("Selected RFQ")).toContainText("Imported from Gmail RFQ sync")
      await expect(page.getByLabel("RFQ intake readiness")).toContainText("Ready for costing")
      await assertNoHorizontalOverflow(page)
    })
  })
}
