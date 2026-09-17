import { test, expect } from "@playwright/test";

test("coordinator freezes a socio and their product leaves the bazar", async ({ page }) => {
  await page.goto("/auditoria");
  await expect(page.getByText(/Auditoría Regional/i).first()).toBeVisible({
    timeout: 20_000,
  });

  await expect(page.getByText("E2E Freeze Target").first()).toBeVisible({ timeout: 20_000 });
  await page
    .locator("[data-slot=card]")
    .filter({ hasText: "E2E Freeze Target" })
    .getByRole("button", { name: /Congelar/i })
    .first()
    .click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Congelar cuenta/i)).toBeVisible();
  await dialog.getByRole("button", { name: /^Congelar$/i }).click();

  await expect(
    page.locator("[data-slot=card]").filter({ hasText: "E2E Freeze Target" }).filter({
      hasText: /Congelado/i,
    })
  ).toBeVisible({ timeout: 20_000 });

  await page.goto("/");
  await expect(page.getByText(/Saldo Disponible/i)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Bazar" }).first().click();
  await expect(page.getByText(/^Bazar$/i).first()).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder("Productos...").fill("Producto Congelar E2E");
  await expect(page.getByText(/No hay productos disponibles/i)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Producto Congelar E2E")).toHaveCount(0);
});
