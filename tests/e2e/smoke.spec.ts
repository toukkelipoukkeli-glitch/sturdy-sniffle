import { expect, test } from "@playwright/test"

test("runs the quote workspace costing workflow", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "FactoryBid OS" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "CNC bracket FB-204-A" })).toBeVisible()
  await expect(page.getByLabel("Part preview")).toContainText("FB-204-A.step")
  await expect(page.getByLabel("Measurements")).toContainText("Length")
  await expect(page.getByLabel("Quote scenario comparison")).toContainText("Current edits")
  await expect(page.getByLabel("Quote scenario comparison")).toContainText("Rush expedite")

  await page.getByRole("button", { name: /Baltic Hydraulics/ }).click()
  await expect(page.getByRole("heading", { name: "Turned spacer FB-TURN-019" })).toBeVisible()
  await expect(page.getByLabel("Part preview")).toContainText("FB-TURN-019.pdf")
  await expect(page.getByText("CAD geometry is unavailable; using drawing preview.")).toBeVisible()

  await page.getByRole("button", { exact: true, name: "Costing" }).click()
  await page.getByLabel("Setup minutes").fill("42")
  await page.getByLabel("Cycle minutes").fill("24")
  await page.getByLabel("Rush").uncheck()
  await expect(page.getByLabel("Quote scenario comparison")).toContainText("Standard lead time")
  await expect(page.getByLabel("Quote scenario comparison")).toContainText("RFQ baseline")
  await expect(page.getByText("Rush surcharge")).toHaveCount(0)

  await page.getByRole("button", { exact: true, name: "Offer" }).click()
  await expect(page.getByRole("heading", { name: "Offer draft" })).toBeVisible()
  await expect(page.locator(".offer-number", { hasText: "OFFER-019" })).toBeVisible()
  await expect(page.getByLabel("Plain text offer")).toHaveValue(/Total excluding VAT: EUR 500\.00/)
})
