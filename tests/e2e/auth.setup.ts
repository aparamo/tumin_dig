import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authDir = path.join(import.meta.dirname, ".auth");

setup("authenticate as socio", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });
  await page.goto("/login");
  await page.getByLabel(/Correo o Teléfono/i).fill("9610000001");
  await page.getByLabel(/NIP/i).fill("1234");
  await page.getByRole("button", { name: /Entrar/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
  await expect(page).not.toHaveURL(/login/);
  await page.context().storageState({ path: path.join(authDir, "socio.json") });
});

setup("authenticate as coordinator", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/Correo o Teléfono/i).fill("9610000003");
  await page.getByLabel(/NIP/i).fill("1234");
  await page.getByRole("button", { name: /Entrar/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
  await page.context().storageState({ path: path.join(authDir, "coord.json") });
});
