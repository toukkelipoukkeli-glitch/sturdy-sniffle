import { expect, test, type Page } from "@playwright/test"

const operatorViewports = [
  { label: "desktop", size: { width: 1440, height: 1000 } },
  { label: "mobile", size: { width: 390, height: 900 } },
]

const processPreviews = [
  {
    buttonName: /Sheet metal/,
    editorLabel: "Sheet metal preview edit controls",
    editorStatus: "Sheet metal preview quote recalculated through the non-CNC edit registry.",
    partNumber: "SM-120-BRACKET",
  },
  {
    buttonName: /Plastic machining/,
    editorLabel: "Plastic preview edit controls",
    editorStatus: "Plastic preview quote recalculated through the non-CNC edit registry.",
    partNumber: "POM-GUIDE-042",
  },
  {
    buttonName: /Wire EDM/,
    editorLabel: "Wire EDM preview edit controls",
    editorStatus: "Wire EDM preview quote recalculated through the non-CNC edit registry.",
    partNumber: "EDM-KEY-077",
  },
  {
    buttonName: /Fabrication/,
    editorLabel: "Fabrication preview edit controls",
    editorStatus: "Fabrication preview quote recalculated through the non-CNC edit registry.",
    partNumber: "FAB-FRAME-508",
  },
]

async function assertNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
}

for (const viewport of operatorViewports) {
  test(`reviews guarded non-CNC process previews on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize(viewport.size)
    await page.goto("/")
    await page.getByRole("button", { exact: true, name: "Costing" }).click()

    const nonCncDemos = page.getByLabel("Non-CNC registry demos")
    await expect(nonCncDemos.getByLabel("Process quote preview selector")).toBeVisible()

    for (const processPreview of processPreviews) {
      await nonCncDemos.getByRole("button", { name: processPreview.buttonName }).click()
      await expect(nonCncDemos.getByLabel("Selected non-CNC quote preview")).toContainText(processPreview.partNumber)
      await expect(nonCncDemos.getByLabel(processPreview.editorLabel)).toContainText(processPreview.editorStatus)
      await expect(nonCncDemos.getByLabel("Non-CNC input edit adapter status")).toContainText("Preview controls enabled")
      await expect(nonCncDemos.getByLabel("Read-only process input draft")).toContainText("Fixture draft")
      await expect(nonCncDemos.getByLabel("Non-CNC quote path gate")).toContainText("Quote path")
      await expect(nonCncDemos.getByLabel("Non-CNC offer handoff readiness")).toContainText("Offer candidate")
      await expect(nonCncDemos.getByLabel("Non-CNC quote promotion plan")).toContainText("Promotion")
      await expect(nonCncDemos.getByLabel("Process quote operator checklist")).toContainText("Offer wiring pending")
      await assertNoHorizontalOverflow(page)
    }
  })
}
