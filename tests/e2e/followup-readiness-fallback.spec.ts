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
    if (window.localStorage.getItem("factorybid.skipReadinessBridge") === "true") {
      return
    }
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

async function seedRestoredReadWriteFallbacks(page: Page) {
  await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}") as Record<string, unknown>
    stored.activeView = "offer"
    stored.followUpActivityReadinessSyncEvents = Array.from({ length: 12 }, (_, index) => {
      const operation = index % 2 === 0 ? "read" : "write"
      const recordedAt = `2026-06-18T05:${String(index).padStart(2, "0")}:00.000Z`
      const nonce = `seed-${index}`
      return {
        eventId: `offer-follow-up-activity-readiness-sync:${operation}:offer-204:rfq-204:${recordedAt}:${nonce}`,
        healthVersion: "offer-follow-up-activity-readiness-sync-health.v1",
        nonce,
        offerId: "offer-204",
        operation,
        recordedAt,
        rfqId: "rfq-204",
      }
    })
    window.localStorage.setItem("factorybid.workspace.v1", JSON.stringify(stored))
    window.localStorage.setItem("factorybid.skipReadinessBridge", "true")
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

    test("restores stale read-write fallback history after reload", async ({ page }) => {
      await installFailingReadinessBridge(page)
      await page.goto("/")

      const persistenceStatus = page.getByLabel("Persistence status")
      await expect(persistenceStatus).toContainText("sync fallback")
      await seedRestoredReadWriteFallbacks(page)
      await page.reload()

      const restoredStatus = page.getByLabel("Persistence status")
      await expect(restoredStatus).toContainText("12 stale fallback")
      await expect(restoredStatus).toHaveAttribute("data-severity", "critical")
      await restoredStatus.getByRole("button", { name: "Review sync health details" }).click()

      const readinessHistory = page.getByLabel("Follow-up activity readiness history")
      await expect(readinessHistory).toContainText("Sync health Read/write fallback")
      await expect(readinessHistory).toContainText(
        "Follow-up readiness persistence used 12 fallbacks (read 6, write 6); latest fallback is stale.",
      )
      await expect(readinessHistory).toContainText("12 follow-up readiness persistence fallbacks recorded · read 6 · write 6.")
      await expect(readinessHistory).toContainText("Latest read fallback")
      await expect(readinessHistory).toContainText("Latest write fallback")
      await expect(readinessHistory).toContainText("Fallback recency · Stale")
      await expect(readinessHistory).toContainText("Persistence severity · Critical")
      await expect(readinessHistory).toContainText("Follow-up readiness persisted reads are stale or unavailable.")
      await expect(readinessHistory).toContainText("Recent fallbacks 12")
      await expect(readinessHistory).toContainText("Check Convex readiness reads before trusting remote follow-up history.")
      await expect(readinessHistory).toContainText("Retry readiness writes after Convex persistence recovers.")
      await expect(page.getByLabel("Follow-up readiness sync health: Read/write fallback, 12 fallbacks")).toHaveAttribute(
        "data-severity",
        "critical",
      )

      const fallbackFilters = readinessHistory.getByLabel("Follow-up readiness sync fallback filters")
      await expect(fallbackFilters.getByRole("button", { name: "All 12" })).toHaveAttribute("aria-pressed", "true")
      const fallbackEvents = readinessHistory.getByLabel("Follow-up readiness sync fallback events")
      await expect(fallbackEvents).toContainText("6 older sync fallbacks hidden.")

      await readinessHistory.getByRole("button", { name: "Copy sync summary" }).click()
      await expect(readinessHistory).toContainText("Sync-health summary copied for diagnostics.")
      const copiedSummary = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedSummary).toContain("Follow-up readiness sync health: read_write_fallback")
      expect(copiedSummary).toContain("Fallbacks: total 12, read 6, write 6")
      expect(copiedSummary).toContain(
        "offer-follow-up-activity-readiness-sync:read:offer-204:rfq-204:2026-06-18T05:00:00.000Z:seed-0",
      )

      await fallbackFilters.getByRole("button", { name: "Write 6" }).click()
      await expect(fallbackFilters.getByRole("button", { name: "Write 6" })).toHaveAttribute("aria-pressed", "true")
      await expect(fallbackEvents.getByText("Write fallback")).toHaveCount(6)
      await expect(fallbackEvents.getByText("Read fallback")).toHaveCount(0)
      await expect(fallbackEvents).not.toContainText("hidden")

      const integrationHealth = page.getByLabel("Integration health")
      await expect(integrationHealth).toContainText(
        "12 follow-up readiness persistence fallbacks recorded (read 6, write 6); latest fallback is stale.",
      )
      await expect(integrationHealth).toContainText("12 stale")

      await assertNoHorizontalOverflow(page)
    })
  })
}
