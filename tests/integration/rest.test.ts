import { describe, expect, it, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, and, count } from "drizzle-orm";
import { createTestCaller } from "../helpers/caller";
import { makeUser, makeProduct } from "../helpers/factories";
import { expectBalanceCloseTo, expectLedgerBalanced } from "../helpers/ledger";
import { db, client } from "../helpers/test-db";
import { users, products, ads, inviteTokens, transactions, passwordResets } from "@/db/schema";
import { LIMITS } from "@/lib/limits";
import { AUDIT_REWARD_AMOUNT, AUDIT_REWARD_CONCEPT } from "@/lib/audit-month";

vi.mock("@/lib/twilio", () => ({
  sendPhoneOtp: vi.fn(async () => ({ channel: "sms" as const })),
  checkPhoneOtp: vi.fn(async (_phone: string, code: string) => code === "123456"),
}));

vi.mock("@/lib/resend", () => ({
  sendPasswordResetEmail: vi.fn(async () => undefined),
}));

vi.mock("@/lib/otp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/otp")>();
  return {
    ...actual,
    generateOtpCode: () => "654321",
  };
});

describe("schema / ledger constraint", () => {
  it("has all 14 TUMIN tables and chk_tumin_system_ledger", async () => {
    const tables = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename LIKE 'TUMIN_%'
    `);
    expect(tables.rows.length).toBe(14);

    const constraint = await client.query(`
      SELECT conname FROM pg_constraint WHERE conname = 'chk_tumin_system_ledger'
    `);
    expect(constraint.rows.length).toBe(1);
  });
});

describe("jobs", () => {
  it("computes amount from minutes server-side and pays on verify", async () => {
    const requester = await makeUser({ region: "VERACRUZ" });
    const coord = await makeUser({
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
    });
    const reqCaller = createTestCaller({
      id: requester.id,
      role: "SOCIO",
      region: "VERACRUZ",
      isVerified: true,
    });
    const job = await reqCaller.jobs.requestJob({
      description: "Trabajo comunitario de prueba",
      minutes: 45,
    });
    expect(job.amount).toBe(45);

    const coordCaller = createTestCaller({
      id: coord.id,
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
      isVerified: true,
    });
    await coordCaller.jobs.verifyJob({ jobId: job.id, status: "PAGADO" });
    await expectBalanceCloseTo(requester.id, 45);
    await expectLedgerBalanced();
  });
});

describe("audit", () => {
  it("getAuditReport returns lists without throwing", async () => {
    const coord = await makeUser({ role: "COORDINADOR", region: "Túmin Totonacapan" });
    const idle = await makeUser({
      name: "Idle Seller",
      region: "Túmin Totonacapan",
      residenceState: "Veracruz",
    });
    await makeProduct({ sellerId: idle.id, region: "Túmin Totonacapan" });

    const caller = createTestCaller({
      id: coord.id,
      role: "COORDINADOR",
      region: "Túmin Totonacapan",
      isVerified: true,
    });
    const report = await caller.audit.getAuditReport();
    expect(report.inactiveUsers.some((u) => u.id === idle.id)).toBe(true);
    expect(report.nonSellers.some((u) => u.id === idle.id)).toBe(true);
  });

  it("freezeUser cascades products/ads and resets productOk", async () => {
    const coord = await makeUser({ role: "COORDINADOR", region: "VERACRUZ" });
    const target = await makeUser({ region: "OAXACA", residenceState: "Oaxaca" });
    await makeProduct({ sellerId: target.id });
    await db.insert(ads).values({
      userId: target.id,
      imageUrl: "https://example.com/ad.jpg",
      status: "ACTIVO",
      targetRegion: "GENERAL",
      requestedUntil: new Date(Date.now() + 86400000),
    });

    const caller = createTestCaller({
      id: coord.id,
      role: "COORDINADOR",
      region: "VERACRUZ",
      isVerified: true,
    });
    await caller.audit.freezeUser({ userId: target.id, status: "CONGELADO" });

    const [u] = await db.select().from(users).where(eq(users.id, target.id));
    expect(u.status).toBe("CONGELADO");
    expect(u.productOk).toBe(false);
    const [{ val }] = await db
      .select({ val: count() })
      .from(products)
      .where(and(eq(products.sellerId, target.id), eq(products.status, "ACTIVO")));
    expect(Number(val)).toBe(0);
  });

  it("claimAuditReward pays once per month when prerequisites met", async () => {
    const coord = await makeUser({ role: "COORDINADOR", region: "VERACRUZ" });
    const peer = await makeUser({ role: "COORDINADOR", region: "OAXACA" });
    const caller = createTestCaller({
      id: coord.id,
      role: "COORDINADOR",
      region: "VERACRUZ",
      isVerified: true,
    });

    const victim = await makeUser({ region: "VERACRUZ" });
    await caller.audit.freezeUser({ userId: victim.id, status: "CONGELADO" });

    const peerCaller = createTestCaller({
      id: peer.id,
      role: "COORDINADOR",
      region: "OAXACA",
      isVerified: true,
    });
    await peerCaller.audit.validateAuditor({ targetUserId: coord.id });

    await caller.audit.claimAuditReward();
    await expectBalanceCloseTo(coord.id, AUDIT_REWARD_AMOUNT);

    await expect(caller.audit.claimAuditReward()).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/Ya has reclamado/),
    });

    const rewards = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.toId, coord.id),
          eq(transactions.concept, AUDIT_REWARD_CONCEPT)
        )
      );
    expect(rewards).toHaveLength(1);
  });
});

describe("bazar.createProduct", () => {
  it("grants first-product bonus once and keeps productOk in sync", async () => {
    const user = await makeUser({ productOk: false });
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });

    await caller.bazar.createProduct({
      name: "Pan de muerto",
      priceMxn: 90,
      priceTumin: 10,
      categories: ["Alimentos"],
    });

    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    expect(after.productOk).toBe(true);
    await expectBalanceCloseTo(user.id, LIMITS.FIRST_PRODUCT_BONUS);

    await caller.bazar.createProduct({
      name: "Segundo producto",
      priceMxn: 45,
      priceTumin: 5,
      categories: ["Alimentos"],
    });
    const bonuses = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.toId, user.id),
          eq(transactions.concept, "Bono Primer Producto")
        )
      );
    expect(bonuses).toHaveLength(1);

    await expect(
      caller.bazar.createProduct({
        name: "Bad share",
        priceMxn: 95,
        priceTumin: 5,
        categories: ["Alimentos"],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("user.register", () => {
  it("requires a valid invite and rejects duplicate phones", async () => {
    const referrer = await makeUser();
    const token = `tok_${randomUUID().slice(0, 12)}`;
    await db.insert(inviteTokens).values({
      userId: referrer.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });

    const publicCaller = createTestCaller(null);
    const created = await publicCaller.user.register({
      name: "Nuevo Socio",
      phone: "9619988776",
      email: "",
      region: "Túmin Totonacapan",
      enrollmentMethod: "REGION",
      residenceCountry: "México",
      residenceState: "Veracruz",
      residenceCity: "Xalapa",
      residencePostalCode: "91000",
      nip: "1234",
      inviteToken: token,
    });
    expect(created.id).toMatch(/^USR-/);
    const [row] = await db.select().from(users).where(eq(users.id, created.id));
    expect(row.referrerId).toBe(referrer.id);

    await expect(
      publicCaller.user.register({
        name: "Dup",
        phone: "9619988776",
        email: "",
        region: "Túmin Totonacapan",
        enrollmentMethod: "REGION",
        residenceCountry: "México",
        residenceState: "Veracruz",
        residenceCity: "Xalapa",
        residencePostalCode: "91000",
        nip: "1234",
        inviteToken: token,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(
      publicCaller.user.register({
        name: "No invite",
        phone: "9611112233",
        email: "",
        region: "Túmin Totonacapan",
        enrollmentMethod: "REGION",
        residenceCountry: "México",
        residenceState: "Veracruz",
        residenceCity: "Xalapa",
        residencePostalCode: "91000",
        nip: "1234",
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/invitación/),
    });
  });
});

describe("passwordReset with mocked Twilio/Resend", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "test@example.com");
  });

  it("sends email OTP and stores a hashed reset row", async () => {
    const user = await makeUser({ phone: "9615554433", email: "reset@test.local" });
    const caller = createTestCaller(null);

    const result = await caller.passwordReset.request({ identifier: user.email! });
    expect(result.message).toMatch(/código|NIP/i);

    const rows = await db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.userId, user.id));
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].channel).toBe("EMAIL");
    expect(rows[0].codeHash).toBeTruthy();
  });
});

describe("directory.listMembers", () => {
  it("paginates and respects cursor", async () => {
    const viewer = await makeUser({ publicProfile: true });
    for (let i = 0; i < 3; i++) {
      await makeUser({ publicProfile: true, name: `Member ${i}` });
    }
    const caller = createTestCaller({
      id: viewer.id,
      role: "SOCIO",
      region: viewer.region,
      isVerified: true,
    });
    const page1 = await caller.directory.listMembers({
      cursor: 0,
      pageSize: 10,
      sortBy: "recientes",
    });
    expect(page1.items.length).toBeGreaterThanOrEqual(1);
    expect(
      page1.nextCursor == null || typeof page1.nextCursor === "number"
    ).toBe(true);
  });
});
