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

async function installFailingProviderReadBridge(page: Page) {
  await page.addInitScript(() => {
    ;(window as typeof window & {
      __FACTORYBID_WORKSPACE_CONVEX__?: {
        mutationRefs: Record<string, string>
        providerRunsByRfqQueryRef: string
        rfqIdsByLocalId: Record<string, string>
        runMutation: () => Promise<void>
        runQuery: (queryRef: unknown, args: Record<string, unknown>) => Promise<unknown>
      }
    }).__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      providerRunsByRfqQueryRef: "listProviderRunsByRfq",
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

async function installPendingProviderReadBridge(page: Page) {
  await page.addInitScript(() => {
    ;(window as typeof window & {
      __FACTORYBID_WORKSPACE_CONVEX__?: {
        mutationRefs: Record<string, string>
        providerRunsByRfqQueryRef: string
        rfqIdsByLocalId: Record<string, string>
        runMutation: () => Promise<void>
        runQuery: () => Promise<never>
      }
    }).__FACTORYBID_WORKSPACE_CONVEX__ = {
      mutationRefs: {
        recordWorkspaceActivity: "recordWorkspaceActivity",
        transitionRfqStatus: "transitionRfqStatus",
      },
      providerRunsByRfqQueryRef: "listProviderRunsByRfq",
      rfqIdsByLocalId: {
        "rfq-204": "convex-rfq-204",
      },
      runMutation: async () => {},
      runQuery: async (queryRef, args) => {
        if (queryRef !== "listProviderRunsByRfq") {
          throw new Error(`Unexpected query ref: ${String(queryRef)}`)
        }
        if (args.rfqId !== "convex-rfq-204") {
          throw new Error(`Unexpected provider read RFQ id: ${String(args.rfqId)}`)
        }
        return new Promise<never>(() => {})
      },
    }
  })
}

for (const viewport of operatorViewports) {
  test.describe(`provider-read fallback on ${viewport.label}`, () => {
    test.use({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: viewport.size,
    })

    test("surfaces provider-run read fallback diagnostics", async ({ page }) => {
      await installFailingProviderReadBridge(page)
      await page.goto("/")

      const providerReview = page.getByLabel("Provider review")
      await expect(providerReview).toContainText("Runs 2")
      await expect(providerReview).toContainText("Provider read Local fallback")
      await expect(providerReview).toContainText("Convex provider-run read failed; showing 2 local provider audits.")
      await expect(providerReview).toContainText("Convex 0 · Local 2 · Fallback 1")
      await expect(providerReview).toContainText("Read diagnostics fallback")
      await expect(providerReview).toContainText("Verify Convex provider reads")
      await expect(providerReview).toContainText("Keep local audits visible")

      const integrationHealth = page.getByLabel("Integration health")
      await expect(integrationHealth).toContainText("Provider diagnostics fallback")
      await expect(integrationHealth).toContainText(
        "Provider-run read history has 1 read record (0 Convex, 1 fallback, 0 local, 0 pending); latest read used local fallback.",
      )
      await expect(integrationHealth).toContainText("Verify Convex provider reads")
      await expect(integrationHealth).toContainText(
        "Keep local provider audit history visible until the persisted read path recovers.",
      )
      await expect(integrationHealth.getByLabel("Provider read diagnostics: fallback, warning")).toHaveAttribute(
        "data-severity",
        "warning",
      )

      await integrationHealth.getByRole("button", { name: "Copy provider diagnostics" }).click()
      await expect(integrationHealth).toContainText("Provider diagnostics copied from Integration health.")
      const copiedDiagnostics = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedDiagnostics).toContain("Provider run read history: fallback")
      expect(copiedDiagnostics).toContain("Records: total 1, convex 0, fallback 1, local 0, pending 0")
      expect(copiedDiagnostics).toContain(
        "Recovery actions: Check Convex provider-run reads before trusting local provider audit history.",
      )

      await assertNoHorizontalOverflow(page)
    })

    test("keeps provider-run read loading diagnostics visible", async ({ page }) => {
      await installPendingProviderReadBridge(page)
      await page.goto("/")

      const providerReview = page.getByLabel("Provider review")
      await expect(providerReview).toContainText("Runs 2")
      await expect(providerReview).toContainText("Provider read Checking Convex")
      await expect(providerReview).toContainText("Checking Convex for provider-run audits; 2 local audits remain visible.")
      await expect(providerReview).toContainText("Convex 0 · Local 2 · Fallback 0")
      await expect(providerReview).toContainText("Read diagnostics pending")
      await expect(providerReview).toContainText("Wait for Convex read")
      await expect(providerReview).toContainText(
        "Keep local provider audits visible while Convex provider-run reads are still pending.",
      )

      const integrationHealth = page.getByLabel("Integration health")
      await expect(integrationHealth).toContainText("Provider diagnostics pending")
      await expect(integrationHealth).toContainText(
        "Provider-run read history has 1 read record (0 Convex, 0 fallback, 0 local, 1 pending); Convex reads are still pending.",
      )
      await expect(integrationHealth).toContainText("Wait for Convex read")
      await expect(integrationHealth).toContainText(
        "Convex provider-run reads are still pending; keep local provider audits visible while the read settles.",
      )
      await expect(integrationHealth.getByLabel("Provider read diagnostics: pending, info")).toHaveAttribute(
        "data-severity",
        "info",
      )

      await integrationHealth.getByRole("button", { name: "Copy provider diagnostics" }).click()
      await expect(integrationHealth).toContainText("Provider diagnostics copied from Integration health.")
      const copiedDiagnostics = await page.evaluate(() => navigator.clipboard.readText())
      expect(copiedDiagnostics).toContain("Provider run read history: pending")
      expect(copiedDiagnostics).toContain("Records: total 1, convex 0, fallback 0, local 0, pending 1")
      expect(copiedDiagnostics).toContain("Runs: persisted 0, local 2, errors 0")
      expect(copiedDiagnostics).toContain(
        "Recovery actions: Keep local provider audits visible while Convex provider-run reads are still pending.",
      )

      await assertNoHorizontalOverflow(page)
    })
  })
}
