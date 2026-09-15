import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { client, db } from "@/db";
import * as schema from "@/db/schema";

describe("integration @/db alias", () => {
  it("resolves @/db to the PGlite test helper", () => {
    expect(client).toBeInstanceOf(PGlite);
  });

  it("still resolves @/db/schema to the real schema module", () => {
    expect(schema.users).toBeDefined();
    expect(schema.transactions).toBeDefined();
  });

  it("can query through the drizzle wrapper", async () => {
    const rows = await db.select().from(schema.users).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });
});
