import { readFileSync } from "node:fs"

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
  test.describe(`offer export downloads on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("downloads customer-ready text and PDF offers with persistent export history", async ({ page }) => {
      await page.goto("/")
      await page.getByRole("button", { exact: true, name: "Offer" }).click()
      await expect(page.getByRole("heading", { name: "Offer draft" })).toBeVisible()

      const offerDetails = page.getByLabel("Editable offer details")
      await offerDetails.getByLabel("Offer valid until").fill("2026-07-16")
      await offerDetails.getByLabel("Offer revision note").fill("Responsive export QA.")
      await offerDetails.getByLabel("Offer terms").fill("Payment: Net 14 days\nDelivery: FCA Helsinki")
      await offerDetails.getByLabel("Offer notes").fill("Include dimensional report with shipment.")
      await expect(page.getByLabel("Plain text offer")).toHaveValue(/Valid until: 2026-07-16/)
      await expect(page.getByLabel("Plain text offer")).toHaveValue(/Payment: Net 14 days/)

      const exportPackage = page.getByLabel("Offer export package")
      await expect(exportPackage).toContainText("PDF ready")
      await expect(exportPackage).toContainText("OFFER-204-rev1.pdf")

      const exportActions = page.getByLabel("Offer export actions")
      const textDownloadPromise = page.waitForEvent("download")
      await exportActions.getByRole("button", { name: "Download .txt" }).click()
      const textDownload = await textDownloadPromise
      expect(textDownload.suggestedFilename()).toBe("OFFER-204-rev1.txt")
      const textPath = await textDownload.path()
      expect(textPath).toBeTruthy()
      const textContent = readFileSync(textPath!, "utf8")
      expect(textContent).toContain("Valid until: 2026-07-16")
      expect(textContent).toContain("Payment: Net 14 days")
      expect(textContent).toContain("Include dimensional report with shipment.")
      await expect(exportActions).toContainText("Saved OFFER-204-rev1.txt")

      const pdfDownloadPromise = page.waitForEvent("download")
      await exportActions.getByRole("button", { name: "Download PDF" }).click()
      const pdfDownload = await pdfDownloadPromise
      expect(pdfDownload.suggestedFilename()).toBe("OFFER-204-rev1.pdf")
      const pdfPath = await pdfDownload.path()
      expect(pdfPath).toBeTruthy()
      const pdfBytes = readFileSync(pdfPath!)
      expect(pdfBytes.byteLength).toBeGreaterThan(800)
      expect(pdfBytes.subarray(0, 7).toString("latin1")).toBe("%PDF-1.")
      expect(pdfBytes.subarray(-6).toString("latin1")).toContain("%%EOF")
      await expect(exportActions).toContainText("Saved OFFER-204-rev1.pdf (1 page)")

      const exportHistory = page.getByLabel("Offer export history")
      await expect(exportHistory).toContainText("Downloaded OFFER-204-rev1.txt.")
      await expect(exportHistory).toContainText("Downloaded OFFER-204-rev1.pdf (1 page).")

      await page.reload()
      await page.getByRole("button", { exact: true, name: "Offer" }).click()
      await expect(page.getByLabel("Offer export history")).toContainText("Downloaded OFFER-204-rev1.txt.")
      await expect(page.getByLabel("Offer export history")).toContainText("Downloaded OFFER-204-rev1.pdf (1 page).")
      await assertNoHorizontalOverflow(page)
    })
  })
}
