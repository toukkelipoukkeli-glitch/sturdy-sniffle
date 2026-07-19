import { expect, test, type Page } from "@playwright/test"

const operatorViewports = [
  { label: "desktop", size: { width: 1440, height: 1000 } },
  { label: "mobile", size: { width: 390, height: 900 } },
]

const workspaceStorageKey = "factorybid.workspace.v1"

async function seedQueueWithoutRushItems(page: Page) {
  await page.goto("/")
  const queue = page.getByLabel("RFQ queue")
  await expect(queue.getByRole("button", { name: /Baltic Hydraulics/ })).toBeVisible()
  await page.waitForFunction(
    (storageKey) => window.localStorage.getItem(storageKey)?.includes("Baltic Hydraulics"),
    workspaceStorageKey,
  )

  await page.evaluate((storageKey) => {
    type PersistedQueueWorkItem = {
      customer?: unknown
      id?: unknown
      priority?: unknown
    }
    type PersistedWorkspaceState = {
      selectedId?: unknown
      workItems?: PersistedQueueWorkItem[]
    } & Record<string, unknown>

    const rawState = window.localStorage.getItem(storageKey)
    if (!rawState) {
      throw new Error("Expected a persisted workspace snapshot before pruning queue fixtures.")
    }

    const parsedState = JSON.parse(rawState) as PersistedWorkspaceState
    const workItems = Array.isArray(parsedState.workItems) ? parsedState.workItems : []
    const nonRushItems = workItems.filter((item) => item.priority !== "rush")
    if (nonRushItems.length === workItems.length || nonRushItems.length === 0) {
      throw new Error("Expected the fixture workspace to include at least one rush and one non-rush RFQ.")
    }

    const selectedId = nonRushItems.some((item) => item.id === parsedState.selectedId)
      ? parsedState.selectedId
      : nonRushItems[0]?.id
    if (typeof selectedId !== "string") {
      throw new Error("Expected a selected RFQ id after pruning rush fixtures.")
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...parsedState,
        selectedId,
        workItems: nonRushItems,
      }),
    )
  }, workspaceStorageKey)
  await page.reload()
}

async function assertNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
}

for (const viewport of operatorViewports) {
  test(`shows and recovers from an empty RFQ queue filter state on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize(viewport.size)
    await seedQueueWithoutRushItems(page)

    const queue = page.getByLabel("RFQ queue")
    await expect(queue.locator(".queue-count")).toHaveText("2")
    await expect(queue.getByRole("button", { name: /North Forge/ })).toBeVisible()
    await expect(queue.getByRole("button", { name: /Arctic Instruments/ })).toBeVisible()
    await expect(queue.getByRole("button", { name: /Baltic Hydraulics/ })).toHaveCount(0)

    const rushFilter = queue.getByRole("button", { name: "Rush" })
    await rushFilter.click()
    await expect(rushFilter).toHaveAttribute("aria-pressed", "true")
    await expect(queue.locator(".queue-count")).toHaveText("0/2")
    await expect(queue.getByText("No RFQs match these filters.")).toBeVisible()
    await expect(queue.getByRole("button", { name: /North Forge/ })).toHaveCount(0)
    await expect(queue.getByRole("button", { name: /Arctic Instruments/ })).toHaveCount(0)
    await assertNoHorizontalOverflow(page)

    await queue.getByRole("button", { name: "Clear filters" }).click()
    await expect(rushFilter).toHaveAttribute("aria-pressed", "false")
    await expect(queue.getByText("No RFQs match these filters.")).toHaveCount(0)
    await expect(queue.locator(".queue-count")).toHaveText("2")
    await expect(queue.getByRole("button", { name: /North Forge/ })).toBeVisible()
    await expect(queue.getByRole("button", { name: /Arctic Instruments/ })).toBeVisible()
    await assertNoHorizontalOverflow(page)
  })
}
