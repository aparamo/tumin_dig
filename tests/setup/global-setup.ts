import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { SNAPSHOT_PATH, MIGRATIONS_FOLDER } from "../helpers/paths";

function migrationsNewerThanSnapshot(): boolean {
  if (!fs.existsSync(SNAPSHOT_PATH)) return true;
  const snapMtime = fs.statSync(SNAPSHOT_PATH).mtimeMs;
  const journal = path.join(MIGRATIONS_FOLDER, "meta/_journal.json");
  if (fs.statSync(journal).mtimeMs > snapMtime) return true;
  for (const entry of fs.readdirSync(MIGRATIONS_FOLDER)) {
    if (!entry.endsWith(".sql")) continue;
    if (fs.statSync(path.join(MIGRATIONS_FOLDER, entry)).mtimeMs > snapMtime) {
      return true;
    }
  }
  return false;
}

export default async function setup() {
  if (process.env.DATABASE_URL?.includes("neon.tech")) {
    throw new Error(
      "Refuse to run tests against a Neon DATABASE_URL. Unset DATABASE_URL for the test suite."
    );
  }

  if (!migrationsNewerThanSnapshot()) {
    console.log("[test] reusing PGlite snapshot at", SNAPSHOT_PATH);
    return;
  }

  console.log("[test] migrating fresh PGlite and writing snapshot…");
  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });

  const pg = await PGlite.create();
  const db = drizzle(pg);
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

  const dump = await pg.dumpDataDir("gzip");
  const buffer = Buffer.from(await dump.arrayBuffer());
  fs.writeFileSync(SNAPSHOT_PATH, buffer);
  await pg.close();
  console.log("[test] snapshot written:", SNAPSHOT_PATH);
}
