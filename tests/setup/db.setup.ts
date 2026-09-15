import { beforeAll, beforeEach, afterAll } from "vitest";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";
import { client, db } from "../helpers/test-db";
import { ensureSystemUser } from "@/lib/system-user";

if (process.env.DATABASE_URL?.includes("neon.tech")) {
  throw new Error(
    "Refuse to run integration tests against a Neon DATABASE_URL."
  );
}

function allTableNames(): string[] {
  const names: string[] = [];
  for (const value of Object.values(schema)) {
    if (is(value, PgTable)) {
      names.push(getTableName(value));
    }
  }
  return names;
}

async function truncateAll() {
  const names = allTableNames();
  if (names.length === 0) return;
  const list = names.map((n) => `"${n}"`).join(", ");
  await client.exec(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

beforeAll(async () => {
  await client.waitReady;
});

beforeEach(async () => {
  await truncateAll();
  // Runtime is PGlite via alias; Tx type is still postgres-js at compile time.
  await ensureSystemUser(db as never);
});

afterAll(async () => {
  await client.close();
});
