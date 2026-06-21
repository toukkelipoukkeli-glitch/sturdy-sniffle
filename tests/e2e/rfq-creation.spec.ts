import { expect, test, type Page } from "@playwright/test"

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
