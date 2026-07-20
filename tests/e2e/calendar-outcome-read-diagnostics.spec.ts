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

async function installFailingCalendarOutcomeReadBridge(page: Page) {
  await page.addInitScript(() => {
    ;(window as typeof window & {
      __FACTORYBID_WORKSPACE_CONVEX__?: {
        calendarFollowUpRescheduleProviderOutcomesQueryRef: string
        mutationRefs: Record<string, string>
        rfqIdsByLocalId: Record<string, string>
        runMutation: () => Promise<void>
        runQuery: () => Promise<never>
      }
    }).__FACTORYBID_WORKSPACE_CONVEX__ = {
      calendarFollowUpRescheduleProviderOutcomesQueryRef: "listCalendarRescheduleProviderOutcomes",
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      rfqIdsByLocalId: {
        "rfq-204": "convex-rfq-204",
      },
      runMutation: async () => {},
      runQuery: async () => {
        throw new Error("calendar outcome read unavailable")
      },
    }
  })
}

for (const viewport of operatorViewports) {
  test.describe(`calendar outcome read diagnostics on ${viewport.label}`, () => {
    test.use({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: viewport.size,
    })

    test("surfaces fallback recovery and diagnostic copy", async ({ page }) => {
      await installFailingCalendarOutcomeReadBridge(page)
      await page.goto("/")
      await page.getByRole("button", { exact: true, name: "Triage" }).click()

      const followUpStatus = page.getByLabel("Calendar follow-up status")
      const providerOutcomeHistory = followUpStatus.getByLabel(
        "Calendar follow-up reschedule provider outcome history summary",
      )
      const readSync = providerOutcomeHistory.getByLabel("Calendar provider outcome read sync")
      await expect(readSync).toContainText("Sync source Local fallback")
      await expect(readSync).toContainText(
        "Convex calendar provider outcome read failed; showing 0 local provider outcome batches.",
      )
      await expect(readSync.locator(".metric", { hasText: "Convex" })).toContainText("0")
      await expect(readSync.locator(".metric", { hasText: "Local" })).toContainText("0")
      await expect(readSync.locator(".metric", { hasText: "Fallback" })).toContainText("1")

      const integrationHealth = page.getByLabel("Integration health")
      await expect(integrationHealth).toContainText("Calendar outcome reads")
      await expect(integrationHealth).toContainText(
        "Calendar provider outcome history fell back to 0 local calendar provider outcome batches after a Convex read failure.",
      )
      const recoveryActions = integrationHealth.getByLabel("Calendar outcome reads recovery actions")
      await expect(recoveryActions).toContainText("Retry outcome read")
      await expect(recoveryActions).toContainText(
        "Keep local calendar provider outcome batches visible and retry the optional Convex read before committing provider-side calendar changes.",
      )

      await integrationHealth.getByRole("button", { name: "Copy outcome read diagnostics" }).click()
      await expect(integrationHealth).toContainText("Calendar outcome read diagnostics copied.")
      const copiedDiagnostics = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedDiagnostics).toContain("Calendar provider outcome read diagnostics")
      expect(copiedDiagnostics).toContain("Status: fallback")
      expect(copiedDiagnostics).toContain("Batches: persisted 0, local 0, fallback 1")
      expect(copiedDiagnostics).toContain("Retry outcome read")

      await assertNoHorizontalOverflow(page)
    })
  })
}
