import { describe, expect, it } from "vitest";
import { periodWindow } from "@/lib/stats-periods";

describe("periodWindow", () => {
  it("returns null bounds for all-time", () => {
    const w = periodWindow("all");
    expect(w.from).toBeNull();
    expect(w.to).toBeNull();
    expect(w.label).toBe("Todo");
  });

  it("day window is 24h in Mexico City", () => {
    // 2026-04-18 15:00 UTC = 09:00 Mexico City
    const now = new Date("2026-04-18T15:00:00.000Z");
    const w = periodWindow("day", now);
    expect(w.from?.toISOString()).toBe("2026-04-18T06:00:00.000Z");
    expect(w.to?.toISOString()).toBe("2026-04-19T06:00:00.000Z");
  });

  it("week starts Monday Mexico City", () => {
    // Saturday 2026-04-18
    const now = new Date("2026-04-18T15:00:00.000Z");
    const w = periodWindow("week", now);
    expect(w.from?.toISOString()).toBe("2026-04-13T06:00:00.000Z"); // Monday
    expect(w.to?.toISOString()).toBe("2026-04-20T06:00:00.000Z");
  });
});
