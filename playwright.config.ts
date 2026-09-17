import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Keep browsers inside the repo so sandbox/CI cache rotations do not break launches.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(__dirname, ".playwright-browsers");

const PORT = 3100;
const DB_PORT = 5433;
const baseURL = `http://localhost:${PORT}`;

if (process.env.DATABASE_URL?.includes("neon.tech")) {
  throw new Error("Refuse to run E2E against a Neon DATABASE_URL.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join("tests/e2e/.auth/socio.json"),
      },
      dependencies: ["setup"],
      testMatch: /flows\.spec\.ts/,
    },
    {
      name: "chromium-coord",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join("tests/e2e/.auth/coord.json"),
      },
      dependencies: ["setup"],
      testMatch: /coordinator\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: "bun run scripts/test-db-server.ts",
      port: DB_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        TEST_DB_PORT: String(DB_PORT),
        TEST_DB_MAX_CONNECTIONS: "20",
        NODE_ENV: "test",
      },
    },
    {
      command: `bun run dev -- --port ${PORT}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`,
        DATABASE_MAX_CONNECTIONS: "5",
        AUTH_SECRET: "e2e-auth-secret-not-for-production",
        AUTH_TRUST_HOST: "true",
        AUTH_URL: baseURL,
        SYSTEM_NIP_SECRET: "e2e-system-nip-secret",
        NODE_ENV: "development",
      },
    },
  ],
});
