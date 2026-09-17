import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MINING_TIMEZONE,
  addDaysToCivilDate,
  civilDateInZone,
  evaluateMiningClaim,
  miningIdempotencyKey,
  nextMidnightInZone,
  rewardForStreak,
} from "@/lib/mining-day";

/** Build a Date from Mexico civil wall-clock (CST = UTC−6). */
function mexicoLocal(y: number, m: number, d: number, h: number, min: number, s = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, h + 6, min, s));
}

describe("civilDateInZone / America/Mexico_City", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(civilDateInZone(mexicoLocal(2026, 9, 2, 15, 23, 57))).toBe("2026-09-02");
  });

  it("keeps same Mexico day across UTC midnight (17:00 and 19:00 Mexico)", () => {
    const beforeUtcMidnight = mexicoLocal(2026, 9, 2, 17, 0, 0); // 23:00 UTC
    const afterUtcMidnight = mexicoLocal(2026, 9, 2, 19, 0, 0); // 01:00 UTC next day
    expect(civilDateInZone(beforeUtcMidnight)).toBe("2026-09-02");
    expect(civilDateInZone(afterUtcMidnight)).toBe("2026-09-02");
  });

  it("rolls to next Mexico day after 00:00", () => {
    expect(civilDateInZone(mexicoLocal(2026, 9, 2, 23, 50, 0))).toBe("2026-09-02");
    expect(civilDateInZone(mexicoLocal(2026, 9, 3, 1, 0, 0))).toBe("2026-09-03");
  });
});

describe("addDaysToCivilDate", () => {
  it("adds and subtracts calendar days", () => {
    expect(addDaysToCivilDate("2026-09-02", 1)).toBe("2026-09-03");
    expect(addDaysToCivilDate("2026-09-02", -1)).toBe("2026-09-01");
    expect(addDaysToCivilDate("2026-01-31", 1)).toBe("2026-02-01");
  });
});

describe("nextMidnightInZone", () => {
  it("returns next Mexico midnight as a UTC instant", () => {
    const at = mexicoLocal(2026, 9, 2, 15, 0, 0);
    const next = nextMidnightInZone(at);
    expect(civilDateInZone(next)).toBe("2026-09-03");
    expect(next.toISOString()).toBe("2026-09-03T06:00:00.000Z");
  });
});

describe("rewardForStreak", () => {
  it("matches the abundance ladder", () => {
    expect(rewardForStreak(1)).toBe(1);
    expect(rewardForStreak(2)).toBe(1);
    expect(rewardForStreak(3)).toBe(3);
    expect(rewardForStreak(6)).toBe(3);
    expect(rewardForStreak(7)).toBe(5);
    expect(rewardForStreak(14)).toBe(5);
    expect(rewardForStreak(15)).toBe(7);
    expect(rewardForStreak(29)).toBe(7);
    expect(rewardForStreak(30)).toBe(10);
  });
});

describe("miningIdempotencyKey", () => {
  it("is stable per user and civil day", () => {
    expect(miningIdempotencyKey("u1", "2026-09-02")).toBe("minado:u1:2026-09-02");
  });
});

describe("evaluateMiningClaim", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks without an active product", () => {
    vi.setSystemTime(mexicoLocal(2026, 9, 2, 12, 0, 0));
    const r = evaluateMiningClaim({ last: null, hasActiveProduct: false });
    expect(r.canMine).toBe(false);
    expect(r.reason).toBe("NO_PRODUCT");
  });

  it("allows first claim of the day", () => {
    vi.setSystemTime(mexicoLocal(2026, 9, 2, 12, 0, 0));
    const r = evaluateMiningClaim({ last: null, hasActiveProduct: true });
    expect(r.canMine).toBe(true);
    expect(r.reason).toBe("OK");
    expect(r.today).toBe("2026-09-02");
    expect(r.nextStreak).toBe(1);
    expect(r.nextReward).toBe(1);
    expect(r.displayStreak).toBe(0);
  });

  it("regression: 15:23 and 23:39 same Mexico day → already mined", () => {
    const first = mexicoLocal(2026, 9, 2, 15, 23, 57);
    const second = mexicoLocal(2026, 9, 2, 23, 39, 45);
    expect(civilDateInZone(first)).toBe(civilDateInZone(second));

    vi.setSystemTime(second);
    const r = evaluateMiningClaim({
      last: { minedOn: civilDateInZone(first), streak: 1 },
      hasActiveProduct: true,
    });
    expect(r.alreadyMinedToday).toBe(true);
    expect(r.canMine).toBe(false);
    expect(r.reason).toBe("ALREADY_MINED");
    expect(r.displayStreak).toBe(1);
  });

  it("allows 23:50 then 01:00 next day with streak +1", () => {
    vi.setSystemTime(mexicoLocal(2026, 9, 3, 1, 0, 0));
    const r = evaluateMiningClaim({
      last: { minedOn: "2026-09-02", streak: 1 },
      hasActiveProduct: true,
    });
    expect(r.canMine).toBe(true);
    expect(r.today).toBe("2026-09-03");
    expect(r.nextStreak).toBe(2);
    expect(r.nextReward).toBe(1);
    expect(r.displayStreak).toBe(1);
  });

  it("resets streak after a skipped day", () => {
    vi.setSystemTime(mexicoLocal(2026, 9, 4, 10, 0, 0));
    const r = evaluateMiningClaim({
      last: { minedOn: "2026-09-02", streak: 5 },
      hasActiveProduct: true,
    });
    expect(r.canMine).toBe(true);
    expect(r.nextStreak).toBe(1);
    expect(r.displayStreak).toBe(0);
  });

  it("exposes America/Mexico_City timezone", () => {
    vi.setSystemTime(mexicoLocal(2026, 9, 2, 12, 0, 0));
    expect(evaluateMiningClaim({ last: null, hasActiveProduct: true }).timezone).toBe(
      MINING_TIMEZONE
    );
  });
});
