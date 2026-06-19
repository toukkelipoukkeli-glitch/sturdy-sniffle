import { expect, test } from "@playwright/test"

test("renders the Vite starter app", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Get started" })).toBeVisible()
})
