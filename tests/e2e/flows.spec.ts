import { test, expect } from "@playwright/test";

test.describe("critical flows", () => {
  test("home loads for authenticated socio", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Túmin|saldo|balance|inicio/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("can open pagar screen", async ({ page }) => {
    await page.goto("/");
    const pagar = page.getByRole("button", { name: /Pagar|Enviar/i }).first();
    if (await pagar.isVisible().catch(() => false)) {
      await pagar.click();
    } else {
      // Fallback: navigate via store screen link text
      await page.getByText(/Pagar|Enviar Túmin/i).first().click();
    }
    await expect(page.getByText(/enviar|destinatario|monto/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("bazar lists seeded product", async ({ page }) => {
    await page.goto("/");
    const bazar = page.getByText(/^Bazar$/i).first();
    await bazar.click();
    await expect(page.getByText(/Producto E2E/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
