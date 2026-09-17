import { test as setup, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Playwright transpiles specs to CJS, so `import.meta` is unavailable here.
const authDir = path.join(__dirname, ".auth");

async function loginAs(page: Page, identifier: string) {
  await page.goto("/login");
  await expect(page.getByLabel(/Correo o Teléfono/i)).toBeVisible({ timeout: 20_000 });
  await page.getByLabel(/Correo o Teléfono/i).fill(identifier);
  await page.getByLabel(/NIP de Seguridad/i).fill("1234");
  await page.getByRole("button", { name: /^Entrar$/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
  await expect(page.getByText(/Saldo Disponible/i)).toBeVisible({ timeout: 20_000 });
}

setup("authenticate as socio", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });
  await loginAs(page, "9610000001");
  await page.context().storageState({ path: path.join(authDir, "socio.json") });
});

setup("authenticate as coordinator local", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });
  await loginAs(page, "9610000002");
  await page.context().storageState({ path: path.join(authDir, "coord-local.json") });
});

setup("authenticate as coordinator", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });
  await loginAs(page, "9610000003");
  await page.context().storageState({ path: path.join(authDir, "coord.json") });
});
