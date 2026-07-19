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
  test(`shows and recovers from an empty filtered queue on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize(viewport.size)
    await page.goto("/")

    const queue = page.getByLabel("RFQ queue")
    await expect(queue.getByRole("button", { name: /North Forge/ })).toBeVisible()
    await expect(queue.getByRole("button", { name: /Baltic Hydraulics/ })).toBeVisible()
    await expect(queue.getByRole("button", { name: /Arctic Instruments/ })).toBeVisible()

    const dueSoonFilter = queue.getByRole("button", { exact: true, name: "Due soon" })
    await dueSoonFilter.click()
    await expect(dueSoonFilter).toHaveAttribute("aria-pressed", "true")
    await expect(queue.locator(".queue-count")).toHaveText("0/3")
    await expect(queue.getByRole("status")).toContainText("No RFQs match these filters.")
    await expect(queue.getByRole("button", { name: /North Forge/ })).toHaveCount(0)
    await assertNoHorizontalOverflow(page)

    await queue.getByRole("button", { name: "Clear filters" }).click()
    await expect(dueSoonFilter).toHaveAttribute("aria-pressed", "false")
    await expect(queue.locator(".queue-count")).toHaveText("3")
    await expect(queue.getByRole("button", { name: /North Forge/ })).toBeVisible()
    await expect(queue.getByRole("button", { name: /Baltic Hydraulics/ })).toBeVisible()
    await expect(queue.getByRole("button", { name: /Arctic Instruments/ })).toBeVisible()
    await assertNoHorizontalOverflow(page)
  })
}
