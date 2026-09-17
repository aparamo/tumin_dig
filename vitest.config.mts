import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Redirect every import of src/db to the PGlite test helper (covers `@/db` and relative `../../db`). */
function testDbAliasPlugin(): Plugin {
  const dbIndex = path.resolve(root, "src/db/index.ts");
  const dbDir = path.resolve(root, "src/db");
  const testDb = path.resolve(root, "tests/helpers/test-db.ts");

  function isAppDb(resolved: string): boolean {
    const normalized = resolved.replace(/\0.*/, "");
    return (
      normalized === dbIndex ||
      normalized === dbDir ||
      normalized === `${dbDir}.ts` ||
      normalized === path.join(dbDir, "index") ||
      normalized === path.join(dbDir, "index.ts")
    );
  }

  return {
    name: "tumin-test-db-alias",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (source === "@/db" || source === "@/db/index" || source === "@/db/index.ts") {
        return testDb;
      }
      if (!importer) return null;
      if (!source.startsWith(".") && !source.startsWith("/")) return null;

      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (resolved && isAppDb(path.resolve(resolved.id))) return testDb;

      const candidate = path.resolve(path.dirname(importer), source);
      if (
        isAppDb(candidate) ||
        isAppDb(`${candidate}.ts`) ||
        isAppDb(path.join(candidate, "index.ts"))
      ) {
        return testDb;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    pool: "threads",
    env: {
      DATABASE_URL: "postgresql://tumin:tumin@127.0.0.1:1/tumin_test",
      NODE_ENV: "test",
      SYSTEM_NIP_SECRET: "test-system-nip-secret",
      AUTH_SECRET: "test-auth-secret",
    },
    projects: [
      {
        extends: true,
        test: {
          name: { label: "unit", color: "green" },
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        plugins: [testDbAliasPlugin()],
        test: {
          name: { label: "integration", color: "yellow" },
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["./tests/setup/global-setup.ts"],
          setupFiles: ["./tests/setup/db.setup.ts"],
          maxWorkers: 4,
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
      {
        extends: true,
        test: {
          name: { label: "components", color: "cyan" },
          environment: "jsdom",
          include: ["tests/components/**/*.test.tsx"],
          setupFiles: ["./tests/setup/dom.setup.ts"],
        },
      },
      {
        extends: true,
        // Do NOT alias @/db here: sendTumin.race talks to real Postgres via TEST_PG_URL.
        // The PGlite swap would silently make FOR UPDATE contention impossible.
        test: {
          name: { label: "concurrency", color: "magenta" },
          environment: "node",
          include: ["tests/concurrency/**/*.test.ts"],
        },
      },
    ],
  },
});
