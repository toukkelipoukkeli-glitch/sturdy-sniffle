import { expect, test } from "@playwright/test"

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
})
