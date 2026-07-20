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

async function seedConnectorRecoverySnapshot(page: Page) {
  await page.waitForFunction((storageKey) => {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return false
    }
    try {
      const stored = JSON.parse(raw) as Record<string, unknown>
      return stored.version === 1 && Array.isArray(stored.workItems) && stored.workItems.length > 0
    } catch {
      return false
    }
  }, workspaceStorageKey)

  await page.evaluate((storageKey) => {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as Record<string, unknown>
    const selectedId = typeof stored.selectedId === "string" ? stored.selectedId : "rfq-204"
    stored.connectorSnapshotsById = {
      [selectedId]: {
        payloads: [
          {
            activities: [
              {
                actorName: "FactoryBid connector",
                kind: "note",
                message: "Restored connector recovery audit.",
                rfqId: selectedId,
              },
            ],
            links: [
              {
                externalId: "thread-stale-001",
                provider: "gmail",
                rfqId: selectedId,
                syncStatus: "stale",
              },
              {
                externalId: "calendar-blocked-001",
                provider: "calendar",
                rfqId: selectedId,
                syncStatus: "blocked",
              },
              {
                externalId: "thread-shared-001",
                provider: "gmail",
                rfqId: selectedId,
                syncStatus: "linked",
              },
              {
                externalId: "thread-shared-001",
                provider: "gmail",
                rfqId: "rfq-301",
                syncStatus: "linked",
              },
            ],
          },
        ],
        syncCount: 1,
      },
    }
    window.localStorage.setItem(storageKey, JSON.stringify(stored))
  }, workspaceStorageKey)
}

for (const viewport of operatorViewports) {
  test.describe(`connector recovery actions on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("restores stale-link recovery actions after reload", async ({ page }) => {
      await page.goto("/")
      await seedConnectorRecoverySnapshot(page)
      await page.reload()

      const integrationHealth = page.getByLabel("Integration health")
      const connectorDrilldown = integrationHealth.getByLabel("Connector link drill-down")
      await expect(connectorDrilldown.locator(".metric", { hasText: "Links" })).toContainText("3")
      await expect(connectorDrilldown.locator(".metric", { hasText: "Gmail" })).toContainText("2")
      await expect(connectorDrilldown.locator(".metric", { hasText: "Calendar" })).toContainText("1")
      await expect(connectorDrilldown.locator(".metric", { hasText: "Activity" })).toContainText("1")

      const recoveryActions = connectorDrilldown.getByLabel("Connector stale-link recovery actions")
      await expect(recoveryActions).toContainText("Refresh Gmail sync for thread-stale-001.")
      await expect(recoveryActions).toContainText("Reconnect Calendar before resyncing calendar-blocked-001.")

      const crossRfqHistory = connectorDrilldown.getByLabel("Cross-RFQ connector history")
      await expect(crossRfqHistory).toContainText("1 shared")
      await expect(crossRfqHistory).toContainText("Gmail message thread shared with 1 RFQ")
      await expect(crossRfqHistory).toContainText("thread-shared-001 also appears on 1 other RFQ: rfq-301.")

      await connectorDrilldown.getByRole("button", { name: "Attention 2" }).click()
      const connectorRows = connectorDrilldown.locator(".connector-drilldown-list")
      await expect(connectorRows).toContainText("thread-stale-001")
      await expect(connectorRows).toContainText("calendar-blocked-001")
      await expect(connectorRows.getByText("thread-shared-001", { exact: false })).toHaveCount(0)

      await connectorDrilldown.getByRole("button", { name: "Activity 1" }).click()
      await expect(connectorDrilldown).toContainText("Restored connector recovery audit.")

      await assertNoHorizontalOverflow(page)
    })
  })
}
