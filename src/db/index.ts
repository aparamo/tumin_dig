import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/env";

// Disable prefetch as it is not supported for "Transaction" mode
export const client = postgres(env.DATABASE_URL, {
  prepare: false,
  max: env.DATABASE_MAX_CONNECTIONS ?? 10,
});
export const db = drizzle(client, { schema });
