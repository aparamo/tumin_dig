import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";
import { SNAPSHOT_PATH } from "./paths";

if (!fs.existsSync(SNAPSHOT_PATH)) {
  throw new Error(
    `PGlite snapshot missing at ${SNAPSHOT_PATH}. Did globalSetup run?`
  );
}

const dump = fs.readFileSync(SNAPSHOT_PATH);
const client = await PGlite.create({
  loadDataDir: new Blob([dump]),
});

export const db = drizzle(client, { schema });
/** Exposed for teardown / raw SQL in tests */
export { client };
