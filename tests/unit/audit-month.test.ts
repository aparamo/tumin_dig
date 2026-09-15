import { describe, expect, it } from "vitest";
import { getCurrentMonthRange, AUDIT_REWARD_AMOUNT } from "@/lib/audit-month";

describe("getCurrentMonthRange", () => {
  it("returns inclusive start and exclusive end for mid-month", () => {
    const { start, end } = getCurrentMonthRange(new Date(2026, 8, 15, 12, 0, 0));
    expect(start).toEqual(new Date(2026, 8, 1, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 9, 1, 0, 0, 0, 0));
  });

  it("rolls December into January of next year", () => {
    const { start, end } = getCurrentMonthRange(new Date(2026, 11, 31, 23, 59, 59));
    expect(start).toEqual(new Date(2026, 11, 1, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2027, 0, 1, 0, 0, 0, 0));
  });

  it("handles leap-year February", () => {
    const { start, end } = getCurrentMonthRange(new Date(2024, 1, 29));
    expect(start).toEqual(new Date(2024, 1, 1, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2024, 2, 1, 0, 0, 0, 0));
  });

  it("exports audit reward amount of 30", () => {
    expect(AUDIT_REWARD_AMOUNT).toBe(30);
  });
});
