import { expect, test, type Page } from "@playwright/test"

const operatorViewports = [
  { label: "desktop", size: { width: 1440, height: 1000 } },
  { label: "mobile", size: { width: 390, height: 900 } },
]

async function openCreateRfqDialog(page: Page) {
  await page.goto("/")
  await page.getByLabel("RFQ queue").getByRole("button", { name: "New RFQ" }).click()
  const dialog = page.getByRole("dialog", { name: "Create RFQ" })
  await expect(dialog).toBeVisible()
  return dialog
}

test("creates a manual RFQ and surfaces it in the queue", async ({ page }) => {
  await page.goto("/")
  const queue = page.getByLabel("RFQ queue")

  await queue.getByRole("button", { name: "New RFQ" }).click()
  const dialog = page.getByRole("dialog", { name: "Create RFQ" })
  await expect(dialog).toBeVisible()

  // Create is disabled until the required fields are filled.
  await expect(dialog.getByRole("button", { name: "Create RFQ" })).toBeDisabled()
  await dialog.getByLabel(/Customer/).fill("Helsinki Robotics")
  await dialog.getByLabel(/Part number/).fill("HR-900")
  await dialog.getByLabel("Subject").fill("Gripper mount")
  await dialog.getByLabel("Material").selectOption({ label: "Stainless steel 316L" })
  await dialog.getByLabel("Quantity").fill("12")

  await dialog.getByRole("button", { name: "Create RFQ" }).click()
  await expect(page.getByRole("dialog", { name: "Create RFQ" })).toHaveCount(0)

  // The new RFQ appears in the queue and becomes the selected item in triage.
  await expect(queue.getByRole("button", { name: /Helsinki Robotics/ })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Gripper mount" })).toBeVisible()
  await expect(page.getByText(/MANUAL.*Just now/)).toBeVisible()
  await expect(page.getByLabel("RFQ intake readiness")).toBeVisible()

  await page.waitForFunction(() => {
    try {
      return window.localStorage.getItem("factorybid.workspace.v1")?.includes("Helsinki Robotics")
    } catch {
      return false
    }
  })
  await page.reload()
  await expect(queue.getByRole("button", { name: /Helsinki Robotics/ })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Gripper mount" })).toBeVisible()
})

for (const viewport of operatorViewports) {
  test(`blocks manual RFQ creation without a valid due date and recovers on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize(viewport.size)
    const dialog = await openCreateRfqDialog(page)

    await dialog.getByLabel(/Customer/).fill("Oulu Automation")
    await dialog.getByLabel(/Part number/).fill("OA-18")
    await dialog.getByLabel("Subject").fill("Sensor rail pilot batch")
    await dialog.getByLabel("Due date").fill("")
    await expect(dialog.getByRole("button", { name: "Create RFQ" })).toBeDisabled()

    await dialog.getByLabel("Due date").fill("2026-07-15")
    await expect(dialog.getByRole("button", { name: "Create RFQ" })).toBeEnabled()
    await dialog.getByRole("button", { name: "Create RFQ" }).click()

    await expect(page.getByRole("dialog", { name: "Create RFQ" })).toHaveCount(0)
    await expect(page.getByLabel("RFQ queue").getByRole("button", { name: /Oulu Automation/ })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Sensor rail pilot batch" })).toBeVisible()
    await expect(page.getByLabel("Selected RFQ")).toContainText("MANUAL")
    await expect(page.getByLabel("RFQ calendar plan preview")).toContainText("Quote work: Sensor rail pilot batch")
    await expect(page.getByLabel("RFQ calendar plan preview")).toContainText("Quote due: Sensor rail pilot batch")
    await expect(page.getByLabel("RFQ calendar plan preview")).toContainText("OA-18 qty 1")
    await expect(page.getByLabel("RFQ intake readiness")).toContainText("Needs review")
    await expect(page.getByLabel("RFQ intake readiness")).toContainText("Blockers 0")
    await expect(page.getByLabel("RFQ intake readiness")).toContainText("No CAD model or drawing is attached.")

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHorizontalOverflow).toBe(false)
  })

  test(`creates a manual RFQ and exposes offer copy controls on ${viewport.label}`, async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.setViewportSize(viewport.size)
    await page.goto("/")
    const queue = page.getByLabel("RFQ queue")

    await queue.getByRole("button", { name: "New RFQ" }).click()
    const dialog = page.getByRole("dialog", { name: "Create RFQ" })
    await dialog.getByLabel(/Customer/).fill("Vaasa Pumps")
    await dialog.getByLabel(/Part number/).fill("VP-42")
    await dialog.getByLabel("Subject").fill("Seal inspection cover")
    await dialog.getByLabel("Material").selectOption({ label: "Aluminum 6082" })
    await dialog.getByLabel("Quantity").fill("24")
    await dialog.getByRole("button", { name: "Create RFQ" }).click()

    const createdRfq = queue.getByRole("button", { name: /Vaasa Pumps/ })
    await expect(createdRfq).toBeVisible()
    await createdRfq.click()
    await expect(page.getByRole("heading", { name: "Seal inspection cover" })).toBeVisible()
    await expect(page.getByLabel("Selected RFQ")).toContainText("MANUAL")

    await page.getByRole("button", { exact: true, name: "Offer" }).click()
    await expect(page.getByRole("heading", { name: "Offer draft" })).toBeVisible()
    await expect(page.getByLabel("Plain text offer")).toHaveValue(/Vaasa Pumps/)
    await expect(page.getByLabel("Plain text offer")).toHaveValue(/Seal inspection cover/)

    const exportActions = page.getByLabel("Offer export actions")
    await expect(exportActions.getByRole("button", { name: "Copy text" })).toBeVisible()
    await expect(exportActions.getByRole("button", { name: "Download .txt" })).toBeVisible()
    await expect(exportActions.getByRole("button", { name: "Download PDF" })).toBeVisible()
    await exportActions.getByRole("button", { name: "Copy text" }).click()
    await expect(exportActions.getByRole("button", { name: "Copied" })).toBeVisible()
    await expect(exportActions).toContainText("Offer text copied to the clipboard.")
    const copiedOffer = await page.evaluate(() => navigator.clipboard.readText())
    expect(copiedOffer).toContain("Vaasa Pumps")
    expect(copiedOffer).toContain("Seal inspection cover")
    await expect(page.getByLabel("Offer export history")).toContainText(/Copied OFFER-[A-Z0-9-]+ plain text\./)

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHorizontalOverflow).toBe(false)
  })
}

test("edits selected RFQ intake fields inline", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { exact: true, name: "Triage" }).click()

  const editor = page.getByLabel("Editable RFQ fields")
  await expect(editor).toBeVisible()
  await expect(editor.getByText("GMAIL 96%").first()).toBeVisible()

  await editor.getByLabel("RFQ subject").fill("CNC bracket FB-204-B")
  await expect(page.getByRole("heading", { name: "CNC bracket FB-204-B" })).toBeVisible()
  await expect(page.getByLabel("RFQ queue").getByRole("button", { name: /CNC bracket FB-204-B/ })).toBeVisible()

  await editor.getByLabel("RFQ process").selectOption("cnc_turning")
  await editor.getByLabel("RFQ material").selectOption("aluminum_7075")
  await expect(page.getByLabel("RFQ tags")).toContainText("CNC turning")
  await expect(page.getByLabel("RFQ tags")).toContainText("Aluminum 7075")

  await editor.getByLabel("RFQ tolerance").fill("ISO 2768-F")
  await expect(page.getByLabel("RFQ tags")).toContainText("ISO 2768-F")

  await editor.getByLabel("RFQ customer").fill("")
  await expect(page.getByLabel("RFQ intake readiness")).toContainText("Customer name is missing")
  await editor.getByLabel("RFQ customer").fill("North Forge Works")
  await expect(page.getByLabel("RFQ intake readiness")).not.toContainText("Customer name is missing")

  await editor.getByLabel("RFQ due date").fill("2026-06-18")
  await expect(page.getByLabel("RFQ intake readiness")).toContainText("Buyer due date is already in the past.")
})

test("closes the manual RFQ dialog with Escape", async ({ page }) => {
  await openCreateRfqDialog(page)

  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Create RFQ" })).toHaveCount(0)
})

test("closes the manual RFQ dialog from the backdrop", async ({ page }) => {
  await openCreateRfqDialog(page)

  await page.locator(".rfq-dialog-backdrop").click({ position: { x: 4, y: 4 } })
  await expect(page.getByRole("dialog", { name: "Create RFQ" })).toHaveCount(0)
})
