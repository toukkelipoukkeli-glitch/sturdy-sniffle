import { expect, test, type Locator, type Page } from "@playwright/test"

const operatorViewports = [
  { label: "desktop", size: { width: 1440, height: 1000 } },
  { label: "mobile", size: { width: 390, height: 900 } },
]

async function activateFocusedControl(page: Page, control: Locator, key: "Enter" | "Space" = "Enter") {
  await control.focus()
  await expect(control).toBeFocused()
  await page.keyboard.press(key)
}

async function assertNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
}

for (const viewport of operatorViewports) {
  test.describe(`workspace accessibility smoke on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("keeps dense workspace controls named, stateful, and keyboard-operable", async ({ page }) => {
      await page.goto("/")

      const queue = page.getByLabel("RFQ queue")
      const selectedRfq = page.getByLabel("Selected RFQ")
      const inspector = page.getByLabel("Quote inspector")
      const integrationHealth = page.getByLabel("Integration health")
      await expect(queue).toBeVisible()
      await expect(selectedRfq).toBeVisible()
      await expect(inspector).toBeVisible()
      await expect(integrationHealth).toBeVisible()

      const queueFilters = queue.getByRole("group", { name: "Queue filters" })
      const rushFilter = queueFilters.getByRole("button", { name: "Rush" })
      await expect(queueFilters.getByRole("button", { name: "Due soon" })).toHaveAttribute("aria-pressed", "false")
      await expect(rushFilter).toHaveAttribute("aria-pressed", "false")
      await expect(queueFilters.getByRole("button", { name: "CNC" })).toHaveAttribute("aria-pressed", "false")
      await activateFocusedControl(page, rushFilter)
      await expect(rushFilter).toHaveAttribute("aria-pressed", "true")
      await expect(queue.locator(".queue-count")).toHaveText("1/3")
      await activateFocusedControl(page, rushFilter)
      await expect(rushFilter).toHaveAttribute("aria-pressed", "false")
      await expect(queue.locator(".queue-count")).toHaveText("3")

      const attachmentsToggle = page.getByRole("button", { name: "Open attachments" })
      await expect(attachmentsToggle).toHaveAttribute("aria-controls", "rfq-attachments")
      await expect(attachmentsToggle).toHaveAttribute("aria-expanded", "false")
      await activateFocusedControl(page, attachmentsToggle, "Space")
      await expect(attachmentsToggle).toHaveAttribute("aria-expanded", "true")
      await expect(page.getByLabel("RFQ attachments")).toContainText("FB-204-A.step")

      const workspaceViews = page.getByRole("navigation", { name: "Workspace views" })
      const triageTab = workspaceViews.getByRole("button", { name: "Triage" })
      const costingTab = workspaceViews.getByRole("button", { name: "Costing" })
      const offerTab = workspaceViews.getByRole("button", { name: "Offer" })
      await expect(triageTab).toHaveAttribute("aria-pressed", /true|false/)
      await expect(costingTab).toHaveAttribute("aria-pressed", /true|false/)
      await expect(offerTab).toHaveAttribute("aria-pressed", /true|false/)
      await expect(workspaceViews.locator('[aria-pressed="true"]')).toHaveCount(1)

      await activateFocusedControl(page, costingTab)
      await expect(triageTab).toHaveAttribute("aria-pressed", "false")
      await expect(costingTab).toHaveAttribute("aria-pressed", "true")
      await expect(page.getByLabel("Quote scenario comparison")).toBeVisible()

      await activateFocusedControl(page, offerTab)
      await expect(costingTab).toHaveAttribute("aria-pressed", "false")
      await expect(offerTab).toHaveAttribute("aria-pressed", "true")
      await expect(page.getByLabel("Offer export actions")).toBeVisible()

      const processDemos = page.getByLabel("Non-CNC registry demos")
      const processSelector = processDemos.getByLabel("Process quote preview selector")
      const plasticsOption = processSelector.getByRole("button", { name: /Plastic/i })
      await expect(plasticsOption).toHaveAttribute("aria-pressed", "false")
      await activateFocusedControl(page, plasticsOption)
      await expect(plasticsOption).toHaveAttribute("aria-pressed", "true")
      await expect(processDemos.getByLabel("Selected non-CNC quote preview")).toContainText("Plastic")

      await assertNoHorizontalOverflow(page)
    })
  })
}
