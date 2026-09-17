import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestCaller } from "../helpers/caller";
import { makeUser, makeProduct } from "../helpers/factories";
import { expectBalanceCloseTo, expectLedgerBalanced } from "../helpers/ledger";
import { db } from "../helpers/test-db";
import { dailyMining, transactions } from "@/db/schema";
import { civilDateInZone } from "@/lib/mining-day";

/** Mexico CST wall-clock → UTC Date (CST = UTC−6). */
function mexicoLocal(y: number, m: number, d: number, h: number, min: number, s = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, h + 6, min, s));
}

describe("mining", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("requires an active product", async () => {
    vi.setSystemTime(mexicoLocal(2026, 9, 2, 12, 0, 0));
    const user = await makeUser();
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });
    await expect(caller.mining.claimMining()).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const status = await caller.mining.getMiningStatus();
    expect(status.canMine).toBe(false);
    expect(status.reason).toBe("NO_PRODUCT");
  });

  it("allows one claim per Mexico civil day and updates status", async () => {
    vi.setSystemTime(mexicoLocal(2026, 9, 2, 12, 0, 0));
    const user = await makeUser();
    await makeProduct({ sellerId: user.id });
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });

    const first = await caller.mining.claimMining();
    expect(first.reward).toBe(1);
    expect(first.streak).toBe(1);

    const status = await caller.mining.getMiningStatus();
    expect(status.canMine).toBe(false);
    expect(status.reason).toBe("ALREADY_MINED");
    expect(status.displayStreak).toBe(1);

    await expect(caller.mining.claimMining()).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/Ya has minado/),
    });
    await expectBalanceCloseTo(user.id, 1);
    await expectLedgerBalanced();
  });

  it("regression: 15:23 then 23:39 same Mexico day rejects second claim", async () => {
    const user = await makeUser();
    await makeProduct({ sellerId: user.id });
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });

    vi.setSystemTime(mexicoLocal(2026, 9, 2, 15, 23, 57));
    const first = await caller.mining.claimMining();
    expect(first.streak).toBe(1);

    vi.setSystemTime(mexicoLocal(2026, 9, 2, 23, 39, 45));
    expect(civilDateInZone(new Date())).toBe("2026-09-02");
    await expect(caller.mining.claimMining()).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/Ya has minado/),
    });

    await expectBalanceCloseTo(user.id, 1);
    const mined = await db
      .select()
      .from(transactions)
      .where(eq(transactions.toId, user.id));
    expect(mined.filter((t) => t.type === "MINADO")).toHaveLength(1);
    await expectLedgerBalanced();
  });

  it("allows 23:50 then 01:00 next day with streak 2", async () => {
    const user = await makeUser();
    await makeProduct({ sellerId: user.id });
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });

    vi.setSystemTime(mexicoLocal(2026, 9, 2, 23, 50, 0));
    const first = await caller.mining.claimMining();
    expect(first.streak).toBe(1);

    vi.setSystemTime(mexicoLocal(2026, 9, 3, 1, 0, 0));
    const second = await caller.mining.claimMining();
    expect(second.streak).toBe(2);
    expect(second.reward).toBe(1);
    await expectBalanceCloseTo(user.id, 2);
    await expectLedgerBalanced();
  });

  it("resets streak after skipping a civil day", async () => {
    const user = await makeUser();
    await makeProduct({ sellerId: user.id });
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });

    vi.setSystemTime(mexicoLocal(2026, 9, 2, 12, 0, 0));
    await caller.mining.claimMining();

    vi.setSystemTime(mexicoLocal(2026, 9, 4, 12, 0, 0));
    const next = await caller.mining.claimMining();
    expect(next.streak).toBe(1);
    await expectLedgerBalanced();
  });

  it("enforces UNIQUE(user_id, mined_on) at the database", async () => {
    vi.setSystemTime(mexicoLocal(2026, 9, 2, 12, 0, 0));
    const user = await makeUser();
    await makeProduct({ sellerId: user.id });
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });
    await caller.mining.claimMining();

    await expect(
      db.insert(dailyMining).values({
        userId: user.id,
        claimedAt: new Date(),
        minedOn: "2026-09-02",
        streak: 99,
        amount: 1,
      })
    ).rejects.toSatisfy((err: unknown): boolean => {
      if (!err || typeof err !== "object") return false;
      const cause = "cause" in err ? (err as { cause: unknown }).cause : null;
      if (
        cause &&
        typeof cause === "object" &&
        "code" in cause &&
        (cause as { code: string }).code === "23505"
      ) {
        return true;
      }
      return "code" in err && (err as { code: string }).code === "23505";
    });
  });
});
