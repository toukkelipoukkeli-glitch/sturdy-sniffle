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
  test.describe(`offer reply state filters on ${viewport.label}`, () => {
    test.use({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: viewport.size,
    })

    test("filters deterministic reply sync state and empty fallback rows", async ({ page }) => {
      await page.goto("/")
      await page.getByRole("button", { exact: true, name: "Offer" }).click()
      await expect(page.getByRole("heading", { name: "Offer draft" })).toBeVisible()

      const offerReplySync = page.getByLabel("Offer reply sync")
      await expect(offerReplySync).toContainText("Ready to sync from Gmail")
      await offerReplySync.getByRole("button", { name: "Sync replies" }).click()
      await expect(offerReplySync).toContainText("2 matched reply signals")
      await expect(offerReplySync).toContainText("fallback")
      await expect(offerReplySync).toContainText("offer OFFER-204")

      const offerReplyState = page.getByLabel("Offer reply state", { exact: true })
      await expect(offerReplyState.locator(".metric", { hasText: "Recorded" })).toContainText("2")
      await expect(offerReplyState.locator(".metric", { hasText: "Applied" })).toContainText("2")
      await expect(offerReplyState.locator(".metric", { hasText: "Warnings" })).toContainText("3")
      await expect(offerReplyState.locator(".metric", { hasText: "Duplicates" })).toContainText("0")
      await expect(offerReplyState.getByRole("button", { name: "All", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      )
      await expect(offerReplyState).toContainText("Applied reply")
      await expect(offerReplyState).toContainText("rfq-204-reply-001")
      await expect(offerReplyState).toContainText("Used mock offer reply fallback.")

      await offerReplyState.getByRole("button", { name: "Applied", exact: true }).click()
      await expect(offerReplyState.getByRole("button", { name: "Applied", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      )
      await expect(offerReplyState.locator(".offer-reply-state-event", { hasText: "Applied reply" })).toHaveCount(2)
      await expect(offerReplyState).not.toContainText("Used mock offer reply fallback.")

      await offerReplyState.getByRole("button", { name: "Warnings", exact: true }).click()
      await expect(offerReplyState.getByRole("button", { name: "Warnings", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      )
      await expect(offerReplyState.locator(".offer-reply-state-event", { hasText: "Warning" })).toHaveCount(3)
      await expect(offerReplyState).toContainText("Gmail offer reply provider mock failed")
      await expect(offerReplyState).toContainText("Follow-up completion signal found")

      for (const emptyFilter of ["Ignored", "Transitions", "Duplicates"]) {
        await offerReplyState.getByRole("button", { name: emptyFilter, exact: true }).click()
        await expect(offerReplyState.getByRole("button", { name: emptyFilter, exact: true })).toHaveAttribute(
          "aria-pressed",
          "true",
        )
        await expect(offerReplyState).toContainText("No reply state events for this filter.")
      }

      await expect(page.getByLabel("Integration health")).toContainText("2 matched reply signals from fallback search")
      await assertNoHorizontalOverflow(page)
    })
  })
}
