import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * Optional concurrency suite — only runs against a real Postgres when TEST_PG_URL is set.
 * PGlite cannot demonstrate FOR UPDATE contention (single connection).
 */
const pgUrl = process.env.TEST_PG_URL;

describe.skipIf(!pgUrl)("sendTumin concurrency (real Postgres)", () => {
  it("two simultaneous transfers cannot overspend", async () => {
    // Lazy-import so unit/CI without TEST_PG_URL never loads postgres.
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const schema = await import("@/db/schema");
    const { createCallerFactory } = await import("@/lib/trpc/server");
    const { appRouter } = await import("@/trpc/routers/_app");
    const bcrypt = await import("bcryptjs");
    const { eq, sql } = await import("drizzle-orm");

    expect(pgUrl).toBeTruthy();
    if (pgUrl!.includes("neon.tech") && !process.env.ALLOW_NEON_CONCURRENCY) {
      throw new Error("Set ALLOW_NEON_CONCURRENCY=1 to run against Neon");
    }

    const client = postgres(pgUrl!, { prepare: false, max: 4 });
    const db = drizzle(client, { schema });
    const createCaller = createCallerFactory(appRouter);

    const nip = await bcrypt.hash("1234", 4);
    const senderId = `conc_s_${randomUUID().slice(0, 8)}`;
    const recipientId = `conc_r_${randomUUID().slice(0, 8)}`;

    await db.insert(schema.users).values([
      {
        id: senderId,
        name: "Conc Sender",
        phone: `555${Date.now().toString().slice(-7)}`,
        nip,
        region: "Túmin Totonacapan",
        role: "SOCIO",
        isVerified: true,
      },
      {
        id: recipientId,
        name: "Conc Recipient",
        phone: `556${Date.now().toString().slice(-7)}`,
        nip,
        region: "Túmin Totonacapan",
        role: "SOCIO",
        isVerified: true,
        productOk: true,
      },
    ]);
    await db.insert(schema.products).values({
      sellerId: recipientId,
      name: "Conc Product",
      priceMxn: 90,
      priceTumin: 10,
      categories: ["Alimentos"],
      region: "Túmin Totonacapan",
    });

    // Ensure SYSTEM exists and mint exactly 100
    const { ensureSystemUser } = await import("@/lib/system-user");
    const { issueFromSystem } = await import("@/lib/system-ledger");
    await ensureSystemUser(db);
    await issueFromSystem(db, {
      toId: senderId,
      amount: 100,
      concept: "conc seed",
      type: "BONO",
    });

    const session = {
      expires: new Date(Date.now() + 3600_000).toISOString(),
      user: {
        id: senderId,
        name: "Conc Sender",
        email: null,
        role: "SOCIO" as const,
        region: "Túmin Totonacapan",
        isVerified: true,
      },
    };

    const callerA = createCaller({
      session,
      headers: new Headers({ "x-forwarded-for": "11.0.0.1" }),
    });
    const callerB = createCaller({
      session,
      headers: new Headers({ "x-forwarded-for": "11.0.0.2" }),
    });

    const results = await Promise.allSettled([
      callerA.wallet.sendTumin({
        toId: recipientId,
        amount: 80,
        concept: "race-a",
        idempotencyKey: randomUUID(),
      }),
      callerB.wallet.sendTumin({
        toId: recipientId,
        amount: 80,
        concept: "race-b",
        idempotencyKey: randomUUID(),
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;
    expect(fulfilled).toBe(1);
    expect(rejected).toBe(1);

    const [received] = await db
      .select({ total: sql<number>`coalesce(sum(${schema.transactions.amount}),0)` })
      .from(schema.transactions)
      .where(eq(schema.transactions.toId, senderId));
    const [sent] = await db
      .select({ total: sql<number>`coalesce(sum(${schema.transactions.amount}),0)` })
      .from(schema.transactions)
      .where(eq(schema.transactions.fromId, senderId));
    const balance = Number(received?.total ?? 0) - Number(sent?.total ?? 0);
    expect(balance).toBeGreaterThanOrEqual(0);
    expect(balance).toBeLessThanOrEqual(100);

    await client.end({ timeout: 5 });
  });
});
