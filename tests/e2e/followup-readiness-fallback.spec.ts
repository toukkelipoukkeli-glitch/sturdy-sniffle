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

async function installFailingReadinessBridge(page: Page) {
  await page.addInitScript(() => {
    ;(window as typeof window & {
      __FACTORYBID_WORKSPACE_CONVEX__?: {
        mutationRefs: Record<string, string>
        offerFollowUpActivityReadinessMutationRef: string
        offerFollowUpActivityReadinessQueryRef: string
        offerIdsByLocalId: Record<string, string>
        rfqIdsByLocalId: Record<string, string>
        runMutation: () => Promise<void>
        runQuery: () => Promise<never>
      }
    }).__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      offerFollowUpActivityReadinessMutationRef: "recordOfferFollowUpActivityReadiness",
      offerFollowUpActivityReadinessQueryRef: "listOfferFollowUpActivityReadiness",
      offerIdsByLocalId: {
        "offer-204": "convex-offer-204",
      },
      rfqIdsByLocalId: {
        "rfq-204": "convex-rfq-204",
      },
      runMutation: async () => {},
      runQuery: async () => {
        throw new Error("convex unavailable")
      },
    }
  })
}

for (const viewport of operatorViewports) {
  test.describe(`follow-up readiness fallback on ${viewport.label}`, () => {
    test.use({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: viewport.size,
    })

    test("surfaces read fallback recovery and diagnostic copy", async ({ page }) => {
      await installFailingReadinessBridge(page)
      await page.goto("/")

      const persistenceStatus = page.getByLabel("Persistence status")
      await expect(persistenceStatus).toContainText("sync fallback")
      await expect(persistenceStatus).toHaveAttribute("data-severity", "warning")
      await persistenceStatus.getByRole("button", { name: "Review sync health details" }).click()

      const readinessHistory = page.getByLabel("Follow-up activity readiness history")
      await expect(readinessHistory).toContainText("Sync health Read fallback")
      await expect(readinessHistory).toContainText(
        /Follow-up readiness persistence used [12] fallbacks? \(read [12], write 0\); latest fallback is current\./,
      )
      await expect(readinessHistory).toContainText(
        /[12] follow-up readiness persistence fallbacks? recorded · read [12] · write 0\./,
      )
      await expect(readinessHistory).toContainText("Latest read fallback")
      await expect(readinessHistory).toContainText("Fallback recency · Current")
      await expect(readinessHistory).toContainText("Persistence severity · Warning")
      await expect(readinessHistory).toContainText("Check Convex readiness reads before trusting remote follow-up history.")
      await expect(readinessHistory).toContainText("Current pending readiness")
      const syncHealth = readinessHistory.locator(".offer-follow-up-readiness-sync-health")
      await expect(syncHealth).toHaveAttribute("data-status", "read_fallback")
      await expect(syncHealth).toHaveAttribute("data-severity", "warning")

      const fallbackFilters = readinessHistory.getByLabel("Follow-up readiness sync fallback filters")
      await expect(fallbackFilters.getByRole("button", { name: /All [12]/ })).toHaveAttribute("aria-pressed", "true")
      const fallbackEvents = readinessHistory.getByLabel("Follow-up readiness sync fallback events")
      await expect(fallbackEvents).toContainText("Read fallback")
      await expect(fallbackEvents).toContainText("offer-204")
      await expect(fallbackEvents).toContainText("rfq-204")
      await fallbackFilters.getByRole("button", { name: "Write 0" }).click()
      await expect(fallbackEvents).toContainText("No write fallbacks recorded.")

      await readinessHistory.getByRole("button", { name: "Copy sync summary" }).click()
      await expect(readinessHistory).toContainText("Sync-health summary copied for diagnostics.")
      const copiedSummary = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedSummary).toContain("Follow-up readiness sync health: read_fallback")
      expect(copiedSummary).toMatch(/Fallbacks: total [12], read [12], write 0/)
      expect(copiedSummary).toContain("Check Convex readiness reads before trusting remote follow-up history.")

      const integrationHealth = page.getByLabel("Integration health")
      await expect(integrationHealth).toContainText("Persistence")
      await expect(integrationHealth).toContainText(
        /[12] follow-up readiness persistence fallbacks? recorded \(read [12], write 0\); latest fallback is current\./,
      )
      await expect(persistenceStatus).toContainText("sync fallback")
      await expect(persistenceStatus).toHaveAttribute("data-severity", "warning")

      await assertNoHorizontalOverflow(page)
    })
  })
}
