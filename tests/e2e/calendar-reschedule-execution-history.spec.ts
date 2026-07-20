import { expect, test, type Page } from "@playwright/test"

const workspaceStorageKey = "factorybid.workspace.v1"

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

async function seedOverdueCalendarFollowUp(page: Page) {
  await page.goto("/")
  await page.waitForFunction((storageKey) => {
    const rawState = window.localStorage.getItem(storageKey)
    if (!rawState) {
      return false
    }
    try {
      const parsed = JSON.parse(rawState) as { workItems?: unknown[] }
      return Array.isArray(parsed.workItems) && parsed.workItems.some((item) => (item as { id?: string }).id === "rfq-019")
    } catch {
      return false
    }
  }, workspaceStorageKey)

  await page.evaluate((storageKey) => {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as Record<string, unknown>
    const actionsById = (stored.actionsById ?? {}) as Record<string, unknown[]>
    actionsById["rfq-019"] = [
      {
        actionVersion: "workspace-action.v1",
        activityKind: "calendar_event",
        activityMessage: "Scheduled offer follow-up follow-up-rfq-019 for offer-019 at 2026-06-19T06:00:00.000Z.",
        actor: "Sari",
        followUpDueAt: "2026-06-19T06:00:00.000Z",
        followUpTaskId: "follow-up-rfq-019",
        key: "rfq-019:follow-up-created:overdue-calendar-execution-history-e2e",
        kind: "follow_up_created",
        occurredAt: "2026-06-18T06:00:00.000Z",
        offerId: "offer-019",
        quoteId: "quote-019",
        rfqId: "rfq-019",
      },
    ]
    stored.actionsById = actionsById
    stored.activeView = "triage"
    stored.selectedId = "rfq-019"
    window.localStorage.setItem(storageKey, JSON.stringify(stored))
  }, workspaceStorageKey)
}

for (const viewport of operatorViewports) {
  test.describe(`calendar reschedule execution history on ${viewport.label}`, () => {
    test.use({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: viewport.size,
    })

    test("copies local execution history and restores it after reload", async ({ page }) => {
      await seedOverdueCalendarFollowUp(page)
      await page.reload()
      await page.getByRole("button", { exact: true, name: "Triage" }).click()

      const followUpStatus = page.getByLabel("Calendar follow-up status")
      await expect(followUpStatus).toContainText("Review follow-up")
      await expect(followUpStatus.locator(".metric", { hasText: "Reschedule" })).toContainText("1")

      const executionHistory = followUpStatus.getByLabel("Calendar follow-up reschedule execution history summary")
      await expect(executionHistory).toContainText("Execution history ready for review")
      await expect(executionHistory).toContainText(
        "Calendar reschedule execution history has 1 execution run; latest dry-run prepared 1 command(s) for review.",
      )
      await expect(executionHistory.locator(".metric", { hasText: "Runs" })).toContainText("1")
      await expect(executionHistory.locator(".metric", { hasText: "Commands" })).toContainText("1")
      await expect(executionHistory.locator(".metric", { hasText: "Pending" })).toContainText("1")
      await expect(executionHistory).toContainText("Review dry-run:")
      await expect(executionHistory).toContainText("Keep writes disabled:")

      await executionHistory.getByRole("button", { name: "Copy execution history" }).click()
      await expect(executionHistory).toContainText("Calendar reschedule execution history copied.")
      const copiedHistory = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedHistory).toContain("Calendar reschedule execution history: ready_for_review")
      expect(copiedHistory).toContain("Runs: 1; commands 1; pending actions 1; warnings 0")
      expect(copiedHistory).toContain("RFQs: rfq-019")
      expect(copiedHistory).toContain("Tasks: follow-up-rfq-019")
      expect(copiedHistory).toContain("Latest execution: prepared")
      expect(copiedHistory).toContain("- info Review dry-run:")
      await assertNoHorizontalOverflow(page)

      await page.reload()
      const restoredExecutionHistory = page
        .getByLabel("Calendar follow-up status")
        .getByLabel("Calendar follow-up reschedule execution history summary")
      await expect(restoredExecutionHistory).toContainText("Execution history ready for review")
      await expect(restoredExecutionHistory.locator(".metric", { hasText: "Runs" })).toContainText("1")
      await expect(restoredExecutionHistory).toContainText("Keep writes disabled:")
      await assertNoHorizontalOverflow(page)
    })
  })
}
