import { describe, expect, it } from "vitest";
import { createTestCaller } from "../helpers/caller";
import { makeUser, mint } from "../helpers/factories";

describe("stats.getMyStats / getSystemStats for socios", () => {
  it("lets a socio read system and personal indicators", async () => {
    const user = await makeUser({ role: "SOCIO", region: "Túmin Totonacapan" });
    await mint(user.id, 50);

    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });

    const system = await caller.stats.getSystemStats({ period: "all" });
    expect(system.transactions.count).toBeGreaterThanOrEqual(1);
    expect(system.breakdown.generated.total.amount).toBeGreaterThanOrEqual(50);

    const mine = await caller.stats.getMyStats({ period: "all" });
    expect(mine.bonuses.amount).toBeGreaterThanOrEqual(50);
    expect(mine.receivedFromSystem.total.amount).toBeGreaterThanOrEqual(50);
  });
});
