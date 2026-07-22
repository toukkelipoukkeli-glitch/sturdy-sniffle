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

async function prepareReviewedRelease(page: Page) {
  await page.goto("/")
  await page.getByRole("button", { exact: true, name: "Offer" }).click()
  await page.getByLabel("Quote release gate").getByRole("button", { name: "Mark reviewed" }).click()
  await expect(page.getByLabel("Quote release gate")).toContainText("Reviewed by Sari")

  await page.getByRole("button", { exact: true, name: "Triage" }).click()
  await page.getByRole("button", { name: "Create follow-up" }).click()
  await page.getByRole("button", { name: "Move to ready" }).click()
  await page.getByRole("button", { exact: true, name: "Offer" }).click()
}

async function installPendingReleaseExecutionReadBridge(page: Page) {
  await page.addInitScript(() => {
    ;(window as typeof window & {
      __FACTORYBID_WORKSPACE_CONVEX__?: {
        mutationRefs: Record<string, string>
        offerIdsByLocalId: Record<string, string>
        offerReleaseExecutionsQueryRef: string
        runMutation: () => Promise<void>
        runQuery: (queryRef: unknown, args: Record<string, unknown>) => Promise<never>
      }
    }).__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      offerIdsByLocalId: {
        "offer-204": "convex-offer-204",
      },
      offerReleaseExecutionsQueryRef: "listOfferReleaseExecutions",
      runMutation: async () => {},
      runQuery: async (queryRef, args) => {
        if (queryRef !== "listOfferReleaseExecutions") {
          throw new Error(`Unexpected release execution query ref: ${String(queryRef)}`)
        }
        if (args.offerId !== "convex-offer-204") {
          throw new Error(`Unexpected release execution offer id: ${String(args.offerId)}`)
        }
        return new Promise<never>(() => {})
      },
    }
  })
}

async function installPendingFollowUpActivityReadBridge(page: Page) {
  await page.addInitScript(() => {
    ;(window as typeof window & {
      __FACTORYBID_WORKSPACE_CONVEX__?: {
        mutationRefs: Record<string, string>
        offerFollowUpActivitiesQueryRef: string
        offerIdsByLocalId: Record<string, string>
        runMutation: () => Promise<void>
        runQuery: (queryRef: unknown, args: Record<string, unknown>) => Promise<never>
      }
    }).__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      offerFollowUpActivitiesQueryRef: "listOfferFollowUpActivities",
      offerIdsByLocalId: {
        "offer-204": "convex-offer-204",
      },
      runMutation: async () => {},
      runQuery: async (queryRef, args) => {
        if (queryRef !== "listOfferFollowUpActivities") {
          throw new Error(`Unexpected follow-up activity query ref: ${String(queryRef)}`)
        }
        if (args.offerId !== "convex-offer-204") {
          throw new Error(`Unexpected follow-up activity offer id: ${String(args.offerId)}`)
        }
        return new Promise<never>(() => {})
      },
    }
  })
}

async function installPendingProviderOutcomeReadinessBridge(page: Page) {
  await page.addInitScript(() => {
    ;(window as typeof window & {
      __FACTORYBID_WORKSPACE_CONVEX__?: {
        mutationRefs: Record<string, string>
        offerIdsByLocalId: Record<string, string>
        offerProviderOutcomeReadinessMutationRef: string
        offerProviderOutcomeReadinessQueryRef: string
        rfqIdsByLocalId: Record<string, string>
        runMutation: () => Promise<void>
        runQuery: (queryRef: unknown, args: Record<string, unknown>) => Promise<never>
      }
    }).__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      offerIdsByLocalId: {
        "offer-204": "convex-offer-204",
      },
      offerProviderOutcomeReadinessMutationRef: "recordOfferProviderOutcomeReadiness",
      offerProviderOutcomeReadinessQueryRef: "listOfferProviderOutcomeReadiness",
      rfqIdsByLocalId: {
        "rfq-204": "convex-rfq-204",
      },
      runMutation: async () => {},
      runQuery: async (queryRef, args) => {
        if (queryRef !== "listOfferProviderOutcomeReadiness") {
          throw new Error(`Unexpected provider readiness query ref: ${String(queryRef)}`)
        }
        if (args.offerId !== "convex-offer-204") {
          throw new Error(`Unexpected provider readiness offer id: ${String(args.offerId)}`)
        }
        return new Promise<never>(() => {})
      },
    }
  })
}

for (const viewport of operatorViewports) {
  test.describe(`offer provider readiness on ${viewport.label}`, () => {
    test.use({ viewport: viewport.size })

    test("persists release provider readiness and local execution history after reload", async ({ page }) => {
      await prepareReviewedRelease(page)

      await expect(page.getByLabel("Offer release command plan")).toContainText("Release commands ready")
      await expect(page.getByLabel("Offer release send summary")).toContainText(
        "Offer OFFER-204 is ready to send to sari.virtanen@example.test with OFFER-204-rev1.pdf.",
      )

      const emailDraftHistory = page.getByLabel("Offer email draft package history")
      await expect(emailDraftHistory).toContainText("1 draft package")
      await expect(emailDraftHistory).toContainText("Provider-safe")
      await expect(emailDraftHistory).toContainText("sari.virtanen@example.test")
      await expect(emailDraftHistory.getByLabel("Email draft package recipients")).toContainText("ready")

      const providerOutcomeHistory = page.getByLabel("Offer provider outcome history")
      await expect(providerOutcomeHistory).toContainText("1 outcome batch")
      await expect(providerOutcomeHistory).toContainText("Provider-ready")
      await expect(providerOutcomeHistory.getByLabel("Provider outcome command summaries")).toContainText("Email Draft")
      await expect(providerOutcomeHistory.getByLabel("Provider outcome command summaries")).toContainText("Calendar Follow Up")

      const readinessHistory = page.getByLabel("Readiness persistence history")
      await expect(readinessHistory).toContainText("2 readiness records")
      await expect(readinessHistory).toContainText("Recorded")
      await expect(readinessHistory.locator(".metric", { hasText: /^Ready 1$/ })).toBeVisible()
      await expect(readinessHistory.locator(".metric", { hasText: /^Blocked 1$/ })).toBeVisible()
      await expect(readinessHistory).toContainText("Current readiness recorded")
      await expect(readinessHistory).toContainText("6/6 command outcomes recorded")

      const executionAudit = page.getByLabel("Offer release execution audit")
      await expect(executionAudit).toContainText("Dry-run prepared")
      await expect(page.getByLabel("Provider outcome readiness", { exact: true })).toContainText(
        "Provider outcomes ready: 6 applied commands.",
      )
      const executeRelease = executionAudit.getByRole("button", { name: "Execute release" })
      await expect(executeRelease).toBeEnabled()
      await executeRelease.dispatchEvent("click")
      await expect(executionAudit).toContainText("Execution completed")
      await expect(executionAudit.locator(".metric", { hasText: "Mode" })).toContainText("commit")
      await expect(executionAudit).toContainText("Local adapter recorded the command; no external connector call was made.")
      await expect(executionAudit.getByRole("button", { name: "Release executed" })).toBeDisabled()
      await expect(page.getByLabel("Offer release execution history")).toContainText("2 recorded runs")

      await page.reload()
      await expect(page.getByLabel("Offer release execution audit")).toContainText("Execution completed")
      await expect(page.getByLabel("Offer release execution audit").locator(".metric", { hasText: "Mode" })).toContainText("commit")
      await expect(page.getByLabel("Offer release execution audit").getByRole("button", { name: "Release executed" })).toBeDisabled()
      await expect(page.getByLabel("Offer release execution history")).toContainText("2 recorded runs")
      const restoredReadinessHistory = page.getByLabel("Readiness persistence history")
      await expect(restoredReadinessHistory).toContainText("2 readiness records")
      await expect(restoredReadinessHistory.locator(".metric", { hasText: /^Ready 1$/ })).toBeVisible()
      await expect(restoredReadinessHistory.locator(".metric", { hasText: /^Blocked 1$/ })).toBeVisible()
      await expect(restoredReadinessHistory).toContainText("Current readiness needs review")
      await assertNoHorizontalOverflow(page)
    })

    test("keeps release execution history visible while persisted reads are pending", async ({ page }) => {
      await installPendingReleaseExecutionReadBridge(page)
      await prepareReviewedRelease(page)

      await expect(page.getByLabel("Offer release command plan")).toContainText("Release commands ready")
      const executionAudit = page.getByLabel("Offer release execution audit")
      await expect(executionAudit).toContainText("Dry-run prepared")
      await executionAudit.getByRole("button", { name: "Execute release" }).dispatchEvent("click")
      await expect(executionAudit).toContainText("Execution completed")

      const releaseHistory = page.getByLabel("Offer release execution history")
      await expect(releaseHistory).toContainText("2 recorded runs")
      await expect(releaseHistory.getByLabel("Offer release execution read source: Checking Convex")).toHaveAttribute(
        "data-status",
        "pending",
      )
      await expect(releaseHistory).toContainText(
        "Checking Convex for release execution history; 2 release runs remain visible.",
      )
      await expect(releaseHistory.locator(".metric", { hasText: "Latest" })).toContainText("succeeded")
      const integrationHealth = page.getByLabel("Integration health")
      await expect(integrationHealth).toContainText("Release execution reads")
      await expect(integrationHealth).toContainText(
        "Checking Convex release execution history; 2 local fallback runs remain visible.",
      )
      const recoveryActions = integrationHealth.getByLabel("Release execution reads recovery actions")
      await expect(recoveryActions).toContainText("Wait for read result")
      await expect(recoveryActions).toContainText(
        "Keep local fallback release execution runs visible while the optional Convex execution query is still loading.",
      )

      await assertNoHorizontalOverflow(page)
    })

    test("keeps follow-up activity history visible while persisted reads are pending", async ({ page }) => {
      await installPendingFollowUpActivityReadBridge(page)
      await prepareReviewedRelease(page)

      const activityReads = page.getByLabel("Offer follow-up activity reads")
      await expect(activityReads).toContainText("1 persisted activity")
      await expect(activityReads).toContainText("follow-up-rfq-204")
      await expect(activityReads.getByLabel("Offer follow-up activity read source: Checking Convex")).toHaveAttribute(
        "data-status",
        "pending",
      )
      await expect(activityReads).toContainText(
        "Checking Convex for follow-up activity history; 1 follow-up activity remains visible.",
      )
      await expect(activityReads.locator(".metric", { hasText: "Task IDs" })).toContainText("1")
      await expect(activityReads.locator(".metric", { hasText: "Missing" })).toContainText("0")
      const integrationHealth = page.getByLabel("Integration health")
      await expect(integrationHealth).toContainText("Follow-up activity reads")
      await expect(integrationHealth).toContainText(
        "Checking Convex follow-up activity history; 1 local fallback activity remains visible.",
      )
      const recoveryActions = integrationHealth.getByLabel("Follow-up activity reads recovery actions")
      await expect(recoveryActions).toContainText("Wait for read result")
      await expect(recoveryActions).toContainText(
        "Keep local fallback follow-up activity records visible while the optional Convex activity query is still loading.",
      )

      await assertNoHorizontalOverflow(page)
    })

    test("keeps provider readiness history visible while persisted reads are pending", async ({ page }) => {
      await installPendingProviderOutcomeReadinessBridge(page)
      await prepareReviewedRelease(page)

      const readinessHistory = page.getByLabel("Readiness persistence history")
      await expect(readinessHistory).toContainText("2 readiness records")
      await expect(readinessHistory.getByLabel("Provider outcome readiness read source: Checking Convex")).toHaveAttribute(
        "data-status",
        "pending",
      )
      await expect(readinessHistory).toContainText(
        "Checking Convex for provider readiness history; 2 readiness records remain visible.",
      )
      await expect(readinessHistory.locator(".metric", { hasText: /^Ready 1$/ })).toBeVisible()
      await expect(readinessHistory.locator(".metric", { hasText: /^Blocked 1$/ })).toBeVisible()
      await expect(readinessHistory).toContainText("Current readiness recorded")
      const integrationHealth = page.getByLabel("Integration health")
      await expect(integrationHealth).toContainText("Provider readiness reads")
      await expect(integrationHealth).toContainText(
        "Checking Convex provider readiness history; 2 local fallback records remain visible.",
      )
      const recoveryActions = integrationHealth.getByLabel("Provider readiness reads recovery actions")
      await expect(recoveryActions).toContainText("Wait for read result")
      await expect(recoveryActions).toContainText(
        "Keep local fallback readiness records visible while the optional Convex provider readiness query is still loading.",
      )

      await assertNoHorizontalOverflow(page)
    })
  })
}
