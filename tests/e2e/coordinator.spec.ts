import { test, expect } from "@playwright/test";

test("coordinator can open coordination screen", async ({ page }) => {
  await page.goto("/");
  const link = page.getByText(/Coordinación|Gestión|Auditoría/i).first();
  await link.click();
  await expect(
    page.getByText(/coordin|socio|verificar|congel/i).first()
  ).toBeVisible({ timeout: 20_000 });
});
