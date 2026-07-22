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

async function selectBalticHydraulicsCosting(page: Page) {
  await page.goto("/")
  await page.getByRole("complementary", { name: "RFQ queue" }).getByRole("button", { name: /Baltic Hydraulics/ }).click()
  await expect(page.getByRole("heading", { name: "Turned spacer FB-TURN-019" })).toBeVisible()
  await page.getByRole("button", { exact: true, name: "Costing" }).click()
}

for (const viewport of operatorViewports) {
  test.describe(`CAD review overrides on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("surfaces deterministic drawing and CAD metadata fallback states", async ({ page }) => {
      await selectBalticHydraulicsCosting(page)

      const partPreview = page.getByLabel("Part preview")
      await expect(partPreview.locator(".preview-viewport")).toHaveAttribute("data-mode", "drawing")
      await expect(partPreview).toContainText("Drawing")
      await expect(partPreview).toContainText("FB-TURN-019.pdf")
      await expect(partPreview).toContainText("PDF drawing preview")
      await expect(partPreview).toContainText("CAD geometry is unavailable; using drawing preview.")
      await expect(partPreview).toContainText("FB-TURN-019.pdf uses metadata-only CAD review.")

      const cadMetadata = page.getByLabel("CAD metadata")
      await expect(cadMetadata).toContainText("FB-TURN-019.pdf")
      await expect(cadMetadata).toContainText("metadata fallback")
      await expect(cadMetadata).toContainText("fallback")
      await expect(cadMetadata).toContainText("Stainless steel 316L")
      await expect(cadMetadata).toContainText("cnc turning")

      const attachments = page.getByLabel("Attachments", { exact: true })
      const drawingAttachment = attachments.locator(".attachment-row", { hasText: "FB-TURN-019.pdf" })
      await expect(drawingAttachment).toContainText("PDF drawing")
      await expect(drawingAttachment).toContainText("metadata only")
      await expect(drawingAttachment).toContainText("PDF renderer unavailable; using deterministic drawing placeholder.")
      await expect(drawingAttachment).toContainText("Primary · metadata only")

      const manufacturabilityFlags = page.getByLabel("Manufacturability flags")
      await expect(manufacturabilityFlags).toContainText("cad geometry missing")
      await expect(manufacturabilityFlags).toContainText("metadata only review")

      await assertNoHorizontalOverflow(page)
    })

    test("acknowledges and reopens manufacturability flags", async ({ page }) => {
      await selectBalticHydraulicsCosting(page)

      const partPreview = page.getByLabel("Part preview")
      await expect(partPreview).toContainText("FB-TURN-019.pdf")
      const manufacturabilityFlags = page.getByLabel("Manufacturability flags")
      await expect(manufacturabilityFlags).toContainText("cad geometry missing")
      await expect(manufacturabilityFlags).toContainText("metadata only review")

      const override = page.getByLabel("CAD review override", { exact: true })
      await override.getByLabel("CAD review note").fill("Drawing is enough for turning setup.")
      await override.getByRole("button", { name: "Acknowledge flags" }).click()

      await expect(page.getByLabel("Manufacturability flags")).toHaveCount(0)
      await expect(page.getByLabel("CAD review override", { exact: true })).toContainText("Acknowledged 3 flags")
      await expect(page.getByLabel("CAD review override", { exact: true })).toContainText("Drawing is enough for turning setup.")
      await expect(page.getByLabel("CAD review override event history")).toContainText("Acknowledged flags")
      await expect(page.getByLabel("CAD review override event history")).toContainText("3 acknowledged flags")

      await page.reload()
      await page.getByRole("button", { exact: true, name: "Costing" }).click()
      await expect(page.getByLabel("Manufacturability flags")).toHaveCount(0)
      await expect(page.getByLabel("CAD review override", { exact: true })).toContainText("Acknowledged 3 flags")
      await expect(page.getByLabel("CAD review override", { exact: true })).toContainText("Drawing is enough for turning setup.")

      await page.getByLabel("CAD review override", { exact: true }).getByRole("button", { name: "Reopen flags" }).click()
      await expect(page.getByLabel("Manufacturability flags")).toContainText("metadata only review")
      await expect(page.getByLabel("CAD review override event history")).toContainText("Reopened review")
      await expect(page.getByLabel("CAD review override", { exact: true }).getByLabel("CAD review note")).toHaveValue("")

      await assertNoHorizontalOverflow(page)
    })
  })
}
