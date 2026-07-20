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
        key: "rfq-019:follow-up-created:overdue-calendar-provider-outcome-e2e",
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
  test.describe(`calendar provider outcome history on ${viewport.label}`, () => {
    test.use({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: viewport.size,
    })

    test("surfaces local provider outcome history and export copy after reload", async ({ page }) => {
      await seedOverdueCalendarFollowUp(page)
      await page.reload()
      await page.getByRole("button", { exact: true, name: "Triage" }).click()

      const followUpStatus = page.getByLabel("Calendar follow-up status")
      await expect(followUpStatus).toContainText("Review follow-up")
      await expect(followUpStatus.locator(".metric", { hasText: "Reschedule" })).toContainText("1")

      const providerOutcomeReadModel = followUpStatus.getByLabel("Calendar follow-up reschedule provider outcome read model")
      await expect(providerOutcomeReadModel).toContainText("Calendar provider outcomes ready")
      await expect(providerOutcomeReadModel.locator(".metric", { hasText: "Expected" })).toContainText("1")
      await expect(providerOutcomeReadModel.locator(".metric", { hasText: "Created" })).toContainText("1")
      await expect(providerOutcomeReadModel.locator(".metric", { hasText: "Missing" })).toContainText("0")

      const providerOutcomeHistory = followUpStatus.getByLabel(
        "Calendar follow-up reschedule provider outcome history summary",
      )
      await expect(providerOutcomeHistory).toContainText("Calendar provider outcome history ready")
      await expect(providerOutcomeHistory).toContainText(
        "Latest provider outcome batch for rfq-019 created 1 of 1 expected outcome(s) for the execution audit.",
      )
      await expect(providerOutcomeHistory.getByLabel("Calendar provider outcome read sync")).toContainText("Sync source Local")
      await expect(providerOutcomeHistory.locator(".metric", { hasText: "Batches" })).toContainText("1")
      await expect(providerOutcomeHistory.locator(".metric", { hasText: "Expected" })).toContainText("1")
      await expect(providerOutcomeHistory.locator(".metric", { hasText: "Created" })).toContainText("1")
      await expect(providerOutcomeHistory.locator(".metric", { hasText: "Failed" })).toContainText("0")
      await expect(providerOutcomeHistory).toContainText("Latest ready")
      await expect(providerOutcomeHistory).toContainText("1 outcome · 1 warning")
      await expect(providerOutcomeHistory).toContainText(
        "Use the latest local provider outcomes when recording the calendar reschedule execution audit.",
      )

      await providerOutcomeHistory.getByRole("button", { name: "Copy outcome history" }).click()
      await expect(providerOutcomeHistory).toContainText("Calendar provider outcome history copied.")
      const copiedHistory = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedHistory).toContain("Calendar provider outcome history: ready")
      expect(copiedHistory).toContain("Batches: 1; outcomes 1; expected 1; created 1; failed 0; missing 0")
      expect(copiedHistory).toContain("RFQs: rfq-019")
      expect(copiedHistory).toContain("Tasks: follow-up-rfq-019")
      await assertNoHorizontalOverflow(page)

      await page.reload()
      const restoredFollowUpStatus = page.getByLabel("Calendar follow-up status")
      const restoredProviderOutcomeHistory = restoredFollowUpStatus.getByLabel(
        "Calendar follow-up reschedule provider outcome history summary",
      )
      await expect(restoredProviderOutcomeHistory).toContainText("Calendar provider outcome history ready")
      await expect(restoredProviderOutcomeHistory).toContainText("Latest ready")
      await expect(restoredProviderOutcomeHistory).toContainText("1 outcome · 1 warning")
      await assertNoHorizontalOverflow(page)
    })
  })
}
