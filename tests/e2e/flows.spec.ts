import { test, expect } from "@playwright/test";

const NEW_PRODUCT = "Pan E2E Socio";

test.describe("critical socio flows", () => {
  test("pays another socio and shows the resulting balance", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/500\s*Ŧ/)).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /^Enviar$/i }).click();
    await expect(page.getByText(/Enviar Túmin/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByPlaceholder("Ej. 9611234567").fill("9610000004");
    await expect(page.getByText(/Puede recibir Túmin/i)).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder("Ej. 15").fill("25");
    await page.getByPlaceholder("¿Por qué pagas?").fill("Pago E2E");
    await page.getByRole("button", { name: /Transferir/i }).click();

    await expect(page.getByText(/Saldo Disponible/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/475\s*Ŧ/)).toBeVisible({ timeout: 20_000 });
  });

  test("creates a product with an external image URL and lists it in the bazar", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(/Saldo Disponible/i)).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "Mis Productos" }).click();
    await expect(page.getByRole("heading", { name: /Mis Productos/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: /Nuevo/i }).click();
    await expect(page.getByText(/Nuevo Producto/i).first()).toBeVisible({
      timeout: 15_000,
    });

    const form = page.locator("form").filter({
      has: page.getByRole("button", { name: /Publicar Producto/i }),
    });

    await form.locator("input").first().fill(NEW_PRODUCT);
    await form.getByRole("spinbutton").nth(0).fill("90");
    await form.getByRole("spinbutton").nth(1).fill("10");
    await form.getByText("Alimentos", { exact: true }).click();
    await form.locator("textarea").first().fill("Pan de prueba para el harness E2E.");

    const urlInput = form.getByPlaceholder("O pega un link externo...");
    await urlInput.scrollIntoViewIfNeeded();
    await urlInput.fill("https://utfs.io/f/e2e-placeholder.png");
    await urlInput.locator("xpath=..").getByRole("button").click();

    await form.getByRole("button", { name: /Publicar Producto/i }).click();
    await expect(page.getByText(NEW_PRODUCT).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole("button", { name: "Bazar" }).first().click();
    await expect(page.getByText(/^Bazar$/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByPlaceholder("Productos...").fill(NEW_PRODUCT);
    await expect(page.getByText(NEW_PRODUCT).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
